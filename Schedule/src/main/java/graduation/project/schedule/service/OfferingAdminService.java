package graduation.project.schedule.service;

import graduation.project.model.course.CourseEntity;
import graduation.project.schedule.dto.AdminOfferingUpsertRequest;
import graduation.project.schedule.dto.OfferingResponse;
import graduation.project.schedule.entity.TermCourseOfferingEntity;
import graduation.project.schedule.repo.CourseReadRepository;
import graduation.project.schedule.repo.TermCourseOfferingRepository;
import graduation.project.schedule.util.OfferingSlots;
import graduation.project.schedule.util.TimeRanges;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OfferingAdminService {

    private final TermCourseOfferingRepository offeringRepository;
    private final CourseReadRepository courseReadRepository;

    @Transactional
    public OfferingResponse create(AdminOfferingUpsertRequest req) {
        TimeRanges.requireValid(req.startTime(), req.endTime(), "Offering time");
        CourseEntity course = courseReadRepository.findById(req.courseId())
                .orElseThrow(() -> new IllegalArgumentException("Course not found: " + req.courseId()));

        TermCourseOfferingEntity entity = TermCourseOfferingEntity.builder()
                .semester(req.semester())
                .course(course)
                .sectionCode(req.sectionCode().trim())
                .pattern(req.pattern())
                .startTime(req.startTime())
                .endTime(req.endTime())
                .build();

        TermCourseOfferingEntity saved = offeringRepository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public OfferingResponse update(Long id, AdminOfferingUpsertRequest req) {
        TimeRanges.requireValid(req.startTime(), req.endTime(), "Offering time");
        TermCourseOfferingEntity entity = offeringRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Offering not found: " + id));

        CourseEntity course = courseReadRepository.findById(req.courseId())
                .orElseThrow(() -> new IllegalArgumentException("Course not found: " + req.courseId()));

        entity.setSemester(req.semester());
        entity.setCourse(course);
        entity.setSectionCode(req.sectionCode().trim());
        entity.setPattern(req.pattern());
        entity.setStartTime(req.startTime());
        entity.setEndTime(req.endTime());

        return toResponse(entity);
    }

    @Transactional
    public void delete(Long id) {
        offeringRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<OfferingResponse> listBySemester(graduation.project.schedule.domain.enums.Semester semester) {
        return offeringRepository.findBySemesterWithCourse(semester).stream()
                .map(this::toResponse)
                .toList();
    }

    private OfferingResponse toResponse(TermCourseOfferingEntity o) {
        CourseEntity c = o.getCourse();
        return new OfferingResponse(
                o.getId(),
                o.getSemester(),
                c.getId(),
                c.getCourseCode(),
                c.getCourseName(),
                o.getSectionCode(),
                o.getPattern(),
                OfferingSlots.days(o),
                o.getStartTime(),
                o.getEndTime()
        );
    }
}
