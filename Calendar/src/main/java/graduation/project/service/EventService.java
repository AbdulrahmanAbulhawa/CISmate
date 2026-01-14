// File: src/main/java/graduation/project/service/EventService.java
package graduation.project.service;

import graduation.project.models.EventEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;

    // ───────────────────────────────
    // User (personal) operations
    // ───────────────────────────────

    public EventEntity createPersonalEvent(EventEntity event, String ownerId) {
        if (ownerId == null || ownerId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing authenticated user.");
        }
        validateEventBasics(event);

        event.setId(null);
        event.setOwnerId(ownerId);
        event.setGlobalEvent(false);
        event.setCreatedBy(ownerId);

        return eventRepository.save(event);
    }

    public List<EventEntity> getVisibleEventsForOwner(String ownerId) {
        if (ownerId == null || ownerId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing authenticated user.");
        }
        return eventRepository.findVisibleToOwner(ownerId);
    }

    public List<EventEntity> getVisibleEventsForOwnerBetween(String ownerId, LocalDateTime start, LocalDateTime end) {
        if (ownerId == null || ownerId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing authenticated user.");
        }
        if (start == null || end == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "start and end are required.");
        }
        if (end.isBefore(start)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "end must be after start.");
        }
        return eventRepository.findVisibleToOwnerBetween(ownerId, start, end);
    }

    public EventEntity getVisibleEventById(Long id, String ownerId) {
        EventEntity event = eventRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found."));

        boolean visible = event.isGlobalEvent() || Objects.equals(event.getOwnerId(), ownerId);
        if (!visible) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot access this event.");
        }
        return event;
    }

    public EventEntity updatePersonalEvent(Long id, String ownerId, EventEntity updatedEvent) {
        if (ownerId == null || ownerId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing authenticated user.");
        }
        EventEntity existing = eventRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found."));

        if (existing.isGlobalEvent()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Global events can only be edited by admin.");
        }
        if (!Objects.equals(existing.getOwnerId(), ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot edit this event.");
        }

        applyEditableFields(existing, updatedEvent);
        validateEventBasics(existing);

        existing.setOwnerId(ownerId);
        existing.setGlobalEvent(false);
        existing.setCreatedBy(existing.getCreatedBy() == null ? ownerId : existing.getCreatedBy());

        return eventRepository.save(existing);
    }

    public void deletePersonalEvent(Long id, String ownerId) {
        if (ownerId == null || ownerId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing authenticated user.");
        }
        EventEntity existing = eventRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found."));

        if (existing.isGlobalEvent()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Global events can only be deleted by admin.");
        }
        if (!Objects.equals(existing.getOwnerId(), ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot delete this event.");
        }
        eventRepository.delete(existing);
    }

    // ───────────────────────────────
    // Admin (global) operations
    // ───────────────────────────────

    /**
     * IMPORTANT:
     * You said ownerId MUST stay NOT NULL.
     * So for global/admin events we set ownerId = adminEmail (not null),
     * while still marking globalEvent = true.
     */
    public EventEntity createGlobalEvent(EventEntity event, String adminEmail) {
        if (adminEmail == null || adminEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing authenticated admin.");
        }
        validateEventBasics(event);

        event.setId(null);

        // ownerId MUST NOT be null → keep it as admin email
        event.setOwnerId(adminEmail);

        event.setGlobalEvent(true);
        event.setCreatedBy(adminEmail);

        return eventRepository.save(event);
    }

    public List<EventEntity> getGlobalEvents() {
        return eventRepository.findByGlobalEventTrueOrderByStartDateTimeAsc();
    }

    public List<EventEntity> getGlobalEventsBetween(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "start and end are required.");
        }
        if (end.isBefore(start)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "end must be after start.");
        }
        return eventRepository.findGlobalBetween(start, end);
    }

    /**
     * IMPORTANT:
     * Do NOT force ownerId to null. Keep it not-null.
     * If somehow it is null in DB (old rows), fallback to createdBy.
     */
    public EventEntity updateGlobalEvent(Long id, EventEntity updatedEvent) {
        EventEntity existing = eventRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found."));

        if (!existing.isGlobalEvent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This is not a global event.");
        }

        applyEditableFields(existing, updatedEvent);
        validateEventBasics(existing);

        // enforce global invariants
        existing.setGlobalEvent(true);

        // ownerId MUST NOT be null
        if (existing.getOwnerId() == null || existing.getOwnerId().isBlank()) {
            String fallback = (existing.getCreatedBy() == null || existing.getCreatedBy().isBlank())
                    ? "ADMIN"
                    : existing.getCreatedBy();
            existing.setOwnerId(fallback);
        }

        return eventRepository.save(existing);
    }

    public void deleteGlobalEvent(Long id) {
        EventEntity existing = eventRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found."));

        if (!existing.isGlobalEvent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This is not a global event.");
        }
        eventRepository.delete(existing);
    }

    // ───────────────────────────────
    // Helpers
    // ───────────────────────────────

    private void validateEventBasics(EventEntity e) {
        if (e == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event body is required.");
        }
        if (e.getTitle() == null || e.getTitle().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title is required.");
        }
        if (e.getStartDateTime() == null || e.getEndDateTime() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startDateTime and endDateTime are required.");
        }
        if (e.getEndDateTime().isBefore(e.getStartDateTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "endDateTime must be after startDateTime.");
        }
    }

    private void applyEditableFields(EventEntity target, EventEntity src) {
        if (src == null) return;

        target.setTitle(src.getTitle());
        target.setDescription(src.getDescription());
        target.setStartDateTime(src.getStartDateTime());
        target.setEndDateTime(src.getEndDateTime());
        target.setAllDay(src.isAllDay());
        target.setColorHex(src.getColorHex());
        target.setLocation(src.getLocation());

        // DO NOT allow changing these via request body:
        // ownerId, globalEvent, createdBy, createdAt, updatedAt
    }
}
