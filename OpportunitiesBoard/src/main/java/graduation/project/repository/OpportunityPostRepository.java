package graduation.project.repository;

import graduation.project.model.OpportunityPostEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OpportunityPostRepository extends JpaRepository<OpportunityPostEntity, Long> {

    // Main board query: show only ACTIVE posts for a type, newest first
    List<OpportunityPostEntity> findByTypeAndStatusOrderByCreatedAtDesc(String type, String status);

    // For edit/delete ownership checks (optional use later)
    List<OpportunityPostEntity> findByCreatedByUserIdOrderByCreatedAtDesc(String createdByUserId);

    // For safety: load only if ACTIVE (useful for "interested" action)
    Optional<OpportunityPostEntity> findByIdAndStatus(Long id, String status);
}
