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
        href: "/",
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

const Menu: React.FC = () => {
  const { role, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="mt-4 text-sm overflow-y-auto flex-1 pr-1 custom-scrollbar">
      {menuItems.map((section) => (
        <div className="flex flex-col gap-1.5 mb-4" key={section.title}>
          <span className="hidden lg:block text-gray-400 font-semibold text-[11px] tracking-wider my-2 uppercase">
            {section.title}
          </span>
          {section.items.map((item) => {
            if (!item.visible.includes(role) && !(hasAdminAccess(role) && item.visible.includes("admin"))) return null;

            if (item.href === "/logout") {
              return (
                <button
                  key={item.label}
                  onClick={logout}
                  className="flex items-center justify-center lg:justify-start gap-4 text-gray-600 hover:text-red-600 py-2.5 px-2 rounded-lg hover:bg-red-50 transition w-full text-left"
                >
                  <Image src={item.icon} alt="" width={18} height={18} />
                  <span className="hidden lg:block font-medium">{item.label}</span>
                </button>
              );
            }

            const isActive =
              item.href === "/"
                ? location.pathname === "/" || location.pathname === `/${role}`
                : location.pathname.startsWith(item.href);

            return (
              <Link
                to={item.href}
                key={item.label}
                className={`flex items-center justify-center lg:justify-start gap-4 py-2.5 px-2 rounded-lg transition font-medium ${
                  isActive
                    ? "bg-purple-100 text-purple-800 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Image src={item.icon} alt="" width={18} height={18} />
                <span className="hidden lg:block">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;