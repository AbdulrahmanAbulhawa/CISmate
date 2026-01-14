package graduation.project.Service.courseServ;

import graduation.project.model.Items.Prerequisites;
import graduation.project.model.Items.ResourceItem;
import graduation.project.model.course.CourseDTO;
import graduation.project.model.course.CourseEntity;
import graduation.project.model.professor.ProfessorEntity;
import graduation.project.repository.courseRepo.Course_Repo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class Course_service {

    //construct
    Course_Repo repo;
    public Course_service(Course_Repo course_repo) {
        this.repo = course_repo;
    }
    //construct

    public List<String> getAllCourseNames() {
        return repo.getAllCourseNames();
    }

    @Transactional(readOnly = true)
    public CourseDTO getById(Long id) {
        CourseEntity c = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Course not found: " + id));

        // prerequisites -> List<String> (codes only)
        List<String> prereqNames = new ArrayList<>();
        List<Prerequisites> prereqs = c.getPrerequisites();
        if (prereqs != null) {
            for (Prerequisites p : prereqs) {
                if (p != null && p.getName() != null) {
                    prereqNames.add(p.getName());
                }
            }
        }

        // professors -> List<String> (names only)
        List<String> professorNames = new ArrayList<>();
        // Note: In your entity, professors is a Set<ProfessorEntity>
        // We'll iterate safely regardless
        if (c.getProfessors() != null) {
            for (ProfessorEntity p : c.getProfessors()) {
                if (p != null && p.getName() != null) {
                    professorNames.add(p.getName());
                }
            }
        }

        // resources -> List<String> (urls only)
        List<String> resourceInfo = new ArrayList<>();
        List<ResourceItem> resources = c.getResources();
        if (resources != null) {
            for (ResourceItem r : resources) {
                if (r != null && r.getTitle() != null && r.getUrl() != null) {
                    resourceInfo.add(r.getTitle() + " - " + r.getUrl());
                }
            }
        }

        // Match your CourseDTO fields order (no courseCode in the DTO)
        return new CourseDTO(
                c.getImageUrl(),
                c.getCourseName(),
                c.getDescription(),
                c.getDifficulty(),
                c.getCreditHours(),
                prereqNames,
                c.getSemesterOffered(),
                professorNames,
                c.getAssessment(),
                resourceInfo,
                c.getCategory(),
                c.getRecommendedYear(),
                c.getRecommendedSemester()
        );
    }




}
