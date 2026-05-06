export const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a1016",
    display: "flex",
    justifyContent: "center",
    padding: "10px 0",
    boxSizing: "border-box",
  },

  phoneCard: {
    width: "100%",
    maxWidth: "380px",
    minHeight: "100vh",
    background: "#0d131a",
    color: "#edf1f5",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.03)",
    overflow: "hidden",
  },

  header: {
    height: "66px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 14px",
    borderBottom: "1px solid #202831",
  },

  headerSpacer: {
    width: "52px",
  },

  title: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#eef2f5",
  },

  headerIcons: {
    width: "52px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },

  iconButtonPlain: {
    background: "transparent",
    border: "none",
    padding: 0,
    display: "flex",
    cursor: "pointer",
  },

  tabsRow: {
    display: "flex",
    borderBottom: "1px solid #202831",
    height: "52px",
  },

  tabButton: {
    flex: 1,
    background: "transparent",
    border: "none",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    cursor: "pointer",
    padding: 0,
  },

  tabText: {
    fontSize: "11px",
    fontWeight: "500",
  },

  activeTabLine: {
    position: "absolute",
    bottom: 0,
    width: "28px",
    height: "3px",
    borderRadius: "999px",
    background: "#57d0b7",
  },

  body: {
    padding: "10px 8px 14px 8px",
  },

  placeholderBox: {
    minHeight: "120px",
    border: "1px solid #202831",
    borderRadius: "14px",
    background: "#151c24",
    padding: "14px",
  },

  placeholderTitle: {
    color: "#edf1f4",
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "6px",
  },

  createButton: {
    width: "100%",
    height: "38px",
    border: "none",
    borderRadius: "12px",
    background: "#57d0b7",
    color: "#0d131a",
    fontWeight: "700",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    cursor: "pointer",
    marginBottom: "10px",
  },

  searchBox: {
    height: "42px",
    background: "#151c24",
    border: "1px solid #28313b",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "0 12px",
    marginBottom: "12px",
  },

  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#e8edf1",
    fontSize: "14px",
  },

  userList: {
    display: "flex",
    flexDirection: "column",
  },

  userRow: {
    minHeight: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "2px 4px",
  },

  userText: {
    flex: 1,
    color: "#edf1f4",
    fontSize: "14px",
    lineHeight: "1.3",
    wordBreak: "break-word",
  },

  courseRow: {
    minHeight: "56px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "6px 4px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },

  courseTextBlock: {
    flex: 1,
    minWidth: 0,
  },

  courseTitle: {
    color: "#edf1f4",
    fontSize: "14px",
    fontWeight: "600",
    lineHeight: "1.3",
  },

  courseMeta: {
    color: "#8f9ba6",
    fontSize: "12px",
    marginTop: "3px",
  },

  userActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginLeft: "8px",
  },

  actionButton: {
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    display: "flex",
  },

  message: {
    color: "#9aa6b2",
    fontSize: "14px",
    padding: "8px 4px",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    zIndex: 999,
  },

  modalCard: {
    width: "100%",
    maxWidth: "390px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#151c24",
    border: "1px solid #2a333d",
    borderRadius: "16px",
    padding: "18px",
    position: "relative",
    color: "#edf1f4",
  },

  closeButton: {
    position: "absolute",
    top: "12px",
    right: "12px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
  },

  modalTitle: {
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "16px",
  },

  detailList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    fontSize: "14px",
  },

  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  detailLabel: {
    color: "#71d6c0",
    fontWeight: "700",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    fontSize: "13px",
    color: "#bfc9d2",
  },

  input: {
    height: "38px",
    borderRadius: "10px",
    border: "1px solid #2a333d",
    background: "#0d131a",
    color: "#edf1f4",
    padding: "0 10px",
    outline: "none",
    fontSize: "14px",
  },

  textarea: {
    minHeight: "80px",
    borderRadius: "10px",
    border: "1px solid #2a333d",
    background: "#0d131a",
    color: "#edf1f4",
    padding: "10px",
    outline: "none",
    fontSize: "14px",
    resize: "vertical",
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#bfc9d2",
    fontSize: "13px",
  },

  checkbox: {
    width: "16px",
    height: "16px",
  },

  submitButton: {
    height: "40px",
    border: "none",
    borderRadius: "12px",
    background: "#57d0b7",
    color: "#0d131a",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "6px",
  },
};