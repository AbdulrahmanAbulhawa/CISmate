package graduation.project.service;

import graduation.project.dto.OpportunityPostRequestDTO;
import graduation.project.dto.OpportunityPostResponseDTO;
import graduation.project.model.OpportunityPostEntity;
import graduation.project.repository.OpportunityPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OpportunityService {

    private final OpportunityPostRepository repository;

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_FULL = "FULL";

    private static final String TYPE_GROUP = "GROUP";
    private static final String TYPE_INTERNSHIP = "INTERNSHIP";

    // ─────────── LIST ───────────

    public List<OpportunityPostResponseDTO> getActiveByType(String type) {
        String t = normalizeType(type);

        List<OpportunityPostEntity> entities =
                repository.findByTypeAndStatusOrderByCreatedAtDesc(t, STATUS_ACTIVE);

        List<OpportunityPostResponseDTO> result = new ArrayList<>();
        for (OpportunityPostEntity e : entities) {
            result.add(toResponse(e));
        }
        return result;
    }

    // ─────────── CREATE (GROUP - STUDENT) ───────────

    @Transactional
    public OpportunityPostResponseDTO createGroupPost(String studentId, OpportunityPostRequestDTO dto) {
        String t = normalizeType(dto.getType());
        if (!TYPE_GROUP.equals(t)) {
            throw new IllegalArgumentException("Students can only create GROUP posts.");
        }

        int slots = requireSlots(dto);

        OpportunityPostEntity entity = OpportunityPostEntity.builder()
                .type(TYPE_GROUP)
                .title(dto.getTitle().trim())
                .description(dto.getDescription().trim())
                .contactEmail(dto.getContactEmail().trim())
                .contactPhone(dto.getContactPhone().trim())
                .createdByUserId(studentId)
                .companyName(null)
                .slotsNeeded(slots)
                .interestedCount(0)
                .status(STATUS_ACTIVE)
                .build();

        OpportunityPostEntity saved = repository.save(entity);
        return toResponse(saved);
    }

    // ─────────── CREATE (INTERNSHIP - ADMIN) ───────────

    @Transactional
    public OpportunityPostResponseDTO createInternshipPost(String adminId, OpportunityPostRequestDTO dto) {
        String t = normalizeType(dto.getType());
        if (!TYPE_INTERNSHIP.equals(t)) {
            throw new IllegalArgumentException("Admin can only create INTERNSHIP posts.");
        }

        int slots = requireSlots(dto);

        if (dto.getCompanyName() == null || dto.getCompanyName().trim().isEmpty()) {
            throw new IllegalArgumentException("companyName is required for INTERNSHIP posts.");
        }

        OpportunityPostEntity entity = OpportunityPostEntity.builder()
                .type(TYPE_INTERNSHIP)
                .title(dto.getTitle().trim())
                .description(dto.getDescription().trim())
                .contactEmail(dto.getContactEmail().trim())
                .contactPhone(dto.getContactPhone().trim())
                .createdByUserId(adminId)
                .companyName(dto.getCompanyName().trim())
                .slotsNeeded(slots)
                .interestedCount(0)
                .status(STATUS_ACTIVE)
                .build();

        OpportunityPostEntity saved = repository.save(entity);
        return toResponse(saved);
    }

    // ─────────── UPDATE (POSTER ONLY) ───────────

    @Transactional
    public OpportunityPostResponseDTO updatePost(Long postId, String requesterUserId, OpportunityPostRequestDTO dto) {

        OpportunityPostEntity post = repository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found."));

        // Only poster can update
        if (post.getCreatedByUserId() == null || !post.getCreatedByUserId().equals(requesterUserId)) {
            throw new IllegalArgumentException("You can only update your own posts.");
        }

        // Optional rule: don't edit FULL posts
        if (STATUS_FULL.equalsIgnoreCase(post.getStatus())) {
            throw new IllegalArgumentException("This post is FULL and cannot be edited.");
        }

        // Type cannot be changed
        String incomingType = normalizeType(dto.getType());
        if (!post.getType().equalsIgnoreCase(incomingType)) {
            throw new IllegalArgumentException("Post type cannot be changed.");
        }

        int newSlots = requireSlots(dto);

        // Don't allow setting slots below already interested count
        if (newSlots < post.getInterestedCount()) {
            throw new IllegalArgumentException("slotsNeeded cannot be less than interestedCount.");
        }

        post.setTitle(dto.getTitle().trim());
        post.setDescription(dto.getDescription().trim());
        post.setContactEmail(dto.getContactEmail().trim());
        post.setContactPhone(dto.getContactPhone().trim());
        post.setSlotsNeeded(newSlots);

        // companyName rule
        if (TYPE_INTERNSHIP.equalsIgnoreCase(post.getType())) {
            if (dto.getCompanyName() == null || dto.getCompanyName().trim().isEmpty()) {
                throw new IllegalArgumentException("companyName is required for INTERNSHIP posts.");
            }
            post.setCompanyName(dto.getCompanyName().trim());
        } else {
            post.setCompanyName(null);
        }

        // Keep ACTIVE (it will become FULL only through interested)
        post.setStatus(STATUS_ACTIVE);

        OpportunityPostEntity saved = repository.save(post);
        return toResponse(saved);
    }

    // ─────────── DELETE (ADMIN ONLY) ───────────

    @Transactional
    public void deletePostAsAdmin(Long postId) {
        OpportunityPostEntity post = repository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found."));
        repository.delete(post);
    }

    // ─────────── INTERESTED (SIMPLE) ───────────

    @Transactional
    public OpportunityPostResponseDTO markInterested(Long postId) {

        OpportunityPostEntity post = repository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found."));

        // If already FULL, do nothing
        if (!STATUS_ACTIVE.equals(post.getStatus())) {
            return toResponse(post);
        }

        // Increase count
        post.setInterestedCount(post.getInterestedCount() + 1);

        // If reached limit, mark FULL (will disappear from board)
        if (post.getInterestedCount() >= post.getSlotsNeeded()) {
            post.setStatus(STATUS_FULL);
        }

        OpportunityPostEntity saved = repository.save(post);
        return toResponse(saved);
    }

    // ─────────── HELPERS ───────────

    private int requireSlots(OpportunityPostRequestDTO dto) {
        if (dto.getSlotsNeeded() == null || dto.getSlotsNeeded() < 1) {
            throw new IllegalArgumentException("slotsNeeded must be >= 1.");
        }
        return dto.getSlotsNeeded();
    }

    private String normalizeType(String type) {
        if (type == null) {
            throw new IllegalArgumentException("type is required.");
        }

        String t = type.trim().toUpperCase();

        if (!TYPE_GROUP.equals(t) && !TYPE_INTERNSHIP.equals(t)) {
            throw new IllegalArgumentException("type must be GROUP or INTERNSHIP.");
        }

        return t;
    }

    private OpportunityPostResponseDTO toResponse(OpportunityPostEntity e) {
        OpportunityPostResponseDTO dto = new OpportunityPostResponseDTO();
        dto.setId(e.getId());
        dto.setType(e.getType());
        dto.setTitle(e.getTitle());
        dto.setDescription(e.getDescription());
        dto.setContactEmail(e.getContactEmail());
        dto.setContactPhone(e.getContactPhone());
        dto.setCreatedByUserId(e.getCreatedByUserId());
        dto.setCompanyName(e.getCompanyName());
        dto.setSlotsNeeded(e.getSlotsNeeded());
        dto.setInterestedCount(e.getInterestedCount());
        dto.setStatus(e.getStatus());
        dto.setCreatedAt(e.getCreatedAt());
        return dto;
    }
}
