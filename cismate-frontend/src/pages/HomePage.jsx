import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function HomePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const TOTAL_HOURS = 132;
  const TIP_DURATION_MS = 30000;

  const hints = [
    "Review one old topic before starting a new one.",
    "Break long tasks into 25-minute study blocks.",
    "Check your calendar before planning your day.",
    "Finish one small task first to build momentum.",
    "Do not overload your semester with only hard courses.",
    "Check prerequisites before choosing any course.",
    "Keep a backup schedule in case sections fill up.",
    "Use office hours before the exam week, not after.",
    "After each lecture, write three key points.",
    "Practice problems matter more than rereading slides.",
    "Start assignments the same day they are posted.",
    "Do not ignore easy marks like quizzes and attendance.",
    "Split big projects into small weekly tasks.",
    "Save PDFs, slides, and notes in one organized folder.",
    "Check course announcements every day.",
    "Revise mistakes before moving to new material.",
    "Use past exams to understand question style.",
    "Avoid stacking too many labs in one day.",
    "Pick balanced courses: hard, medium, and easy.",
    "Sleep before exams. Tired studying is weak studying.",
  ];

  const [showMenu, setShowMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [hintProgress, setHintProgress] = useState(0);

  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem("theme") === "light";
  });

  const styles = getStyles(isLightMode);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    getUserInfo();
  }, []);

  useEffect(() => {
    setHintProgress(0);

    const startedAt = Date.now();

    const progressIntervalId = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min((elapsed / TIP_DURATION_MS) * 100, 100);
      setHintProgress(progress);
    }, 100);

    const tipTimeoutId = setTimeout(() => {
      setHintProgress(0);
      setHintIndex((prev) => (prev + 1) % hints.length);
    }, TIP_DURATION_MS);

    return () => {
      clearInterval(progressIntervalId);
      clearTimeout(tipTimeoutId);
    };
  }, [hintIndex, hints.length]);

  const getUserInfo = () => {
    setLoading(true);

    axios
      .get("http://localhost:8080/userInfo", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log("HOME USER INFO:", res.data);
        setUser(res.data);
      })
      .catch((err) => {
        console.log("HOME USER INFO ERROR:", err.response || err);
        alert("Could not load user info. Check console.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const toggleTheme = () => {
    const nextMode = !isLightMode;
    setIsLightMode(nextMode);
    localStorage.setItem("theme", nextMode ? "light" : "dark");
  };

  const nextHint = () => {
    setHintProgress(0);
    setHintIndex((prev) => (prev + 1) % hints.length);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const fullName =
    user?.firstName || user?.lastName
      ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
      : "Student";

  const completedHours = Number(user?.completedHours || 0);
  const remainingHours = Math.max(TOTAL_HOURS - completedHours, 0);

  const progressPercent = Math.min(
    Math.round((completedHours / TOTAL_HOURS) * 100),
    100
  );

  const progressDegrees = Math.round((progressPercent / 100) * 360);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Home</h1>

          <div style={styles.menuWrapper}>
            <button
              style={styles.menuButton}
              onClick={() => setShowMenu(!showMenu)}
            >
              ☰
            </button>

            {showMenu && (
              <div style={styles.dropdown}>
                <button
                  style={styles.dropdownItem}
                  onClick={() => navigate("/update-info")}
                >
                  🧑‍💼 Update Info
                </button>

                <button
                  style={styles.dropdownItem}
                  onClick={() => navigate("/calendar")}
                >
                  📅 My Calendar
                </button>

                <button
                  style={styles.dropdownItem}
                  onClick={() => navigate("/gpa")}
                >
                  🧮 GPA Calculator
                </button>


                <button style={styles.dropdownItem} onClick={toggleTheme}>
                  {isLightMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
                </button>

                <button
                  style={{ ...styles.dropdownItem, ...styles.logoutItem }}
                  onClick={handleLogout}
                >
                  ⏻ Log Out
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div style={styles.card}>
            <p style={styles.info}>Loading user info...</p>
          </div>
        ) : (
          <>
            <div style={styles.card}>
              <div style={styles.profileTop}>
                <div>
                  <h2 style={styles.name}>{fullName}</h2>

                  <p style={styles.info}>✉️ {user?.email || "No email"}</p>

                  <p style={styles.info}>
                    🎓 Major: {user?.major || "Not set"}
                  </p>

                  <p style={styles.info}>
                    📘 Year {user?.studyYear || "Not set"}
                  </p>

                  <p style={styles.info}>
                    🧾 CGPA:{" "}
                    {user?.gpa !== null && user?.gpa !== undefined
                      ? Number(user.gpa).toFixed(2)
                      : "Not set"}
                  </p>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.progressRow}>
                <div
                  style={{
                    ...styles.progressCircle,
                    background: `conic-gradient(#6ee7f9 0deg, #6ee7f9 ${progressDegrees}deg, ${
                      isLightMode ? "#d1d5db" : "#1f2937"
                    } ${progressDegrees}deg, ${
                      isLightMode ? "#d1d5db" : "#1f2937"
                    } 360deg)`,
                  }}
                >
                  <div style={styles.progressInner}>{progressPercent}%</div>
                </div>

                <div>
                  <h3 style={styles.cardHeading}>Progress</h3>

                  <p style={styles.info}>Completed: {completedHours} h</p>

                  <p style={styles.info}>Remaining: {remainingHours} h</p>

                  <p style={styles.info}>Total: {TOTAL_HOURS} h</p>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.hintRow}>
                <div style={styles.hintLeft}>
                  <span style={styles.hintIcon}>💡</span>

                  <p style={styles.hintText}>{hints[hintIndex]}</p>
                </div>

                
              </div>

              <div style={styles.hintProgressTrack}>
                <div
                  style={{
                    ...styles.hintProgressFill,
                    width: `${hintProgress}%`,
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div style={styles.bottomNav}>
        <button style={styles.navButton} onClick={() => navigate("/chatbot")}>
          Chatbot
        </button>

        <button style={styles.navButton} onClick={() => navigate("/explore")}>
          Explore
        </button>

        <button style={{ ...styles.navButton, ...styles.activeNav }}>
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

function getStyles(isLightMode) {
  return {
    page: {
      minHeight: "100vh",
      background: isLightMode ? "#f3f4f6" : "#07111c",
      color: isLightMode ? "#111827" : "#ffffff",
      padding: "24px",
      paddingBottom: "110px",
      transition: "0.2s ease",
    },

    container: {
      maxWidth: "900px",
      margin: "0 auto",
    },

    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
      position: "relative",
    },

    title: {
      fontSize: "30px",
      fontWeight: "700",
    },

    menuWrapper: {
      position: "relative",
    },

    menuButton: {
      width: "44px",
      height: "44px",
      borderRadius: "12px",
      border: isLightMode
        ? "1px solid rgba(0,0,0,0.1)"
        : "1px solid rgba(255,255,255,0.08)",
      background: isLightMode ? "#ffffff" : "#101c2b",
      color: isLightMode ? "#111827" : "#fff",
      cursor: "pointer",
      fontSize: "20px",
    },

    dropdown: {
      position: "absolute",
      top: "52px",
      right: 0,
      width: "230px",
      background: isLightMode ? "#ffffff" : "#0b1623",
      border: isLightMode
        ? "1px solid rgba(0,0,0,0.08)"
        : "1px solid rgba(255,255,255,0.08)",
      borderRadius: "16px",
      padding: "10px",
      boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      zIndex: 10,
    },

    dropdownItem: {
      padding: "12px 14px",
      borderRadius: "12px",
      border: "none",
      background: "transparent",
      color: isLightMode ? "#111827" : "#fff",
      textAlign: "left",
      cursor: "pointer",
      fontWeight: "600",
    },

    logoutItem: {
      color: "#ef4444",
    },

    card: {
      background: isLightMode ? "#ffffff" : "#0b1623",
      border: isLightMode
        ? "1px solid rgba(0,0,0,0.08)"
        : "1px solid rgba(255,255,255,0.06)",
      borderRadius: "20px",
      padding: "24px",
      marginBottom: "20px",
      boxShadow: isLightMode
        ? "0 10px 25px rgba(0,0,0,0.08)"
        : "0 10px 30px rgba(0,0,0,0.2)",
    },

    profileTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },

    name: {
      fontSize: "28px",
      marginBottom: "10px",
    },

    info: {
      color: isLightMode ? "rgba(17,24,39,0.72)" : "rgba(255,255,255,0.72)",
      marginBottom: "8px",
      lineHeight: 1.5,
    },

    progressRow: {
      display: "flex",
      alignItems: "center",
      gap: "24px",
      flexWrap: "wrap",
    },

    progressCircle: {
      width: "110px",
      height: "110px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },

    progressInner: {
      width: "78px",
      height: "78px",
      borderRadius: "50%",
      background: isLightMode ? "#ffffff" : "#0b1623",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "700",
    },

    cardHeading: {
      fontSize: "22px",
      margin: "0 0 10px",
    },

    hintRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "14px",
      marginBottom: "18px",
    },

    hintLeft: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },

    hintIcon: {
      fontSize: "24px",
    },

    hintText: {
      margin: 0,
      color: isLightMode ? "rgba(17,24,39,0.75)" : "rgba(255,255,255,0.75)",
      fontWeight: "600",
    },

    refreshButton: {
      width: "38px",
      height: "38px",
      borderRadius: "12px",
      border: "none",
      background: isLightMode ? "#f3f4f6" : "#101c2b",
      color: isLightMode ? "#111827" : "#ffffff",
      cursor: "pointer",
      fontSize: "20px",
    },

    hintProgressTrack: {
      height: "6px",
      background: isLightMode ? "#e5e7eb" : "#1f2937",
      borderRadius: "999px",
      overflow: "hidden",
    },

    hintProgressFill: {
      height: "100%",
      background: "#14b8a6",
      borderRadius: "999px",
      transition: "width 0.1s linear",
    },

    bottomNav: {
      position: "fixed",
      left: "50%",
      transform: "translateX(-50%)",
      bottom: "18px",
      width: "min(920px, calc(100% - 24px))",
      background: isLightMode ? "#ffffff" : "#0b1623",
      border: isLightMode
        ? "1px solid rgba(0,0,0,0.08)"
        : "1px solid rgba(255,255,255,0.06)",
      borderRadius: "22px",
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      padding: "14px 10px",
      boxShadow: isLightMode
        ? "0 10px 25px rgba(0,0,0,0.12)"
        : "0 10px 30px rgba(0,0,0,0.3)",
    },

    navButton: {
      background: "transparent",
      border: "none",
      color: isLightMode ? "rgba(17,24,39,0.6)" : "rgba(255,255,255,0.7)",
      cursor: "pointer",
      padding: "10px 0",
      borderRadius: "12px",
      fontWeight: "600",
    },

    activeNav: {
      color: "#14b8a6",
    },
  };
}

export default HomePage;