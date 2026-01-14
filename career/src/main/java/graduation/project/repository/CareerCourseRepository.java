package graduation.project.repository;

import graduation.project.model.CareerCourseEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CareerCourseRepository extends JpaRepository<CareerCourseEntity, Long> {

    List<CareerCourseEntity> findByCareerIdOrderByOrderIndexAsc(Long careerId);

    Optional<CareerCourseEntity> findTopByCareerIdOrderByOrderIndexDesc(Long careerId);

    Optional<CareerCourseEntity> findByIdAndCareerId(Long id, Long careerId);

    boolean existsByCareerIdAndCourseId(Long careerId, Long courseId);
}
