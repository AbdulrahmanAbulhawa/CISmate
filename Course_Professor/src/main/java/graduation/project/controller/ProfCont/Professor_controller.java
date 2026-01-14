package graduation.project.controller.ProfCont;

import graduation.project.model.professor.ProfessorDTO;
import graduation.project.Service.profServ.Professor_service;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/professors")
@CrossOrigin
public class Professor_controller {

    Professor_service service;
    public Professor_controller(Professor_service service) {
        this.service = service;
    }

    @GetMapping("/getAllProfessors")
    public List<String> getAllProfessors(){
        return service.GetAllProfessors();
    }

    @GetMapping("/{id:\\d+}")
    public ProfessorDTO getProfById(@PathVariable Long id) {
        return service.getProfById(id);
    }
}
