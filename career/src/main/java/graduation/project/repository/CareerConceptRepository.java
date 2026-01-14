package graduation.project.repository;

import graduation.project.model.CareerConceptEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CareerConceptRepository extends JpaRepository<CareerConceptEntity, Long> {

    List<CareerConceptEntity> findByCareerIdOrderByOrderIndexAsc(Long careerId);

    Optional<CareerConceptEntity> findTopByCareerIdOrderByOrderIndexDesc(Long careerId);

    Optional<CareerConceptEntity> findByIdAndCareerId(Long id, Long careerId);
}
