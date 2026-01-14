package graduation.project.schedule.domain.enums;

import java.util.List;

/**
 * JU scheduling days: Sunday–Thursday only (no Friday/Saturday).
 */
public enum ScheduleDay {
    SUNDAY,
    MONDAY,
    TUESDAY,
    WEDNESDAY,
    THURSDAY;

    public static final List<ScheduleDay> ALL = List.of(values());
}
