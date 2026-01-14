// File: src/main/java/graduation/project/service/CareerService.java
package graduation.project.service;

import graduation.project.USER.models.user.UserCompletedCourse;
import graduation.project.USER.repo.UserCompletedCourseRepo;
import graduation.project.dto.CareerDetailsDto;
import graduation.project.dto.CareerNameDto;
import graduation.project.model.CareerConceptEntity;
import graduation.project.model.CareerCourseEntity;
import graduation.project.model.CareerEntity;
import graduation.project.model.CareerScaleLevel;
import graduation.project.model.CareerTaskEntity;
import graduation.project.repository.CareerConceptRepository;
import graduation.project.repository.CareerCourseRepository;
import graduation.project.repository.CareerRepository;
import graduation.project.repository.CareerTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Student/user facing service:
 * - list careers (supports smart filters + BEST_FIT)
 * - career details by slug
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CareerService {

    private final CareerRepository careerRepository;
    private final CareerTaskRepository taskRepository;
    private final CareerConceptRepository conceptRepository;
    private final CareerCourseRepository courseRepository;

    // For personalized "BEST_FIT"
    private final UserCompletedCourseRepo userCompletedCourseRepo;

    /**
     * Careers list (supports filters):
     * - null/blank: all active careers (A-Z)
     * - HIGH_DEMAND: demandLevel == HIGH
     * - HIGH_SALARY: salaryPotential == HIGH
     * - LOW_STRESS_STABLE: stressLevel == LOW && stabilityLevel == HIGH
     * - BEST_FIT: personalized ranking using UserCompletedCourse grades
     */
    public List<CareerNameDto> getCareers(String filter, String userEmailOrNull) {

        String f = (filter == null) ? "" : filter.trim().toUpperCase(Locale.ROOT);

        return switch (f) {
            case "", "ALL" -> mapCareers(
                    careerRepository.findByActiveTrueOrderByNameAsc(),
                    null
            );

            case "HIGH_DEMAND" -> mapCareers(
                    careerRepository.findByActiveTrueAndDemandLevelOrderByNameAsc(CareerScaleLevel.HIGH),
                    null
            );

            case "HIGH_SALARY" -> mapCareers(
                    careerRepository.findByActiveTrueAndSalaryPotentialOrderByNameAsc(CareerScaleLevel.HIGH),
                    null
            );

            case "LOW_STRESS_STABLE" -> mapCareers(
                    careerRepository.findByActiveTrueAndStressLevelAndStabilityLevelOrderByNameAsc(
                            CareerScaleLevel.LOW,
                            CareerScaleLevel.HIGH
                    ),
                    null
            );

            case "BEST_FIT" -> getBestFitCareers(userEmailOrNull);

            default -> throw new IllegalArgumentException(
                    "Invalid filter: " + filter +
                            " (allowed: ALL, HIGH_DEMAND, HIGH_SALARY, LOW_STRESS_STABLE, BEST_FIT)"
            );
        };
    }

    private List<CareerNameDto> mapCareers(List<CareerEntity> careers, Map<Long, BestFitMeta> bestFitByCareerId) {
        List<CareerNameDto> result = new ArrayList<>(careers.size());

        for (CareerEntity c : careers) {
            BestFitMeta meta = bestFitByCareerId == null ? null : bestFitByCareerId.get(c.getId());

            result.add(new CareerNameDto(
                    c.getId(),
                    c.getSlug(),
                    c.getName(),
                    safeLevel(c.getDemandLevel()),
                    safeLevel(c.getSalaryPotential()),
                    safeLevel(c.getStressLevel()),
                    safeLevel(c.getStabilityLevel()),
                    meta == null ? null : meta.score,
                    meta == null ? null : meta.matched,
                    meta == null ? null : meta.total
            ));
        }

        return result;
    }

    private CareerScaleLevel safeLevel(CareerScaleLevel level) {
        return level == null ? CareerScaleLevel.MEDIUM : level;
    }

    // ───────────────────────────────
    // BEST_FIT (personalized)
    // ───────────────────────────────

    private List<CareerNameDto> getBestFitCareers(String userEmailOrNull) {

        if (userEmailOrNull == null || userEmailOrNull.isBlank()) {
            throw new IllegalArgumentException("Authentication required for filter=BEST_FIT");
        }

        // 1) Read user's completed courses + grades
        List<UserCompletedCourse> completions =
                userCompletedCourseRepo.findAllByUserEmailWithCourse(userEmailOrNull);

        // courseId -> normalized grade (0..1) if grade exists
        Map<Long, Double> gradeByCourseId = new HashMap<>();
        Set<Long> completedCourseIds = new HashSet<>();

        for (UserCompletedCourse uc : completions) {
            if (uc.getCourse() == null) continue;
            Long courseId = uc.getCourse().getId();
            if (courseId == null) continue;

            completedCourseIds.add(courseId);

            Double points = uc.getGradePoints();
            if (points == null && uc.getGradeLetter() != null) {
                points = uc.getGradeLetter().points();
            }

            if (points != null) {
                gradeByCourseId.put(courseId, normalizeGpaPoints(points));
            }
        }

        // 2) Load careers
        List<CareerEntity> careers = careerRepository.findByActiveTrueOrderByNameAsc();

        // 3) Score each career
        Map<Long, BestFitMeta> metaByCareerId = new HashMap<>(careers.size());

        for (CareerEntity career : careers) {

            List<CareerCourseEntity> rec =
                    courseRepository.findByCareerIdOrderByOrderIndexAsc(career.getId());

            Set<Long> recommendedIds = new HashSet<>();
            for (CareerCourseEntity cc : rec) {
                if (cc.getCourse() != null && cc.getCourse().getId() != null) {
                    recommendedIds.add(cc.getCourse().getId());
                }
            }

            int total = recommendedIds.size();
            if (total == 0) {
                metaByCareerId.put(career.getId(), new BestFitMeta(0.0, 0, 0));
                continue;
            }

            int matched = 0;
            List<Double> matchedGrades = new ArrayList<>();

            for (Long cid : recommendedIds) {
                if (completedCourseIds.contains(cid)) {
                    matched++;
                    Double g = gradeByCourseId.get(cid);
                    if (g != null) matchedGrades.add(g);
                }
            }

            double coverage = (double) matched / (double) total; // 0..1

            double avgGrade = 0.0; // 0..1
            if (!matchedGrades.isEmpty()) {
                double sum = 0.0;
                for (Double g : matchedGrades) sum += g;
                avgGrade = sum / matchedGrades.size();
            }

            // Score: prioritize performance, then coverage
            double score = 0.60 * avgGrade + 0.40 * coverage;

            metaByCareerId.put(career.getId(), new BestFitMeta(score, matched, total));
        }

        // 4) Sort careers by score desc (then by name asc)
        careers.sort((a, b) -> {
            BestFitMeta ma = metaByCareerId.get(a.getId());
            BestFitMeta mb = metaByCareerId.get(b.getId());

            double sa = ma == null ? 0.0 : ma.score;
            double sb = mb == null ? 0.0 : mb.score;

            int cmp = Double.compare(sb, sa);
            if (cmp != 0) return cmp;

            return a.getName().compareToIgnoreCase(b.getName());
        });

        return mapCareers(careers, metaByCareerId);
    }

    private double normalizeGpaPoints(double points) {
        // Your GradeLetter is on a 0..4 scale.
        double norm = points / 4.0;
        if (norm < 0.0) norm = 0.0;
        if (norm > 1.0) norm = 1.0;
        return norm;
    }

    private record BestFitMeta(double score, int matched, int total) {}

    // ───────────────────────────────
    // Career details by slug
    // ───────────────────────────────

    public CareerDetailsDto getCareerDetails(String slug) {

        CareerEntity career = careerRepository
                .findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> new IllegalArgumentException("Career not found: " + slug));

        // tasks
        List<CareerTaskEntity> taskEntities =
                taskRepository.findByCareerIdOrderByOrderIndexAsc(career.getId());

        List<String> tasks = new ArrayList<>(taskEntities.size());
        for (CareerTaskEntity t : taskEntities) {
            tasks.add(t.getText());
        }

        // concepts
        List<CareerConceptEntity> conceptEntities =
                conceptRepository.findByCareerIdOrderByOrderIndexAsc(career.getId());

        List<String> concepts = new ArrayList<>(conceptEntities.size());
        for (CareerConceptEntity con : conceptEntities) {
            concepts.add(con.getText());
        }

        // courses (names only)
        List<CareerCourseEntity> careerCourseEntities =
                courseRepository.findByCareerIdOrderByOrderIndexAsc(career.getId());

        List<String> courses = new ArrayList<>(careerCourseEntities.size());
        for (CareerCourseEntity cc : careerCourseEntities) {
            if (cc.getCourse() != null) {
                courses.add(cc.getCourse().getCourseName());
            }
        }

        return new CareerDetailsDto(
                career.getId(),
                career.getSlug(),
                career.getName(),
                career.getOverview(),
                safeLevel(career.getDemandLevel()),
                safeLevel(career.getSalaryPotential()),
                safeLevel(career.getStressLevel()),
                safeLevel(career.getStabilityLevel()),
                tasks,
                concepts,
                courses
        );
    }
}
