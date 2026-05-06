import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function CareersPage() {
  const [careers, setCareers] = useState([]);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    getCareers();
  }, [filter]);

  const getCareers = () => {
    setLoading(true);
    setSelectedCareer(null);

    const params = filter === "ALL" ? {} : { filter };

    axios
      .get("http://localhost:8080/api/careers", {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log("CAREERS RESPONSE:", res.data);
        setCareers(res.data || []);
      })
      .catch((err) => {
        console.log("CAREERS ERROR:", err.response || err);

        if (filter === "BEST_FIT") {
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

  const getCareerDetails = (career) => {
    if (!career.slug) {
      alert("Career slug is missing. Check CAREERS RESPONSE in console.");
      return;
    }

    axios
      .get(`http://localhost:8080/api/careers/${career.slug}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log("CAREER DETAILS RESPONSE:", res.data);
        setSelectedCareer(res.data);
      })
      .catch((err) => {
        console.log("CAREER DETAILS ERROR:", err.response || err);
        alert("Could not load career details. Check console.");
      });
  };

  const filteredCareers = careers.filter((career) =>
    `${career.name || ""} ${career.slug || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const formatLevel = (level) => {
    if (!level) return "Medium";
    return level.charAt(0) + level.slice(1).toLowerCase();
  };

  const formatScore = (score) => {
    if (score === null || score === undefined) return null;
    return `${Math.round(score * 100)}%`;
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Careers</h1>
        </div>

        <div style={styles.tabsGrid}>
          <FilterCard
            title="All Careers"
            text="Browse every career path."
            active={filter === "ALL"}
            onClick={() => {
              setFilter("ALL");
              setSearch("");
            }}
          />

          <FilterCard
            title="High Demand"
            text="Careers with strong market demand."
            active={filter === "HIGH_DEMAND"}
            onClick={() => {
              setFilter("HIGH_DEMAND");
              setSearch("");
            }}
          />

          <FilterCard
            title="High Salary"
            text="Careers with higher earning potential."
            active={filter === "HIGH_SALARY"}
            onClick={() => {
              setFilter("HIGH_SALARY");
              setSearch("");
            }}
          />

          <FilterCard
            title="Low Stress"
            text="Stable careers with lower stress."
            active={filter === "LOW_STRESS_STABLE"}
            onClick={() => {
              setFilter("LOW_STRESS_STABLE");
              setSearch("");
            }}
          />

          <FilterCard
            title="Best Fit"
            text="Based on your completed courses."
            active={filter === "BEST_FIT"}
            onClick={() => {
              setFilter("BEST_FIT");
              setSearch("");
            }}
          />
        </div>

        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Career Paths</h3>
        </div>

        <div style={styles.searchBox}>
          <span>🔍</span>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Search by career name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={styles.emptyBox}>Loading careers...</div>
        ) : filteredCareers.length === 0 ? (
          <div style={styles.emptyBox}>No careers found.</div>
        ) : (
          <div style={styles.cardsGrid}>
            {filteredCareers.map((career, index) => (
              <div key={career.id || index} style={styles.card}>
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
                    <LevelBadge label="Stability" value={career.stabilityLevel} />
                  </div>

                  {career.bestFitScore !== null &&
                    career.bestFitScore !== undefined && (
                      <div style={styles.bestFitBox}>
                        <strong style={styles.bestFitScore}>
                          {formatScore(career.bestFitScore)}
                        </strong>

                        <span style={styles.bestFitText}>
                          Best fit score
                        </span>

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
            ))}
          </div>
        )}
      </div>

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

function FilterCard({ title, text, active, onClick }) {
  return (
    <button
      style={{
        ...styles.tabCard,
        ...(active ? styles.activeTab : {}),
      }}
      onClick={onClick}
    >
      <div>
        <h3 style={styles.tabTitle}>{title}</h3>
        <p style={styles.tabText}>{text}</p>
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

function DetailList({ title, items, emptyText }) {
  return (
    <div style={styles.detailSection}>
      <h3 style={styles.detailTitle}>{title}</h3>

      {items?.length > 0 ? (
        <ul style={styles.detailList}>
          {items.map((item, index) => (
            <li key={index} style={styles.detailText}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p style={styles.detailText}>{emptyText}</p>
      )}
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
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
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
};

export default CareersPage;