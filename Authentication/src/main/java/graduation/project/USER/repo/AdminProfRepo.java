package graduation.project.USER.repo;

import graduation.project.model.professor.ProfessorEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdminProfRepo extends JpaRepository<ProfessorEntity, Long> {

    // Preload courses to avoid N+1 when listing (Set is not a bag → safe to join fetch)
    @EntityGraph(attributePaths = {"courses"})
    List<ProfessorEntity> findAll();

    // Preload courses for single professor
    @EntityGraph(attributePaths = {"courses"})
    Optional<ProfessorEntity> findById(Long id);
}
