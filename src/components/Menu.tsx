import React from "react";
import Image from "@/components/Image";
import { Link, useLocation } from "react-router-dom";
import { hasAdminAccess, useAuth } from "@/context/AuthContext";

const menuItems = [
  {
    title: "DASHBOARD",
    items: [
      {
        icon: "/home.png",
        label: "Home",
        href: "/dashboard",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/calendar.png",
        label: "Class Schedule",
        href: "/class-schedule",
        visible: ["admin", "teacher", "student", "parent"],
      },
    ],
  },
  {
    title: "ACADEMICS",
    items: [
      {
        icon: "/teacher.png",
        label: "Teachers",
        href: "/list/teachers",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/teacher.png",
        label: "Staff",
        href: "/list/staff",
        visible: ["admin", "super_admin"],
      },
      {
        icon: "/student.png",
        label: "Students",
        href: "/list/students",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/student.png",
        label: "Admissions",
        href: "/admissions",
        visible: ["admin"],
      },
      {
        icon: "/parent.png",
        label: "Parents",
        href: "/list/parents",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/subject.png",
        label: "Subjects",
        href: "/list/subjects",
        visible: ["admin"],
      },
      {
        icon: "/class.png",
        label: "Classes",
        href: "/list/classes",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/lesson.png",
        label: "Lessons",
        href: "/list/lessons",
        visible: ["admin", "teacher"],
      },
    ],
  },
  {
    title: "FINANCE",
    items: [
      {
        icon: "/finance.png",
        label: "Fees",
        href: "/fees",
        visible: ["admin", "super_admin"],
      },
      {
        icon: "/finance.png",
        label: "Expenses",
        href: "/expenses",
        visible: ["admin", "super_admin"],
      },
      {
        icon: "/finance.png",
        label: "Revenue",
        href: "/revenue",
        visible: ["admin", "super_admin"],
      },
    ],
  },
  {
    title: "ASSESSMENT",
    items: [
      {
        icon: "/exam.png",
        label: "Exams",
        href: "/list/exams",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/assignment.png",
        label: "Assignments",
        href: "/list/assignments",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/result.png",
        label: "Results",
        href: "/list/results",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/attendance.png",
        label: "Attendance",
        href: "/list/attendance",
        visible: ["admin", "teacher", "student", "parent"],
      },
    ],
  },
  {
    title: "COMMUNICATION",
    items: [
      {
        icon: "/calendar.png",
        label: "Events",
        href: "/list/events",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/message.png",
        label: "Messages",
        href: "/list/messages",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/list/announcements",
        visible: ["admin", "teacher", "student", "parent"],
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        icon: "/setting.png",
        label: "All Role",
        href: "/admin-users",
        visible: ["super_admin"],
      },
      {
        icon: "/setting.png",
        label: "Website content",
        href: "/website-content",
        visible: ["super_admin"],
      },
      {
        icon: "/profile.png",
        label: "Profile",
        href: "/profile",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/settings",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/logout.png",
        label: "Logout",
        href: "/logout",
        visible: ["admin", "teacher", "student", "parent"],
      },
    ],
  },
];

interface MenuProps {
  isCollapsed?: boolean;
  onItemClick?: () => void;
}

const Menu: React.FC<MenuProps> = ({ isCollapsed = false, onItemClick }) => {
  const { role, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="mt-2 text-sm overflow-y-auto flex-1 pr-1 custom-scrollbar">
      {menuItems.map((section) => {
        // Check if at least one item in section is visible
        const visibleItems = section.items.filter(
          (item) => item.visible.includes(role) || (hasAdminAccess(role) && item.visible.includes("admin"))
        );
        if (visibleItems.length === 0) return null;

        return (
          <div className="flex flex-col gap-1 mb-3" key={section.title}>
            {isCollapsed ? (
              <div className="my-1.5 border-t border-gray-200 dark:border-slate-800" title={section.title} />
            ) : (
              <span className="text-[#707E94] dark:text-[#a4b3c7] font-bold text-[11px] tracking-wider my-1.5 px-2 uppercase select-none">
                {section.title}
              </span>
            )}

            {visibleItems.map((item) => {
              if (item.href === "/logout") {
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      logout();
                      onItemClick?.();
                    }}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center ${
                      isCollapsed ? "justify-center px-2" : "justify-start gap-3.5 px-2.5"
                    } text-black dark:text-white hover:text-[#D32F45] dark:hover:text-[#f87171] py-2.5 rounded-xl hover:bg-[#D32F45]/10 dark:hover:bg-[#D32F45]/20 transition w-full text-left font-medium group`}
                  >
                    <Image src={item.icon} alt="" width={18} height={18} className="shrink-0" />
                    {!isCollapsed && <span className="font-medium text-xs truncate">{item.label}</span>}
                  </button>
                );
              }

              const isActive =
                item.href === "/dashboard"
                  ? location.pathname === "/dashboard" || location.pathname === `/${role}`
                  : location.pathname.startsWith(item.href);

              return (
                <Link
                  to={item.href}
                  key={item.label}
                  onClick={() => onItemClick?.()}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center ${
                    isCollapsed ? "justify-center px-2" : "justify-start gap-3.5 px-2.5"
                  } py-2.5 rounded-xl transition font-medium text-xs ${
                    isActive
                      ? "bg-[#707E94] text-white shadow-xs font-semibold"
                      : "text-black dark:text-white hover:bg-[#707E94]/10 hover:text-[#707E94] dark:hover:bg-[#707E94]/20 dark:hover:text-white"
                  }`}
                >
                  <Image src={item.icon} alt="" width={18} height={18} className="shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default Menu;