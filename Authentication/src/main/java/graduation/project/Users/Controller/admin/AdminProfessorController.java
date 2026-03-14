package graduation.project.Users.Controller.admin;

import graduation.project.Users.Service.AdminService.AdminProfService;
import graduation.project.Users.Service.AdminService.AdminProfService.ProfessorAdminDTO;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/professors")
@CrossOrigin
public class AdminProfessorController {

    private final AdminProfService service;

    public AdminProfessorController(AdminProfService service) {
        this.service = service;
    }

    /* ============== Create ============== */
    @PostMapping
    public ProfessorAdminDTO add(@RequestBody ProfessorAdminDTO dto) {
        return service.create(dto);
    }

    /* ============== Update ============== */
    @PutMapping("/{id}")
    public ProfessorAdminDTO update(@PathVariable Long id, @RequestBody ProfessorAdminDTO dto) {
        return service.update(id, dto);
    }

    /* ============== Delete ============== */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }

    /* ============== Read ================ */
    @GetMapping
    public List<ProfessorAdminDTO> listAll() {
        return service.listAll();
    }

    @GetMapping("/{id}")
    public ProfessorAdminDTO getOne(@PathVariable Long id) {
        return service.getOne(id);
    }
}
