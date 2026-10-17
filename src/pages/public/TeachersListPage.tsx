import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Home,
  Mail,
  Phone,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import type { SchoolTeacherMember } from "@/types/site";

export const TeachersListPage: React.FC = () => {
  const { websiteContent: content, t, lang, formatDigits } = useSiteSettings();
  const [activeCategory, setActiveCategory] = useState<string>("সকল");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const categories = [
    { key: "সকল", labelBn: "সকল", labelEn: "All" },
    { key: "শিক্ষক", labelBn: "শিক্ষক", labelEn: "Teachers" },
    { key: "প্রশাসন", labelBn: "প্রশাসন", labelEn: "Administration" },
    { key: "কর্মচারী", labelBn: "কর্মচারী", labelEn: "Staff" },
  ];

  const filteredTeachers = useMemo(() => {
    const list = Array.isArray(content.teachers) ? content.teachers : [];
    return list.filter((member) => {
      const matchCat =
        activeCategory === "সকল" ||
        member.category === activeCategory ||
        (activeCategory === "শিক্ষক" && (member.category?.includes("শিক্ষক") || member.category?.toLowerCase().includes("teacher"))) ||
        (activeCategory === "প্রশাসন" && (member.category?.includes("প্রশাসন") || member.category?.toLowerCase().includes("admin"))) ||
        (activeCategory === "কর্মচারী" && (member.category?.includes("কর্মচারী") || member.category?.toLowerCase().includes("staff")));

      const search = searchTerm.trim().toLowerCase();
      const matchSearch =
        !search ||
        member.name?.toLowerCase().includes(search) ||
        member.nameEn?.toLowerCase().includes(search) ||
        member.designation?.toLowerCase().includes(search) ||
        member.designationEn?.toLowerCase().includes(search) ||
        member.subject?.toLowerCase().includes(search) ||
        member.subjectEn?.toLowerCase().includes(search);

      return matchCat && matchSearch;
    });
  }, [content.teachers, activeCategory, searchTerm]);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <Link to="/" className="flex items-center gap-1 hover:text-[#006a4e]">
          <Home size={14} />
          <span>{t("হোম", "Home")}</span>
        </Link>
        <span>/</span>
        <span className="text-[#006a4e]">{t("শিক্ষক ও কর্মকর্তা তালিকা", "Teachers & Staff Directory")}</span>
      </nav>

      {/* Page Header */}
      <div className="rounded-lg border border-[#cbe0d3] bg-[#004d38] p-6 text-white shadow-md sm:p-8">
        <span className="rounded bg-[#eab308] px-2.5 py-1 text-xs font-bold text-gray-950">
          {t("আমাদের শিক্ষকমণ্ডলী", "Our Faculty")}
        </span>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
          {t("শিক্ষক ও কর্মকর্তা পরিচিতি", "Faculty & Staff Directory")}
        </h2>
        <p className="mt-1 text-xs text-emerald-200 sm:text-sm">
          {t(
            "অভিজ্ঞ ও নিবেদিতপ্রাণ শিক্ষকমণ্ডলীর সার্বিক তত্ত্বাবধানে পরিচালিত আমাদের বিদ্যাপীঠ",
            "Our institution is guided under the supervision of experienced and dedicated educators"
          )}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-bold transition ${
                activeCategory === cat.key
                  ? "bg-[#006a4e] text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-[#006a4e]"
              }`}
            >
              {t(cat.labelBn, cat.labelEn)}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("নাম বা বিষয় লিখে খুঁজুন...", "Search by name or subject...")}
            className="w-full rounded-md border border-[#cbe0d3] bg-[#f9fbf9] py-2 pl-8 pr-3 text-xs text-gray-900 outline-none transition focus:border-[#006a4e] focus:bg-white"
          />
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredTeachers.map((member) => (
          <div
            key={member.id}
            className="group rounded-lg border border-gray-200 bg-white p-4 text-center shadow-xs transition hover:border-[#006a4e] hover:shadow-md"
          >
            {/* Teacher Photo */}
            <div className="mx-auto h-36 w-32 overflow-hidden rounded-md border-2 border-emerald-600 bg-gray-100 shadow-xs">
              <img
                src={member.photo || "/images/avatar.png"}
                alt={t(member.name, member.nameEn)}
                className="h-full w-full object-cover transition group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = "/images/avatar.png";
                }}
              />
            </div>

            {/* Teacher Details */}
            <h4 className="mt-3 text-sm font-bold text-gray-900 group-hover:text-[#006a4e]">
              {t(member.name, member.nameEn)}
            </h4>
            <p className="text-xs font-semibold text-[#006a4e]">
              {t(member.designation, member.designationEn)}
            </p>
            <p className="mt-1 text-xs text-gray-700 font-medium">
              {t("বিষয়:", "Subject:")} {t(member.subject, member.subjectEn)}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {t(member.qualification, member.qualificationEn)}
            </p>

            {/* Contact info if available */}
            <div className="mt-3 border-t border-gray-100 pt-2 flex flex-col gap-1 text-[11px] text-gray-600">
              {member.phone && (
                <div className="flex items-center justify-center gap-1.5">
                  <Phone size={12} className="text-[#006a4e]" />
                  <span>{formatDigits(member.phone)}</span>
                </div>
              )}
              {member.email && (
                <div className="flex items-center justify-center gap-1.5">
                  <Mail size={12} className="text-[#006a4e]" />
                  <span className="truncate">{member.email}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredTeachers.length === 0 && (
          <div className="col-span-full rounded-md border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500">
            {t("কোনো শিক্ষক বা কর্মচারীর তথ্য পাওয়া যায়নি।", "No teachers or staff members found.")}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeachersListPage;
