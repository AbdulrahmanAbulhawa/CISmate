// File: src/main/java/graduation/project/USER/models/records/CompletedCourseGradeDTO.java
package graduation.project.USER.models.records;

public record CompletedCourseGradeDTO(
        Long courseId,
        String courseCode,
        String courseName,
        String gradeLetter, // e.g. "A-"
        Double gradePoints  // e.g. 3.7
) {}
