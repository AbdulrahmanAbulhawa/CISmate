import { useEffect, useState } from "react";
import axios from "axios";
import {
  AdminIcon,
  AdminModal,
  AdminDetail,
  AdminInput,
  AdminTextArea,
  AdminCheckbox,
  AdminSearchBox,
  AdminIconAction,
} from "./AdminShared";
import { styles } from "./adminStyles";

function AdminCareers() {
  const [careers, setCareers] = useState([]);
  const [courses, setCourses] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [loading, setLoading] = useState(false);

  const emptyCareerForm = {
    id: "",
    slug: "",
    name: "",
    overview: "",
    active: true,
    demandLevel: "MEDIUM",
    salaryPotential: "MEDIUM",
    stressLevel: "MEDIUM",
    stabilityLevel: "MEDIUM",
  };

  const emptyTextForm = {
    text: "",
  };

  const emptyCourseLinkForm = {
    courseId: "",
    note: "",
  };

  const [careerForm, setCareerForm] = useState(emptyCareerForm);
  const [textForm, setTextForm] = useState(emptyTextForm);
  const [courseLinkForm, setCourseLinkForm] = useState(emptyCourseLinkForm);

  const CAREER_API = "http://localhost:8080/api/careers";
  const ADMIN_CAREER_API = "http://localhost:8080/api/admin/careers";
  const COURSE_API = "http://localhost:8080/api/admin/courses";

  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchCareers = async () => {
    try {
      setLoading(true);

      const response = await axios.get(CAREER_API, authConfig);

      setCareers(response.data || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load careers");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get(COURSE_API, authConfig);
      setCourses(response.data || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load courses");
    }
  };

  const fetchCareerDetails = async (slug) => {
    const response = await axios.get(
      `${CAREER_API}/${encodeURIComponent(slug)}`,
      authConfig
    );

    return response.data;
  };

  const viewCareer = async (career) => {
    try {
      const data = await fetchCareerDetails(career.slug);

      setSelectedCareer(data);
      setModalMode("view");
    } catch (error) {
      console.error(error);
      alert("Failed to load career details");
    }
  };

  const openCreateModal = () => {
    setCareerForm(emptyCareerForm);
    setModalMode("create");
  };

  const openEditModal = async (career) => {
    try {
      const data = await fetchCareerDetails(career.slug);

      setCareerForm({
        id: data.id || career.id || "",
        slug: data.slug || career.slug || "",
        name: data.name || career.name || "",
        overview: data.overview || career.overview || "",
        active: data.active ?? career.active ?? true,
        demandLevel: data.demandLevel || career.demandLevel || "MEDIUM",
        salaryPotential:
          data.salaryPotential || career.salaryPotential || "MEDIUM",
        stressLevel: data.stressLevel || career.stressLevel || "MEDIUM",
        stabilityLevel:
          data.stabilityLevel || career.stabilityLevel || "MEDIUM",
      });

      setModalMode("edit");
    } catch (error) {
      console.error(error);
      alert("Failed to load career for editing");
    }
  };

  const openAddTaskModal = (career) => {
    setSelectedCareer(career);
    setTextForm(emptyTextForm);
    setModalMode("addTask");
  };

  const openAddConceptModal = (career) => {
    setSelectedCareer(career);
    setTextForm(emptyTextForm);
    setModalMode("addConcept");
  };

  const openAddCourseModal = (career) => {
    setSelectedCareer(career);
    setCourseLinkForm(emptyCourseLinkForm);
    setModalMode("addCourse");
  };

  const buildCareerBody = () => {
    return {
      slug: careerForm.slug,
      name: careerForm.name,
      overview: careerForm.overview,
      active: careerForm.active,
      demandLevel: careerForm.demandLevel,
      salaryPotential: careerForm.salaryPotential,
      stressLevel: careerForm.stressLevel,
      stabilityLevel: careerForm.stabilityLevel,
    };
  };

  const createCareer = async (e) => {
    e.preventDefault();

    try {
      await axios.post(ADMIN_CAREER_API, buildCareerBody(), authConfig);

      closeModal();
      fetchCareers();
    } catch (error) {
      console.error(error);
      alert("Failed to create career");
    }
  };

  const updateCareer = async (e) => {
    e.preventDefault();

    if (!careerForm.id) {
      alert("Career ID is missing. Backend list/detail response must include id.");
      return;
    }

    try {
      await axios.put(
        `${ADMIN_CAREER_API}/${careerForm.id}`,
        buildCareerBody(),
        authConfig
      );

      closeModal();
      fetchCareers();
    } catch (error) {
      console.error(error);
      alert("Failed to update career");
    }
  };

  const deleteCareer = async (career) => {
    if (!career.id) {
      alert("Career ID is missing. Cannot delete this career.");
      return;
    }

    const confirmed = window.confirm(`Delete career: ${career.name}?`);

    if (!confirmed) return;

    try {
      await axios.delete(`${ADMIN_CAREER_API}/${career.id}`, authConfig);

      setCareers((prev) => prev.filter((c) => c.id !== career.id));
    } catch (error) {
      console.error(error);
      alert("Failed to delete career");
    }
  };

  const addTask = async (e) => {
    e.preventDefault();

    if (!selectedCareer?.id) {
      alert("Career ID is missing. Cannot add task.");
      return;
    }

    try {
      await axios.post(
        `${ADMIN_CAREER_API}/${selectedCareer.id}/tasks`,
        { text: textForm.text },
        authConfig
      );

      closeModal();
      fetchCareers();
    } catch (error) {
      console.error(error);
      alert("Failed to add task");
    }
  };

  const addConcept = async (e) => {
    e.preventDefault();

    if (!selectedCareer?.id) {
      alert("Career ID is missing. Cannot add concept.");
      return;
    }

    try {
      await axios.post(
        `${ADMIN_CAREER_API}/${selectedCareer.id}/concepts`,
        { text: textForm.text },
        authConfig
      );

      closeModal();
      fetchCareers();
    } catch (error) {
      console.error(error);
      alert("Failed to add concept");
    }
  };

  const addCourseToCareer = async (e) => {
    e.preventDefault();

    if (!selectedCareer?.id) {
      alert("Career ID is missing. Cannot add course.");
      return;
    }

    try {
      await axios.post(
        `${ADMIN_CAREER_API}/${selectedCareer.id}/courses`,
        {
          courseId: Number(courseLinkForm.courseId),
          note: courseLinkForm.note,
        },
        authConfig
      );

      closeModal();
      fetchCareers();
    } catch (error) {
      console.error(error);
      alert("Failed to add course to career");
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedCareer(null);
    setCareerForm(emptyCareerForm);
    setTextForm(emptyTextForm);
    setCourseLinkForm(emptyCourseLinkForm);
  };

  const formatCourseName = (course) => {
    const code = course.courseCode ? `${course.courseCode} - ` : "";
    const name = course.courseName || "Unnamed Course";

    return `${code}${name}`;
  };

  const formatList = (items) => {
    if (!items || items.length === 0) return "None";

    return items
      .map((item) => {
        if (typeof item === "string") return item;
        if (item.name) return item.name;
        if (item.courseName) return item.courseName;
        if (item.text) return item.text;

        return JSON.stringify(item);
      })
      .join(" | ");
  };

  useEffect(() => {
    fetchCareers();
    fetchCourses();
  }, []);

  const filteredCareers = careers.filter((career) => {
    const text = `${career.slug || ""} ${career.name || ""} ${
      career.demandLevel || ""
    } ${career.salaryPotential || ""} ${career.stressLevel || ""} ${
      career.stabilityLevel || ""
    }`.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <>
      <button style={styles.createButton} onClick={openCreateModal}>
        <AdminIcon name="plus" size={16} color="#0d131a" />
        Create Career
      </button>

      <AdminSearchBox
        placeholder="Search careers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <div style={styles.message}>Loading careers...</div>}

      {!loading && filteredCareers.length === 0 && (
        <div style={styles.message}>No careers found</div>
      )}

      <div style={styles.userList}>
        {filteredCareers.map((career) => (
          <div key={career.id || career.slug} style={careerStyles.card}>
            <div style={careerStyles.topRow}>
              <div style={careerStyles.titleBlock}>
                <div style={careerStyles.title}>
                  {career.name || "Unnamed Career"}
                </div>

                <div style={careerStyles.slug}>{career.slug || "No slug"}</div>
              </div>

              <div style={careerStyles.iconActions}>
                <AdminIconAction
                  name="eye"
                  onClick={() => viewCareer(career)}
                />

                <AdminIconAction
                  name="edit"
                  onClick={() => openEditModal(career)}
                />

                <AdminIconAction
                  name="trash"
                  onClick={() => deleteCareer(career)}
                />
              </div>
            </div>

            <div style={careerStyles.metricsRow}>
              <div style={careerStyles.metricPill}>
                Demand: {career.demandLevel || "MEDIUM"}
              </div>

              <div style={careerStyles.metricPill}>
                Salary: {career.salaryPotential || "MEDIUM"}
              </div>

              <div style={careerStyles.metricPill}>
                Stress: {career.stressLevel || "MEDIUM"}
              </div>

              <div style={careerStyles.metricPill}>
                Stability: {career.stabilityLevel || "MEDIUM"}
              </div>
            </div>

            <div style={careerStyles.actionRow}>
              <button
                type="button"
                style={careerStyles.smallButton}
                onClick={() => openAddTaskModal(career)}
              >
                Add Task
              </button>

              <button
                type="button"
                style={careerStyles.smallButton}
                onClick={() => openAddConceptModal(career)}
              >
                Add Concept
              </button>

              <button
                type="button"
                style={careerStyles.smallButton}
                onClick={() => openAddCourseModal(career)}
              >
                Add Course
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalMode === "view" && selectedCareer && (
        <AdminModal title="Career Details" onClose={closeModal}>
          <div style={styles.detailList}>
            <AdminDetail label="ID" value={selectedCareer.id} />
            <AdminDetail label="Slug" value={selectedCareer.slug} />
            <AdminDetail label="Name" value={selectedCareer.name} />
            <AdminDetail label="Overview" value={selectedCareer.overview} />
            <AdminDetail label="Demand" value={selectedCareer.demandLevel} />
            <AdminDetail
              label="Salary Potential"
              value={selectedCareer.salaryPotential}
            />
            <AdminDetail label="Stress" value={selectedCareer.stressLevel} />
            <AdminDetail
              label="Stability"
              value={selectedCareer.stabilityLevel}
            />

            <AdminDetail
              label="Tasks"
              value={formatList(selectedCareer.tasks)}
            />

            <AdminDetail
              label="Concepts"
              value={formatList(selectedCareer.concepts)}
            />

            <AdminDetail
              label="Courses"
              value={formatList(selectedCareer.courses)}
            />
          </div>
        </AdminModal>
      )}

      {modalMode === "create" && (
        <AdminModal title="Create Career" onClose={closeModal}>
          <CareerForm
            form={careerForm}
            setForm={setCareerForm}
            onSubmit={createCareer}
            buttonText="Create"
          />
        </AdminModal>
      )}

      {modalMode === "edit" && (
        <AdminModal title="Update Career" onClose={closeModal}>
          <CareerForm
            form={careerForm}
            setForm={setCareerForm}
            onSubmit={updateCareer}
            buttonText="Update"
            editing
          />
        </AdminModal>
      )}

      {modalMode === "addTask" && selectedCareer && (
        <AdminModal title="Add Task" onClose={closeModal}>
          <form onSubmit={addTask} style={styles.form}>
            <div style={careerStyles.targetName}>{selectedCareer.name}</div>

            <AdminTextArea
              label="Task Text"
              value={textForm.text}
              onChange={(e) =>
                setTextForm({ ...textForm, text: e.target.value })
              }
            />

            <button type="submit" style={styles.submitButton}>
              Add Task
            </button>
          </form>
        </AdminModal>
      )}

      {modalMode === "addConcept" && selectedCareer && (
        <AdminModal title="Add Concept" onClose={closeModal}>
          <form onSubmit={addConcept} style={styles.form}>
            <div style={careerStyles.targetName}>{selectedCareer.name}</div>

            <AdminTextArea
              label="Concept Text"
              value={textForm.text}
              onChange={(e) =>
                setTextForm({ ...textForm, text: e.target.value })
              }
            />

            <button type="submit" style={styles.submitButton}>
              Add Concept
            </button>
          </form>
        </AdminModal>
      )}

      {modalMode === "addCourse" && selectedCareer && (
        <AdminModal title="Add Course to Career" onClose={closeModal}>
          <form onSubmit={addCourseToCareer} style={styles.form}>
            <div style={careerStyles.targetName}>{selectedCareer.name}</div>

            <label style={styles.label}>
              Course
              <select
                value={courseLinkForm.courseId}
                onChange={(e) =>
                  setCourseLinkForm({
                    ...courseLinkForm,
                    courseId: e.target.value,
                  })
                }
                style={styles.input}
                required
              >
                <option value="">Select course</option>

                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {formatCourseName(course)}
                  </option>
                ))}
              </select>
            </label>

            <AdminTextArea
              label="Note"
              value={courseLinkForm.note}
              onChange={(e) =>
                setCourseLinkForm({
                  ...courseLinkForm,
                  note: e.target.value,
                })
              }
            />

            <button type="submit" style={styles.submitButton}>
              Add Course
            </button>
          </form>
        </AdminModal>
      )}
    </>
  );
}

function CareerForm({ form, setForm, onSubmit, buttonText, editing = false }) {
  const levelOptions = ["LOW", "MEDIUM", "HIGH"];

  return (
    <form onSubmit={onSubmit} style={styles.form}>
      {editing && <AdminInput label="ID" value={form.id} disabled />}

      <AdminInput
        label="Slug"
        placeholder="example: backend-developer"
        value={form.slug}
        onChange={(e) => setForm({ ...form, slug: e.target.value })}
        required
      />

      <AdminInput
        label="Name"
        placeholder="Example: Backend Developer"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />

      <AdminTextArea
        label="Overview"
        value={form.overview}
        onChange={(e) => setForm({ ...form, overview: e.target.value })}
      />

      <AdminCheckbox
        label="Active"
        checked={form.active}
        onChange={(e) => setForm({ ...form, active: e.target.checked })}
      />

      <CareerSelect
        label="Demand Level"
        value={form.demandLevel}
        options={levelOptions}
        onChange={(value) => setForm({ ...form, demandLevel: value })}
      />

      <CareerSelect
        label="Salary Potential"
        value={form.salaryPotential}
        options={levelOptions}
        onChange={(value) => setForm({ ...form, salaryPotential: value })}
      />

      <CareerSelect
        label="Stress Level"
        value={form.stressLevel}
        options={levelOptions}
        onChange={(value) => setForm({ ...form, stressLevel: value })}
      />

      <CareerSelect
        label="Stability Level"
        value={form.stabilityLevel}
        options={levelOptions}
        onChange={(value) => setForm({ ...form, stabilityLevel: value })}
      />

      <button type="submit" style={styles.submitButton}>
        {buttonText}
      </button>
    </form>
  );
}

function CareerSelect({ label, value, options, onChange }) {
  return (
    <label style={styles.label}>
      {label}

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.input}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

const careerStyles = {
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

  slug: {
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

  metricsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "10px",
  },

  metricPill: {
    background: "#0d131a",
    border: "1px solid #2a333d",
    borderRadius: "999px",
    color: "#bfc9d2",
    fontSize: "11px",
    padding: "5px 8px",
  },

  actionRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "6px",
    marginTop: "10px",
  },

  smallButton: {
    height: "32px",
    border: "1px solid #2a333d",
    borderRadius: "9px",
    background: "#0d131a",
    color: "#d8dde3",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },

  targetName: {
    color: "#57d0b7",
    fontWeight: "700",
    fontSize: "14px",
    marginBottom: "4px",
  },
};

export default AdminCareers;