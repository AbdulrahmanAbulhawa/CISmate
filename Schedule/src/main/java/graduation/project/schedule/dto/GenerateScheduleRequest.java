// File: Schedule/src/main/java/graduation/project/schedule/dto/GenerateScheduleRequest.java
package graduation.project.schedule.dto;

import graduation.project.schedule.domain.enums.CompactnessPreference;
import graduation.project.schedule.domain.enums.DifficultyTarget;
import graduation.project.schedule.domain.enums.ScheduleDay;
import graduation.project.schedule.domain.enums.Semester;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;
import java.util.List;

public record GenerateScheduleRequest(
        @NotNull Semester nextSemester,
        @NotNull @Min(1) @Max(4) Integer nextYearLevel,

        /**
         * Target course count the student wants the generator to TRY to reach.
         * Actual allowed ranges are enforced by semester type in the service:
         * - FALL/SPRING: 2..6 (default 5)
         * - SUMMER:      1..3 (default 1)
         */
        @Min(1) @Max(6) Integer desiredCourseCount,

        /**
         * Target number of ELECTIVE courses inside this generated schedule.
         * - If null: no per-schedule elective target/cap is applied (only lifetime elective cap still applies).
         * - If provided: generator will try to reach it AND will not exceed it.
         * - It will be clamped to [0..targetCourses] (and forced to 0 if lifetime cap already reached).
         */
        @Min(0) @Max(6) Integer desiredElectiveCount,

        @NotNull DifficultyTarget difficultyTarget,

        List<Long> mustTakeCourseIds,

        /**
         * Tags chosen by the user from dropdown (usually electives-related).
         * If desiredElectiveCount > 0 and preferredTags is non-empty:
         * the generator will ONLY pick electives that match at least one selected tag (strict).
         */
        @Size(max = 5) List<String> preferredTags,

        Boolean pinMustTakesFirst,
        Boolean returnAlternatives,

        // Soft day/time preferences
        List<ScheduleDay> preferredDays,
        List<ScheduleDay> avoidDays,
        @Valid List<TimeWindowDto> preferredTimeWindows,
        LocalTime earliestStartTime,
        LocalTime latestEndTime,

        // Hard constraints
        @Valid List<UnavailableBlockDto> unavailableBlocks,

        // Schedule quality
        CompactnessPreference compactnessPreference,
        Boolean avoidLongGaps,

        /**
         * NEW: Explain mode.
         * If true, the response will include structured skip reasons + alternative reasons + (optional) score breakdown.
         */
        Boolean explain
) {
    public GenerateScheduleRequest {
        if (pinMustTakesFirst == null) pinMustTakesFirst = Boolean.TRUE;
        if (returnAlternatives == null) returnAlternatives = Boolean.TRUE;
        if (avoidLongGaps == null) avoidLongGaps = Boolean.TRUE;
        if (explain == null) explain = Boolean.FALSE;
    }
}
