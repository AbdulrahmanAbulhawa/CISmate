// File: Schedule/src/main/java/graduation/project/schedule/dto/ScoreBreakdownDto.java
package graduation.project.schedule.dto.explenations;

public record ScoreBreakdownDto(
        double preferredDaysScore,
        double avoidDaysScore,
        double timeWindowScore,
        double earliestLatestPenalty,
        double compactnessPenalty,
        double gapPenalty,

        double recommendedYearBonus,
        double recommendedSemesterBonus,
        double difficultyScore,
        double difficultyQuotaAdjustment,
        double tagScore,
        double electiveBias,

        double total
) {}
