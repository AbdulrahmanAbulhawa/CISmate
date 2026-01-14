// File: Schedule/src/main/java/graduation/project/schedule/dto/SkipReasonDto.java
package graduation.project.schedule.dto.explenations;

public record SkipReasonDto(
        ExplainPhase phase,
        SkipReasonCode reasonCode,
        Long courseId,
        String courseCode,
        String courseName,
        String detail
) {}
