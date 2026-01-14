package graduation.project.schedule.util;

import graduation.project.schedule.domain.enums.ScheduleDay;
import graduation.project.schedule.dto.MeetingSlotDto;
import graduation.project.schedule.entity.TermCourseOfferingEntity;

import java.util.List;

public final class OfferingSlots {
    private OfferingSlots() {}

    public static List<ScheduleDay> days(TermCourseOfferingEntity o) {
        return o.getPattern().days();
    }

    public static List<MeetingSlotDto> meetings(TermCourseOfferingEntity o) {
        return o.getPattern().days().stream()
                .map(d -> new MeetingSlotDto(d, o.getStartTime(), o.getEndTime()))
                .toList();
    }
}
