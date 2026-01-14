// File: src/main/java/graduation/project/controller/AdminEventController.java
package graduation.project.controller;

import graduation.project.models.EventEntity;
import graduation.project.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/events")
@RequiredArgsConstructor
public class AdminEventController {

    private final EventService eventService;

    // ─────────── CREATE (global) ───────────
    // POST /api/admin/events
    @PostMapping
    public ResponseEntity<EventEntity> createGlobalEvent(
            @RequestBody EventEntity event,
            Authentication authentication
    ) {
        String adminEmail = authentication.getName();
        EventEntity created = eventService.createGlobalEvent(event, adminEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ─────────── READ (global) ───────────
    // GET /api/admin/events
    @GetMapping
    public ResponseEntity<List<EventEntity>> getGlobalEvents() {
        return ResponseEntity.ok(eventService.getGlobalEvents());
    }

    // ─────────── READ (global range) ───────────
    // GET /api/admin/events/range?start=...&end=...
    @GetMapping("/range")
    public ResponseEntity<List<EventEntity>> getGlobalEventsBetween(
            @RequestParam("start")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam("end")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end
    ) {
        return ResponseEntity.ok(eventService.getGlobalEventsBetween(start, end));
    }

    // ─────────── UPDATE (global) ───────────
    // PUT /api/admin/events/{id}
    @PutMapping("/{id}")
    public ResponseEntity<EventEntity> updateGlobalEvent(
            @PathVariable("id") Long id,
            @RequestBody EventEntity updatedEvent
    ) {
        return ResponseEntity.ok(eventService.updateGlobalEvent(id, updatedEvent));
    }

    // ─────────── DELETE (global) ───────────
    // DELETE /api/admin/events/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGlobalEvent(@PathVariable("id") Long id) {
        eventService.deleteGlobalEvent(id);
        return ResponseEntity.noContent().build();
    }
}
