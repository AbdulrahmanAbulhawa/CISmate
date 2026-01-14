package graduation.project.schedule.util;

import java.time.LocalTime;

public final class TimeRanges {
    private TimeRanges() {}

    public static void requireValid(LocalTime start, LocalTime end, String messagePrefix) {
        if (start == null || end == null) throw new IllegalArgumentException(messagePrefix + ": start/end time is null");
        if (!start.isBefore(end)) {
            throw new IllegalArgumentException(messagePrefix + ": startTime must be before endTime");
        }
    }

    public static boolean overlaps(LocalTime aStart, LocalTime aEnd, LocalTime bStart, LocalTime bEnd) {
        // [start, end) overlap check
        return aStart.isBefore(bEnd) && bStart.isBefore(aEnd);
    }

    public static boolean within(LocalTime start, LocalTime end, LocalTime windowStart, LocalTime windowEnd) {
        return !start.isBefore(windowStart) && !end.isAfter(windowEnd);
    }
}
