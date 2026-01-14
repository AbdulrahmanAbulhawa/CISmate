package graduation.project.repository;

import graduation.project.model.course.CourseEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseLookupRepository extends JpaRepository<CourseEntity, Long> {
}
