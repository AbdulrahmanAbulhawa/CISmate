package graduation.project.schedule.controller;

import graduation.project.schedule.dto.GenerateScheduleRequest;
import graduation.project.schedule.dto.GeneratedScheduleResponse;
import graduation.project.schedule.dto.UserGeneratedScheduleResponse;
import graduation.project.schedule.service.ScheduleGeneratorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/schedule")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
public class ScheduleGeneratorController {

    private final ScheduleGeneratorService generatorService;

    /**
     * USER endpoint (public):
     * - Always returns the slim response (no explain payload)
     * - Ignores req.explain even if the client sends it
     */
    @PostMapping("/generate")
    public UserGeneratedScheduleResponse generate(@Valid @RequestBody GenerateScheduleRequest req) {
        return generatorService.generateUser(req);
    }

    /**
     * TEST/DEBUG endpoint (admin only):
     * - Returns full debug payload (skipReasons, alternativeReasons, score breakdown...)
     * - Respects req.explain()
     */
    @PostMapping("/generate/debug")
    @PreAuthorize("hasRole('ADMIN')")
    public GeneratedScheduleResponse generateDebug(@Valid @RequestBody GenerateScheduleRequest req) {
        return generatorService.generate(req);
    }
}
