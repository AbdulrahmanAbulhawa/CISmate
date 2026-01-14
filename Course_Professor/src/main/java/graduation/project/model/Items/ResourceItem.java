package graduation.project.model.Items;

import jakarta.persistence.Embeddable;
import lombok.Data;

@Data
@Embeddable
public class ResourceItem {
    private String title;
    private String url;
}