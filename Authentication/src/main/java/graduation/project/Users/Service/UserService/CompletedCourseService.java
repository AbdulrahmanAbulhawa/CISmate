package graduation.project.Users.Service.UserService;

import graduation.project.Users.Models.records.CompletedCourseGradeDTO;
import graduation.project.Users.Models.records.CompletedCourseGradeRequest;
import graduation.project.Users.Models.user.GradeLetter;
import graduation.project.Users.Models.user.UserCompletedCourse;
import graduation.project.Users.Repo.User.UserCompletedCourseRepo;
import graduation.project.Users.Repo.User.UserRepo;
import graduation.project.model.course.CourseEntity;
import graduation.project.repository.courseRepo.Course_Repo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class CompletedCourseService {

    private final UserCompletedCourseRepo completedCourseRepo;
    private final UserRepo userRepo;
    private final Course_Repo courseRepo;

    @Transactional
    public CompletedCourseGradeDTO upsertCompletedCourseGrade(String email, CompletedCourseGradeRequest req) {
        if (req == null || req.courseId() == null) {
            throw new IllegalArgumentException("courseId is required");
        }

        var user = userRepo.findByEmail(email);
        if (user == null) throw new UsernameNotFoundException("User not found: " + email);

        CourseEntity course = courseRepo.findById(req.courseId())
                .orElseThrow(() -> new IllegalArgumentException("Course not found: " + req.courseId()));

        GradeLetter gl = GradeLetter.fromUserInput(req.gradeLetter());
        double points = gl.points();

        UserCompletedCourse ucc = completedCourseRepo
                .findByUserIdAndCourseId(user.getId(), course.getId())
                .orElseGet(() -> UserCompletedCourse.builder()
                        .user(user)
                        .course(course)
                        .build()
                );

        ucc.setGradeLetter(gl);
        ucc.setGradePoints(points);

        completedCourseRepo.save(ucc);

        return new CompletedCourseGradeDTO(
                course.getId(),
                course.getCourseCode(),
                course.getCourseName(),
                gl.display(),
                points
        );
    }

    @Transactional(readOnly = true)
    public List<CompletedCourseGradeDTO> getMyCompletedCoursesWithGrades(String email) {
        var user = userRepo.findByEmail(email);
        if (user == null) throw new UsernameNotFoundException("User not found: " + email);

        return completedCourseRepo.findAllByUserEmailWithCourse(email).stream()
                .map(uc -> new CompletedCourseGradeDTO(
                        uc.getCourse().getId(),
                        uc.getCourse().getCourseCode(),
                        uc.getCourse().getCourseName(),
                        uc.getGradeLetter() == null ? null : uc.getGradeLetter().display(),
                        uc.getGradePoints()
                ))
                .collect(Collectors.toList());
    }
}
