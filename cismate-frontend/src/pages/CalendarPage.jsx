import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "http://localhost:8080";

function CalendarPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    startDateTime: "",
    endDateTime: "",
    allDay: false,
    colorHex: "#4ade80",
    location: "",
  });

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    getEvents();
  }, []);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const getEvents = () => {
    setLoading(true);

    axios
      .get(`${API_BASE_URL}/api/events`, {
        headers: authHeaders,
      })
      .then((res) => {
        console.log("EVENTS RESPONSE:", res.data);
        setEvents(res.data || []);
      })
      .catch((err) => {
        console.log("EVENTS ERROR:", err.response || err);
        alert("Could not load events. Check console.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      startDateTime: "",
      endDateTime: "",
      allDay: false,
      colorHex: "#4ade80",
      location: "",
    });

    setEditingEvent(null);
  };

  const openCreateModal = (dateKey = null) => {
    resetForm();

    if (dateKey) {
      setForm({
        title: "",
        description: "",
        startDateTime: `${dateKey}T09:00`,
        endDateTime: `${dateKey}T10:00`,
        allDay: false,
        colorHex: "#4ade80",
        location: "",
      });
    }

    setShowFormModal(true);
  };

  const openEditModal = (event) => {
    if (event.globalEvent) {
      alert("Global events can only be edited by admin.");
      return;
    }

    setSelectedEvent(null);
    setEditingEvent(event);

    setForm({
      title: event.title || "",
      description: event.description || "",
      startDateTime: toInputDateTime(event.startDateTime),
      endDateTime: toInputDateTime(event.endDateTime),
      allDay: Boolean(event.allDay),
      colorHex: event.colorHex || "#4ade80",
      location: event.location || "",
    });

    setShowFormModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const body = {
      title: form.title,
      description: form.description,
      startDateTime: form.startDateTime,
      endDateTime: form.endDateTime,
      allDay: form.allDay,
      colorHex: form.colorHex,
      location: form.location,
    };

    if (editingEvent) {
      axios
        .put(`${API_BASE_URL}/api/events/${editingEvent.id}`, body, {
          headers: authHeaders,
        })
        .then((res) => {
          console.log("UPDATE EVENT RESPONSE:", res.data);
          setShowFormModal(false);
          resetForm();
          getEvents();
        })
        .catch((err) => {
          console.log("UPDATE EVENT ERROR:", err.response || err);
          alert("Could not update event. Check console.");
        });

      return;
    }

    axios
      .post(`${API_BASE_URL}/api/events`, body, {
        headers: authHeaders,
      })
      .then((res) => {
        console.log("CREATE EVENT RESPONSE:", res.data);
        setShowFormModal(false);
        resetForm();
        getEvents();
      })
      .catch((err) => {
        console.log("CREATE EVENT ERROR:", err.response || err);
        alert("Could not create event. Check console.");
      });
  };

  const deleteEvent = (event) => {
    if (event.globalEvent) {
      alert("Global events can only be deleted by admin.");
      return;
    }

    const confirmed = window.confirm("Delete this event?");

    if (!confirmed) {
      return;
    }

    axios
      .delete(`${API_BASE_URL}/api/events/${event.id}`, {
        headers: authHeaders,
      })
      .then(() => {
        setSelectedEvent(null);
        getEvents();
      })
      .catch((err) => {
        console.log("DELETE EVENT ERROR:", err.response || err);
        alert("Could not delete event. Check console.");
      });
  };

  const monthLabel = monthCursor.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const calendarDays = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startPadding = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];

    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        day,
        date,
        key: toDateKey(date),
      });
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }, [monthCursor]);

  const eventsByDate = useMemo(() => {
    const map = {};

    events.forEach((event) => {
      const key = getEventDateKey(event);

      if (!key) {
        return;
      }

      if (!map[key]) {
        map[key] = [];
      }

      map[key].push(event);
    });

    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => {
        const aTime = new Date(a.startDateTime || 0).getTime();
        const bTime = new Date(b.startDateTime || 0).getTime();
        return aTime - bTime;
      });
    });

    return map;
  }, [events]);

  const goPreviousMonth = () => {
    setMonthCursor(
      new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1)
    );
  };

  const goNextMonth = () => {
    setMonthCursor(
      new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1)
    );
  };

  const goToday = () => {
    const now = new Date();
    setMonthCursor(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Calendar</h1>
            <p style={styles.headerText}>
              Dots show events. Press a dot to view the event details.
            </p>
          </div>

          <button style={styles.createButton} onClick={() => openCreateModal()}>
            + New Event
          </button>
        </div>

        <div style={styles.calendarCard}>
          <div style={styles.calendarTop}>
            <button style={styles.monthButton} onClick={goPreviousMonth}>
              ‹
            </button>

            <div style={styles.monthTitleBox}>
              <h2 style={styles.monthTitle}>{monthLabel}</h2>
              <button style={styles.todayButton} onClick={goToday}>
                Today
              </button>
            </div>

            <button style={styles.monthButton} onClick={goNextMonth}>
              ›
            </button>
          </div>

          {loading ? (
            <div style={styles.emptyBox}>Loading events...</div>
          ) : (
            <>
              <div style={styles.weekGrid}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div key={day} style={styles.weekDay}>
                      {day}
                    </div>
                  )
                )}
              </div>

              <div style={styles.daysGrid}>
                {calendarDays.map((item, index) => {
                  if (!item) {
                    return <div key={`empty-${index}`} style={styles.emptyDay} />;
                  }

                  const dayEvents = eventsByDate[item.key] || [];
                  const isToday = item.key === toDateKey(new Date());

                  return (
                    <div key={item.key} style={styles.dayCell}>
                      <div style={styles.dayHeader}>
                        <span
                          style={{
                            ...styles.dayNumber,
                            ...(isToday ? styles.todayNumber : {}),
                          }}
                        >
                          {item.day}
                        </span>

                        <button
                          type="button"
                          style={styles.addSmallButton}
                          onClick={() => openCreateModal(item.key)}
                          title="Add event on this day"
                        >
                          +
                        </button>
                      </div>

                      <div style={styles.dotsRow}>
                        {dayEvents.slice(0, 5).map((event) => (
                          <button
                            key={event.id}
                            type="button"
                            title={event.title || "Untitled Event"}
                            style={{
                              ...styles.eventDot,
                              background: event.colorHex || "#4ade80",
                            }}
                            onClick={() => setSelectedEvent(event)}
                          />
                        ))}

                        {dayEvents.length > 5 && (
                          <button
                            type="button"
                            style={styles.moreDots}
                            onClick={() => setSelectedEvent(dayEvents[0])}
                          >
                            +{dayEvents.length - 5}
                          </button>
                        )}
                      </div>

                      {dayEvents.length > 0 && (
                        <p style={styles.dayEventCount}>
                          {dayEvents.length} event{dayEvents.length > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {selectedEvent && (
        <div style={styles.modalOverlay} onClick={() => setSelectedEvent(null)}>
          <div style={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.detailTitleRow}>
                <span
                  style={{
                    ...styles.detailDot,
                    background: selectedEvent.colorHex || "#4ade80",
                  }}
                />

                <div>
                  <h2 style={styles.modalTitle}>
                    {selectedEvent.title || "Untitled Event"}
                  </h2>

                  <p style={styles.modalSubTitle}>
                    {selectedEvent.globalEvent ? "College Event" : "Personal Event"}
                  </p>
                </div>
              </div>

              <button
                style={styles.closeButton}
                onClick={() => setSelectedEvent(null)}
              >
                ×
              </button>
            </div>

            <div style={styles.descriptionBox}>
              <strong style={styles.descriptionLabel}>Description</strong>
              <p style={styles.descriptionText}>
                {selectedEvent.description || "No description provided."}
              </p>
            </div>

            <div style={styles.detailsGrid}>
              <DetailBox
                label="Start"
                value={formatDateTime(selectedEvent.startDateTime)}
              />

              <DetailBox
                label="End"
                value={formatDateTime(selectedEvent.endDateTime)}
              />

              <DetailBox
                label="Location"
                value={selectedEvent.location || "N/A"}
              />

              <DetailBox
                label="Type"
                value={selectedEvent.globalEvent ? "Global" : "Personal"}
              />

              <DetailBox
                label="Mode"
                value={selectedEvent.allDay ? "All day" : "Timed event"}
              />
            </div>

            {!selectedEvent.globalEvent && (
              <div style={styles.detailActions}>
                <button
                  style={styles.editButton}
                  onClick={() => openEditModal(selectedEvent)}
                >
                  Edit
                </button>

                <button
                  style={styles.deleteButton}
                  onClick={() => deleteEvent(selectedEvent)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showFormModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => {
            setShowFormModal(false);
            resetForm();
          }}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingEvent ? "Edit Event" : "Create Event"}
              </h2>

              <button
                style={styles.closeButton}
                onClick={() => {
                  setShowFormModal(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Title</label>

                <input
                  style={styles.input}
                  type="text"
                  placeholder="Example: Database Midterm"
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
                  placeholder="Optional details..."
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Start</label>

                  <input
                    style={styles.input}
                    type="datetime-local"
                    value={form.startDateTime}
                    onChange={(e) =>
                      setForm({ ...form, startDateTime: e.target.value })
                    }
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>End</label>

                  <input
                    style={styles.input}
                    type="datetime-local"
                    value={form.endDateTime}
                    onChange={(e) =>
                      setForm({ ...form, endDateTime: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Location</label>

                  <input
                    style={styles.input}
                    type="text"
                    placeholder="Room, building, online..."
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Color</label>

                  <input
                    style={styles.input}
                    type="color"
                    value={form.colorHex}
                    onChange={(e) =>
                      setForm({ ...form, colorHex: e.target.value })
                    }
                  />
                </div>
              </div>

              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={form.allDay}
                  onChange={(e) =>
                    setForm({ ...form, allDay: e.target.checked })
                  }
                />

                <span>All day event</span>
              </label>

              <button style={styles.submitButton} type="submit">
                {editingEvent ? "Update Event" : "Create Event"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div style={styles.bottomNav}>
        <button style={styles.navButton} onClick={() => navigate("/assistant")}>
          Assistant
        </button>

        <button style={styles.navButton} onClick={() => navigate("/explore")}>
          Explore
        </button>

        <button
          style={{ ...styles.navButton, ...styles.activeNav }}
          onClick={() => navigate("/home")}
        >
          Home
        </button>

        <button style={styles.navButton} onClick={() => navigate("/careers")}>
          Careers
        </button>

        <button style={styles.navButton} onClick={() => navigate("/community")}>
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

function getEventDateKey(event) {
  if (!event.startDateTime) return null;

  const date = new Date(event.startDateTime);

  if (Number.isNaN(date.getTime())) {
    return String(event.startDateTime).slice(0, 10);
  }

  return toDateKey(date);
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateTime(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function toInputDateTime(value) {
  if (!value) return "";

  return String(value).slice(0, 16);
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
    maxWidth: "1100px",
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

  calendarCard: {
    background: "#0b1623",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },

  calendarTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    marginBottom: "20px",
  },

  monthButton: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#ffffff",
    fontSize: "30px",
    lineHeight: "1",
    cursor: "pointer",
  },

  monthTitleBox: {
    textAlign: "center",
  },

  monthTitle: {
    margin: "0 0 8px",
    fontSize: "26px",
  },

  todayButton: {
    background: "transparent",
    color: "#22d3ee",
    border: "1px solid rgba(34,211,238,0.35)",
    borderRadius: "999px",
    padding: "7px 14px",
    fontWeight: "800",
    cursor: "pointer",
  },

  weekGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "8px",
    marginBottom: "8px",
  },

  weekDay: {
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
    fontSize: "13px",
    fontWeight: "800",
    padding: "8px 0",
  },

  daysGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "8px",
  },

  emptyDay: {
    minHeight: "118px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.015)",
    border: "1px solid rgba(255,255,255,0.025)",
  },

  dayCell: {
    minHeight: "118px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },

  dayHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dayNumber: {
    width: "30px",
    height: "30px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontWeight: "800",
  },

  todayNumber: {
    background: "#4ade80",
    color: "#07111c",
  },

  addSmallButton: {
    width: "28px",
    height: "28px",
    borderRadius: "10px",
    border: "1px solid rgba(34,211,238,0.24)",
    background: "rgba(34,211,238,0.08)",
    color: "#22d3ee",
    fontWeight: "900",
    cursor: "pointer",
  },

  dotsRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "7px",
    minHeight: "24px",
    marginTop: "16px",
  },

  eventDot: {
    width: "13px",
    height: "13px",
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 0 0 4px rgba(255,255,255,0.045)",
  },

  moreDots: {
    border: "none",
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.75)",
    borderRadius: "999px",
    padding: "3px 8px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "800",
  },

  dayEventCount: {
    margin: "10px 0 0",
    color: "rgba(255,255,255,0.48)",
    fontSize: "12px",
  },

  emptyBox: {
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "18px",
    padding: "22px",
    color: "rgba(255,255,255,0.72)",
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

  detailModal: {
    width: "min(720px, 100%)",
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

  detailTitleRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
  },

  detailDot: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    marginTop: "8px",
    flexShrink: 0,
  },

  modalTitle: {
    margin: 0,
    fontSize: "28px",
  },

  modalSubTitle: {
    margin: "6px 0 0",
    color: "rgba(255,255,255,0.58)",
  },

  closeButton: {
    background: "transparent",
    border: "none",
    color: "#ffffff",
    fontSize: "32px",
    cursor: "pointer",
    lineHeight: 1,
  },

  descriptionBox: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "16px",
  },

  descriptionLabel: {
    display: "block",
    color: "rgba(255,255,255,0.55)",
    marginBottom: "8px",
    fontSize: "13px",
  },

  descriptionText: {
    margin: 0,
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.82)",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px",
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

  detailActions: {
    display: "flex",
    gap: "12px",
    marginTop: "18px",
  },

  editButton: {
    flex: 1,
    background: "rgba(34,211,238,0.12)",
    color: "#22d3ee",
    border: "1px solid rgba(34,211,238,0.35)",
    borderRadius: "14px",
    padding: "13px",
    fontWeight: "800",
    cursor: "pointer",
  },

  deleteButton: {
    flex: 1,
    background: "rgba(248,113,113,0.12)",
    color: "#f87171",
    border: "1px solid rgba(248,113,113,0.35)",
    borderRadius: "14px",
    padding: "13px",
    fontWeight: "800",
    cursor: "pointer",
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
    minHeight: "120px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "14px",
    color: "#ffffff",
    outline: "none",
    resize: "vertical",
  },

  checkboxRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    color: "rgba(255,255,255,0.75)",
    marginBottom: "18px",
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

export default CalendarPage;