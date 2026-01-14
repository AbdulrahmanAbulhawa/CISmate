package graduation.project.model.course;

import com.fasterxml.jackson.annotation.JsonIgnore;
import graduation.project.model.Items.Prerequisites;
import graduation.project.model.Items.ResourceItem;
import graduation.project.model.professor.ProfessorEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity @Table(name = "course")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class CourseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(length = 500)
    private String imageUrl;

    @Column(unique = true, nullable = false)
    private String courseCode; // e.g., "1904101"

    private String courseName;

    boolean hasProject;

    @Column(length = 1000)
    private String description;

    private String difficulty;              // e.g., "Easy", "Medium", "Hard"
    private String semesterOffered;         // e.g., "Fall,Spring"
    private String category;                // e.g., "Major Elective", "College Compulsory"
    private boolean hasLab;
    private String assessment;              // e.g., "Midterms + Final + Project"

    @Column(length = 500)
    private String tags;                    // e.g., "problem-solving, algorithms, AI"

    private int creditHours;
    private int recommendedYear;
    private int recommendedSemester;        // e.g., 1

    private String courseType;              // e.g., "Theoretical", "Practical", "Mixed"
    private String assessmentStyle;         // e.g., "project-based", "exams-only", "mixed"
    private boolean hasGroupWork;

    @ElementCollection
    @CollectionTable(
            name = "course_prerequisites",
            joinColumns = @JoinColumn(name = "course_id")
    )
    @AttributeOverrides({
            @AttributeOverride(name = "code", column = @Column(name = "prereq_code", nullable = false)),
            @AttributeOverride(name = "name", column = @Column(name = "prereq_name", nullable = false))
    })
    @Fetch(FetchMode.SUBSELECT)
    @BatchSize(size = 64)
    @Builder.Default
    private List<Prerequisites> prerequisites = new ArrayList<>();

    @ElementCollection
    @CollectionTable(
            name = "course_resources",
            joinColumns = @JoinColumn(name = "course_id")
    )
    @Fetch(FetchMode.SUBSELECT)
    @BatchSize(size = 64)
    @Builder.Default
    private List<ResourceItem> resources = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "course_professor",
            joinColumns = @JoinColumn(name = "course_id"),
            inverseJoinColumns = @JoinColumn(name = "professor_id")
    )
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    @Fetch(FetchMode.SUBSELECT)         // also fine (Set isn't a bag, but subselect helps when listing many)
    @BatchSize(size = 64)
    @Builder.Default
    private Set<ProfessorEntity> professors = new HashSet<>();


}
