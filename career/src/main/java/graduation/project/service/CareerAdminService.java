// File: src/main/java/graduation/project/service/CareerAdminService.java
package graduation.project.service;

import graduation.project.dto.admin.*;
import graduation.project.model.*;
import graduation.project.model.course.CourseEntity;
import graduation.project.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class CareerAdminService {

    private final CareerRepository careerRepository;
    private final CareerTaskRepository taskRepository;
    private final CareerConceptRepository conceptRepository;
    private final CareerCourseRepository careerCourseRepository;
    private final CourseLookupRepository courseLookupRepository;

    // ───────────────────────────────
    // Career CRUD
    // ───────────────────────────────

    public CareerAdminResponse createCareer(CareerCreateRequest req) {
        String slug = safeTrim(req.slug());
        String name = safeTrim(req.name());
        String overview = safeTrim(req.overview());
        boolean active = req.active() == null || req.active();

        CareerScaleLevel demandLevel = req.demandLevel() == null ? CareerScaleLevel.MEDIUM : req.demandLevel();
        CareerScaleLevel salaryPotential = req.salaryPotential() == null ? CareerScaleLevel.MEDIUM : req.salaryPotential();
        CareerScaleLevel stressLevel = req.stressLevel() == null ? CareerScaleLevel.MEDIUM : req.stressLevel();
        CareerScaleLevel stabilityLevel = req.stabilityLevel() == null ? CareerScaleLevel.MEDIUM : req.stabilityLevel();

        if (isBlank(slug)) throw new IllegalArgumentException("slug is required");
        if (isBlank(name)) throw new IllegalArgumentException("name is required");
        if (isBlank(overview)) throw new IllegalArgumentException("overview is required");

        if (careerRepository.existsBySlug(slug)) {
            throw new IllegalArgumentException("Career slug already exists: " + slug);
        }

        CareerEntity c = CareerEntity.builder()
                .slug(slug)
                .name(name)
                .overview(overview)
                .active(active)
                .demandLevel(demandLevel)
                .salaryPotential(salaryPotential)
                .stressLevel(stressLevel)
                .stabilityLevel(stabilityLevel)
                .build();

        CareerEntity saved = careerRepository.save(c);

        return CareerAdminResponse.from(saved);
    }

    public CareerAdminResponse updateCareer(Long careerId, CareerUpdateRequest req) {
        CareerEntity c = careerRepository.findById(careerId)
                .orElseThrow(() -> new IllegalArgumentException("Career not found: " + careerId));

        if (req.slug() != null) {
            String slug = safeTrim(req.slug());
            if (isBlank(slug)) throw new IllegalArgumentException("slug cannot be blank");

            // enforce uniqueness only if changed
            if (!slug.equals(c.getSlug()) && careerRepository.existsBySlug(slug)) {
                throw new IllegalArgumentException("Career slug already exists: " + slug);
            }
            c.setSlug(slug);
        }

        if (req.name() != null) {
            String name = safeTrim(req.name());
            if (isBlank(name)) throw new IllegalArgumentException("name cannot be blank");
            c.setName(name);
        }

        if (req.overview() != null) {
            String overview = safeTrim(req.overview());
            if (isBlank(overview)) throw new IllegalArgumentException("overview cannot be blank");
            c.setOverview(overview);
        }

        if (req.active() != null) {
            c.setActive(req.active());
        }

        if (req.demandLevel() != null) {
            c.setDemandLevel(req.demandLevel());
        }
        if (req.salaryPotential() != null) {
            c.setSalaryPotential(req.salaryPotential());
        }
        if (req.stressLevel() != null) {
            c.setStressLevel(req.stressLevel());
        }
        if (req.stabilityLevel() != null) {
            c.setStabilityLevel(req.stabilityLevel());
        }

        CareerEntity saved = careerRepository.save(c);
        return CareerAdminResponse.from(saved);
    }

    public void softDeleteCareer(Long careerId) {
        CareerEntity c = careerRepository.findById(careerId)
                .orElseThrow(() -> new IllegalArgumentException("Career not found: " + careerId));
        c.setActive(false);
        careerRepository.save(c);
    }

    // ───────────────────────────────
    // Tasks
    // ───────────────────────────────

    public TextItemResponse addTask(Long careerId, TextItemCreateRequest req) {
        CareerEntity c = careerRepository.findById(careerId)
                .orElseThrow(() -> new IllegalArgumentException("Career not found: " + careerId));

        String text = safeTrim(req.text());
        if (isBlank(text)) throw new IllegalArgumentException("text is required");

        int nextIndex = nextTaskOrderIndex(careerId);

        CareerTaskEntity t = CareerTaskEntity.builder()
                .career(c)
                .text(text)
                .orderIndex(nextIndex)
                .build();

        CareerTaskEntity saved = taskRepository.save(t);
        return new TextItemResponse(saved.getId(), saved.getText(), saved.getOrderIndex());
    }

    public TextItemResponse updateTask(Long careerId, Long taskId, TextItemUpdateRequest req) {
        CareerTaskEntity t = taskRepository.findByIdAndCareerId(taskId, careerId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));

        if (req.text() != null) {
            String text = safeTrim(req.text());
            if (isBlank(text)) throw new IllegalArgumentException("text cannot be blank");
            t.setText(text);
        }

        if (req.orderIndex() != null) {
            if (req.orderIndex() < 0) throw new IllegalArgumentException("orderIndex must be >= 0");
            t.setOrderIndex(req.orderIndex());
        }

        CareerTaskEntity saved = taskRepository.save(t);
        return new TextItemResponse(saved.getId(), saved.getText(), saved.getOrderIndex());
    }

    public void deleteTask(Long careerId, Long taskId) {
        CareerTaskEntity t = taskRepository.findByIdAndCareerId(taskId, careerId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));
        taskRepository.delete(t);
    }

    // ───────────────────────────────
    // Concepts
    // ───────────────────────────────

    public TextItemResponse addConcept(Long careerId, TextItemCreateRequest req) {
        CareerEntity c = careerRepository.findById(careerId)
                .orElseThrow(() -> new IllegalArgumentException("Career not found: " + careerId));

        String text = safeTrim(req.text());
        if (isBlank(text)) throw new IllegalArgumentException("text is required");

        int nextIndex = nextConceptOrderIndex(careerId);

        CareerConceptEntity con = CareerConceptEntity.builder()
                .career(c)
                .text(text)
                .orderIndex(nextIndex)
                .build();

        CareerConceptEntity saved = conceptRepository.save(con);
        return new TextItemResponse(saved.getId(), saved.getText(), saved.getOrderIndex());
    }

    public TextItemResponse updateConcept(Long careerId, Long conceptId, TextItemUpdateRequest req) {
        CareerConceptEntity con = conceptRepository.findByIdAndCareerId(conceptId, careerId)
                .orElseThrow(() -> new IllegalArgumentException("Concept not found: " + conceptId));

        if (req.text() != null) {
            String text = safeTrim(req.text());
            if (isBlank(text)) throw new IllegalArgumentException("text cannot be blank");
            con.setText(text);
        }

        if (req.orderIndex() != null) {
            if (req.orderIndex() < 0) throw new IllegalArgumentException("orderIndex must be >= 0");
            con.setOrderIndex(req.orderIndex());
        }

        CareerConceptEntity saved = conceptRepository.save(con);
        return new TextItemResponse(saved.getId(), saved.getText(), saved.getOrderIndex());
    }

    public void deleteConcept(Long careerId, Long conceptId) {
        CareerConceptEntity con = conceptRepository.findByIdAndCareerId(conceptId, careerId)
                .orElseThrow(() -> new IllegalArgumentException("Concept not found: " + conceptId));
        conceptRepository.delete(con);
    }

    // ───────────────────────────────
    // Career ↔ Course
    // ───────────────────────────────

    public CareerCourseAdminResponse addCourse(Long careerId, CareerCourseAddRequest req) {
        CareerEntity c = careerRepository.findById(careerId)
                .orElseThrow(() -> new IllegalArgumentException("Career not found: " + careerId));

        if (req.courseId() == null) throw new IllegalArgumentException("courseId is required");

        CourseEntity course = courseLookupRepository.findById(req.courseId())
                .orElseThrow(() -> new IllegalArgumentException("Course not found: " + req.courseId()));

        if (careerCourseRepository.existsByCareerIdAndCourseId(careerId, req.courseId())) {
            throw new IllegalArgumentException("Course already linked to career");
        }

        int nextIndex = nextCareerCourseOrderIndex(careerId);

        CareerCourseEntity cc = CareerCourseEntity.builder()
                .career(c)
                .course(course)
                .note(safeTrim(req.note()))
                .orderIndex(nextIndex)
                .build();

        CareerCourseEntity saved = careerCourseRepository.save(cc);

        return new CareerCourseAdminResponse(
                saved.getId(),
                saved.getOrderIndex(),
                saved.getNote(),
                course.getId(),
                course.getCourseCode(),
                course.getCourseName()
        );
    }

    public void deleteCareerCourse(Long careerId, Long careerCourseId) {
        CareerCourseEntity cc = careerCourseRepository.findByIdAndCareerId(careerCourseId, careerId)
                .orElseThrow(() -> new IllegalArgumentException("CareerCourse not found: " + careerCourseId));
        careerCourseRepository.delete(cc);
    }

    // ───────────────────────────────
    // Helpers
    // ───────────────────────────────

    private int nextTaskOrderIndex(Long careerId) {
        Optional<CareerTaskEntity> top = taskRepository.findTopByCareerIdOrderByOrderIndexDesc(careerId);
        return top.map(t -> t.getOrderIndex() + 1).orElse(0);
    }

    private int nextConceptOrderIndex(Long careerId) {
        Optional<CareerConceptEntity> top = conceptRepository.findTopByCareerIdOrderByOrderIndexDesc(careerId);
        return top.map(con -> con.getOrderIndex() + 1).orElse(0);
    }

    private int nextCareerCourseOrderIndex(Long careerId) {
        Optional<CareerCourseEntity> top = careerCourseRepository.findTopByCareerIdOrderByOrderIndexDesc(careerId);
        return top.map(cc -> cc.getOrderIndex() + 1).orElse(0);
    }

    private static String safeTrim(String s) {
        return s == null ? null : s.trim();
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
