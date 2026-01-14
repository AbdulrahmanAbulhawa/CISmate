package graduation.project.schedule.dto;

import graduation.project.schedule.domain.enums.MeetingPattern;
import graduation.project.schedule.domain.enums.ScheduleDay;
import graduation.project.schedule.domain.enums.Semester;

import java.time.LocalTime;
import java.util.List;

public record OfferingResponse(
        Long id,
        Semester semester,
        Long courseId,
        String courseCode,
        String courseName,
        String sectionCode,
        MeetingPattern pattern,
        List<ScheduleDay> days,
        LocalTime startTime,
        LocalTime endTime
) {}
