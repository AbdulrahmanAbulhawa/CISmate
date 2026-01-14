package graduation.project.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "events",
        indexes = {
                @Index(name = "idx_events_owner_start", columnList = "owner_id,start_date_time"),
                @Index(name = "idx_events_global_start", columnList = "global_event,start_date_time")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // User-defined title from Flutter (e.g. "Study OS", "Gym", "DB Midterm")
    @Column(nullable = false)
    private String title;

    // Optional details for bottom sheet
    @Column(length = 2000)
    private String description;

    // Event start
    @Column(name = "start_date_time", nullable = false)
    private LocalDateTime startDateTime;

    // Event end
    @Column(name = "end_date_time", nullable = false)
    private LocalDateTime endDateTime;

    // True = full day event
    @Column(nullable = false)
    @Builder.Default
    private boolean allDay = false;

    // The color the user chooses for this event in Flutter
    private String colorHex;

    // Location (room, building, etc.)
    private String location;

    /**
     * Personal event owner (student email from JWT).
     * NULL for global/admin events.
     */
    @Column(name = "owner_id")
    private String ownerId;

    /**
     * IMPORTANT:
     * Use Boolean (nullable) so Hibernate can add the column on an existing table with data.
     */
    @Column(name = "global_event")
    private Boolean globalEvent;

    /**
     * IMPORTANT:
     * nullable=true temporarily so Hibernate can add the column.
     */
    @Column(name = "created_by")
    private String createdBy;

    // Timestamps
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Compatibility helper:
     * Your services/controllers can keep using event.isGlobalEvent()
     * even though the field is Boolean.
     */
    public boolean isGlobalEvent() {
        return Boolean.TRUE.equals(globalEvent);
    }

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;

        // ensure non-null values for new records
        if (this.globalEvent == null) this.globalEvent = false;

        if (this.createdBy == null || this.createdBy.isBlank()) {
            if (this.ownerId != null && !this.ownerId.isBlank()) {
                this.createdBy = this.ownerId;
            } else {
                this.createdBy = "system";
            }
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();

        if (this.globalEvent == null) this.globalEvent = false;
        if (this.createdBy == null || this.createdBy.isBlank()) {
            if (this.ownerId != null && !this.ownerId.isBlank()) {
                this.createdBy = this.ownerId;
            } else {
                this.createdBy = "system";
            }
        }
    }
}
