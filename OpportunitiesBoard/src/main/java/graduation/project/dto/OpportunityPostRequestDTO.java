package graduation.project.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OpportunityPostRequestDTO {

    /**
     * "GROUP" or "INTERNSHIP"
     */
    @NotBlank
    @Size(max = 20)
    private String type;

    @NotBlank
    @Size(max = 150)
    private String title;

    @NotBlank
    private String description;

    @NotBlank
    @Email
    @Size(max = 150)
    private String contactEmail;

    @NotBlank
    @Size(max = 50)
    private String contactPhone;

    /**
     * Optional:
     * - Required for INTERNSHIP (company posts)
     * - Can be null for GROUP
     */
    @Size(max = 150)
    private String companyName;

    /**
     * Required for both:
     * - GROUP: teammates wanted
     * - INTERNSHIP: interns needed
     */
    @NotNull
    @Min(1)
    private Integer slotsNeeded;
}
