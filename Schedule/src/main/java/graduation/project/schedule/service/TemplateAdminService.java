package graduation.project.schedule.service;

import graduation.project.model.course.CourseEntity;
import graduation.project.schedule.dto.AdminTemplateUpsertRequest;
import graduation.project.schedule.dto.TemplateCourseBrief;
import graduation.project.schedule.dto.TemplateResponse;
import graduation.project.schedule.entity.PreferredScheduleTemplateEntity;
import graduation.project.schedule.entity.PreferredTemplateItemEntity;
import graduation.project.schedule.repo.CourseReadRepository;
import graduation.project.schedule.repo.PreferredScheduleTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TemplateAdminService {

    private final PreferredScheduleTemplateRepository templateRepository;
    private final CourseReadRepository courseReadRepository;

    @Transactional
    public TemplateResponse upsert(AdminTemplateUpsertRequest req) {
        PreferredScheduleTemplateEntity template = templateRepository
                .findBySemesterAndYearLevel(req.semester(), req.yearLevel())
                .orElseGet(() -> PreferredScheduleTemplateEntity.builder()
                        .semester(req.semester())
                        .yearLevel(req.yearLevel())
                        .build());

        template.setTitle(req.title());

        List<PreferredTemplateItemEntity> items = new ArrayList<>();
        int pos = 1;
        for (Long courseId : req.courseIds()) {
            CourseEntity course = courseReadRepository.findById(courseId)
                    .orElseThrow(() -> new IllegalArgumentException("Course not found: " + courseId));
            items.add(PreferredTemplateItemEntity.builder()
                    .course(course)
                    .position(pos++)
                    .build());
        }
        template.replaceItems(items);

        PreferredScheduleTemplateEntity saved = templateRepository.save(template);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public TemplateResponse get(graduation.project.schedule.domain.enums.Semester semester, Integer yearLevel) {
        PreferredScheduleTemplateEntity t = templateRepository
                .findBySemesterAndYearLevel(semester, yearLevel)
                .orElseThrow(() -> new IllegalArgumentException("Preferred template not found for " + semester + " year " + yearLevel));
        return toResponse(t);
    }

    @Transactional
    public void delete(graduation.project.schedule.domain.enums.Semester semester, Integer yearLevel) {
        templateRepository.findBySemesterAndYearLevel(semester, yearLevel)
                .ifPresent(templateRepository::delete);
    }

    private TemplateResponse toResponse(PreferredScheduleTemplateEntity t) {
        List<TemplateCourseBrief> courses = t.getItems().stream()
                .map(it -> new TemplateCourseBrief(
                        it.getCourse().getId(),
                        it.getCourse().getCourseCode(),
                        it.getCourse().getCourseName(),
                        it.getPosition()
                ))
                .toList();

        return new TemplateResponse(
                t.getId(),
                t.getSemester(),
                t.getYearLevel(),
                t.getTitle(),
                courses
        );
    }
}
