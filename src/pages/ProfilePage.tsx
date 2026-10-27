import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { GraduationCap, Users } from "lucide-react";

const ProfilePage: React.FC = () => {
  const { user, role } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    if (role === "student") {
      setLoading(true);
      api.getById<any>("students", user.id)
        .then((res) => {
          if (res.success && res.data?.student) {
            setProfileData(res.data.student);
          }
        })
        .finally(() => setLoading(false));
    } else if (role === "parent") {
      setLoading(true);
      api.getById<any>("parents", user.id)
        .then((res) => {
          if (res.success && res.data) {
            setProfileData(res.data);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [user?.id, role]);

  const studentType = profileData?.student_type || user?.student_type;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <img
            src="/avatar.png"
            alt="avatar"
            className="w-20 h-20 rounded-2xl ring-4 ring-[#707E94]/30 object-cover shadow-sm shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-black dark:text-white truncate">
                {profileData?.name && profileData?.surname
                  ? `${profileData.name} ${profileData.surname}`
                  : user?.name || user?.username}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full capitalize font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {role}
              </span>
              {studentType && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                  <GraduationCap size={12} />
                  {studentType}
                </span>
              )}
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 truncate">
              {profileData?.email || user?.email || `${user?.username}@school.com`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {[
            { label: "Username", value: user?.username },
            { label: "Role", value: role },
            { label: "User ID", value: user?.id },
            { label: "Email", value: profileData?.email || user?.email || "—" },
            ...(role === "student"
              ? [
                  { label: "Student Type", value: studentType || "—" },
                  { label: "Roll No.", value: profileData?.roll || "—" },
                  { label: "Class", value: profileData?.class_name || "—" },
                  { label: "Blood Type", value: profileData?.blood_type || "—" },
                ]
              : []),
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-3 border border-gray-100 dark:border-gray-700/60">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-1">{label}</p>
              <p className="text-sm font-semibold text-black dark:text-white capitalize truncate">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Parent's children profiles section */}
      {role === "parent" && profileData?.children && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Users size={16} className="text-[#707E94]" />
              Linked Students / Children
            </h2>
            <span className="text-xs text-gray-400 font-medium">
              {profileData.children.length} {profileData.children.length === 1 ? "Child" : "Children"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profileData.children.map((child: any) => (
              <div
                key={child.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {child.name} {child.surname}
                  </h3>
                  {child.student_type ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                      {child.student_type}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400">Regular</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span>Class: <strong className="text-gray-700 dark:text-gray-300">{child.class_name || "—"}</strong></span>
                  <span>Roll: <strong className="text-gray-700 dark:text-gray-300">{child.roll || "—"}</strong></span>
                  <span className="col-span-2">Type: <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">{child.student_type || "Standard"}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
