import React, { useEffect, useState } from "react";
import Image from "@/components/Image";
import { useAuth, UserRole } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Link, useLocation } from "react-router-dom";
import { LogOut, Moon, Sun } from "lucide-react";
import { api } from "@/lib/api";
import NavbarSearch from "@/components/NavbarSearch";

const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-800 transition-colors">
      {/* Searchbar */}
      <NavbarSearch />

      {/* Icons & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4 justify-end">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          aria-pressed={theme === "dark"}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 transition hover:bg-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-slate-700"
        >
          {theme === "light" ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
        </button>

        <span className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold uppercase text-gray-600">
          {role}
        </span>

        {/* Messages */}
        <Link
          to="/list/messages"
          className="relative bg-gray-100 hover:bg-gray-200 transition rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
          title="Messages"
        >
          <Image src="/message.png" alt="Messages" width={18} height={18} />
          {unreadMessages > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-700 px-1 text-[9px] font-bold text-white">{unreadMessages > 99 ? "99+" : unreadMessages}</span>}
        </Link>

        {/* Announcements */}
        <Link
          to="/list/announcements"
          className="bg-gray-100 hover:bg-gray-200 transition rounded-full w-8 h-8 flex items-center justify-center cursor-pointer relative"
          title="Announcements"
        >
          <Image src="/announcement.png" alt="Announcements" width={18} height={18} />
          {unreadAnnouncements > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center bg-purple-600 text-white rounded-full text-[9px] font-bold px-1">
              {unreadAnnouncements > 99 ? "99+" : unreadAnnouncements}
            </span>
          )}
        </Link>

        {/* User Info */}
        <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
          <div className="flex flex-col text-right">
            <span className="text-xs font-semibold text-gray-800 leading-tight">
              {user?.name || user?.username || 'Administrator'}
            </span>
            <span className="text-[10px] text-gray-500 capitalize font-medium">
              {role}
            </span>
          </div>

          <Link to="/profile">
            <Image
              src="/avatar.png"
              alt="Avatar"
              width={34}
              height={34}
              className="rounded-full ring-2 ring-purple-400 hover:opacity-90 transition"
            />
          </Link>
          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 transition hover:bg-gray-200"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;