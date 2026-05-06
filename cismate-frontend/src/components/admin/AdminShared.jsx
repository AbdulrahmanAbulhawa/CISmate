import { styles } from "./adminStyles";

export function AdminIcon({ name, size = 18, color = "currentColor" }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (name === "users") {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (name === "book") {
    return (
      <svg {...common}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M4 4v15.5A2.5 2.5 0 0 1 6.5 22H20V6a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 6.5" />
      </svg>
    );
  }

  if (name === "prof") {
    return (
      <svg {...common}>
        <path d="M22 10 12 5 2 10l10 5 10-5Z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </svg>
    );
  }

  if (name === "briefcase") {
    return (
      <svg {...common}>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <path d="M2 13h20" />
      </svg>
    );
  }

  if (name === "megaphone") {
    return (
      <svg {...common}>
        <path d="m3 11 18-5v12L3 14v-3Z" />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
      </svg>
    );
  }

  if (name === "eye") {
    return (
      <svg {...common}>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  if (name === "edit") {
    return (
      <svg {...common}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    );
  }

  if (name === "trash") {
    return (
      <svg {...common}>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 16H6L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </svg>
    );
  }

  if (name === "logout") {
    return (
      <svg {...common}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    );
  }

  if (name === "x") {
    return (
      <svg {...common}>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );
  }

  return null;
}

export function AdminModal({ title, onClose, children }) {
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalCard}>
        <button onClick={onClose} style={styles.closeButton}>
          <AdminIcon name="x" size={18} color="#d8dde3" />
        </button>

        <div style={styles.modalTitle}>{title}</div>

        {children}
      </div>
    </div>
  );
}

export function AdminDetail({ label, value }) {
  return (
    <div style={styles.detailItem}>
      <span style={styles.detailLabel}>{label}:</span>
      <span>
        {value === null || value === undefined || value === "" ? "-" : value}
      </span>
    </div>
  );
}

export function AdminInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  disabled = false,
  required = false,
  step,
}) {
  return (
    <label style={styles.label}>
      {label}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        step={step}
        style={{
          ...styles.input,
          opacity: disabled ? 0.65 : 1,
        }}
      />
    </label>
  );
}

export function AdminTextArea({ label, value, onChange }) {
  return (
    <label style={styles.label}>
      {label}
      <textarea value={value} onChange={onChange} style={styles.textarea} />
    </label>
  );
}

export function AdminCheckbox({ label, checked, onChange }) {
  return (
    <label style={styles.checkboxLabel}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={styles.checkbox}
      />
      {label}
    </label>
  );
}

export function AdminSearchBox({ placeholder, value, onChange }) {
  return (
    <div style={styles.searchBox}>
      <AdminIcon name="search" size={16} color="#8d98a3" />

      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={styles.searchInput}
      />
    </div>
  );
}

export function AdminIconAction({ name, onClick }) {
  return (
    <button onClick={onClick} style={styles.actionButton}>
      <AdminIcon name={name} size={18} color="#bfc7ce" />
    </button>
  );
}