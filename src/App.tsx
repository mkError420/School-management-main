import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { hasAdminAccess, useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

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
import StaffPage from "@/pages/StaffPage";
import WebsiteContentPage from "@/pages/WebsiteContentPage";

// Public school website layout & distinct pages
import PublicWebsiteLayout from "@/layouts/PublicWebsiteLayout";
import HomePage from "@/pages/public/HomePage";
import AboutPage from "@/pages/public/AboutPage";
import AdministrationPage from "@/pages/public/AdministrationPage";
import TeachersListPage from "@/pages/public/TeachersListPage";
import NoticesPage from "@/pages/public/NoticesPage";
import AcademicsPage from "@/pages/public/AcademicsPage";
import AdmissionPage from "@/pages/public/AdmissionPage";
import StudyCornerPage from "@/pages/public/StudyCornerPage";
import GalleryPage from "@/pages/public/GalleryPage";
import CoCurricularPage from "@/pages/public/CoCurricularPage";
import ContactPage from "@/pages/public/ContactPage";

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
  return role === "super_admin" ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  return hasAdminAccess(role) ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const ThemeRouteSync: React.FC = () => {
  const location = useLocation();
  const { theme } = useTheme();

  useEffect(() => {
    const isPublicWebsite =
      location.pathname === "/" ||
      location.pathname.startsWith("/about") ||
      location.pathname.startsWith("/administration") ||
      location.pathname.startsWith("/teachers-list") ||
      location.pathname.startsWith("/notices") ||
      location.pathname.startsWith("/academics") ||
      location.pathname.startsWith("/admission") ||
      location.pathname.startsWith("/study-corner") ||
      location.pathname.startsWith("/gallery") ||
      location.pathname.startsWith("/co-curricular") ||
      location.pathname.startsWith("/contact") ||
      location.pathname.startsWith("/sign-in");

    if (isPublicWebsite) {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    } else {
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.style.colorScheme = theme;
    }
  }, [location.pathname, theme]);

  return null;
};

const App: React.FC = () => {
  return (
    <Router>
      <ThemeRouteSync />
      <Routes>
        {/* Public school website multi-page routes */}
        <Route element={<PublicWebsiteLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/administration" element={<AdministrationPage />} />
          <Route path="/teachers-list" element={<TeachersListPage />} />
          <Route path="/notices" element={<NoticesPage />} />
          <Route path="/academics" element={<AcademicsPage />} />
          <Route path="/admission" element={<AdmissionPage />} />
          <Route path="/study-corner" element={<StudyCornerPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/co-curricular" element={<CoCurricularPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>

        {/* Auth */}
        <Route path="/sign-in" element={<SignInPage />} />

        {/* Protected Dashboard */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<RoleDashboard />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="teacher" element={<TeacherDashboardPage />} />
          <Route path="student" element={<StudentDashboardPage />} />
          <Route path="parent" element={<ParentDashboardPage />} />

          {/* List Routes */}
          <Route path="list/teachers" element={<TeachersPage />} />
          <Route path="list/teachers/:id" element={<SingleTeacherPage />} />
          <Route path="list/staff" element={<AdminRoute><StaffPage /></AdminRoute>} />
          <Route path="list/students" element={<StudentsPage />} />
          <Route path="list/students/:id" element={<SingleStudentPage />} />
          <Route path="list/parents" element={<ParentsPage />} />
          <Route path="list/subjects" element={<SubjectsPage />} />
          <Route path="list/classes" element={<ClassesPage />} />
          <Route path="list/lessons" element={<Navigate to="/class-schedule" replace />} />
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
          <Route path="website-content" element={<SuperAdminRoute><WebsiteContentPage /></SuperAdminRoute>} />
          <Route path="class-schedule" element={<ClassSchedulePage />} />
          <Route path="admissions" element={<AdmissionsPage />} />
          <Route path="fees" element={<AdminRoute><FeesPage /></AdminRoute>} />
          <Route path="expenses" element={<AdminRoute><ExpensesPage /></AdminRoute>} />
          <Route path="revenue" element={<AdminRoute><RevenuePage /></AdminRoute>} />
          <Route path="staff" element={<AdminRoute><StaffPage /></AdminRoute>} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
