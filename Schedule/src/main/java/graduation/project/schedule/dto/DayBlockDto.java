package graduation.project.schedule.dto;

import java.time.LocalTime;

public record DayBlockDto(
        Long courseId,
        String courseName,
        LocalTime from,
        LocalTime to
) {}
