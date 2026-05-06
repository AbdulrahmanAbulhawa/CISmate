import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { registerUser, loginUser } from "../api/authApi";

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

function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    major: "CIS",
    studyYear: "",
  });

  const [courses, setCourses] = useState([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [completedCourses, setCompletedCourses] = useState([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      setError("");

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/courses/getAllCourseNames`
        );

        const parsedCourses = response.data
          .map((item) => {
            if (typeof item === "string") {
              const parts = item.split(",");

              const id = Number(parts[0]);
              const creditHours = Number(parts[parts.length - 2]);
              const category = parts[parts.length - 1];
              const courseName = parts.slice(1, -2).join(",");

              return {
                id,
                courseName: courseName.trim(),
                creditHours,
                category: category.trim(),
              };
            }

            return {
              id: Number(item.id ?? item.courseId),
              courseName: item.courseName ?? item.name,
              creditHours: Number(item.creditHours ?? 0),
              category: item.category ?? "",
            };
          })
          .filter((course) => course.id && course.courseName);

        setCourses(parsedCourses);
      } catch (err) {
        setError("Failed to load courses");
        console.error(err);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const alreadyAdded = completedCourses.some(
      (item) => Number(item.id) === Number(course.id)
    );

    return (
      !alreadyAdded &&
      course.courseName.toLowerCase().includes(courseSearch.toLowerCase())
    );
  });

  const completedHours = completedCourses.reduce(
    (sum, item) => sum + Number(item.creditHours || 0),
    0
  );

  const totalGradePoints = completedCourses.reduce(
    (sum, item) => sum + Number(item.creditHours || 0) * item.gradePoints,
    0
  );

  const calculatedGpa =
    completedHours === 0 ? 0 : totalGradePoints / completedHours;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleChooseCourse = (course) => {
    setSelectedCourseId(course.id);
    setCourseSearch(course.courseName);
    setCourseDropdownOpen(false);
  };

  const handleAddCourse = () => {
    setError("");
    setMessage("");

    if (!selectedCourseId) {
      setError("Select a course first");
      return;
    }

    if (!selectedGrade) {
      setError("Select a grade first");
      return;
    }

    const course = courses.find(
      (item) => String(item.id) === String(selectedCourseId)
    );

    const grade = GRADES.find((item) => item.letter === selectedGrade);

    if (!course || !grade) {
      setError("Invalid course or grade");
      return;
    }

    const alreadyAdded = completedCourses.some(
      (item) => Number(item.id) === Number(course.id)
    );

    if (alreadyAdded) {
      setError("Course already added");
      return;
    }

    setCompletedCourses([
      ...completedCourses,
      {
        ...course,
        gradeLetter: grade.letter,
        gradePoints: grade.points,
      },
    ]);

    setSelectedCourseId("");
    setSelectedGrade("");
    setCourseSearch("");
    setCourseDropdownOpen(false);
  };

  const handleRemoveCourse = (courseId) => {
    setCompletedCourses(
      completedCourses.filter((item) => Number(item.id) !== Number(courseId))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setSubmitting(true);

    const payload = {
      email: formData.email.trim(),
      password: formData.password,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      major: formData.major.trim() || "CIS",
      gpa: Number(calculatedGpa.toFixed(2)),
      completedHours: completedHours,
      studyYear: formData.studyYear === "" ? null : Number(formData.studyYear),
      completedCourseIds: completedCourses.map((item) => Number(item.id)),
    };

    try {
      await registerUser(payload);

      const loginResponse = await loginUser({
        email: payload.email,
        password: payload.password,
      });

      const token =
        typeof loginResponse.data === "string"
          ? loginResponse.data
          : loginResponse.data.token;

      if (!token) {
        throw new Error("Login succeeded but no token was returned");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", "USER");

      await Promise.all(
        completedCourses.map((course) =>
          axios.put(
            `${API_BASE_URL}/api/user/completed-courses/grade`,
            {
              courseId: Number(course.id),
              gradeLetter: course.gradeLetter,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );

      setMessage("Registration successful");
      navigate("/home");
    } catch (err) {
      const backendMessage = err.response?.data?.message || err.response?.data;

      if (typeof backendMessage === "string") {
        setError(backendMessage);
      } else {
        setError("Registration failed");
      }

      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.overlay}>
        <div style={styles.leftSection}>
          <div style={styles.logoBox}>🎓</div>

          <h1 style={styles.mainTitle}>
            Your online
            <br />
            academic advisor.
          </h1>
        </div>

        <div style={styles.rightSection}>
          <div style={styles.card}>
            <div style={styles.logoBoxSmall}>🎓</div>
            <h2 style={styles.cardTitle}>Create account</h2>
            <p style={styles.cardSubtitle}>Join CISmate</p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.row}>
                <input
                  style={styles.input}
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />

                <input
                  style={styles.input}
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>

              <input
                style={styles.input}
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <input
                style={styles.input}
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />

              <input
                style={styles.input}
                type="text"
                name="major"
                placeholder="Major"
                value={formData.major}
                onChange={handleChange}
              />

              <input
                style={styles.input}
                type="number"
                name="studyYear"
                placeholder="Study year"
                value={formData.studyYear}
                onChange={handleChange}
                min="1"
                max="6"
              />

              <div style={styles.courseBox}>
                <p style={styles.sectionTitle}>Completed courses</p>

                <div style={styles.courseRow}>
                  <div style={styles.courseDropdownWrapper}>
                    <input
                      style={styles.input}
                      type="text"
                      placeholder={
                        loadingCourses ? "Loading courses..." : "Search course"
                      }
                      value={courseSearch}
                      onFocus={() => setCourseDropdownOpen(true)}
                      onBlur={() => {
                        setTimeout(() => {
                          setCourseDropdownOpen(false);
                        }, 150);
                      }}
                      onChange={(e) => {
                        setCourseSearch(e.target.value);
                        setSelectedCourseId("");
                        setCourseDropdownOpen(true);
                      }}
                      disabled={loadingCourses}
                    />

                    {courseDropdownOpen && (
                      <div style={styles.courseDropdown}>
                        {filteredCourses.length > 0 ? (
                          filteredCourses.map((course) => (
                            <button
                              key={course.id}
                              type="button"
                              style={styles.courseOption}
                              onMouseDown={() => handleChooseCourse(course)}
                            >
                              <span style={styles.courseOptionName}>
                                {course.courseName}
                              </span>

                              <span style={styles.courseOptionMeta}>
                                {course.creditHours}h • {course.category}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div style={styles.noCourses}>No courses found</div>
                        )}
                      </div>
                    )}
                  </div>

                  <select
                    style={styles.gradeSelect}
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                  >
                    <option value="" style={styles.option}>
                      Grade
                    </option>

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

                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={handleAddCourse}
                >
                  Add course
                </button>

                {completedCourses.length > 0 && (
                  <div style={styles.selectedList}>
                    {completedCourses.map((course) => (
                      <div key={course.id} style={styles.selectedCourse}>
                        <div>
                          <p style={styles.courseName}>{course.courseName}</p>

                          <p style={styles.courseMeta}>
                            {course.creditHours} hours • {course.gradeLetter} •{" "}
                            {course.gradePoints.toFixed(1)}
                          </p>
                        </div>

                        <button
                          type="button"
                          style={styles.removeButton}
                          onClick={() => handleRemoveCourse(course.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={styles.summaryGrid}>
                  <div style={styles.summaryCard}>
                    <span style={styles.summaryLabel}>Completed hours</span>
                    <strong style={styles.summaryValue}>{completedHours}</strong>
                  </div>

                  <div style={styles.summaryCard}>
                    <span style={styles.summaryLabel}>Calculated GPA</span>
                    <strong style={styles.summaryValue}>
                      {calculatedGpa.toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>

              <button style={styles.button} type="submit" disabled={submitting}>
                {submitting ? "Registering..." : "Register"}
              </button>
            </form>

            {message && <p style={styles.success}>{message}</p>}
            {error && <p style={styles.error}>{error}</p>}

            <p style={styles.footerText}>
              Already have an account?{" "}
              <Link to="/" style={styles.link}>
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, #1f3b73 0%, #0f172a 45%, #020617 100%)",
    color: "#ffffff",
  },

  overlay: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "40px",
    padding: "40px 70px",
    flexWrap: "wrap",
  },

  leftSection: {
    flex: "1",
    minWidth: "300px",
    maxWidth: "560px",
  },

  rightSection: {
    flex: "1",
    minWidth: "320px",
    display: "flex",
    justifyContent: "center",
  },

  logoBox: {
    width: "72px",
    height: "72px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    marginBottom: "24px",
    backdropFilter: "blur(10px)",
  },

  logoBoxSmall: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    margin: "0 auto 18px auto",
    backdropFilter: "blur(10px)",
  },

  mainTitle: {
    fontSize: "54px",
    lineHeight: "1.05",
    marginBottom: "16px",
    fontWeight: "700",
  },

  card: {
    width: "100%",
    maxWidth: "650px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "28px",
    padding: "36px 32px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    backdropFilter: "blur(16px)",
  },

  cardTitle: {
    fontSize: "32px",
    textAlign: "center",
    marginBottom: "8px",
  },

  cardSubtitle: {
    textAlign: "center",
    color: "rgba(255,255,255,0.75)",
    marginBottom: "26px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  row: {
    display: "flex",
    gap: "12px",
  },

  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.07)",
    color: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
  },

  courseBox: {
    padding: "16px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
  },

  sectionTitle: {
    margin: "0 0 12px 0",
    fontSize: "15px",
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
  },

  courseRow: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  },

  courseDropdownWrapper: {
    position: "relative",
    flex: "1",
  },

  courseDropdown: {
    position: "absolute",
    top: "54px",
    left: 0,
    right: 0,
    maxHeight: "360px",
    overflowY: "auto",
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: "14px",
    boxShadow: "0 20px 45px rgba(0,0,0,0.45)",
    zIndex: 50,
    padding: "6px",
  },

  courseOption: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  courseOptionName: {
    fontSize: "14px",
    fontWeight: "700",
  },

  courseOptionMeta: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.62)",
  },

  noCourses: {
    padding: "12px",
    color: "rgba(255,255,255,0.7)",
    fontSize: "14px",
  },

  gradeSelect: {
    width: "130px",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.07)",
    color: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
  },

  option: {
    background: "#111827",
    color: "#ffffff",
  },

  secondaryButton: {
    width: "100%",
    marginTop: "12px",
    padding: "12px",
    border: "1px solid rgba(103,232,249,0.45)",
    borderRadius: "14px",
    background: "rgba(103,232,249,0.10)",
    color: "#67e8f9",
    fontWeight: "700",
    cursor: "pointer",
  },

  selectedList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "14px",
  },

  selectedCourse: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "12px",
    borderRadius: "14px",
    background: "rgba(15,23,42,0.65)",
    border: "1px solid rgba(255,255,255,0.10)",
  },

  courseName: {
    margin: "0 0 4px 0",
    fontSize: "14px",
    fontWeight: "700",
  },

  courseMeta: {
    margin: 0,
    fontSize: "12px",
    color: "rgba(255,255,255,0.65)",
  },

  removeButton: {
    padding: "8px 10px",
    border: "1px solid rgba(248,113,113,0.45)",
    borderRadius: "10px",
    background: "rgba(248,113,113,0.12)",
    color: "#fca5a5",
    cursor: "pointer",
    fontWeight: "700",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "14px",
  },

  summaryCard: {
    padding: "12px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.10)",
  },

  summaryLabel: {
    display: "block",
    fontSize: "12px",
    color: "rgba(255,255,255,0.65)",
    marginBottom: "4px",
  },

  summaryValue: {
    fontSize: "20px",
    color: "#ffffff",
  },

  button: {
    marginTop: "8px",
    padding: "14px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)",
    color: "#ffffff",
    fontWeight: "600",
    cursor: "pointer",
  },

  success: {
    color: "#86efac",
    marginTop: "14px",
    textAlign: "center",
  },

  error: {
    color: "#fca5a5",
    marginTop: "14px",
    textAlign: "center",
  },

  footerText: {
    textAlign: "center",
    marginTop: "22px",
    color: "rgba(255,255,255,0.82)",
  },

  link: {
    color: "#67e8f9",
    fontWeight: "600",
  },
};

export default RegisterPage;