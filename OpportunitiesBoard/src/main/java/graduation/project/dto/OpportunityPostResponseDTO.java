package graduation.project.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OpportunityPostResponseDTO {

    private Long id;

    private String type;        // "GROUP" or "INTERNSHIP"
    private String title;
    private String description;

    private String contactEmail;
    private String contactPhone;

    private String createdByUserId;

    private String companyName;

    private int slotsNeeded;
    private int interestedCount;

    private String status;      // "ACTIVE" or "FULL"
    private LocalDateTime createdAt;
}
