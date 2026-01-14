package graduation.project.controller.CourseCont;

import graduation.project.model.course.CourseDTO;
import graduation.project.Service.courseServ.Course_service;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin//for flutter later
@RequestMapping ("/api/courses")
public class Course_controller {

    //construct
    Course_service service;
    public Course_controller(Course_service service) {
        this.service = service;
    }
    //construct


    @GetMapping("/getAllCourseNames")
    public List<String> getAllCourseNames() {
        return service.getAllCourseNames();
    }

    @GetMapping("/{id:\\d+}")
    public CourseDTO getCourseById(@PathVariable Long id) {
        return service.getById(id);
    }
}
