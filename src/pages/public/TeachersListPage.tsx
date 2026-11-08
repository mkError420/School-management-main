import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  GraduationCap,
  HeartHandshake,
  Home,
  Mail,
  Phone,
  Quote,
  Search,
  Shield,
  Sparkles,
  UserCheck,
  Users,
  X,
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

  // Modal for viewing Principal/Vice-Principal message
  const [activeMessageModal, setActiveMessageModal] = useState<{
    title: string;
    name: string;
    role: string;
    photo: string;
    qualification?: string;
    message: string;
  } | null>(null);

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
      } catch { }

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
      } catch { }
    };

    fetchLiveDirectory().finally(() => {
      if (active) setLoadingLive(false);
    });

    return () => {
      active = false;
    };
  }, []);

  // Check if Website Content Tab 5 (Faculty & Staff Directory) has entries
  const hasWebsiteContentTeachers = Array.isArray(content.teachers) && content.teachers.length > 0;

  // Compute merged or dynamic directory
  // Priority:
  // 1. Super Admin Dashboard -> Website Content -> ৫. শিক্ষক ও কর্মকর্তা পরিচিতি (Faculty & Staff Directory)
  // 2. Database Live Staff Directory (liveStaff) fallback if content.teachers is empty
  const allTeachers: SchoolTeacherMember[] = useMemo(() => {
    // 1. Primary Dynamic Source: Website Content -> শিক্ষক ও কর্মকর্তা পরিচিতি
    if (hasWebsiteContentTeachers) {
      return content.teachers!;
    }

    // 2. Fallback: Database Live Staff Directory
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

        const desigEn =
          s.designation ||
          (isTeaching ? "Academic Teacher" : isAdmin ? "Administrative Officer" : "Staff Member");
        const desigBn = translateEnToBn(desigEn) || desigEn;

        const subjectRaw =
          s.subjects_list ||
          (Array.isArray(s.subjects) ? s.subjects.join(", ") : s.subjects) ||
          s.department ||
          (isTeaching ? "General" : "Operations");
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

      return liveMapped;
    }

    if (loadingLive && isLiveMode) {
      return [];
    }

    return [];
  }, [hasWebsiteContentTeachers, content.teachers, content.dynamicStaffDirectory, liveStaff, loadingLive]);

  // Separate Leadership (Principal & Vice-Principal) for the TOP ROW
  const { principalLeader, asstPrincipalLeader, otherTeachers } = useMemo(() => {
    const isPrincipal = (m: SchoolTeacherMember) => {
      const desig = `${m.designation} ${m.designationEn || ""}`.toLowerCase();
      const name = `${m.name} ${m.nameEn || ""}`.toLowerCase();
      const cName = `${content.principalName || ""} ${content.principalNameEn || ""}`.toLowerCase().trim();

      if (
        /(principal|headmaster|head\s*master|head\s*teacher|headmistress|প্রধান\s*শিক্ষক|অধ্যক্ষ)/i.test(desig) &&
        !/(vice|assistant|asst|সহকারী|উপাধ্যক্ষ)/i.test(desig)
      ) {
        return true;
      }
      if (cName && (name.includes(cName) || cName.includes(name))) {
        return true;
      }
      return false;
    };

    const isAsstPrincipal = (m: SchoolTeacherMember) => {
      const desig = `${m.designation} ${m.designationEn || ""}`.toLowerCase();
      const name = `${m.name} ${m.nameEn || ""}`.toLowerCase();
      const cName = `${content.asstPrincipalName || ""} ${content.asstPrincipalNameEn || ""}`.toLowerCase().trim();

      if (
        /(vice\s*principal|vice-principal|assistant\s*head|asst\.?\s*head|সহকারী\s*প্রধান\s*শিক্ষক|সহকারী\s*প্রধান|উপাধ্যক্ষ)/i.test(desig)
      ) {
        return true;
      }
      if (cName && (name.includes(cName) || cName.includes(name))) {
        return true;
      }
      return false;
    };

    const foundPrincipal = allTeachers.find(isPrincipal);
    const foundAsstPrincipal = allTeachers.find(
      (m) => m.id !== foundPrincipal?.id && isAsstPrincipal(m)
    );

    // 1. Resolve Principal / Head Teacher - Dynamic from Website Content
    const principal: SchoolTeacherMember = {
      id: foundPrincipal?.id || "leadership_principal",
      name: (content.principalName && content.principalName.trim() !== "")
        ? content.principalName.trim()
        : (foundPrincipal?.name || "মোঃ আবদুর রহমান"),
      nameEn: (content.principalNameEn && content.principalNameEn.trim() !== "")
        ? content.principalNameEn.trim()
        : (foundPrincipal?.nameEn || "Md. Abdur Rahman"),
      designation: (content.principalTitle && content.principalTitle.trim() !== "")
        ? content.principalTitle.trim()
        : (foundPrincipal?.designation || "প্রধান শিক্ষক"),
      designationEn: (content.principalTitleEn && content.principalTitleEn.trim() !== "")
        ? content.principalTitleEn.trim()
        : (foundPrincipal?.designationEn || "Headmaster / Principal"),
      subject: "প্রতিষ্ঠান প্রধান ও সার্বিক তত্ত্বাবধান",
      subjectEn: "Head of Institution & Academic Supervision",
      qualification: (content.principalQualification && content.principalQualification.trim() !== "")
        ? content.principalQualification.trim()
        : (foundPrincipal?.qualification || "বি.এস.সি (অনার্স), এম.এস.সি, বি.এড (১ম শ্রেণি)"),
      qualificationEn: (content.principalQualificationEn && content.principalQualificationEn.trim() !== "")
        ? content.principalQualificationEn.trim()
        : (foundPrincipal?.qualificationEn || "B.Sc (Hons), M.Sc, B.Ed (1st Class)"),
      photo: (content.principalPhoto && content.principalPhoto.trim() !== "" && content.principalPhoto !== "/images/avatar.png")
        ? content.principalPhoto.trim()
        : (foundPrincipal?.photo || "/images/avatar.png"),
      phone: (content.principalPhone && content.principalPhone.trim() !== "")
        ? content.principalPhone.trim()
        : (foundPrincipal?.phone || ""),
      email: (content.principalEmail && content.principalEmail.trim() !== "")
        ? content.principalEmail.trim()
        : (foundPrincipal?.email || ""),
      category: "প্রশাসন",
      message: content.principalMessage || "",
      messageEn: content.principalMessageEn || "",
    };

    // 2. Resolve Vice-Principal / Assistant Head Teacher - Dynamic from Website Content
    const asstPrincipal: SchoolTeacherMember = {
      id: foundAsstPrincipal?.id || "leadership_asst_principal",
      name: (content.asstPrincipalName && content.asstPrincipalName.trim() !== "")
        ? content.asstPrincipalName.trim()
        : (foundAsstPrincipal?.name || "মুহাম্মদ কামরুল হাসান"),
      nameEn: (content.asstPrincipalNameEn && content.asstPrincipalNameEn.trim() !== "")
        ? content.asstPrincipalNameEn.trim()
        : (foundAsstPrincipal?.nameEn || "Muhammad Kamrul Hasan"),
      designation: (content.asstPrincipalTitle && content.asstPrincipalTitle.trim() !== "")
        ? content.asstPrincipalTitle.trim()
        : (foundAsstPrincipal?.designation || "সহকারী প্রধান শিক্ষক"),
      designationEn: (content.asstPrincipalTitleEn && content.asstPrincipalTitleEn.trim() !== "")
        ? content.asstPrincipalTitleEn.trim()
        : (foundAsstPrincipal?.designationEn || "Assistant Headmaster / Vice Principal"),
      subject: "সহকারী প্রতিষ্ঠান প্রধান ও একাডেমিক সমন্বয়কারী",
      subjectEn: "Assistant Head & Academic Coordinator",
      qualification: (content.asstPrincipalQualification && content.asstPrincipalQualification.trim() !== "")
        ? content.asstPrincipalQualification.trim()
        : (foundAsstPrincipal?.qualification || "এম.এ (বাংলা), বি.এড (১ম শ্রেণি)"),
      qualificationEn: (content.asstPrincipalQualificationEn && content.asstPrincipalQualificationEn.trim() !== "")
        ? content.asstPrincipalQualificationEn.trim()
        : (foundAsstPrincipal?.qualificationEn || "M.A (Bangla), B.Ed (1st Class)"),
      photo: (content.asstPrincipalPhoto && content.asstPrincipalPhoto.trim() !== "" && content.asstPrincipalPhoto !== "/images/avatar.png")
        ? content.asstPrincipalPhoto.trim()
        : (foundAsstPrincipal?.photo || "/images/avatar.png"),
      phone: (content.asstPrincipalPhone && content.asstPrincipalPhone.trim() !== "")
        ? content.asstPrincipalPhone.trim()
        : (foundAsstPrincipal?.phone || ""),
      email: (content.asstPrincipalEmail && content.asstPrincipalEmail.trim() !== "")
        ? content.asstPrincipalEmail.trim()
        : (foundAsstPrincipal?.email || ""),
      category: "প্রশাসন",
      message: content.asstPrincipalMessage || "",
      messageEn: content.asstPrincipalMessageEn || "",
    };

    // 3. Others teachers (deduplicated: exclude leadership members)
    const isLeadershipMember = (m: SchoolTeacherMember) => {
      if (foundPrincipal?.id && m.id === foundPrincipal.id) return true;
      if (foundAsstPrincipal?.id && m.id === foundAsstPrincipal.id) return true;

      const mName = `${m.name} ${m.nameEn || ""}`.toLowerCase().trim();
      const mDesig = `${m.designation} ${m.designationEn || ""}`.toLowerCase().trim();

      const pName = (content.principalName || "").toLowerCase().trim();
      const pNameEn = (content.principalNameEn || "").toLowerCase().trim();
      const aName = (content.asstPrincipalName || "").toLowerCase().trim();
      const aNameEn = (content.asstPrincipalNameEn || "").toLowerCase().trim();

      if (pName && (mName.includes(pName) || pName.includes(mName))) return true;
      if (pNameEn && (mName.includes(pNameEn) || pNameEn.includes(mName))) return true;
      if (aName && (mName.includes(aName) || aName.includes(mName))) return true;
      if (aNameEn && (mName.includes(aNameEn) || aNameEn.includes(mName))) return true;

      if (
        /(principal|headmaster|head\s*master|head\s*teacher|headmistress|প্রধান\s*শিক্ষক|অধ্যক্ষ)/i.test(mDesig) &&
        !/(vice|assistant|asst|সহকারী|উপাধ্যক্ষ)/i.test(mDesig)
      ) {
        return true;
      }
      if (
        /(vice\s*principal|vice-principal|assistant\s*head|asst\.?\s*head|সহকারী\s*প্রধান\s*শিক্ষক|সহকারী\s*প্রধান|উপাধ্যক্ষ)/i.test(mDesig)
      ) {
        return true;
      }
      return false;
    };

    const others = allTeachers.filter((m) => !isLeadershipMember(m));

    return {
      principalLeader: principal,
      asstPrincipalLeader: asstPrincipal,
      otherTeachers: others,
    };
  }, [allTeachers, content]);

  // Categories for the under row filter
  const categories = useMemo(() => {
    const totalOthers = otherTeachers.length;
    const teachersCount = otherTeachers.filter(
      (m) =>
        m.category === "শিক্ষক" ||
        m.category?.includes("শিক্ষক") ||
        m.category?.toLowerCase?.().includes("teacher")
    ).length;
    const adminCount = otherTeachers.filter(
      (m) =>
        m.category === "প্রশাসন" ||
        m.category?.includes("প্রশাসন") ||
        m.category?.toLowerCase?.().includes("admin")
    ).length;
    const staffCount = otherTeachers.filter(
      (m) =>
        m.category === "কর্মচারী" ||
        m.category?.includes("কর্মচারী") ||
        m.category?.toLowerCase?.().includes("staff")
    ).length;

    return [
      { key: "সকল", labelBn: `সকল শিক্ষক ও স্টাফ (${formatDigits(totalOthers)})`, labelEn: `All Faculty (${totalOthers})` },
      { key: "শিক্ষক", labelBn: `শিক্ষকমণ্ডলী (${formatDigits(teachersCount)})`, labelEn: `Teachers (${teachersCount})` },
      { key: "প্রশাসন", labelBn: `প্রশাসনিক কর্মকর্তা (${formatDigits(adminCount)})`, labelEn: `Administration (${adminCount})` },
      { key: "কর্মচারী", labelBn: `কর্মচারীবৃন্দ (${formatDigits(staffCount)})`, labelEn: `Staff (${staffCount})` },
    ];
  }, [otherTeachers, formatDigits]);

  // Filtered other teachers
  const filteredOtherTeachers = useMemo(() => {
    return otherTeachers.filter((member) => {
      const matchCat =
        activeCategory === "সকল" ||
        member.category === activeCategory ||
        (activeCategory === "শিক্ষক" &&
          (member.category?.includes("শিক্ষক") || member.category?.toLowerCase().includes("teacher"))) ||
        (activeCategory === "প্রশাসন" &&
          (member.category?.includes("প্রশাসন") || member.category?.toLowerCase().includes("admin"))) ||
        (activeCategory === "কর্মচারী" &&
          (member.category?.includes("কর্মচারী") || member.category?.toLowerCase().includes("staff")));

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
  }, [otherTeachers, activeCategory, searchTerm]);

  // Check if search matches leadership
  const searchLower = searchTerm.trim().toLowerCase();
  const principalMatchesSearch =
    !searchLower ||
    principalLeader.name?.toLowerCase().includes(searchLower) ||
    principalLeader.nameEn?.toLowerCase().includes(searchLower) ||
    principalLeader.designation?.toLowerCase().includes(searchLower) ||
    principalLeader.designationEn?.toLowerCase().includes(searchLower);

  const asstPrincipalMatchesSearch =
    !searchLower ||
    asstPrincipalLeader.name?.toLowerCase().includes(searchLower) ||
    asstPrincipalLeader.nameEn?.toLowerCase().includes(searchLower) ||
    asstPrincipalLeader.designation?.toLowerCase().includes(searchLower) ||
    asstPrincipalLeader.designationEn?.toLowerCase().includes(searchLower);

  const hasAsstPrincipal = Boolean(asstPrincipalLeader.name && asstPrincipalLeader.name.trim() !== "");

  const showLeadershipTopRow =
    (activeCategory === "সকল" || activeCategory === "শিক্ষক" || activeCategory === "প্রশাসন") &&
    (principalMatchesSearch || (hasAsstPrincipal && asstPrincipalMatchesSearch));

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
      <div className="rounded-xl border border-[#cbe0d3] bg-[#004d38] p-6 text-white shadow-md sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-[#eab308] px-2.5 py-1 text-xs font-bold text-gray-950 flex items-center gap-1">
            <GraduationCap size={14} />
            <span>{t("আমাদের শিক্ষকমণ্ডলী ও প্রশাসন", "Faculty & Administration")}</span>
          </span>
          {hasWebsiteContentTeachers ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200 border border-emerald-700/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>{t("ওয়েবসাইট কনটেন্ট ডিরেক্টরি", "Website Content Directory")}</span>
            </span>
          ) : content.dynamicStaffDirectory !== false ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200 border border-emerald-700/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t("লাইভ ডিরেক্টরি", "Live Directory")}</span>
            </span>
          ) : null}
          <span className="text-xs text-emerald-200 font-medium sm:ml-auto">
            {t("মোট শিক্ষক ও কর্মী:", "Total Members:")}{" "}
            <span className="font-bold text-white">
              {!hasWebsiteContentTeachers && loadingLive && content.dynamicStaffDirectory !== false
                ? "..."
                : formatDigits((otherTeachers.length + (hasAsstPrincipal ? 2 : 1)).toString())}
            </span>{" "}
            {t("জন", "members")}
          </span>
        </div>
        <h2 className="mt-2 text-2xl font-black sm:text-3xl tracking-tight">
          {t("শিক্ষক ও কর্মকর্তা পরিচিতি", "Faculty & Staff Directory")}
        </h2>
        <p className="mt-1 text-xs text-emerald-200 sm:text-sm max-w-2xl">
          {t(
            "অভিজ্ঞ ও নিবেদিতপ্রাণ প্রতিষ্ঠান প্রধান, শিক্ষকমণ্ডলী এবং কর্মকর্তা-কর্মচারীবৃন্দের সার্বিক তত্ত্বাবধানে পরিচালিত আমাদের বিদ্যাপীঠ।",
            "Guided under the visionary leadership of our Principal, Vice-Principal, and dedicated teaching faculty and staff."
          )}
        </p>
      </div>

      {/* ======================================================== */}
      {/* 1. TOP ROW: PRINCIPAL & VICE-PRINCIPAL / ASST-HEAD TEACHER */}
      {/* ======================================================== */}
      {showLeadershipTopRow && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-emerald-600/30 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#006a4e] text-white rounded-lg shadow-xs">
                <Award size={18} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#005a40] tracking-tight">
                  {t(
                    "প্রতিষ্ঠান প্রধান ও শীর্ষ প্রশাসনিক নেতৃত্ব",
                    "Principal / Head Teacher & Vice-Principal / Assistant-Head Teacher"
                  )}
                </h3>
                <p className="text-xs text-gray-500">
                  {t(
                    "বিদ্যালয় পরিচালনা ও একাডেমিক দিকনির্দেশনায় প্রধান শিক্ষক ও সহকারী প্রধান শিক্ষক মহোদয়",
                    "Executive heads of the institution & academic administration"
                  )}
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-full shadow-2xs">
              <span>{t("শীর্ষ নেতৃত্ব", "Leadership Row")}</span>
            </span>
          </div>

          <div className={hasAsstPrincipal ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "max-w-2xl mx-auto"}>
            {/* Principal Card */}
            {principalMatchesSearch && (
              <div className="relative group rounded-2xl border-2 border-[#006a4e] bg-gradient-to-br from-emerald-50/70 via-white to-[#f4f9f6] p-5 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300">
                {/* Official Insignia Ribbon */}
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#006a4e] px-3 py-1 text-[11px] font-black text-amber-300 shadow-xs border border-emerald-700">
                    <Award size={12} className="text-amber-300" />
                    <span>{t("প্রতিষ্ঠান প্রধান", "Head of Institution")}</span>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
                  {/* Portrait Photo */}
                  <div className="shrink-0 relative">
                    <div className="h-44 w-36 overflow-hidden rounded-xl border-3 border-[#006a4e] bg-gray-100 shadow-md ring-4 ring-emerald-500/20 group-hover:ring-emerald-500/40 transition">
                      <img
                        src={principalLeader.photo || "/images/avatar.png"}
                        alt={t(principalLeader.name, principalLeader.nameEn)}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = "/images/avatar.png";
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-amber-400 text-gray-950 p-1.5 rounded-full shadow-xs border-2 border-white">
                      <Shield size={13} />
                    </div>
                  </div>

                  {/* Principal Details */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#006a4e] bg-emerald-100/80 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      {t(principalLeader.designation, principalLeader.designationEn)}
                    </span>

                    <h4 className="text-lg sm:text-xl font-black text-gray-900 group-hover:text-[#006a4e] transition truncate">
                      {t(principalLeader.name, principalLeader.nameEn)}
                    </h4>

                    {principalLeader.qualification && (
                      <p className="text-xs text-gray-600 font-medium">
                        {t(principalLeader.qualification, principalLeader.qualificationEn)}
                      </p>
                    )}

                    {principalLeader.subject && (
                      <p className="text-xs text-emerald-800 font-semibold flex items-center justify-center sm:justify-start gap-1">
                        <BookOpen size={13} className="text-[#006a4e]" />
                        <span>{t(principalLeader.subject, principalLeader.subjectEn)}</span>
                      </p>
                    )}

                    {/* Contacts */}
                    <div className="pt-2 border-t border-emerald-100/80 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-gray-700">
                      {principalLeader.phone && (
                        <div className="flex items-center gap-1 font-semibold text-gray-800">
                          <Phone size={13} className="text-[#006a4e]" />
                          <span>{formatDigits(principalLeader.phone)}</span>
                        </div>
                      )}
                      {principalLeader.email && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Mail size={13} className="text-[#006a4e]" />
                          <span className="truncate max-w-[180px]">{principalLeader.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Read Message Button */}
                    {principalLeader.message && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMessageModal({
                              title: t("প্রধান শিক্ষক মহোদয়ের বাণী", "Message from the Principal"),
                              name: t(principalLeader.name, principalLeader.nameEn),
                              role: t(principalLeader.designation, principalLeader.designationEn),
                              photo: principalLeader.photo || "/images/avatar.png",
                              qualification: t(principalLeader.qualification || "", principalLeader.qualificationEn || ""),
                              message: t(principalLeader.message || "", principalLeader.messageEn || ""),
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#006a4e] hover:bg-[#00523d] active:bg-[#003d2e] text-white text-xs font-bold shadow-xs transition transform hover:-translate-y-0.5"
                        >
                          <Quote size={13} />
                          <span>{t("বাণী পড়ুন (Read Message)", "Read Message")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Vice-Principal / Assistant Head Teacher Card */}
            {hasAsstPrincipal && asstPrincipalMatchesSearch && (
              <div className="relative group rounded-2xl border-2 border-teal-700 bg-gradient-to-br from-teal-50/70 via-white to-[#f2f8f7] p-5 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300">
                {/* Official Insignia Ribbon */}
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-800 px-3 py-1 text-[11px] font-black text-amber-200 shadow-xs border border-teal-900">
                    <UserCheck size={12} className="text-amber-200" />
                    <span>{t("সহকারী প্রতিষ্ঠান প্রধান", "Vice Head of Institution")}</span>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
                  {/* Portrait Photo */}
                  <div className="shrink-0 relative">
                    <div className="h-44 w-36 overflow-hidden rounded-xl border-3 border-teal-700 bg-gray-100 shadow-md ring-4 ring-teal-500/20 group-hover:ring-teal-500/40 transition">
                      <img
                        src={asstPrincipalLeader.photo || "/images/avatar.png"}
                        alt={t(asstPrincipalLeader.name, asstPrincipalLeader.nameEn)}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = "/images/avatar.png";
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-teal-600 text-white p-1.5 rounded-full shadow-xs border-2 border-white">
                      <Shield size={13} />
                    </div>
                  </div>

                  {/* Vice-Principal Details */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <span className="inline-block text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-100/80 px-2.5 py-0.5 rounded-md border border-teal-200">
                      {t(asstPrincipalLeader.designation, asstPrincipalLeader.designationEn)}
                    </span>

                    <h4 className="text-lg sm:text-xl font-black text-gray-900 group-hover:text-teal-800 transition truncate">
                      {t(asstPrincipalLeader.name, asstPrincipalLeader.nameEn)}
                    </h4>

                    {asstPrincipalLeader.qualification && (
                      <p className="text-xs text-gray-600 font-medium">
                        {t(asstPrincipalLeader.qualification, asstPrincipalLeader.qualificationEn)}
                      </p>
                    )}

                    {asstPrincipalLeader.subject && (
                      <p className="text-xs text-teal-900 font-semibold flex items-center justify-center sm:justify-start gap-1">
                        <BookOpen size={13} className="text-teal-700" />
                        <span>{t(asstPrincipalLeader.subject, asstPrincipalLeader.subjectEn)}</span>
                      </p>
                    )}

                    {/* Contacts */}
                    <div className="pt-2 border-t border-teal-100/80 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-gray-700">
                      {asstPrincipalLeader.phone && (
                        <div className="flex items-center gap-1 font-semibold text-gray-800">
                          <Phone size={13} className="text-teal-700" />
                          <span>{formatDigits(asstPrincipalLeader.phone)}</span>
                        </div>
                      )}
                      {asstPrincipalLeader.email && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Mail size={13} className="text-teal-700" />
                          <span className="truncate max-w-[180px]">{asstPrincipalLeader.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Read Message Button */}
                    {asstPrincipalLeader.message && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMessageModal({
                              title: t("সহকারী প্রধান শিক্ষকের বক্তব্য", "Message from Assistant Principal"),
                              name: t(asstPrincipalLeader.name, asstPrincipalLeader.nameEn),
                              role: t(asstPrincipalLeader.designation, asstPrincipalLeader.designationEn),
                              photo: asstPrincipalLeader.photo || "/images/avatar.png",
                              qualification: t(asstPrincipalLeader.qualification || "", asstPrincipalLeader.qualificationEn || ""),
                              message: t(asstPrincipalLeader.message || "", asstPrincipalLeader.messageEn || ""),
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-xs transition transform hover:-translate-y-0.5"
                        >
                          <Quote size={13} />
                          <span>{t("বক্তব্য পড়ুন (Read Message)", "Read Message")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 2. UNDER ROW: OTHER TEACHERS, FACULTY & STAFF */}
      {/* ======================================================== */}
      <section className="space-y-5 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-gray-200 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-800 text-white rounded-lg shadow-xs">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                {t("অনান্য শিক্ষকমণ্ডলী ও স্টাফবৃন্দ", "Other Teachers & Staff Members")}
              </h3>
              <p className="text-xs text-gray-500">
                {t(
                  "শ্রেণিকক্ষে পাঠদানকারী সম্মানিত শিক্ষকবৃন্দ ও সার্বিক পরিচালনায় নিয়োজিত স্টাফ",
                  "Teaching faculty, subject specialists & administrative support staff"
                )}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-gray-100 text-gray-700 rounded-full border border-gray-200">
            {formatDigits(filteredOtherTeachers.length.toString())} {t("জন সদস্য", "members")}
          </span>
        </div>

        {/* Filter Tabs and Search Bar */}
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${activeCategory === cat.key
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
              placeholder={t("নাম, পদবি বা বিষয় লিখে খুঁজুন...", "Search other teachers by name...")}
              className="w-full rounded-lg border border-[#cbe0d3] bg-[#f9fbf9] py-2 pl-8 pr-3 text-xs text-gray-900 outline-none transition focus:border-[#006a4e] focus:bg-white"
            />
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Other Teachers Grid (Mobile: 2 columns in one row) */}
        {!hasWebsiteContentTeachers && loadingLive && content.dynamicStaffDirectory !== false ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-gray-200 bg-white p-3 sm:p-4 text-center shadow-xs"
              >
                <div className="mx-auto h-28 w-24 sm:h-36 sm:w-32 rounded-lg bg-gray-200" />
                <div className="mx-auto mt-2 sm:mt-3 h-3.5 sm:h-4 w-20 sm:w-28 rounded bg-gray-200" />
                <div className="mx-auto mt-1.5 sm:mt-2 h-2.5 sm:h-3 w-16 sm:w-20 rounded bg-gray-200" />
                <div className="mx-auto mt-1.5 sm:mt-2 h-2.5 sm:h-3 w-24 sm:w-32 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredOtherTeachers.map((member) => (
              <div
                key={member.id}
                className="group rounded-xl border border-gray-200 bg-white p-2.5 sm:p-4 text-center shadow-xs transition hover:border-[#006a4e] hover:shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Teacher Photo */}
                  <div className="mx-auto h-28 w-24 sm:h-36 sm:w-32 overflow-hidden rounded-lg sm:rounded-xl border-2 border-emerald-600 bg-gray-100 shadow-xs mb-2 sm:mb-3">
                    <img
                      src={member.photo || "/images/avatar.png"}
                      alt={t(member.name, member.nameEn)}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = "/images/avatar.png";
                      }}
                    />
                  </div>

                  {/* Category Pill Tag */}
                  <div className="mb-1.5 sm:mb-2 flex justify-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-bold ${member.category === "শিক্ষক" || member.category?.includes("শিক্ষক")
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
                      <span className="truncate">
                        {member.category === "শিক্ষক" || member.category?.includes("শিক্ষক")
                          ? t("শিক্ষক", "Teacher")
                          : member.category === "প্রশাসন" || member.category?.includes("প্রশাসন")
                            ? t("প্রশাসন", "Administration")
                            : t("কর্মচারী", "Staff")}
                      </span>
                    </span>
                  </div>

                  {/* Teacher Details */}
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#006a4e] transition truncate">
                    {t(member.name, member.nameEn)}
                  </h4>

                  <p className="text-[10px] sm:text-xs font-semibold text-[#006a4e] mt-0.5 truncate">
                    {t(member.designation, member.designationEn)}
                  </p>

                  {member.subject && member.subject.trim() !== "" && (
                    <p className="mt-1 text-[10px] sm:text-xs text-gray-700 font-medium line-clamp-1">
                      {t("বিষয়:", "Subject:")} {t(member.subject, member.subjectEn)}
                    </p>
                  )}

                  {member.qualification && member.qualification.trim() !== "" && (
                    <p className="text-[9px] sm:text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                      {t(member.qualification, member.qualificationEn)}
                    </p>
                  )}
                </div>

                {/* Contact info if available */}
                <div className="mt-2.5 sm:mt-3 border-t border-gray-100 pt-1.5 sm:pt-2 flex flex-col gap-1 text-[10px] sm:text-[11px] text-gray-600">
                  {member.phone && (
                    <div className="flex items-center justify-center gap-1 font-medium truncate">
                      <Phone size={11} className="text-[#006a4e] shrink-0" />
                      <span className="truncate">{formatDigits(member.phone)}</span>
                    </div>
                  )}
                  {member.email && (
                    <div className="flex items-center justify-center gap-1 truncate">
                      <Mail size={11} className="text-[#006a4e] shrink-0" />
                      <span className="truncate max-w-[110px] sm:max-w-[170px]">{member.email}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredOtherTeachers.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500 bg-gray-50/50">
                {t("এই বিভাগে কোনো শিক্ষক বা কর্মচারীর তথ্য পাওয়া যায়নি।", "No teachers or staff members found in this category.")}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Leadership Message Modal */}
      {activeMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-[#004d38] p-4 text-white">
              <div className="flex items-center gap-2">
                <Quote size={20} className="text-amber-300" />
                <h3 className="text-base font-bold">{activeMessageModal.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveMessageModal(null)}
                className="p-1 hover:bg-emerald-900 rounded-lg transition text-white/80 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                <img
                  src={activeMessageModal.photo}
                  alt={activeMessageModal.name}
                  className="w-16 h-20 rounded-lg object-cover border-2 border-[#006a4e] shadow-xs"
                />
                <div>
                  <h4 className="text-base font-bold text-gray-900">{activeMessageModal.name}</h4>
                  <p className="text-xs font-semibold text-[#006a4e]">{activeMessageModal.role}</p>
                  {activeMessageModal.qualification && (
                    <p className="text-xs text-gray-500">{activeMessageModal.qualification}</p>
                  )}
                </div>
              </div>

              <div className="bg-[#f9fbf9] p-5 rounded-xl border-l-4 border-[#006a4e] text-sm leading-relaxed text-gray-800 italic">
                “{activeMessageModal.message}”
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveMessageModal(null)}
                className="px-4 py-2 bg-[#006a4e] hover:bg-[#005a40] text-white rounded-lg text-xs font-bold transition"
              >
                {t("বন্ধ করুন", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersListPage;
