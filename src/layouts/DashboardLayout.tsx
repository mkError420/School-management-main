import React from "react";
import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import Image from "@/components/Image";

const DashboardLayout: React.FC = () => {
  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-3 flex flex-col h-full bg-white border-r border-gray-100 shadow-sm">
        <Link to="/" className="flex items-center justify-center lg:justify-start gap-2 py-2 mb-2">
          <Image src="/logo.png" alt="MK School" width={32} height={32} className="rounded-lg" />
          <span className="hidden lg:block font-bold text-gray-800 text-sm">MK School</span>
        </Link>
        <Menu />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
