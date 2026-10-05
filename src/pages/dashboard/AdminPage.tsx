import React from "react";
import DashboardStatsCards from "@/components/DashboardStatsCards";
import CountChart from "@/components/CountChart";
import AttendanceChart from "@/components/AttendanceChart";
import FinanceChart from "@/components/FinanceChart";
import EventCalendar from "@/components/EventCalendar";
import Announcements from "@/components/Announcements";
import AdmissionSection from "@/components/AdmissionSection";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";

const AdminPage: React.FC = () => {
  const [gender, setGender] = useState({ boys: 0, girls: 0 });

  useEffect(() => {
    api.getDashboard().then((res) => {
      if (res.success && res.data) {
        setGender(res.data.gender || { boys: 0, girls: 0 });
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-2/3 flex flex-col gap-6">
        {/* Dynamic Top Stats Cards (People + Finance KPIs) */}
        <DashboardStatsCards />

        {/* Admissions Section - Showing last 5 applications on Home page */}
        <AdmissionSection maxItems={5} showViewAllLink />

        {/* Charts Row */}
        <div className="flex gap-4 flex-col lg:flex-row">
          <div className="w-full lg:w-1/3 h-[450px]">
            <CountChart boys={gender.boys} girls={gender.girls} />
          </div>
          <div className="w-full lg:w-2/3 h-[450px]">
            <AttendanceChart />
          </div>
        </div>

        {/* Dynamic Full Function Finance Chart */}
        <div className="w-full min-h-[520px]">
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
