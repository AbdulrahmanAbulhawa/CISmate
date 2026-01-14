// File: src/main/java/graduation/project/dto/CareerNameDto.java
package graduation.project.dto;

import graduation.project.model.CareerScaleLevel;

/**
 * Lightweight DTO for the careers list screen.
 * Example usage:
 * - GET /api/careers
 * - GET /api/careers?filter=HIGH_DEMAND
 * - GET /api/careers?filter=BEST_FIT (requires auth)
 */
public record CareerNameDto(
        Long id,
        String slug,
        String name,

        // admin-maintained badges
        CareerScaleLevel demandLevel,
        CareerScaleLevel salaryPotential,
        CareerScaleLevel stressLevel,
        CareerScaleLevel stabilityLevel,

        // personalized (BEST_FIT only) — otherwise null
        Double bestFitScore,
        Integer matchedRecommendedCourses,
        Integer totalRecommendedCourses
) {}
