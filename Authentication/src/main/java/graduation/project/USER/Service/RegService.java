// File: src/main/java/graduation/project/USER/Service/RegService.java
package graduation.project.USER.Service;

import graduation.project.model.course.CourseEntity;
import graduation.project.repository.courseRepo.Course_Repo;
import graduation.project.USER.models.records.CompletedCourseGradeDTO;
import graduation.project.USER.models.records.CompletedCourseGradeRequest;
import graduation.project.USER.models.records.LoginRequest;
import graduation.project.USER.models.records.RegistrationRequest;
import graduation.project.USER.models.records.UserDTO;
import graduation.project.USER.models.user.GradeLetter;
import graduation.project.USER.models.user.UserCompletedCourse;
import graduation.project.USER.models.user.UserProfile;
import graduation.project.USER.repo.UserCompletedCourseRepo;
import graduation.project.USER.repo.UserRepo;
import graduation.project.AuthBasics.service.JWTservice;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class RegService {

    private final UserRepo userRepo;
    private final Course_Repo courseRepo;
    private final UserCompletedCourseRepo completedCourseRepo; // NEW
    private final AuthenticationManager authenticationManager;
    private final JWTservice jwtService;

    /* ================= Self-register / login / self-info ================= */

    @Transactional
    public UserProfile register(RegistrationRequest req) {
        if (userRepo.findByEmail(req.email()) != null) {
            throw new IllegalArgumentException("Email already registered: " + req.email());
        }

        UserProfile user = UserProfile.builder()
                .email(req.email())
                .password(req.password()) // DEV ONLY (plain). Use encoder in prod.
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

    public String verify(LoginRequest req) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.email(), req.password())
            );
            return auth.isAuthenticated() ? jwtService.generateToken(req.email()) : "Login Failed";
        } catch (BadCredentialsException ex) {
            return "Login Failed";
        }
    }

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

    /* ================= Grades (NEW) ================= */

    /**
     * Upsert (create/update) grade for a completed course.
     * If the completion row doesn't exist yet, it will be created.
     */
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

    public List<String> getAllUsers() {
        return userRepo.getAllUsers();
    }

    /* ================= Admin-only operations ================= */

    @Transactional
    public UserDTO adminCreateUser(RegistrationRequest req) {
        var entity = register(req);

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
