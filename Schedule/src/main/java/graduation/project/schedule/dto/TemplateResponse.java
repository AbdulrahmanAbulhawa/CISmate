package graduation.project.schedule.dto;

import graduation.project.schedule.domain.enums.Semester;

import java.util.List;

public record TemplateResponse(
        Long id,
        Semester semester,
        Integer yearLevel,
        String title,
        List<TemplateCourseBrief> courses
) {}
