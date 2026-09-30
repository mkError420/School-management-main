import React from "react";
import { useAuth } from "@/context/AuthContext";

const ProfilePage: React.FC = () => {
  const { user, role } = useAuth();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <img
            src="/avatar.png"
            alt="avatar"
            className="w-20 h-20 rounded-full ring-4 ring-purple-200 object-cover"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-800">{user?.name || user?.username}</h1>
            <p className="text-gray-500 text-sm capitalize">{role}</p>
            <p className="text-gray-400 text-xs mt-1">{user?.email || `${user?.username}@school.com`}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Username", value: user?.username },
            { label: "Role", value: role },
            { label: "User ID", value: user?.id },
            { label: "Email", value: user?.email || "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
              <p className="text-sm font-semibold text-gray-800 capitalize">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
