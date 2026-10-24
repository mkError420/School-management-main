import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Filter,
  GraduationCap,
  Home,
  Layers,
  Printer,
  RefreshCw,
  School,
  Search,
  ShieldAlert,
  Sparkles,
  User,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { api } from "@/lib/api";
import type { ScheduleLesson } from "@/pages/ClassSchedulePage";

const SCHOOL_DAYS = [
  { key: "ALL", bn: "সকল দিন", en: "All Days" },
  { key: "SUNDAY", bn: "রবিবার", en: "Sunday" },
  { key: "MONDAY", bn: "সোমবার", en: "Monday" },
  { key: "TUESDAY", bn: "মঙ্গলবার", en: "Tuesday" },
  { key: "WEDNESDAY", bn: "বুধবার", en: "Wednesday" },
  { key: "THURSDAY", bn: "বৃহস্পতিবার", en: "Thursday" },
] as const;

const DAY_LABELS: Record<string, { bn: string; en: string }> = {
  SUNDAY: { bn: "রবিবার", en: "Sunday" },
  MONDAY: { bn: "সোমবার", en: "Monday" },
  TUESDAY: { bn: "মঙ্গলবার", en: "Tuesday" },
  WEDNESDAY: { bn: "বুধবার", en: "Wednesday" },
  THURSDAY: { bn: "বৃহস্পতিবার", en: "Thursday" },
  FRIDAY: { bn: "শুক্রবার", en: "Friday" },
  SATURDAY: { bn: "শনিবার", en: "Saturday" },
};

const DAY_SORT_ORDER: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const DEFAULT_SCHEDULE_LESSONS: ScheduleLesson[] = [
  { id: 1, name: "বাংলা ১ম পত্র", subject_name: "বাংলা ১ম পত্র", class_name: "Class 6", day: "SUNDAY", start_time: "09:20", end_time: "10:05", teacher_name: "মোঃ রফিকুল", teacher_surname: "ইসলাম", class_id: 1, teacher_id: "t1", subject_id: 1 },
  { id: 2, name: "ইংরেজি ১ম পত্র", subject_name: "English 1st Paper", class_name: "Class 6", day: "SUNDAY", start_time: "10:05", end_time: "10:50", teacher_name: "মুহাম্মদ কামরুল", teacher_surname: "হাসান", class_id: 1, teacher_id: "t2", subject_id: 2 },
  { id: 3, name: "সাধারণ গণিত", subject_name: "Mathematics", class_name: "Class 6", day: "SUNDAY", start_time: "10:50", end_time: "11:35", teacher_name: "মোঃ আবদুর", teacher_surname: "রহমান", class_id: 1, teacher_id: "t3", subject_id: 3 },
  { id: 4, name: "তথ্য ও যোগাযোগ প্রযুক্তি", subject_name: "ICT", class_name: "Class 6", day: "SUNDAY", start_time: "12:15", end_time: "13:00", teacher_name: "তানিয়া", teacher_surname: "আক্তার", class_id: 1, teacher_id: "t4", subject_id: 4 },
  { id: 5, name: "সাধারণ বিজ্ঞান", subject_name: "General Science", class_name: "Class 6", day: "SUNDAY", start_time: "13:00", end_time: "13:45", teacher_name: "আহমেদ", teacher_surname: "কবীর", class_id: 1, teacher_id: "t5", subject_id: 5 },
  { id: 6, name: "বাংলাদেশ ও বিশ্বপরিচয়", subject_name: "BGS", class_name: "Class 6", day: "SUNDAY", start_time: "13:45", end_time: "14:30", teacher_name: "ফাতিমা", teacher_surname: "বেগম", class_id: 1, teacher_id: "t6", subject_id: 6 },
  { id: 7, name: "Math 101", subject_name: "Mathematics", class_name: "Class 7", day: "MONDAY", start_time: "08:30", end_time: "09:30", teacher_name: "John", teacher_surname: "Doe", class_id: 2, teacher_id: "t1", subject_id: 1 },
  { id: 8, name: "English Literature", subject_name: "English Literature", class_name: "Class 7", day: "MONDAY", start_time: "09:45", end_time: "10:45", teacher_name: "Sarah", teacher_surname: "Smith", class_id: 2, teacher_id: "t2", subject_id: 2 },
  { id: 9, name: "Physics Fundamentals", subject_name: "Physics", class_name: "Class 8", day: "TUESDAY", start_time: "08:30", end_time: "09:30", teacher_name: "Alan", teacher_surname: "Turing", class_id: 3, teacher_id: "t3", subject_id: 3 },
  { id: 10, name: "Chemistry Lab", subject_name: "Chemistry", class_name: "Class 8", day: "TUESDAY", start_time: "10:00", end_time: "11:30", teacher_name: "Marie", teacher_surname: "Curie", class_id: 3, teacher_id: "t4", subject_id: 4 },
  { id: 11, name: "Biology Exploration", subject_name: "Biology", class_name: "Class 9", day: "WEDNESDAY", start_time: "08:30", end_time: "09:30", teacher_name: "Charles", teacher_surname: "Darwin", class_id: 4, teacher_id: "t5", subject_id: 5 },
  { id: 12, name: "World History", subject_name: "History", class_name: "Class 10", day: "THURSDAY", start_time: "09:00", end_time: "10:00", teacher_name: "Arnold", teacher_surname: "Toynbee", class_id: 5, teacher_id: "t6", subject_id: 6 },
];

const formatTime12h = (val: string | undefined): string => {
  if (!val) return "--:--";
  const str = String(val).trim();
  const timeStr = str.includes(" ") ? str.split(" ")[1] : str.includes("T") ? str.split("T")[1] : str;
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const min = parts[1];
  if (isNaN(hour)) return timeStr;
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
  return `${hourStr}:${min} ${ampm}`;
};

export const AcademicsPage: React.FC = () => {
  const { websiteContent: content, t, lang, formatDigits } = useSiteSettings();

  const [lessons, setLessons] = useState<ScheduleLesson[]>([]);
  const [classesList, setClassesList] = useState<Array<{ id: string | number; name: string }>>([]);
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>(true);
  const [selectedDay, setSelectedDay] = useState<string>("ALL");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    let active = true;

    // Load from localStorage cache first for fast initial load
    try {
      const cached = localStorage.getItem("school_custom_lessons");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLessons(parsed);
        }
      }
    } catch {}

    const fetchData = async () => {
      try {
        const [lessonsRes, classesRes] = await Promise.all([
          api.getAll("lessons", { limit: 1000 }),
          api.getAll("classes", { limit: 1000 }),
        ]);

        if (!active) return;

        if (lessonsRes.success && Array.isArray(lessonsRes.data?.lessons) && lessonsRes.data.lessons.length > 0) {
          setLessons(lessonsRes.data.lessons);
          try {
            localStorage.setItem("school_custom_lessons", JSON.stringify(lessonsRes.data.lessons));
          } catch {}
        } else {
          setLessons((prev) => (prev.length > 0 ? prev : DEFAULT_SCHEDULE_LESSONS));
        }

        if (classesRes.success && Array.isArray(classesRes.data?.classes)) {
          setClassesList(classesRes.data.classes);
        }
      } catch {
        if (active) {
          setLessons((prev) => (prev.length > 0 ? prev : DEFAULT_SCHEDULE_LESSONS));
        }
      } finally {
        if (active) setLoadingSchedule(false);
      }
    };

    void fetchData();
    return () => {
      active = false;
    };
  }, []);

  const availableClasses = useMemo(() => {
    const map = new Map<string, string>();
    classesList.forEach((c) => {
      if (c.name) map.set(String(c.id), c.name);
    });
    lessons.forEach((l) => {
      if (l.class_name) {
        map.set(String(l.class_id || l.class_name), l.class_name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [classesList, lessons]);

  const filteredLessons = useMemo(() => {
    return lessons
      .filter((lesson) => {
        if (selectedDay !== "ALL" && (lesson.day || "").toUpperCase() !== selectedDay) {
          return false;
        }
        if (selectedClass !== "ALL") {
          const matchId = String(lesson.class_id) === selectedClass;
          const matchName = String(lesson.class_name).toLowerCase() === selectedClass.toLowerCase();
          if (!matchId && !matchName) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const name = (lesson.name || "").toLowerCase();
          const subject = (lesson.subject_name || "").toLowerCase();
          const teacher = `${lesson.teacher_name || ""} ${lesson.teacher_surname || ""}`.toLowerCase();
          const cls = (lesson.class_name || "").toLowerCase();
          if (!name.includes(q) && !subject.includes(q) && !teacher.includes(q) && !cls.includes(q)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const dayA = DAY_SORT_ORDER[(a.day || "").toUpperCase()] ?? 99;
        const dayB = DAY_SORT_ORDER[(b.day || "").toUpperCase()] ?? 99;
        if (dayA !== dayB) return dayA - dayB;
        return (a.start_time || "").localeCompare(b.start_time || "");
      });
  }, [lessons, selectedDay, selectedClass, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <Link to="/" className="flex items-center gap-1 hover:text-[#006a4e]">
          <Home size={14} />
          <span>{t("হোম", "Home")}</span>
        </Link>
        <span>/</span>
        <span className="text-[#006a4e]">{t("একাডেমিক তথ্য ও রুটিন", "Academic Info & Routines")}</span>
      </nav>

      {/* Page Header */}
      <div className="rounded-lg border border-[#cbe0d3] bg-[#004d38] p-6 text-white shadow-md sm:p-8">
        <span className="rounded bg-[#eab308] px-2.5 py-1 text-xs font-bold text-gray-950">
          {t("একাডেমিক কার্যাবলী", "Academic Affairs")}
        </span>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
          {t("ক্লাস রুটিন, সিলেবাস ও শিক্ষাপঞ্জি", "Class Routine, Syllabus & Academic Calendar")}
        </h2>
        <p className="mt-1 text-xs text-emerald-200 sm:text-sm">
          {t(
            "২০২৬ শিক্ষাবর্ষের সকল শ্রেণির পাঠ্যক্রম, পরীক্ষার সময়সূচী ও ডাউনলোড ফাইল",
            "Curriculum, exam schedule, and downloadable files for the academic year"
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          {/* Downloads List */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
            <h3 className="text-lg font-bold text-[#005a40] border-b pb-3 flex items-center gap-2">
              <Download size={18} />
              <span>{t("ডাউনলোড কর্নার (রুটিন ও সিলেবাস)", "Download Corner (Routine & Syllabus)")}</span>
            </h3>

            <div className="mt-5 space-y-3">
              {(content.downloads || []).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-[#e4ede7] bg-[#fbfdfc] p-4 transition hover:border-[#006a4e] hover:shadow-2xs"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-red-50 text-red-700">
                      <FileText size={22} />
                    </div>
                    <div>
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {t(item.category, item.categoryEn)}
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-gray-900">{t(item.title, item.titleEn)}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {t("প্রকাশের তারিখ:", "Published:")} {formatDigits(item.publishDate)}
                      </p>
                    </div>
                  </div>

                  <a
                    href={item.fileUrl || "#"}
                    target={item.fileUrl && item.fileUrl !== "#" ? "_blank" : undefined}
                    rel="noreferrer"
                    download
                    onClick={(e) => {
                      if (!item.fileUrl || item.fileUrl === "#") {
                        e.preventDefault();
                        alert(t(`“${item.title}” ডাউনলোড শীঘ্রই শুরু হবে।`, `Download for "${item.titleEn || item.title}" will begin shortly.`));
                      }
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded bg-[#006a4e] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#00503a] shrink-0"
                  >
                    <Download size={14} />
                    <span>
                      {item.fileUrl &&
                        (item.fileUrl.startsWith("data:image/") ||
                          /\.(jpg|jpeg|png|webp|svg)(\?.*)?$/i.test(item.fileUrl))
                        ? t("ফাইল / ছবি ডাউনলোড", "Download File / Image")
                        : t("পিডিএফ ডাউনলোড", "Download PDF")}
                    </span>
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Dynamic Class Routine Schedule Overview */}
          <section id="schedule" className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs scroll-mt-24">
            <div className="flex flex-col gap-3 border-b border-[#e2ece5] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#005a40] flex items-center gap-2">
                  <Clock size={20} className="text-[#006a4e]" />
                  <span>{t("দৈনন্দিন ক্লাসের সময়সূচী", "Daily Class Schedule")}</span>
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  {t(
                    "ড্যাশবোর্ড ক্লাস শিডিউল থেকে লাইভ হালনাগাদকৃত ক্লাসের পূর্ণাঙ্গ সময়সূচী",
                    "Live updated daily class schedule synced from dashboard class-schedule"
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-[#006a4e] border border-emerald-200">
                  {formatDigits(filteredLessons.length)} {t("টি পিরিয়ড", "Periods")}
                </span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50"
                  title={t("প্রিন্ট করুন", "Print")}
                >
                  <Printer size={13} />
                  <span className="hidden sm:inline">{t("প্রিন্ট", "Print")}</span>
                </button>
                <Link
                  to="/class-schedule"
                  className="inline-flex items-center gap-1 rounded bg-[#006a4e] px-2.5 py-1 text-xs font-bold text-white shadow-2xs hover:bg-[#00503a]"
                  title={t("ড্যাশবোর্ড রুটিন পেজ", "Dashboard Schedule")}
                >
                  <GraduationCap size={13} />
                  <span className="hidden sm:inline">{t("ড্যাশবোর্ড", "Dashboard")}</span>
                </Link>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="mt-5 space-y-3 rounded-lg border border-[#e4ede7] bg-[#f9fbf9] p-4">
              {/* Day Selector Tabs */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  {t("বার / দিন নির্বাচন করুন:", "Select Day:")}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SCHOOL_DAYS.map((day) => {
                    const isSelected = selectedDay === day.key;
                    return (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => setSelectedDay(day.key)}
                        className={`rounded-md px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
                          isSelected
                            ? "bg-[#006a4e] text-white shadow-xs"
                            : "bg-white text-gray-700 border border-gray-200 hover:bg-emerald-50 hover:text-[#006a4e]"
                        }`}
                      >
                        {lang === "bn" ? day.bn : day.en}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Class & Search Filter */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 pt-1 border-t border-[#e2ece5]">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    {t("শ্রেণি ফিল্টার:", "Filter by Class:")}
                  </label>
                  <div className="relative">
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-xs text-gray-800 outline-none transition focus:border-[#006a4e]"
                    >
                      <option value="ALL">{t("সকল শ্রেণি (All Classes)", "All Classes")}</option>
                      {availableClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    {t("বিষয় বা শিক্ষক খুঁজুন:", "Search Subject or Teacher:")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("যেমন: বাংলা, গণিত, রহিম...", "e.g., Bangla, Math, John...")}
                      className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-xs text-gray-800 outline-none transition focus:border-[#006a4e]"
                    />
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Timetable Overview Banner */}
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
              <div className="rounded-md border border-emerald-200 bg-emerald-50/70 p-2.5 flex items-center gap-2 text-emerald-900">
                <Clock size={16} className="text-[#006a4e] shrink-0" />
                <div>
                  <p className="font-bold">{t("প্রাত্যহিক সমাবেশ:", "Morning Assembly:")} {formatDigits("সকাল ৯:০০ - ৯:২০")}</p>
                  <p className="text-[10px] text-emerald-800">{t("কোরআন তেলাওয়াত, শপথ ও জাতীয় সংগীত পাঠ", "Recitation, Oath & National Anthem")}</p>
                </div>
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50/70 p-2.5 flex items-center gap-2 text-amber-900">
                <Clock size={16} className="text-amber-700 shrink-0" />
                <div>
                  <p className="font-bold">{t("টিফিন ও নামাযের বিরতি:", "Tiffin & Prayer Break:")} {formatDigits("সকাল ১১:৩৫ - ১২:১৫")}</p>
                  <p className="text-[10px] text-amber-800">{t("দুপুরের খাবার ও বিশ্রাম", "Lunch & Prayer Break")}</p>
                </div>
              </div>
            </div>

            {/* Dynamic Schedule Table */}
            <div className="mt-4 overflow-x-auto">
              {filteredLessons.length > 0 ? (
                <table className="w-full text-xs text-left border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-[#006a4e] text-white">
                      <th className="border border-emerald-700 p-2.5 whitespace-nowrap">{t("সময়সীমা", "Time")}</th>
                      <th className="border border-emerald-700 p-2.5 whitespace-nowrap">{t("বার / দিন", "Day")}</th>
                      <th className="border border-emerald-700 p-2.5 whitespace-nowrap">{t("শ্রেণি", "Class")}</th>
                      <th className="border border-emerald-700 p-2.5">{t("বিষয় ও পিরিয়ড", "Subject / Period")}</th>
                      <th className="border border-emerald-700 p-2.5">{t("বিষয় শিক্ষক", "Teacher")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredLessons.map((item, index) => {
                      const dayMeta = DAY_LABELS[(item.day || "").toUpperCase()] || { bn: item.day, en: item.day };
                      const startTime12 = formatTime12h(item.start_time);
                      const endTime12 = formatTime12h(item.end_time);
                      const timeLabel = `${startTime12} - ${endTime12}`;
                      const teacherName = [item.teacher_name, item.teacher_surname].filter(Boolean).join(" ");

                      return (
                        <tr
                          key={item.id || index}
                          className="transition hover:bg-emerald-50/40"
                        >
                          <td className="border p-2.5 font-semibold text-gray-900 whitespace-nowrap">
                            <span className="flex items-center gap-1.5 text-[#006a4e]">
                              <Clock size={13} className="shrink-0" />
                              <span>{formatDigits(timeLabel)}</span>
                            </span>
                          </td>
                          <td className="border p-2.5 whitespace-nowrap">
                            <span className="inline-block rounded bg-emerald-100/70 px-2 py-0.5 text-[11px] font-bold text-[#006a4e]">
                              {lang === "bn" ? dayMeta.bn : dayMeta.en}
                            </span>
                          </td>
                          <td className="border p-2.5 font-bold text-gray-800 whitespace-nowrap">
                            {item.class_name || (lang === "bn" ? "শ্রেণি নির্ধারিত নয়" : "General Class")}
                          </td>
                          <td className="border p-2.5">
                            <p className="font-bold text-gray-900 flex items-center gap-1.5">
                              <BookOpen size={13} className="text-[#006a4e] shrink-0" />
                              <span>{item.subject_name || item.name || t("নিয়মিত পাঠদান", "Regular Lesson")}</span>
                            </p>
                            {item.name && item.name !== item.subject_name && (
                              <p className="text-[10px] text-gray-500 mt-0.5">{item.name}</p>
                            )}
                          </td>
                          <td className="border p-2.5 text-gray-700">
                            {teacherName ? (
                              <span className="flex items-center gap-1">
                                <User size={13} className="text-gray-400 shrink-0" />
                                <span>{teacherName}</span>
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">{t("নির্ধারিত শিক্ষক", "Assigned Teacher")}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
                  <CalendarDays size={36} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-bold text-gray-700">
                    {t("কোনো সময়সূচী পাওয়া যায়নি", "No Class Schedule Found")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t(
                      "নির্বাচিত শ্রেণি বা দিনের জন্য কোনো শিডিউল এন্ট্রি নেই। অন্য দিন বা শ্রেণি নির্বাচন করুন।",
                      "No schedule entries found for the selected day or class. Try selecting another filter."
                    )}
                  </p>
                  {(selectedDay !== "ALL" || selectedClass !== "ALL" || searchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDay("ALL");
                        setSelectedClass("ALL");
                        setSearchQuery("");
                      }}
                      className="mt-3 inline-flex items-center gap-1 rounded bg-[#006a4e] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#00503a]"
                    >
                      <RefreshCw size={12} />
                      <span>{t("ফিল্টার রিসেট করুন", "Reset Filters")}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-[11px] text-gray-500">
              <span className="flex items-center gap-1">
                <Sparkles size={12} className="text-amber-600" />
                <span>{t("প্রশাসনিক ড্যাশবোর্ডে ক্লাস শিডিউল হালনাগাদ হলে তা ওয়েবসাইটে সরাসরি দৃশ্যমান হয়।", "Updates made in the dashboard class-schedule appear live on the website.")}</span>
              </span>
              <Link
                to="/class-schedule"
                className="font-bold text-[#006a4e] hover:underline flex items-center gap-1"
              >
                <span>{t("রুটিন ড্যাশবোর্ডে দেখুন", "View in Schedule Dashboard")}</span>
                <ExternalLink size={11} />
              </Link>
            </div>
          </section>

          {/* Student Code of Conduct */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
            <h3 className="text-lg font-bold text-[#005a40] border-b pb-3 flex items-center gap-2">
              <span>{t("শিক্ষার্থীদের আচরণবিধি ও পোশাক নীতিমালা", "Student Code of Conduct & Dress Code")}</span>
            </h3>

            <div className="mt-4 space-y-3 text-xs leading-relaxed text-gray-700">
              <div className="rounded-md border border-gray-100 bg-[#f9fbf9] p-3.5">
                <p className="font-bold text-gray-900 mb-1">
                  {t("১. ইউনিফর্ম ও ড্রেসকোড:", "1. Uniform & Dress Code:")}
                </p>
                <p>
                  {t(
                    "সাদা শার্ট, নেভি ব্লু প্যান্ট/সালোয়ার, নির্ধারিত বিদ্যালয় মনোগ্রাম সম্বলিত ব্যাজ ও কালো জুতা পরিধান বাধ্যতামূলক।",
                    "White shirt, navy blue pants/salwar, school monogram badge, and black shoes are mandatory."
                  )}
                </p>
              </div>
              <div className="rounded-md border border-gray-100 bg-[#f9fbf9] p-3.5">
                <p className="font-bold text-gray-900 mb-1">
                  {t("২. ক্লাসে উপস্থিতি:", "2. Attendance Policy:")}
                </p>
                <p>
                  {t(
                    "সকল শিক্ষার্থীকে সকাল ৮:৫০ মিনিটের মধ্যে ক্যাম্পাসে উপস্থিত হতে হবে। ন্যূনতম ৮০% উপস্থিতি বাধ্যতামূলক।",
                    "All students must arrive at the campus by 8:50 AM. A minimum of 80% attendance is compulsory."
                  )}
                </p>
              </div>
              <div className="rounded-md border border-gray-100 bg-[#f9fbf9] p-3.5">
                <p className="font-bold text-gray-900 mb-1">
                  {t("৩. মোবাইল ফোন নিষেধাজ্ঞা:", "3. Mobile Phone Policy:")}
                </p>
                <p>
                  {t(
                    "শ্রেণিকক্ষে শিক্ষার্থীদের স্মার্টফোন বা কোনো ইলেকট্রনিক গ্যাজেট আনা সম্পূর্ণ নিষিদ্ধ।",
                    "Bringing smartphones or electronic gadgets into classrooms is strictly prohibited."
                  )}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:col-span-4">
          <div className="rounded-lg border border-[#cbe0d3] bg-white p-5 shadow-xs">
            <h4 className="font-bold text-[#006a4e] border-b pb-2 text-sm">
              {t("একাডেমিক লিঙ্কসমূহ", "Academic Links")}
            </h4>
            <div className="mt-3 space-y-2 text-xs font-semibold">
              <a href="https://nctb.gov.bd" target="_blank" rel="noreferrer" className="block p-2 rounded hover:bg-emerald-50 text-[#006a4e]">
                {t("→ জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)", "→ National Curriculum & Textbook Board (NCTB)")}
              </a>
              <a href="https://dhakaeducationboard.gov.bd" target="_blank" rel="noreferrer" className="block p-2 rounded hover:bg-emerald-50 text-[#006a4e]">
                {t("→ শিক্ষা বোর্ড পরীক্ষার ফলাফল", "→ Education Board Exam Results")}
              </a>
              <a href="https://teachers.gov.bd" target="_blank" rel="noreferrer" className="block p-2 rounded hover:bg-emerald-50 text-[#006a4e]">
                {t("→ শিক্ষক বাতায়ন ডিজিটাল কনটেন্ট", "→ Teachers Portal Digital Content")}
              </a>
              <Link to="/notices" className="block p-2 rounded hover:bg-emerald-50 text-[#006a4e]">
                {t("→ পরীক্ষার ফলাফল সংক্রান্ত নোটিশ", "→ Exam & Result Notices")}
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AcademicsPage;
