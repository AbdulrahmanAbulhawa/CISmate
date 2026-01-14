package graduation.project.schedule.dto;

public record TemplateCourseBrief(
        Long courseId,
        String courseCode,
        String courseName,
        Integer position
) {}
