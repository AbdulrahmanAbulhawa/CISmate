    package graduation.project.Service.profServ;

    import graduation.project.model.course.CourseEntity;
    import graduation.project.model.professor.ProfessorDTO;
    import graduation.project.model.professor.ProfessorEntity;
    import graduation.project.repository.profRepo.Professor_repo;
    import org.springframework.stereotype.Service;
    import org.springframework.transaction.annotation.Transactional;
    import org.springframework.web.server.ResponseStatusException;

    import java.util.ArrayList;
    import java.util.List;

    import static org.springframework.http.HttpStatus.NOT_FOUND;

    @Service
    public class Professor_service {

        Professor_repo repo;
        public Professor_service(Professor_repo repo) {
            this.repo = repo;
        }

        public List<String> GetAllProfessors(){
            return repo.GetAllProfessors();
        }

        @Transactional(readOnly = true)
        public ProfessorDTO getProfById(long id) {
            ProfessorEntity p = repo.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "professor not found: " + id));

            // Collect course names (change to getCourseCode() if you prefer codes)
            List<String> courseNames = new ArrayList<>();
            if (p.getCourses() != null) {
                for (CourseEntity c : p.getCourses()) { // Set<CourseEntity> is fine in for-each
                    if (c != null && c.getCourseName() != null) {
                        courseNames.add(c.getCourseName());
                    }
                }
            }

            return new ProfessorDTO(
                    p.getName(),
                    p.getTitle(),
                    p.getEmail(),
                    p.getDepartment(),
                    p.getOffice(),
                    p.getImageUrl(),
                    p.getTags(),
                    courseNames
            );
        }

    }
