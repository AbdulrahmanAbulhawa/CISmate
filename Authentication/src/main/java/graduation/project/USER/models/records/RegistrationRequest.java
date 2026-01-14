package graduation.project.USER.models.records;
import java.math.BigDecimal;
import java.util.List;

public record RegistrationRequest(
        String email,
        String password,
        String firstName,
        String lastName,
        String major,           // optional
        BigDecimal gpa,         // optional
        Integer completedHours, // optional
        Integer studyYear,
        List<Long> completedCourseIds // << course IDs the user already finished
) {}
