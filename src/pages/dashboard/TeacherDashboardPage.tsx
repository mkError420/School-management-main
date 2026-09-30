import React from "react";
import BigCalendar from "@/components/BigCalendar";
import Announcements from "@/components/Announcements";

const TeacherDashboardPage: React.FC = () => (
  <div className="flex-1 p-4 flex gap-4 flex-col xl:flex-row">
    <div className="w-full xl:w-2/3">
      <div className="h-full bg-white p-4 rounded-2xl shadow-sm">
        <h1 className="text-lg font-semibold text-gray-800 mb-3">My Teaching Schedule</h1>
        <BigCalendar />
      </div>
    </div>
    <div className="w-full xl:w-1/3 flex flex-col gap-6">
      <Announcements />
    </div>
  </div>
);

export default TeacherDashboardPage;
