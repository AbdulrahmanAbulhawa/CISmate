package graduation.project.USER.models.records;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.Set;

public record UserDTO(
        @JsonProperty(access = JsonProperty.Access.READ_ONLY) String email,
      String firstName,
       String lastName,
        String major,
       BigDecimal gpa,
       Integer completedHours,
        Integer studyYear,
     String role,
     Set<Long> completedCourseIds
) {
}
