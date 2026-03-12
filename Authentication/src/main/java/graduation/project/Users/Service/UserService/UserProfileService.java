package graduation.project.Users.Service.UserService;

import graduation.project.Users.Models.records.UserDTO;
import graduation.project.Users.Models.user.UserCompletedCourse;
import graduation.project.Users.Repo.User.UserRepo;
import graduation.project.repository.courseRepo.Course_Repo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class UserProfileService {

    private final UserRepo userRepo;
    private final Course_Repo courseRepo;

    @Transactional(readOnly = true)
    public UserDTO userInfo(String email) {
        var u = userRepo.findByEmail(email);
        if (u == null) throw new UsernameNotFoundException("User not found: " + email);

        Set<Long> completedIds = u.getCompletions().stream()
                .map(c -> c.getCourse().getId())
                .collect(Collectors.toSet());

        return new UserDTO(
                u.getEmail(),
                u.getFirstName(),
                u.getLastName(),
                u.getMajor(),
                u.getGpa(),
                u.getCompletedHours(),
                u.getStudyYear(),
                u.getRole(),
                completedIds
        );
    }

    @Transactional
    public UserDTO updateUser(String email, UserDTO req) {
        var u = userRepo.findByEmailWithCompletions(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        // --- scalar fields (patched if present) ---
        if (req.firstName() != null)      u.setFirstName(req.firstName());
        if (req.lastName() != null)       u.setLastName(req.lastName());
        if (req.major() != null)          u.setMajor(req.major());
        if (req.gpa() != null)            u.setGpa(req.gpa());
        if (req.completedHours() != null) u.setCompletedHours(req.completedHours());
        if (req.studyYear() != null)      u.setStudyYear(req.studyYear());

        // --- add-only behavior for course completions ---
        if (req.completedCourseIds() != null) {
            org.hibernate.Hibernate.initialize(u.getCompletions());

            var requested = new java.util.HashSet<Long>(req.completedCourseIds());
            requested.removeIf(java.util.Objects::isNull);

            if (!requested.isEmpty()) {
                var existingCourseIds = courseRepo.findAllById(requested)
                        .stream().map(c -> c.getId())
                        .collect(java.util.stream.Collectors.toSet());
                var missing = new java.util.HashSet<>(requested);
                missing.removeAll(existingCourseIds);
                if (!missing.isEmpty()) {
                    throw new IllegalArgumentException("Unknown course IDs: " + missing);
                }
            }

            var currentIds = u.getCompletions().stream()
                    .map(c -> c.getCourse().getId())
                    .collect(java.util.stream.Collectors.toSet());

            var toAdd = new java.util.HashSet<>(requested);
            toAdd.removeAll(currentIds);

            for (Long cid : toAdd) {
                var courseRef = courseRepo.getReferenceById(cid);
                u.getCompletions().add(
                        UserCompletedCourse.builder()
                                .user(u)
                                .course(courseRef)
                                .gradeLetter(null)
                                .gradePoints(null)
                                .build()
                );
            }
        }

        userRepo.save(u);

        var completedIds = u.getCompletions().stream()
                .map(c -> c.getCourse().getId())
                .collect(java.util.stream.Collectors.toSet());

        return new UserDTO(
                u.getEmail(),
                u.getFirstName(),
                u.getLastName(),
                u.getMajor(),
                u.getGpa(),
                u.getCompletedHours(),
                u.getStudyYear(),
                u.getRole(),
                completedIds
        );
    }
}
