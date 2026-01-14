package graduation.project.USER.repo;

import graduation.project.model.course.CourseEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface adminCourseRepo extends JpaRepository<CourseEntity, Long> {

    // ✅ Plain findAll: collections will be loaded via SUBSELECT thanks to the annotations above
    List<CourseEntity> findAll();

    // (Optional) If you want professors preloaded in the list endpoint without touching the bags:
    @Query("select distinct c from CourseEntity c left join fetch c.professors")
    List<CourseEntity> findAllWithProfessors();

    // ✅ Still fine for a single course
    @EntityGraph(attributePaths = {"prerequisites", "resources", "professors"})
    Optional<CourseEntity> findById(Long id);
}
