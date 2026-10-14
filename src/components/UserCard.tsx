import React from "react";
import Image from "@/components/Image";
import { Link } from "react-router-dom";

interface UserCardProps {
  type: "student" | "teacher" | "parent" | "staff";
  count?: number | string;
}

const UserCard: React.FC<UserCardProps> = ({ type, count }) => {
  const defaultCounts: Record<string, string> = {
    student: "1,234",
    teacher: "84",
    parent: "956",
    staff: "32",
  };

  const targetHref =
    type === "student"
      ? "/list/students"
      : type === "teacher"
      ? "/list/teachers"
      : type === "parent"
      ? "/list/parents"
      : "/list/staff";

  const displayCount = count !== undefined ? String(count) : defaultCounts[type] || "0";

  return (
    <Link
      to={targetHref}
      className="rounded-2xl odd:bg-[#707E94] even:bg-[#D32F45] p-4 flex-1 min-w-[130px] shadow-sm hover:shadow-md transition block group cursor-pointer text-white"
    >
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white/20 text-white px-2 py-1 rounded-full font-bold">
          2026/27
        </span>
        <Image src="/more.png" alt="" width={20} height={20} className="group-hover:scale-110 transition brightness-0 invert" />
      </div>
      <h1 className="text-2xl font-bold my-4 text-white">{displayCount}</h1>
      <h2 className="capitalize text-sm font-semibold text-white/90">{type}s &rarr;</h2>
    </Link>
  );
};

export default UserCard;