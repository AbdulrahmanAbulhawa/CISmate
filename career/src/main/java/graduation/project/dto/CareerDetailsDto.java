// File: src/main/java/graduation/project/dto/CareerDetailsDto.java
package graduation.project.dto;

import graduation.project.model.CareerScaleLevel;

import java.util.List;

/**
 * Full details DTO for one career page.
 * Example usage: GET /api/careers/{slug} -> CareerDetailsDto
 */
public record CareerDetailsDto(
        Long id,
        String slug,
        String name,
        String overview,

        // admin-maintained badges
        CareerScaleLevel demandLevel,
        CareerScaleLevel salaryPotential,
        CareerScaleLevel stressLevel,
        CareerScaleLevel stabilityLevel,

        // ordered bullet lists
        List<String> tasks,
        List<String> concepts,

        // ordered course names only
        List<String> courses
) {}
