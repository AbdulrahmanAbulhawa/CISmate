package graduation.project.controller;

import graduation.project.dto.admin.*;
import graduation.project.service.CareerAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/careers")
public class AdminCareerController {

    private final CareerAdminService adminService;

    // ───────────────────────────────
    // Career CRUD
    // ───────────────────────────────

    @PostMapping
    public ResponseEntity<?> createCareer(@RequestBody CareerCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createCareer(req));
    }

    @PutMapping("/{careerId}")
    public ResponseEntity<?> updateCareer(
            @PathVariable Long careerId,
            @RequestBody CareerUpdateRequest req
    ) {
        return ResponseEntity.ok(adminService.updateCareer(careerId, req));
    }

    /**
     * Soft delete (active=false)
     */
    @DeleteMapping("/{careerId}")
    public ResponseEntity<?> deleteCareer(@PathVariable Long careerId) {
        adminService.softDeleteCareer(careerId);
        return ResponseEntity.noContent().build();
    }

    // ───────────────────────────────
    // Tasks
    // ───────────────────────────────

    @PostMapping("/{careerId}/tasks")
    public ResponseEntity<?> addTask(
            @PathVariable Long careerId,
            @RequestBody TextItemCreateRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.addTask(careerId, req));
    }

    @PutMapping("/{careerId}/tasks/{taskId}")
    public ResponseEntity<?> updateTask(
            @PathVariable Long careerId,
            @PathVariable Long taskId,
            @RequestBody TextItemUpdateRequest req
    ) {
        return ResponseEntity.ok(adminService.updateTask(careerId, taskId, req));
    }

    @DeleteMapping("/{careerId}/tasks/{taskId}")
    public ResponseEntity<?> deleteTask(
            @PathVariable Long careerId,
            @PathVariable Long taskId
    ) {
        adminService.deleteTask(careerId, taskId);
        return ResponseEntity.noContent().build();
    }

    // ───────────────────────────────
    // Concepts
    // ───────────────────────────────

    @PostMapping("/{careerId}/concepts")
    public ResponseEntity<?> addConcept(
            @PathVariable Long careerId,
            @RequestBody TextItemCreateRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.addConcept(careerId, req));
    }

    @PutMapping("/{careerId}/concepts/{conceptId}")
    public ResponseEntity<?> updateConcept(
            @PathVariable Long careerId,
            @PathVariable Long conceptId,
            @RequestBody TextItemUpdateRequest req
    ) {
        return ResponseEntity.ok(adminService.updateConcept(careerId, conceptId, req));
    }

    @DeleteMapping("/{careerId}/concepts/{conceptId}")
    public ResponseEntity<?> deleteConcept(
            @PathVariable Long careerId,
            @PathVariable Long conceptId
    ) {
        adminService.deleteConcept(careerId, conceptId);
        return ResponseEntity.noContent().build();
    }

    // ───────────────────────────────
    // Courses (Career ↔ Course)
    // ───────────────────────────────

    @PostMapping("/{careerId}/courses")
    public ResponseEntity<?> addCourseToCareer(
            @PathVariable Long careerId,
            @RequestBody CareerCourseAddRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.addCourse(careerId, req));
    }

    @DeleteMapping("/{careerId}/courses/{careerCourseId}")
    public ResponseEntity<?> removeCourseFromCareer(
            @PathVariable Long careerId,
            @PathVariable Long careerCourseId
    ) {
        adminService.deleteCareerCourse(careerId, careerCourseId);
        return ResponseEntity.noContent().build();
    }
}
