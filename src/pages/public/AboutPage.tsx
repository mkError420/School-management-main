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
import { BdGovEmblem } from "@/components/government/GovtEmblem";

export const AboutPage: React.FC = () => {
  const { websiteContent: content } = useSiteSettings();

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <Link to="/" className="flex items-center gap-1 hover:text-[#006a4e]">
          <Home size={14} />
          <span>হোম</span>
        </Link>
        <span>/</span>
        <span className="text-[#006a4e]">আমাদের পরিচিতি ও ইতিহাস</span>
      </nav>

      {/* Page Header */}
      <div className="rounded-lg border border-[#cbe0d3] bg-[#004d38] p-6 text-white shadow-md sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="rounded bg-[#eab308] px-2.5 py-1 text-xs font-bold text-gray-950">
              বিদ্যালয় ইতিহাস ও পরিচিতি
            </span>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              {content.aboutTitle || "জ্ঞানচর্চা ও শ্রেষ্ঠত্বের গৌরবময় ঐতিহ্য"}
            </h2>
            <p className="mt-1 text-xs text-emerald-200 sm:text-sm">
              {content.schoolNameBn || content.schoolName} · স্থাপিত: {content.establishedYear} · EIIN: {content.eiin}
            </p>
          </div>
          <BdGovEmblem size={64} className="shrink-0" />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
        <div className="space-y-7 lg:col-span-8">
          {/* Detailed About & History */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
            <h3 className="text-lg font-bold text-[#005a40] border-b pb-3">আমাদের গৌরবময় পথচলা</h3>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-700">
              <p>{content.aboutText}</p>
              <div className="rounded-md border-l-4 border-[#006a4e] bg-[#f9fbf9] p-4 text-gray-800">
                <p className="font-semibold text-xs text-[#006a4e] uppercase tracking-wider mb-1">ইতিহাসের সূচনা</p>
                <p>{content.historyText}</p>
              </div>
              <p>{content.campusOverview}</p>
            </div>
          </section>

          {/* Mission & Vision */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-emerald-200 bg-[#f4f9f6] p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#006a4e]">
                <Compass size={18} />
                <h4>আমাদের লক্ষ্য (Mission)</h4>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-gray-700">{content.missionText}</p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-[#fefce8] p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <Sparkles size={18} />
                <h4>আমাদের দৃষ্টিভঙ্গি (Vision)</h4>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-gray-700">{content.visionText}</p>
            </div>
          </section>

          {/* Campus Facilities */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
            <h3 className="text-lg font-bold text-[#005a40] border-b pb-3">ক্যাম্পাস ও আধুনিক সুযোগ-সুবিধা</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { title: "ডিজিটাল কম্পিউটার ল্যাব", desc: "আধুনিক কম্পিউটার, দ্রুতগতির ইন্টারনেট এবং মাল্টিমিডিয়া প্রজেক্টর সংবলিত সুসজ্জিত আইসিটি ল্যাব।" },
                { title: "বিজ্ঞান গবেষণাগার", desc: "পদার্থবিজ্ঞান, রসায়ন ও জীববিজ্ঞানের সকল প্রয়োজনীয় যন্ত্রপাতি সংবলিত ব্যবহারিক বিজ্ঞানাগার।" },
                { title: "সমৃদ্ধ পাঠাগার", desc: "৫,০০০ এর অধিক জাতীয়, আন্তর্জাতিক ও রেফারেন্স গ্রন্থের সমন্বয়ে শিক্ষার্থীদের পড়ার উপযোগী লাইব্রেরি।" },
                { title: "প্রশস্ত খেলার মাঠ", desc: "ফুটবল, ক্রিকেট, ভলিবল সহ প্রাত্যহিক পিটি ও জাতীয় দিবস কুচকাওয়াজের উপযোগী নিজস্ব মাঠ।" },
                { title: "মাল্টিমিডিয়া ক্লাসরুম", desc: "শিক্ষকদের পাঠদানকে সহজ ও প্রাণবন্ত করতে মাল্টিমিডিয়া ও ডিজিটাল কন্টেন্টভিত্তিক ক্লাসরুম।" },
                { title: "সিসিটিভি ও নিরাপত্তা", desc: "সম্পূর্ণ ক্যাম্পাস সার্বক্ষণিক সিসিটিভি ক্যামেরার আওতাভুক্ত এবং সুশৃঙ্খল নিরাপত্তাব্যবস্থা।" },
              ].map((item, idx) => (
                <div key={idx} className="rounded-md border border-gray-100 bg-[#fdfdfd] p-3.5">
                  <h5 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[#006a4e]" />
                    <span>{item.title}</span>
                  </h5>
                  <p className="mt-1 text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:col-span-4">
          {/* Institutional Stats */}
          <div className="rounded-lg border border-[#cbe0d3] bg-white p-5 shadow-xs">
            <h4 className="font-bold text-[#006a4e] border-b pb-2 text-sm">এক নজরে বিদ্যালয়</h4>
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">প্রতিষ্ঠা সন:</span>
                <span className="font-bold text-gray-900">{content.establishedYear}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">EIIN নম্বর:</span>
                <span className="font-bold text-gray-900">{content.eiin}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">বিদ্যালয় কোড:</span>
                <span className="font-bold text-gray-900">{content.schoolCode}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">শিক্ষা বোর্ড:</span>
                <span className="font-bold text-gray-900">{content.boardName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">মোট শিক্ষার্থী:</span>
                <span className="font-bold text-[#006a4e]">{content.studentCount}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">শিক্ষক সংখ্যা:</span>
                <span className="font-bold text-[#006a4e]">{content.teacherCount}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">কর্মচারী সংখ্যা:</span>
                <span className="font-bold text-gray-900">{content.staffCount}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">পাসের হার:</span>
                <span className="font-bold text-emerald-700">{content.passRate}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">জিপিএ-৫ প্রাপ্তি:</span>
                <span className="font-bold text-emerald-700">{content.gpa5Count}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="rounded-lg border border-[#cbe0d3] bg-white p-5 shadow-xs">
            <h4 className="font-bold text-[#006a4e] border-b pb-2 text-sm">প্রয়োজনীয় পেজসমূহ</h4>
            <div className="mt-3 space-y-2 text-xs font-semibold">
              <Link to="/administration" className="block p-2 rounded hover:bg-emerald-50 text-[#006a4e]">
                → প্রশাসন ও প্রধান শিক্ষকের বাণী
              </Link>
              <Link to="/teachers-list" className="block p-2 rounded hover:bg-emerald-50 text-[#006a4e]">
                → শিক্ষক ও কর্মকর্তা তালিকা
              </Link>
              <Link to="/academics" className="block p-2 rounded hover:bg-emerald-50 text-[#006a4e]">
                → ক্লাস রুটিন ও সিলেবাস
              </Link>
              <Link to="/admission" className="block p-2 rounded hover:bg-emerald-50 text-[#006a4e]">
                → অনলাইন ভর্তি নীতিমালা
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AboutPage;
