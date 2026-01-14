// File: Schedule/src/main/java/graduation/project/schedule/dto/AlternativeReasonDto.java
package graduation.project.schedule.dto.explenations;

public record AlternativeReasonDto(
        Long courseId,
        String courseCode,
        String courseName,
        AlternativeReasonCode reasonCode,
        String detail
) {}
