package graduation.project.model.Items;

import jakarta.persistence.Embeddable;
import lombok.Data;

@Data
@Embeddable
public class Prerequisites {
   private String name;
   private String code;
}
