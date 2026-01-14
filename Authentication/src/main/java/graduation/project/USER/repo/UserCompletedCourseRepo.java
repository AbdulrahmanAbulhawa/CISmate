// File: src/main/java/graduation/project/USER/repo/UserCompletedCourseRepo.java
package graduation.project.USER.repo;

import graduation.project.USER.models.user.UserCompletedCourse;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserCompletedCourseRepo extends JpaRepository<UserCompletedCourse, Long> {

    Optional<UserCompletedCourse> findByUserIdAndCourseId(Long userId, Long courseId);

    @Query("""
        select uc
        from UserCompletedCourse uc
        join fetch uc.course c
        where uc.user.email = :email
        order by c.courseCode asc
    """)
    List<UserCompletedCourse> findAllByUserEmailWithCourse(@Param("email") String email);
}
