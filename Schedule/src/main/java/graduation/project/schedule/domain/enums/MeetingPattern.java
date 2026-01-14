package graduation.project.schedule.domain.enums;

import java.util.List;

/**
 * In JU, courses are typically either Sun/Tue/Thu or Mon/Wed for the whole semester.
 */
public enum MeetingPattern {
    SUN_TUE_THU(List.of(ScheduleDay.SUNDAY, ScheduleDay.TUESDAY, ScheduleDay.THURSDAY)),
    MON_WED(List.of(ScheduleDay.MONDAY, ScheduleDay.WEDNESDAY));

    private final List<ScheduleDay> days;

    MeetingPattern(List<ScheduleDay> days) {
        this.days = List.copyOf(days);
    }

    public List<ScheduleDay> days() {
        return days;
    }
}
