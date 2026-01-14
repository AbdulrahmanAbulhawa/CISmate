package graduation.project.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "opportunity_post",
        indexes = {
                @Index(name = "idx_op_type_status", columnList = "type,status"),
                @Index(name = "idx_op_created_at", columnList = "created_at")
        }
)
public class OpportunityPostEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * "GROUP" or "INTERNSHIP"
     */
    @Column(nullable = false, length = 20)
    private String type;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Column(nullable = false, length = 150)
    private String contactEmail;

    @Column(nullable = false, length = 50)
    private String contactPhone;

    // studentId or adminId
    @Column(name = "created_by_user_id", length = 80)
    private String createdByUserId;

    // only filled when type = INTERNSHIP (nullable for GROUP)
    @Column(name = "company_name", length = 150)
    private String companyName;

    /**
     * How many people are needed:
     * - GROUP: teammates wanted
     * - INTERNSHIP: interns needed
     */
    @Column(name = "slots_needed", nullable = false)
    private int slotsNeeded;

    @Column(name = "interested_count", nullable = false)
    private int interestedCount;

    /**
     * "ACTIVE" or "FULL"
     */
    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null || status.isBlank()) status = "ACTIVE";
        if (interestedCount < 0) interestedCount = 0;
    }
}
