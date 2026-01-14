package graduation.project.model.semesterGPA;

import lombok.Data;

import java.util.List;

@Data
public class GpaListRequest {

    private List<GpaEntry> subjects;

}
