package graduation.project.controller;

import graduation.project.models.ChatReply;
import graduation.project.models.ChatRequest;
import graduation.project.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat_bot")
@CrossOrigin
@RequiredArgsConstructor
public class Chat_controller {
    private final ChatService chatService;

    // POST: same contract
    @PostMapping
    public ChatReply chat(@RequestBody ChatRequest req) {
        return chatService.chat(req);
    }

    // Optional: quick smoke test
    @GetMapping("/")
    public String test() {
        return chatService.smokeTest();
    }
}
