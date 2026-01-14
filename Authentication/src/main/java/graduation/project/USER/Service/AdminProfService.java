package graduation.project.USER.Service;

import graduation.project.model.professor.ProfessorEntity;
import graduation.project.USER.repo.AdminProfRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class AdminProfService {

    private final AdminProfRepo repo;

    public AdminProfService(AdminProfRepo repo) {
        this.repo = repo;
    }

    /* ================= Read ================= */

    @Transactional(readOnly = true)
    public List<ProfessorAdminDTO> listAll() {
        return repo.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public ProfessorAdminDTO getOne(Long id) {
        var p = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Professor not found: " + id));
        return toDto(p);
    }

    /* ============ Create / Update ============ */

    @Transactional
    public ProfessorAdminDTO create(ProfessorAdminDTO dto) {
        var e = new ProfessorEntity();
        mapScalars(dto, e);
        var saved = repo.save(e);
        return toDto(saved);
    }

    @Transactional
    public ProfessorAdminDTO update(Long id, ProfessorAdminDTO dto) {
        var e = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Professor not found: " + id));
        mapScalars(dto, e);
        var saved = repo.save(e);
        return toDto(saved);
    }

    /* ================= Delete ================ */

    @Transactional
    public void deleteById(Long id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(NOT_FOUND, "Professor not found: " + id);
        }
        repo.deleteById(id);
    }

    /* ================= Helpers =============== */

    private void mapScalars(ProfessorAdminDTO d, ProfessorEntity e) {
        // Only scalars here; course links are managed on Course side (CourseEntity.professors)
        e.setName(d.name());
        e.setTitle(d.title());
        e.setEmail(d.email());
        e.setDepartment(d.department());
        e.setOffice(d.office());
        e.setTags(d.tags());
    }

    private ProfessorAdminDTO toDto(ProfessorEntity p) {
        var courseNames = p.getCourses() == null ? List.<String>of()
                : p.getCourses().stream()
                .map(c -> c.getCourseName())
                .filter(Objects::nonNull)
                .sorted(String::compareToIgnoreCase)
                .toList();

        return new ProfessorAdminDTO(
                p.getId(),
                p.getName(),
                p.getTitle(),
                p.getEmail(),
                p.getDepartment(),
                p.getOffice(),
                p.getTags(),
                courseNames
        );
    }

    /* =============== DTO ==================== */

    public record ProfessorAdminDTO(
            Long id,
            String name,
            String title,
            String email,
            String department,
            String office,
            String tags,
            List<String> courses // only course names
    ) {}
}
