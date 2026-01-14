package graduation.project.controller;

import graduation.project.dto.OpportunityPostRequestDTO;
import graduation.project.dto.OpportunityPostResponseDTO;
import graduation.project.service.OpportunityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/opportunities")
public class OpportunityController {

    private final OpportunityService service;

    // ─────────── LIST ───────────
    // Example:
    // GET /opportunities/active?type=GROUP
    // GET /opportunities/active?type=INTERNSHIP

    @GetMapping("/active")
    public ResponseEntity<List<OpportunityPostResponseDTO>> getActiveByType(
            @RequestParam String type
    ) {
        return ResponseEntity.ok(service.getActiveByType(type));
    }

    // ─────────── CREATE GROUP (STUDENT) ───────────
    // POST /opportunities/groups
    @PostMapping("/groups")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OpportunityPostResponseDTO> createGroupPost(
            Authentication auth,
            @Valid @RequestBody OpportunityPostRequestDTO dto
    ) {
        String userId = extractUserId(auth);
        return ResponseEntity.ok(service.createGroupPost(userId, dto));
    }

    // ─────────── CREATE INTERNSHIP (ADMIN ONLY) ───────────
    // POST /opportunities/internships
    @PostMapping("/internships")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OpportunityPostResponseDTO> createInternshipPost(
            Authentication auth,
            @Valid @RequestBody OpportunityPostRequestDTO dto
    ) {
        String adminId = extractUserId(auth);
        return ResponseEntity.ok(service.createInternshipPost(adminId, dto));
    }

    // ─────────── UPDATE (POSTER ONLY) ───────────
    // PUT /opportunities/{id}
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OpportunityPostResponseDTO> updatePost(
            @PathVariable Long id,
            Authentication auth,
            @Valid @RequestBody OpportunityPostRequestDTO dto
    ) {
        String userId = extractUserId(auth);
        return ResponseEntity.ok(service.updatePost(id, userId, dto));
    }

    // ─────────── DELETE (ADMIN ONLY) ───────────
    // DELETE /opportunities/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long id
    ) {
        service.deletePostAsAdmin(id);
        return ResponseEntity.noContent().build();
    }

    // ─────────── INTERESTED ───────────
    // POST /opportunities/{id}/interested
    @PostMapping("/{id}/interested")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OpportunityPostResponseDTO> markInterested(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(service.markInterested(id));
    }

    /**
     * IMPORTANT:
     * This depends on your Authentication module.
     * If your principal is not a simple String userId, tell me what it is
     * (e.g., JwtUserDetails, UserEntity, etc.) and I’ll adjust it exactly.
     */
    private String extractUserId(Authentication auth) {
        // Most common:
        // - if you used username as studentId in JWT -> auth.getName() returns it
        return auth.getName();
    }
}
