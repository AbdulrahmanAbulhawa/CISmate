// src/main/java/graduation/project/USER/repo/UserRepo.java
package graduation.project.USER.repo;

import graduation.project.USER.models.user.UserProfile;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;
import java.util.Optional;

public interface UserRepo extends JpaRepository<UserProfile, Long> {

    UserProfile findByEmail(String email);

    // Eagerly fetch completions (and their course) for update flow to avoid LazyInitializationException
    @Query("""
        select distinct u
        from UserProfile u
        left join fetch u.completions c
        left join fetch c.course
        where u.email = :email
    """)
    Optional<UserProfile> findByEmailWithCompletions(@Param("email") String email);

    // Get only the course IDs of the user's completions
    @Query("""
       select uc.course.id
       from UserCompletedCourse uc
       where uc.user.email = :email
    """)
    Set<Long> findCompletedCourseIdsByEmail(@Param("email") String email);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from UserCompletedCourse ucc where ucc.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    // NOTE: this JPQL selects multiple fields but returns String; it works if you CONCAT.
    // If you prefer real objects, switch to a projection DTO.
    @Query("SELECT CONCAT(uc.firstName,' ',uc.lastName,' - ',uc.email) FROM UserProfile uc ORDER BY uc.firstName ASC")
    List<String> getAllUsers();

    // Optional helper (not required, but handy):
    void deleteByEmail(String email);
}
