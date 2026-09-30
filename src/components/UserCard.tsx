import React from "react";
import Image from "@/components/Image";

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

  const displayCount = count !== undefined ? String(count) : defaultCounts[type] || "0";

  return (
    <div className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow p-4 flex-1 min-w-[130px] shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600 font-semibold">
          2026/27
        </span>
        <Image src="/more.png" alt="" width={20} height={20} className="cursor-pointer" />
      </div>
      <h1 className="text-2xl font-bold my-4 text-gray-800">{displayCount}</h1>
      <h2 className="capitalize text-sm font-medium text-gray-600">{type}s</h2>
    </div>
  );
};

export default UserCard;