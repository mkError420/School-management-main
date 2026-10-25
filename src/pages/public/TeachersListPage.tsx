import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  HeartHandshake,
  Home,
  Mail,
  Phone,
  Search,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import type { SchoolTeacherMember } from "@/types/site";
import { api } from "@/lib/api";
import { translateEnToBn } from "@/lib/translation";

export const TeachersListPage: React.FC = () => {
  const { websiteContent: content, t, lang, formatDigits } = useSiteSettings();
  const [activeCategory, setActiveCategory] = useState<string>("সকল");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [liveStaff, setLiveStaff] = useState<any[]>([]);
  const [loadingLive, setLoadingLive] = useState<boolean>(true);

  // Fetch live staff & faculty directory from database
  useEffect(() => {
    let active = true;
    const fetchLiveDirectory = async () => {
      try {
        const res = await api.getPublicStaffDirectory();
        if (active && res.success && Array.isArray(res.data?.staff) && res.data.staff.length > 0) {
          setLiveStaff(res.data.staff);
          return;
        }
      } catch {}

      // Fallback to local storage cache if available
      try {
        const stored = localStorage.getItem("mk_school_staff_list");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (active && Array.isArray(parsed) && parsed.length > 0) {
            setLiveStaff(parsed);
            return;
          }
        }
      } catch {}
    };

    fetchLiveDirectory().finally(() => {
      if (active) setLoadingLive(false);
    });

    return () => {
      active = false;
    };
  }, []);

  // Compute merged or dynamic directory
  const allTeachers: SchoolTeacherMember[] = useMemo(() => {
    const isLiveMode = content.dynamicStaffDirectory !== false;

    if (isLiveMode && liveStaff.length > 0) {
      const liveMapped: SchoolTeacherMember[] = liveStaff.map((s, idx) => {
        const firstName = (s.name || "").trim();
        const surName = (s.surname || "").trim();
        const fullNameEn = surName ? `${firstName} ${surName}` : firstName;
        const fullNameBn = translateEnToBn(fullNameEn) || fullNameEn;

        const isTeaching = s.type === "TEACHING";
        const isAdmin = s.type === "ADMINISTRATIVE";
        const category: "শিক্ষক" | "প্রশাসন" | "কর্মচারী" = isTeaching
          ? "শিক্ষক"
          : isAdmin
          ? "প্রশাসন"
          : "কর্মচারী";

        const desigEn = s.designation || (isTeaching ? "Academic Teacher" : isAdmin ? "Administrative Officer" : "Staff Member");
        const desigBn = translateEnToBn(desigEn) || desigEn;

        const subjectRaw = s.subjects_list || (Array.isArray(s.subjects) ? s.subjects.join(", ") : s.subjects) || s.department || (isTeaching ? "General" : "Operations");
        const subjectEn = String(subjectRaw);
        const subjectBn = translateEnToBn(subjectEn) || subjectEn;

        const qualEn = s.qualification || (isTeaching ? "B.Ed / M.Ed" : "Diploma / Graduate");
        const qualBn = translateEnToBn(qualEn) || qualEn;

        return {
          id: s.id ? `stf_${s.id}` : `t_live_${idx + 1}`,
          name: fullNameBn,
          nameEn: fullNameEn,
          designation: desigBn,
          designationEn: desigEn,
          subject: subjectBn,
          subjectEn: subjectEn,
          qualification: qualBn,
          qualificationEn: qualEn,
          phone: s.phone || "",
          email: s.email || "",
          photo: s.img || "/images/avatar.png",
          category,
        };
      });

      // Merge with custom configured teachers from content if not already present
      const customList = Array.isArray(content.teachers) ? content.teachers : [];
      const merged = [...liveMapped];
      for (const custom of customList) {
        const exists = merged.some(
          (m) =>
            (m.email && custom.email && m.email.toLowerCase() === custom.email.toLowerCase()) ||
            (m.nameEn && custom.nameEn && m.nameEn.toLowerCase() === custom.nameEn.toLowerCase())
        );
        if (!exists) {
          merged.push(custom);
        }
      }
      return merged;
    }

    return Array.isArray(content.teachers) && content.teachers.length > 0
      ? content.teachers
      : [];
  }, [content.dynamicStaffDirectory, content.teachers, liveStaff]);

  const categories = useMemo(() => {
    const totalAll = allTeachers.length;
    const teachersCount = allTeachers.filter(
      (m) => m.category === "শিক্ষক" || m.category?.includes("শিক্ষক") || m.category?.toLowerCase?.().includes("teacher")
    ).length;
    const adminCount = allTeachers.filter(
      (m) => m.category === "প্রশাসন" || m.category?.includes("প্রশাসন") || m.category?.toLowerCase?.().includes("admin")
    ).length;
    const staffCount = allTeachers.filter(
      (m) => m.category === "কর্মচারী" || m.category?.includes("কর্মচারী") || m.category?.toLowerCase?.().includes("staff")
    ).length;

    return [
      { key: "সকল", labelBn: `সকল (${formatDigits(totalAll)})`, labelEn: `All (${totalAll})` },
      { key: "শিক্ষক", labelBn: `শিক্ষক (${formatDigits(teachersCount)})`, labelEn: `Teachers (${teachersCount})` },
      { key: "প্রশাসন", labelBn: `প্রশাসন (${formatDigits(adminCount)})`, labelEn: `Administration (${adminCount})` },
      { key: "কর্মচারী", labelBn: `কর্মচারী (${formatDigits(staffCount)})`, labelEn: `Staff (${staffCount})` },
    ];
  }, [allTeachers, formatDigits]);

  const filteredTeachers = useMemo(() => {
    return allTeachers.filter((member) => {
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
  }, [allTeachers, activeCategory, searchTerm]);

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
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-[#eab308] px-2.5 py-1 text-xs font-bold text-gray-950">
            {t("আমাদের শিক্ষকমণ্ডলী ও স্টাফ", "Our Faculty & Staff")}
          </span>
          {content.dynamicStaffDirectory !== false && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200 border border-emerald-700/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t("লাইভ ডিরেক্টরি", "Live Directory")}</span>
            </span>
          )}
          <span className="text-xs text-emerald-200 font-medium sm:ml-auto">
            {t("মোট কর্মী:", "Total Members:")} <span className="font-bold text-white">{formatDigits(allTeachers.length)}</span> {t("জন", "members")}
          </span>
        </div>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
          {t("শিক্ষক ও কর্মকর্তা পরিচিতি", "Faculty & Staff Directory")}
        </h2>
        <p className="mt-1 text-xs text-emerald-200 sm:text-sm">
          {t(
            "অভিজ্ঞ ও নিবেদিতপ্রাণ শিক্ষক এবং কর্মকর্তা-কর্মচারীবৃন্দের সার্বিক তত্ত্বাবধানে পরিচালিত আমাদের বিদ্যাপীঠ",
            "Guided and managed under the dedicated supervision of our experienced teaching faculty and staff"
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

            {/* Category Pill Tag */}
            <div className="mb-2.5 flex justify-center">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  member.category === "শিক্ষক" || member.category?.includes("শিক্ষক")
                    ? "bg-emerald-50 text-[#006a4e] border border-emerald-200"
                    : member.category === "প্রশাসন" || member.category?.includes("প্রশাসন")
                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                    : "bg-teal-50 text-teal-700 border border-teal-200"
                }`}
              >
                {member.category === "শিক্ষক" || member.category?.includes("শিক্ষক") ? (
                  <GraduationCap size={10} />
                ) : member.category === "প্রশাসন" || member.category?.includes("প্রশাসন") ? (
                  <Shield size={10} />
                ) : (
                  <HeartHandshake size={10} />
                )}
                <span>
                  {member.category === "শিক্ষক" || member.category?.includes("শিক্ষক")
                    ? t("শিক্ষক", "Teacher")
                    : member.category === "প্রশাসন" || member.category?.includes("প্রশাসন")
                    ? t("প্রশাসন", "Administration")
                    : t("কর্মচারী", "Staff")}
                </span>
              </span>
            </div>

            {/* Teacher Details */}
            <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#006a4e] transition">
              {t(member.name, member.nameEn)}
            </h4>
            <p className="text-xs font-semibold text-[#006a4e] mt-0.5">
              {t(member.designation, member.designationEn)}
            </p>
            {member.subject && member.subject.trim() !== "" && (
              <p className="mt-1 text-xs text-gray-700 font-medium">
                {t("বিষয় / বিভাগ:", "Subject / Dept:")} {t(member.subject, member.subjectEn)}
              </p>
            )}
            {member.qualification && member.qualification.trim() !== "" && (
              <p className="text-[11px] text-gray-500 mt-0.5">
                {t(member.qualification, member.qualificationEn)}
              </p>
            )}

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
