package graduation.project.model;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "career_task",
        indexes = {
                @Index(name = "idx_task_career", columnList = "career_id")
        }
)
public class CareerTaskEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // bullet text
    @Column(nullable = false, columnDefinition = "text")
    private String text;

    // ordering on details page
    @Column(nullable = false)
    private int orderIndex;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "career_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_task_career"))
    private CareerEntity career;
}
