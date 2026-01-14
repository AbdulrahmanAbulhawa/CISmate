package graduation.project.schedule.dto;

public record SelectedCourseWithAlternativeDto(
        ScheduleCourseSlotDto primary,
        ScheduleCourseSlotDto alternative
) {}
