package graduation.project.repository.profRepo;

import graduation.project.model.professor.ProfessorDTO;
import graduation.project.model.professor.ProfessorEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface Professor_repo extends JpaRepository<ProfessorEntity, Long> {

    @Query("""
        SELECT new graduation.project.model.professor.ProfessorDTO(
            p.id,
            p.name,
            p.title,
            p.email,
            p.department,
            p.office,
            p.imageUrl,
            p.tags,
            null
        )
        FROM ProfessorEntity p
        ORDER BY p.name ASC
    """)
    List<ProfessorDTO> GetAllProfessors();

    @EntityGraph(attributePaths = {"courses"})
    Optional<ProfessorEntity> findById(Long id);
}