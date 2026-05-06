import { useState } from "react";

import AdminUsers from "../components/admin/AdminUsers";
import AdminCourses from "../components/admin/AdminCourses";
import AdminProfessors from "../components/admin/AdminProfessors";
import AdminCareers from "../components/admin/AdminCareers";
import AdminOpportunities from "../components/admin/AdminOpportunities";
import AdminEvents from "../components/admin/AdminEvents";
import AdminSchedule from "../components/admin/AdminSchedule";

import { AdminIcon } from "../components/admin/AdminShared";
import { styles } from "../components/admin/adminStyles";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");

  const tabs = [
    { id: "users", label: "Users", icon: "users" },
    { id: "courses", label: "Cour", icon: "book" },
    { id: "professors", label: "Profe", icon: "prof" },
    { id: "schedule", label: "Sched", icon: "calendar" },
    { id: "college", label: "Colle", icon: "calendar" },
    { id: "careers", label: "Caree", icon: "briefcase" },
    { id: "opps", label: "Oppc", icon: "megaphone" },
  ];

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  return (
    <div style={styles.page}>
      <div style={styles.phoneCard}>
        <div style={styles.header}>
          <div style={styles.headerSpacer} />

          <div style={styles.title}>Admin Dashboard</div>

          <div style={styles.headerIcons}>
            <button style={styles.iconButtonPlain} onClick={logout}>
              <AdminIcon name="logout" size={18} color="#d8dde3" />
            </button>
          </div>
        </div>

        <div style={styles.tabsRow}>
          {tabs.map((tab) => {
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.tabButton,
                  color: active ? "#57d0b7" : "#c5ccd2",
                }}
              >
                <AdminIcon
                  name={tab.icon}
                  size={16}
                  color={active ? "#57d0b7" : "#c5ccd2"}
                />

                <div style={styles.tabText}>{tab.label}</div>

                {active && <div style={styles.activeTabLine} />}
              </button>
            );
          })}
        </div>

        <div style={styles.body}>
          {activeTab === "users" && <AdminUsers />}

          {activeTab === "courses" && <AdminCourses />}

          {activeTab === "professors" && <AdminProfessors />}

          {activeTab === "schedule" && <AdminSchedule />}

          {activeTab === "college" && <AdminEvents />}

          {activeTab === "careers" && <AdminCareers />}

          {activeTab === "opps" && <AdminOpportunities />}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;