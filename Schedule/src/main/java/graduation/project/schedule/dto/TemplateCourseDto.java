package graduation.project.schedule.dto;

public record TemplateCourseDto(
        Integer position,
        Long courseId,
        String courseCode,
        String courseName
) {}
