// File: src/main/java/graduation/project/dto/admin/CareerUpdateRequest.java
package graduation.project.dto.admin;

import graduation.project.model.CareerScaleLevel;

public record CareerUpdateRequest(
        String slug,
        String name,
        String overview,
        Boolean active,

        // admin-maintained metadata (optional; when null -> no change)
        CareerScaleLevel demandLevel,
        CareerScaleLevel salaryPotential,
        CareerScaleLevel stressLevel,
        CareerScaleLevel stabilityLevel
) {}
