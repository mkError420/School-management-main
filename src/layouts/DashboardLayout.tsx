import React, { useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import Image from "@/components/Image";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { X, ChevronLeft, ChevronRight, LogOut, Shield } from "lucide-react";

const DashboardLayoutContent: React.FC = () => {
  const { siteName, siteLogo } = useSiteSettings();
  const { user, role, logout, isImpersonating, switchRole, exitRolePreview } = useAuth();
  const { isMobileOpen, setMobileOpen, isCollapsed, toggleCollapse } = useSidebar();
  const { theme } = useTheme();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    return () => {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    };
  }, [theme]);

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-[#0b1220] overflow-hidden font-sans">
      {/* ─── Mobile Sidebar Overlay Backdrop ─────────────────────────── */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 lg:hidden ${
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* ─── Mobile Drawer (Slide in from Left) ───────────────────────── */}
      <aside
        id="mobile-navigation-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] flex flex-col bg-white dark:bg-[#111827] border-r border-gray-200 dark:border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
          <Link
            to="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 min-w-0"
          >
            <Image
              src={siteLogo || "/images/logo.png"}
              alt={siteName}
              width={34}
              height={34}
              className="rounded-xl shadow-xs shrink-0 object-contain"
            />
            <span
              className="font-bold text-gray-900 dark:text-white text-sm truncate"
              title={siteName}
            >
              {siteName}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Menu Body */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <Menu isCollapsed={false} onItemClick={() => setMobileOpen(false)} />
        </div>

        {/* Drawer Footer with User Profile & Sign Out */}
        <div className="p-3 border-t border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-2">
            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition"
            >
              <Image
                src={user?.img || "/avatar.png"}
                alt={user?.name || user?.username || "Avatar"}
                width={34}
                height={34}
                className="w-8 h-8 rounded-full ring-2 ring-[#707E94] shrink-0 object-cover"
              />
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {user?.name || user?.username || "Administrator"}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                  <Shield size={10} className="text-[#707E94]" />
                  <span className="capitalize">{role}</span>
                </div>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                logout();
              }}
              title="Sign out"
              aria-label="Sign out"
              className="p-2 rounded-xl text-gray-500 hover:text-[#D32F45] hover:bg-[#D32F45]/10 dark:text-gray-400 dark:hover:text-[#f87171] dark:hover:bg-[#D32F45]/20 transition shrink-0"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Desktop & Tablet Sidebar (Docked) ────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col h-full bg-white dark:bg-[#111827] border-r border-gray-200 dark:border-slate-800 shadow-xs transition-all duration-300 ease-in-out shrink-0 select-none ${
          isCollapsed ? "w-20 p-2.5" : "w-60 xl:w-64 p-3.5"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100 dark:border-slate-800">
          <Link
            to="/dashboard"
            className={`flex items-center gap-2.5 ${
              isCollapsed ? "justify-center w-full" : "justify-start"
            } py-1`}
          >
            <Image
              src={siteLogo || "/images/logo.png"}
              alt={siteName}
              width={32}
              height={32}
              className="rounded-xl shadow-xs shrink-0 object-contain"
            />
            {!isCollapsed && (
              <span
                className="font-bold text-gray-900 dark:text-white text-sm truncate"
                title={siteName}
              >
                {siteName}
              </span>
            )}
          </Link>
        </div>

        {/* Sidebar Menu */}
        <Menu isCollapsed={isCollapsed} />

        {/* Sidebar Collapse Toggle Footer */}
        <div className="pt-2 mt-auto border-t border-gray-100 dark:border-slate-800">
          <button
            type="button"
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex items-center ${
              isCollapsed ? "justify-center w-full" : "justify-between w-full px-2"
            } py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition`}
          >
            {!isCollapsed && <span>Collapse menu</span>}
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>

      {/* ─── Main Application Content Area ───────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {isImpersonating && (
          <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-indigo-700 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between gap-3 shadow-md z-40 shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-black/30 uppercase text-[10px] tracking-wider font-extrabold text-amber-200">
                Super Admin Role Preview
              </span>
              <span>
                বর্তমানে <strong>{role.toUpperCase()}</strong> ড্যাশবোর্ড হিসেবে প্রবেশ করেছেন ({user?.name || user?.username})
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={role}
                onChange={(e) => switchRole(e.target.value as any)}
                className="bg-black/40 border border-white/20 rounded-md px-2 py-1 text-xs text-white cursor-pointer font-medium"
              >
                <option value="super_admin" className="text-gray-900">Super Admin</option>
                <option value="admin" className="text-gray-900">School Admin</option>
                <option value="teacher" className="text-gray-900">Teacher</option>
                <option value="student" className="text-gray-900">Student</option>
                <option value="parent" className="text-gray-900">Parent</option>
              </select>
              <button
                type="button"
                onClick={() => exitRolePreview()}
                className="px-2.5 py-1 rounded-md bg-white text-gray-900 font-bold hover:bg-gray-100 transition shadow-xs text-xs cursor-pointer"
              >
                প্রস্থান করুন (Exit)
              </button>
            </div>
          </div>
        )}
        <Navbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-[#0b1220] transition-colors p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const DashboardLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <DashboardLayoutContent />
    </SidebarProvider>
  );
};

export default DashboardLayout;
