package graduation.project.model.course;

import java.util.List;

public record CourseDTO(
        String imageUrl,
        String courseName,
        String description,
        String difficulty,
        int creditHours,
        List<String> prerequisites,     // ✅ only codes or names
        String semesterOffered,
        List<String> professors,        // ✅ only names
        String assessment,
        List<String> resources,         // ✅ only URLs
        String category,
        int recommendedYear,
        int recommendedSemester
) {
}
