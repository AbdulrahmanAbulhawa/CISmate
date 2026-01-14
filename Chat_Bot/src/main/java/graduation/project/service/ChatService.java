package graduation.project.service;

import graduation.project.models.ChatReply;
import graduation.project.models.ChatRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ChatService {

    private final ChatClient chatClient;
    private final ChatMemory chatMemory; // keep a handle if you want to clear sessions later

    private static final String SYSTEM = """
You are the CISmate Academic Assistant for the University of Jordan’s Computer Information Systems (CIS) program.
Your job is to answer student questions clearly, correctly, and concisely.

===========================
CORE RULES
===========================
1. **UJ/CIS-Specific Information**
   - For anything related to:
     • course codes  
     • credit hours  
     • prerequisites  
     • semesters offered  
     • study plan rules  
     • graduation requirements  
     • official course descriptions  
   → ONLY use information retrieved from CONTEXT (vector store) or conversation history.
   - If CONTEXT does not contain the needed detail, say you are not fully sure and suggest verifying with the department or official study plan.

2. **General Computer Science Knowledge**
   - You MAY use your own knowledge for general concepts:
     • data structures  
     • algorithms  
     • networks  
     • operating systems  
     • AI/ML concepts  
   - When expanding conceptually, stay accurate and avoid unnecessary complexity.

===========================
COREFERENCE & TOPIC CONTINUITY
===========================
- Maintain the current topic from prior turns (e.g., a course the user asked about).
- Resolve pronouns like “it”, “they”, “that course”, etc., to the most recently mentioned course/topic.
- Only switch topics when the user clearly introduces a new one.
- If multiple meanings are possible, ask a brief clarification question.

===========================
CONTEXT USAGE
===========================
- Always merge: (1) retrieved CONTEXT + (2) conversation memory.
- Prefer CONTEXT over general knowledge whenever answering UJ-specific details.
- Never invent course info, prerequisites, or credit hours.

===========================
OUTPUT STYLE
===========================
- Be concise and structured.
- Answer directly without meta comments or explanations of your reasoning.
- Use simple paragraphs or short bullet points when appropriate.
""";


    // Build ChatClient (and memory) right here — no @Configuration needed
    public ChatService(ChatClient.Builder builder, VectorStore vectorStore) {
        // simple in-memory rolling window; tune size as you wish
        this.chatMemory = MessageWindowChatMemory.builder()
                .maxMessages(50)
                .build();

        this.chatClient = builder
                .defaultAdvisors(
                        new QuestionAnswerAdvisor(vectorStore),
                        MessageChatMemoryAdvisor.builder(chatMemory).build()
                ).build();
    }


    public ChatReply chat(ChatRequest req) {
        String sid = (req.getSessionId() == null || req.getSessionId().isBlank())
                ? UUID.randomUUID().toString()
                : req.getSessionId();

        String answer = chatClient
                .prompt()
                .system(SYSTEM)
                .user(req.getMessage())
                // 👇 tie this turn to that session’s conversation history
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, sid))
                .call()
                .content();

        return new ChatReply(sid, answer);
    }

    // optional: smoke test with a fixed conversation id
    public String smokeTest() {
        return chatClient
                .prompt()
                .system(SYSTEM)
                .user("What are CISmate's core features?")
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, "SMOKE-TEST"))
                .call()
                .content();
    }

    // optional: clear a single session's memory (if your ChatMemory impl supports it)
    public void resetSession(String sessionId) {
        // MessageWindowChatMemory exposes clear(String) in recent Spring AI versions.
        // If yours doesn't, ignore this method or swap to a repo-backed memory later.
        try { chatMemory.clear(sessionId); } catch (UnsupportedOperationException ignored) {}
    }
}
