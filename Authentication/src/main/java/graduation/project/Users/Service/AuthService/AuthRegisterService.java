package graduation.project.Users.Service.AuthService;

import graduation.project.Users.Models.records.RegistrationRequest;
import graduation.project.Users.Models.user.UserCompletedCourse;
import graduation.project.Users.Models.user.UserProfile;
import graduation.project.Users.Repo.User.UserRepo;
import graduation.project.model.course.CourseEntity;
import graduation.project.repository.courseRepo.Course_Repo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@RequiredArgsConstructor
@Service
public class AuthRegisterService {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final Course_Repo courseRepo;

    @Transactional
    public UserProfile register(RegistrationRequest req) {
        if (userRepo.findByEmail(req.email()) != null) {
            throw new IllegalArgumentException("Email already registered: " + req.email());
        }

        UserProfile user = UserProfile.builder()
                .email(req.email())
                .password(passwordEncoder.encode(req.password()))
                .firstName(req.firstName())
                .lastName(req.lastName())
                .major(req.major() != null ? req.major() : "CIS")
                .gpa(req.gpa() != null ? req.gpa() : BigDecimal.ZERO)
                .completedHours(req.completedHours() != null ? req.completedHours() : 0)
                .studyYear(req.studyYear() != null ? req.studyYear() : 1)
                .role("USER")
                .build();

        user = userRepo.save(user); // ensure ID

        // Add completions (no grade yet)
        if (req.completedCourseIds() != null && !req.completedCourseIds().isEmpty()) {
            Set<Long> distinctIds = new HashSet<>(req.completedCourseIds());
            for (Long courseId : distinctIds) {
                CourseEntity courseRef = courseRepo.getReferenceById(courseId);
                UserCompletedCourse ucc = UserCompletedCourse.builder()
                        .user(user)
                        .course(courseRef)
                        .gradeLetter(null)
                        .gradePoints(null)
                        .build();
                user.getCompletions().add(ucc);
            }
            user = userRepo.save(user);
        }

        return user;
    }

}
