package graduation.project.schedule.dto;

import graduation.project.schedule.domain.enums.ScheduleDay;

import java.time.LocalTime;

public record MeetingSlotDto(
        ScheduleDay day,
        LocalTime from,
        LocalTime to
) {}
