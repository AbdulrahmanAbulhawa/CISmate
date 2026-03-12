package graduation.project.Users.Service.AdminService;

import graduation.project.Users.Models.records.RegistrationRequest;
import graduation.project.Users.Models.records.UserDTO;
import graduation.project.Users.Models.user.UserCompletedCourse;
import graduation.project.Users.Repo.User.UserRepo;
import graduation.project.repository.courseRepo.Course_Repo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import graduation.project.Users.Service.AuthService.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class AdminUserService {

    private final UserRepo userRepo;
    private final Course_Repo courseRepo;
    private final AuthRegisterService authRegisterService;

    public List<String> getAllUsers() {
        return userRepo.getAllUsers();
    }

    /* ================= Admin-only operations ================= */

    @Transactional
    public UserDTO adminCreateUser(RegistrationRequest req) {
        var entity = authRegisterService.register(req);

        Set<Long> completedIds = entity.getCompletions().stream()
                .map(c -> c.getCourse().getId())
                .collect(Collectors.toSet());

        return new UserDTO(
                entity.getEmail(),
                entity.getFirstName(),
                entity.getLastName(),
                entity.getMajor(),
                entity.getGpa(),
                entity.getCompletedHours(),
                entity.getStudyYear(),
                entity.getRole(),
                completedIds
        );
    }

    @Transactional
    public UserDTO adminUpdateUser(String email, UserDTO req) {
        var u = userRepo.findByEmail(email);
        if (u == null) throw new UsernameNotFoundException("User not found: " + email);

        if (req.firstName() != null) u.setFirstName(req.firstName());
        if (req.lastName() != null) u.setLastName(req.lastName());
        if (req.major() != null) u.setMajor(req.major());
        if (req.gpa() != null) u.setGpa(req.gpa());
        if (req.completedHours() != null) u.setCompletedHours(req.completedHours());
        if (req.studyYear() != null) u.setStudyYear(req.studyYear());
        if (req.role() != null) u.setRole(req.role());

        if (req.completedCourseIds() != null) {
            userRepo.deleteByUserId(u.getId());

            Set<UserCompletedCourse> fresh = new HashSet<>();
            for (Long cid : new HashSet<>(req.completedCourseIds())) {
                var c = courseRepo.findById(cid)
                        .orElseThrow(() -> new IllegalArgumentException("Course not found: " + cid));
                fresh.add(UserCompletedCourse.builder()
                        .user(u)
                        .course(c)
                        .gradeLetter(null)
                        .gradePoints(null)
                        .build());
            }
            u.setCompletions(fresh);
        }

        userRepo.save(u);

        Set<Long> completedIds = (u.getCompletions() == null) ? Set.of()
                : u.getCompletions().stream().map(cc -> cc.getCourse().getId()).collect(Collectors.toSet());

        return new UserDTO(
                u.getEmail(), u.getFirstName(), u.getLastName(), u.getMajor(),
                u.getGpa(), u.getCompletedHours(), u.getStudyYear(), u.getRole(), completedIds
        );
    }

    @Transactional
    public void adminDeleteUser(String email) {
        var u = userRepo.findByEmail(email);
        if (u == null) throw new UsernameNotFoundException("User not found: " + email);

        userRepo.deleteByUserId(u.getId());
        userRepo.delete(u);
    }
}
