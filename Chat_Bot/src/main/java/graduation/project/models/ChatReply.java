package graduation.project.models;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ChatReply {
    private String sessionId;
    private String answer;
}
