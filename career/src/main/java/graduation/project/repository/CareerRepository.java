// File: src/main/java/graduation/project/repository/CareerRepository.java
package graduation.project.repository;

import graduation.project.model.CareerEntity;
import graduation.project.model.CareerScaleLevel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CareerRepository extends JpaRepository<CareerEntity, Long> {

    List<CareerEntity> findByActiveTrueOrderByNameAsc();

    Optional<CareerEntity> findBySlugAndActiveTrue(String slug);

    boolean existsBySlug(String slug);

    Optional<CareerEntity> findBySlug(String slug);

    // ───────────────────────────────
    // Smart filters (admin-maintained)
    // ───────────────────────────────

    List<CareerEntity> findByActiveTrueAndDemandLevelOrderByNameAsc(CareerScaleLevel demandLevel);

    List<CareerEntity> findByActiveTrueAndSalaryPotentialOrderByNameAsc(CareerScaleLevel salaryPotential);

    List<CareerEntity> findByActiveTrueAndStressLevelAndStabilityLevelOrderByNameAsc(
            CareerScaleLevel stressLevel,
            CareerScaleLevel stabilityLevel
    );
}
