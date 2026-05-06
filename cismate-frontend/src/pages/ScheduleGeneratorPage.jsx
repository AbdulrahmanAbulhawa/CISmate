import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"];
const SEMESTERS = ["FALL", "SPRING", "SUMMER"];
const DIFFICULTY_TARGETS = ["EASY", "BALANCED", "HARD"];
const COMPACTNESS_OPTIONS = ["COMPACT", "BALANCED", "DONT_CARE"];

function ScheduleGeneratorPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nextSemester: "FALL",
    nextYearLevel: 3,
    desiredCourseCount: 5,
    desiredElectiveCount: 0,
    difficultyTarget: "BALANCED",
    preferredTags: [],
    preferredDays: [],
    avoidDays: [],
    preferredWindowFrom: "",
    preferredWindowTo: "",
    earliestStartTime: "09:00",
    latestEndTime: "16:00",
    compactnessPreference: "BALANCED",
    avoidLongGaps: true,
    mustTakeCourseNames: [],
  });

  const [electiveTags, setElectiveTags] = useState([]);
  const [tagsOpen, setTagsOpen] = useState(false);

  const [offerings, setOfferings] = useState([]);
  const [loadingOfferings, setLoadingOfferings] = useState(false);
  const [offeredOpen, setOfferedOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);

  const [unavailableBlocks, setUnavailableBlocks] = useState([]);
  const [newBlock, setNewBlock] = useState({
    day: "SUNDAY",
    from: "",
    to: "",
    note: "",
  });

  const [result, setResult] = useState(null);
  const [loadingTags, setLoadingTags] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const authHeaders = useMemo(() => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("accessToken");

    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const normalizeName = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase();
  };

  const formatDay = (day) => {
    return String(day || "")
      .toLowerCase()
      .replace("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatShortDay = (day) => {
    const map = {
      SUNDAY: "Sun",
      MONDAY: "Mon",
      TUESDAY: "Tue",
      WEDNESDAY: "Wed",
      THURSDAY: "Thu",
    };

    return map[day] || formatDay(day);
  };

  const formatTime = (value) => {
    if (!value) return "N/A";
    return String(value).slice(0, 5);
  };

  const formatDays = (days = []) => {
    if (!Array.isArray(days) || days.length === 0) return "No days";
    return days.map((day) => formatShortDay(day)).join("/");
  };

  const formatCompactness = (value) => {
    if (value === "DONT_CARE") return "Don't care";
    return formatDay(value);
  };

  useEffect(() => {
    const loadElectiveTags = async () => {
      try {
        setLoadingTags(true);

        const response = await fetch(
          `${API_BASE_URL}/api/schedule/meta/elective-tags`,
          {
            headers: {
              ...authHeaders,
            },
          }
        );

        if (!response.ok) {
          setElectiveTags([]);
          return;
        }

        const data = await response.json();
        setElectiveTags(Array.isArray(data) ? data : []);
      } catch {
        setElectiveTags([]);
      } finally {
        setLoadingTags(false);
      }
    };

    loadElectiveTags();
  }, [authHeaders]);

  useEffect(() => {
    const loadOfferings = async () => {
      try {
        setLoadingOfferings(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/schedule/offerings?semester=${form.nextSemester}`,
          {
            headers: {
              ...authHeaders,
            },
          }
        );

        if (!response.ok) {
          setOfferings([]);
          return;
        }

        const data = await response.json();
        setOfferings(Array.isArray(data) ? data : []);
      } catch {
        setOfferings([]);
      } finally {
        setLoadingOfferings(false);
      }
    };

    loadOfferings();
  }, [authHeaders, form.nextSemester]);

  const offeredCourseOptions = useMemo(() => {
    const map = new Map();

    offerings.forEach((offering) => {
      const courseId = Number(offering.courseId);
      const courseName = String(offering.courseName || "").trim();

      if (!courseId || !courseName) return;

      const key = `${courseId}-${normalizeName(courseName)}`;

      if (!map.has(key)) {
        map.set(key, {
          id: courseId,
          courseName,
          courseCode: offering.courseCode || "",
          sections: [],
        });
      }

      map.get(key).sections.push({
        id: offering.id,
        sectionCode: offering.sectionCode || "N/A",
        pattern: offering.pattern || "",
        days: Array.isArray(offering.days) ? offering.days : [],
        startTime: offering.startTime,
        endTime: offering.endTime,
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      a.courseName.localeCompare(b.courseName)
    );
  }, [offerings]);

  useEffect(() => {
    setForm((prev) => {
      const offeredNames = new Set(
        offeredCourseOptions.map((course) => normalizeName(course.courseName))
      );

      const nextMustTakes = prev.mustTakeCourseNames.filter((name) =>
        offeredNames.has(normalizeName(name))
      );

      if (nextMustTakes.length === prev.mustTakeCourseNames.length) {
        return prev;
      }

      return {
        ...prev,
        mustTakeCourseNames: nextMustTakes,
      };
    });
  }, [offeredCourseOptions]);

  useEffect(() => {
    setForm((prev) => {
      const maxCourses = prev.nextSemester === "SUMMER" ? 3 : 6;
      const minCourses = prev.nextSemester === "SUMMER" ? 1 : 2;

      let nextCount = Number(prev.desiredCourseCount);

      if (nextCount > maxCourses) nextCount = maxCourses;
      if (nextCount < minCourses) nextCount = minCourses;

      return {
        ...prev,
        desiredCourseCount: nextCount,
      };
    });
  }, [form.nextSemester]);

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleTag = (tag) => {
    setForm((prev) => {
      const exists = prev.preferredTags.includes(tag);

      if (!exists && prev.preferredTags.length >= 5) {
        setError("You can select maximum 5 elective tags.");
        return prev;
      }

      setError("");

      return {
        ...prev,
        preferredTags: exists
          ? prev.preferredTags.filter((item) => item !== tag)
          : [...prev.preferredTags, tag],
      };
    });
  };

  const toggleMustTakeCourse = (courseName) => {
    setForm((prev) => {
      const exists = prev.mustTakeCourseNames.includes(courseName);

      return {
        ...prev,
        mustTakeCourseNames: exists
          ? prev.mustTakeCourseNames.filter((name) => name !== courseName)
          : [...prev.mustTakeCourseNames, courseName],
      };
    });

    setError("");
  };

  const removeMustTakeCourse = (courseName) => {
    setForm((prev) => ({
      ...prev,
      mustTakeCourseNames: prev.mustTakeCourseNames.filter(
        (name) => name !== courseName
      ),
    }));
  };

  const getSelectedMustTakeCourses = () => {
    return offeredCourseOptions.filter((course) =>
      form.mustTakeCourseNames.includes(course.courseName)
    );
  };

  const resolveSelectedMustTakeIds = () => {
    const selectedCourses = getSelectedMustTakeCourses();

    const ids = selectedCourses
      .map((course) => course.id)
      .filter((id) => Number.isInteger(id) && id > 0);

    if (ids.length !== selectedCourses.length) {
      throw new Error("Some selected must-take courses are missing IDs.");
    }

    return ids;
  };

  const togglePreferredDay = (day) => {
    setForm((prev) => {
      const alreadyPreferred = prev.preferredDays.includes(day);

      return {
        ...prev,
        preferredDays: alreadyPreferred
          ? prev.preferredDays.filter((item) => item !== day)
          : [...prev.preferredDays, day],
        avoidDays: prev.avoidDays.filter((item) => item !== day),
      };
    });
  };

  const toggleAvoidDay = (day) => {
    setForm((prev) => {
      const alreadyAvoided = prev.avoidDays.includes(day);

      return {
        ...prev,
        avoidDays: alreadyAvoided
          ? prev.avoidDays.filter((item) => item !== day)
          : [...prev.avoidDays, day],
        preferredDays: prev.preferredDays.filter((item) => item !== day),
      };
    });
  };

  const addUnavailableBlock = () => {
    if (!newBlock.day || !newBlock.from || !newBlock.to) {
      setError(
        "Pick day, from time, and to time before adding an unavailable block."
      );
      return;
    }

    if (newBlock.from >= newBlock.to) {
      setError("Unavailable block start time must be before end time.");
      return;
    }

    setUnavailableBlocks((prev) => [...prev, newBlock]);
    setNewBlock({
      day: "SUNDAY",
      from: "",
      to: "",
      note: "",
    });
    setError("");
  };

  const removeUnavailableBlock = (indexToRemove) => {
    setUnavailableBlocks((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const buildPayload = (mustTakeCourseIds) => {
    const preferredTimeWindows =
      form.preferredWindowFrom && form.preferredWindowTo
        ? [
            {
              from: form.preferredWindowFrom,
              to: form.preferredWindowTo,
            },
          ]
        : [];

    return {
      nextSemester: form.nextSemester,
      nextYearLevel: Number(form.nextYearLevel),
      desiredCourseCount: Number(form.desiredCourseCount),
      desiredElectiveCount: Number(form.desiredElectiveCount),
      difficultyTarget: form.difficultyTarget,

      mustTakeCourseIds,

      preferredTags: form.preferredTags,
      pinMustTakesFirst: true,
      returnAlternatives: true,

      preferredDays: form.preferredDays,
      avoidDays: form.avoidDays,
      preferredTimeWindows,
      earliestStartTime: form.earliestStartTime || null,
      latestEndTime: form.latestEndTime || null,

      unavailableBlocks,

      compactnessPreference: form.compactnessPreference,
      avoidLongGaps: form.avoidLongGaps,
      explain: false,
    };
  };

  const handleGenerate = async (event) => {
    event.preventDefault();

    try {
      setGenerating(true);
      setError("");
      setResult(null);

      if (form.preferredWindowFrom && form.preferredWindowTo) {
        if (form.preferredWindowFrom >= form.preferredWindowTo) {
          setError("Preferred time window start must be before end time.");
          return;
        }
      }

      if (
        (form.preferredWindowFrom && !form.preferredWindowTo) ||
        (!form.preferredWindowFrom && form.preferredWindowTo)
      ) {
        setError("Preferred time window needs both from and to.");
        return;
      }

      if (
        form.earliestStartTime &&
        form.latestEndTime &&
        form.earliestStartTime >= form.latestEndTime
      ) {
        setError("Earliest start must be before latest end.");
        return;
      }

      const mustTakeCourseIds = resolveSelectedMustTakeIds();
      const payload = buildPayload(mustTakeCourseIds);

      const response = await fetch(`${API_BASE_URL}/api/schedule/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.message || "Schedule generation failed.");
        return;
      }

      setResult(data);
    } catch (err) {
      setError(err?.message || "Could not connect to the backend.");
    } finally {
      setGenerating(false);
    }
  };

  const weeklyGridByDay = useMemo(() => {
    const map = {};

    DAYS.forEach((day) => {
      map[day] = [];
    });

    if (result?.weeklyGrid) {
      result.weeklyGrid.forEach((dayItem) => {
        map[dayItem.day] = dayItem.blocks || [];
      });
    }

    return map;
  }, [result]);

  const renderMeetings = (meetings = []) => {
    if (!meetings.length) return "No meeting slots";

    return meetings
      .map(
        (meeting) =>
          `${formatDay(meeting.day)} ${formatTime(meeting.from)} - ${formatTime(
            meeting.to
          )}`
      )
      .join(" | ");
  };

  const selectedMustTakeCourses = getSelectedMustTakeCourses();

  const maxDesiredCourses = form.nextSemester === "SUMMER" ? 3 : 6;
  const minDesiredCourses = form.nextSemester === "SUMMER" ? 1 : 2;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.title}>Schedule Generator</h1>
            <p style={styles.subtitle}>
              Generate a semester schedule using your completed courses,
              prerequisites, offerings, and preferences.
            </p>
          </div>

          <button style={styles.backButton} onClick={() => navigate("/home")}>
            Back
          </button>
        </div>

        <form style={styles.formCard} onSubmit={handleGenerate}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Basic Settings</h2>
            <p style={styles.sectionText}>
              Pick the semester, year level, course count, electives, and
              difficulty target.
            </p>
          </div>

          <div style={styles.grid}>
            <label style={styles.label}>
              Semester
              <select
                style={styles.input}
                value={form.nextSemester}
                onChange={(event) => {
                  updateForm("nextSemester", event.target.value);
                  setResult(null);
                  setCoursesOpen(false);
                  setOfferedOpen(false);
                }}
              >
                {SEMESTERS.map((semester) => (
                  <option key={semester} value={semester}>
                    {semester}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              Year Level
              <select
                style={styles.input}
                value={form.nextYearLevel}
                onChange={(event) =>
                  updateForm("nextYearLevel", Number(event.target.value))
                }
              >
                {[1, 2, 3, 4].map((year) => (
                  <option key={year} value={year}>
                    Year {year}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              Desired Courses
              <input
                style={styles.input}
                type="number"
                min={minDesiredCourses}
                max={maxDesiredCourses}
                value={form.desiredCourseCount}
                onChange={(event) =>
                  updateForm("desiredCourseCount", event.target.value)
                }
              />
            </label>

            <label style={styles.label}>
              Desired Electives
              <input
                style={styles.input}
                type="number"
                min="0"
                max="6"
                value={form.desiredElectiveCount}
                onChange={(event) =>
                  updateForm("desiredElectiveCount", event.target.value)
                }
              />
            </label>

            <label style={styles.label}>
              Difficulty Target
              <select
                style={styles.input}
                value={form.difficultyTarget}
                onChange={(event) =>
                  updateForm("difficultyTarget", event.target.value)
                }
              >
                {DIFFICULTY_TARGETS.map((target) => (
                  <option key={target} value={target}>
                    {formatDay(target)}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              Compactness
              <select
                style={styles.input}
                value={form.compactnessPreference}
                onChange={(event) =>
                  updateForm("compactnessPreference", event.target.value)
                }
              >
                {COMPACTNESS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {formatCompactness(option)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              Offered Courses for {form.nextSemester}
            </h2>
            <p style={styles.sectionText}>
              These are the courses that have sections available for the selected
              semester.
            </p>
          </div>

          {loadingOfferings ? (
            <div style={styles.mutedText}>Loading offered courses...</div>
          ) : offeredCourseOptions.length === 0 ? (
            <div style={styles.emptyInlineBox}>
              No offered courses found for {form.nextSemester}.
            </div>
          ) : (
            <div style={styles.offeredCard}>
              <button
                type="button"
                style={styles.offeredSummaryButton}
                onClick={() => setOfferedOpen((prev) => !prev)}
              >
                <span>
                  {offeredCourseOptions.length} course(s) available ·{" "}
                  {offerings.length} section(s)
                </span>
                <span>{offeredOpen ? "Hide" : "Show"}</span>
              </button>

              {!offeredOpen && (
                <div style={styles.offeredPreview}>
                  {offeredCourseOptions.slice(0, 8).map((course) => (
                    <span key={course.id} style={styles.offeredChip}>
                      {course.courseName}
                    </span>
                  ))}

                  {offeredCourseOptions.length > 8 && (
                    <span style={styles.offeredMoreChip}>
                      +{offeredCourseOptions.length - 8} more
                    </span>
                  )}
                </div>
              )}

              {offeredOpen && (
                <div style={styles.offeredList}>
                  {offeredCourseOptions.map((course) => (
                    <div key={course.id} style={styles.offeredCourseRow}>
                      <div style={styles.offeredCourseTop}>
                        <div>
                          <div style={styles.offeredCourseName}>
                            {course.courseName}
                          </div>
                          {course.courseCode && (
                            <div style={styles.offeredCourseCode}>
                              {course.courseCode}
                            </div>
                          )}
                        </div>

                        <div style={styles.sectionCount}>
                          {course.sections.length} section(s)
                        </div>
                      </div>

                      <div style={styles.sectionPills}>
                        {course.sections.map((section) => (
                          <span key={section.id} style={styles.sectionPill}>
                            Sec {section.sectionCode} ·{" "}
                            {formatDays(section.days)} ·{" "}
                            {formatTime(section.startTime)}-
                            {formatTime(section.endTime)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Must-take Courses</h2>
            <p style={styles.sectionText}>
              You can only select from courses offered in {form.nextSemester}.
            </p>
          </div>

          {loadingOfferings ? (
            <div style={styles.mutedText}>Loading courses...</div>
          ) : offeredCourseOptions.length === 0 ? (
            <div style={styles.mutedText}>
              No offered courses available to select.
            </div>
          ) : (
            <div style={styles.dropdownWrap}>
              <button
                type="button"
                style={styles.dropdownButton}
                onClick={() => setCoursesOpen((prev) => !prev)}
              >
                <span>
                  {form.mustTakeCourseNames.length === 0
                    ? "Select must-take courses"
                    : `${form.mustTakeCourseNames.length} course(s) selected`}
                </span>
                <span>{coursesOpen ? "▲" : "▼"}</span>
              </button>

              {coursesOpen && (
                <div style={styles.dropdownMenuLarge}>
                  {offeredCourseOptions.map((course, index) => {
                    const selected = form.mustTakeCourseNames.includes(
                      course.courseName
                    );

                    return (
                      <button
                        key={`${course.id}-${course.courseName}-${index}`}
                        type="button"
                        style={{
                          ...styles.courseOptionButton,
                          ...(selected ? styles.courseOptionSelected : {}),
                        }}
                        onClick={() =>
                          toggleMustTakeCourse(course.courseName)
                        }
                      >
                        <span>{course.courseName}</span>
                        <span>{selected ? "✓" : ""}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedMustTakeCourses.length > 0 && (
                <div style={styles.selectedTagsRow}>
                  {selectedMustTakeCourses.map((course) => (
                    <button
                      key={course.id}
                      type="button"
                      style={styles.selectedCourseTag}
                      onClick={() =>
                        removeMustTakeCourse(course.courseName)
                      }
                    >
                      {course.courseName} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Day Preferences</h2>
            <p style={styles.sectionText}>
              Preferred and avoided days are soft preferences.
            </p>
          </div>

          <div style={styles.dayGrid}>
            {DAYS.map((day) => (
              <div key={day} style={styles.dayCard}>
                <div style={styles.dayName}>{formatDay(day)}</div>

                <button
                  type="button"
                  style={{
                    ...styles.smallToggle,
                    ...(form.preferredDays.includes(day)
                      ? styles.goodToggle
                      : {}),
                  }}
                  onClick={() => togglePreferredDay(day)}
                >
                  Prefer
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.smallToggle,
                    ...(form.avoidDays.includes(day) ? styles.badToggle : {}),
                  }}
                  onClick={() => toggleAvoidDay(day)}
                >
                  Avoid
                </button>
              </div>
            ))}
          </div>

          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Time Preferences</h2>
            <p style={styles.sectionText}>
              Earliest/latest are soft. Unavailable blocks are hard constraints.
            </p>
          </div>

          <div style={styles.grid}>
            <label style={styles.label}>
              Earliest Start
              <input
                style={styles.input}
                type="time"
                value={form.earliestStartTime}
                onChange={(event) =>
                  updateForm("earliestStartTime", event.target.value)
                }
              />
            </label>

            <label style={styles.label}>
              Latest End
              <input
                style={styles.input}
                type="time"
                value={form.latestEndTime}
                onChange={(event) =>
                  updateForm("latestEndTime", event.target.value)
                }
              />
            </label>

            <label style={styles.label}>
              Preferred Window From
              <input
                style={styles.input}
                type="time"
                value={form.preferredWindowFrom}
                onChange={(event) =>
                  updateForm("preferredWindowFrom", event.target.value)
                }
              />
            </label>

            <label style={styles.label}>
              Preferred Window To
              <input
                style={styles.input}
                type="time"
                value={form.preferredWindowTo}
                onChange={(event) =>
                  updateForm("preferredWindowTo", event.target.value)
                }
              />
            </label>
          </div>

          <label style={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={form.avoidLongGaps}
              onChange={(event) =>
                updateForm("avoidLongGaps", event.target.checked)
              }
            />
            Avoid long gaps
          </label>

          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Unavailable Blocks</h2>
            <p style={styles.sectionText}>
              Use this for work, commute, or hard no-class times.
            </p>
          </div>

          <div style={styles.blockBuilder}>
            <select
              style={styles.input}
              value={newBlock.day}
              onChange={(event) =>
                setNewBlock((prev) => ({
                  ...prev,
                  day: event.target.value,
                }))
              }
            >
              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {formatDay(day)}
                </option>
              ))}
            </select>

            <input
              style={styles.input}
              type="time"
              value={newBlock.from}
              onChange={(event) =>
                setNewBlock((prev) => ({
                  ...prev,
                  from: event.target.value,
                }))
              }
            />

            <input
              style={styles.input}
              type="time"
              value={newBlock.to}
              onChange={(event) =>
                setNewBlock((prev) => ({
                  ...prev,
                  to: event.target.value,
                }))
              }
            />

            <input
              style={styles.input}
              type="text"
              placeholder="Note"
              value={newBlock.note}
              onChange={(event) =>
                setNewBlock((prev) => ({
                  ...prev,
                  note: event.target.value,
                }))
              }
            />

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={addUnavailableBlock}
            >
              Add Block
            </button>
          </div>

          {unavailableBlocks.length > 0 && (
            <div style={styles.blockList}>
              {unavailableBlocks.map((block, index) => (
                <div
                  key={`${block.day}-${block.from}-${index}`}
                  style={styles.blockItem}
                >
                  <span>
                    {formatDay(block.day)} | {block.from} - {block.to}
                    {block.note ? ` | ${block.note}` : ""}
                  </span>

                  <button
                    type="button"
                    style={styles.removeButton}
                    onClick={() => removeUnavailableBlock(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Elective Tags</h2>
            <p style={styles.sectionText}>
              Used when desired electives is greater than zero. Max 5 tags.
            </p>
          </div>

          {loadingTags ? (
            <div style={styles.mutedText}>Loading elective tags...</div>
          ) : electiveTags.length === 0 ? (
            <div style={styles.mutedText}>
              No elective tags returned from backend.
            </div>
          ) : (
            <div style={styles.dropdownWrap}>
              <button
                type="button"
                style={styles.dropdownButton}
                onClick={() => setTagsOpen((prev) => !prev)}
              >
                <span>
                  {form.preferredTags.length === 0
                    ? "Select elective tags"
                    : `${form.preferredTags.length} tag(s) selected`}
                </span>
                <span>{tagsOpen ? "▲" : "▼"}</span>
              </button>

              {tagsOpen && (
                <div style={styles.dropdownMenu}>
                  {electiveTags.map((tag) => (
                    <label key={tag} style={styles.dropdownOption}>
                      <input
                        type="checkbox"
                        checked={form.preferredTags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                      />
                      <span>{tag}</span>
                    </label>
                  ))}
                </div>
              )}

              {form.preferredTags.length > 0 && (
                <div style={styles.selectedTagsRow}>
                  {form.preferredTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      style={styles.selectedTag}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && <div style={styles.errorBox}>{error}</div>}

          <button
            type="submit"
            style={styles.generateButton}
            disabled={generating || loadingOfferings}
          >
            {generating ? "Generating..." : "Generate Schedule"}
          </button>
        </form>

        {result && (
          <div style={styles.resultsArea}>
            <div style={styles.summaryCard}>
              <div>
                <h2 style={styles.resultTitle}>
                  {result.semester} - Year {result.yearLevel}
                </h2>

                <p style={styles.resultText}>
                  Courses: {result.achievedCourses}/{result.targetCourses} |
                  Minimum: {result.metMinimum ? "Met" : "Not met"}
                </p>

                <p style={styles.resultText}>
                  Electives: {result.achievedElectives}/
                  {result.targetElectives ?? 0} | Target:{" "}
                  {result.metElectiveTarget ? "Met" : "Not met"}
                </p>

                <p style={styles.resultText}>
                  Template used: {result.templateUsed ? "Yes" : "No"}
                </p>
              </div>

              <div
                style={result.metMinimum ? styles.statusGood : styles.statusBad}
              >
                {result.metMinimum ? "Valid" : "Incomplete"}
              </div>
            </div>

            <div style={styles.noteCard}>
              <h3 style={styles.noteTitle}>Schedule Note</h3>
              <p style={styles.noteText}>
                The generated schedule is based on your preferences, completed
                courses, prerequisites, available sections, and time conflicts.
                It may not match every preference exactly, especially when
                courses have limited offerings or conflicts.
              </p>
            </div>

            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Selected Courses</h2>
            </div>

            <div style={styles.selectedGrid}>
              {result.selected?.length === 0 ? (
                <div style={styles.emptyBox}>No courses selected.</div>
              ) : (
                result.selected?.map((item, index) => {
                  const primary = item.primary;
                  const alternative = item.alternative;

                  return (
                    <div
                      key={`${primary?.courseId}-${index}`}
                      style={styles.courseCard}
                    >
                      <h3 style={styles.courseTitle}>
                        {primary?.courseCode
                          ? `${primary.courseCode} - ${primary.courseName}`
                          : primary?.courseName}
                      </h3>

                      <p style={styles.courseText}>
                        Primary section:{" "}
                        <strong>{primary?.sectionCode || "N/A"}</strong>
                      </p>

                      <p style={styles.courseText}>
                        {renderMeetings(primary?.meetings)}
                      </p>

                      <div style={styles.alternativeBox}>
                        <strong>Alternative:</strong>{" "}
                        {alternative?.isAlternativeSameAsPrimary ||
                        alternative?.alternativeSameAsPrimary ? (
                          <span>No alternative section available</span>
                        ) : (
                          <span>
                            Section {alternative?.sectionCode || "N/A"} |{" "}
                            {renderMeetings(alternative?.meetings)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Weekly Grid</h2>
            </div>

            <div style={styles.weekGrid}>
              {DAYS.map((day) => (
                <div key={day} style={styles.weekDayCard}>
                  <h3 style={styles.weekDayTitle}>{formatDay(day)}</h3>

                  {weeklyGridByDay[day]?.length === 0 ? (
                    <div style={styles.emptyDay}>No classes</div>
                  ) : (
                    weeklyGridByDay[day].map((block, index) => (
                      <div
                        key={`${block.courseId}-${block.from}-${index}`}
                        style={styles.timeBlock}
                      >
                        <div style={styles.timeText}>
                          {formatTime(block.from)} - {formatTime(block.to)}
                        </div>
                        <div style={styles.blockCourseName}>
                          {block.courseName}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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

        <button style={{ ...styles.navButton, ...styles.activeNav }}>
          Schedule
        </button>

        <button style={styles.navButton} onClick={() => navigate("/community")}>
          Community
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#07111c",
    color: "#ffffff",
    padding: "24px",
    paddingBottom: "120px",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "20px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
    margin: 0,
  },
  subtitle: {
    color: "rgba(255,255,255,0.68)",
    marginTop: "8px",
    maxWidth: "720px",
    lineHeight: 1.5,
  },
  backButton: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#ffffff",
    borderRadius: "14px",
    padding: "12px 18px",
    cursor: "pointer",
    fontWeight: "700",
  },
  formCard: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },
  sectionHeader: {
    marginTop: "22px",
    marginBottom: "14px",
  },
  sectionTitle: {
    fontSize: "21px",
    margin: 0,
  },
  sectionText: {
    marginTop: "6px",
    color: "rgba(255,255,255,0.58)",
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    color: "rgba(255,255,255,0.78)",
    fontWeight: "700",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    background: "#07111c",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "14px",
    padding: "12px",
    outline: "none",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  offeredCard: {
    background: "#07111c",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px",
    padding: "14px",
  },
  offeredSummaryButton: {
    width: "100%",
    background: "transparent",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: "900",
    fontSize: "15px",
    padding: "4px",
  },
  offeredPreview: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "12px",
  },
  offeredChip: {
    background: "rgba(34,211,238,0.1)",
    border: "1px solid rgba(34,211,238,0.25)",
    color: "#67e8f9",
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: "800",
  },
  offeredMoreChip: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "rgba(255,255,255,0.72)",
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: "800",
  },
  offeredList: {
    display: "grid",
    gap: "10px",
    marginTop: "12px",
  },
  offeredCourseRow: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "14px",
  },
  offeredCourseTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
  },
  offeredCourseName: {
    color: "#ffffff",
    fontWeight: "900",
    lineHeight: 1.4,
  },
  offeredCourseCode: {
    color: "rgba(255,255,255,0.48)",
    marginTop: "3px",
    fontSize: "13px",
    fontWeight: "700",
  },
  sectionCount: {
    color: "#67e8f9",
    fontWeight: "800",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },
  sectionPills: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "12px",
  },
  sectionPill: {
    background: "rgba(251,146,60,0.12)",
    border: "1px solid rgba(251,146,60,0.25)",
    color: "#fdba74",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "12px",
    fontWeight: "800",
  },
  emptyInlineBox: {
    background: "#07111c",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.58)",
    borderRadius: "14px",
    padding: "14px",
  },
  dayGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px",
  },
  dayCard: {
    background: "#07111c",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "14px",
  },
  dayName: {
    fontWeight: "800",
    marginBottom: "10px",
  },
  smallToggle: {
    width: "100%",
    background: "transparent",
    color: "rgba(255,255,255,0.75)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "10px",
    marginTop: "8px",
    cursor: "pointer",
    fontWeight: "700",
  },
  goodToggle: {
    background: "rgba(34,197,94,0.14)",
    borderColor: "rgba(34,197,94,0.45)",
    color: "#86efac",
  },
  badToggle: {
    background: "rgba(248,113,113,0.14)",
    borderColor: "rgba(248,113,113,0.45)",
    color: "#fca5a5",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "16px",
    color: "rgba(255,255,255,0.78)",
    fontWeight: "700",
  },
  blockBuilder: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1.5fr auto",
    gap: "10px",
    alignItems: "center",
  },
  secondaryButton: {
    background: "#22d3ee",
    color: "#001018",
    border: "none",
    borderRadius: "14px",
    padding: "12px 16px",
    cursor: "pointer",
    fontWeight: "800",
  },
  blockList: {
    marginTop: "12px",
    display: "grid",
    gap: "8px",
  },
  blockItem: {
    background: "#07111c",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "12px",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
  },
  removeButton: {
    background: "transparent",
    border: "none",
    color: "#f87171",
    cursor: "pointer",
    fontWeight: "800",
  },
  mutedText: {
    color: "rgba(255,255,255,0.55)",
  },
  dropdownWrap: {
    position: "relative",
    width: "100%",
  },
  dropdownButton: {
    width: "100%",
    background: "#07111c",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "14px",
    padding: "12px 14px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "800",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxSizing: "border-box",
  },
  dropdownMenu: {
    marginTop: "8px",
    background: "#07111c",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "14px",
    padding: "10px",
    display: "grid",
    gap: "8px",
    maxHeight: "220px",
    overflowY: "auto",
  },
  dropdownMenuLarge: {
    marginTop: "8px",
    background: "#07111c",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "14px",
    padding: "10px",
    display: "grid",
    gap: "8px",
    maxHeight: "320px",
    overflowY: "auto",
  },
  dropdownOption: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px",
    borderRadius: "10px",
    color: "rgba(255,255,255,0.78)",
    cursor: "pointer",
    fontWeight: "700",
  },
  courseOptionButton: {
    width: "100%",
    background: "transparent",
    color: "rgba(255,255,255,0.82)",
    border: "none",
    borderRadius: "10px",
    padding: "12px",
    cursor: "pointer",
    fontWeight: "700",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    textAlign: "left",
  },
  courseOptionSelected: {
    background: "rgba(34,211,238,0.14)",
    color: "#67e8f9",
  },
  selectedTagsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "12px",
  },
  selectedTag: {
    background: "rgba(251,146,60,0.16)",
    border: "1px solid rgba(251,146,60,0.45)",
    color: "#fdba74",
    borderRadius: "999px",
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: "800",
  },
  selectedCourseTag: {
    background: "rgba(34,211,238,0.14)",
    border: "1px solid rgba(34,211,238,0.4)",
    color: "#67e8f9",
    borderRadius: "999px",
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: "800",
  },
  errorBox: {
    marginTop: "18px",
    background: "rgba(248,113,113,0.12)",
    border: "1px solid rgba(248,113,113,0.35)",
    color: "#fecaca",
    borderRadius: "14px",
    padding: "12px",
  },
  generateButton: {
    width: "100%",
    background: "#fb923c",
    color: "#111827",
    border: "none",
    borderRadius: "16px",
    padding: "15px",
    marginTop: "22px",
    cursor: "pointer",
    fontWeight: "900",
    fontSize: "16px",
  },
  resultsArea: {
    marginTop: "24px",
  },
  summaryCard: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "22px",
    padding: "22px",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },
  resultTitle: {
    fontSize: "24px",
    margin: 0,
  },
  resultText: {
    color: "rgba(255,255,255,0.7)",
    margin: "8px 0 0",
  },
  statusGood: {
    background: "rgba(34,197,94,0.14)",
    color: "#86efac",
    border: "1px solid rgba(34,197,94,0.35)",
    borderRadius: "999px",
    padding: "10px 16px",
    fontWeight: "900",
  },
  statusBad: {
    background: "rgba(248,113,113,0.14)",
    color: "#fca5a5",
    border: "1px solid rgba(248,113,113,0.35)",
    borderRadius: "999px",
    padding: "10px 16px",
    fontWeight: "900",
  },
  noteCard: {
    marginTop: "16px",
    background: "rgba(34,211,238,0.08)",
    border: "1px solid rgba(34,211,238,0.22)",
    borderRadius: "18px",
    padding: "16px",
  },
  noteTitle: {
    margin: "0 0 8px",
    color: "#67e8f9",
  },
  noteText: {
    margin: 0,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.6,
  },
  selectedGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "14px",
  },
  courseCard: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
  courseTitle: {
    margin: "0 0 12px",
    color: "#fb923c",
  },
  courseText: {
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.5,
  },
  alternativeBox: {
    marginTop: "12px",
    background: "#07111c",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "12px",
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.5,
  },
  emptyBox: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "18px",
    padding: "20px",
    color: "rgba(255,255,255,0.6)",
  },
  weekGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "14px",
  },
  weekDayCard: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "18px",
    padding: "16px",
    minHeight: "180px",
  },
  weekDayTitle: {
    margin: "0 0 12px",
    color: "#22d3ee",
  },
  emptyDay: {
    color: "rgba(255,255,255,0.45)",
    fontSize: "14px",
  },
  timeBlock: {
    background: "#07111c",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "12px",
    marginBottom: "10px",
  },
  timeText: {
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: "800",
    marginBottom: "6px",
  },
  blockCourseName: {
    color: "#ffffff",
    fontWeight: "800",
    lineHeight: 1.4,
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

export default ScheduleGeneratorPage;