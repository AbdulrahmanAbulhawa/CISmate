package graduation.project.USER.models.user;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "app_user", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "first_name", nullable = false, length = 80)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 80)
    private String lastName;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String major = "CIS";

    @Column(nullable = false, precision = 4, scale = 3)
    @Builder.Default
    private BigDecimal gpa = BigDecimal.ZERO;

    @Column(name = "completed_hours", nullable = false)
    @Builder.Default
    private Integer completedHours = 0;

    // Student's academic year (1, 2, 3, 4, 5...)
    @Column(name = "study_year", nullable = false)
    @Builder.Default
    private Integer studyYear = 1;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String role = "USER";

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @Builder.Default
    private Set<UserCompletedCourse> completions = new HashSet<>();
}
