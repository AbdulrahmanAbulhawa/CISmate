// File: Schedule/src/main/java/graduation/project/schedule/dto/GeneratedScheduleResponse.java
package graduation.project.schedule.dto;

import graduation.project.schedule.domain.enums.Semester;
import graduation.project.schedule.dto.explenations.*;
import graduation.project.schedule.dto.explenations.SkipReasonDto;

import java.util.List;

public record GeneratedScheduleResponse(
        Semester semester,
        Integer yearLevel,
        boolean templateUsed,
        List<SelectedCourseOptionDto> selected,
        List<DayScheduleDto> weeklyGrid,
        List<String> warnings,

        // course-count summary
        Integer targetCourses,
        Integer achievedCourses,
        Integer minRequired,
        boolean metMinimum,

        // elective-count summary (per schedule)
        Integer targetElectives,      // nullable when user didn't request a target
        Integer achievedElectives,
        boolean metElectiveTarget,    // true if no target OR achieved >= target (won't exceed anyway)

        // NEW: Explain mode outputs (nullable unless explain=true)
        List<SkipReasonDto> skipReasons,
        List<AlternativeReasonDto> alternativeReasons,
        List<SelectedScoreDto> selectedScoreBreakdown
) {}
