import React, { useEffect, useState } from "react";
import Image from "@/components/Image";
import { useAuth, UserRole } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useSidebar } from "@/context/SidebarContext";
import { Link, useLocation } from "react-router-dom";
import { LogOut, Moon, Sun, Menu as MenuIcon, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { api } from "@/lib/api";
import NavbarSearch from "@/components/NavbarSearch";

const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggleMobile, isCollapsed, toggleCollapse } = useSidebar();
  const location = useLocation();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

  useEffect(() => {
    let active = true;
    const loadUnreadCounts = async () => {
      try {
        const [msgRes, annRes] = await Promise.all([
          api.getAll("messages", { folder: "inbox" }),
          api.getAll("announcements", { action: "unread-count" }),
        ]);
        if (!active) return;
        if (msgRes.success) setUnreadMessages(Number(msgRes.data?.unread_count) || 0);
        if (annRes.success) setUnreadAnnouncements(Number(annRes.data?.unread_count) || 0);
      } catch {
        // Silently ignore transient network errors
      }
    };
    const refresh = () => { void loadUnreadCounts(); };

    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("school-messages-updated", refresh);
    window.addEventListener("school-announcements-updated", refresh);
    const interval = window.setInterval(refresh, 60000);

    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("school-messages-updated", refresh);
      window.removeEventListener("school-announcements-updated", refresh);
      window.clearInterval(interval);
    };
  }, [location.pathname, role]);

  return (
    <header className="no-print print:hidden flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 bg-white dark:bg-slate-900 shadow-xs border-b border-gray-200 dark:border-slate-800 transition-colors">
      {/* Left side: Hamburger button (mobile) / Collapse button (desktop) + Searchbar */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={toggleMobile}
          aria-label="Open sidebar menu"
          title="Open menu"
          className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
        >
          <MenuIcon size={19} />
        </button>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        {/* Searchbar */}
        <NavbarSearch />
      </div>

      {/* Right side: Icons & User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 justify-end shrink-0">
        {/* Theme switch */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          aria-pressed={theme === "dark"}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-black transition hover:bg-[#707E94]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-slate-700"
        >
          {theme === "light" ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
        </button>

        {/* Role Badge - Compact & Hidden on smallest screens */}
        <span className="hidden md:inline-flex rounded-md border border-[#707E94]/40 bg-[#707E94]/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold uppercase text-black dark:text-white">
          {role}
        </span>

        {/* Messages */}
        <Link
          to="/list/messages"
          className="relative bg-gray-100 hover:bg-[#707E94]/20 dark:bg-slate-800 dark:hover:bg-slate-700 transition rounded-full w-8 h-8 flex items-center justify-center cursor-pointer shrink-0"
          title="Messages"
        >
          <Image src="/message.png" alt="Messages" width={17} height={17} />
          {unreadMessages > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#707E94] px-1 text-[9px] font-bold text-white">
              {unreadMessages > 99 ? "99+" : unreadMessages}
            </span>
          )}
        </Link>

        {/* Announcements */}
        <Link
          to="/list/announcements"
          className="bg-gray-100 hover:bg-[#D32F45]/20 dark:bg-slate-800 dark:hover:bg-slate-700 transition rounded-full w-8 h-8 flex items-center justify-center cursor-pointer relative shrink-0"
          title="Announcements"
        >
          <Image src="/announcement.png" alt="Announcements" width={17} height={17} />
          {unreadAnnouncements > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center bg-[#D32F45] text-white rounded-full text-[9px] font-bold px-1">
              {unreadAnnouncements > 99 ? "99+" : unreadAnnouncements}
            </span>
          )}
        </Link>

        {/* User Info */}
        <div className="flex items-center gap-2 sm:gap-2.5 pl-1 sm:pl-2 border-l border-gray-200 dark:border-slate-700">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-black dark:text-white leading-tight truncate max-w-[130px]">
              {user?.name || user?.username || 'Administrator'}
            </span>
            <span className="text-[10px] text-gray-700 dark:text-gray-300 capitalize font-medium">
              {role}
            </span>
          </div>

          <Link to="/profile" title={user?.name || "My Profile"}>
            <Image
              src="/avatar.png"
              alt="Avatar"
              width={32}
              height={32}
              className="rounded-full ring-2 ring-[#707E94] hover:opacity-90 transition shrink-0"
            />
          </Link>
          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-black hover:text-[#D32F45] hover:bg-[#D32F45]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:text-[#f87171] dark:hover:bg-[#D32F45]/20 transition shrink-0"
          >
            <LogOut size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;