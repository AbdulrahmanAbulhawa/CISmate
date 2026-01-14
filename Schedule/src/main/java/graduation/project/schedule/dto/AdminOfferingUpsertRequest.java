package graduation.project.schedule.dto;

import graduation.project.schedule.domain.enums.MeetingPattern;
import graduation.project.schedule.domain.enums.Semester;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public record AdminOfferingUpsertRequest(
        @NotNull Semester semester,
        @NotNull Long courseId,
        @NotBlank String sectionCode,
        @NotNull MeetingPattern pattern,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime
) {}
