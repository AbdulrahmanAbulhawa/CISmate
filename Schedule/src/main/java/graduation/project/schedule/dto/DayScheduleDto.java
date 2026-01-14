package graduation.project.schedule.dto;

import graduation.project.schedule.domain.enums.ScheduleDay;

import java.util.List;

public record DayScheduleDto(
        ScheduleDay day,
        List<DayBlockDto> blocks
) {}
