package graduation.project.schedule.controller;

import graduation.project.schedule.domain.enums.Semester;
import graduation.project.schedule.dto.AdminOfferingUpsertRequest;
import graduation.project.schedule.dto.OfferingResponse;
import graduation.project.schedule.service.OfferingAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedule/admin/offerings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOfferingController {

    private final OfferingAdminService offeringAdminService;

    @PostMapping
    public OfferingResponse create(@Valid @RequestBody AdminOfferingUpsertRequest req) {
        return offeringAdminService.create(req);
    }

    @PutMapping("/{id}")
    public OfferingResponse update(@PathVariable Long id, @Valid @RequestBody AdminOfferingUpsertRequest req) {
        return offeringAdminService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        offeringAdminService.delete(id);
    }

    @GetMapping
    public List<OfferingResponse> list(@RequestParam Semester semester) {
        return offeringAdminService.listBySemester(semester);
    }
}
