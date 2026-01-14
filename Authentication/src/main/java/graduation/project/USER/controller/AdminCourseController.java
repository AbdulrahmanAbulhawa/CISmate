package graduation.project.USER.controller;

import graduation.project.USER.Service.courseServiceAdmin;
import graduation.project.USER.Service.courseServiceAdmin.CourseAdminDTO;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/api/admin/courses")
public class AdminCourseController {

    private final courseServiceAdmin service;

    public AdminCourseController(courseServiceAdmin service) {
        this.service = service;
    }

    /** Create */
    @PostMapping
    public CourseAdminDTO add(@RequestBody CourseAdminDTO req) {
        return service.create(req);
    }

    /** Update */
    @PutMapping("/{id}")
    public CourseAdminDTO update(@PathVariable Long id, @RequestBody CourseAdminDTO req) {
        return service.update(id, req);
    }

    /** Delete */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }

    /** Get all (admin view) */
    @GetMapping
    public List<CourseAdminDTO> listAll() {
        return service.listAll();
    }

    /** Get one (admin view) */
    @GetMapping("/{id}")
    public CourseAdminDTO getOne(@PathVariable Long id) {
        return service.getOne(id);
    }
}
