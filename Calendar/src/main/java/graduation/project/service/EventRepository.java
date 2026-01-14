package graduation.project.service;

import graduation.project.models.EventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<EventEntity, Long> {

    // Personal events only
    List<EventEntity> findByOwnerId(String ownerId);

    // Personal events only (range)
    List<EventEntity> findByOwnerIdAndStartDateTimeBetween(
            String ownerId,
            LocalDateTime start,
            LocalDateTime end
    );

    // Visible events for a user = personal + global
    @Query("""
            select e
            from EventEntity e
            where (e.ownerId = :ownerId or e.globalEvent = true)
            order by e.startDateTime asc
            """)
    List<EventEntity> findVisibleToOwner(@Param("ownerId") String ownerId);

    // Visible events for a user in range = personal + global
    @Query("""
            select e
            from EventEntity e
            where (e.ownerId = :ownerId or e.globalEvent = true)
              and e.startDateTime >= :start
              and e.startDateTime <= :end
            order by e.startDateTime asc
            """)
    List<EventEntity> findVisibleToOwnerBetween(
            @Param("ownerId") String ownerId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    // Admin: list all global events
    List<EventEntity> findByGlobalEventTrueOrderByStartDateTimeAsc();

    // Admin: list all global events in range
    @Query("""
            select e
            from EventEntity e
            where e.globalEvent = true
              and e.startDateTime >= :start
              and e.startDateTime <= :end
            order by e.startDateTime asc
            """)
    List<EventEntity> findGlobalBetween(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );
}
