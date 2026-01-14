package graduation.project.schedule.dto;

import java.util.List;

public record ScheduleCourseSlotDto(
        Long courseId,
        String courseCode,
        String courseName,
        String sectionCode,
        List<MeetingSlotDto> meetings,
        boolean isAlternativeSameAsPrimary
) {}
