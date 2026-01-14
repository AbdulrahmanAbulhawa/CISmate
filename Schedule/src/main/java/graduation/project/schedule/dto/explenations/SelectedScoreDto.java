// File: Schedule/src/main/java/graduation/project/schedule/dto/SelectedScoreDto.java
package graduation.project.schedule.dto.explenations;

public record SelectedScoreDto(
        Long courseId,
        String courseCode,
        String courseName,
        String sectionCode,
        ExplainPhase selectedFromPhase,
        ScoreBreakdownDto breakdown
) {}
