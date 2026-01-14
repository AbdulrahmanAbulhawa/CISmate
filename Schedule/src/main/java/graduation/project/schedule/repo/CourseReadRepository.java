// File: Schedule/src/main/java/graduation/project/schedule/repo/CourseReadRepository.java
package graduation.project.schedule.repo;

import graduation.project.model.course.CourseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CourseReadRepository extends JpaRepository<CourseEntity, Long> {

    Optional<CourseEntity> findByCourseCode(String courseCode);

    /**
     * Returns the raw tags CSV strings for ELECTIVE courses only.
     * Used to build the dropdown list in the UI from DB data.
     */
    @Query("""
            select c.tags
            from CourseEntity c
            where c.tags is not null
              and trim(c.tags) <> ''
              and c.category is not null
              and lower(c.category) like '%elective%'
           """)
    List<String> findElectiveTagsCsv();
}
