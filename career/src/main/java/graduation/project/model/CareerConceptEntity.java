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
        name = "career_concept",
        indexes = {
                @Index(name = "idx_concept_career", columnList = "career_id")
        }
)
public class CareerConceptEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // concept/knowledge bullet text
    @Column(nullable = false, columnDefinition = "text")
    private String text;

    @Column(nullable = false)
    private int orderIndex;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "career_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_concept_career"))
    private CareerEntity career;
}
