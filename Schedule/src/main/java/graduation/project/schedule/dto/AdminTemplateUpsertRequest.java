package graduation.project.schedule.dto;

import graduation.project.schedule.domain.enums.Semester;
import jakarta.validation.constraints.*;

import java.util.List;

public record AdminTemplateUpsertRequest(
        @NotNull Semester semester,
        @NotNull @Min(1) @Max(4) Integer yearLevel,
        String title,
        @NotEmpty List<Long> courseIds
) {}
