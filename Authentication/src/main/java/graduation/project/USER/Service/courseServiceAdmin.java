package graduation.project.USER.Service;

import graduation.project.model.Items.Prerequisites;
import graduation.project.model.course.CourseEntity;
import graduation.project.model.professor.ProfessorEntity;
import graduation.project.USER.repo.adminCourseRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class courseServiceAdmin {

    private final adminCourseRepo repo;

    public courseServiceAdmin(adminCourseRepo repo) {
        this.repo = repo;
    }

    /* =============== Read =============== */

    @Transactional(readOnly = true)
    public List<CourseAdminDTO> listAll() {
        // Option A (simplest): rely on SUBSELECT for all collections
        var list = repo.findAll();

        // Option B (if you want professors preloaded in the same round-trip)
        // var list = repo.findAllWithProfessors();

        return list.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public CourseAdminDTO getOne(Long id) {
        var c = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Course not found: " + id));
        return toDto(c);
    }

    /* =========== Create / Update ========= */

    @Transactional
    public CourseAdminDTO create(CourseAdminDTO dto) {
        var e = new CourseEntity();
        mapScalarFields(dto, e);
        var saved = repo.save(e);
        return toDto(saved);
    }

    @Transactional
    public CourseAdminDTO update(Long id, CourseAdminDTO dto) {
        var e = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Course not found: " + id));
        mapScalarFields(dto, e);
        var saved = repo.save(e);
        return toDto(saved);
    }

    /* =============== Delete ============== */

    @Transactional
    public void deleteById(Long id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(NOT_FOUND, "Course not found: " + id);
        }
        repo.deleteById(id);
    }

    /* ============== Helpers ============== */

    private void mapScalarFields(CourseAdminDTO d, CourseEntity e) {
        e.setCourseCode(d.courseCode());
        e.setCourseName(d.courseName());
        e.setDescription(d.description());
        e.setDifficulty(d.difficulty());
        e.setCreditHours(Objects.requireNonNullElse(d.creditHours(), 0));
        e.setSemesterOffered(d.semesterOffered());
        e.setCategory(d.category());
        e.setHasLab(Boolean.TRUE.equals(d.hasLab()));
        e.setHasProject(Boolean.TRUE.equals(d.hasProject()));
        e.setHasGroupWork(Boolean.TRUE.equals(d.hasGroupWork()));
        e.setCourseType(d.courseType());
        e.setAssessment(d.assessment());
        e.setAssessmentStyle(d.assessmentStyle());
        e.setTags(d.tags());
        e.setRecommendedYear(Objects.requireNonNullElse(d.recommendedYear(), 0));
        e.setRecommendedSemester(Objects.requireNonNullElse(d.recommendedSemester(), 0));

        // NOTE: For admin writes of prerequisites/resources/professors,
        // add separate write DTOs or IDs-based mapping as you prefer.
    }

    private CourseAdminDTO toDto(CourseEntity c) {
        var prereqNames = c.getPrerequisites() == null ? List.<String>of()
                : c.getPrerequisites().stream()
                .map(Prerequisites::getName)
                .filter(Objects::nonNull)
                .toList();

        var professorNames = c.getProfessors() == null ? List.<String>of()
                : c.getProfessors().stream()
                .map(ProfessorEntity::getName)
                .filter(Objects::nonNull)
                .toList();

        var resourceStrings = c.getResources() == null ? List.<String>of()
                : c.getResources().stream()
                .map(r -> (r.getTitle() == null ? "" : r.getTitle()) + " - " +
                        (r.getUrl() == null ? "" : r.getUrl()))
                .toList();

        return new CourseAdminDTO(
                c.getId(),
                c.getCourseCode(),
                c.getCourseName(),
                c.getDescription(),
                c.getDifficulty(),
                c.getCreditHours(),
                c.getSemesterOffered(),
                c.getCategory(),
                c.isHasLab(),
                c.isHasProject(),
                c.isHasGroupWork(),
                c.getCourseType(),
                c.getAssessment(),
                c.getAssessmentStyle(),
                c.getTags(),
                c.getRecommendedYear(),
                c.getRecommendedSemester(),
                prereqNames,
                professorNames,
                resourceStrings
        );
    }

    /* ===== Inline DTO (keeps your packages tidy if you prefer) ===== */
    public record CourseAdminDTO(
            Long id,
            String courseCode,
            String courseName,
            String description,
            String difficulty,
            Integer creditHours,
            String semesterOffered,
            String category,
            Boolean hasLab,
            Boolean hasProject,
            Boolean hasGroupWork,
            String courseType,
            String assessment,
            String assessmentStyle,
            String tags,
            Integer recommendedYear,
            Integer recommendedSemester,
            List<String> prerequisites,
            List<String> professors,
            List<String> resources
    ) {}
}
