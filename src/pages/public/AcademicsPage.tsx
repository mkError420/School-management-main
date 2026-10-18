import React from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Home,
  Layers,
  School,
  ShieldAlert,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export const AcademicsPage: React.FC = () => {
  const { websiteContent: content, t, lang, formatDigits } = useSiteSettings();

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

          {/* Class Routine Schedule Overview */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
            <h3 className="text-lg font-bold text-[#005a40] border-b pb-3 flex items-center gap-2">
              <Clock size={18} />
              <span>{t("দৈনন্দিন ক্লাসের সময়সূচী", "Daily Class Schedule")}</span>
            </h3>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-[#006a4e] text-white">
                    <th className="border p-2.5">{t("পিরিয়ড", "Period")}</th>
                    <th className="border p-2.5">{t("সময়সীমা", "Time")}</th>
                    <th className="border p-2.5">{t("কার্যক্রম", "Activity / Subject")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-emerald-50/50 font-semibold">
                    <td className="border p-2.5">{t("প্রাত্যহিক সমাবেশ", "Morning Assembly")}</td>
                    <td className="border p-2.5">{t("সকাল ৯:০০ - ৯:২০", "09:00 AM - 09:20 AM")}</td>
                    <td className="border p-2.5">{t("কোরআন তেলাওয়াত, শপথ ও জাতীয় সংগীত পাঠ", "Recitation, Oath & National Anthem")}</td>
                  </tr>
                  <tr>
                    <td className="border p-2.5">{t("১ম পিরিয়ড", "1st Period")}</td>
                    <td className="border p-2.5">{t("সকাল ৯:২০ - ১০:০৫", "09:20 AM - 10:05 AM")}</td>
                    <td className="border p-2.5">{t("বাংলা / ইংরেজি ১ম পত্র", "Bangla / English 1st Paper")}</td>
                  </tr>
                  <tr>
                    <td className="border p-2.5">{t("২য় পিরিয়ড", "2nd Period")}</td>
                    <td className="border p-2.5">{t("সকাল ১০:০৫ - ১০:৫০", "10:05 AM - 10:50 AM")}</td>
                    <td className="border p-2.5">{t("সাধারণ গণিত / উচ্চতর গণিত", "General / Higher Mathematics")}</td>
                  </tr>
                  <tr>
                    <td className="border p-2.5">{t("৩য় পিরিয়ড", "3rd Period")}</td>
                    <td className="border p-2.5">{t("সকাল ১০:৫০ - ১১:৩৫", "10:50 AM - 11:35 AM")}</td>
                    <td className="border p-2.5">{t("বিজ্ঞান / বাংলাদেশ ও বিশ্বপরিচয়", "Science / BGS")}</td>
                  </tr>
                  <tr className="bg-amber-50/50 font-semibold text-amber-900">
                    <td className="border p-2.5">{t("টিফিন বিরতি", "Tiffin Break")}</td>
                    <td className="border p-2.5">{t("সকাল ১১:৩৫ - ১২:১৫", "11:35 AM - 12:15 PM")}</td>
                    <td className="border p-2.5">{t("দুপুরের খাবার ও বিশ্রাম", "Lunch & Prayer Break")}</td>
                  </tr>
                  <tr>
                    <td className="border p-2.5">{t("৪র্থ পিরিয়ড", "4th Period")}</td>
                    <td className="border p-2.5">{t("দুপুর ১২:১৫ - ১:০০", "12:15 PM - 01:00 PM")}</td>
                    <td className="border p-2.5">{t("তথ্য ও যোগাযোগ প্রযুক্তি (আইসিটি ল্যাব)", "ICT (Computer Lab)")}</td>
                  </tr>
                  <tr>
                    <td className="border p-2.5">{t("৫ম পিরিয়ড", "5th Period")}</td>
                    <td className="border p-2.5">{t("দুপুর ১:০০ - ১:৪৫", "01:00 PM - 01:45 PM")}</td>
                    <td className="border p-2.5">{t("ধর্ম ও নৈতিক শিক্ষা", "Religion & Moral Education")}</td>
                  </tr>
                  <tr>
                    <td className="border p-2.5">{t("৬ষ্ঠ পিরিয়ড", "6th Period")}</td>
                    <td className="border p-2.5">{t("দুপুর ১:৪৫ - ২:৩০", "01:45 PM - 02:30 PM")}</td>
                    <td className="border p-2.5">{t("সহশিক্ষা / ক্লাব / ক্রীড়া চর্চা", "Co-Curricular / Club / Sports")}</td>
                  </tr>
                </tbody>
              </table>
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
