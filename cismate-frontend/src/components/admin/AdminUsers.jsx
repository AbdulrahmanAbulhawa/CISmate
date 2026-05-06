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

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [loading, setLoading] = useState(false);

  const emptyCreateForm = {
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    major: "CIS",
    gpa: "",
    completedHours: "",
    studyYear: "",
    completedCourseIds: [],
  };

  const emptyEditForm = {
    email: "",
    firstName: "",
    lastName: "",
    major: "CIS",
    gpa: "",
    completedHours: "",
    studyYear: "",
    role: "USER",
    completedCourseIds: [],
  };

  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState(emptyEditForm);

  const API_BASE = "http://localhost:8080/api/admin";
  const COURSE_API = "http://localhost:8080/api/admin/courses";

  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const extractEmail = (userText) => {
    const parts = userText.split(" - ");
    return parts[parts.length - 1].trim();
  };

  const toNumberOrNull = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    return Number(value);
  };

  const normalizeCourseIds = (ids) => {
    if (!ids) return [];
    if (!Array.isArray(ids)) return [];

    return ids
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id));
  };

  const formatCourseName = (course) => {
    if (!course) return "";

    const code = course.courseCode ? `${course.courseCode} - ` : "";
    const name = course.courseName || "Unnamed Course";

    return `${code}${name}`;
  };

  const getCourseNameById = (id) => {
    const course = courses.find((c) => Number(c.id) === Number(id));

    if (!course) return `Course ID ${id}`;

    return formatCourseName(course);
  };

  const completedCoursesText = (ids) => {
    const normalizedIds = normalizeCourseIds(ids);

    if (normalizedIds.length === 0) return "None";

    return normalizedIds.map((id) => getCourseNameById(id)).join(", ");
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/getAllUsers`, authConfig);
      setUsers(response.data || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load users");
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
      alert("Failed to load courses for completed courses dropdown");
    }
  };

  const fetchUserDetails = async (email) => {
    const response = await axios.get(
      `${API_BASE}/getUser/${encodeURIComponent(email)}`,
      authConfig
    );

    return response.data;
  };

  const viewUser = async (userText) => {
    try {
      const email = extractEmail(userText);
      const data = await fetchUserDetails(email);

      setSelectedUser(data);
      setModalMode("view");
    } catch (error) {
      console.error(error);
      alert("Failed to load user details");
    }
  };

  const openCreateModal = () => {
    setCreateForm(emptyCreateForm);
    setModalMode("create");
  };

  const openEditModal = async (userText) => {
    try {
      const email = extractEmail(userText);
      const data = await fetchUserDetails(email);

      setEditForm({
        email: data.email || "",
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        major: data.major || "CIS",
        gpa: data.gpa ?? "",
        completedHours: data.completedHours ?? "",
        studyYear: data.studyYear ?? "",
        role: data.role || "USER",
        completedCourseIds: normalizeCourseIds(data.completedCourseIds),
      });

      setModalMode("edit");
    } catch (error) {
      console.error(error);
      alert("Failed to load user for editing");
    }
  };

  const createUser = async (e) => {
    e.preventDefault();

    try {
      const body = {
        email: createForm.email,
        password: createForm.password,
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        major: createForm.major || null,
        gpa: toNumberOrNull(createForm.gpa),
        completedHours: toNumberOrNull(createForm.completedHours),
        studyYear: toNumberOrNull(createForm.studyYear),
        completedCourseIds: normalizeCourseIds(createForm.completedCourseIds),
      };

      await axios.post(`${API_BASE}/users`, body, authConfig);

      closeModal();
      fetchUsers();
    } catch (error) {
      console.error(error);
      alert("Failed to create user");
    }
  };

  const updateUser = async (e) => {
    e.preventDefault();

    try {
      const body = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        major: editForm.major,
        gpa: toNumberOrNull(editForm.gpa),
        completedHours: toNumberOrNull(editForm.completedHours),
        studyYear: toNumberOrNull(editForm.studyYear),
        role: editForm.role,
        completedCourseIds: normalizeCourseIds(editForm.completedCourseIds),
      };

      await axios.put(
        `${API_BASE}/${encodeURIComponent(editForm.email)}`,
        body,
        authConfig
      );

      closeModal();
      fetchUsers();
    } catch (error) {
      console.error(error);
      alert("Failed to update user");
    }
  };

  const deleteUser = async (userText) => {
    const email = extractEmail(userText);
    const confirmed = window.confirm(`Delete user: ${email}?`);
    if (!confirmed) return;

    try {
      await axios.delete(`${API_BASE}/${encodeURIComponent(email)}`, authConfig);
      setUsers((prev) => prev.filter((u) => extractEmail(u) !== email));
    } catch (error) {
      console.error(error);
      alert("Failed to delete user");
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedUser(null);
    setCreateForm(emptyCreateForm);
    setEditForm(emptyEditForm);
  };

  useEffect(() => {
    fetchUsers();
    fetchCourses();
  }, []);

  const filteredUsers = users.filter((user) =>
    String(user).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <button style={styles.createButton} onClick={openCreateModal}>
        <AdminIcon name="plus" size={16} color="#0d131a" />
        Create User
      </button>

      <AdminSearchBox
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <div style={styles.message}>Loading users...</div>}

      {!loading && filteredUsers.length === 0 && (
        <div style={styles.message}>No users found</div>
      )}

      <div style={styles.userList}>
        {filteredUsers.map((user, index) => (
          <div key={index} style={styles.userRow}>
            <div style={styles.userText}>{user}</div>

            <div style={styles.userActions}>
              <AdminIconAction name="eye" onClick={() => viewUser(user)} />
              <AdminIconAction name="edit" onClick={() => openEditModal(user)} />
              <AdminIconAction name="trash" onClick={() => deleteUser(user)} />
            </div>
          </div>
        ))}
      </div>

      {modalMode === "view" && selectedUser && (
        <AdminModal title="User Details" onClose={closeModal}>
          <div style={styles.detailList}>
            <AdminDetail label="Email" value={selectedUser.email} />
            <AdminDetail
              label="Name"
              value={`${selectedUser.firstName} ${selectedUser.lastName}`}
            />
            <AdminDetail label="Major" value={selectedUser.major} />
            <AdminDetail label="GPA" value={selectedUser.gpa} />
            <AdminDetail
              label="Completed Hours"
              value={selectedUser.completedHours}
            />
            <AdminDetail label="Study Year" value={selectedUser.studyYear} />
            <AdminDetail label="Role" value={selectedUser.role} />
            <AdminDetail
              label="Completed Courses"
              value={completedCoursesText(selectedUser.completedCourseIds)}
            />
          </div>
        </AdminModal>
      )}

      {modalMode === "create" && (
        <AdminModal title="Create User" onClose={closeModal}>
          <form onSubmit={createUser} style={styles.form}>
            <AdminInput
              label="Email"
              value={createForm.email}
              onChange={(e) =>
                setCreateForm({ ...createForm, email: e.target.value })
              }
              required
            />

            <AdminInput
              label="Password"
              type="password"
              value={createForm.password}
              onChange={(e) =>
                setCreateForm({ ...createForm, password: e.target.value })
              }
              required
            />

            <AdminInput
              label="First Name"
              value={createForm.firstName}
              onChange={(e) =>
                setCreateForm({ ...createForm, firstName: e.target.value })
              }
              required
            />

            <AdminInput
              label="Last Name"
              value={createForm.lastName}
              onChange={(e) =>
                setCreateForm({ ...createForm, lastName: e.target.value })
              }
              required
            />

            <AdminInput
              label="Major"
              value={createForm.major}
              onChange={(e) =>
                setCreateForm({ ...createForm, major: e.target.value })
              }
            />

            <AdminInput
              label="GPA"
              type="number"
              step="0.001"
              value={createForm.gpa}
              onChange={(e) =>
                setCreateForm({ ...createForm, gpa: e.target.value })
              }
            />

            <AdminInput
              label="Completed Hours"
              type="number"
              value={createForm.completedHours}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  completedHours: e.target.value,
                })
              }
            />

            <AdminInput
              label="Study Year"
              type="number"
              value={createForm.studyYear}
              onChange={(e) =>
                setCreateForm({ ...createForm, studyYear: e.target.value })
              }
            />

            <CompletedCoursesDropdown
              label="Completed Courses"
              courses={courses}
              selectedIds={createForm.completedCourseIds}
              onChange={(ids) =>
                setCreateForm({
                  ...createForm,
                  completedCourseIds: ids,
                })
              }
              formatCourseName={formatCourseName}
            />

            <button type="submit" style={styles.submitButton}>
              Create
            </button>
          </form>
        </AdminModal>
      )}

      {modalMode === "edit" && (
        <AdminModal title="Update User" onClose={closeModal}>
          <form onSubmit={updateUser} style={styles.form}>
            <AdminInput label="Email" value={editForm.email} disabled />

            <AdminInput
              label="First Name"
              value={editForm.firstName}
              onChange={(e) =>
                setEditForm({ ...editForm, firstName: e.target.value })
              }
            />

            <AdminInput
              label="Last Name"
              value={editForm.lastName}
              onChange={(e) =>
                setEditForm({ ...editForm, lastName: e.target.value })
              }
            />

            <AdminInput
              label="Major"
              value={editForm.major}
              onChange={(e) =>
                setEditForm({ ...editForm, major: e.target.value })
              }
            />

            <AdminInput
              label="GPA"
              type="number"
              step="0.001"
              value={editForm.gpa}
              onChange={(e) =>
                setEditForm({ ...editForm, gpa: e.target.value })
              }
            />

            <AdminInput
              label="Completed Hours"
              type="number"
              value={editForm.completedHours}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  completedHours: e.target.value,
                })
              }
            />

            <AdminInput
              label="Study Year"
              type="number"
              value={editForm.studyYear}
              onChange={(e) =>
                setEditForm({ ...editForm, studyYear: e.target.value })
              }
            />

            <label style={styles.label}>
              Role
              <select
                value={editForm.role}
                onChange={(e) =>
                  setEditForm({ ...editForm, role: e.target.value })
                }
                style={styles.input}
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>

            <CompletedCoursesDropdown
              label="Completed Courses"
              courses={courses}
              selectedIds={editForm.completedCourseIds}
              onChange={(ids) =>
                setEditForm({
                  ...editForm,
                  completedCourseIds: ids,
                })
              }
              formatCourseName={formatCourseName}
            />

            <button type="submit" style={styles.submitButton}>
              Update
            </button>
          </form>
        </AdminModal>
      )}
    </>
  );
}

function CompletedCoursesDropdown({
  label,
  courses,
  selectedIds,
  onChange,
  formatCourseName,
}) {
  const [open, setOpen] = useState(false);

  const normalizedSelectedIds = Array.isArray(selectedIds)
    ? selectedIds.map((id) => Number(id))
    : [];

  const selectedSet = new Set(normalizedSelectedIds);

  const selectedCourses = courses.filter((course) =>
    selectedSet.has(Number(course.id))
  );

  const buttonText =
    selectedCourses.length === 0
      ? "Select completed courses"
      : `${selectedCourses.length} course(s) selected`;

  const toggleCourse = (courseId) => {
    const id = Number(courseId);
    const nextSet = new Set(normalizedSelectedIds);

    if (nextSet.has(id)) {
      nextSet.delete(id);
    } else {
      nextSet.add(id);
    }

    onChange(Array.from(nextSet));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <label style={styles.label}>
      {label}

      <div style={dropdownStyles.wrapper}>
        <button
          type="button"
          style={dropdownStyles.button}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span>{buttonText}</span>
          <span>{open ? "▲" : "▼"}</span>
        </button>

        {open && (
          <div style={dropdownStyles.menu}>
            {courses.length === 0 && (
              <div style={dropdownStyles.empty}>No courses found</div>
            )}

            {courses.length > 0 && (
              <button
                type="button"
                style={dropdownStyles.clearButton}
                onClick={clearAll}
              >
                Clear all
              </button>
            )}

            {courses.map((course) => {
              const courseId = Number(course.id);
              const checked = selectedSet.has(courseId);

              return (
                <label key={course.id} style={dropdownStyles.option}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCourse(courseId)}
                    style={dropdownStyles.checkbox}
                  />

                  <span>{formatCourseName(course)}</span>
                </label>
              );
            })}
          </div>
        )}

        {selectedCourses.length > 0 && (
          <div style={dropdownStyles.selectedText}>
            {selectedCourses.map((course) => formatCourseName(course)).join(", ")}
          </div>
        )}
      </div>
    </label>
  );
}

const dropdownStyles = {
  wrapper: {
    position: "relative",
  },

  button: {
    width: "100%",
    minHeight: "38px",
    borderRadius: "10px",
    border: "1px solid #2a333d",
    background: "#0d131a",
    color: "#edf1f4",
    padding: "0 10px",
    outline: "none",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },

  menu: {
    position: "absolute",
    top: "44px",
    left: 0,
    right: 0,
    maxHeight: "230px",
    overflowY: "auto",
    background: "#0d131a",
    border: "1px solid #2a333d",
    borderRadius: "10px",
    padding: "8px",
    zIndex: 20,
    boxShadow: "0 12px 28px rgba(0,0,0,0.4)",
  },

  option: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#edf1f4",
    fontSize: "13px",
    padding: "8px 4px",
    cursor: "pointer",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },

  checkbox: {
    width: "15px",
    height: "15px",
  },

  clearButton: {
    width: "100%",
    height: "30px",
    border: "none",
    borderRadius: "8px",
    background: "#202831",
    color: "#bfc9d2",
    cursor: "pointer",
    marginBottom: "6px",
  },

  empty: {
    color: "#9aa6b2",
    fontSize: "13px",
    padding: "8px 4px",
  },

  selectedText: {
    color: "#9aa6b2",
    fontSize: "12px",
    marginTop: "6px",
    lineHeight: "1.4",
  },
};

export default AdminUsers;