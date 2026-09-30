import React, { useEffect, useState } from "react";
import UserCard from "@/components/UserCard";
import CountChart from "@/components/CountChart";
import AttendanceChart from "@/components/AttendanceChart";
import FinanceChart from "@/components/FinanceChart";
import EventCalendar from "@/components/EventCalendar";
import Announcements from "@/components/Announcements";
import { api } from "@/lib/api";

const AdminPage: React.FC = () => {
  const [counts, setCounts] = useState({ students: 0, teachers: 0, parents: 0, staff: 0 });
  const [gender, setGender] = useState({ boys: 0, girls: 0 });

  useEffect(() => {
    api.getDashboard().then((res) => {
      if (res.success && res.data) {
        setCounts(res.data.counts || {});
        setGender(res.data.gender || { boys: 0, girls: 0 });
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-2/3 flex flex-col gap-6">
        {/* User Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <UserCard type="student" count={counts.students || undefined} />
          <UserCard type="teacher" count={counts.teachers || undefined} />
          <UserCard type="parent" count={counts.parents || undefined} />
          <UserCard type="staff" count={counts.staff || undefined} />
        </div>

        {/* Charts Row */}
        <div className="flex gap-4 flex-col lg:flex-row">
          <div className="w-full lg:w-1/3 h-[450px]">
            <CountChart boys={gender.boys} girls={gender.girls} />
          </div>
          <div className="w-full lg:w-2/3 h-[450px]">
            <AttendanceChart />
          </div>
        </div>

        {/* Finance Chart */}
        <div className="w-full h-[500px]">
          <FinanceChart />
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6">
        <EventCalendar />
        <Announcements />
      </div>
    </div>
  );
};

export default AdminPage;
