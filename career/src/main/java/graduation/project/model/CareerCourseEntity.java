package graduation.project.model;

import jakarta.persistence.*;
import lombok.*;

// ✅ Change this import to match your real CourseEntity package
import graduation.project.model.course.CourseEntity;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "career_course",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_career_course",
                        columnNames = {"career_id", "course_id"}
                )
        },
        indexes = {
                @Index(name = "idx_cc_career", columnList = "career_id"),
                @Index(name = "idx_cc_course", columnList = "course_id")
        }
)
public class CareerCourseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // order of courses in details page
    @Column(nullable = false)
    private int orderIndex;

    // optional note (you can ignore it in student response)
    @Column(columnDefinition = "text")
    private String note;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "career_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_cc_career"))
    private CareerEntity career;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_cc_course"))
    private CourseEntity course;
}
