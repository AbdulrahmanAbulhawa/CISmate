// File: src/main/java/graduation/project/dto/admin/CareerAdminResponse.java
package graduation.project.dto.admin;

import graduation.project.model.CareerEntity;
import graduation.project.model.CareerScaleLevel;

public record CareerAdminResponse(
        Long id,
        String slug,
        String name,
        String overview,
        boolean active,

        CareerScaleLevel demandLevel,
        CareerScaleLevel salaryPotential,
        CareerScaleLevel stressLevel,
        CareerScaleLevel stabilityLevel
) {
    public static CareerAdminResponse from(CareerEntity c) {
        return new CareerAdminResponse(
                c.getId(),
                c.getSlug(),
                c.getName(),
                c.getOverview(),
                c.isActive(),
                c.getDemandLevel(),
                c.getSalaryPotential(),
                c.getStressLevel(),
                c.getStabilityLevel()
        );
    }
}
