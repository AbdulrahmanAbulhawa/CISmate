// File: src/main/java/graduation/project/controller/CareerController.java
package graduation.project.controller;

import graduation.project.dto.CareerDetailsDto;
import graduation.project.dto.CareerNameDto;
import graduation.project.service.CareerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/careers")
@RequiredArgsConstructor
public class CareerController {

    private final CareerService careerService;

    /**
     * Careers list (supports smart filters):
     * - GET /api/careers
     * - GET /api/careers?filter=HIGH_DEMAND
     * - GET /api/careers?filter=HIGH_SALARY
     * - GET /api/careers?filter=LOW_STRESS_STABLE
     * - GET /api/careers?filter=BEST_FIT  (requires auth; uses authentication.getName() as email)
     */
    @GetMapping
    public ResponseEntity<List<CareerNameDto>> getCareers(
            @RequestParam(value = "filter", required = false) String filter,
            Authentication authentication
    ) {
        String email = authentication == null ? null : authentication.getName();
        List<CareerNameDto> careers = careerService.getCareers(filter, email);
        return ResponseEntity.ok(careers);
    }

    // Career details by slug
    // GET /api/careers/{slug}
    @GetMapping("/{slug}")
    public ResponseEntity<CareerDetailsDto> getCareerDetails(@PathVariable String slug) {
        CareerDetailsDto details = careerService.getCareerDetails(slug);
        return ResponseEntity.ok(details);
    }
}
