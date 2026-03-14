package graduation.project.Users.Controller.user;

import graduation.project.Users.Models.records.CompletedCourseGradeDTO;
import graduation.project.Users.Models.records.CompletedCourseGradeRequest;
import graduation.project.Users.Service.UserService.CompletedCourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/user/completed-courses")
@CrossOrigin
@RequiredArgsConstructor
public class UserCompletedCourseController {

    private final CompletedCourseService completedCourseService;

    @PutMapping("/grade")
    public CompletedCourseGradeDTO upsertGrade(@RequestBody CompletedCourseGradeRequest req, Principal principal) {
        return completedCourseService.upsertCompletedCourseGrade(principal.getName(), req);
    }

    @GetMapping
    public List<CompletedCourseGradeDTO> myCompletedCourses(Principal principal) {
        return completedCourseService.getMyCompletedCoursesWithGrades(principal.getName());
    }
}