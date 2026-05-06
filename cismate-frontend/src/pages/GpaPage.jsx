import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "http://localhost:8080";

const GRADES = [
  { letter: "A", points: 4.0 },
  { letter: "A-", points: 3.7 },
  { letter: "B+", points: 3.3 },
  { letter: "B", points: 3.0 },
  { letter: "B-", points: 2.7 },
  { letter: "C+", points: 2.3 },
  { letter: "C", points: 2.0 },
  { letter: "C-", points: 1.7 },
  { letter: "D+", points: 1.3 },
  { letter: "D", points: 1.0 },
  { letter: "F", points: 0.0 },
];

function GpaPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loadingUser, setLoadingUser] = useState(false);

  const [currentInfo, setCurrentInfo] = useState({
    currentGpa: 0,
    completedHours: 0,
  });

  const [subjects, setSubjects] = useState([
    { grade: "A", creditNumOfHours: 3 },
  ]);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    getUserInfo();
  }, []);

  const getUserInfo = () => {
    setLoadingUser(true);

    axios
      .get(`${API_BASE_URL}/userInfo`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setCurrentInfo({
          currentGpa: Number(res.data.gpa ?? 0),
          completedHours: Number(res.data.completedHours ?? 0),
        });
      })
      .catch((err) => {
        console.log("USER INFO ERROR:", err.response || err);
        alert("Could not load your current GPA info. Check console.");
      })
      .finally(() => {
        setLoadingUser(false);
      });
  };

  const addSubject = () => {
    setSubjects([...subjects, { grade: "A", creditNumOfHours: 3 }]);
  };

  const removeSubject = (index) => {
    if (subjects.length === 1) {
      return;
    }

    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const updateSubject = (index, field, value) => {
    const updatedSubjects = [...subjects];

    updatedSubjects[index] = {
      ...updatedSubjects[index],
      [field]: field === "creditNumOfHours" ? Number(value) : value,
    };

    setSubjects(updatedSubjects);
  };

  const semesterHours = subjects.reduce(
    (sum, subject) => sum + Number(subject.creditNumOfHours || 0),
    0
  );

  const semesterWeightedPoints = subjects.reduce((sum, subject) => {
    const grade = GRADES.find((item) => item.letter === subject.grade);
    const points = grade ? grade.points : 0;
    const hours = Number(subject.creditNumOfHours || 0);

    return sum + points * hours;
  }, 0);

  const semesterGpa =
    semesterHours === 0 ? 0 : semesterWeightedPoints / semesterHours;

  const projectedTotalHours =
    Number(currentInfo.completedHours || 0) + Number(semesterHours || 0);

  const projectedTotalWeightedPoints =
    Number(currentInfo.currentGpa || 0) * Number(currentInfo.completedHours || 0) +
    semesterGpa * semesterHours;

  const projectedGpa =
    projectedTotalHours === 0
      ? 0
      : projectedTotalWeightedPoints / projectedTotalHours;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>GPA Calculator</h1>
            <p style={styles.headerText}>
              Estimate your future cumulative GPA based on your next semester.
            </p>
          </div>

          <button style={styles.backButton} onClick={() => navigate("/home")}>
            Back Home
          </button>
        </div>

        <div style={styles.summaryGrid}>
          <InfoCard
            label="Current GPA"
            value={loadingUser ? "Loading..." : currentInfo.currentGpa.toFixed(2)}
          />

          <InfoCard
            label="Completed Hours"
            value={loadingUser ? "Loading..." : currentInfo.completedHours}
          />

          <InfoCard label="Semester Hours" value={semesterHours} />

          <InfoCard label="Semester GPA" value={semesterGpa.toFixed(2)} />
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardHeading}>Future Semester</h2>
              <p style={styles.info}>
                Add the courses you expect to take and the grades you want to
                test.
              </p>
            </div>

            <button type="button" style={styles.createButton} onClick={addSubject}>
              + Add Subject
            </button>
          </div>

          <div style={styles.subjectsList}>
            {subjects.map((subject, index) => (
              <div key={index} style={styles.subjectRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Expected Grade</label>

                  <select
                    style={styles.input}
                    value={subject.grade}
                    onChange={(e) =>
                      updateSubject(index, "grade", e.target.value)
                    }
                  >
                    {GRADES.map((grade) => (
                      <option
                        key={grade.letter}
                        value={grade.letter}
                        style={styles.option}
                      >
                        {grade.letter}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Credit Hours</label>

                  <input
                    style={styles.input}
                    type="number"
                    min="0"
                    value={subject.creditNumOfHours}
                    onChange={(e) =>
                      updateSubject(index, "creditNumOfHours", e.target.value)
                    }
                  />
                </div>

                <button
                  type="button"
                  style={styles.removeButton}
                  onClick={() => removeSubject(index)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardHeading}>Projected Result</h2>

          <p style={styles.info}>
            This does not update your saved GPA. It only shows what your
            cumulative GPA would become after this future semester.
          </p>

          <div style={styles.resultGrid}>
            <div style={styles.resultBox}>
              <span style={styles.resultLabel}>Current GPA</span>
              <strong style={styles.resultValue}>
                {currentInfo.currentGpa.toFixed(2)}
              </strong>
            </div>

            <div style={styles.resultBox}>
              <span style={styles.resultLabel}>Expected Semester GPA</span>
              <strong style={styles.resultValue}>{semesterGpa.toFixed(2)}</strong>
            </div>

            <div style={styles.resultBox}>
              <span style={styles.resultLabel}>Projected Total Hours</span>
              <strong style={styles.resultValue}>{projectedTotalHours}</strong>
            </div>

            <div style={styles.resultBoxHighlight}>
              <span style={styles.resultLabel}>Projected Cumulative GPA</span>
              <strong style={styles.resultValueBig}>
                {projectedGpa.toFixed(2)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.bottomNav}>
        <button style={styles.navButton} onClick={() => navigate("/assistant")}>
          Assistant
        </button>

        <button style={styles.navButton} onClick={() => navigate("/explore")}>
          Explore
        </button>

        <button
          style={{ ...styles.navButton, ...styles.activeNav }}
          onClick={() => navigate("/home")}
        >
          Home
        </button>

        <button style={styles.navButton} onClick={() => navigate("/careers")}>
          Careers
        </button>

        <button style={styles.navButton} onClick={() => navigate("/community")}>
          Community
        </button>
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div style={styles.infoCard}>
      <span style={styles.infoLabel}>{label}</span>
      <strong style={styles.infoValue}>{value}</strong>
    </div>
  );
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
    maxWidth: "900px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },

  title: {
    fontSize: "30px",
    fontWeight: "700",
    margin: "0 0 8px",
  },

  headerText: {
    margin: 0,
    color: "rgba(255,255,255,0.7)",
  },

  backButton: {
    background: "transparent",
    color: "#22d3ee",
    border: "1px solid rgba(34,211,238,0.35)",
    borderRadius: "14px",
    padding: "13px 16px",
    fontWeight: "800",
    cursor: "pointer",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },

  infoCard: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },

  infoLabel: {
    display: "block",
    color: "rgba(255,255,255,0.6)",
    fontSize: "13px",
    fontWeight: "700",
    marginBottom: "8px",
  },

  infoValue: {
    fontSize: "26px",
    color: "#4ade80",
  },

  card: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },

  cardHeading: {
    fontSize: "22px",
    margin: "0 0 10px",
  },

  info: {
    color: "rgba(255,255,255,0.72)",
    margin: 0,
    lineHeight: 1.6,
  },

  createButton: {
    background: "#4ade80",
    color: "#07111c",
    border: "none",
    borderRadius: "14px",
    padding: "13px 16px",
    fontWeight: "800",
    cursor: "pointer",
  },

  subjectsList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  subjectRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: "14px",
    alignItems: "end",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "16px",
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  label: {
    color: "rgba(255,255,255,0.75)",
    fontSize: "14px",
    fontWeight: "700",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "14px",
    color: "#ffffff",
    outline: "none",
  },

  option: {
    background: "#111827",
    color: "#ffffff",
  },

  removeButton: {
    background: "transparent",
    border: "none",
    color: "#f87171",
    cursor: "pointer",
    fontWeight: "700",
    padding: "14px 4px",
  },

  resultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginTop: "18px",
  },

  resultBox: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  resultBoxHighlight: {
    background: "rgba(74,222,128,0.09)",
    border: "1px solid rgba(74,222,128,0.35)",
    borderRadius: "16px",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  resultLabel: {
    color: "rgba(255,255,255,0.72)",
    fontWeight: "700",
    fontSize: "13px",
  },

  resultValue: {
    color: "#4ade80",
    fontSize: "26px",
  },

  resultValueBig: {
    color: "#4ade80",
    fontSize: "34px",
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

export default GpaPage;