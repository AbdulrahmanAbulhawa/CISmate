package graduation.project.schedule.entity;

import graduation.project.schedule.domain.enums.Semester;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "schedule_preferred_template",
        indexes = {
                @Index(name = "idx_template_semester_year", columnList = "semester,year_level")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_template_semester_year", columnNames = {"semester", "year_level"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class PreferredScheduleTemplateEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Semester semester;

    @Column(name = "year_level", nullable = false)
    private Integer yearLevel;

    @Column(length = 128)
    private String title;

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    @Builder.Default
    private List<PreferredTemplateItemEntity> items = new ArrayList<>();

    public void replaceItems(List<PreferredTemplateItemEntity> newItems) {
        this.items.clear();
        if (newItems == null) return;
        for (PreferredTemplateItemEntity it : newItems) {
            it.setTemplate(this);
            this.items.add(it);
        }
    }
}
