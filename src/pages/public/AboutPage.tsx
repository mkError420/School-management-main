import React from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Compass,
  GraduationCap,
  HeartHandshake,
  Home,
  School,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export const AboutPage: React.FC = () => {
  const { websiteContent: content, t, lang, formatDigits, liveCounts } = useSiteSettings();

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <Link to="/" className="flex items-center gap-1 hover:text-[#006a4e]">
          <Home size={14} />
          <span>{t("হোম", "Home")}</span>
        </Link>
        <span>/</span>
        <span className="text-[#006a4e]">{t("আমাদের পরিচিতি ও ইতিহাস", "About Us & History")}</span>
      </nav>

      {/* Page Header */}
      <div className="rounded-lg border border-[#cbe0d3] bg-[#004d38] p-6 text-white shadow-md sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="rounded bg-[#eab308] px-2.5 py-1 text-xs font-bold text-gray-950">
              {t("বিদ্যালয় ইতিহাস ও পরিচিতি", "School History & Profile")}
            </span>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              {t(content.aboutTitle, content.aboutTitleEn) || t("জ্ঞানচর্চা ও শ্রেষ্ঠত্বের গৌরবময় ঐতিহ্য", "A Glorious Tradition of Knowledge & Excellence")}
            </h2>
            <p className="mt-1 text-xs text-emerald-200 sm:text-sm">
              {(lang === "en" ? content.schoolName : (content.schoolNameBn || content.schoolName))} · {t("স্থাপিত:", "Est.:")} {formatDigits(content.establishedYear)} · EIIN: {formatDigits(content.eiin)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
        <div className="space-y-7 lg:col-span-8">
          {/* Detailed About & History */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
            <h3 className="text-lg font-bold text-[#005a40] border-b pb-3">
              {t("আমাদের গৌরবময় পথচলা", "Our Glorious Journey")}
            </h3>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-700">
              <p>{t(content.aboutText, content.aboutTextEn)}</p>
              <div className="rounded-md border-l-4 border-[#006a4e] bg-[#f9fbf9] p-4 text-gray-800">
                <p className="font-semibold text-xs text-[#006a4e] uppercase tracking-wider mb-1">
                  {t("ইতিহাসের সূচনা", "The Beginning")}
                </p>
                <p>{t(content.historyText, content.historyTextEn)}</p>
              </div>
              <p>{t(content.campusOverview, content.campusOverviewEn)}</p>
            </div>
          </section>

          {/* Mission & Vision */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-emerald-200 bg-[#f4f9f6] p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#006a4e]">
                <h4>{t("আমাদের লক্ষ্য (Mission)", "Our Mission")}</h4>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-gray-700">
                {t(content.missionText, content.missionTextEn)}
              </p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-[#fefce8] p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <h4>{t("আমাদের দৃষ্টিভঙ্গি (Vision)", "Our Vision")}</h4>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-gray-700">
                {t(content.visionText, content.visionTextEn)}
              </p>
            </div>
          </section>

          {/* Campus Facilities */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
            <h3 className="text-lg font-bold text-[#005a40] border-b pb-3">
              {t("ক্যাম্পাস ও আধুনিক সুযোগ-সুবিধা", "Campus & Modern Facilities")}
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(content.campusFacilities || [])
                .filter((item) => item.titleBn?.trim() || item.titleEn?.trim())
                .map((item, idx) => (
                <div key={idx} className="rounded-md border border-gray-100 bg-[#fdfdfd] p-3.5">
                  <h5 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[#006a4e]" />
                    <span>{t(item.titleBn, item.titleEn)}</span>
                  </h5>
                  <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                    {t(item.descriptionBn, item.descriptionEn)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:col-span-4">
          {/* Institutional Stats */}
          <div className="rounded-lg border border-[#cbe0d3] bg-white p-5 shadow-xs">
            <h4 className="font-bold text-[#006a4e] border-b pb-2 text-sm">
              {t("এক নজরে বিদ্যালয়", "School at a Glance")}
            </h4>
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">{t("প্রতিষ্ঠা সন:", "Established:")}</span>
                <span className="font-bold text-gray-900">{formatDigits(content.establishedYear)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">{t("EIIN নম্বর:", "EIIN Number:")}</span>
                <span className="font-bold text-gray-900">{formatDigits(content.eiin)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">{t("বিদ্যালয় কোড:", "School Code:")}</span>
                <span className="font-bold text-gray-900">{formatDigits(content.schoolCode)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">{t("শিক্ষা বোর্ড:", "Education Board:")}</span>
                <span className="font-bold text-gray-900">{t(content.boardName, content.boardNameEn)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">{t("মোট শিক্ষার্থী:", "Total Students:")}</span>
                <span className="font-bold text-[#006a4e]">
                  {liveCounts && typeof liveCounts.students === "number"
                    ? formatDigits(liveCounts.students.toLocaleString())
                    : formatDigits(content.studentCount)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">{t("শিক্ষক সংখ্যা:", "Total Teachers:")}</span>
                <span className="font-bold text-[#006a4e]">
                  {liveCounts && typeof liveCounts.teachers === "number"
                    ? formatDigits(liveCounts.teachers.toLocaleString())
                    : formatDigits(content.teacherCount)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">{t("কর্মচারী সংখ্যা:", "Total Staff:")}</span>
                <span className="font-bold text-gray-900">
                  {liveCounts && typeof liveCounts.staff === "number"
                    ? formatDigits(liveCounts.staff.toLocaleString())
                    : formatDigits(content.staffCount)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">{t("পাসের হার:", "Pass Rate:")}</span>
                <span className="font-bold text-emerald-700">{formatDigits(content.passRate)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">{t("জিপিএ-৫ প্রাপ্তি:", "GPA-5 Achieved:")}</span>
                <span className="font-bold text-emerald-700">{formatDigits(content.gpa5Count)}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="rounded-lg border border-[#cbe0d3] bg-white p-5 shadow-xs">
            <h4 className="font-bold text-[#006a4e] border-b pb-2 text-sm">
              {t("প্রয়োজনীয় পেজসমূহ", "Important Links")}
            </h4>
            <div className="mt-3 space-y-2 text-xs font-semibold">
              <Link to="/administration" className="block p-2 rounded hover:bg-emerald-50 text-[#006a4e]">
                {t("→ প্রশাসন ও প্রধান শিক্ষকের বাণী", "→ Administration & Principal's Message")}
              </Link>
              <Link to="/teachers-list" className="block p-2 rounded hover:bg-emerald-50 text-[#006a4e]">
                {t("→ শিক্ষক ও কর্মকর্তা তালিকা", "→ Teachers & Staff Directory")}
              </Link>
              <Link to="/academics" className="block p-2 rounded hover:bg-emerald-50 text-[#006a4e]">
                {t("→ ক্লাস রুটিন ও সিলেবাস", "→ Class Routine & Syllabus")}
              </Link>
              <Link to="/admission" className="block p-2 rounded hover:bg-emerald-50 text-[#006a4e]">
                {t("→ অনলাইন ভর্তি নীতিমালা", "→ Online Admission Guidelines")}
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AboutPage;
