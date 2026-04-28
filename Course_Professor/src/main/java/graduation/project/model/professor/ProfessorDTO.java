package graduation.project.model.professor;

import java.util.List;

public record ProfessorDTO(
        Long id,
        String name,
        String title,
        String email,
        String department,
        String office,
        String imageUrl,
        String tags,
        List<String> courses
) {}