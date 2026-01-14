package graduation.project.repository;

import graduation.project.model.CareerTaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CareerTaskRepository extends JpaRepository<CareerTaskEntity, Long> {

    List<CareerTaskEntity> findByCareerIdOrderByOrderIndexAsc(Long careerId);

    Optional<CareerTaskEntity> findTopByCareerIdOrderByOrderIndexDesc(Long careerId);

    Optional<CareerTaskEntity> findByIdAndCareerId(Long id, Long careerId);
}
