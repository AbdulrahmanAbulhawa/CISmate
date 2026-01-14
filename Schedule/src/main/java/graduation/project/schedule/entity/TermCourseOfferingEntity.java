package graduation.project.schedule.entity;

import graduation.project.model.course.CourseEntity;
import graduation.project.schedule.domain.enums.MeetingPattern;
import graduation.project.schedule.domain.enums.Semester;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Entity
@Table(
        name = "schedule_term_course_offering",
        indexes = {
                @Index(name = "idx_offering_semester", columnList = "semester"),
                @Index(name = "idx_offering_course", columnList = "course_id"),
                @Index(name = "idx_offering_semester_course", columnList = "semester,course_id")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_offering_semester_course_section", columnNames = {"semester", "course_id", "section_code"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class TermCourseOfferingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Semester semester;

    /**
     * Optional but recommended: JU often uses section numbers.
     * Used to allow multiple offerings per course per semester.
     */
    @Column(name = "section_code", nullable = false, length = 32)
    private String sectionCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    @ToString.Exclude
    private CourseEntity course;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private MeetingPattern pattern;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;
}
