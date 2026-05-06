import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "http://localhost:8080";

function StudyPlanPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [openGroups, setOpenGroups] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    getStudyPlanData();
  }, []);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const parseCourseIdOnly = (item) => {
    if (typeof item === "string") {
      const parts = item.split(",");
      return {
        id: Number(parts[0]),
      };
    }

    if (Array.isArray(item)) {
      return {
        id: Number(item[0]),
      };
    }

    if (typeof item === "object" && item !== null) {
      return {
        id: Number(item.id ?? item.courseId),
      };
    }

    return {
      id: null,
    };
  };

  const getStudyPlanData = async () => {
    setLoading(true);

    try {
      const summaryRes = await axios.get(
        `${API_BASE_URL}/api/courses/getAllCourseNames`,
        {
          headers: authHeaders,
        }
      );

      const summaries = (summaryRes.data || [])
        .map(parseCourseIdOnly)
        .filter((course) => course.id);

      const detailedCourses = await Promise.all(
        summaries.map(async (summary) => {
          const detailRes = await axios.get(
            `${API_BASE_URL}/api/courses/${summary.id}`,
            {
              headers: authHeaders,
            }
          );

          const detail = detailRes.data || {};

          return {
            id: Number(summary.id),
            courseName: detail.courseName || "Unnamed Course",
            creditHours: Number(detail.creditHours ?? 0),
            difficulty: detail.difficulty || "Not set",
            prerequisites: Array.isArray(detail.prerequisites)
              ? detail.prerequisites
              : [],
            recommendedYear: detail.recommendedYear || "Unknown",
            recommendedSemester: detail.recommendedSemester || "Unknown",
          };
        })
      );

      console.table(
        detailedCourses.map((course) => ({
          name: course.courseName,
          year: course.recommendedYear,
          semester: course.recommendedSemester,
          hours: course.creditHours,
          difficulty: course.difficulty,
          prerequisites: course.prerequisites.join(" | "),
        }))
      );

      setCourses(detailedCourses);

      const defaultOpen = {};

      detailedCourses.forEach((course) => {
        const key = getGroupKey(
          course.recommendedYear,
          course.recommendedSemester
        );

        if (
          String(course.recommendedYear) === "1" &&
          String(course.recommendedSemester) === "1"
        ) {
          defaultOpen[key] = true;
        }
      });

      setOpenGroups(defaultOpen);
    } catch (err) {
      console.log("STUDY PLAN ERROR:", err.response || err);
      alert("Could not load study plan. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const text = `${course.courseName} ${course.difficulty} ${course.prerequisites.join(
        " "
      )}`;

      return text.toLowerCase().includes(search.toLowerCase());
    });
  }, [courses, search]);

  const groupedCourses = useMemo(() => {
    const groups = {};

    filteredCourses.forEach((course) => {
      const key = getGroupKey(
        course.recommendedYear,
        course.recommendedSemester
      );

      if (!groups[key]) {
        groups[key] = {
          key,
          year: course.recommendedYear,
          semester: course.recommendedSemester,
          title: formatGroupTitle(
            course.recommendedYear,
            course.recommendedSemester
          ),
          courses: [],
        };
      }

      groups[key].courses.push(course);
    });

    Object.keys(groups).forEach((key) => {
      groups[key].courses.sort((a, b) => {
        return a.courseName.localeCompare(b.courseName);
      });
    });

    return Object.values(groups).sort((a, b) => {
      const yearA = safeNumber(a.year);
      const yearB = safeNumber(b.year);

      if (yearA !== yearB) {
        return yearA - yearB;
      }

      const semesterA = safeNumber(a.semester);
      const semesterB = safeNumber(b.semester);

      return semesterA - semesterB;
    });
  }, [filteredCourses]);

  const toggleGroup = (key) => {
    setOpenGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const openAll = () => {
    const next = {};

    groupedCourses.forEach((group) => {
      next[group.key] = true;
    });

    setOpenGroups(next);
  };

  const closeAll = () => {
    setOpenGroups({});
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Study Plan</h1>
        </div>

        <div style={styles.sectionIntroCard}>
          <h3 style={styles.sectionIntroTitle}>Recommended Course Plan</h3>

          <p style={styles.sectionIntroText}>
            Browse the course plan by year and semester. Each semester can be
            opened to view credit hours, difficulty, and prerequisites.
          </p>
        </div>

        <div style={styles.toolsCard}>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Search course, difficulty, or prerequisite..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div style={styles.actionRow}>
            <button style={styles.smallButton} onClick={openAll}>
              Open All
            </button>

            <button style={styles.smallButtonGhost} onClick={closeAll}>
              Close All
            </button>
          </div>
        </div>

        {loading ? (
          <div style={styles.emptyBox}>Loading study plan...</div>
        ) : groupedCourses.length === 0 ? (
          <div style={styles.emptyBox}>No courses found.</div>
        ) : (
          <div style={styles.semesterList}>
            {groupedCourses.map((group) => {
              const isOpen = !!openGroups[group.key];

              return (
                <div key={group.key} style={styles.semesterCard}>
                  <button
                    style={styles.semesterHeader}
                    onClick={() => toggleGroup(group.key)}
                  >
                    <div>
                      <h2 style={styles.semesterTitle}>{group.title}</h2>

                      <p style={styles.semesterMeta}>
                        {group.courses.length} courses •{" "}
                        {group.courses.reduce(
                          (sum, course) =>
                            sum + Number(course.creditHours || 0),
                          0
                        )}{" "}
                        credit hours
                      </p>
                    </div>

                    <span style={styles.chevron}>{isOpen ? "▲" : "▼"}</span>
                  </button>

                  {isOpen && (
                    <div style={styles.courseList}>
                      {group.courses.map((course) => {
                        const difficultyStyle = getDifficultyStyle(
                          course.difficulty
                        );

                        return (
                          <div key={course.id} style={styles.courseRow}>
                            <div style={styles.courseMain}>
                              <h3 style={styles.courseName}>
                                {course.courseName}
                              </h3>

                              <div style={styles.courseInfoRow}>
                                <span style={styles.infoPill}>
                                  {course.creditHours} hours
                                </span>

                                <span
                                  style={{
                                    ...styles.difficultyPill,
                                    background: difficultyStyle.background,
                                    border: `1px solid ${difficultyStyle.border}`,
                                    color: difficultyStyle.text,
                                  }}
                                >
                                  {normalizeDifficulty(course.difficulty)}
                                </span>
                              </div>
                            </div>

                            <div style={styles.prereqBox}>
                              <strong style={styles.prereqTitle}>
                                Prerequisites
                              </strong>

                              {course.prerequisites.length === 0 ? (
                                <span style={styles.noPrereq}>
                                  No prerequisites
                                </span>
                              ) : (
                                <div style={styles.prereqList}>
                                  {course.prerequisites.map((prereq, index) => (
                                    <span
                                      key={`${course.id}-${index}`}
                                      style={styles.prereqPill}
                                    >
                                      {prereq}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={styles.bottomNav}>
        <button style={styles.navButton} onClick={() => navigate("/chatbot")}>
          Chatbot
        </button>

        <button
          style={{ ...styles.navButton, ...styles.activeNav }}
          onClick={() => navigate("/explore")}
        >
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

function getGroupKey(year, semester) {
  return `${year || "Unknown"}-${semester || "Unknown"}`;
}

function formatGroupTitle(year, semester) {
  const safeYear = year || "Unknown";
  const safeSemester = semester || "Unknown";

  return `Year ${safeYear} - Semester ${safeSemester}`;
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isNaN(number) ? 99 : number;
}

function normalizeDifficulty(value) {
  const text = String(value || "").trim();

  if (!text || text.toLowerCase() === "not set") {
    return "Not set";
  }

  const lower = text.toLowerCase();

  if (lower.includes("easy") || lower.includes("low") || lower === "1") {
    return "Easy";
  }

  if (
    lower.includes("medium") ||
    lower.includes("moderate") ||
    lower.includes("normal") ||
    lower === "2"
  ) {
    return "Medium";
  }

  if (
    lower.includes("hard") ||
    lower.includes("difficult") ||
    lower.includes("high") ||
    lower === "3"
  ) {
    return "Hard";
  }

  return text;
}

function getDifficultyStyle(value) {
  const difficulty = normalizeDifficulty(value).toLowerCase();

  if (difficulty === "hard") {
    return {
      background: "rgba(248,113,113,0.12)",
      border: "rgba(248,113,113,0.45)",
      text: "#fca5a5",
    };
  }

  if (difficulty === "medium") {
    return {
      background: "rgba(251,146,60,0.12)",
      border: "rgba(251,146,60,0.45)",
      text: "#fdba74",
    };
  }

  if (difficulty === "easy") {
    return {
      background: "rgba(74,222,128,0.12)",
      border: "rgba(74,222,128,0.45)",
      text: "#86efac",
    };
  }

  return {
    background: "rgba(148,163,184,0.12)",
    border: "rgba(148,163,184,0.35)",
    text: "#cbd5e1",
  };
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#07111c",
    color: "#ffffff",
    padding: "24px",
    paddingBottom: "110px",
  },

  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "20px",
  },

  title: {
    fontSize: "30px",
    fontWeight: "700",
    margin: 0,
  },

  sectionIntroCard: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "18px",
    padding: "22px",
    color: "#ffffff",
    textAlign: "left",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    marginBottom: "20px",
  },

  sectionIntroTitle: {
    fontSize: "22px",
    margin: "0 0 8px",
  },

  sectionIntroText: {
    margin: 0,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 1.5,
  },

  toolsCard: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "20px",
    padding: "18px",
    marginBottom: "18px",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "12px",
    alignItems: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },

  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "14px",
    color: "#ffffff",
    outline: "none",
  },

  actionRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  smallButton: {
    background: "#14b8a6",
    color: "#07111c",
    border: "none",
    borderRadius: "12px",
    padding: "12px 14px",
    fontWeight: "800",
    cursor: "pointer",
  },

  smallButtonGhost: {
    background: "transparent",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "12px",
    padding: "12px 14px",
    fontWeight: "800",
    cursor: "pointer",
  },

  emptyBox: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "18px",
    padding: "22px",
    color: "rgba(255,255,255,0.72)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },

  semesterList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  semesterCard: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },

  semesterHeader: {
    width: "100%",
    background: "rgba(255,255,255,0.035)",
    border: "none",
    color: "#ffffff",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    textAlign: "left",
    cursor: "pointer",
  },

  semesterTitle: {
    margin: "0 0 6px",
    fontSize: "21px",
  },

  semesterMeta: {
    margin: 0,
    color: "rgba(255,255,255,0.58)",
    fontSize: "13px",
  },

  chevron: {
    fontSize: "15px",
    color: "#22d3ee",
    fontWeight: "900",
  },

  courseList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "14px",
  },

  courseRow: {
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
    padding: "16px",
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr",
    gap: "18px",
    alignItems: "start",
  },

  courseMain: {
    minWidth: 0,
  },

  courseName: {
    margin: "0 0 10px",
    fontSize: "17px",
    lineHeight: 1.35,
  },

  courseInfoRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  infoPill: {
    padding: "7px 10px",
    borderRadius: "999px",
    background: "rgba(34,211,238,0.12)",
    border: "1px solid rgba(34,211,238,0.35)",
    color: "#67e8f9",
    fontSize: "12px",
    fontWeight: "800",
  },

  difficultyPill: {
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
  },

  prereqBox: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  prereqTitle: {
    color: "rgba(255,255,255,0.62)",
    fontSize: "12px",
  },

  noPrereq: {
    color: "rgba(255,255,255,0.48)",
    fontSize: "13px",
  },

  prereqList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "7px",
  },

  prereqPill: {
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "12px",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.76)",
    border: "1px solid rgba(255,255,255,0.08)",
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
    zIndex: 100,
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

export default StudyPlanPage;