import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { hasAdminAccess, useAuth } from "@/context/AuthContext";

// Layouts
import DashboardLayout from "@/layouts/DashboardLayout";

// Auth
import SignInPage from "@/pages/SignInPage";

// Dashboard pages
import AdminPage from "@/pages/dashboard/AdminPage";
import TeacherDashboardPage from "@/pages/dashboard/TeacherDashboardPage";
import StudentDashboardPage from "@/pages/dashboard/StudentDashboardPage";
import ParentDashboardPage from "@/pages/dashboard/ParentDashboardPage";

// List pages
import TeachersPage from "@/pages/list/TeachersPage";
import SingleTeacherPage from "@/pages/list/SingleTeacherPage";
import StudentsPage from "@/pages/list/StudentsPage";
import SingleStudentPage from "@/pages/list/SingleStudentPage";
import ParentsPage from "@/pages/list/ParentsPage";
import SubjectsPage from "@/pages/list/SubjectsPage";
import ClassesPage from "@/pages/list/ClassesPage";
import LessonsPage from "@/pages/list/LessonsPage";
import ExamsPage from "@/pages/list/ExamsPage";
import AssignmentsPage from "@/pages/list/AssignmentsPage";
import ResultsPage from "@/pages/list/ResultsPage";
import AttendancePage from "@/pages/list/AttendancePage";
import EventsPage from "@/pages/list/EventsPage";
import AnnouncementsPage from "@/pages/list/AnnouncementsPage";
import MessagesPage from "@/pages/list/MessagesPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import AdminUsersPage from "@/pages/AdminUsersPage";
import ClassSchedulePage from "@/pages/ClassSchedulePage";
import AdmissionsPage from "@/pages/AdmissionsPage";
import FeesPage from "@/pages/FeesPage";
import ExpensesPage from "@/pages/ExpensesPage";
import RevenuePage from "@/pages/RevenuePage";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Checking your session...</div>;
  }
  if (!isAuthenticated) return <Navigate to="/sign-in" replace />;
  return <>{children}</>;
};

const RoleDashboard: React.FC = () => {
  const { role } = useAuth();
  if (role === "teacher") return <TeacherDashboardPage />;
  if (role === "student") return <StudentDashboardPage />;
  if (role === "parent") return <ParentDashboardPage />;
  return <AdminPage />;
};

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  return role === "super_admin" ? <>{children}</> : <Navigate to="/" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  return hasAdminAccess(role) ? <>{children}</> : <Navigate to="/" replace />;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Auth */}
        <Route path="/sign-in" element={<SignInPage />} />

        {/* Protected Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RoleDashboard />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="teacher" element={<TeacherDashboardPage />} />
          <Route path="student" element={<StudentDashboardPage />} />
          <Route path="parent" element={<ParentDashboardPage />} />

          {/* List Routes */}
          <Route path="list/teachers" element={<TeachersPage />} />
          <Route path="list/teachers/:id" element={<SingleTeacherPage />} />
          <Route path="list/students" element={<StudentsPage />} />
          <Route path="list/students/:id" element={<SingleStudentPage />} />
          <Route path="list/parents" element={<ParentsPage />} />
          <Route path="list/subjects" element={<SubjectsPage />} />
          <Route path="list/classes" element={<ClassesPage />} />
          <Route path="list/lessons" element={<LessonsPage />} />
          <Route path="list/exams" element={<ExamsPage />} />
          <Route path="list/assignments" element={<AssignmentsPage />} />
          <Route path="list/results" element={<ResultsPage />} />
          <Route path="list/attendance" element={<AttendancePage />} />
          <Route path="list/events" element={<EventsPage />} />
          <Route path="list/announcements" element={<AnnouncementsPage />} />
          <Route path="list/messages" element={<MessagesPage />} />

          {/* Other */}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="admin-users" element={<SuperAdminRoute><AdminUsersPage /></SuperAdminRoute>} />
          <Route path="class-schedule" element={<ClassSchedulePage />} />
          <Route path="admissions" element={<AdmissionsPage />} />
          <Route path="fees" element={<AdminRoute><FeesPage /></AdminRoute>} />
          <Route path="expenses" element={<AdminRoute><ExpensesPage /></AdminRoute>} />
          <Route path="revenue" element={<AdminRoute><RevenuePage /></AdminRoute>} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
