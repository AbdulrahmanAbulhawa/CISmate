import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const SEMESTERS = ["FALL", "SPRING", "SUMMER"];
const YEARS = [1, 2, 3, 4];
const PATTERNS = ["SUN_TUE_THU", "MON_WED"];

function AdminSchedule() {
  const [activeSubTab, setActiveSubTab] = useState("offerings");

  return (
    <div style={localStyles.wrapper}>
      <div style={localStyles.subTabs}>
        <button
          type="button"
          style={{
            ...localStyles.subTabButton,
            ...(activeSubTab === "offerings" ? localStyles.activeSubTab : {}),
          }}
          onClick={() => setActiveSubTab("offerings")}
        >
          Offerings
        </button>

        <button
          type="button"
          style={{
            ...localStyles.subTabButton,
            ...(activeSubTab === "templates" ? localStyles.activeSubTab : {}),
          }}
          onClick={() => setActiveSubTab("templates")}
        >
          Templates
        </button>
      </div>

      {activeSubTab === "offerings" && <AdminScheduleOfferings />}
      {activeSubTab === "templates" && <AdminScheduleTemplates />}
    </div>
  );
}

function AdminScheduleOfferings() {
  const headers = useAuthHeaders();

  const [courses, setCourses] = useState([]);
  const [offerings, setOfferings] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [showList, setShowList] = useState(false);

  const [semesterFilter, setSemesterFilter] = useState("ALL");

  const [form, setForm] = useState({
    id: null,
    semester: "FALL",
    courseId: "",
    sectionCode: "",
    pattern: "SUN_TUE_THU",
    startTime: "",
    endTime: "",
  });

  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingOfferings, setLoadingOfferings] = useState(false);
  const [savingOffering, setSavingOffering] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/admin/courses`, {
        headers,
      });

      if (!response.ok) {
        setError("Could not load courses.");
        return;
      }

      const data = await response.json();

      const normalized = Array.isArray(data)
        ? data
            .map((course) => ({
              id: Number(course.id ?? course.courseId),
              courseCode: course.courseCode ?? course.code ?? "",
              courseName: course.courseName ?? course.name ?? "",
            }))
            .filter((course) => course.id)
        : [];

      setCourses(normalized);
    } catch {
      setError("Could not connect while loading courses.");
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadOfferingsBySemester = async (semester) => {
    const response = await fetch(
      `${API_BASE_URL}/api/schedule/admin/offerings?semester=${semester}`,
      {
        headers,
      }
    );

    if (!response.ok) return [];

    const data = await response.json();

    return Array.isArray(data) ? data : [];
  };

  const loadAllOfferings = async () => {
    try {
      setLoadingOfferings(true);
      setError("");
      setMessage("");

      const semestersToLoad =
        semesterFilter === "ALL" ? SEMESTERS : [semesterFilter];

      const results = await Promise.all(
        semestersToLoad.map((semester) => loadOfferingsBySemester(semester))
      );

      const merged = results.flat();

      setOfferings(merged);
      setShowList(true);
    } catch {
      setOfferings([]);
      setError("Could not connect while loading offerings.");
    } finally {
      setLoadingOfferings(false);
    }
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      id: null,
      semester: "FALL",
      courseId: "",
      sectionCode: "",
      pattern: "SUN_TUE_THU",
      startTime: "",
      endTime: "",
    });
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
    setMessage("");
    setError("");
  };

  const closeForm = () => {
    resetForm();
    setShowForm(false);
  };

  const validateOfferingForm = () => {
    if (!form.semester) return "Semester is required.";
    if (!form.courseId) return "Course is required.";
    if (!form.sectionCode.trim()) return "Section code is required.";
    if (!form.pattern) return "Pattern is required.";
    if (!form.startTime) return "Start time is required.";
    if (!form.endTime) return "End time is required.";
    if (form.startTime >= form.endTime) {
      return "Start time must be before end time.";
    }

    return "";
  };

  const saveOffering = async (event) => {
    event.preventDefault();

    const validationError = validateOfferingForm();

    if (validationError) {
      setError(validationError);
      setMessage("");
      return;
    }

    try {
      setSavingOffering(true);
      setError("");
      setMessage("");

      const payload = {
        semester: form.semester,
        courseId: Number(form.courseId),
        sectionCode: form.sectionCode.trim(),
        pattern: form.pattern,
        startTime: form.startTime,
        endTime: form.endTime,
      };

      const isEdit = Boolean(form.id);

      const response = await fetch(
        isEdit
          ? `${API_BASE_URL}/api/schedule/admin/offerings/${form.id}`
          : `${API_BASE_URL}/api/schedule/admin/offerings`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.message || "Could not save offering.");
        return;
      }

      setMessage(isEdit ? "Offering updated." : "Offering created.");
      resetForm();
      setShowForm(false);

      if (showList) {
        await loadAllOfferings();
      }
    } catch {
      setError("Could not connect while saving offering.");
    } finally {
      setSavingOffering(false);
    }
  };

  const editOffering = (offering) => {
    setForm({
      id: offering.id,
      semester: offering.semester || "FALL",
      courseId: Number(offering.courseId || ""),
      sectionCode: offering.sectionCode || "",
      pattern: offering.pattern || "SUN_TUE_THU",
      startTime: offering.startTime || "",
      endTime: offering.endTime || "",
    });

    setShowForm(true);
    setMessage("");
    setError("");
  };

  const deleteOffering = async (id) => {
    const confirmed = window.confirm("Delete this offering?");

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_BASE_URL}/api/schedule/admin/offerings/${id}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        setError("Could not delete offering.");
        return;
      }

      setMessage("Offering deleted.");
      await loadAllOfferings();
    } catch {
      setError("Could not connect while deleting offering.");
    }
  };

  return (
    <div style={localStyles.section}>
      <div style={localStyles.sectionHeader}>
        <div>
          <h2 style={localStyles.title}>Schedule Offerings</h2>
          <p style={localStyles.text}>
            Manage actual course sections used by the generator.
          </p>
        </div>
      </div>

      <div style={localStyles.toolbar}>
        <button
          type="button"
          style={localStyles.primaryButton}
          onClick={openCreateForm}
        >
          Create Offering
        </button>

        <button
          type="button"
          style={localStyles.secondaryButton}
          onClick={loadAllOfferings}
        >
          Show All Offerings
        </button>

        <label style={localStyles.compactLabel}>
          Semester
          <select
            style={localStyles.compactInput}
            value={semesterFilter}
            onChange={(event) => setSemesterFilter(event.target.value)}
          >
            <option value="ALL">All</option>
            {SEMESTERS.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </select>
        </label>
      </div>

      <StatusMessage message={message} error={error} />

      {showForm && (
        <form style={localStyles.card} onSubmit={saveOffering}>
          <div style={localStyles.formHeader}>
            <h3 style={localStyles.cardTitle}>
              {form.id ? "Edit Offering" : "Create Offering"}
            </h3>

            <button
              type="button"
              style={localStyles.closeButton}
              onClick={closeForm}
            >
              Close
            </button>
          </div>

          <div style={localStyles.grid}>
            <label style={localStyles.label}>
              Semester
              <select
                style={localStyles.input}
                value={form.semester}
                onChange={(event) => updateForm("semester", event.target.value)}
              >
                {SEMESTERS.map((semester) => (
                  <option key={semester} value={semester}>
                    {semester}
                  </option>
                ))}
              </select>
            </label>

            <label style={localStyles.label}>
              Course
              <select
                style={localStyles.input}
                value={form.courseId}
                onChange={(event) => updateForm("courseId", event.target.value)}
                disabled={loadingCourses}
              >
                <option value="">
                  {loadingCourses ? "Loading courses..." : "Select course"}
                </option>

                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {formatCourse(course)}
                  </option>
                ))}
              </select>
            </label>

            <label style={localStyles.label}>
              Section Code
              <input
                style={localStyles.input}
                value={form.sectionCode}
                onChange={(event) =>
                  updateForm("sectionCode", event.target.value)
                }
                placeholder="Example: 1"
              />
            </label>

            <label style={localStyles.label}>
              Pattern
              <select
                style={localStyles.input}
                value={form.pattern}
                onChange={(event) => updateForm("pattern", event.target.value)}
              >
                {PATTERNS.map((pattern) => (
                  <option key={pattern} value={pattern}>
                    {formatPattern(pattern)}
                  </option>
                ))}
              </select>
            </label>

            <label style={localStyles.label}>
              Start Time
              <input
                style={localStyles.input}
                type="time"
                value={form.startTime}
                onChange={(event) =>
                  updateForm("startTime", event.target.value)
                }
              />
            </label>

            <label style={localStyles.label}>
              End Time
              <input
                style={localStyles.input}
                type="time"
                value={form.endTime}
                onChange={(event) => updateForm("endTime", event.target.value)}
              />
            </label>
          </div>

          <div style={localStyles.actionsRow}>
            <button
              type="submit"
              style={localStyles.primaryButton}
              disabled={savingOffering}
            >
              {savingOffering
                ? "Saving..."
                : form.id
                ? "Update Offering"
                : "Create Offering"}
            </button>

            <button
              type="button"
              style={localStyles.secondaryButton}
              onClick={closeForm}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {showList && (
        <div style={localStyles.card}>
          <div style={localStyles.formHeader}>
            <h3 style={localStyles.cardTitle}>Offerings</h3>

            <button
              type="button"
              style={localStyles.smallButton}
              onClick={loadAllOfferings}
            >
              Refresh
            </button>
          </div>

          {loadingOfferings ? (
            <div style={localStyles.empty}>Loading offerings...</div>
          ) : offerings.length === 0 ? (
            <div style={localStyles.empty}>No offerings found.</div>
          ) : (
            <div style={localStyles.tableWrap}>
              <table style={localStyles.table}>
                <thead>
                  <tr>
                    <th style={localStyles.th}>Semester</th>
                    <th style={localStyles.th}>Course</th>
                    <th style={localStyles.th}>Section</th>
                    <th style={localStyles.th}>Pattern</th>
                    <th style={localStyles.th}>Time</th>
                    <th style={localStyles.th}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {offerings.map((offering) => (
                    <tr key={offering.id}>
                      <td style={localStyles.td}>{offering.semester}</td>

                      <td style={localStyles.td}>
                        <strong>
                          {offering.courseCode || "Course"}{" "}
                          {offering.courseName
                            ? `- ${offering.courseName}`
                            : ""}
                        </strong>
                      </td>

                      <td style={localStyles.td}>
                        {offering.sectionCode || "-"}
                      </td>

                      <td style={localStyles.td}>
                        {formatPattern(offering.pattern)}
                      </td>

                      <td style={localStyles.td}>
                        {offering.startTime || "--:--"} -{" "}
                        {offering.endTime || "--:--"}
                      </td>

                      <td style={localStyles.td}>
                        <div style={localStyles.itemActions}>
                          <button
                            type="button"
                            style={localStyles.smallButton}
                            onClick={() => editOffering(offering)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            style={localStyles.dangerButton}
                            onClick={() => deleteOffering(offering.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminScheduleTemplates() {
  const headers = useAuthHeaders();

  const [courses, setCourses] = useState([]);
  const [templateSlots, setTemplateSlots] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [showList, setShowList] = useState(false);

  const [semesterFilter, setSemesterFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");

  const [semester, setSemester] = useState("FALL");
  const [yearLevel, setYearLevel] = useState(1);
  const [title, setTitle] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [courseToAdd, setCourseToAdd] = useState("");

  const [template, setTemplate] = useState(null);

  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/admin/courses`, {
        headers,
      });

      if (!response.ok) {
        setError("Could not load courses.");
        return;
      }

      const data = await response.json();

      const normalized = Array.isArray(data)
        ? data
            .map((course) => ({
              id: Number(course.id ?? course.courseId),
              courseCode: course.courseCode ?? course.code ?? "",
              courseName: course.courseName ?? course.name ?? "",
            }))
            .filter((course) => course.id)
        : [];

      setCourses(normalized);
    } catch {
      setError("Could not connect while loading courses.");
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchTemplateSlot = async (semesterValue, yearValue) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/schedule/admin/templates?semester=${semesterValue}&yearLevel=${yearValue}`,
        {
          headers,
        }
      );

      if (!response.ok) {
        return {
          semester: semesterValue,
          yearLevel: yearValue,
          exists: false,
          template: null,
        };
      }

      const data = await response.json();

      return {
        semester: semesterValue,
        yearLevel: yearValue,
        exists: true,
        template: data,
      };
    } catch {
      return {
        semester: semesterValue,
        yearLevel: yearValue,
        exists: false,
        template: null,
      };
    }
  };

  const loadAllTemplateSlots = async () => {
    try {
      setLoadingTemplates(true);
      setError("");
      setMessage("");

      const yearsToLoad = yearFilter === "ALL" ? YEARS : [Number(yearFilter)];
      const semestersToLoad =
        semesterFilter === "ALL" ? SEMESTERS : [semesterFilter];

      const requests = [];

      for (const year of yearsToLoad) {
        for (const sem of semestersToLoad) {
          requests.push(fetchTemplateSlot(sem, year));
        }
      }

      const results = await Promise.all(requests);

      results.sort((a, b) => {
        if (a.yearLevel !== b.yearLevel) {
          return a.yearLevel - b.yearLevel;
        }

        return SEMESTERS.indexOf(a.semester) - SEMESTERS.indexOf(b.semester);
      });

      setTemplateSlots(results);
      setShowList(true);
    } catch {
      setTemplateSlots([]);
      setError("Could not load templates.");
    } finally {
      setLoadingTemplates(false);
    }
  };

  const resetTemplateForm = () => {
    setSemester("FALL");
    setYearLevel(1);
    setTitle("");
    setSelectedCourseIds([]);
    setCourseToAdd("");
    setTemplate(null);
  };

  const openCreateTemplateForm = () => {
    resetTemplateForm();
    setTitle("Year 1 Fall Recommended Plan");
    setShowForm(true);
    setMessage("");
    setError("");
  };

  const closeTemplateForm = () => {
    resetTemplateForm();
    setShowForm(false);
  };

  const applyTemplateSlotToForm = (slot) => {
    setSemester(slot.semester);
    setYearLevel(Number(slot.yearLevel));
    setCourseToAdd("");
    setMessage("");
    setError("");

    if (slot.exists && slot.template) {
      const data = slot.template;

      setTemplate(data);
      setTitle(data.title || "");

      const ids = Array.isArray(data.courses)
        ? [...data.courses]
            .sort((a, b) => (a.position || 0) - (b.position || 0))
            .map((course) => Number(course.courseId))
        : [];

      setSelectedCourseIds(ids);
    } else {
      setTemplate(null);
      setTitle(
        `Year ${slot.yearLevel} ${formatDay(slot.semester)} Recommended Plan`
      );
      setSelectedCourseIds([]);
    }

    setShowForm(true);
  };

  const createEmptySlotFromDropdowns = () => {
    const slot = {
      semester,
      yearLevel,
      exists: false,
      template: null,
    };

    applyTemplateSlotToForm(slot);
  };

  const addCourseToTemplate = () => {
    const id = Number(courseToAdd);

    if (!id) return;

    setSelectedCourseIds((prev) => {
      const normalized = prev.map(Number);

      if (normalized.includes(id)) return normalized;

      return [...normalized, id];
    });

    setCourseToAdd("");
  };

  const removeCourseFromTemplate = (courseId) => {
    const id = Number(courseId);

    setSelectedCourseIds((prev) => prev.map(Number).filter((item) => item !== id));
  };

  const moveCourse = (courseId, direction) => {
    const id = Number(courseId);

    setSelectedCourseIds((prev) => {
      const normalized = prev.map(Number);
      const index = normalized.indexOf(id);

      if (index === -1) return normalized;

      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= normalized.length) {
        return normalized;
      }

      const copy = [...normalized];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;

      return copy;
    });
  };

  const validateTemplateForm = () => {
    if (!semester) return "Semester is required.";
    if (!yearLevel) return "Year level is required.";
    if (!title.trim()) return "Template title is required.";
    if (selectedCourseIds.length === 0) return "Add at least one course.";

    return "";
  };

  const saveTemplate = async () => {
    const validationError = validateTemplateForm();

    if (validationError) {
      setError(validationError);
      setMessage("");
      return;
    }

    try {
      setSavingTemplate(true);
      setError("");
      setMessage("");

      const payload = {
        semester,
        yearLevel: Number(yearLevel),
        title: title.trim(),
        courseIds: selectedCourseIds.map(Number),
      };

      const response = await fetch(
        `${API_BASE_URL}/api/schedule/admin/templates`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.message || "Could not save template.");
        return;
      }

      setTemplate(data);
      setMessage(template ? "Template updated." : "Template created.");

      if (showList) {
        await loadAllTemplateSlots();
      }
    } catch {
      setError("Could not connect while saving template.");
    } finally {
      setSavingTemplate(false);
    }
  };

  const deleteTemplate = async () => {
    const confirmed = window.confirm("Delete this template?");

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_BASE_URL}/api/schedule/admin/templates?semester=${semester}&yearLevel=${yearLevel}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        setError("Could not delete template.");
        return;
      }

      setMessage("Template deleted.");
      closeTemplateForm();

      if (showList) {
        await loadAllTemplateSlots();
      }
    } catch {
      setError("Could not connect while deleting template.");
    }
  };

  const selectedCourses = selectedCourseIds
    .map((id) => courses.find((course) => Number(course.id) === Number(id)))
    .filter(Boolean);

  const availableCourses = courses.filter(
    (course) => !selectedCourseIds.map(Number).includes(Number(course.id))
  );

  return (
    <div style={localStyles.section}>
      <div style={localStyles.sectionHeader}>
        <div>
          <h2 style={localStyles.title}>Schedule Templates</h2>
          <p style={localStyles.text}>
            Manage recommended study-plan templates.
          </p>
        </div>
      </div>

      <div style={localStyles.toolbar}>
        <button
          type="button"
          style={localStyles.primaryButton}
          onClick={openCreateTemplateForm}
        >
          Create Template
        </button>

        <button
          type="button"
          style={localStyles.secondaryButton}
          onClick={loadAllTemplateSlots}
        >
          Show All Templates
        </button>

        <label style={localStyles.compactLabel}>
          Year
          <select
            style={localStyles.compactInput}
            value={yearFilter}
            onChange={(event) => setYearFilter(event.target.value)}
          >
            <option value="ALL">All</option>
            {YEARS.map((year) => (
              <option key={year} value={year}>
                Year {year}
              </option>
            ))}
          </select>
        </label>

        <label style={localStyles.compactLabel}>
          Semester
          <select
            style={localStyles.compactInput}
            value={semesterFilter}
            onChange={(event) => setSemesterFilter(event.target.value)}
          >
            <option value="ALL">All</option>
            {SEMESTERS.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </select>
        </label>
      </div>

      <StatusMessage message={message} error={error} />

      {showForm && (
        <div style={localStyles.card}>
          <div style={localStyles.formHeader}>
            <h3 style={localStyles.cardTitle}>
              {template ? "Edit Template" : "Create Template"}
            </h3>

            <button
              type="button"
              style={localStyles.closeButton}
              onClick={closeTemplateForm}
            >
              Close
            </button>
          </div>

          <div style={localStyles.grid}>
            <label style={localStyles.label}>
              Year Level
              <select
                style={localStyles.input}
                value={yearLevel}
                onChange={(event) => {
                  const newYear = Number(event.target.value);
                  setYearLevel(newYear);
                  setTitle(
                    `Year ${newYear} ${formatDay(semester)} Recommended Plan`
                  );
                }}
              >
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    Year {year}
                  </option>
                ))}
              </select>
            </label>

            <label style={localStyles.label}>
              Semester
              <select
                style={localStyles.input}
                value={semester}
                onChange={(event) => {
                  const newSemester = event.target.value;
                  setSemester(newSemester);
                  setTitle(
                    `Year ${yearLevel} ${formatDay(newSemester)} Recommended Plan`
                  );
                }}
              >
                {SEMESTERS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label style={localStyles.label}>
              Title
              <input
                style={localStyles.input}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Template title"
              />
            </label>
          </div>

          {!template && (
            <div style={localStyles.actionsRow}>
              <button
                type="button"
                style={localStyles.smallButton}
                onClick={createEmptySlotFromDropdowns}
              >
                Reset Form From Dropdowns
              </button>
            </div>
          )}

          <div style={localStyles.divider} />

          <div style={localStyles.inlinePicker}>
            <label style={localStyles.label}>
              Add Course
              <select
                style={localStyles.input}
                value={courseToAdd}
                onChange={(event) => setCourseToAdd(event.target.value)}
                disabled={loadingCourses}
              >
                <option value="">
                  {loadingCourses ? "Loading courses..." : "Select course"}
                </option>

                {availableCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {formatCourse(course)}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              style={localStyles.primaryButton}
              onClick={addCourseToTemplate}
            >
              Add
            </button>
          </div>

          <div style={localStyles.selectedBox}>
            <h4 style={localStyles.smallTitle}>Selected Order</h4>

            {selectedCourses.length === 0 ? (
              <div style={localStyles.empty}>No courses selected.</div>
            ) : (
              selectedCourses.map((course, index) => (
                <div key={course.id} style={localStyles.orderItem}>
                  <div>
                    <strong>{index + 1}. </strong>
                    {formatCourse(course)}
                  </div>

                  <div style={localStyles.itemActions}>
                    <button
                      type="button"
                      style={localStyles.smallButton}
                      onClick={() => moveCourse(course.id, "up")}
                      disabled={index === 0}
                    >
                      Up
                    </button>

                    <button
                      type="button"
                      style={localStyles.smallButton}
                      onClick={() => moveCourse(course.id, "down")}
                      disabled={index === selectedCourses.length - 1}
                    >
                      Down
                    </button>

                    <button
                      type="button"
                      style={localStyles.dangerButton}
                      onClick={() => removeCourseFromTemplate(course.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={localStyles.actionsRow}>
            <button
              type="button"
              style={localStyles.primaryButton}
              onClick={saveTemplate}
              disabled={savingTemplate}
            >
              {savingTemplate
                ? "Saving..."
                : template
                ? "Update Template"
                : "Create Template"}
            </button>

            {template && (
              <button
                type="button"
                style={localStyles.dangerButton}
                onClick={deleteTemplate}
              >
                Delete Template
              </button>
            )}

            <button
              type="button"
              style={localStyles.secondaryButton}
              onClick={closeTemplateForm}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showList && (
        <div style={localStyles.card}>
          <div style={localStyles.formHeader}>
            <h3 style={localStyles.cardTitle}>Templates</h3>

            <button
              type="button"
              style={localStyles.smallButton}
              onClick={loadAllTemplateSlots}
            >
              Refresh
            </button>
          </div>

          {loadingTemplates ? (
            <div style={localStyles.empty}>Loading templates...</div>
          ) : templateSlots.length === 0 ? (
            <div style={localStyles.empty}>No templates found.</div>
          ) : (
            <div style={localStyles.tableWrap}>
              <table style={localStyles.table}>
                <thead>
                  <tr>
                    <th style={localStyles.th}>Year</th>
                    <th style={localStyles.th}>Semester</th>
                    <th style={localStyles.th}>Status</th>
                    <th style={localStyles.th}>Title</th>
                    <th style={localStyles.th}>Courses</th>
                    <th style={localStyles.th}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {templateSlots.map((slot) => (
                    <tr key={`${slot.yearLevel}-${slot.semester}`}>
                      <td style={localStyles.td}>Year {slot.yearLevel}</td>

                      <td style={localStyles.td}>{slot.semester}</td>

                      <td style={localStyles.td}>
                        <span
                          style={{
                            ...localStyles.badge,
                            ...(slot.exists
                              ? localStyles.successBadge
                              : localStyles.dangerBadge),
                          }}
                        >
                          {slot.exists ? "Created" : "Missing"}
                        </span>
                      </td>

                      <td style={localStyles.td}>
                        {slot.template?.title || "-"}
                      </td>

                      <td style={localStyles.td}>
                        {Array.isArray(slot.template?.courses)
                          ? slot.template.courses.length
                          : 0}
                      </td>

                      <td style={localStyles.td}>
                        <button
                          type="button"
                          style={
                            slot.exists
                              ? localStyles.smallButton
                              : localStyles.primaryButtonSmall
                          }
                          onClick={() => applyTemplateSlotToForm(slot)}
                        >
                          {slot.exists ? "Edit" : "Create"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function useAuthHeaders() {
  return useMemo(() => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("accessToken");

    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);
}

function StatusMessage({ message, error }) {
  if (!message && !error) return null;

  return (
    <div
      style={{
        ...localStyles.statusBox,
        ...(error ? localStyles.errorBox : localStyles.successBox),
      }}
    >
      {error || message}
    </div>
  );
}

function formatCourse(course) {
  const code = course.courseCode || "";
  const name = course.courseName || "";

  if (code && name) return `${code} - ${name}`;
  if (name) return name;
  if (code) return code;

  return `Course ${course.id}`;
}

function formatPattern(pattern) {
  if (pattern === "SUN_TUE_THU") return "Sun / Tue / Thu";
  if (pattern === "MON_WED") return "Mon / Wed";

  return pattern || "-";
}

function formatDay(value = "") {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const localStyles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  subTabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },

  subTabButton: {
    background: "#111820",
    color: "#c5ccd2",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "12px",
    cursor: "pointer",
    fontWeight: "800",
  },

  activeSubTab: {
    color: "#57d0b7",
    borderColor: "rgba(87,208,183,0.45)",
    background: "rgba(87,208,183,0.10)",
  },

  section: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
  },

  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "900",
    color: "#ffffff",
  },

  text: {
    margin: "6px 0 0",
    color: "#8f9aa6",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  toolbar: {
    background: "#101820",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "18px",
    padding: "14px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "end",
  },

  card: {
    background: "#101820",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "18px",
    padding: "14px",
  },

  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    marginBottom: "12px",
  },

  cardTitle: {
    margin: 0,
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "900",
  },

  smallTitle: {
    margin: "0 0 10px",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "900",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "12px",
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    fontSize: "13px",
    color: "#c5ccd2",
    fontWeight: "700",
  },

  compactLabel: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "12px",
    color: "#9aa4af",
    fontWeight: "800",
    minWidth: "120px",
  },

  input: {
    width: "100%",
    background: "#0b1118",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "14px",
    padding: "11px",
    color: "#ffffff",
    outline: "none",
  },

  compactInput: {
    width: "100%",
    background: "#0b1118",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "12px",
    padding: "9px",
    color: "#ffffff",
    outline: "none",
  },

  actionsRow: {
    display: "flex",
    gap: "10px",
    marginTop: "14px",
    flexWrap: "wrap",
  },

  primaryButton: {
    background: "#57d0b7",
    color: "#07111c",
    border: "none",
    borderRadius: "14px",
    padding: "11px 14px",
    cursor: "pointer",
    fontWeight: "900",
  },

  primaryButtonSmall: {
    background: "#57d0b7",
    color: "#07111c",
    border: "none",
    borderRadius: "12px",
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: "900",
  },

  secondaryButton: {
    background: "transparent",
    color: "#d8dde3",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "14px",
    padding: "11px 14px",
    cursor: "pointer",
    fontWeight: "800",
  },

  closeButton: {
    background: "transparent",
    color: "#9aa4af",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "12px",
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: "800",
  },

  smallButton: {
    background: "transparent",
    color: "#57d0b7",
    border: "1px solid rgba(87,208,183,0.35)",
    borderRadius: "12px",
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: "800",
  },

  dangerButton: {
    background: "rgba(248,113,113,0.13)",
    color: "#fca5a5",
    border: "1px solid rgba(248,113,113,0.35)",
    borderRadius: "12px",
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: "800",
  },

  itemActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  statusBox: {
    borderRadius: "14px",
    padding: "11px 13px",
    fontWeight: "800",
    fontSize: "13px",
  },

  successBox: {
    background: "rgba(34,197,94,0.12)",
    border: "1px solid rgba(34,197,94,0.35)",
    color: "#86efac",
  },

  errorBox: {
    background: "rgba(248,113,113,0.12)",
    border: "1px solid rgba(248,113,113,0.35)",
    color: "#fecaca",
  },

  empty: {
    color: "#8f9aa6",
    padding: "10px 0",
    fontSize: "14px",
  },

  tableWrap: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "720px",
  },

  th: {
    textAlign: "left",
    color: "#9aa4af",
    fontSize: "12px",
    fontWeight: "900",
    padding: "10px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    whiteSpace: "nowrap",
  },

  td: {
    color: "#d8dde3",
    fontSize: "13px",
    padding: "10px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    verticalAlign: "middle",
  },

  badge: {
    display: "inline-flex",
    borderRadius: "999px",
    padding: "5px 9px",
    fontSize: "11px",
    fontWeight: "900",
  },

  successBadge: {
    color: "#86efac",
    background: "rgba(34,197,94,0.12)",
    border: "1px solid rgba(34,197,94,0.25)",
  },

  dangerBadge: {
    color: "#fca5a5",
    background: "rgba(248,113,113,0.12)",
    border: "1px solid rgba(248,113,113,0.25)",
  },

  divider: {
    height: "1px",
    background: "rgba(255,255,255,0.08)",
    margin: "14px 0",
  },

  inlinePicker: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "10px",
    alignItems: "end",
  },

  selectedBox: {
    marginTop: "14px",
    background: "#0b1118",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
    padding: "12px",
  },

  orderItem: {
    background: "#101820",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "14px",
    padding: "12px",
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center",
    color: "#ffffff",
    marginBottom: "8px",
  },
};

export default AdminSchedule;