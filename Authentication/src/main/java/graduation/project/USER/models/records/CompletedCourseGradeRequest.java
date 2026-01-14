// File: src/main/java/graduation/project/USER/models/records/CompletedCourseGradeRequest.java
package graduation.project.USER.models.records;

public record CompletedCourseGradeRequest(
        Long courseId,
        String gradeLetter // e.g. "A-", "B+", "C"
) {}
