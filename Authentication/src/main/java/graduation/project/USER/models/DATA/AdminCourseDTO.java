package graduation.project.USER.models.DATA;

import java.util.List;

public record AdminCourseDTO(
        Long id,
        String courseCode,
        String courseName,
        String description,
        String difficulty,
        Integer creditHours,
        String semesterOffered,
        String category,
        Boolean hasLab,
        Boolean hasProject,
        Boolean hasGroupWork,
        String courseType,
        String assessment,
        String assessmentStyle,
        String tags,
        Integer recommendedYear,
        Integer recommendedSemester,
        List<String> prerequisites,
        List<String> professors,
        List<String> resources
) {}
