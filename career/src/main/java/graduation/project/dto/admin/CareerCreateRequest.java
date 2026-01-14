// File: src/main/java/graduation/project/dto/admin/CareerCreateRequest.java
package graduation.project.dto.admin;

import graduation.project.model.CareerScaleLevel;

public record CareerCreateRequest(
        String slug,
        String name,
        String overview,
        Boolean active,

        // admin-maintained metadata (optional; defaults to MEDIUM when null)
        CareerScaleLevel demandLevel,
        CareerScaleLevel salaryPotential,
        CareerScaleLevel stressLevel,
        CareerScaleLevel stabilityLevel
) {}
