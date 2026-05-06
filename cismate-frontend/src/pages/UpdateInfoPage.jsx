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

function UpdateInfoPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    major: "",
    studyYear: "",
    role: "",
  });

  const [allCourses, setAllCourses] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);

  const [courseSearch, setCourseSearch] = useState("");
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    loadPageData();
  }, []);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const parseCourses = (data) => {
    return data
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
  };

  const loadPageData = async () => {
    setLoading(true);

    try {
      const [userRes, coursesRes, completedRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/userInfo`, {
          headers: authHeaders,
        }),
        axios.get(`${API_BASE_URL}/api/courses/getAllCourseNames`),
        axios.get(`${API_BASE_URL}/api/user/completed-courses`, {
          headers: authHeaders,
        }),
      ]);

      const parsedCourses = parseCourses(coursesRes.data);
      setAllCourses(parsedCourses);

      setForm({
        email: userRes.data.email || "",
        firstName: userRes.data.firstName || "",
        lastName: userRes.data.lastName || "",
        major: userRes.data.major || "",
        studyYear: userRes.data.studyYear ?? "",
        role: userRes.data.role || "",
      });

      const courseMap = new Map(
        parsedCourses.map((course) => [Number(course.id), course])
      );

      const parsedCompleted = completedRes.data.map((item) => {
        const matchingCourse = courseMap.get(Number(item.courseId));
        const grade = GRADES.find((g) => g.letter === item.gradeLetter);

        return {
          courseId: Number(item.courseId),
          courseCode: item.courseCode || "",
          courseName:
            item.courseName || matchingCourse?.courseName || "Unknown Course",
          creditHours: Number(matchingCourse?.creditHours ?? 0),
          category: matchingCourse?.category || "",
          gradeLetter: item.gradeLetter || "",
          gradePoints:
            item.gradePoints !== null && item.gradePoints !== undefined
              ? Number(item.gradePoints)
              : grade?.points ?? 0,
          existing: true,
        };
      });

      setCompletedCourses(parsedCompleted);
    } catch (err) {
      console.log("LOAD UPDATE INFO ERROR:", err.response || err);
      alert("Could not load update info. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const completedHours = completedCourses.reduce(
    (sum, item) => sum + Number(item.creditHours || 0),
    0
  );

  const totalWeightedPoints = completedCourses.reduce(
    (sum, item) => sum + Number(item.creditHours || 0) * Number(item.gradePoints || 0),
    0
  );

  const calculatedGpa =
    completedHours === 0 ? 0 : totalWeightedPoints / completedHours;

  const filteredCourses = allCourses.filter((course) => {
    const alreadySelected = completedCourses.some(
      (item) => Number(item.courseId) === Number(course.id)
    );

    return (
      !alreadySelected &&
      course.courseName.toLowerCase().includes(courseSearch.toLowerCase())
    );
  });

  const handleChooseCourse = (course) => {
    setSelectedCourseId(course.id);
    setCourseSearch(course.courseName);
    setCourseDropdownOpen(false);
  };

  const handleAddCourse = () => {
    if (!selectedCourseId) {
      alert("Select a course first.");
      return;
    }

    if (!selectedGrade) {
      alert("Select a grade first.");
      return;
    }

    const course = allCourses.find(
      (item) => Number(item.id) === Number(selectedCourseId)
    );

    const grade = GRADES.find((item) => item.letter === selectedGrade);

    if (!course || !grade) {
      alert("Invalid course or grade.");
      return;
    }

    const alreadySelected = completedCourses.some(
      (item) => Number(item.courseId) === Number(course.id)
    );

    if (alreadySelected) {
      alert("Course already added.");
      return;
    }

    setCompletedCourses([
      ...completedCourses,
      {
        courseId: Number(course.id),
        courseCode: "",
        courseName: course.courseName,
        creditHours: Number(course.creditHours || 0),
        category: course.category || "",
        gradeLetter: grade.letter,
        gradePoints: grade.points,
        existing: false,
      },
    ]);

    setSelectedCourseId("");
    setSelectedGrade("");
    setCourseSearch("");
    setCourseDropdownOpen(false);
  };

  const updateCourseGrade = (courseId, gradeLetter) => {
    const grade = GRADES.find((item) => item.letter === gradeLetter);

    setCompletedCourses(
      completedCourses.map((course) =>
        Number(course.courseId) === Number(courseId)
          ? {
              ...course,
              gradeLetter: grade.letter,
              gradePoints: grade.points,
            }
          : course
      )
    );
  };

  const removeNewCourse = (courseId) => {
    setCompletedCourses(
      completedCourses.filter(
        (course) => Number(course.courseId) !== Number(courseId)
      )
    );
  };

  const updateUserInfo = async (e) => {
    e.preventDefault();

    const missingGrade = completedCourses.some((course) => !course.gradeLetter);

    if (missingGrade) {
      alert("Every completed course needs a grade.");
      return;
    }

    const body = {
      firstName: form.firstName,
      lastName: form.lastName,
      major: form.major,
      studyYear: form.studyYear === "" ? null : Number(form.studyYear),
      gpa: Number(calculatedGpa.toFixed(2)),
      completedHours: completedHours,
      completedCourseIds: completedCourses.map((course) =>
        Number(course.courseId)
      ),
    };

    setSaving(true);

    try {
      const profileRes = await axios.patch(`${API_BASE_URL}/userInfo`, body, {
        headers: authHeaders,
      });

      await Promise.all(
        completedCourses.map((course) =>
          axios.put(
            `${API_BASE_URL}/api/user/completed-courses/grade`,
            {
              courseId: Number(course.courseId),
              gradeLetter: course.gradeLetter,
            },
            {
              headers: authHeaders,
            }
          )
        )
      );

      console.log("UPDATE USER INFO RESPONSE:", profileRes.data);

      alert("Info updated successfully.");
      await loadPageData();
    } catch (err) {
      console.log("UPDATE USER INFO ERROR:", err.response || err);
      alert("Could not update info. Check console.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Update Info</h1>
            <p style={styles.headerText}>
              Update your profile details and completed courses.
            </p>
          </div>

          <button style={styles.backButton} onClick={() => navigate("/home")}>
            Back Home
          </button>
        </div>

        {loading ? (
          <div style={styles.emptyBox}>Loading user info...</div>
        ) : (
          <form style={styles.card} onSubmit={updateUserInfo}>
            <div style={styles.readOnlyBox}>
              <DetailBox label="Email" value={form.email} />
              <DetailBox label="Role" value={form.role} />
            </div>

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>First Name</label>

                <input
                  style={styles.input}
                  type="text"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Last Name</label>

                <input
                  style={styles.input}
                  type="text"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Major</label>

                <input
                  style={styles.input}
                  type="text"
                  value={form.major}
                  onChange={(e) =>
                    setForm({ ...form, major: e.target.value })
                  }
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Study Year</label>

                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  max="6"
                  value={form.studyYear}
                  onChange={(e) =>
                    setForm({ ...form, studyYear: e.target.value })
                  }
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Calculated GPA</label>

                <input
                  style={styles.input}
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={calculatedGpa.toFixed(2)}
                  readOnly
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Completed Hours</label>

                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  value={completedHours}
                  readOnly
                />
              </div>
            </div>

            <div style={styles.courseSection}>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Completed Courses</h2>
                  <p style={styles.sectionNote}>
                    Current backend supports adding courses and updating grades.
                    Existing courses cannot be deleted here.
                  </p>
                </div>
              </div>

              <div style={styles.courseAddBox}>
                <div style={styles.courseRow}>
                  <div style={styles.courseDropdownWrapper}>
                    <input
                      style={styles.input}
                      type="text"
                      placeholder="Search course"
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
                  style={styles.addButton}
                  onClick={handleAddCourse}
                >
                  Add Course
                </button>
              </div>

              {completedCourses.length === 0 ? (
                <div style={styles.emptyCourses}>No completed courses yet.</div>
              ) : (
                <div style={styles.completedList}>
                  {completedCourses.map((course) => (
                    <div key={course.courseId} style={styles.completedItem}>
                      <div style={styles.completedInfo}>
                        <p style={styles.completedName}>{course.courseName}</p>
                        <p style={styles.completedMeta}>
                          {course.creditHours} hours
                          {course.category ? ` • ${course.category}` : ""}
                          {course.existing ? " • Existing" : " • New"}
                        </p>
                      </div>

                      <div style={styles.completedActions}>
                        <select
                          style={styles.smallGradeSelect}
                          value={course.gradeLetter}
                          onChange={(e) =>
                            updateCourseGrade(course.courseId, e.target.value)
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

                        {course.existing ? (
                          <button
                            type="button"
                            style={styles.disabledRemoveButton}
                            disabled
                            title="Current backend has no delete endpoint for completed courses"
                          >
                            Locked
                          </button>
                        ) : (
                          <button
                            type="button"
                            style={styles.removeButton}
                            onClick={() => removeNewCourse(course.courseId)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button style={styles.submitButton} type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
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

function DetailBox({ label, value }) {
  return (
    <div style={styles.detailBox}>
      <strong style={styles.detailLabel}>{label}</strong>
      <span style={styles.detailValue}>{value || "N/A"}</span>
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

  card: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },

  readOnlyBox: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginBottom: "22px",
  },

  detailBox: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "14px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  detailLabel: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.55)",
  },

  detailValue: {
    fontSize: "15px",
    color: "#ffffff",
    wordBreak: "break-word",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
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

  courseSection: {
    marginTop: "24px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    paddingTop: "22px",
  },

  sectionHeader: {
    marginBottom: "14px",
  },

  sectionTitle: {
    margin: "0 0 6px",
    fontSize: "22px",
    fontWeight: "800",
  },

  sectionNote: {
    margin: 0,
    color: "rgba(255,255,255,0.55)",
    fontSize: "13px",
  },

  courseAddBox: {
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "16px",
  },

  courseRow: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  },

  courseDropdownWrapper: {
    position: "relative",
    flex: 1,
  },

  courseDropdown: {
    position: "absolute",
    top: "54px",
    left: 0,
    right: 0,
    maxHeight: "320px",
    overflowY: "auto",
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.14)",
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
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#ffffff",
    outline: "none",
  },

  option: {
    background: "#111827",
    color: "#ffffff",
  },

  addButton: {
    width: "100%",
    marginTop: "12px",
    background: "rgba(34,211,238,0.12)",
    color: "#22d3ee",
    border: "1px solid rgba(34,211,238,0.35)",
    borderRadius: "14px",
    padding: "13px",
    fontWeight: "800",
    cursor: "pointer",
  },

  emptyCourses: {
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "14px",
    padding: "14px",
    color: "rgba(255,255,255,0.65)",
  },

  completedList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  completedItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "14px",
    padding: "14px",
  },

  completedInfo: {
    minWidth: 0,
  },

  completedName: {
    margin: "0 0 5px",
    fontSize: "15px",
    fontWeight: "800",
  },

  completedMeta: {
    margin: 0,
    fontSize: "12px",
    color: "rgba(255,255,255,0.58)",
  },

  completedActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
  },

  smallGradeSelect: {
    width: "90px",
    padding: "10px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#ffffff",
    outline: "none",
  },

  removeButton: {
    background: "rgba(248,113,113,0.12)",
    color: "#fca5a5",
    border: "1px solid rgba(248,113,113,0.35)",
    borderRadius: "12px",
    padding: "10px 12px",
    fontWeight: "800",
    cursor: "pointer",
  },

  disabledRemoveButton: {
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.45)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "10px 12px",
    fontWeight: "800",
    cursor: "not-allowed",
  },

  submitButton: {
    width: "100%",
    background: "#4ade80",
    color: "#07111c",
    border: "none",
    borderRadius: "14px",
    padding: "14px",
    fontWeight: "800",
    cursor: "pointer",
    marginTop: "22px",
  },

  emptyBox: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "18px",
    padding: "22px",
    color: "rgba(255,255,255,0.72)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
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

export default UpdateInfoPage;