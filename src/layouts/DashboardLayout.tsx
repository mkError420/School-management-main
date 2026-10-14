import React from "react";
import { Outlet, Link } from "react-router-dom";
import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import Image from "@/components/Image";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useAuth } from "@/context/AuthContext";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { X, ChevronLeft, ChevronRight, LogOut, Shield } from "lucide-react";

const DashboardLayoutContent: React.FC = () => {
  const { siteName } = useSiteSettings();
  const { user, role, logout } = useAuth();
  const { isMobileOpen, setMobileOpen, isCollapsed, toggleCollapse } = useSidebar();

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
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 min-w-0"
          >
            <Image
              src="/logo.png"
              alt={siteName}
              width={34}
              height={34}
              className="rounded-xl shadow-xs shrink-0"
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
                src="/avatar.png"
                alt="Avatar"
                width={34}
                height={34}
                className="rounded-full ring-2 ring-[#707E94] shrink-0"
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
            to="/"
            className={`flex items-center gap-2.5 ${
              isCollapsed ? "justify-center w-full" : "justify-start"
            } py-1`}
          >
            <Image
              src="/logo.png"
              alt={siteName}
              width={32}
              height={32}
              className="rounded-xl shadow-xs shrink-0"
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
