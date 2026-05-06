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

function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [loading, setLoading] = useState(false);

  const emptyForm = {
    id: "",
    courseCode: "",
    courseName: "",
    description: "",
    difficulty: "",
    creditHours: "",
    semesterOffered: "",
    category: "",
    hasLab: false,
    hasProject: false,
    hasGroupWork: false,
    courseType: "",
    assessment: "",
    assessmentStyle: "",
    tags: "",
    recommendedYear: "",
    recommendedSemester: "",
  };

  const [form, setForm] = useState(emptyForm);

  const API_BASE = "http://localhost:8080/api/admin/courses";
  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const toNumberOrNull = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    return Number(value);
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_BASE, authConfig);
      setCourses(response.data || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseDetails = async (id) => {
    const response = await axios.get(`${API_BASE}/${id}`, authConfig);
    return response.data;
  };

  const viewCourse = async (course) => {
    try {
      const data = await fetchCourseDetails(course.id);
      setSelectedCourse(data);
      setModalMode("view");
    } catch (error) {
      console.error(error);
      alert("Failed to load course details");
    }
  };

  const openCreateModal = () => {
    setForm(emptyForm);
    setModalMode("create");
  };

  const openEditModal = async (course) => {
    try {
      const data = await fetchCourseDetails(course.id);

      setForm({
        id: data.id || "",
        courseCode: data.courseCode || "",
        courseName: data.courseName || "",
        description: data.description || "",
        difficulty: data.difficulty || "",
        creditHours: data.creditHours ?? "",
        semesterOffered: data.semesterOffered || "",
        category: data.category || "",
        hasLab: Boolean(data.hasLab),
        hasProject: Boolean(data.hasProject),
        hasGroupWork: Boolean(data.hasGroupWork),
        courseType: data.courseType || "",
        assessment: data.assessment || "",
        assessmentStyle: data.assessmentStyle || "",
        tags: data.tags || "",
        recommendedYear: data.recommendedYear ?? "",
        recommendedSemester: data.recommendedSemester ?? "",
      });

      setModalMode("edit");
    } catch (error) {
      console.error(error);
      alert("Failed to load course for editing");
    }
  };

  const buildCourseBody = () => {
    return {
      courseCode: form.courseCode,
      courseName: form.courseName,
      description: form.description,
      difficulty: form.difficulty,
      creditHours: toNumberOrNull(form.creditHours),
      semesterOffered: form.semesterOffered,
      category: form.category,
      hasLab: form.hasLab,
      hasProject: form.hasProject,
      hasGroupWork: form.hasGroupWork,
      courseType: form.courseType,
      assessment: form.assessment,
      assessmentStyle: form.assessmentStyle,
      tags: form.tags,
      recommendedYear: toNumberOrNull(form.recommendedYear),
      recommendedSemester: toNumberOrNull(form.recommendedSemester),

      // Your backend currently ignores these on create/update.
      // They are shown in details only.
      prerequisites: [],
      professors: [],
      resources: [],
    };
  };

  const createCourse = async (e) => {
    e.preventDefault();

    try {
      await axios.post(API_BASE, buildCourseBody(), authConfig);

      closeModal();
      fetchCourses();
    } catch (error) {
      console.error(error);
      alert("Failed to create course");
    }
  };

  const updateCourse = async (e) => {
    e.preventDefault();

    try {
      await axios.put(`${API_BASE}/${form.id}`, buildCourseBody(), authConfig);

      closeModal();
      fetchCourses();
    } catch (error) {
      console.error(error);
      alert("Failed to update course");
    }
  };

  const deleteCourse = async (course) => {
    const confirmed = window.confirm(
      `Delete course: ${course.courseCode || ""} ${course.courseName || ""}?`
    );

    if (!confirmed) return;

    try {
      await axios.delete(`${API_BASE}/${course.id}`, authConfig);
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
    } catch (error) {
      console.error(error);
      alert("Failed to delete course");
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedCourse(null);
    setForm(emptyForm);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const text = `${course.courseCode || ""} ${course.courseName || ""} ${
      course.category || ""
    } ${course.difficulty || ""} ${course.courseType || ""} ${
      course.tags || ""
    }`.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <>
      <button style={styles.createButton} onClick={openCreateModal}>
        <AdminIcon name="plus" size={16} color="#0d131a" />
        Create Course
      </button>

      <AdminSearchBox
        placeholder="Search courses..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <div style={styles.message}>Loading courses...</div>}

      {!loading && filteredCourses.length === 0 && (
        <div style={styles.message}>No courses found</div>
      )}

      <div style={styles.userList}>
        {filteredCourses.map((course) => (
          <div key={course.id} style={styles.courseRow}>
            <div style={styles.courseTextBlock}>
              <div style={styles.courseTitle}>
                {course.courseCode || "No Code"} -{" "}
                {course.courseName || "Unnamed Course"}
              </div>

              <div style={styles.courseMeta}>
                {course.creditHours ?? 0} hrs •{" "}
                {course.category || "No category"}
              </div>
            </div>

            <div style={styles.userActions}>
              <AdminIconAction name="eye" onClick={() => viewCourse(course)} />
              <AdminIconAction name="edit" onClick={() => openEditModal(course)} />
              <AdminIconAction name="trash" onClick={() => deleteCourse(course)} />
            </div>
          </div>
        ))}
      </div>

      {modalMode === "view" && selectedCourse && (
        <AdminModal title="Course Details" onClose={closeModal}>
          <div style={styles.detailList}>
            <AdminDetail label="ID" value={selectedCourse.id} />
            <AdminDetail label="Code" value={selectedCourse.courseCode} />
            <AdminDetail label="Name" value={selectedCourse.courseName} />
            <AdminDetail label="Difficulty" value={selectedCourse.difficulty} />
            <AdminDetail label="Credit Hours" value={selectedCourse.creditHours} />
            <AdminDetail
              label="Semester"
              value={selectedCourse.semesterOffered}
            />
            <AdminDetail label="Category" value={selectedCourse.category} />
            <AdminDetail label="Has Lab" value={String(selectedCourse.hasLab)} />
            <AdminDetail
              label="Has Project"
              value={String(selectedCourse.hasProject)}
            />
            <AdminDetail
              label="Has Group Work"
              value={String(selectedCourse.hasGroupWork)}
            />
            <AdminDetail label="Course Type" value={selectedCourse.courseType} />
            <AdminDetail label="Assessment" value={selectedCourse.assessment} />
            <AdminDetail
              label="Assessment Style"
              value={selectedCourse.assessmentStyle}
            />
            <AdminDetail label="Tags" value={selectedCourse.tags} />
            <AdminDetail
              label="Recommended Year"
              value={selectedCourse.recommendedYear}
            />
            <AdminDetail
              label="Recommended Semester"
              value={selectedCourse.recommendedSemester}
            />
            <AdminDetail
              label="Prerequisites"
              value={
                selectedCourse.prerequisites?.length
                  ? selectedCourse.prerequisites.join(", ")
                  : "None"
              }
            />
            <AdminDetail
              label="Professors"
              value={
                selectedCourse.professors?.length
                  ? selectedCourse.professors.join(", ")
                  : "None"
              }
            />
            <AdminDetail
              label="Resources"
              value={
                selectedCourse.resources?.length
                  ? selectedCourse.resources.join(", ")
                  : "None"
              }
            />
            <AdminDetail
              label="Description"
              value={selectedCourse.description}
            />
          </div>
        </AdminModal>
      )}

      {modalMode === "create" && (
        <AdminModal title="Create Course" onClose={closeModal}>
          <CourseForm
            form={form}
            setForm={setForm}
            onSubmit={createCourse}
            buttonText="Create"
          />
        </AdminModal>
      )}

      {modalMode === "edit" && (
        <AdminModal title="Update Course" onClose={closeModal}>
          <CourseForm
            form={form}
            setForm={setForm}
            onSubmit={updateCourse}
            buttonText="Update"
            editing
          />
        </AdminModal>
      )}
    </>
  );
}

function CourseForm({ form, setForm, onSubmit, buttonText, editing = false }) {
  return (
    <form onSubmit={onSubmit} style={styles.form}>
      {editing && <AdminInput label="ID" value={form.id} disabled />}

      <AdminInput
        label="Course Code"
        value={form.courseCode}
        onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
        required
      />

      <AdminInput
        label="Course Name"
        value={form.courseName}
        onChange={(e) => setForm({ ...form, courseName: e.target.value })}
        required
      />

      <AdminTextArea
        label="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />

      <AdminInput
        label="Difficulty"
        placeholder="Easy / Medium / Hard"
        value={form.difficulty}
        onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
      />

      <AdminInput
        label="Credit Hours"
        type="number"
        value={form.creditHours}
        onChange={(e) => setForm({ ...form, creditHours: e.target.value })}
      />

      <AdminInput
        label="Semester Offered"
        placeholder="Fall / Spring / Both"
        value={form.semesterOffered}
        onChange={(e) =>
          setForm({ ...form, semesterOffered: e.target.value })
        }
      />

      <AdminInput
        label="Category"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
      />

      <AdminInput
        label="Course Type"
        value={form.courseType}
        onChange={(e) => setForm({ ...form, courseType: e.target.value })}
      />

      <AdminInput
        label="Assessment"
        value={form.assessment}
        onChange={(e) => setForm({ ...form, assessment: e.target.value })}
      />

      <AdminInput
        label="Assessment Style"
        value={form.assessmentStyle}
        onChange={(e) =>
          setForm({ ...form, assessmentStyle: e.target.value })
        }
      />

      <AdminInput
        label="Tags"
        placeholder="Example: programming, backend"
        value={form.tags}
        onChange={(e) => setForm({ ...form, tags: e.target.value })}
      />

      <AdminInput
        label="Recommended Year"
        type="number"
        value={form.recommendedYear}
        onChange={(e) =>
          setForm({ ...form, recommendedYear: e.target.value })
        }
      />

      <AdminInput
        label="Recommended Semester"
        type="number"
        value={form.recommendedSemester}
        onChange={(e) =>
          setForm({ ...form, recommendedSemester: e.target.value })
        }
      />

      <AdminCheckbox
        label="Has Lab"
        checked={form.hasLab}
        onChange={(e) => setForm({ ...form, hasLab: e.target.checked })}
      />

      <AdminCheckbox
        label="Has Project"
        checked={form.hasProject}
        onChange={(e) => setForm({ ...form, hasProject: e.target.checked })}
      />

      <AdminCheckbox
        label="Has Group Work"
        checked={form.hasGroupWork}
        onChange={(e) =>
          setForm({ ...form, hasGroupWork: e.target.checked })
        }
      />

      <button type="submit" style={styles.submitButton}>
        {buttonText}
      </button>
    </form>
  );
}

export default AdminCourses;