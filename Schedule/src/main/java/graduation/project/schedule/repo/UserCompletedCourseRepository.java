// File: Schedule/src/main/java/graduation/project/schedule/repo/UserCompletedCourseRepository.java
package graduation.project.schedule.repo;

import graduation.project.USER.models.user.UserCompletedCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserCompletedCourseRepository extends JpaRepository<UserCompletedCourse, Long> {

    @Query("select uc.course.id from UserCompletedCourse uc where uc.user.id = :userId")
    List<Long> findCompletedCourseIdsByUserId(@Param("userId") Long userId);

    @Query("select uc.course.courseCode from UserCompletedCourse uc where uc.user.id = :userId")
    List<String> findCompletedCourseCodesByUserId(@Param("userId") Long userId);

    // Lifetime electives cap support (category contains 'elective' case-insensitive)
    @Query("select count(uc) from UserCompletedCourse uc " +
            "where uc.user.id = :userId and lower(uc.course.category) like '%elective%'")
    long countCompletedElectiveCoursesByUserId(@Param("userId") Long userId);

    @Query("select coalesce(sum(uc.course.creditHours), 0) from UserCompletedCourse uc " +
            "where uc.user.id = :userId and lower(uc.course.category) like '%elective%'")
    long sumCompletedElectiveCreditHoursByUserId(@Param("userId") Long userId);
}
