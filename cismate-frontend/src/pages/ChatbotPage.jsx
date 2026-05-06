import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendChatMessage } from "../api/chatApi";

function ChatbotPage() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi! How can I assist you today? If you have any questions about the Computer Information Systems program at the University of Jordan, feel free to ask!",
    },
  ]);

  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();

    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const response = await sendChatMessage({
        message: userMessage,
        sessionId: sessionId || null,
      });

      const data = response.data;

      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      setMessages((prev) => [...prev, { sender: "bot", text: data.answer }]);
    } catch (err) {
      console.error(err);

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Something went wrong while contacting the chatbot.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate("/home")}>
          ←
        </button>

        <h1 style={styles.title}>Chatbot</h1>

        <div style={styles.headerSpacer}></div>
      </div>

      <div style={styles.chatArea}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={
              message.sender === "user"
                ? styles.userMessageRow
                : styles.botMessageRow
            }
          >
            <div
              style={
                message.sender === "user"
                  ? styles.userMessage
                  : styles.botMessage
              }
            >
              <p style={styles.messageText}>{message.text}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div style={styles.botMessageRow}>
            <div style={styles.botMessage}>
              <p style={styles.messageText}>Thinking...</p>
            </div>
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <div style={styles.sessionText}>
          {sessionId ? `Session: ${sessionId}` : "Session not started yet"}
        </div>

        <div style={styles.inputRow}>
          <input
            style={styles.input}
            type="text"
            placeholder="Ask about courses, profs, etc..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button style={styles.sendButton} onClick={handleSend}>
            ➤
          </button>
        </div>
      </div>

      <div style={styles.bottomNav}>
        <button style={{ ...styles.navButton, ...styles.activeNav }}>
          Chatbot
        </button>

        <button style={styles.navButton} onClick={() => navigate("/explore")}>
          Explore
        </button>

        <button style={styles.navButton} onClick={() => navigate("/home")}>
          Home
        </button>

        <button
          style={styles.navButton}
          onClick={() => navigate("/schedule-generator")}
        >
          Schedule
        </button>

        <button style={styles.navButton} onClick={() => navigate("/community")}>
          Community
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#020817",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    height: "72px",
    background: "#111827",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  backButton: {
    background: "transparent",
    border: "none",
    color: "#ffffff",
    fontSize: "24px",
    cursor: "pointer",
    width: "40px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
  },
  headerSpacer: {
    width: "40px",
  },
  chatArea: {
    flex: 1,
    padding: "18px 14px 8px 14px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  userMessageRow: {
    display: "flex",
    justifyContent: "flex-end",
  },
  botMessageRow: {
    display: "flex",
    justifyContent: "flex-start",
  },
  userMessage: {
    maxWidth: "70%",
    background: "#55e6d8",
    color: "#083344",
    padding: "14px 16px",
    borderRadius: "18px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
  },
  botMessage: {
    maxWidth: "78%",
    background: "#1f2937",
    color: "#ffffff",
    padding: "14px 16px",
    borderRadius: "18px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  messageText: {
    margin: 0,
    lineHeight: "1.5",
    whiteSpace: "pre-wrap",
  },
  footer: {
    padding: "8px 14px 18px 14px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    background: "#020817",
    marginBottom: "92px",
  },
  sessionText: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    marginBottom: "8px",
    wordBreak: "break-all",
  },
  inputRow: {
    display: "flex",
    gap: "10px",
  },
  input: {
    flex: 1,
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#ffffff",
    padding: "14px 16px",
    borderRadius: "16px",
    outline: "none",
  },
  sendButton: {
    width: "56px",
    border: "none",
    borderRadius: "16px",
    background: "#55e6d8",
    color: "#083344",
    fontSize: "22px",
    fontWeight: "700",
    cursor: "pointer",
  },
  bottomNav: {
    position: "fixed",
    left: "50%",
    transform: "translateX(-50%)",
    bottom: "18px",
    width: "min(920px, calc(100% - 24px))",
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "22px",
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    padding: "14px 10px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },
  navButton: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.7)",
    cursor: "pointer",
    padding: "10px 0",
    borderRadius: "12px",
    fontWeight: "600",
  },
  activeNav: {
    color: "#4ade80",
  },
};

export default ChatbotPage;