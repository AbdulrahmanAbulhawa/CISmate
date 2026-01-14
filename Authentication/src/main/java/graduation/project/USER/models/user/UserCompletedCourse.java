// File: src/main/java/graduation/project/USER/models/user/UserCompletedCourse.java
package graduation.project.USER.models.user;

import graduation.project.model.course.CourseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "user_completed_course",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "course_id"})
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class UserCompletedCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @EqualsAndHashCode.Include
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private UserProfile user;

    @EqualsAndHashCode.Include
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    @ToString.Exclude
    private CourseEntity course;

    // ===== Grades (NEW) =====
    // nullable because old completions may exist with no grade yet
    @Enumerated(EnumType.STRING)
    @Column(name = "grade_letter", length = 16)
    private GradeLetter gradeLetter;

    @Column(name = "grade_points")
    private Double gradePoints;
}
