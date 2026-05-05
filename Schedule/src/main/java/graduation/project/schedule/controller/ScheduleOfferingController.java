// File: src/main/java/graduation/project/schedule/controller/ScheduleOfferingController.java
package graduation.project.schedule.controller;

import graduation.project.schedule.domain.enums.Semester;
import graduation.project.schedule.dto.OfferingResponse;
import graduation.project.schedule.service.OfferingAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedule/offerings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
public class ScheduleOfferingController {

    private final OfferingAdminService offeringAdminService;

    @GetMapping
    public List<OfferingResponse> list(@RequestParam Semester semester) {
        return offeringAdminService.listBySemester(semester);
    }
}