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

function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [loading, setLoading] = useState(false);

  const emptyForm = {
    id: "",
    title: "",
    description: "",
    startDateTime: "",
    endDateTime: "",
    allDay: false,
    colorHex: "#57d0b7",
    location: "",
  };

  const [form, setForm] = useState(emptyForm);

  const API_BASE = "http://localhost:8080/api/admin/events";
  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);

      const response = await axios.get(API_BASE, authConfig);

      setEvents(response.data || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setForm(emptyForm);
    setModalMode("create");
  };

  const openEditModal = (event) => {
    setForm({
      id: event.id || "",
      title: event.title || "",
      description: event.description || "",
      startDateTime: toInputDateTime(event.startDateTime),
      endDateTime: toInputDateTime(event.endDateTime),
      allDay: Boolean(event.allDay),
      colorHex: event.colorHex || "#57d0b7",
      location: event.location || "",
    });

    setModalMode("edit");
  };

  const viewEvent = (event) => {
    setSelectedEvent(event);
    setModalMode("view");
  };

  const buildEventBody = () => {
    return {
      title: form.title,
      description: form.description,
      startDateTime: form.startDateTime,
      endDateTime: form.endDateTime,
      allDay: form.allDay,
      colorHex: form.colorHex,
      location: form.location,
    };
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      alert("Title is required");
      return false;
    }

    if (!form.startDateTime || !form.endDateTime) {
      alert("Start and end date/time are required");
      return false;
    }

    if (new Date(form.endDateTime) < new Date(form.startDateTime)) {
      alert("End date/time must be after start date/time");
      return false;
    }

    return true;
  };

  const createEvent = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await axios.post(API_BASE, buildEventBody(), authConfig);

      closeModal();
      fetchEvents();
    } catch (error) {
      console.error(error);
      alert("Failed to create event");
    }
  };

  const updateEvent = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await axios.put(`${API_BASE}/${form.id}`, buildEventBody(), authConfig);

      closeModal();
      fetchEvents();
    } catch (error) {
      console.error(error);
      alert("Failed to update event");
    }
  };

  const deleteEvent = async (event) => {
    const confirmed = window.confirm(`Delete event: ${event.title}?`);

    if (!confirmed) return;

    try {
      await axios.delete(`${API_BASE}/${event.id}`, authConfig);

      setEvents((prev) => prev.filter((item) => item.id !== event.id));
    } catch (error) {
      console.error(error);
      alert("Failed to delete event");
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedEvent(null);
    setForm(emptyForm);
  };

  const toInputDateTime = (value) => {
    if (!value) return "";

    return String(value).slice(0, 16);
  };

  const formatDateTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value).replace("T", " ");
    }

    return date.toLocaleString();
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
    const text = `${event.title || ""} ${event.description || ""} ${
      event.location || ""
    } ${event.createdBy || ""}`.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <>
      <button style={styles.createButton} onClick={openCreateModal}>
        <AdminIcon name="plus" size={16} color="#0d131a" />
        Create Event
      </button>

      <AdminSearchBox
        placeholder="Search events..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <div style={styles.message}>Loading events...</div>}

      {!loading && filteredEvents.length === 0 && (
        <div style={styles.message}>No events found</div>
      )}

      <div style={styles.userList}>
        {filteredEvents.map((event) => (
          <div key={event.id} style={eventStyles.card}>
            <div style={eventStyles.topRow}>
              <div style={eventStyles.titleBlock}>
                <div style={eventStyles.titleRow}>
                  <span
                    style={{
                      ...eventStyles.colorDot,
                      background: event.colorHex || "#57d0b7",
                    }}
                  />

                  <div style={eventStyles.title}>
                    {event.title || "Untitled Event"}
                  </div>
                </div>

                <div style={eventStyles.timeText}>
                  {formatDateTime(event.startDateTime)}
                </div>
              </div>

              <div style={eventStyles.iconActions}>
                <AdminIconAction name="eye" onClick={() => viewEvent(event)} />
                <AdminIconAction name="edit" onClick={() => openEditModal(event)} />
                <AdminIconAction name="trash" onClick={() => deleteEvent(event)} />
              </div>
            </div>

            <div style={eventStyles.description}>
              {event.description || "No description"}
            </div>

            <div style={eventStyles.infoGrid}>
              <div style={eventStyles.infoPill}>
                End: {formatDateTime(event.endDateTime)}
              </div>

              <div style={eventStyles.infoPill}>
                {event.allDay ? "All Day" : "Timed"}
              </div>

              <div style={eventStyles.infoPill}>
                {event.location || "No location"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalMode === "view" && selectedEvent && (
        <AdminModal title="Event Details" onClose={closeModal}>
          <div style={styles.detailList}>
            <AdminDetail label="ID" value={selectedEvent.id} />
            <AdminDetail label="Title" value={selectedEvent.title} />
            <AdminDetail label="Description" value={selectedEvent.description} />
            <AdminDetail
              label="Start"
              value={formatDateTime(selectedEvent.startDateTime)}
            />
            <AdminDetail
              label="End"
              value={formatDateTime(selectedEvent.endDateTime)}
            />
            <AdminDetail
              label="All Day"
              value={selectedEvent.allDay ? "Yes" : "No"}
            />
            <AdminDetail label="Color" value={selectedEvent.colorHex} />
            <AdminDetail label="Location" value={selectedEvent.location} />
            <AdminDetail label="Owner" value={selectedEvent.ownerId} />
            <AdminDetail label="Created By" value={selectedEvent.createdBy} />
            <AdminDetail
              label="Global"
              value={selectedEvent.globalEvent ? "Yes" : "No"}
            />
            <AdminDetail
              label="Created At"
              value={formatDateTime(selectedEvent.createdAt)}
            />
            <AdminDetail
              label="Updated At"
              value={formatDateTime(selectedEvent.updatedAt)}
            />
          </div>
        </AdminModal>
      )}

      {modalMode === "create" && (
        <AdminModal title="Create Event" onClose={closeModal}>
          <EventForm
            form={form}
            setForm={setForm}
            onSubmit={createEvent}
            buttonText="Create"
          />
        </AdminModal>
      )}

      {modalMode === "edit" && (
        <AdminModal title="Update Event" onClose={closeModal}>
          <EventForm
            form={form}
            setForm={setForm}
            onSubmit={updateEvent}
            buttonText="Update"
            editing
          />
        </AdminModal>
      )}
    </>
  );
}

function EventForm({ form, setForm, onSubmit, buttonText, editing = false }) {
  return (
    <form onSubmit={onSubmit} style={styles.form}>
      {editing && <AdminInput label="ID" value={form.id} disabled />}

      <AdminInput
        label="Title"
        placeholder="Example: College Meeting"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
      />

      <AdminTextArea
        label="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />

      <AdminInput
        label="Start Date / Time"
        type="datetime-local"
        value={form.startDateTime}
        onChange={(e) => setForm({ ...form, startDateTime: e.target.value })}
        required
      />

      <AdminInput
        label="End Date / Time"
        type="datetime-local"
        value={form.endDateTime}
        onChange={(e) => setForm({ ...form, endDateTime: e.target.value })}
        required
      />

      <AdminCheckbox
        label="All Day"
        checked={form.allDay}
        onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
      />

      <label style={styles.label}>
        Color
        <input
          type="color"
          value={form.colorHex || "#57d0b7"}
          onChange={(e) => setForm({ ...form, colorHex: e.target.value })}
          style={eventStyles.colorInput}
        />
      </label>

      <AdminInput
        label="Location"
        placeholder="Example: IT Building - Hall 1"
        value={form.location}
        onChange={(e) => setForm({ ...form, location: e.target.value })}
      />

      <button type="submit" style={styles.submitButton}>
        {buttonText}
      </button>
    </form>
  );
}

const eventStyles = {
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

  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  colorDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    flexShrink: 0,
  },

  title: {
    color: "#edf1f4",
    fontSize: "15px",
    fontWeight: "700",
    lineHeight: "1.3",
    wordBreak: "break-word",
  },

  timeText: {
    color: "#8f9ba6",
    fontSize: "12px",
    marginTop: "4px",
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

  colorInput: {
    height: "38px",
    width: "100%",
    borderRadius: "10px",
    border: "1px solid #2a333d",
    background: "#0d131a",
    padding: "4px 8px",
    cursor: "pointer",
  },
};

export default AdminEvents;