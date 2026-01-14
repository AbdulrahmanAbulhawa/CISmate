package graduation.project.schedule.dto;

public record SelectedCourseOptionDto(
        ScheduleCourseSlotDto primary,
        ScheduleCourseSlotDto alternative
) {}
