import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "http://localhost:8080";

function ExplorePage() {
  const [activeTab, setActiveTab] = useState("courses");

  const [courses, setCourses] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [careers, setCareers] = useState([]);
  const [studyPlanCourses, setStudyPlanCourses] = useState([]);

  const [careerFilter, setCareerFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [selectedCareer, setSelectedCareer] = useState(null);

  const [openStudyGroups, setOpenStudyGroups] = useState({});
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const closeAllDetails = () => {
    setSelectedCourse(null);
    setSelectedProfessor(null);
    setSelectedCareer(null);
  };

  const normalizeText = (value) => {
    return String(value || "").trim().toLowerCase();
  };

  const getItemLabel = (item) => {
    if (typeof item === "object" && item !== null) {
      return item.name || item.courseName || item.title || "Unknown";
    }

    return item;
  };

  const getItemId = (item) => {
    if (typeof item === "object" && item !== null) {
      return item.id || item.professorId || item.courseId;
    }

    return null;
  };

  const formatCourseRows = (rows) => {
    return (rows || []).map((row) => {
      if (Array.isArray(row)) {
        return {
          id: row[0],
          courseName: row[1],
          creditHours: row[2],
          category: row[3],
        };
      }

      if (typeof row === "string") {
        const parts = row.split(",");

        if (parts.length > 1) {
          return {
            id: parts[0]?.trim(),
            courseName: parts[1]?.trim(),
            creditHours: parts[2]?.trim(),
            category: parts[3]?.trim(),
          };
        }

        return {
          id: null,
          courseName: row,
          creditHours: null,
          category: null,
        };
      }

      if (typeof row === "object" && row !== null) {
        return {
          id: row.id,
          courseName: row.courseName,
          creditHours: row.creditHours,
          category: row.category,
        };
      }

      return {
        id: null,
        courseName: "Unknown Course",
        creditHours: null,
        category: null,
      };
    });
  };

  const formatProfessorRows = (rows) => {
    return (rows || []).map((row) => {
      if (Array.isArray(row)) {
        return {
          id: row[0],
          name: row[1],
          title: row[2],
          department: row[3],
        };
      }

      if (typeof row === "string") {
        const parts = row.split(",");

        if (parts.length > 1) {
          return {
            id: parts[0]?.trim(),
            name: parts[1]?.trim(),
            title: parts[2]?.trim(),
            department: parts[3]?.trim(),
          };
        }

        return {
          id: null,
          name: row,
          title: null,
          department: null,
        };
      }

      if (typeof row === "object" && row !== null) {
        return {
          id: row.id,
          name: row.name,
          title: row.title,
          department: row.department,
          email: row.email,
          office: row.office,
          tags: row.tags,
          courses: row.courses,
        };
      }

      return {
        id: null,
        name: "Unknown Professor",
        title: null,
        department: null,
      };
    });
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

  const fetchAllCourses = () => {
    setLoading(true);

    return axios
      .get(`${API_BASE_URL}/api/courses/getAllCourseNames`, {
        headers: authHeaders,
      })
      .then((res) => {
        const formattedCourses = formatCourseRows(res.data);
        setCourses(formattedCourses);
        return formattedCourses;
      })
      .catch((err) => {
        console.log("COURSES ERROR:", err.response || err);
        setCourses([]);
        return [];
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchAllProfessors = () => {
    setLoading(true);

    return axios
      .get(`${API_BASE_URL}/api/professors/getAllProfessors`, {
        headers: authHeaders,
      })
      .then((res) => {
        const formattedProfessors = formatProfessorRows(res.data);
        setProfessors(formattedProfessors);
        return formattedProfessors;
      })
      .catch((err) => {
        console.log("PROFESSORS ERROR:", err.response || err);
        setProfessors([]);
        return [];
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const getCareers = () => {
    setLoading(true);
    setSelectedCareer(null);

    const params = careerFilter === "ALL" ? {} : { filter: careerFilter };

    axios
      .get(`${API_BASE_URL}/api/careers`, {
        params,
        headers: authHeaders,
      })
      .then((res) => {
        setCareers(res.data || []);
      })
      .catch((err) => {
        console.log("CAREERS ERROR:", err.response || err);

        if (careerFilter === "BEST_FIT") {
          alert("Best Fit needs a logged-in student with completed courses.");
        } else {
          alert("Could not load careers. Check console.");
        }

        setCareers([]);
      })
      .finally(() => {
        setLoading(false);
      });
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

      setStudyPlanCourses(detailedCourses);

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

      setOpenStudyGroups(defaultOpen);
    } catch (err) {
      console.log("STUDY PLAN ERROR:", err.response || err);
      alert("Could not load study plan. Check console.");
      setStudyPlanCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    if (activeTab === "courses") {
      fetchAllCourses();
    }

    if (activeTab === "professors") {
      fetchAllProfessors();
    }

    if (activeTab === "careers") {
      getCareers();
    }

    if (activeTab === "studyPlan") {
      getStudyPlanData();
    }
  }, [activeTab, careerFilter, token]);

  const filteredCourses = courses.filter((course) =>
    `${course.courseName || ""} ${course.category || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredProfessors = professors.filter((professor) =>
    `${professor.name || ""} ${professor.title || ""} ${
      professor.department || ""
    }`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredCareers = careers.filter((career) =>
    `${career.name || ""} ${career.slug || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredStudyPlanCourses = useMemo(() => {
    return studyPlanCourses.filter((course) => {
      const text = `${course.courseName} ${course.difficulty} ${course.prerequisites.join(
        " "
      )}`;

      return text.toLowerCase().includes(search.toLowerCase());
    });
  }, [studyPlanCourses, search]);

  const groupedStudyPlanCourses = useMemo(() => {
    const groups = {};

    filteredStudyPlanCourses.forEach((course) => {
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
      groups[key].courses.sort((a, b) =>
        a.courseName.localeCompare(b.courseName)
      );
    });

    return Object.values(groups).sort((a, b) => {
      const yearA = safeNumber(a.year);
      const yearB = safeNumber(b.year);

      if (yearA !== yearB) return yearA - yearB;

      const semesterA = safeNumber(a.semester);
      const semesterB = safeNumber(b.semester);

      return semesterA - semesterB;
    });
  }, [filteredStudyPlanCourses]);

  const toggleStudyGroup = (key) => {
    setOpenStudyGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const openAllStudyGroups = () => {
    const next = {};

    groupedStudyPlanCourses.forEach((group) => {
      next[group.key] = true;
    });

    setOpenStudyGroups(next);
  };

  const closeAllStudyGroups = () => {
    setOpenStudyGroups({});
  };

  const getCourseDetails = (course) => {
    if (!course.id) {
      alert("This course has no id. Check COURSES RAW RESPONSE in console.");
      return;
    }

    axios
      .get(`${API_BASE_URL}/api/courses/${course.id}`, {
        headers: authHeaders,
      })
      .then((res) => {
        setSelectedProfessor(null);
        setSelectedCareer(null);
        setSelectedCourse(res.data);
      })
      .catch((err) => {
        console.log("COURSE DETAILS ERROR:", err.response || err);
        alert("Could not load course details. Check console.");
      });
  };

  const getProfessorDetails = (professor) => {
    if (!professor.id) {
      alert("Professor id is missing. Check PROFESSORS RAW RESPONSE in console.");
      return;
    }

    axios
      .get(`${API_BASE_URL}/api/professors/${professor.id}`, {
        headers: authHeaders,
      })
      .then((res) => {
        setSelectedCourse(null);
        setSelectedCareer(null);
        setSelectedProfessor(res.data);
      })
      .catch((err) => {
        console.log("PROFESSOR DETAILS ERROR:", err.response || err);
        alert("Could not load professor details. Check console.");
      });
  };

  const getCareerDetails = (career) => {
    if (!career.slug) {
      alert("Career slug is missing. Check CAREERS RESPONSE in console.");
      return;
    }

    axios
      .get(`${API_BASE_URL}/api/careers/${career.slug}`, {
        headers: authHeaders,
      })
      .then((res) => {
        setSelectedCourse(null);
        setSelectedProfessor(null);
        setSelectedCareer(res.data);
      })
      .catch((err) => {
        console.log("CAREER DETAILS ERROR:", err.response || err);
        alert("Could not load career details. Check console.");
      });
  };

  const openProfessorFromCourse = async (professorItem) => {
    const professorName = getItemLabel(professorItem);
    let professorId = getItemId(professorItem);

    try {
      let professorList = professors;

      if (!professorId) {
        if (professorList.length === 0) {
          professorList = await fetchAllProfessors();
        }

        const matchedProfessor = professorList.find(
          (professor) =>
            normalizeText(professor.name) === normalizeText(professorName)
        );

        professorId = matchedProfessor?.id;
      }

      if (!professorId) {
        alert(
          "Professor id is missing. Backend must return professor id with professor name."
        );
        return;
      }

      const res = await axios.get(
        `${API_BASE_URL}/api/professors/${professorId}`,
        {
          headers: authHeaders,
        }
      );

      setSelectedCourse(null);
      setSelectedCareer(null);
      setSelectedProfessor(res.data);
      setActiveTab("professors");
      setSearch("");
    } catch (err) {
      console.log("OPEN PROFESSOR FROM COURSE ERROR:", err.response || err);
      alert("Could not open professor. Check console.");
    }
  };

  const openCourseFromProfessor = async (courseItem) => {
    const courseName = getItemLabel(courseItem);
    let courseId = getItemId(courseItem);

    try {
      let courseList = courses;

      if (!courseId) {
        if (courseList.length === 0) {
          courseList = await fetchAllCourses();
        }

        const matchedCourse = courseList.find(
          (course) =>
            normalizeText(course.courseName) === normalizeText(courseName)
        );

        courseId = matchedCourse?.id;
      }

      if (!courseId) {
        alert(
          "Course id is missing. Backend must return course id with course name."
        );
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/api/courses/${courseId}`, {
        headers: authHeaders,
      });

      setSelectedProfessor(null);
      setSelectedCareer(null);
      setSelectedCourse(res.data);
      setActiveTab("courses");
      setSearch("");
    } catch (err) {
      console.log("OPEN COURSE FROM PROFESSOR ERROR:", err.response || err);
      alert("Could not open course. Check console.");
    }
  };

  const formatLevel = (level) => {
    if (!level) return "Medium";
    return level.charAt(0) + level.slice(1).toLowerCase();
  };

  const formatScore = (score) => {
    if (score === null || score === undefined) return null;
    return `${Math.round(score * 100)}%`;
  };

  const sectionTitle =
    activeTab === "courses"
      ? "Courses"
      : activeTab === "professors"
      ? "Professors"
      : activeTab === "careers"
      ? "Careers"
      : "Study Plan";

  const searchPlaceholder =
    activeTab === "courses"
      ? "Search by course name..."
      : activeTab === "professors"
      ? "Search by professor name..."
      : activeTab === "careers"
      ? "Search by career name..."
      : "Search course, difficulty, or prerequisite...";

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Explore</h1>
        </div>

        <div style={styles.tabsGrid}>
          <button
            style={{
              ...styles.tabCard,
              ...(activeTab === "courses" ? styles.activeTab : {}),
            }}
            onClick={() => {
              closeAllDetails();
              setActiveTab("courses");
              setSearch("");
            }}
          >
            <div>
              <h3 style={styles.tabTitle}>Courses</h3>
              <p style={styles.tabText}>Browse all available courses.</p>
            </div>
            <span style={styles.arrow}>↗</span>
          </button>

          <button
            style={{
              ...styles.tabCard,
              ...(activeTab === "professors" ? styles.activeTab : {}),
            }}
            onClick={() => {
              closeAllDetails();
              setActiveTab("professors");
              setSearch("");
            }}
          >
            <div>
              <h3 style={styles.tabTitle}>Professors</h3>
              <p style={styles.tabText}>Browse CIS professors.</p>
            </div>
            <span style={styles.arrow}>↗</span>
          </button>

          <button
            style={{
              ...styles.tabCard,
              ...(activeTab === "careers" ? styles.activeTab : {}),
            }}
            onClick={() => {
              closeAllDetails();
              setActiveTab("careers");
              setSearch("");
            }}
          >
            <div>
              <h3 style={styles.tabTitle}>Careers</h3>
              <p style={styles.tabText}>
                Explore CIS career paths and opportunities.
              </p>
            </div>
            <span style={styles.arrow}>↗</span>
          </button>

          <button
            style={{
              ...styles.tabCard,
              ...(activeTab === "studyPlan" ? styles.activeTab : {}),
            }}
            onClick={() => {
              closeAllDetails();
              setActiveTab("studyPlan");
              setSearch("");
            }}
          >
            <div>
              <h3 style={styles.tabTitle}>Study Plan</h3>
              <p style={styles.tabText}>
                View the recommended course plan by year and semester.
              </p>
            </div>
            <span style={styles.arrow}>↗</span>
          </button>
        </div>

        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>{sectionTitle}</h3>
        </div>

        {activeTab === "careers" && (
          <div style={styles.filterGrid}>
            <FilterCard
              title="All Careers"
              text="Browse every career path."
              active={careerFilter === "ALL"}
              onClick={() => {
                setCareerFilter("ALL");
                setSearch("");
              }}
            />

            <FilterCard
              title="High Demand"
              text="Careers with strong market demand."
              active={careerFilter === "HIGH_DEMAND"}
              onClick={() => {
                setCareerFilter("HIGH_DEMAND");
                setSearch("");
              }}
            />

            <FilterCard
              title="High Salary"
              text="Careers with higher earning potential."
              active={careerFilter === "HIGH_SALARY"}
              onClick={() => {
                setCareerFilter("HIGH_SALARY");
                setSearch("");
              }}
            />

            <FilterCard
              title="Low Stress"
              text="Stable careers with lower stress."
              active={careerFilter === "LOW_STRESS_STABLE"}
              onClick={() => {
                setCareerFilter("LOW_STRESS_STABLE");
                setSearch("");
              }}
            />

            <FilterCard
              title="Best Fit"
              text="Based on your completed courses."
              active={careerFilter === "BEST_FIT"}
              onClick={() => {
                setCareerFilter("BEST_FIT");
                setSearch("");
              }}
            />
          </div>
        )}

        {activeTab === "studyPlan" && (
          <div style={styles.studyToolsRow}>
            <button style={styles.smallButton} onClick={openAllStudyGroups}>
              Open All
            </button>

            <button
              style={styles.smallButtonGhost}
              onClick={closeAllStudyGroups}
            >
              Close All
            </button>
          </div>
        )}

        <div style={styles.searchBox}>
          <span>🔍</span>
          <input
            style={styles.searchInput}
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <div style={styles.emptyBox}>Loading...</div>}

        {!loading && activeTab === "courses" && (
          <div style={styles.cardsGrid}>
            {filteredCourses.length === 0 ? (
              <div style={styles.emptyBox}>No courses found.</div>
            ) : (
              filteredCourses.map((course, index) => (
                <div key={course.id || index} style={styles.card}>
                  <div style={styles.cardTop}>
                    <div style={styles.avatar}>
                      {course.courseName ? course.courseName.charAt(0) : "C"}
                    </div>

                    <div>
                      <h3 style={styles.cardTitle}>
                        {course.courseName || "Unnamed Course"}
                      </h3>

                      <p style={styles.cardText}>
                        {course.category || "Course"}
                      </p>
                    </div>
                  </div>

                  <div style={styles.cardBottom}>
                    <span style={styles.cardMeta}>
                      🕘 {course.creditHours || "N/A"}h
                    </span>

                    <button
                      style={styles.detailsButton}
                      onClick={() => getCourseDetails(course)}
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && activeTab === "professors" && (
          <div style={styles.cardsGrid}>
            {filteredProfessors.length === 0 ? (
              <div style={styles.emptyBox}>No professors found.</div>
            ) : (
              filteredProfessors.map((professor, index) => (
                <div key={professor.id || index} style={styles.card}>
                  <div style={styles.cardTop}>
                    <div style={styles.avatar}>
                      {professor.name ? professor.name.charAt(0) : "P"}
                    </div>

                    <div>
                      <h3 style={styles.cardTitle}>
                        {professor.name || "Unnamed Professor"}
                      </h3>

                      <p style={styles.cardText}>
                        {professor.title || "Professor"}
                      </p>

                      <p style={styles.cardText}>
                        {professor.department || "Department not listed"}
                      </p>
                    </div>
                  </div>

                  <div style={styles.cardBottom}>
                    <span style={styles.cardMeta}>👨‍🏫 Staff</span>

                    <button
                      style={styles.detailsButton}
                      onClick={() => getProfessorDetails(professor)}
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && activeTab === "careers" && (
          <div style={styles.cardsGrid}>
            {filteredCareers.length === 0 ? (
              <div style={styles.emptyBox}>No careers found.</div>
            ) : (
              filteredCareers.map((career, index) => (
                <div key={career.id || index} style={styles.careerCard}>
                  <div>
                    <div style={styles.cardTop}>
                      <div style={styles.avatar}>
                        {career.name ? career.name.charAt(0) : "C"}
                      </div>

                      <div>
                        <h3 style={styles.cardTitle}>
                          {career.name || "Unnamed Career"}
                        </h3>

                        <p style={styles.cardText}>
                          Demand: {formatLevel(career.demandLevel)}
                        </p>

                        <p style={styles.cardText}>
                          Salary: {formatLevel(career.salaryPotential)}
                        </p>
                      </div>
                    </div>

                    <div style={styles.badgesRow}>
                      <LevelBadge label="Stress" value={career.stressLevel} />
                      <LevelBadge
                        label="Stability"
                        value={career.stabilityLevel}
                      />
                    </div>

                    {career.bestFitScore !== null &&
                      career.bestFitScore !== undefined && (
                        <div style={styles.bestFitBox}>
                          <strong style={styles.bestFitScore}>
                            {formatScore(career.bestFitScore)}
                          </strong>

                          <span style={styles.bestFitText}>Best fit score</span>

                          <span style={styles.bestFitText}>
                            Matched {career.matchedRecommendedCourses || 0} of{" "}
                            {career.totalRecommendedCourses || 0} courses
                          </span>
                        </div>
                      )}
                  </div>

                  <div style={styles.cardBottom}>
                    <span style={styles.cardMeta}>💼 Career</span>

                    <button
                      style={styles.detailsButton}
                      onClick={() => getCareerDetails(career)}
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && activeTab === "studyPlan" && (
          <div style={styles.studyPlanList}>
            {groupedStudyPlanCourses.length === 0 ? (
              <div style={styles.emptyBox}>No study plan courses found.</div>
            ) : (
              groupedStudyPlanCourses.map((group) => {
                const isOpen = !!openStudyGroups[group.key];

                return (
                  <div key={group.key} style={styles.semesterCard}>
                    <button
                      style={styles.semesterHeader}
                      onClick={() => toggleStudyGroup(group.key)}
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
                                    {course.prerequisites.map(
                                      (prereq, index) => (
                                        <span
                                          key={`${course.id}-${index}`}
                                          style={styles.prereqPill}
                                        >
                                          {prereq}
                                        </span>
                                      )
                                    )}
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
              })
            )}
          </div>
        )}
      </div>

      {selectedCourse && (
        <div style={styles.modalOverlay} onClick={() => setSelectedCourse(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {selectedCourse.courseName || "Course Details"}
              </h2>

              <button
                style={styles.closeButton}
                onClick={() => setSelectedCourse(null)}
              >
                ×
              </button>
            </div>

            <p style={styles.description}>
              {selectedCourse.description || "No description available."}
            </p>

            <div style={styles.detailsGrid}>
              <DetailBox label="Difficulty" value={selectedCourse.difficulty} />
              <DetailBox
                label="Credit Hours"
                value={selectedCourse.creditHours}
              />
              <DetailBox
                label="Semester Offered"
                value={selectedCourse.semesterOffered}
              />
              <DetailBox label="Category" value={selectedCourse.category} />
              <DetailBox
                label="Recommended Year"
                value={selectedCourse.recommendedYear}
              />
              <DetailBox
                label="Recommended Semester"
                value={selectedCourse.recommendedSemester}
              />
            </div>

            <DetailList
              title="Prerequisites"
              items={selectedCourse.prerequisites}
              emptyText="No prerequisites"
            />

            <DetailList
              title="Professors"
              items={selectedCourse.professors}
              emptyText="No professors listed"
              onItemClick={openProfessorFromCourse}
            />

            <div style={styles.detailSection}>
              <h3 style={styles.detailTitle}>Assessment</h3>
              <p style={styles.detailText}>
                {selectedCourse.assessment || "No assessment listed"}
              </p>
            </div>

            <DetailList
              title="Resources"
              items={selectedCourse.resources}
              emptyText="No resources listed"
            />
          </div>
        </div>
      )}

      {selectedProfessor && (
        <div
          style={styles.modalOverlay}
          onClick={() => setSelectedProfessor(null)}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {selectedProfessor.name || "Professor Details"}
              </h2>

              <button
                style={styles.closeButton}
                onClick={() => setSelectedProfessor(null)}
              >
                ×
              </button>
            </div>

            <div style={styles.detailsGrid}>
              <DetailBox label="Title" value={selectedProfessor.title} />
              <DetailBox label="Email" value={selectedProfessor.email} />
              <DetailBox
                label="Department"
                value={selectedProfessor.department}
              />
              <DetailBox label="Office" value={selectedProfessor.office} />
              <DetailBox label="Tags" value={selectedProfessor.tags} />
            </div>

            <DetailList
              title="Courses"
              items={selectedProfessor.courses}
              emptyText="No courses listed"
              onItemClick={openCourseFromProfessor}
            />
          </div>
        </div>
      )}

      {selectedCareer && (
        <div style={styles.modalOverlay} onClick={() => setSelectedCareer(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {selectedCareer.name || "Career Details"}
              </h2>

              <button
                style={styles.closeButton}
                onClick={() => setSelectedCareer(null)}
              >
                ×
              </button>
            </div>

            <p style={styles.description}>
              {selectedCareer.overview || "No overview available."}
            </p>

            <div style={styles.detailsGrid}>
              <DetailBox
                label="Demand"
                value={formatLevel(selectedCareer.demandLevel)}
              />

              <DetailBox
                label="Salary"
                value={formatLevel(selectedCareer.salaryPotential)}
              />

              <DetailBox
                label="Stress"
                value={formatLevel(selectedCareer.stressLevel)}
              />

              <DetailBox
                label="Stability"
                value={formatLevel(selectedCareer.stabilityLevel)}
              />
            </div>

            <DetailList
              title="Main Tasks"
              items={selectedCareer.tasks}
              emptyText="No tasks listed"
            />

            <DetailList
              title="Core Concepts"
              items={selectedCareer.concepts}
              emptyText="No concepts listed"
            />

            <DetailList
              title="Recommended Courses"
              items={selectedCareer.courses}
              emptyText="No recommended courses listed"
            />
          </div>
        </div>
      )}

      <div style={styles.bottomNav}>
        <button style={styles.navButton} onClick={() => navigate("/chatbot")}>
          Chatbot
        </button>

        <button style={{ ...styles.navButton, ...styles.activeNav }}>
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

function FilterCard({ title, text, active, onClick }) {
  return (
    <button
      style={{
        ...styles.filterCard,
        ...(active ? styles.activeTab : {}),
      }}
      onClick={onClick}
    >
      <div>
        <h3 style={styles.filterTitle}>{title}</h3>
        <p style={styles.filterText}>{text}</p>
      </div>

      <span style={styles.arrow}>↗</span>
    </button>
  );
}

function LevelBadge({ label, value }) {
  const displayValue =
    value !== null && value !== undefined && value !== "" ? value : "MEDIUM";

  let badgeStyle = styles.badgeMedium;

  if (displayValue === "HIGH") {
    badgeStyle = styles.badgeHigh;
  }

  if (displayValue === "LOW") {
    badgeStyle = styles.badgeLow;
  }

  const formatted =
    displayValue.charAt(0) + displayValue.slice(1).toLowerCase();

  return (
    <span style={{ ...styles.badge, ...badgeStyle }}>
      {label}: {formatted}
    </span>
  );
}

function DetailBox({ label, value }) {
  const displayValue =
    value !== null && value !== undefined && value !== "" ? value : "N/A";

  return (
    <div style={styles.detailBox}>
      <strong style={styles.detailLabel}>{label}</strong>
      <span style={styles.detailValue}>{displayValue}</span>
    </div>
  );
}

function DetailList({ title, items, emptyText, onItemClick }) {
  const isClickable = typeof onItemClick === "function";

  return (
    <div style={styles.detailSection}>
      <h3 style={styles.detailTitle}>{title}</h3>

      {items?.length > 0 ? (
        <ul style={styles.detailList}>
          {items.map((item, index) => (
            <li key={index} style={styles.detailText}>
              {isClickable ? (
                <button
                  style={styles.detailLinkButton}
                  onClick={() => onItemClick(item)}
                >
                  {getDetailItemLabel(item)}
                </button>
              ) : (
                getDetailItemLabel(item)
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p style={styles.detailText}>{emptyText}</p>
      )}
    </div>
  );
}

function getDetailItemLabel(item) {
  if (typeof item === "object" && item !== null) {
    return item.name || item.courseName || item.title || "Unknown";
  }

  return item;
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
    maxWidth: "900px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "20px",
  },

  title: {
    fontSize: "30px",
    fontWeight: "700",
  },

  tabsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
    marginBottom: "26px",
  },

  tabCard: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "18px",
    padding: "22px",
    color: "#ffffff",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },

  activeTab: {
    border: "1px solid rgba(74,222,128,0.35)",
  },

  tabTitle: {
    fontSize: "22px",
    margin: "0 0 8px",
  },

  tabText: {
    margin: 0,
    color: "rgba(255,255,255,0.7)",
  },

  arrow: {
    fontSize: "22px",
    color: "#94a3b8",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },

  sectionTitle: {
    fontSize: "20px",
    margin: 0,
  },

  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },

  filterCard: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "18px",
    padding: "18px",
    color: "#ffffff",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },

  filterTitle: {
    fontSize: "18px",
    margin: "0 0 8px",
  },

  filterText: {
    margin: 0,
    color: "rgba(255,255,255,0.7)",
    fontSize: "14px",
  },

  studyToolsRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "14px",
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

  searchBox: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "18px",
    padding: "18px 20px",
    marginBottom: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  searchInput: {
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#ffffff",
    fontSize: "15px",
  },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },

  card: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "18px",
    padding: "22px",
    color: "#ffffff",
    textAlign: "left",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    minHeight: "150px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },

  careerCard: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "18px",
    padding: "22px",
    color: "#ffffff",
    textAlign: "left",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    minHeight: "230px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },

  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
  },

  avatar: {
    minWidth: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.08)",
    color: "#4ade80",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
  },

  cardTitle: {
    fontSize: "18px",
    margin: "4px 0 8px",
  },

  cardText: {
    margin: "0 0 4px",
    color: "rgba(255,255,255,0.7)",
    fontSize: "14px",
  },

  badgesRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "16px",
  },

  badge: {
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  badgeHigh: {
    background: "rgba(74,222,128,0.12)",
    color: "#4ade80",
  },

  badgeMedium: {
    background: "rgba(250,204,21,0.12)",
    color: "#fde68a",
  },

  badgeLow: {
    background: "rgba(34,211,238,0.12)",
    color: "#22d3ee",
  },

  bestFitBox: {
    marginTop: "16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "14px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  bestFitScore: {
    color: "#4ade80",
    fontSize: "24px",
  },

  bestFitText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "13px",
  },

  cardBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "18px",
  },

  cardMeta: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "14px",
  },

  detailsButton: {
    background: "transparent",
    border: "none",
    color: "#22d3ee",
    cursor: "pointer",
    fontWeight: "600",
  },

  emptyBox: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "18px",
    padding: "22px",
    color: "rgba(255,255,255,0.72)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },

  studyPlanList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  semesterCard: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "18px",
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

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    zIndex: 200,
  },

  modal: {
    width: "min(760px, 100%)",
    maxHeight: "85vh",
    overflowY: "auto",
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "22px",
    padding: "24px",
    color: "#ffffff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "16px",
  },

  modalTitle: {
    margin: 0,
    fontSize: "28px",
  },

  closeButton: {
    background: "transparent",
    border: "none",
    color: "#ffffff",
    fontSize: "32px",
    cursor: "pointer",
    lineHeight: 1,
  },

  description: {
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.6,
    marginBottom: "20px",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px",
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
  },

  detailSection: {
    marginTop: "18px",
  },

  detailTitle: {
    margin: "0 0 8px",
    fontSize: "18px",
  },

  detailText: {
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.6,
  },

  detailList: {
    margin: 0,
    paddingLeft: "20px",
  },

  detailLinkButton: {
    background: "transparent",
    border: "none",
    padding: 0,
    color: "#22d3ee",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "15px",
    textAlign: "left",
  },
};

export default ExplorePage;