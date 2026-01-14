package graduation.project.schedule.controller;

import graduation.project.schedule.domain.enums.Semester;
import graduation.project.schedule.dto.AdminTemplateUpsertRequest;
import graduation.project.schedule.dto.TemplateResponse;
import graduation.project.schedule.service.TemplateAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/schedule/admin/templates")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminTemplateController {

    private final TemplateAdminService templateAdminService;

    @PostMapping
    public TemplateResponse upsert(@Valid @RequestBody AdminTemplateUpsertRequest req) {
        return templateAdminService.upsert(req);
    }

    @GetMapping
    public TemplateResponse get(@RequestParam Semester semester, @RequestParam Integer yearLevel) {
        return templateAdminService.get(semester, yearLevel);
    }

    @DeleteMapping
    public void delete(@RequestParam Semester semester, @RequestParam Integer yearLevel) {
        templateAdminService.delete(semester, yearLevel);
    }
}
