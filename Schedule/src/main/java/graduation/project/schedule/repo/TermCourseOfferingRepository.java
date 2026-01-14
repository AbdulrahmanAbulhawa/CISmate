package graduation.project.schedule.repo;

import graduation.project.schedule.domain.enums.Semester;
import graduation.project.schedule.entity.TermCourseOfferingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TermCourseOfferingRepository extends JpaRepository<TermCourseOfferingEntity, Long> {

    List<TermCourseOfferingEntity> findBySemester(Semester semester);

    @Query("select o from TermCourseOfferingEntity o join fetch o.course c where o.semester = :semester")
    List<TermCourseOfferingEntity> findBySemesterWithCourse(@Param("semester") Semester semester);

    @Query("select o from TermCourseOfferingEntity o join fetch o.course c where o.semester = :semester and c.id in :courseIds")
    List<TermCourseOfferingEntity> findBySemesterAndCourseIdsWithCourse(@Param("semester") Semester semester,
                                                                        @Param("courseIds") List<Long> courseIds);

    List<TermCourseOfferingEntity> findBySemesterAndCourse_Id(Semester semester, Long courseId);
}
