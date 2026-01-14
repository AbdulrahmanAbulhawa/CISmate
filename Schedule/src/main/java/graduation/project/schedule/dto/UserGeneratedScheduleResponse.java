package graduation.project.schedule.dto;

import graduation.project.schedule.domain.enums.Semester;

import java.util.List;

/**
 * Slim response for end-users (no testing/debug payload).
 */
public record UserGeneratedScheduleResponse(
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

        // elective-count summary
        Integer targetElectives,
        Integer achievedElectives,
        boolean metElectiveTarget
) {}
