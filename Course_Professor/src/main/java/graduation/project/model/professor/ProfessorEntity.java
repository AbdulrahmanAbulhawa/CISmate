package graduation.project.model.professor;

import com.fasterxml.jackson.annotation.JsonIgnore;
import graduation.project.model.course.CourseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "professor")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ProfessorEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false)
    private String name;

    String title;

    @Column(unique = true)
    private String email;

    private String department;
    private String office;

    @Column(length = 500)
    private String imageUrl;

    // Tags for expertise (e.g., "AI, Databases, Networking")
    @Column(length = 500)
    private String tags;

    // 🔗 Unidirectional relation to CourseEntity
    @ManyToMany(mappedBy = "professors", fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    @JsonIgnore // avoid accidental serialization loops
    private Set<CourseEntity> courses = new HashSet<>();

}
