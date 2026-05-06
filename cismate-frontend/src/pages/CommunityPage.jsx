import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function CommunityPage() {
  const [activeTab, setActiveTab] = useState("GROUP");
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    slotsNeeded: 1,
  });

  const [interestedIds, setInterestedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("interestedOpportunityIds")) || [];
    } catch {
      return [];
    }
  });

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    getPosts(activeTab);
  }, [activeTab]);

  const getPosts = (type) => {
    setLoading(true);

    axios
      .get("http://localhost:8080/opportunities/active", {
        params: {
          type,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log("OPPORTUNITIES RESPONSE:", res.data);
        setPosts(res.data || []);
      })
      .catch((err) => {
        console.log("OPPORTUNITIES ERROR:", err.response || err);
        alert("Could not load community posts. Check console.");
        setPosts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const createGroupPost = (e) => {
    e.preventDefault();

    const body = {
      type: "GROUP",
      title: form.title,
      description: form.description,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      companyName: null,
      slotsNeeded: Number(form.slotsNeeded),
    };

    axios
      .post("http://localhost:8080/opportunities/groups", body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log("CREATE GROUP RESPONSE:", res.data);

        setShowCreateModal(false);
        setForm({
          title: "",
          description: "",
          contactEmail: "",
          contactPhone: "",
          slotsNeeded: 1,
        });

        setActiveTab("GROUP");
        getPosts("GROUP");
      })
      .catch((err) => {
        console.log("CREATE GROUP ERROR:", err.response || err);
        alert("Could not create group post. Check console.");
      });
  };

  const markInterested = (postId) => {
    axios
      .post(
        `http://localhost:8080/opportunities/${postId}/interested`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((res) => {
        console.log("INTERESTED RESPONSE:", res.data);

        const updatedIds = [...interestedIds, postId];
        setInterestedIds(updatedIds);
        localStorage.setItem(
          "interestedOpportunityIds",
          JSON.stringify(updatedIds)
        );

        getPosts(activeTab);
      })
      .catch((err) => {
        console.log("INTERESTED ERROR:", err.response || err);
        alert("Could not mark interested. Check console.");
      });
  };

  const filteredPosts = posts.filter((post) =>
    `${post.title || ""} ${post.description || ""} ${post.companyName || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString();
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Community</h1>
            <p style={styles.headerText}>
              Find project groups and internship opportunities.
            </p>
          </div>

          <button
            style={styles.createButton}
            onClick={() => setShowCreateModal(true)}
          >
            + New Group Post
          </button>
        </div>

        <div style={styles.tabsGrid}>
          <button
            style={{
              ...styles.tabCard,
              ...(activeTab === "GROUP" ? styles.activeTab : {}),
            }}
            onClick={() => {
              setActiveTab("GROUP");
              setSearch("");
            }}
          >
            <div>
              <h3 style={styles.tabTitle}>Groups</h3>
              <p style={styles.tabText}>Find students for projects or teams.</p>
            </div>
            <span style={styles.arrow}>↗</span>
          </button>

          <button
            style={{
              ...styles.tabCard,
              ...(activeTab === "INTERNSHIP" ? styles.activeTab : {}),
            }}
            onClick={() => {
              setActiveTab("INTERNSHIP");
              setSearch("");
            }}
          >
            <div>
              <h3 style={styles.tabTitle}>Internships</h3>
              <p style={styles.tabText}>View internship posts added by admin.</p>
            </div>
            <span style={styles.arrow}>↗</span>
          </button>
        </div>

        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>
            {activeTab === "GROUP" ? "Group Posts" : "Internship Posts"}
          </h3>
        </div>

        <div style={styles.searchBox}>
          <span>🔍</span>
          <input
            style={styles.searchInput}
            type="text"
            placeholder={
              activeTab === "GROUP"
                ? "Search group posts..."
                : "Search internships..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={styles.emptyBox}>Loading posts...</div>
        ) : filteredPosts.length === 0 ? (
          <div style={styles.emptyBox}>
            {activeTab === "GROUP"
              ? "No active group posts found."
              : "No active internships found."}
          </div>
        ) : (
          <div style={styles.cardsGrid}>
            {filteredPosts.map((post) => {
              const alreadyInterested = interestedIds.includes(post.id);
              const isFull =
                post.status === "FULL" ||
                Number(post.interestedCount) >= Number(post.slotsNeeded);

              return (
                <div key={post.id} style={styles.card}>
                  <div>
                    <div style={styles.cardTop}>
                      <div style={styles.avatar}>
                        {post.type === "INTERNSHIP" ? "I" : "G"}
                      </div>

                      <div>
                        <h3 style={styles.cardTitle}>
                          {post.title || "Untitled Post"}
                        </h3>

                        <p style={styles.cardText}>
                          {post.type === "INTERNSHIP"
                            ? post.companyName || "Company not listed"
                            : "Student group"}
                        </p>

                        <p style={styles.cardText}>
                          Posted: {formatDate(post.createdAt)}
                        </p>
                      </div>
                    </div>

                    <p style={styles.description}>
                      {post.description || "No description provided."}
                    </p>

                    <div style={styles.detailsGrid}>
                      <DetailBox label="Email" value={post.contactEmail} />
                      <DetailBox label="Phone" value={post.contactPhone} />
                      <DetailBox
                        label="Slots"
                        value={`${post.interestedCount || 0} / ${
                          post.slotsNeeded || 0
                        }`}
                      />
                      <DetailBox label="Status" value={post.status} />
                    </div>
                  </div>

                  <div style={styles.cardBottom}>
                    <span style={styles.cardMeta}>
                      {post.type === "INTERNSHIP" ? "💼 Internship" : "👥 Group"}
                    </span>

                    <button
                      style={{
                        ...styles.detailsButton,
                        ...(alreadyInterested || isFull
                          ? styles.disabledButton
                          : {}),
                      }}
                      disabled={alreadyInterested || isFull}
                      onClick={() => markInterested(post.id)}
                    >
                      {isFull
                        ? "Full"
                        : alreadyInterested
                        ? "Interested"
                        : "I'm Interested"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowCreateModal(false)}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Create Group Post</h2>

              <button
                style={styles.closeButton}
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={createGroupPost}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Title</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="Example: Need 2 students for database project"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  style={styles.textarea}
                  placeholder="Explain what you need..."
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  required
                />
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Contact Email</label>
                  <input
                    style={styles.input}
                    type="email"
                    placeholder="student@example.com"
                    value={form.contactEmail}
                    onChange={(e) =>
                      setForm({ ...form, contactEmail: e.target.value })
                    }
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Contact Phone</label>
                  <input
                    style={styles.input}
                    type="text"
                    placeholder="07xxxxxxxx"
                    value={form.contactPhone}
                    onChange={(e) =>
                      setForm({ ...form, contactPhone: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Students Needed</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  value={form.slotsNeeded}
                  onChange={(e) =>
                    setForm({ ...form, slotsNeeded: e.target.value })
                  }
                  required
                />
              </div>

              <button style={styles.submitButton} type="submit">
                Create Post
              </button>
            </form>
          </div>
        </div>
      )}

      <div style={styles.bottomNav}>
        <button style={styles.navButton} onClick={() => navigate("/chatbot")}>
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

        <button style={{ ...styles.navButton, ...styles.activeNav }}>
          Community
        </button>
      </div>
    </div>
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
  createButton: {
    background: "#4ade80",
    color: "#07111c",
    border: "none",
    borderRadius: "14px",
    padding: "13px 16px",
    fontWeight: "800",
    cursor: "pointer",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
    minHeight: "270px",
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
  description: {
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.6,
    margin: "18px 0",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "12px",
    marginTop: "14px",
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
  disabledButton: {
    color: "rgba(255,255,255,0.4)",
    cursor: "not-allowed",
  },
  emptyBox: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "18px",
    padding: "22px",
    color: "rgba(255,255,255,0.72)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
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
  formGroup: {
    marginBottom: "16px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
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
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: "130px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "14px",
    color: "#ffffff",
    outline: "none",
    resize: "vertical",
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
    marginTop: "8px",
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

export default CommunityPage;