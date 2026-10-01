import React, { useEffect, useState } from "react";
import Image from "@/components/Image";
import { useAuth, UserRole } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Link, useLocation } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { api } from "@/lib/api";

const Navbar: React.FC = () => {
  const { user, role, switchRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    let active = true;
    const loadUnreadCount = async () => {
      const response = await api.getAll("messages", { folder: "inbox" });
      if (active && response.success) setUnreadMessages(Number(response.data?.unread_count) || 0);
    };
    const refresh = () => { void loadUnreadCount(); };

    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("school-messages-updated", refresh);
    const interval = window.setInterval(refresh, 60000);

    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("school-messages-updated", refresh);
      window.clearInterval(interval);
    };
  }, [location.pathname, role]);

  return (
    <div className="flex items-center justify-between p-4 bg-white shadow-sm border-b border-gray-200">
      {/* Searchbar */}
      <div className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-3 py-1.5 focus-within:ring-purple-500 bg-gray-50">
        <Image src="/search.png" alt="" width={14} height={14} />
        <input
          type="text"
          placeholder="Search courses, students, teachers..."
          className="w-[220px] bg-transparent outline-none text-xs text-gray-700"
        />
      </div>

      {/* Icons & User Profile */}
      <div className="flex items-center gap-4 justify-end w-full">
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

        {/* Quick Role Switcher for Demo/Testing */}
        <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-lg px-2.5 py-1">
          <span className="text-[11px] font-semibold text-purple-700 uppercase">Role:</span>
          <select
            value={role}
            onChange={(e) => switchRole(e.target.value as UserRole)}
            className="text-xs bg-transparent font-medium text-purple-900 border-none outline-none cursor-pointer capitalize"
          >
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </select>
        </div>

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
          <div className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-purple-600 text-white rounded-full text-[10px] font-bold">
            3
          </div>
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
        </div>
      </div>
    </div>
  );
};

export default Navbar;