package graduation.project.schedule.entity;

import graduation.project.model.course.CourseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "schedule_preferred_template_item",
        indexes = {
                @Index(name = "idx_template_item_template", columnList = "template_id"),
                @Index(name = "idx_template_item_course", columnList = "course_id")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_template_item_template_pos", columnNames = {"template_id", "position"}),
                @UniqueConstraint(name = "uk_template_item_template_course", columnNames = {"template_id", "course_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class PreferredTemplateItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "template_id", nullable = false)
    @ToString.Exclude
    private PreferredScheduleTemplateEntity template;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    @ToString.Exclude
    private CourseEntity course;

    @Column(nullable = false)
    private Integer position;
}
