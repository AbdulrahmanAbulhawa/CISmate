package graduation.project.schedule.dto;

import graduation.project.schedule.domain.enums.ScheduleDay;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public record UnavailableBlockDto(
        @NotNull ScheduleDay day,
        @NotNull LocalTime from,
        @NotNull LocalTime to,
        String note
) {}
