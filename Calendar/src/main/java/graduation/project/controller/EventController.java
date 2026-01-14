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
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    // ─────────── CREATE (personal) ───────────
    @PostMapping
    public ResponseEntity<EventEntity> createEvent(
            @RequestBody EventEntity event,
            Authentication authentication
    ) {
        String ownerId = authentication.getName(); // email from JWT
        EventEntity created = eventService.createPersonalEvent(event, ownerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ─────────── READ: visible events for logged-in user (personal + global) ───────────
    // GET /api/events
    @GetMapping
    public ResponseEntity<List<EventEntity>> getMyEvents(Authentication authentication) {
        String ownerId = authentication.getName();
        List<EventEntity> events = eventService.getVisibleEventsForOwner(ownerId);
        return ResponseEntity.ok(events);
    }

    // ─────────── READ: visible events in date range (personal + global) ───────────
    // GET /api/events/range?start=2025-01-01T00:00:00&end=2025-01-31T23:59:59
    @GetMapping("/range")
    public ResponseEntity<List<EventEntity>> getMyEventsBetween(
            Authentication authentication,
            @RequestParam("start")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam("end")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end
    ) {
        String ownerId = authentication.getName();
        List<EventEntity> events = eventService.getVisibleEventsForOwnerBetween(ownerId, start, end);
        return ResponseEntity.ok(events);
    }

    // ─────────── READ: single visible event by id (personal if owned OR global) ───────────
    // GET /api/events/{id}
    @GetMapping("/{id}")
    public ResponseEntity<EventEntity> getEventById(
            @PathVariable("id") Long id,
            Authentication authentication
    ) {
        String ownerId = authentication.getName();
        EventEntity event = eventService.getVisibleEventById(id, ownerId);
        return ResponseEntity.ok(event);
    }

    // ─────────── UPDATE (personal only) ───────────
    // PUT /api/events/{id}
    @PutMapping("/{id}")
    public ResponseEntity<EventEntity> updateEvent(
            @PathVariable("id") Long id,
            @RequestBody EventEntity updatedEvent,
            Authentication authentication
    ) {
        String ownerId = authentication.getName();
        EventEntity updated = eventService.updatePersonalEvent(id, ownerId, updatedEvent);
        return ResponseEntity.ok(updated);
    }

    // ─────────── DELETE (personal only) ───────────
    // DELETE /api/events/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(
            @PathVariable("id") Long id,
            Authentication authentication
    ) {
        String ownerId = authentication.getName();
        eventService.deletePersonalEvent(id, ownerId);
        return ResponseEntity.noContent().build();
    }
}
