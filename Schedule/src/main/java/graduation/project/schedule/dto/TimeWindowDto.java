package graduation.project.schedule.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public record TimeWindowDto(
        @NotNull LocalTime from,
        @NotNull LocalTime to
) {}
