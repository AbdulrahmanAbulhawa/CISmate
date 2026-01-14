// File: src/main/java/graduation/project/model/CareerEntity.java
package graduation.project.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "career",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_career_slug", columnNames = "slug")
        }
)
public class CareerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // used in URLs: /api/careers/{slug}
    @Column(nullable = false, length = 120)
    private String slug;

    // Career name shown in the list
    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, columnDefinition = "text")
    private String overview;

    // -------- admin-maintained metadata (used for smart filters) --------
    @Enumerated(EnumType.STRING)
    @Column(name = "demand_level", length = 16, nullable = false)
    @Builder.Default
    private CareerScaleLevel demandLevel = CareerScaleLevel.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "salary_potential", length = 16, nullable = false)
    @Builder.Default
    private CareerScaleLevel salaryPotential = CareerScaleLevel.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "stress_level", length = 16, nullable = false)
    @Builder.Default
    private CareerScaleLevel stressLevel = CareerScaleLevel.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "stability_level", length = 16, nullable = false)
    @Builder.Default
    private CareerScaleLevel stabilityLevel = CareerScaleLevel.MEDIUM;

    // helpful later (hide without deleting)
    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // -------- relations (admin-ready; student uses DTO anyway) --------

    @JsonIgnore
    @OneToMany(
            mappedBy = "career",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @Builder.Default
    private List<CareerTaskEntity> tasks = new ArrayList<>();

    @JsonIgnore
    @OneToMany(
            mappedBy = "career",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @Builder.Default
    private List<CareerConceptEntity> concepts = new ArrayList<>();

    @JsonIgnore
    @OneToMany(
            mappedBy = "career",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @Builder.Default
    private List<CareerCourseEntity> careerCourses = new ArrayList<>();

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;

        if (slug != null) slug = slug.trim();
        if (name != null) name = name.trim();

        if (demandLevel == null) demandLevel = CareerScaleLevel.MEDIUM;
        if (salaryPotential == null) salaryPotential = CareerScaleLevel.MEDIUM;
        if (stressLevel == null) stressLevel = CareerScaleLevel.MEDIUM;
        if (stabilityLevel == null) stabilityLevel = CareerScaleLevel.MEDIUM;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();

        if (slug != null) slug = slug.trim();
        if (name != null) name = name.trim();

        if (demandLevel == null) demandLevel = CareerScaleLevel.MEDIUM;
        if (salaryPotential == null) salaryPotential = CareerScaleLevel.MEDIUM;
        if (stressLevel == null) stressLevel = CareerScaleLevel.MEDIUM;
        if (stabilityLevel == null) stabilityLevel = CareerScaleLevel.MEDIUM;
    }
}
