import { useEffect, useState } from "react";
import axios from "axios";
import {
  AdminIcon,
  AdminModal,
  AdminDetail,
  AdminInput,
  AdminSearchBox,
  AdminIconAction,
} from "./AdminShared";
import { styles } from "./adminStyles";

function AdminProfessors() {
  const [professors, setProfessors] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [loading, setLoading] = useState(false);

  const emptyForm = {
    id: "",
    name: "",
    title: "",
    email: "",
    department: "",
    office: "",
    tags: "",
  };

  const [form, setForm] = useState(emptyForm);

  const API_BASE = "http://localhost:8080/api/admin/professors";
  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchProfessors = async () => {
    try {
      setLoading(true);

      const response = await axios.get(API_BASE, authConfig);

      setProfessors(response.data || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load professors");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessorDetails = async (id) => {
    const response = await axios.get(`${API_BASE}/${id}`, authConfig);
    return response.data;
  };

  const viewProfessor = async (professor) => {
    try {
      const data = await fetchProfessorDetails(professor.id);

      setSelectedProfessor(data);
      setModalMode("view");
    } catch (error) {
      console.error(error);
      alert("Failed to load professor details");
    }
  };

  const openCreateModal = () => {
    setForm(emptyForm);
    setModalMode("create");
  };

  const openEditModal = async (professor) => {
    try {
      const data = await fetchProfessorDetails(professor.id);

      setForm({
        id: data.id || "",
        name: data.name || "",
        title: data.title || "",
        email: data.email || "",
        department: data.department || "",
        office: data.office || "",
        tags: data.tags || "",
      });

      setModalMode("edit");
    } catch (error) {
      console.error(error);
      alert("Failed to load professor for editing");
    }
  };

  const buildProfessorBody = () => {
    return {
      name: form.name,
      title: form.title,
      email: form.email,
      department: form.department,
      office: form.office,
      tags: form.tags,

      // Backend returns courses for display only.
      // Current admin professor backend does not save course links here.
      courses: [],
    };
  };

  const createProfessor = async (e) => {
    e.preventDefault();

    try {
      await axios.post(API_BASE, buildProfessorBody(), authConfig);

      closeModal();
      fetchProfessors();
    } catch (error) {
      console.error(error);
      alert("Failed to create professor");
    }
  };

  const updateProfessor = async (e) => {
    e.preventDefault();

    try {
      await axios.put(`${API_BASE}/${form.id}`, buildProfessorBody(), authConfig);

      closeModal();
      fetchProfessors();
    } catch (error) {
      console.error(error);
      alert("Failed to update professor");
    }
  };

  const deleteProfessor = async (professor) => {
    const confirmed = window.confirm(`Delete professor: ${professor.name}?`);

    if (!confirmed) return;

    try {
      await axios.delete(`${API_BASE}/${professor.id}`, authConfig);

      setProfessors((prev) => prev.filter((p) => p.id !== professor.id));
    } catch (error) {
      console.error(error);
      alert("Failed to delete professor");
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedProfessor(null);
    setForm(emptyForm);
  };

  useEffect(() => {
    fetchProfessors();
  }, []);

  const filteredProfessors = professors.filter((professor) => {
    const text = `${professor.name || ""} ${professor.title || ""} ${
      professor.email || ""
    } ${professor.department || ""} ${professor.office || ""} ${
      professor.tags || ""
    } ${professor.courses ? professor.courses.join(" ") : ""}`.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <>
      <button style={styles.createButton} onClick={openCreateModal}>
        <AdminIcon name="plus" size={16} color="#0d131a" />
        Create Professor
      </button>

      <AdminSearchBox
        placeholder="Search professors..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <div style={styles.message}>Loading professors...</div>}

      {!loading && filteredProfessors.length === 0 && (
        <div style={styles.message}>No professors found</div>
      )}

      <div style={styles.userList}>
        {filteredProfessors.map((professor) => (
          <div key={professor.id} style={styles.courseRow}>
            <div style={styles.courseTextBlock}>
              <div style={styles.courseTitle}>
                {professor.name || "Unnamed Professor"}
              </div>

              <div style={styles.courseMeta}>
                {professor.title || "No title"} •{" "}
                {professor.department || "No department"}
              </div>

              <div style={styles.courseMeta}>
                Courses:{" "}
                {professor.courses && professor.courses.length > 0
                  ? professor.courses.join(", ")
                  : "None"}
              </div>
            </div>

            <div style={styles.userActions}>
              <AdminIconAction
                name="eye"
                onClick={() => viewProfessor(professor)}
              />

              <AdminIconAction
                name="edit"
                onClick={() => openEditModal(professor)}
              />

              <AdminIconAction
                name="trash"
                onClick={() => deleteProfessor(professor)}
              />
            </div>
          </div>
        ))}
      </div>

      {modalMode === "view" && selectedProfessor && (
        <AdminModal title="Professor Details" onClose={closeModal}>
          <div style={styles.detailList}>
            <AdminDetail label="ID" value={selectedProfessor.id} />
            <AdminDetail label="Name" value={selectedProfessor.name} />
            <AdminDetail label="Title" value={selectedProfessor.title} />
            <AdminDetail label="Email" value={selectedProfessor.email} />
            <AdminDetail
              label="Department"
              value={selectedProfessor.department}
            />
            <AdminDetail label="Office" value={selectedProfessor.office} />
            <AdminDetail label="Tags" value={selectedProfessor.tags} />

            <AdminDetail
              label="Courses"
              value={
                selectedProfessor.courses &&
                selectedProfessor.courses.length > 0
                  ? selectedProfessor.courses.join(", ")
                  : "None"
              }
            />
          </div>
        </AdminModal>
      )}

      {modalMode === "create" && (
        <AdminModal title="Create Professor" onClose={closeModal}>
          <ProfessorForm
            form={form}
            setForm={setForm}
            onSubmit={createProfessor}
            buttonText="Create"
          />
        </AdminModal>
      )}

      {modalMode === "edit" && (
        <AdminModal title="Update Professor" onClose={closeModal}>
          <ProfessorForm
            form={form}
            setForm={setForm}
            onSubmit={updateProfessor}
            buttonText="Update"
            editing
          />
        </AdminModal>
      )}
    </>
  );
}

function ProfessorForm({ form, setForm, onSubmit, buttonText, editing = false }) {
  return (
    <form onSubmit={onSubmit} style={styles.form}>
      {editing && <AdminInput label="ID" value={form.id} disabled />}

      <AdminInput
        label="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />

      <AdminInput
        label="Title"
        placeholder="Example: Associate Professor"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <AdminInput
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <AdminInput
        label="Department"
        placeholder="Example: CIS"
        value={form.department}
        onChange={(e) => setForm({ ...form, department: e.target.value })}
      />

      <AdminInput
        label="Office"
        placeholder="Example: IT Building - 205"
        value={form.office}
        onChange={(e) => setForm({ ...form, office: e.target.value })}
      />

      <AdminInput
        label="Tags"
        placeholder="Example: AI, Databases, Networking"
        value={form.tags}
        onChange={(e) => setForm({ ...form, tags: e.target.value })}
      />

      <button type="submit" style={styles.submitButton}>
        {buttonText}
      </button>
    </form>
  );
}

export default AdminProfessors;