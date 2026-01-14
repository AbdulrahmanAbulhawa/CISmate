package graduation.project.repository.courseRepo;

import graduation.project.model.course.CourseEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface Course_Repo extends JpaRepository<CourseEntity, Long> {

    // Fetch course with prerequisites, resources, and professors in one query
    @EntityGraph(attributePaths = { "prerequisites", "resources", "professors" })
    Optional<CourseEntity> findById(Long id);

    @Query("SELECT c.id,c.courseName,c.creditHours,c.category FROM CourseEntity c ORDER BY c.courseName ASC ")
    List<String> getAllCourseNames();
}
