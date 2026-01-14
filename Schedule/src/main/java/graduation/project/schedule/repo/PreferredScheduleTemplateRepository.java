package graduation.project.schedule.repo;

import graduation.project.schedule.domain.enums.Semester;
import graduation.project.schedule.entity.PreferredScheduleTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PreferredScheduleTemplateRepository extends JpaRepository<PreferredScheduleTemplateEntity, Long> {
    Optional<PreferredScheduleTemplateEntity> findBySemesterAndYearLevel(Semester semester, Integer yearLevel);
}
