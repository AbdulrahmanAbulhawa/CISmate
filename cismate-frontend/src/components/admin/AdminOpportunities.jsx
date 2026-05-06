import { useEffect, useState } from "react";
import axios from "axios";
import {
  AdminIcon,
  AdminModal,
  AdminDetail,
  AdminInput,
  AdminTextArea,
  AdminSearchBox,
  AdminIconAction,
} from "./AdminShared";
import { styles } from "./adminStyles";

function AdminOpportunities() {
  const [activeType, setActiveType] = useState("INTERNSHIP");
  const [opportunities, setOpportunities] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [loading, setLoading] = useState(false);

  const emptyInternshipForm = {
    title: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    companyName: "",
    slotsNeeded: "",
  };

  const [internshipForm, setInternshipForm] = useState(emptyInternshipForm);

  const API_BASE = "http://localhost:8080/opportunities";
  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchOpportunities = async (type = activeType) => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_BASE}/active?type=${type}`,
        authConfig
      );

      setOpportunities(response.data || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  };

  const openCreateInternshipModal = () => {
    setInternshipForm(emptyInternshipForm);
    setModalMode("createInternship");
  };

  const viewOpportunity = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setModalMode("view");
  };

  const createInternship = async (e) => {
    e.preventDefault();

    try {
      const body = {
        type: "INTERNSHIP",
        title: internshipForm.title,
        description: internshipForm.description,
        contactEmail: internshipForm.contactEmail,
        contactPhone: internshipForm.contactPhone,
        companyName: internshipForm.companyName,
        slotsNeeded:
          internshipForm.slotsNeeded === ""
            ? null
            : Number(internshipForm.slotsNeeded),
      };

      await axios.post(`${API_BASE}/internships`, body, authConfig);

      closeModal();
      setActiveType("INTERNSHIP");
      fetchOpportunities("INTERNSHIP");
    } catch (error) {
      console.error(error);
      alert("Failed to create internship");
    }
  };

  const deleteOpportunity = async (opportunity) => {
    const confirmed = window.confirm(
      `Delete opportunity: ${opportunity.title || "Untitled"}?`
    );

    if (!confirmed) return;

    try {
      await axios.delete(`${API_BASE}/${opportunity.id}`, authConfig);

      setOpportunities((prev) =>
        prev.filter((item) => item.id !== opportunity.id)
      );
    } catch (error) {
      console.error(error);
      alert("Failed to delete opportunity");
    }
  };

  const changeType = (type) => {
    setActiveType(type);
    setSearch("");
    fetchOpportunities(type);
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedOpportunity(null);
    setInternshipForm(emptyInternshipForm);
  };

  const getPosterName = (opportunity) => {
    return (
      opportunity.posterName ||
      opportunity.postedByName ||
      opportunity.userName ||
      opportunity.createdBy ||
      "-"
    );
  };

  const getInterestedCount = (opportunity) => {
    return (
      opportunity.interestedCount ??
      opportunity.interestedUsersCount ??
      opportunity.numberOfInterested ??
      0
    );
  };

  const filteredOpportunities = opportunities.filter((opportunity) => {
    const text = `${opportunity.title || ""} ${
      opportunity.description || ""
    } ${opportunity.companyName || ""} ${opportunity.contactEmail || ""} ${
      opportunity.contactPhone || ""
    } ${getPosterName(opportunity)}`.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  useEffect(() => {
    fetchOpportunities("INTERNSHIP");
  }, []);

  return (
    <>
      <div style={opportunityStyles.typeTabs}>
        <button
          type="button"
          onClick={() => changeType("INTERNSHIP")}
          style={{
            ...opportunityStyles.typeButton,
            ...(activeType === "INTERNSHIP"
              ? opportunityStyles.typeButtonActive
              : {}),
          }}
        >
          Internships
        </button>

        <button
          type="button"
          onClick={() => changeType("GROUP")}
          style={{
            ...opportunityStyles.typeButton,
            ...(activeType === "GROUP" ? opportunityStyles.typeButtonActive : {}),
          }}
        >
          Groups
        </button>
      </div>

      {activeType === "INTERNSHIP" && (
        <button style={styles.createButton} onClick={openCreateInternshipModal}>
          <AdminIcon name="plus" size={16} color="#0d131a" />
          Create Internship
        </button>
      )}

      <AdminSearchBox
        placeholder={`Search ${activeType.toLowerCase()} posts...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <div style={styles.message}>Loading opportunities...</div>}

      {!loading && filteredOpportunities.length === 0 && (
        <div style={styles.message}>No opportunities found</div>
      )}

      <div style={styles.userList}>
        {filteredOpportunities.map((opportunity) => (
          <div key={opportunity.id} style={opportunityStyles.card}>
            <div style={opportunityStyles.topRow}>
              <div style={opportunityStyles.titleBlock}>
                <div style={opportunityStyles.title}>
                  {opportunity.title || "Untitled Opportunity"}
                </div>

                <div style={opportunityStyles.subtitle}>
                  {opportunity.type || activeType}
                  {opportunity.companyName
                    ? ` • ${opportunity.companyName}`
                    : ""}
                </div>
              </div>

              <div style={opportunityStyles.iconActions}>
                <AdminIconAction
                  name="eye"
                  onClick={() => viewOpportunity(opportunity)}
                />

                <AdminIconAction
                  name="trash"
                  onClick={() => deleteOpportunity(opportunity)}
                />
              </div>
            </div>

            <div style={opportunityStyles.description}>
              {opportunity.description || "No description"}
            </div>

            <div style={opportunityStyles.infoGrid}>
              <div style={opportunityStyles.infoPill}>
                Slots: {opportunity.slotsNeeded ?? "-"}
              </div>

              <div style={opportunityStyles.infoPill}>
                Interested: {getInterestedCount(opportunity)}
              </div>

              <div style={opportunityStyles.infoPill}>
                Poster: {getPosterName(opportunity)}
              </div>
            </div>

            <div style={opportunityStyles.contactBlock}>
              <div>Email: {opportunity.contactEmail || "-"}</div>
              <div>Phone: {opportunity.contactPhone || "-"}</div>
            </div>
          </div>
        ))}
      </div>

      {modalMode === "view" && selectedOpportunity && (
        <AdminModal title="Opportunity Details" onClose={closeModal}>
          <div style={styles.detailList}>
            <AdminDetail label="ID" value={selectedOpportunity.id} />
            <AdminDetail label="Type" value={selectedOpportunity.type} />
            <AdminDetail label="Title" value={selectedOpportunity.title} />
            <AdminDetail
              label="Description"
              value={selectedOpportunity.description}
            />
            <AdminDetail
              label="Company"
              value={selectedOpportunity.companyName}
            />
            <AdminDetail
              label="Slots Needed"
              value={selectedOpportunity.slotsNeeded}
            />
            <AdminDetail
              label="Interested"
              value={getInterestedCount(selectedOpportunity)}
            />
            <AdminDetail
              label="Poster"
              value={getPosterName(selectedOpportunity)}
            />
            <AdminDetail
              label="Contact Email"
              value={selectedOpportunity.contactEmail}
            />
            <AdminDetail
              label="Contact Phone"
              value={selectedOpportunity.contactPhone}
            />
            <AdminDetail
              label="Active"
              value={
                selectedOpportunity.active === undefined
                  ? "-"
                  : String(selectedOpportunity.active)
              }
            />
            <AdminDetail
              label="Created At"
              value={
                selectedOpportunity.createdAt ||
                selectedOpportunity.createdDate ||
                selectedOpportunity.createdOn
              }
            />
          </div>
        </AdminModal>
      )}

      {modalMode === "createInternship" && (
        <AdminModal title="Create Internship" onClose={closeModal}>
          <form onSubmit={createInternship} style={styles.form}>
            <AdminInput
              label="Title"
              placeholder="Example: Backend Intern"
              value={internshipForm.title}
              onChange={(e) =>
                setInternshipForm({
                  ...internshipForm,
                  title: e.target.value,
                })
              }
              required
            />

            <AdminTextArea
              label="Description"
              value={internshipForm.description}
              onChange={(e) =>
                setInternshipForm({
                  ...internshipForm,
                  description: e.target.value,
                })
              }
            />

            <AdminInput
              label="Company Name"
              placeholder="Example: Orange"
              value={internshipForm.companyName}
              onChange={(e) =>
                setInternshipForm({
                  ...internshipForm,
                  companyName: e.target.value,
                })
              }
            />

            <AdminInput
              label="Contact Email"
              type="email"
              placeholder="hr@company.com"
              value={internshipForm.contactEmail}
              onChange={(e) =>
                setInternshipForm({
                  ...internshipForm,
                  contactEmail: e.target.value,
                })
              }
            />

            <AdminInput
              label="Contact Phone"
              placeholder="0790000000"
              value={internshipForm.contactPhone}
              onChange={(e) =>
                setInternshipForm({
                  ...internshipForm,
                  contactPhone: e.target.value,
                })
              }
            />

            <AdminInput
              label="Slots Needed"
              type="number"
              value={internshipForm.slotsNeeded}
              onChange={(e) =>
                setInternshipForm({
                  ...internshipForm,
                  slotsNeeded: e.target.value,
                })
              }
            />

            <button type="submit" style={styles.submitButton}>
              Create Internship
            </button>
          </form>
        </AdminModal>
      )}
    </>
  );
}

const opportunityStyles = {
  typeTabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginBottom: "10px",
  },

  typeButton: {
    height: "36px",
    border: "1px solid #2a333d",
    borderRadius: "10px",
    background: "#151c24",
    color: "#bfc9d2",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },

  typeButtonActive: {
    background: "#57d0b7",
    color: "#0d131a",
    border: "1px solid #57d0b7",
  },

  card: {
    background: "#151c24",
    border: "1px solid #202831",
    borderRadius: "14px",
    padding: "12px",
    marginBottom: "10px",
  },

  topRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "10px",
  },

  titleBlock: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    color: "#edf1f4",
    fontSize: "15px",
    fontWeight: "700",
    lineHeight: "1.3",
  },

  subtitle: {
    color: "#8f9ba6",
    fontSize: "12px",
    marginTop: "3px",
    wordBreak: "break-word",
  },

  iconActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
    paddingTop: "2px",
  },

  description: {
    color: "#bfc9d2",
    fontSize: "13px",
    lineHeight: "1.4",
    marginTop: "8px",
    maxHeight: "56px",
    overflow: "hidden",
  },

  infoGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "10px",
  },

  infoPill: {
    background: "#0d131a",
    border: "1px solid #2a333d",
    borderRadius: "999px",
    color: "#bfc9d2",
    fontSize: "11px",
    padding: "5px 8px",
  },

  contactBlock: {
    color: "#8f9ba6",
    fontSize: "12px",
    lineHeight: "1.5",
    marginTop: "10px",
    wordBreak: "break-word",
  },
};

export default AdminOpportunities;