import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import ChatbotPage from "./pages/ChatbotPage";
import CareersPage from "./pages/CareersPage";
import CommunityPage from "./pages/CommunityPage";
import CalendarPage from "./pages/CalendarPage";
import GpaPage from "./pages/GpaPage";
import UpdateInfoPage from "./pages/UpdateInfoPage";
import ScheduleGeneratorPage from "./pages/ScheduleGeneratorPage";
import AdminDashboard from "./pages/AdminDashboard";
import StudyPlanPage from "./pages/StudyPlanPage";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* User routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <ExplorePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chatbot"
          element={
            <ProtectedRoute>
              <ChatbotPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/careers"
          element={
            <ProtectedRoute>
              <CareersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <CommunityPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/gpa"
          element={
            <ProtectedRoute>
              <GpaPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/update-info"
          element={
            <ProtectedRoute>
              <UpdateInfoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/schedule-generator"
          element={
            <ProtectedRoute>
              <ScheduleGeneratorPage />
            </ProtectedRoute>
          }
        />

        {/* Admin dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
  path="/study-plan"
  element={
    <ProtectedRoute>
      <StudyPlanPage />
    </ProtectedRoute>
  }
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;