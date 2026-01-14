// File: src/main/java/graduation/project/USER/controller/UserCompletedCourseController.java
package graduation.project.USER.controller;

import graduation.project.USER.Service.RegService;
import graduation.project.USER.models.records.CompletedCourseGradeDTO;
import graduation.project.USER.models.records.CompletedCourseGradeRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/user/completed-courses")
@CrossOrigin
@RequiredArgsConstructor
public class UserCompletedCourseController {

    private final RegService regService;

    // Upsert grade (create completion if missing)
    @PutMapping("/grade")
    public CompletedCourseGradeDTO upsertGrade(@RequestBody CompletedCourseGradeRequest req, Principal principal) {
        return regService.upsertCompletedCourseGrade(principal.getName(), req);
    }

    // List completed courses + grades (for UI + career scoring)
    @GetMapping
    public List<CompletedCourseGradeDTO> myCompletedCourses(Principal principal) {
        return regService.getMyCompletedCoursesWithGrades(principal.getName());
    }
}
