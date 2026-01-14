// File: Schedule/src/main/java/graduation/project/schedule/service/ScheduleGeneratorService.java
package graduation.project.schedule.service;

import graduation.project.USER.models.user.UserProfile;
import graduation.project.USER.repo.UserRepo;
import graduation.project.model.Items.Prerequisites;
import graduation.project.model.course.CourseEntity;
import graduation.project.schedule.domain.enums.CompactnessPreference;
import graduation.project.schedule.domain.enums.DifficultyTarget;
import graduation.project.schedule.domain.enums.ScheduleDay;
import graduation.project.schedule.domain.enums.Semester;
import graduation.project.schedule.dto.*;
import graduation.project.schedule.dto.explenations.*;
import graduation.project.schedule.entity.PreferredScheduleTemplateEntity;
import graduation.project.schedule.entity.TermCourseOfferingEntity;
import graduation.project.schedule.repo.PreferredScheduleTemplateRepository;
import graduation.project.schedule.repo.TermCourseOfferingRepository;
import graduation.project.schedule.repo.UserCompletedCourseRepository;
import graduation.project.schedule.util.CurrentUserService;
import graduation.project.schedule.util.OfferingSlots;
import graduation.project.schedule.util.TimeRanges;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScheduleGeneratorService {

    private static final int MAX_ELECTIVE_COURSES_LIFETIME = 3;
    private static final int MAX_ELECTIVE_CREDIT_HOURS_LIFETIME = 9;

    // Beam-search fallback knobs (only used if greedy can't meet semester minimum)
    private static final int BEAM_WIDTH = 12;
    private static final int TOP_OFFERINGS_PER_COURSE = 2;

    // Explain mode caps (avoid huge payloads)
    private static final int MAX_SKIP_REASONS = 220;

    // Deterministic tie-break epsilon
    private static final double SCORE_EPS = 1e-9;

    // Training-hours eligibility rules (by COURSE ID)
    private static final long COURSE_SEMINAR_ID = 30L;          // requires 40 hours
    private static final long COURSE_ER1_ID = 31L;              // requires 90 hours
    private static final long COURSE_ER2_ID = 32L;              // requires 90 hours
    private static final long COURSE_ER3_ID = 33L;              // requires 90 hours
    private static final long COURSE_INTERNSHIP_CERT_ID = 34L;  // requires 90 hours

    private final CurrentUserService currentUserService;
    private final UserCompletedCourseRepository completedCourseRepository;
    private final TermCourseOfferingRepository offeringRepository;
    private final PreferredScheduleTemplateRepository templateRepository;

    // ✅ Added: read completedHours from UserProfile
    private final UserRepo userProfileRepository;

    /**
     * DEBUG/TEST: respects req.explain() and returns FULL payload.
     */
    @Transactional(readOnly = true)
    public GeneratedScheduleResponse generate(GenerateScheduleRequest req) {
        boolean explain = Boolean.TRUE.equals(req.explain());
        return generateInternal(req, explain);
    }

    /**
     * USER: always forces explain=false and returns SLIM payload.
     */
    @Transactional(readOnly = true)
    public UserGeneratedScheduleResponse generateUser(GenerateScheduleRequest req) {
        GeneratedScheduleResponse full = generateInternal(req, false);

        return new UserGeneratedScheduleResponse(
                full.semester(),
                full.yearLevel(),
                full.templateUsed(),
                full.selected(),
                full.weeklyGrid(),
                full.warnings(),
                full.targetCourses(),
                full.achievedCourses(),
                full.minRequired(),
                full.metMinimum(),
                full.targetElectives(),
                full.achievedElectives(),
                full.metElectiveTarget()
        );
    }

    /**
     * Single source of truth: all logic lives here.
     */
    private GeneratedScheduleResponse generateInternal(GenerateScheduleRequest req, boolean explain) {
        Long userId = currentUserService.currentUserIdOrThrow();

        ExplainCtx explainCtx = explain ? new ExplainCtx(MAX_SKIP_REASONS) : null;

        // ✅ Read user's completedHours (used as training-hours gate in this rule)
        int completedHours = userProfileRepository.findById(userId)
                .map(UserProfile::getCompletedHours)
                .filter(Objects::nonNull)
                .orElse(0);

        // Completed courses (server-side only)
        Set<Long> completedCourseIds = new HashSet<>(completedCourseRepository.findCompletedCourseIdsByUserId(userId));

        // IMPORTANT FIX: normalize completed codes once (robust prereq matching)
        Set<String> completedCourseCodes = completedCourseRepository.findCompletedCourseCodesByUserId(userId).stream()
                .filter(Objects::nonNull)
                .map(ScheduleGeneratorService::normalizeCourseCode)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // Lifetime elective cap (completed so far)
        long completedElectiveCount = completedCourseRepository.countCompletedElectiveCoursesByUserId(userId);
        long completedElectiveHours = completedCourseRepository.sumCompletedElectiveCreditHoursByUserId(userId);

        // Track what we add in THIS generated schedule (so we don't exceed lifetime cap)
        long selectedElectiveCount = 0;
        long selectedElectiveHours = 0;

        // Offerings for semester
        List<TermCourseOfferingEntity> allOfferings = offeringRepository.findBySemesterWithCourse(req.nextSemester());
        Map<Long, List<TermCourseOfferingEntity>> offeringsByCourseId = allOfferings.stream()
                .collect(Collectors.groupingBy(o -> o.getCourse().getId()));

        // Make offering lists deterministic (DB order is not guaranteed)
        for (List<TermCourseOfferingEntity> list : offeringsByCourseId.values()) {
            if (list == null || list.size() <= 1) continue;
            list.sort(ScheduleGeneratorService::compareOfferingsDeterministic);
        }

        // Separate "base warnings" (rule clamps etc.) from "selection warnings" (skips/conflicts)
        List<String> warnings = new ArrayList<>();
        List<String> selectionWarnings = new ArrayList<>();

        // Resolve course-count rules (min/max/default) by semester, then clamp target into allowed range
        CourseCountRules rules = courseCountRules(req.nextSemester());
        int targetCount = resolveTargetCount(req.desiredCourseCount(), rules, warnings);

        // Resolve elective target/cap for THIS schedule
        boolean lifetimeElectiveCapReached =
                completedElectiveCount >= MAX_ELECTIVE_COURSES_LIFETIME ||
                        completedElectiveHours >= MAX_ELECTIVE_CREDIT_HOURS_LIFETIME;

        Integer electiveTarget = resolveElectiveTarget(req.desiredElectiveCount(), targetCount, lifetimeElectiveCapReached, warnings);

        // Normalize user preferred tags once (quote-safe)
        Set<String> preferredTagsNorm = normalizePreferredTags(req.preferredTags());

        // STRICT elective-by-tags rule (only while we still need electives)
        boolean enforceElectiveTags = electiveTarget != null && electiveTarget > 0 && !preferredTagsNorm.isEmpty();

        // Must-takes
        LinkedHashSet<Long> mustTake = new LinkedHashSet<>();
        if (req.mustTakeCourseIds() != null) {
            mustTake.addAll(req.mustTakeCourseIds().stream().filter(Objects::nonNull).toList());
        }

        // Preferred template (optional)
        Optional<PreferredScheduleTemplateEntity> templateOpt = templateRepository
                .findBySemesterAndYearLevel(req.nextSemester(), req.nextYearLevel());

        List<Long> templateCourseIds = templateOpt
                .map(t -> t.getItems().stream().map(it -> it.getCourse().getId()).toList())
                .orElse(List.of());

        boolean templateUsed = false;
        List<SelectedOffering> selected = new ArrayList<>();

        // Track selection phase for explain/score breakdown
        Map<Long, ExplainPhase> selectedPhase = explain ? new HashMap<>() : null;

        // 1) Add must-takes first (if enabled)
        if (Boolean.TRUE.equals(req.pinMustTakesFirst())) {
            for (Long courseId : mustTake) {
                if (completedCourseIds.contains(courseId)) {
                    selectionWarnings.add("Must-take already completed (skipped): courseId=" + courseId);
                    if (explainCtx != null) {
                        explainCtx.addSkip(new SkipReasonDto(
                                ExplainPhase.MUST_TAKE, SkipReasonCode.ALREADY_COMPLETED,
                                courseId, null, null,
                                "Must-take is already completed."
                        ));
                    }
                    continue;
                }

                TermCourseOfferingEntity chosen = chooseBestOfferingForCourse(
                        req,
                        courseId,
                        offeringsByCourseId,
                        completedCourseCodes,
                        selected,
                        selectionWarnings,
                        explainCtx,
                        ExplainPhase.MUST_TAKE,
                        completedHours
                );

                if (chosen != null) {
                    CourseEntity c = chosen.getCourse();

                    // per-schedule elective cap/target (strict: do not exceed)
                    if (electiveTarget != null && electiveTarget >= 0 && isElective(c) && selectedElectiveCount >= electiveTarget) {
                        selectionWarnings.add("Elective target reached for this schedule (skipped must-take elective): "
                                + c.getCourseName() + " (" + c.getCourseCode() + "). Increase desiredElectiveCount if you want it.");

                        if (explainCtx != null) {
                            explainCtx.addSkip(new SkipReasonDto(
                                    ExplainPhase.MUST_TAKE, SkipReasonCode.ELECTIVE_TARGET_REACHED,
                                    c.getId(), c.getCourseCode(), c.getCourseName(),
                                    "Elective target already reached inside this schedule."
                            ));
                        }
                        continue;
                    }

                    // STRICT elective-by-tags while we still need electives
                    if (enforceElectiveTags && isElective(c) && selectedElectiveCount < electiveTarget
                            && !matchesAnyPreferredTag(c.getTags(), preferredTagsNorm)) {
                        selectionWarnings.add("Skipped elective (does not match selected tags): "
                                + c.getCourseName() + " (" + c.getCourseCode() + ")");

                        if (explainCtx != null) {
                            explainCtx.addSkip(new SkipReasonDto(
                                    ExplainPhase.MUST_TAKE, SkipReasonCode.TAG_MISMATCH,
                                    c.getId(), c.getCourseCode(), c.getCourseName(),
                                    "Elective tags are enforced and this course doesn't match the selected tags."
                            ));
                        }
                        continue;
                    }

                    // lifetime elective cap (strict)
                    if (!canAddCourseByElectiveLimit(c, completedElectiveCount, completedElectiveHours, selectedElectiveCount, selectedElectiveHours)) {
                        selectionWarnings.add("Elective lifetime limit reached (skipped): " + c.getCourseName() + " (" + c.getCourseCode() + ")");

                        if (explainCtx != null) {
                            explainCtx.addSkip(new SkipReasonDto(
                                    ExplainPhase.MUST_TAKE, SkipReasonCode.LIFETIME_ELECTIVE_CAP,
                                    c.getId(), c.getCourseCode(), c.getCourseName(),
                                    "Adding this elective would exceed lifetime elective limits."
                            ));
                        }
                        continue;
                    }

                    // NOTE: Must-takes are allowed to override elective reservation behavior.
                    selected.add(new SelectedOffering(chosen));
                    if (selectedPhase != null) selectedPhase.put(c.getId(), ExplainPhase.MUST_TAKE);

                    if (isElective(c)) {
                        selectedElectiveCount++;
                        selectedElectiveHours += c.getCreditHours();
                    }

                    if (selected.size() >= targetCount) break;
                } else {
                    selectionWarnings.add("Must-take could not be scheduled due to constraints/conflicts: courseId=" + courseId);
                    if (explainCtx != null) {
                        explainCtx.addSkip(new SkipReasonDto(
                                ExplainPhase.MUST_TAKE, SkipReasonCode.NO_FEASIBLE_SECTION,
                                courseId, null, null,
                                "No offered section can fit constraints / conflicts for this must-take."
                        ));
                    }
                }
            }
        }

        // 2) Try template (only if it has any not-completed)
        boolean templateHasAnyNotCompleted = templateCourseIds.stream().anyMatch(id -> !completedCourseIds.contains(id));

        if (templateOpt.isPresent() && templateHasAnyNotCompleted) {
            for (Long courseId : templateCourseIds) {
                if (selected.size() >= targetCount) break;
                if (completedCourseIds.contains(courseId)) continue;
                if (containsCourse(selected, courseId)) continue;

                TermCourseOfferingEntity chosen = chooseBestOfferingForCourse(
                        req,
                        courseId,
                        offeringsByCourseId,
                        completedCourseCodes,
                        selected,
                        selectionWarnings,
                        explainCtx,
                        ExplainPhase.TEMPLATE,
                        completedHours
                );

                if (chosen != null) {
                    CourseEntity c = chosen.getCourse();

                    // ✅ Elective slot reservation: don't add a non-elective if it would make electiveTarget impossible.
                    if (wouldBlockElectiveTarget(targetCount, electiveTarget, selected.size(), selectedElectiveCount, c)) {
                        selectionWarnings.add("Reserved elective slots to meet desiredElectiveCount (skipped template non-elective): "
                                + c.getCourseName() + " (" + c.getCourseCode() + ")");
                        continue;
                    }

                    // per-schedule elective cap/target
                    if (electiveTarget != null && electiveTarget >= 0 && isElective(c) && selectedElectiveCount >= electiveTarget) {
                        selectionWarnings.add("Elective target reached for this schedule (skipped template elective): "
                                + c.getCourseName() + " (" + c.getCourseCode() + ")");

                        if (explainCtx != null) {
                            explainCtx.addSkip(new SkipReasonDto(
                                    ExplainPhase.TEMPLATE, SkipReasonCode.ELECTIVE_TARGET_REACHED,
                                    c.getId(), c.getCourseCode(), c.getCourseName(),
                                    "Elective target already reached inside this schedule."
                            ));
                        }
                        continue;
                    }

                    // STRICT elective-by-tags while we still need electives
                    if (enforceElectiveTags && isElective(c) && selectedElectiveCount < electiveTarget
                            && !matchesAnyPreferredTag(c.getTags(), preferredTagsNorm)) {
                        selectionWarnings.add("Skipped elective (does not match selected tags): "
                                + c.getCourseName() + " (" + c.getCourseCode() + ")");

                        if (explainCtx != null) {
                            explainCtx.addSkip(new SkipReasonDto(
                                    ExplainPhase.TEMPLATE, SkipReasonCode.TAG_MISMATCH,
                                    c.getId(), c.getCourseCode(), c.getCourseName(),
                                    "Elective tags are enforced and this course doesn't match the selected tags."
                            ));
                        }
                        continue;
                    }

                    if (!canAddCourseByElectiveLimit(c, completedElectiveCount, completedElectiveHours, selectedElectiveCount, selectedElectiveHours)) {
                        selectionWarnings.add("Elective lifetime limit reached (skipped): " + c.getCourseName() + " (" + c.getCourseCode() + ")");

                        if (explainCtx != null) {
                            explainCtx.addSkip(new SkipReasonDto(
                                    ExplainPhase.TEMPLATE, SkipReasonCode.LIFETIME_ELECTIVE_CAP,
                                    c.getId(), c.getCourseCode(), c.getCourseName(),
                                    "Adding this elective would exceed lifetime elective limits."
                            ));
                        }
                        continue;
                    }

                    selected.add(new SelectedOffering(chosen));
                    if (selectedPhase != null) selectedPhase.put(c.getId(), ExplainPhase.TEMPLATE);

                    templateUsed = true;

                    if (isElective(c)) {
                        selectedElectiveCount++;
                        selectedElectiveHours += c.getCreditHours();
                    }
                } else {
                    // Template course couldn't be scheduled (already explained inside chooseBestOfferingForCourse)
                }
            }

            // ✅ Backlog AFTER template, BEFORE pool
            if (selected.size() < targetCount) {
                int backlogAdded = fillFromBacklog(
                        req,
                        targetCount,
                        electiveTarget,
                        preferredTagsNorm,
                        enforceElectiveTags,
                        offeringsByCourseId,
                        completedCourseIds,
                        completedCourseCodes,
                        selected,
                        selectionWarnings,
                        explainCtx,
                        selectedPhase,
                        completedElectiveCount,
                        completedElectiveHours,
                        selectedElectiveCount,
                        selectedElectiveHours,
                        completedHours
                );

                long[] recalc = recalcSelectedElectives(selected);
                selectedElectiveCount = recalc[0];
                selectedElectiveHours = recalc[1];

                if (backlogAdded == 0 && backlogExists(req, offeringsByCourseId, completedCourseIds, selected)) {
                    selectionWarnings.add("Backlog exists (earlier-year courses not completed), but none could be scheduled due to prerequisites/conflicts/constraints.");
                }
            }

            if (selected.size() < targetCount) {
                List<Long> exclude = selected.stream().map(s -> s.course().getId()).toList();
                fillFromPool(
                        req,
                        targetCount,
                        electiveTarget,
                        preferredTagsNorm,
                        offeringsByCourseId,
                        completedCourseIds,
                        completedCourseCodes,
                        exclude,
                        selected,
                        selectionWarnings,
                        completedElectiveCount,
                        completedElectiveHours,
                        selectedElectiveCount,
                        selectedElectiveHours,
                        completedHours
                );

                if (selectedPhase != null) {
                    for (SelectedOffering so : selected) {
                        selectedPhase.putIfAbsent(so.course().getId(), ExplainPhase.POOL);
                    }
                }

                long[] recalc = recalcSelectedElectives(selected);
                selectedElectiveCount = recalc[0];
                selectedElectiveHours = recalc[1];
            }
        } else {

            // ✅ Backlog AFTER (no template), BEFORE pool
            if (selected.size() < targetCount) {
                int backlogAdded = fillFromBacklog(
                        req,
                        targetCount,
                        electiveTarget,
                        preferredTagsNorm,
                        enforceElectiveTags,
                        offeringsByCourseId,
                        completedCourseIds,
                        completedCourseCodes,
                        selected,
                        selectionWarnings,
                        explainCtx,
                        selectedPhase,
                        completedElectiveCount,
                        completedElectiveHours,
                        selectedElectiveCount,
                        selectedElectiveHours,
                        completedHours
                );

                long[] recalc = recalcSelectedElectives(selected);
                selectedElectiveCount = recalc[0];
                selectedElectiveHours = recalc[1];

                if (backlogAdded == 0 && backlogExists(req, offeringsByCourseId, completedCourseIds, selected)) {
                    selectionWarnings.add("Backlog exists (earlier-year courses not completed), but none could be scheduled due to prerequisites/conflicts/constraints.");
                }
            }

            fillFromPool(
                    req,
                    targetCount,
                    electiveTarget,
                    preferredTagsNorm,
                    offeringsByCourseId,
                    completedCourseIds,
                    completedCourseCodes,
                    selected.stream().map(s -> s.course().getId()).toList(),
                    selected,
                    selectionWarnings,
                    completedElectiveCount,
                    completedElectiveHours,
                    selectedElectiveCount,
                    selectedElectiveHours,
                    completedHours
            );

            if (selectedPhase != null) {
                for (SelectedOffering so : selected) {
                    selectedPhase.putIfAbsent(so.course().getId(), ExplainPhase.POOL);
                }
            }

            long[] recalc = recalcSelectedElectives(selected);
            selectedElectiveCount = recalc[0];
            selectedElectiveHours = recalc[1];
        }

        // ----------------------------
        // Beam-search fallback (ONLY if greedy couldn't meet semester minimum)
        // ----------------------------
        if (selected.size() < rules.minRequired) {

            // compute greedy score ONCE (beam comparison might need it)
            final double greedyTotalScore = computePlanScore(req, selected, targetCount, electiveTarget);

            BeamResult br = beamSearchRebuild(
                    req,
                    rules,
                    targetCount,
                    electiveTarget,
                    preferredTagsNorm,
                    offeringsByCourseId,
                    completedCourseIds,
                    completedCourseCodes,
                    mustTake,
                    templateCourseIds,
                    completedElectiveCount,
                    completedElectiveHours,
                    completedHours
            );

            if (br != null && br.selected != null) {
                int gs = selected.size();
                int bs = br.selected.size();

                boolean takeBeam =
                        (bs > gs) ||
                                (bs == gs && br.totalScore > greedyTotalScore + SCORE_EPS);

                if (takeBeam) {
                    selected = br.selected;
                    selectionWarnings = br.selectionWarnings; // replace selection warnings with beam warnings
                    templateUsed = br.templateUsed;

                    if (selectedPhase != null) {
                        selectedPhase.clear();
                        for (SelectedOffering so : selected) {
                            selectedPhase.put(so.course().getId(), ExplainPhase.BEAM);
                        }
                    }

                    long[] recalc = recalcSelectedElectives(selected);
                    selectedElectiveCount = recalc[0];
                    selectedElectiveHours = recalc[1];

                    warnings.add("Beam-search fallback was used to improve feasibility/quality (greedy could not meet minimum course load).");
                }
            }
        }

        // If we rebuilt via beam, recompute templateUsed safely (in case)
        if (templateOpt.isPresent() && !templateCourseIds.isEmpty()) {
            boolean anyTemplateCourseSelected = selected.stream().anyMatch(s -> templateCourseIds.contains(s.course().getId()));
            templateUsed = templateUsed || anyTemplateCourseSelected;
        }

        // Alternatives (always 1 per selected course)
        List<SelectedCourseOptionDto> selectedDtos = new ArrayList<>();
        List<AlternativeReasonDto> alternativeReasons = explain ? new ArrayList<>() : null;

        for (SelectedOffering so : selected) {
            TermCourseOfferingEntity primary = so.offering();
            TermCourseOfferingEntity alt = findAlternativeOffering(req, primary, offeringsByCourseId, completedCourseCodes, selected);

            ScheduleCourseSlotDto primaryDto = toCourseSlotDto(primary, false);
            ScheduleCourseSlotDto altDto;

            if (alt == null) {
                altDto = toCourseSlotDto(primary, true);

                if (alternativeReasons != null) {
                    alternativeReasons.add(explainAlternativeFailure(req, primary, offeringsByCourseId, completedCourseCodes, selected));
                }
            } else {
                altDto = toCourseSlotDto(alt, false);
            }

            selectedDtos.add(new SelectedCourseOptionDto(primaryDto, altDto));
        }

        // Weekly grid
        List<DayScheduleDto> grid = buildWeeklyGrid(selected);

        int achieved = selected.size();
        boolean metMinimum = achieved >= rules.minRequired;
        if (!metMinimum) {
            selectionWarnings.add("Minimum course requirement not met. Required=" + rules.minRequired + ", Selected=" + achieved);
        }

        int achievedElectives = (int) selectedElectiveCount;

        boolean metElectiveTarget;
        if (electiveTarget == null) {
            metElectiveTarget = true;
        } else {
            metElectiveTarget = achievedElectives >= electiveTarget;
            if (!metElectiveTarget) {
                selectionWarnings.add("Could not reach desiredElectiveCount. Required=" + electiveTarget + ", Achieved=" + achievedElectives);
                boolean enforceElectiveTags2 = electiveTarget > 0 && !preferredTagsNorm.isEmpty();
                if (enforceElectiveTags2) {
                    selectionWarnings.add("Elective tags were enforced. Try different tags or lower desiredElectiveCount.");
                }
            }
        }

        // Explain: elective analysis (why electives could be missing)
        if (explain && electiveTarget != null && electiveTarget > 0 && achievedElectives < electiveTarget && explainCtx != null) {
            analyzeElectiveFailures(
                    req,
                    electiveTarget,
                    preferredTagsNorm,
                    offeringsByCourseId,
                    completedCourseIds,
                    completedCourseCodes,
                    selected,
                    completedElectiveCount,
                    completedElectiveHours,
                    explainCtx
            );
        }

        warnings.addAll(selectionWarnings);

        List<SelectedScoreDto> scoreBreakdowns = explain
                ? buildSelectedScoreBreakdown(req, selected, selectedPhase)
                : null;

        return new GeneratedScheduleResponse(
                req.nextSemester(),
                req.nextYearLevel(),
                templateUsed,
                selectedDtos,
                grid,
                warnings,
                targetCount,
                achieved,
                rules.minRequired,
                metMinimum,
                electiveTarget,
                achievedElectives,
                metElectiveTarget,
                explainCtx == null ? null : explainCtx.skipReasons,
                alternativeReasons,
                scoreBreakdowns
        );
    }

    /**
     * Compute a "beam-like" total plan score for the currently built greedy plan.
     * This uses the SAME step-score components beam uses, accumulated in the CURRENT selection order.
     */
    private double computePlanScore(
            GenerateScheduleRequest req,
            List<SelectedOffering> selected,
            int desiredCount,
            Integer electiveTarget
    ) {
        if (selected == null || selected.isEmpty()) return 0.0;

        EnumMap<DifficultyBucket, Integer> quotas = difficultyQuotas(req.difficultyTarget(), desiredCount);
        EnumMap<DifficultyBucket, Integer> counts = countDifficultyBuckets(List.of());

        long electiveCount = 0;
        double total = 0.0;

        List<SelectedOffering> ctx = new ArrayList<>();

        for (SelectedOffering so : selected) {
            TermCourseOfferingEntity chosen = so.offering();
            CourseEntity c = chosen.getCourse();

            double step = scoreOffering(req, chosen, ctx);

            if (c.getRecommendedYear() == req.nextYearLevel()) step += 30;
            int expectedRecSemester = mapSemesterToRecommendedSemester(req.nextSemester());
            if (c.getRecommendedSemester() == expectedRecSemester) step += 15;

            step += difficultyScore(req.difficultyTarget(), c.getDifficulty());

            DifficultyBucket bucket = bucketOf(c.getDifficulty());
            step += difficultyQuotaAdjustment(quotas, counts, bucket);

            step += tagScore(req.preferredTags(), c.getTags());
            step += electiveTargetScore(electiveTarget, electiveCount, c);

            total += step;

            ctx.add(so);
            counts.put(bucket, counts.getOrDefault(bucket, 0) + 1);

            if (isElective(c)) electiveCount++;
        }

        return total;
    }

    // ✅ NEW: backlog phase (earlier-year missing courses), runs AFTER template and BEFORE pool
    private int fillFromBacklog(
            GenerateScheduleRequest req,
            int desiredCount,
            Integer electiveTarget,
            Set<String> preferredTagsNorm,
            boolean enforceElectiveTags,
            Map<Long, List<TermCourseOfferingEntity>> offeringsByCourseId,
            Set<Long> completedCourseIds,
            Set<String> completedCourseCodes,
            List<SelectedOffering> selected,
            List<String> warnings,
            ExplainCtx explainCtx,
            Map<Long, ExplainPhase> selectedPhase,
            long completedElectiveCount,
            long completedElectiveHours,
            long selectedElectiveCountStart,
            long selectedElectiveHoursStart,
            int completedHours
    ) {
        long selectedElectiveCount = selectedElectiveCountStart;
        long selectedElectiveHours = selectedElectiveHoursStart;

        if (selected.size() >= desiredCount) return 0;

        Map<Long, CourseEntity> courseRefById = new HashMap<>();
        for (var e : offeringsByCourseId.entrySet()) {
            Long courseId = e.getKey();
            List<TermCourseOfferingEntity> opts = e.getValue();
            if (courseId == null || opts == null || opts.isEmpty()) continue;
            courseRefById.put(courseId, opts.getFirst().getCourse());
        }

        List<Long> backlog = courseRefById.entrySet().stream()
                .filter(en -> en.getKey() != null)
                .filter(en -> !completedCourseIds.contains(en.getKey()))
                .filter(en -> !containsCourse(selected, en.getKey()))
                .filter(en -> {
                    CourseEntity c = en.getValue();
                    if (c == null) return false;

                    // ✅ Training-hours gate (skip in backlog ordering if not eligible)
                    if (!trainingHoursEligible(c, completedHours)) return false;

                    Integer ry = c.getRecommendedYear();
                    if (ry == null) return false;
                    return ry < req.nextYearLevel();
                })
                .map(Map.Entry::getKey)
                .sorted((a, b) -> {
                    CourseEntity ca = courseRefById.get(a);
                    CourseEntity cb = courseRefById.get(b);

                    Integer rya = (ca == null ? null : ca.getRecommendedYear());
                    Integer ryb = (cb == null ? null : cb.getRecommendedYear());

                    int cmp = Comparator.nullsLast(Integer::compareTo).compare(rya, ryb);
                    if (cmp != 0) return cmp;

                    Integer rsa = (ca == null ? null : ca.getRecommendedSemester());
                    Integer rsb = (cb == null ? null : cb.getRecommendedSemester());

                    cmp = Comparator.nullsLast(Integer::compareTo).compare(rsa, rsb);
                    if (cmp != 0) return cmp;

                    return Long.compare(a, b);
                })
                .toList();

        if (backlog.isEmpty()) return 0;

        int added = 0;

        for (Long courseId : backlog) {
            if (selected.size() >= desiredCount) break;
            if (courseId == null) continue;
            if (completedCourseIds.contains(courseId)) continue;
            if (containsCourse(selected, courseId)) continue;

            TermCourseOfferingEntity chosen = chooseBestOfferingForCourse(
                    req,
                    courseId,
                    offeringsByCourseId,
                    completedCourseCodes,
                    selected,
                    warnings,
                    explainCtx,
                    ExplainPhase.BACKLOG,
                    completedHours
            );

            if (chosen == null) continue;

            CourseEntity c = chosen.getCourse();

            // ✅ Elective slot reservation
            if (wouldBlockElectiveTarget(desiredCount, electiveTarget, selected.size(), selectedElectiveCount, c)) {
                warnings.add("Reserved elective slots to meet desiredElectiveCount (skipped backlog non-elective): "
                        + c.getCourseName() + " (" + c.getCourseCode() + ")");
                continue;
            }

            // per-schedule elective cap/target
            if (electiveTarget != null && electiveTarget >= 0 && isElective(c) && selectedElectiveCount >= electiveTarget) {
                if (explainCtx != null) {
                    explainCtx.addSkip(new SkipReasonDto(
                            ExplainPhase.BACKLOG, SkipReasonCode.ELECTIVE_TARGET_REACHED,
                            c.getId(), c.getCourseCode(), c.getCourseName(),
                            "Elective target already reached inside this schedule."
                    ));
                }
                continue;
            }

            // STRICT elective-by-tags while we still need electives
            if (enforceElectiveTags && electiveTarget != null && isElective(c) && selectedElectiveCount < electiveTarget
                    && !matchesAnyPreferredTag(c.getTags(), preferredTagsNorm)) {
                if (explainCtx != null) {
                    explainCtx.addSkip(new SkipReasonDto(
                            ExplainPhase.BACKLOG, SkipReasonCode.TAG_MISMATCH,
                            c.getId(), c.getCourseCode(), c.getCourseName(),
                            "Elective tags are enforced and this course doesn't match the selected tags."
                    ));
                }
                continue;
            }

            // lifetime elective cap (strict)
            if (!canAddCourseByElectiveLimit(c, completedElectiveCount, completedElectiveHours, selectedElectiveCount, selectedElectiveHours)) {
                if (explainCtx != null) {
                    explainCtx.addSkip(new SkipReasonDto(
                            ExplainPhase.BACKLOG, SkipReasonCode.LIFETIME_ELECTIVE_CAP,
                            c.getId(), c.getCourseCode(), c.getCourseName(),
                            "Adding this elective would exceed lifetime elective limits."
                    ));
                }
                continue;
            }

            selected.add(new SelectedOffering(chosen));
            if (selectedPhase != null) selectedPhase.put(c.getId(), ExplainPhase.BACKLOG);

            if (isElective(c)) {
                selectedElectiveCount++;
                selectedElectiveHours += c.getCreditHours();
            }

            added++;
        }

        return added;
    }

    private boolean backlogExists(
            GenerateScheduleRequest req,
            Map<Long, List<TermCourseOfferingEntity>> offeringsByCourseId,
            Set<Long> completedCourseIds,
            List<SelectedOffering> selected
    ) {
        for (var e : offeringsByCourseId.entrySet()) {
            Long courseId = e.getKey();
            List<TermCourseOfferingEntity> opts = e.getValue();
            if (courseId == null || opts == null || opts.isEmpty()) continue;
            if (completedCourseIds.contains(courseId)) continue;
            if (containsCourse(selected, courseId)) continue;

            CourseEntity c = opts.getFirst().getCourse();
            if (c == null) continue;

            Integer ry = c.getRecommendedYear();
            if (ry == null) continue;

            if (ry < req.nextYearLevel()) return true;
        }
        return false;
    }

    // ----------------------------
    // Explain helpers
    // ----------------------------

    private static final class ExplainCtx {
        final int max;
        final List<SkipReasonDto> skipReasons = new ArrayList<>();

        ExplainCtx(int max) { this.max = Math.max(0, max); }

        void addSkip(SkipReasonDto dto) {
            if (dto == null) return;
            if (skipReasons.size() >= max) return;
            skipReasons.add(dto);
        }
    }

    private AlternativeReasonDto explainAlternativeFailure(
            GenerateScheduleRequest req,
            TermCourseOfferingEntity primary,
            Map<Long, List<TermCourseOfferingEntity>> offeringsByCourseId,
            Set<String> completedCourseCodes,
            List<SelectedOffering> selected
    ) {
        CourseEntity c = primary.getCourse();

        if (!Boolean.TRUE.equals(req.returnAlternatives())) {
            return new AlternativeReasonDto(
                    c.getId(), c.getCourseCode(), c.getCourseName(),
                    AlternativeReasonCode.NOT_REQUESTED,
                    "returnAlternatives=false"
            );
        }

        List<TermCourseOfferingEntity> options = offeringsByCourseId.get(c.getId());
        if (options == null || options.size() <= 1) {
            return new AlternativeReasonDto(
                    c.getId(), c.getCourseCode(), c.getCourseName(),
                    AlternativeReasonCode.NO_OTHER_SECTIONS,
                    "No other sections for this course in this semester."
            );
        }

        int prereqFail = 0, hardFail = 0, conflictFail = 0;
        int checked = 0;

        for (TermCourseOfferingEntity o : options) {
            if (o.getId().equals(primary.getId())) continue;
            checked++;

            if (!prerequisitesSatisfied(o.getCourse(), completedCourseCodes)) {
                prereqFail++;
                continue;
            }
            if (!respectsHardConstraints(req, o)) {
                hardFail++;
                continue;
            }

            List<SelectedOffering> withoutPrimary = selected.stream()
                    .filter(s -> !s.offering().getId().equals(primary.getId()))
                    .toList();

            if (conflictsWithSelected(o, withoutPrimary)) {
                conflictFail++;
                continue;
            }
        }

        if (checked == 0) {
            return new AlternativeReasonDto(
                    c.getId(), c.getCourseCode(), c.getCourseName(),
                    AlternativeReasonCode.NO_OTHER_SECTIONS,
                    "No other sections for this course in this semester."
            );
        }

        if (prereqFail == checked) {
            return new AlternativeReasonDto(
                    c.getId(), c.getCourseCode(), c.getCourseName(),
                    AlternativeReasonCode.PREREQUISITE_FAIL_ALL,
                    "All other sections failed prerequisite checks."
            );
        }

        if (hardFail == checked) {
            return new AlternativeReasonDto(
                    c.getId(), c.getCourseCode(), c.getCourseName(),
                    AlternativeReasonCode.UNAVAILABLE_CONFLICT_ALL,
                    "All other sections conflict with unavailable blocks or hard time constraints."
            );
        }

        if (conflictFail == checked) {
            return new AlternativeReasonDto(
                    c.getId(), c.getCourseCode(), c.getCourseName(),
                    AlternativeReasonCode.TIME_CONFLICT_ALL,
                    "All other sections conflict with the current selected schedule."
            );
        }

        return new AlternativeReasonDto(
                c.getId(), c.getCourseCode(), c.getCourseName(),
                AlternativeReasonCode.NO_FEASIBLE_ALTERNATIVE,
                "No alternative section can fit constraints + conflicts."
        );
    }

    private void analyzeElectiveFailures(
            GenerateScheduleRequest req,
            int electiveTarget,
            Set<String> preferredTagsNorm,
            Map<Long, List<TermCourseOfferingEntity>> offeringsByCourseId,
            Set<Long> completedCourseIds,
            Set<String> completedCourseCodes,
            List<SelectedOffering> selected,
            long completedElectiveCount,
            long completedElectiveHours,
            ExplainCtx explainCtx
    ) {
        Set<Long> selectedIds = selected.stream().map(s -> s.course().getId()).collect(Collectors.toSet());

        boolean enforceElectiveTags = electiveTarget > 0 && preferredTagsNorm != null && !preferredTagsNorm.isEmpty();

        int added = 0;
        for (var entry : offeringsByCourseId.entrySet()) {
            if (added >= 20) break;

            Long courseId = entry.getKey();
            if (courseId == null) continue;
            if (completedCourseIds.contains(courseId)) continue;
            if (selectedIds.contains(courseId)) continue;

            List<TermCourseOfferingEntity> options = entry.getValue();
            if (options == null || options.isEmpty()) continue;

            CourseEntity c = options.getFirst().getCourse();
            if (!isElective(c)) continue;

            if (!canAddCourseByElectiveLimit(c, completedElectiveCount, completedElectiveHours, 0, 0)) {
                explainCtx.addSkip(new SkipReasonDto(
                        ExplainPhase.ELECTIVE_ANALYSIS, SkipReasonCode.LIFETIME_ELECTIVE_CAP,
                        c.getId(), c.getCourseCode(), c.getCourseName(),
                        "Elective lifetime limit prevents selecting this elective."
                ));
                added++;
                continue;
            }

            if (enforceElectiveTags && !matchesAnyPreferredTag(c.getTags(), preferredTagsNorm)) {
                explainCtx.addSkip(new SkipReasonDto(
                        ExplainPhase.ELECTIVE_ANALYSIS, SkipReasonCode.TAG_MISMATCH,
                        c.getId(), c.getCourseCode(), c.getCourseName(),
                        "Elective tags are enforced and this course doesn't match selected tags."
                ));
                added++;
                continue;
            }

            if (!prerequisitesSatisfied(c, completedCourseCodes)) {
                explainCtx.addSkip(new SkipReasonDto(
                        ExplainPhase.ELECTIVE_ANALYSIS, SkipReasonCode.PREREQUISITE_FAIL,
                        c.getId(), c.getCourseCode(), c.getCourseName(),
                        "Prerequisites not satisfied for this elective."
                ));
                added++;
                continue;
            }

            boolean anyFeasible = false;
            for (TermCourseOfferingEntity o : options) {
                if (!respectsHardConstraints(req, o)) continue;
                if (conflictsWithSelected(o, selected)) continue;
                anyFeasible = true;
                break;
            }

            if (!anyFeasible) {
                boolean anyHardOk = false;
                for (TermCourseOfferingEntity o : options) {
                    if (respectsHardConstraints(req, o)) { anyHardOk = true; break; }
                }

                explainCtx.addSkip(new SkipReasonDto(
                        ExplainPhase.ELECTIVE_ANALYSIS,
                        anyHardOk ? SkipReasonCode.TIME_CONFLICT : SkipReasonCode.UNAVAILABLE_CONFLICT,
                        c.getId(), c.getCourseCode(), c.getCourseName(),
                        anyHardOk
                                ? "All elective sections conflict with the selected schedule."
                                : "All elective sections violate hard constraints (unavailable blocks/time limits)."
                ));
                added++;
                continue;
            }

            explainCtx.addSkip(new SkipReasonDto(
                    ExplainPhase.ELECTIVE_ANALYSIS, SkipReasonCode.LOW_SCORE,
                    c.getId(), c.getCourseCode(), c.getCourseName(),
                    "Feasible elective exists but was outranked by other courses under scoring."
            ));
            added++;
        }
    }

    private List<SelectedScoreDto> buildSelectedScoreBreakdown(
            GenerateScheduleRequest req,
            List<SelectedOffering> selected,
            Map<Long, ExplainPhase> selectedPhase
    ) {
        if (selected == null || selected.isEmpty()) return List.of();

        int desiredCountForQuota = Math.max(1, Math.min(6, selected.size()));
        EnumMap<DifficultyBucket, Integer> quotas = difficultyQuotas(req.difficultyTarget(), desiredCountForQuota);

        List<SelectedScoreDto> out = new ArrayList<>();
        for (SelectedOffering so : selected) {
            TermCourseOfferingEntity offering = so.offering();
            CourseEntity c = offering.getCourse();

            List<SelectedOffering> without = selected.stream()
                    .filter(x -> !x.offering().getId().equals(offering.getId()))
                    .toList();

            ScoreBreakdownDto b = computeScoreBreakdown(req, offering, without, quotas);
            ExplainPhase phase = (selectedPhase == null ? null : selectedPhase.getOrDefault(c.getId(), ExplainPhase.POOL));

            out.add(new SelectedScoreDto(
                    c.getId(),
                    c.getCourseCode(),
                    c.getCourseName(),
                    offering.getSectionCode(),
                    phase,
                    b
            ));
        }

        return out;
    }

    private ScoreBreakdownDto computeScoreBreakdown(
            GenerateScheduleRequest req,
            TermCourseOfferingEntity o,
            List<SelectedOffering> contextWithoutThis,
            EnumMap<DifficultyBucket, Integer> quotas
    ) {
        double preferredDaysScore = 0;
        double avoidDaysScore = 0;
        double timeWindowScore = 0;
        double earliestLatestPenalty = 0;
        double compactnessPenalty = 0;
        double gapPenalty = 0;

        if (req.preferredDays() != null && !req.preferredDays().isEmpty()) {
            long hits = o.getPattern().days().stream().filter(req.preferredDays()::contains).count();
            preferredDaysScore += hits * 8;
        }
        if (req.avoidDays() != null && !req.avoidDays().isEmpty()) {
            long hits = o.getPattern().days().stream().filter(req.avoidDays()::contains).count();
            avoidDaysScore -= hits * 12;
        }

        if (req.preferredTimeWindows() != null && !req.preferredTimeWindows().isEmpty()) {
            boolean withinAny = false;
            for (TimeWindowDto w : req.preferredTimeWindows()) {
                if (w == null) continue;
                TimeRanges.requireValid(w.from(), w.to(), "Preferred time window");
                if (TimeRanges.within(o.getStartTime(), o.getEndTime(), w.from(), w.to())) {
                    withinAny = true;
                    break;
                }
            }
            timeWindowScore += withinAny ? 10 : -5;
        }

        if (req.earliestStartTime() != null && o.getStartTime().isBefore(req.earliestStartTime())) {
            earliestLatestPenalty -= 20;
        }
        if (req.latestEndTime() != null && o.getEndTime().isAfter(req.latestEndTime())) {
            earliestLatestPenalty -= 20;
        }

        CompactnessPreference cp = req.compactnessPreference();
        if (cp != null && cp != CompactnessPreference.DONT_CARE) {
            Set<ScheduleDay> days = new HashSet<>();
            for (SelectedOffering s : contextWithoutThis) {
                days.addAll(s.offering().getPattern().days());
            }
            Set<ScheduleDay> after = new HashSet<>(days);
            after.addAll(o.getPattern().days());

            int beforeCount = days.size();
            int afterCount = after.size();

            if (cp == CompactnessPreference.COMPACT) {
                if (afterCount > beforeCount) compactnessPenalty -= (afterCount - beforeCount) * 10;
            } else if (cp == CompactnessPreference.BALANCED) {
                if (afterCount > beforeCount) compactnessPenalty -= (afterCount - beforeCount) * 4;
            }
        }

        if (Boolean.TRUE.equals(req.avoidLongGaps())) {
            gapPenalty -= estimateGapPenaltyIfAdded(o, contextWithoutThis);
        }

        CourseEntity c = o.getCourse();

        double recommendedYearBonus = 0;
        double recommendedSemesterBonus = 0;
        if (c.getRecommendedYear() == req.nextYearLevel()) recommendedYearBonus += 30;

        int expectedRecSemester = mapSemesterToRecommendedSemester(req.nextSemester());
        if (c.getRecommendedSemester() == expectedRecSemester) recommendedSemesterBonus += 15;

        double difficultyScore = difficultyScore(req.difficultyTarget(), c.getDifficulty());

        EnumMap<DifficultyBucket, Integer> currentCounts = countDifficultyBuckets(contextWithoutThis);
        DifficultyBucket bucket = bucketOf(c.getDifficulty());
        double difficultyQuotaAdjustment = difficultyQuotaAdjustment(quotas, currentCounts, bucket);

        double tagScore = tagScore(req.preferredTags(), c.getTags());

        double electiveBias = 0;

        double total = preferredDaysScore
                + avoidDaysScore
                + timeWindowScore
                + earliestLatestPenalty
                + compactnessPenalty
                + gapPenalty
                + recommendedYearBonus
                + recommendedSemesterBonus
                + difficultyScore
                + difficultyQuotaAdjustment
                + tagScore
                + electiveBias;

        return new ScoreBreakdownDto(
                preferredDaysScore,
                avoidDaysScore,
                timeWindowScore,
                earliestLatestPenalty,
                compactnessPenalty,
                gapPenalty,
                recommendedYearBonus,
                recommendedSemesterBonus,
                difficultyScore,
                difficultyQuotaAdjustment,
                tagScore,
                electiveBias,
                total
        );
    }

    // ----------------------------
    // Beam-search fallback implementation
    // ----------------------------

    private BeamResult beamSearchRebuild(
            GenerateScheduleRequest req,
            CourseCountRules rules,
            int desiredCount,
            Integer electiveTarget,
            Set<String> preferredTagsNorm,
            Map<Long, List<TermCourseOfferingEntity>> offeringsByCourseId,
            Set<Long> completedCourseIds,
            Set<String> completedCourseCodes,
            LinkedHashSet<Long> mustTake,
            List<Long> templateCourseIds,
            long completedElectiveCount,
            long completedElectiveHours,
            int completedHours
    ) {
        boolean enforceElectiveTags = electiveTarget != null && electiveTarget > 0 && preferredTagsNorm != null && !preferredTagsNorm.isEmpty();

        LinkedHashSet<Long> ordered = new LinkedHashSet<>();

        if (Boolean.TRUE.equals(req.pinMustTakesFirst()) && mustTake != null && !mustTake.isEmpty()) {
            for (Long id : mustTake) {
                if (id == null) continue;
                if (completedCourseIds.contains(id)) continue;
                ordered.add(id);
            }
        }

        if (templateCourseIds != null && !templateCourseIds.isEmpty()) {
            for (Long id : templateCourseIds) {
                if (id == null) continue;
                if (completedCourseIds.contains(id)) continue;
                ordered.add(id);
            }
        }

        // backlog inserted after template
        for (var e : offeringsByCourseId.entrySet()) {
            Long id = e.getKey();
            List<TermCourseOfferingEntity> opts = e.getValue();
            if (id == null || opts == null || opts.isEmpty()) continue;
            if (completedCourseIds.contains(id)) continue;
            if (ordered.contains(id)) continue;

            CourseEntity c = opts.getFirst().getCourse();
            if (c == null) continue;

            // ✅ Training-hours gate in beam ordering
            if (!trainingHoursEligible(c, completedHours)) continue;

            Integer ry = c.getRecommendedYear();
            if (ry == null) continue;

            if (ry < req.nextYearLevel()) {
                ordered.add(id);
            }
        }

        boolean electiveCapAlreadyReached =
                completedElectiveCount >= MAX_ELECTIVE_COURSES_LIFETIME ||
                        completedElectiveHours >= MAX_ELECTIVE_CREDIT_HOURS_LIFETIME;

        List<Long> rest = offeringsByCourseId.keySet().stream()
                .filter(id -> !completedCourseIds.contains(id))
                .filter(id -> !ordered.contains(id))
                .sorted()
                .toList();

        ordered.addAll(rest);
        List<Long> courseIdsOrdered = new ArrayList<>(ordered);

        BeamState start = new BeamState(
                0,
                new ArrayList<>(),
                new HashSet<>(),
                0.0,
                0,
                0,
                countDifficultyBuckets(List.of())
        );

        List<BeamState> beam = new ArrayList<>();
        beam.add(start);

        for (int idx = 0; idx < courseIdsOrdered.size(); idx++) {
            if (beam.isEmpty()) break;

            List<BeamState> next = new ArrayList<>();
            Long courseId = courseIdsOrdered.get(idx);

            for (BeamState st : beam) {
                if (st.selected.size() >= desiredCount) {
                    next.add(st.withIndex(idx + 1));
                    continue;
                }

                boolean isMust = Boolean.TRUE.equals(req.pinMustTakesFirst()) && mustTake != null && mustTake.contains(courseId);

                List<TermCourseOfferingEntity> options = offeringsByCourseId.get(courseId);
                options = (options == null ? List.of() : options);

                CourseEntity courseRef = options.isEmpty() ? null : options.getFirst().getCourse();

                // ✅ Training-hours gate in beam expansion
                boolean hoursOk = (courseRef == null) || trainingHoursEligible(courseRef, completedHours);
                if (!hoursOk) {
                    if (!isMust) next.add(st.withIndex(idx + 1));
                    else next.add(st.withIndex(idx + 1));
                    continue;
                }

                boolean prereqOk = courseRef == null || prerequisitesSatisfied(courseRef, completedCourseCodes);
                boolean electiveBlockedByLifetime = electiveCapAlreadyReached && courseRef != null && isElective(courseRef);

                if (!isMust) {
                    next.add(st.withIndex(idx + 1));
                }

                if (options.isEmpty() || !prereqOk || electiveBlockedByLifetime) {
                    if (isMust) {
                        next.add(st.withIndex(idx + 1));
                    }
                    continue;
                }

                if (courseRef != null) {
                    if (electiveTarget != null && electiveTarget >= 0 && isElective(courseRef) && st.selectedElectiveCount >= electiveTarget) {
                        if (isMust) {
                            next.add(st.withIndex(idx + 1));
                        }
                        continue;
                    }

                    if (enforceElectiveTags && electiveTarget != null && isElective(courseRef) && st.selectedElectiveCount < electiveTarget) {
                        if (!matchesAnyPreferredTag(courseRef.getTags(), preferredTagsNorm)) {
                            if (isMust) {
                                next.add(st.withIndex(idx + 1));
                            }
                            continue;
                        }
                    }

                    if (!canAddCourseByElectiveLimit(courseRef,
                            completedElectiveCount, completedElectiveHours,
                            st.selectedElectiveCount, st.selectedElectiveHours)) {
                        if (isMust) {
                            next.add(st.withIndex(idx + 1));
                        }
                        continue;
                    }
                }

                List<TermCourseOfferingEntity> top = topOfferingsForState(req, options, completedCourseCodes, st.selected, TOP_OFFERINGS_PER_COURSE, completedHours);
                if (top.isEmpty()) {
                    if (isMust) {
                        next.add(st.withIndex(idx + 1));
                    }
                    continue;
                }

                for (TermCourseOfferingEntity chosen : top) {
                    CourseEntity c = chosen.getCourse();

                    double stepScore = scoreOffering(req, chosen, st.selected);

                    if (c.getRecommendedYear() == req.nextYearLevel()) stepScore += 30;
                    int expectedRecSemester = mapSemesterToRecommendedSemester(req.nextSemester());
                    if (c.getRecommendedSemester() == expectedRecSemester) stepScore += 15;

                    stepScore += difficultyScore(req.difficultyTarget(), c.getDifficulty());

                    DifficultyBucket bucket = bucketOf(c.getDifficulty());
                    EnumMap<DifficultyBucket, Integer> quotas = difficultyQuotas(req.difficultyTarget(), desiredCount);
                    stepScore += difficultyQuotaAdjustment(quotas, st.difficultyCounts, bucket);

                    stepScore += tagScore(req.preferredTags(), c.getTags());
                    stepScore += electiveTargetScore(electiveTarget, st.selectedElectiveCount, c);

                    List<SelectedOffering> sel2 = new ArrayList<>(st.selected);
                    sel2.add(new SelectedOffering(chosen));

                    HashSet<Long> ids2 = new HashSet<>(st.selectedCourseIds);
                    ids2.add(c.getId());

                    long ec2 = st.selectedElectiveCount;
                    long eh2 = st.selectedElectiveHours;
                    if (isElective(c)) {
                        ec2++;
                        eh2 += c.getCreditHours();
                    }

                    EnumMap<DifficultyBucket, Integer> dc2 = new EnumMap<>(st.difficultyCounts);
                    dc2.put(bucket, dc2.getOrDefault(bucket, 0) + 1);

                    next.add(new BeamState(
                            idx + 1,
                            sel2,
                            ids2,
                            st.totalScore + stepScore,
                            ec2,
                            eh2,
                            dc2
                    ));
                }
            }

            next.sort((a, b) -> {
                int sa = a.selected.size();
                int sb = b.selected.size();
                if (sa != sb) return Integer.compare(sb, sa);
                return Double.compare(b.totalScore, a.totalScore);
            });

            if (next.size() > BEAM_WIDTH) {
                next = next.subList(0, BEAM_WIDTH);
            }

            beam = next;

            if (!beam.isEmpty() && beam.getFirst().selected.size() >= desiredCount) break;
        }

        if (beam.isEmpty()) return null;

        List<BeamState> sortedFinal = new ArrayList<>(beam);
        sortedFinal.sort((a, b) -> {
            boolean aMin = a.selected.size() >= rules.minRequired;
            boolean bMin = b.selected.size() >= rules.minRequired;
            if (aMin != bMin) return Boolean.compare(bMin, aMin);
            if (a.selected.size() != b.selected.size()) return Integer.compare(b.selected.size(), a.selected.size());
            return Double.compare(b.totalScore, a.totalScore);
        });

        BeamState best = sortedFinal.getFirst();

        List<String> beamWarnings = new ArrayList<>();

        if (Boolean.TRUE.equals(req.pinMustTakesFirst()) && mustTake != null && !mustTake.isEmpty()) {
            Set<Long> finalIds = best.selected.stream().map(s -> s.course().getId()).collect(Collectors.toSet());
            for (Long id : mustTake) {
                if (id == null) continue;
                if (completedCourseIds.contains(id)) continue;
                if (!finalIds.contains(id)) {
                    beamWarnings.add("Must-take could not be scheduled due to constraints/conflicts: courseId=" + id);
                }
            }
        }

        if (best.selected.size() < desiredCount) {
            beamWarnings.add("Could not reach desiredCourseCount due to constraints/availability/elective caps. Selected=" + best.selected.size() + ", Target=" + desiredCount);
        }

        boolean templateUsed = false;
        if (templateCourseIds != null && !templateCourseIds.isEmpty()) {
            Set<Long> finalIds = best.selected.stream().map(s -> s.course().getId()).collect(Collectors.toSet());
            for (Long id : templateCourseIds) {
                if (finalIds.contains(id)) {
                    templateUsed = true;
                    break;
                }
            }
        }

        return new BeamResult(best.selected, beamWarnings, templateUsed, best.totalScore);
    }

    private List<TermCourseOfferingEntity> topOfferingsForState(
            GenerateScheduleRequest req,
            List<TermCourseOfferingEntity> options,
            Set<String> completedCourseCodes,
            List<SelectedOffering> selected,
            int k,
            int completedHours
    ) {
        if (options == null || options.isEmpty()) return List.of();

        List<OfferingScored> scored = new ArrayList<>();
        for (TermCourseOfferingEntity o : options) {
            // ✅ Training-hours gate (redundant but safe)
            if (!trainingHoursEligible(o.getCourse(), completedHours)) continue;

            if (!prerequisitesSatisfied(o.getCourse(), completedCourseCodes)) continue;
            if (!respectsHardConstraints(req, o)) continue;
            if (conflictsWithSelected(o, selected)) continue;

            double s = scoreOffering(req, o, selected);
            scored.add(new OfferingScored(o, s));
        }

        scored.sort((a, b) -> {
            int cmp = Double.compare(b.score, a.score);
            if (cmp != 0) return cmp;
            return compareOfferingsDeterministic(a.offering, b.offering);
        });

        if (scored.isEmpty()) return List.of();

        int limit = Math.min(k, scored.size());
        List<TermCourseOfferingEntity> out = new ArrayList<>(limit);
        for (int i = 0; i < limit; i++) out.add(scored.get(i).offering);
        return out;
    }

    private record BeamResult(List<SelectedOffering> selected, List<String> selectionWarnings, boolean templateUsed, double totalScore) {}
    private record OfferingScored(TermCourseOfferingEntity offering, double score) {}

    private static final class BeamState {
        final int idx;
        final List<SelectedOffering> selected;
        final HashSet<Long> selectedCourseIds;
        final double totalScore;
        final long selectedElectiveCount;
        final long selectedElectiveHours;
        final EnumMap<DifficultyBucket, Integer> difficultyCounts;

        BeamState(int idx,
                  List<SelectedOffering> selected,
                  HashSet<Long> selectedCourseIds,
                  double totalScore,
                  long selectedElectiveCount,
                  long selectedElectiveHours,
                  EnumMap<DifficultyBucket, Integer> difficultyCounts) {
            this.idx = idx;
            this.selected = selected;
            this.selectedCourseIds = selectedCourseIds;
            this.totalScore = totalScore;
            this.selectedElectiveCount = selectedElectiveCount;
            this.selectedElectiveHours = selectedElectiveHours;
            this.difficultyCounts = difficultyCounts;
        }

        BeamState withIndex(int nextIdx) {
            return new BeamState(nextIdx, selected, selectedCourseIds, totalScore, selectedElectiveCount, selectedElectiveHours, difficultyCounts);
        }
    }

    // ----------------------------
    // Tag helpers (quote-safe)
    // ----------------------------

    private static Set<String> normalizePreferredTags(List<String> preferredTags) {
        if (preferredTags == null || preferredTags.isEmpty()) return Set.of();
        return preferredTags.stream()
                .filter(Objects::nonNull)
                .map(ScheduleGeneratorService::normalizeTag)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    private static boolean matchesAnyPreferredTag(String courseTagsCsv, Set<String> preferredTagsNorm) {
        if (preferredTagsNorm == null || preferredTagsNorm.isEmpty()) return true;
        if (courseTagsCsv == null || courseTagsCsv.isBlank()) return false;

        Set<String> tags = Arrays.stream(courseTagsCsv.split(","))
                .map(ScheduleGeneratorService::normalizeTag)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        for (String p : preferredTagsNorm) {
            if (tags.contains(p)) return true;
        }
        return false;
    }

    private static String normalizeTag(String t) {
        if (t == null) return null;
        String s = t.trim().toLowerCase();
        if (s.isEmpty()) return null;

        s = stripWrappingQuotes(s).trim();
        if (s.isEmpty()) return null;

        while (s.startsWith("\"") || s.startsWith("'")) s = s.substring(1).trim();
        while (s.endsWith("\"") || s.endsWith("'")) s = s.substring(0, s.length() - 1).trim();

        return s.isEmpty() ? null : s;
    }

    private static String stripWrappingQuotes(String s) {
        if (s == null) return null;

        boolean changed = true;
        while (changed) {
            changed = false;

            if (s.length() >= 2) {
                char first = s.charAt(0);
                char last = s.charAt(s.length() - 1);
                if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                    s = s.substring(1, s.length() - 1).trim();
                    changed = true;
                }
            }
        }
        return s;
    }

    // ----------------------------
    // Training-hours eligibility (by course ID)
    // ----------------------------

    private static int requiredTrainingHours(CourseEntity c) {
        if (c == null || c.getId() == null) return 0;
        long id = c.getId();

        if (id == COURSE_SEMINAR_ID) return 40;
        if (id == COURSE_ER1_ID || id == COURSE_ER2_ID || id == COURSE_ER3_ID || id == COURSE_INTERNSHIP_CERT_ID) return 90;

        return 0;
    }

    private static boolean trainingHoursEligible(CourseEntity c, int completedHours) {
        int req = requiredTrainingHours(c);
        return req == 0 || completedHours >= req;
    }

    private static CourseCountRules courseCountRules(Semester semester) {
        return switch (semester) {
            case FALL, SPRING -> new CourseCountRules(2, 6, 5);
            case SUMMER -> new CourseCountRules(1, 3, 1);
        };
    }

    private static int resolveTargetCount(Integer requested, CourseCountRules rules, List<String> warnings) {
        int target = (requested == null ? rules.defaultTarget : requested);

        if (target < rules.minRequired) {
            warnings.add("Requested course count " + target + " is below minimum for this semester. Adjusted to " + rules.minRequired + ".");
            target = rules.minRequired;
        }
        if (target > rules.maxAllowed) {
            warnings.add("Requested course count " + target + " exceeds maximum for this semester. Adjusted to " + rules.maxAllowed + ".");
            target = rules.maxAllowed;
        }
        return target;
    }

    private static Integer resolveElectiveTarget(Integer requestedElectives,
                                                 int targetCourses,
                                                 boolean lifetimeCapReached,
                                                 List<String> warnings) {
        if (requestedElectives == null) {
            if (lifetimeCapReached) {
                warnings.add("Elective lifetime limit already reached from completed courses; generator will avoid electives.");
            }
            return null;
        }

        int t = requestedElectives;

        if (t < 0) {
            warnings.add("Requested desiredElectiveCount " + t + " is invalid. Adjusted to 0.");
            t = 0;
        }

        if (t > targetCourses) {
            warnings.add("Requested desiredElectiveCount " + t + " exceeds targetCourses " + targetCourses + ". Adjusted to " + targetCourses + ".");
            t = targetCourses;
        }

        if (lifetimeCapReached && t > 0) {
            warnings.add("Elective lifetime limit already reached from completed courses; desiredElectiveCount forced to 0.");
            t = 0;
        }

        return t;
    }

    private boolean containsCourse(List<SelectedOffering> selected, Long courseId) {
        for (SelectedOffering s : selected) {
            if (s.course().getId().equals(courseId)) return true;
        }
        return false;
    }

    private void fillFromPool(
            GenerateScheduleRequest req,
            int desiredCount,
            Integer electiveTarget,
            Set<String> preferredTagsNorm,
            Map<Long, List<TermCourseOfferingEntity>> offeringsByCourseId,
            Set<Long> completedCourseIds,
            Set<String> completedCourseCodes,
            List<Long> excludeCourseIds,
            List<SelectedOffering> selected,
            List<String> warnings,
            long completedElectiveCount,
            long completedElectiveHours,
            long selectedElectiveCountStart,
            long selectedElectiveHoursStart,
            int completedHours
    ) {
        long selectedElectiveCount = selectedElectiveCountStart;
        long selectedElectiveHours = selectedElectiveHoursStart;

        boolean electiveCapAlreadyReached =
                completedElectiveCount >= MAX_ELECTIVE_COURSES_LIFETIME ||
                        completedElectiveHours >= MAX_ELECTIVE_CREDIT_HOURS_LIFETIME;

        boolean enforceElectiveTags = electiveTarget != null && electiveTarget > 0 && preferredTagsNorm != null && !preferredTagsNorm.isEmpty();
        boolean relaxedTagsOnceToMeetTarget = false;

        List<TermCourseOfferingEntity> pool = offeringsByCourseId.values().stream()
                .flatMap(List::stream)
                .filter(o -> !completedCourseIds.contains(o.getCourse().getId()))
                .filter(o -> !excludeCourseIds.contains(o.getCourse().getId()))
                .filter(o -> prerequisitesSatisfied(o.getCourse(), completedCourseCodes))
                .filter(o -> trainingHoursEligible(o.getCourse(), completedHours)) // ✅ Training-hours gate
                .filter(o -> !electiveCapAlreadyReached || !isElective(o.getCourse()))
                .toList();

        Map<Long, List<TermCourseOfferingEntity>> candidatesByCourse = pool.stream()
                .collect(Collectors.groupingBy(o -> o.getCourse().getId()));

        List<Long> courseOrder = candidatesByCourse.keySet().stream()
                .sorted()
                .toList();

        EnumMap<DifficultyBucket, Integer> quotas = difficultyQuotas(req.difficultyTarget(), desiredCount);

        while (selected.size() < desiredCount) {

            int remainingSlots = desiredCount - selected.size();
            int neededElectives = (electiveTarget == null) ? 0 : Math.max(0, electiveTarget - (int) selectedElectiveCount);
            boolean mustPickElectiveNow = electiveTarget != null && neededElectives > 0 && remainingSlots == neededElectives;

            TermCourseOfferingEntity best = null;
            double bestScore = Double.NEGATIVE_INFINITY;

            // If we MUST pick an elective now, but tags are enforced, we keep a backup (non-matching) elective
            TermCourseOfferingEntity bestNonMatchingElective = null;
            double bestNonMatchingElectiveScore = Double.NEGATIVE_INFINITY;

            EnumMap<DifficultyBucket, Integer> currentCounts = countDifficultyBuckets(selected);

            for (Long courseId : courseOrder) {
                if (containsCourse(selected, courseId)) continue;

                List<TermCourseOfferingEntity> opts = candidatesByCourse.get(courseId);
                if (opts == null || opts.isEmpty()) continue;

                TermCourseOfferingEntity chosen = chooseBestOfferingFromOptions(req, opts, completedCourseCodes, selected);
                if (chosen == null) continue;

                CourseEntity c = chosen.getCourse();

                // ✅ Training-hours gate (extra safety)
                if (!trainingHoursEligible(c, completedHours)) {
                    continue;
                }

                boolean elective = isElective(c);

                // ✅ Hard requirement when needed: if we must pick elective now, skip non-electives entirely
                if (mustPickElectiveNow && !elective) {
                    continue;
                }

                // ✅ Elective slot reservation: avoid picking a non-elective that would make reaching electiveTarget impossible
                if (!elective && electiveTarget != null && neededElectives > 0) {
                    int remainingAfter = remainingSlots - 1;
                    if (remainingAfter < neededElectives) {
                        continue;
                    }
                }

                // per-schedule elective cap/target
                if (electiveTarget != null && electiveTarget >= 0 && elective && selectedElectiveCount >= electiveTarget) {
                    continue;
                }

                // lifetime elective cap
                if (!canAddCourseByElectiveLimit(c, completedElectiveCount, completedElectiveHours, selectedElectiveCount, selectedElectiveHours)) {
                    continue;
                }

                // STRICT elective-by-tags while we still need electives:
                // - normally: block non-matching electives
                // - but if we MUST pick an elective now, keep a backup non-matching elective so we can still meet electiveTarget
                if (enforceElectiveTags && electiveTarget != null && elective && selectedElectiveCount < electiveTarget) {
                    boolean matches = matchesAnyPreferredTag(c.getTags(), preferredTagsNorm);
                    if (!matches) {
                        if (mustPickElectiveNow) {
                            double score = computeFullCandidateScore(req, chosen, selected, quotas, currentCounts, electiveTarget, selectedElectiveCount);
                            if (score > bestNonMatchingElectiveScore
                                    || (scoresEqual(score, bestNonMatchingElectiveScore) && isBetterOfferingTie(chosen, bestNonMatchingElective))) {
                                bestNonMatchingElectiveScore = score;
                                bestNonMatchingElective = chosen;
                            }
                        }
                        continue;
                    }
                }

                double score = computeFullCandidateScore(req, chosen, selected, quotas, currentCounts, electiveTarget, selectedElectiveCount);

                if (score > bestScore || (scoresEqual(score, bestScore) && isBetterOfferingTie(chosen, best))) {
                    bestScore = score;
                    best = chosen;
                }
            }

            if (best == null) {
                // If we're forced to pick an elective now, and strict tags blocked all electives,
                // relax tags ONCE to meet electiveTarget (still respecting time constraints/conflicts etc.)
                if (mustPickElectiveNow && bestNonMatchingElective != null) {
                    if (!relaxedTagsOnceToMeetTarget) {
                        warnings.add("No electives matched selected tags at the moment; tag restriction was relaxed to meet desiredElectiveCount.");
                        relaxedTagsOnceToMeetTarget = true;
                    }
                    best = bestNonMatchingElective;
                } else {
                    warnings.add("Could not reach desiredCourseCount due to constraints/availability/elective caps. Selected=" + selected.size() + ", Target=" + desiredCount);
                    break;
                }
            }

            selected.add(new SelectedOffering(best));
            if (isElective(best.getCourse())) {
                selectedElectiveCount++;
                selectedElectiveHours += best.getCourse().getCreditHours();
            }
        }
    }

    private static double computeFullCandidateScore(
            GenerateScheduleRequest req,
            TermCourseOfferingEntity chosen,
            List<SelectedOffering> selected,
            EnumMap<DifficultyBucket, Integer> quotas,
            EnumMap<DifficultyBucket, Integer> currentCounts,
            Integer electiveTarget,
            long selectedElectiveCount
    ) {
        CourseEntity c = chosen.getCourse();

        double score = scoreOfferingStatic(req, chosen, selected);

        if (c.getRecommendedYear() == req.nextYearLevel()) score += 30;
        int expectedRecSemester = mapSemesterToRecommendedSemesterStatic(req.nextSemester());
        if (c.getRecommendedSemester() == expectedRecSemester) score += 15;

        score += difficultyScoreStatic(req.difficultyTarget(), c.getDifficulty());

        DifficultyBucket bucket = bucketOf(c.getDifficulty());
        score += difficultyQuotaAdjustment(quotas, currentCounts, bucket);

        score += tagScoreStatic(req.preferredTags(), c.getTags());
        score += electiveTargetScore(electiveTarget, selectedElectiveCount, c);

        return score;
    }

    private static double electiveTargetScore(Integer electiveTarget, long selectedElectiveCount, CourseEntity course) {
        if (electiveTarget == null) return 0;

        boolean elective = isElective(course);

        if (selectedElectiveCount < electiveTarget) {
            return elective ? 24 : -6;
        }

        return elective ? -30 : 4;
    }

    private long[] recalcSelectedElectives(List<SelectedOffering> selected) {
        long count = 0;
        long hours = 0;
        for (SelectedOffering s : selected) {
            CourseEntity c = s.course();
            if (isElective(c)) {
                count++;
                hours += c.getCreditHours();
            }
        }
        return new long[]{count, hours};
    }

    private int mapSemesterToRecommendedSemester(Semester sem) {
        return mapSemesterToRecommendedSemesterStatic(sem);
    }

    private static int mapSemesterToRecommendedSemesterStatic(Semester sem) {
        return switch (sem) {
            case FALL -> 1;
            case SPRING -> 2;
            case SUMMER -> 3;
        };
    }

    private TermCourseOfferingEntity chooseBestOfferingForCourse(
            GenerateScheduleRequest req,
            Long courseId,
            Map<Long, List<TermCourseOfferingEntity>> offeringsByCourseId,
            Set<String> completedCourseCodes,
            List<SelectedOffering> selected,
            List<String> warnings,
            ExplainCtx explainCtx,
            ExplainPhase phase,
            int completedHours
    ) {
        List<TermCourseOfferingEntity> options = offeringsByCourseId.get(courseId);
        if (options == null || options.isEmpty()) {
            warnings.add("Course is not offered in " + req.nextSemester() + ": courseId=" + courseId);
            if (explainCtx != null) {
                explainCtx.addSkip(new SkipReasonDto(
                        phase, SkipReasonCode.NOT_OFFERED,
                        courseId, null, null,
                        "Course has no offerings in this semester."
                ));
            }
            return null;
        }

        CourseEntity c = options.getFirst().getCourse();

        // ✅ Training-hours gate
        if (!trainingHoursEligible(c, completedHours)) {
            int reqHours = requiredTrainingHours(c);
            warnings.add("Training hours requirement not met (skipped): "
                    + c.getCourseName() + " (" + c.getCourseCode() + "). Required=" + reqHours + ", Current=" + completedHours);

            if (explainCtx != null) {
                // Using existing code to avoid changing enums in other files
                explainCtx.addSkip(new SkipReasonDto(
                        phase, SkipReasonCode.PREREQUISITE_FAIL,
                        c.getId(), c.getCourseCode(), c.getCourseName(),
                        "Training hours requirement not met. Requires " + reqHours + " hours; current=" + completedHours + "."
                ));
            }
            return null;
        }

        if (!prerequisitesSatisfied(c, completedCourseCodes)) {
            warnings.add("Prerequisites not satisfied (skipped): " + c.getCourseName() + " (" + c.getCourseCode() + ")");
            if (explainCtx != null) {
                explainCtx.addSkip(new SkipReasonDto(
                        phase, SkipReasonCode.PREREQUISITE_FAIL,
                        c.getId(), c.getCourseCode(), c.getCourseName(),
                        "Prerequisites not satisfied based on completed course codes."
                ));
            }
            return null;
        }

        TermCourseOfferingEntity best = chooseBestOfferingFromOptions(req, options, completedCourseCodes, selected);
        if (best == null && explainCtx != null) {
            int hardFail = 0, conflictFail = 0, prereqFail = 0;
            int checked = 0;
            for (TermCourseOfferingEntity o : options) {
                checked++;
                if (!prerequisitesSatisfied(o.getCourse(), completedCourseCodes)) { prereqFail++; continue; }
                if (!respectsHardConstraints(req, o)) { hardFail++; continue; }
                if (conflictsWithSelected(o, selected)) { conflictFail++; continue; }
            }

            SkipReasonCode code;
            String detail;

            if (checked == 0) {
                code = SkipReasonCode.NO_FEASIBLE_SECTION;
                detail = "No offerings to evaluate.";
            } else if (prereqFail == checked) {
                code = SkipReasonCode.PREREQUISITE_FAIL;
                detail = "All sections failed prerequisites.";
            } else if (hardFail == checked) {
                code = SkipReasonCode.UNAVAILABLE_CONFLICT;
                detail = "All sections violate hard constraints (unavailable blocks/time limits).";
            } else if (conflictFail == checked) {
                code = SkipReasonCode.TIME_CONFLICT;
                detail = "All sections conflict with already selected schedule.";
            } else {
                code = SkipReasonCode.NO_FEASIBLE_SECTION;
                detail = "No section can satisfy all constraints simultaneously.";
            }

            explainCtx.addSkip(new SkipReasonDto(
                    phase, code,
                    c.getId(), c.getCourseCode(), c.getCourseName(),
                    detail
            ));
        }

        return best;
    }

    private TermCourseOfferingEntity chooseBestOfferingFromOptions(
            GenerateScheduleRequest req,
            List<TermCourseOfferingEntity> options,
            Set<String> completedCourseCodes,
            List<SelectedOffering> selected
    ) {
        if (options == null || options.isEmpty()) return null;

        // options already sorted deterministically at load-time, but keep safe:
        List<TermCourseOfferingEntity> sorted = new ArrayList<>(options);
        sorted.sort(ScheduleGeneratorService::compareOfferingsDeterministic);

        TermCourseOfferingEntity best = null;
        double bestScore = Double.NEGATIVE_INFINITY;

        for (TermCourseOfferingEntity o : sorted) {
            if (!prerequisitesSatisfied(o.getCourse(), completedCourseCodes)) continue;
            if (!respectsHardConstraints(req, o)) continue;
            if (conflictsWithSelected(o, selected)) continue;

            double s = scoreOffering(req, o, selected);

            if (s > bestScore || (scoresEqual(s, bestScore) && isBetterOfferingTie(o, best))) {
                bestScore = s;
                best = o;
            }
        }

        return best;
    }

    // IMPORTANT FIX: Normalize prereq code matching (robust against spaces/format differences)
    private boolean prerequisitesSatisfied(CourseEntity course, Set<String> completedCodes) {
        List<Prerequisites> prereqs = course.getPrerequisites();
        if (prereqs == null || prereqs.isEmpty()) return true;

        for (Prerequisites p : prereqs) {
            if (p == null) continue;

            String raw = p.getCode();
            String need = normalizeCourseCode(raw);
            if (need == null || need.isBlank()) continue;

            if (!completedCodes.contains(need)) {
                return false;
            }
        }
        return true;
    }

    private static String normalizeCourseCode(String code) {
        if (code == null) return null;
        String s = code.trim();
        if (s.isEmpty()) return null;

        s = s.replace(" ", "");
        s = s.toUpperCase();

        return s.isEmpty() ? null : s;
    }

    private boolean respectsHardConstraints(GenerateScheduleRequest req, TermCourseOfferingEntity offering) {
        TimeRanges.requireValid(offering.getStartTime(), offering.getEndTime(), "Offering time");

        if (req.unavailableBlocks() != null && !req.unavailableBlocks().isEmpty()) {
            for (UnavailableBlockDto b : req.unavailableBlocks()) {
                if (b == null) continue;
                TimeRanges.requireValid(b.from(), b.to(), "Unavailable block");
                for (ScheduleDay d : offering.getPattern().days()) {
                    if (d == b.day()) {
                        if (TimeRanges.overlaps(offering.getStartTime(), offering.getEndTime(), b.from(), b.to())) {
                            return false;
                        }
                    }
                }
            }
        }

        return true;
    }

    private boolean conflictsWithSelected(TermCourseOfferingEntity candidate, List<SelectedOffering> selected) {
        for (SelectedOffering so : selected) {
            if (offeringsConflict(candidate, so.offering())) {
                return true;
            }
        }
        return false;
    }

    private boolean offeringsConflict(TermCourseOfferingEntity a, TermCourseOfferingEntity b) {
        for (ScheduleDay da : a.getPattern().days()) {
            for (ScheduleDay db : b.getPattern().days()) {
                if (da == db) {
                    if (TimeRanges.overlaps(a.getStartTime(), a.getEndTime(), b.getStartTime(), b.getEndTime())) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private double scoreOffering(GenerateScheduleRequest req, TermCourseOfferingEntity o, List<SelectedOffering> selected) {
        return scoreOfferingStatic(req, o, selected);
    }

    private static double scoreOfferingStatic(GenerateScheduleRequest req, TermCourseOfferingEntity o, List<SelectedOffering> selected) {
        double score = 0;

        if (req.preferredDays() != null && !req.preferredDays().isEmpty()) {
            long hits = o.getPattern().days().stream().filter(req.preferredDays()::contains).count();
            score += hits * 8;
        }
        if (req.avoidDays() != null && !req.avoidDays().isEmpty()) {
            long hits = o.getPattern().days().stream().filter(req.avoidDays()::contains).count();
            score -= hits * 12;
        }

        if (req.preferredTimeWindows() != null && !req.preferredTimeWindows().isEmpty()) {
            boolean withinAny = false;
            for (TimeWindowDto w : req.preferredTimeWindows()) {
                if (w == null) continue;
                TimeRanges.requireValid(w.from(), w.to(), "Preferred time window");
                if (TimeRanges.within(o.getStartTime(), o.getEndTime(), w.from(), w.to())) {
                    withinAny = true;
                    break;
                }
            }
            score += withinAny ? 10 : -5;
        }

        if (req.earliestStartTime() != null && o.getStartTime().isBefore(req.earliestStartTime())) {
            score -= 20;
        }
        if (req.latestEndTime() != null && o.getEndTime().isAfter(req.latestEndTime())) {
            score -= 20;
        }

        CompactnessPreference cp = req.compactnessPreference();
        if (cp != null && cp != CompactnessPreference.DONT_CARE) {
            Set<ScheduleDay> days = new HashSet<>();
            for (SelectedOffering s : selected) {
                days.addAll(s.offering().getPattern().days());
            }
            Set<ScheduleDay> after = new HashSet<>(days);
            after.addAll(o.getPattern().days());

            int beforeCount = days.size();
            int afterCount = after.size();

            if (cp == CompactnessPreference.COMPACT) {
                if (afterCount > beforeCount) score -= (afterCount - beforeCount) * 10;
            } else if (cp == CompactnessPreference.BALANCED) {
                if (afterCount > beforeCount) score -= (afterCount - beforeCount) * 4;
            }
        }

        if (Boolean.TRUE.equals(req.avoidLongGaps())) {
            score -= estimateGapPenaltyIfAddedStatic(o, selected);
        }

        return score;
    }

    private double estimateGapPenaltyIfAdded(TermCourseOfferingEntity candidate, List<SelectedOffering> selected) {
        return estimateGapPenaltyIfAddedStatic(candidate, selected);
    }

    private static double estimateGapPenaltyIfAddedStatic(TermCourseOfferingEntity candidate, List<SelectedOffering> selected) {
        final int LONG_GAP_MIN = 90;
        double penalty = 0;

        Map<ScheduleDay, List<TimeRange>> map = new EnumMap<>(ScheduleDay.class);
        for (SelectedOffering s : selected) {
            for (ScheduleDay d : s.offering().getPattern().days()) {
                map.computeIfAbsent(d, k -> new ArrayList<>()).add(new TimeRange(s.offering().getStartTime(), s.offering().getEndTime()));
            }
        }
        for (ScheduleDay d : candidate.getPattern().days()) {
            map.computeIfAbsent(d, k -> new ArrayList<>()).add(new TimeRange(candidate.getStartTime(), candidate.getEndTime()));
        }

        for (var e : map.entrySet()) {
            List<TimeRange> ranges = e.getValue();
            ranges.sort(Comparator.comparing(tr -> tr.start));
            for (int i = 0; i + 1 < ranges.size(); i++) {
                TimeRange a = ranges.get(i);
                TimeRange b = ranges.get(i + 1);
                long gap = java.time.Duration.between(a.end, b.start).toMinutes();
                if (gap > LONG_GAP_MIN) {
                    penalty += (gap - LONG_GAP_MIN) / 15.0;
                }
            }
        }

        return penalty;
    }

    private double difficultyScore(DifficultyTarget target, String courseDifficulty) {
        return difficultyScoreStatic(target, courseDifficulty);
    }

    private static double difficultyScoreStatic(DifficultyTarget target, String courseDifficulty) {
        String d = (courseDifficulty == null ? "" : courseDifficulty.trim().toLowerCase());
        return switch (target) {
            case EASY -> {
                if (d.contains("easy")) yield 12;
                if (d.contains("medium")) yield 4;
                if (d.contains("hard")) yield -10;
                yield 0;
            }
            case HARD -> {
                if (d.contains("hard")) yield 12;
                if (d.contains("medium")) yield 4;
                if (d.contains("easy")) yield -6;
                yield 0;
            }
            case BALANCED -> {
                if (d.contains("medium")) yield 10;
                if (d.contains("easy")) yield 6;
                if (d.contains("hard")) yield 2;
                yield 0;
            }
        };
    }

    private double tagScore(List<String> preferredTags, String courseTagsCsv) {
        return tagScoreStatic(preferredTags, courseTagsCsv);
    }

    private static double tagScoreStatic(List<String> preferredTags, String courseTagsCsv) {
        if (preferredTags == null || preferredTags.isEmpty()) return 0;
        if (courseTagsCsv == null || courseTagsCsv.isBlank()) return 0;

        Set<String> prefs = preferredTags.stream()
                .filter(Objects::nonNull)
                .map(ScheduleGeneratorService::normalizeTag)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (prefs.isEmpty()) return 0;

        Set<String> tags = Arrays.stream(courseTagsCsv.split(","))
                .map(ScheduleGeneratorService::normalizeTag)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        long hits = prefs.stream().filter(tags::contains).count();
        return hits * 6;
    }

    private TermCourseOfferingEntity findAlternativeOffering(
            GenerateScheduleRequest req,
            TermCourseOfferingEntity primary,
            Map<Long, List<TermCourseOfferingEntity>> offeringsByCourseId,
            Set<String> completedCourseCodes,
            List<SelectedOffering> selected
    ) {
        if (!Boolean.TRUE.equals(req.returnAlternatives())) return null;

        List<TermCourseOfferingEntity> options = offeringsByCourseId.get(primary.getCourse().getId());
        if (options == null) return null;

        TermCourseOfferingEntity best = null;
        double bestScore = Double.NEGATIVE_INFINITY;

        for (TermCourseOfferingEntity o : options) {
            if (o.getId().equals(primary.getId())) continue;
            if (!prerequisitesSatisfied(o.getCourse(), completedCourseCodes)) continue;
            if (!respectsHardConstraints(req, o)) continue;

            List<SelectedOffering> withoutPrimary = selected.stream()
                    .filter(s -> !s.offering().getId().equals(primary.getId()))
                    .toList();
            if (conflictsWithSelected(o, withoutPrimary)) continue;

            double s = scoreOffering(req, o, withoutPrimary);
            if (s > bestScore || (scoresEqual(s, bestScore) && isBetterOfferingTie(o, best))) {
                bestScore = s;
                best = o;
            }
        }

        return best;
    }

    private ScheduleCourseSlotDto toCourseSlotDto(TermCourseOfferingEntity o, boolean sameAsPrimaryFlag) {
        CourseEntity c = o.getCourse();
        return new ScheduleCourseSlotDto(
                c.getId(),
                c.getCourseCode(),
                c.getCourseName(),
                o.getSectionCode(),
                OfferingSlots.meetings(o),
                sameAsPrimaryFlag
        );
    }

    private List<DayScheduleDto> buildWeeklyGrid(List<SelectedOffering> selected) {
        Map<ScheduleDay, List<DayBlockDto>> map = new EnumMap<>(ScheduleDay.class);
        for (ScheduleDay d : ScheduleDay.ALL) {
            map.put(d, new ArrayList<>());
        }

        for (SelectedOffering s : selected) {
            CourseEntity c = s.course();
            for (ScheduleDay d : s.offering().getPattern().days()) {
                map.get(d).add(new DayBlockDto(c.getId(), c.getCourseName(), s.offering().getStartTime(), s.offering().getEndTime()));
            }
        }

        List<DayScheduleDto> grid = new ArrayList<>();
        for (ScheduleDay d : ScheduleDay.ALL) {
            List<DayBlockDto> blocks = map.get(d);
            blocks.sort(Comparator.comparing(DayBlockDto::from));
            grid.add(new DayScheduleDto(d, blocks));
        }
        return grid;
    }

    private static boolean isElective(CourseEntity c) {
        String cat = (c == null ? null : c.getCategory());
        if (cat == null) return false;
        String s = cat.trim().toLowerCase();
        // Your values: "major compulsory", "major elective", "college requirement"
        return s.contains("elective");
    }

    private static boolean canAddCourseByElectiveLimit(
            CourseEntity course,
            long completedElectiveCount,
            long completedElectiveHours,
            long selectedElectiveCount,
            long selectedElectiveHours
    ) {
        if (!isElective(course)) return true;

        long newCount = completedElectiveCount + selectedElectiveCount + 1;
        long newHours = completedElectiveHours + selectedElectiveHours + course.getCreditHours();

        return newCount <= MAX_ELECTIVE_COURSES_LIFETIME && newHours <= MAX_ELECTIVE_CREDIT_HOURS_LIFETIME;
    }

    // ✅ Elective slot reservation (core)
    private static boolean wouldBlockElectiveTarget(
            int desiredCount,
            Integer electiveTarget,
            int currentSelectedCount,
            long currentSelectedElectives,
            CourseEntity candidateCourse
    ) {
        if (electiveTarget == null) return false;
        if (candidateCourse == null) return false;
        if (isElective(candidateCourse)) return false;

        int neededElectives = Math.max(0, electiveTarget - (int) currentSelectedElectives);
        if (neededElectives <= 0) return false;

        int remainingAfter = desiredCount - (currentSelectedCount + 1);
        return remainingAfter < neededElectives;
    }

    // ✅ Deterministic tie-breakers
    private static boolean scoresEqual(double a, double b) {
        return Math.abs(a - b) <= SCORE_EPS;
    }

    private static boolean isBetterOfferingTie(TermCourseOfferingEntity a, TermCourseOfferingEntity b) {
        if (b == null) return true;
        return compareOfferingsDeterministic(a, b) < 0;
    }

    // Sort by startTime, then endTime, then sectionCode, then id
    private static int compareOfferingsDeterministic(TermCourseOfferingEntity a, TermCourseOfferingEntity b) {
        if (a == b) return 0;
        if (a == null) return 1;
        if (b == null) return -1;

        int cmp = Comparator.nullsLast(LocalTime::compareTo).compare(a.getStartTime(), b.getStartTime());
        if (cmp != 0) return cmp;

        cmp = Comparator.nullsLast(LocalTime::compareTo).compare(a.getEndTime(), b.getEndTime());
        if (cmp != 0) return cmp;

        String sa = a.getSectionCode();
        String sb = b.getSectionCode();
        cmp = Comparator.nullsLast(String::compareTo).compare(sa, sb);
        if (cmp != 0) return cmp;

        Long ida = a.getId();
        Long idb = b.getId();
        return Comparator.nullsLast(Long::compareTo).compare(ida, idb);
    }

    private record SelectedOffering(TermCourseOfferingEntity offering) {
        CourseEntity course() {
            return offering.getCourse();
        }
    }

    private static final class TimeRange {
        final LocalTime start;
        final LocalTime end;

        TimeRange(LocalTime start, LocalTime end) {
            this.start = start;
            this.end = end;
        }
    }

    private record CourseCountRules(int minRequired, int maxAllowed, int defaultTarget) {}

    // ----------------------------
    // Difficulty balancing helpers
    // ----------------------------

    private enum DifficultyBucket {EASY, MEDIUM, HARD}

    private static DifficultyBucket bucketOf(String courseDifficulty) {
        String d = (courseDifficulty == null ? "" : courseDifficulty.trim().toLowerCase());
        if (d.contains("easy")) return DifficultyBucket.EASY;
        if (d.contains("hard")) return DifficultyBucket.HARD;
        return DifficultyBucket.MEDIUM;
    }

    private static EnumMap<DifficultyBucket, Integer> countDifficultyBuckets(List<SelectedOffering> selected) {
        EnumMap<DifficultyBucket, Integer> counts = new EnumMap<>(DifficultyBucket.class);
        counts.put(DifficultyBucket.EASY, 0);
        counts.put(DifficultyBucket.MEDIUM, 0);
        counts.put(DifficultyBucket.HARD, 0);

        for (SelectedOffering s : selected) {
            DifficultyBucket b = bucketOf(s.course().getDifficulty());
            counts.put(b, counts.get(b) + 1);
        }
        return counts;
    }

    private static EnumMap<DifficultyBucket, Integer> difficultyQuotas(DifficultyTarget target, int n) {
        n = Math.max(1, Math.min(6, n));

        int e = 0, m = 0, h = 0;

        switch (target) {
            case EASY -> {
                switch (n) {
                    case 1 -> { e = 1; }
                    case 2 -> { e = 2; }
                    case 3 -> { e = 2; m = 1; }
                    case 4 -> { e = 3; m = 1; }
                    case 5 -> { e = 3; m = 2; }
                    case 6 -> { e = 4; m = 2; }
                }
            }
            case BALANCED -> {
                switch (n) {
                    case 1 -> { m = 1; }
                    case 2 -> { e = 1; m = 1; }
                    case 3 -> { e = 1; m = 1; h = 1; }
                    case 4 -> { e = 1; m = 2; h = 1; }
                    case 5 -> { e = 1; m = 3; h = 1; }
                    case 6 -> { e = 1; m = 3; h = 2; }
                }
            }
            case HARD -> {
                switch (n) {
                    case 1 -> { h = 1; }
                    case 2 -> { m = 1; h = 1; }
                    case 3 -> { m = 1; h = 2; }
                    case 4 -> { m = 1; h = 3; }
                    case 5 -> { m = 2; h = 3; }
                    case 6 -> { m = 2; h = 4; }
                }
            }
        }

        EnumMap<DifficultyBucket, Integer> q = new EnumMap<>(DifficultyBucket.class);
        q.put(DifficultyBucket.EASY, e);
        q.put(DifficultyBucket.MEDIUM, m);
        q.put(DifficultyBucket.HARD, h);
        return q;
    }

    private static double difficultyQuotaAdjustment(
            EnumMap<DifficultyBucket, Integer> quotas,
            EnumMap<DifficultyBucket, Integer> currentCounts,
            DifficultyBucket candidateBucket
    ) {
        int have = currentCounts.getOrDefault(candidateBucket, 0);
        int need = quotas.getOrDefault(candidateBucket, 0);

        if (have < need) return 18;
        if (have == need) return 2;
        return -12;
    }
}
