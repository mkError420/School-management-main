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
        <span className="text-[#006a4e]">একাডেমিক তথ্য ও রুটিন</span>
      </nav>

      {/* Page Header */}
      <div className="rounded-lg border border-[#cbe0d3] bg-[#004d38] p-6 text-white shadow-md sm:p-8">
        <span className="rounded bg-[#eab308] px-2.5 py-1 text-xs font-bold text-gray-950">
          একাডেমিক কার্যাবলী
        </span>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">ক্লাস রুটিন, সিলেবাস ও শিক্ষাপঞ্জি</h2>
        <p className="mt-1 text-xs text-emerald-200 sm:text-sm">
          ২০২৬ শিক্ষাবর্ষের সকল শ্রেণির পাঠ্যক্রম, পরীক্ষার সময়সূচী ও ডাউনলোড ফাইল
        </p>
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          {/* Downloads List */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
            <h3 className="text-lg font-bold text-[#005a40] border-b pb-3 flex items-center gap-2">
              <Download size={18} />
              <span>ডাউনলোড কর্নার (রুটিন ও সিলেবাস)</span>
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
                        {item.category}
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-gray-900">{item.title}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">প্রকাশের তারিখ: {item.publishDate}</p>
                    </div>
                  </div>

                  <a
                    href={item.fileUrl || "#"}
                    download
                    onClick={(e) => {
                      if (item.fileUrl === "#") {
                        e.preventDefault();
                        alert(`“${item.title}” ডাউনলোড শীঘ্রই শুরু হবে।`);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded bg-[#006a4e] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#00503a] shrink-0"
                  >
                    <Download size={14} />
                    <span>পিডিএফ ডাউনলোড</span>
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Class Routine Schedule Overview */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
            <h3 className="text-lg font-bold text-[#005a40] border-b pb-3 flex items-center gap-2">
              <Clock size={18} />
              <span>দৈনন্দিন ক্লাসের সময়সূচী</span>
            </h3>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-[#006a4e] text-white">
                    <th className="border p-2.5">পিরিয়ড</th>
                    <th className="border p-2.5">সময়সীমা</th>
                    <th className="border p-2.5">কার্যক্রম</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-emerald-50/50 font-semibold">
                    <td className="border p-2.5">প্রাত্যহিক সমাবেশ</td>
                    <td className="border p-2.5">সকাল ৯:০০ - ৯:২০</td>
                    <td className="border p-2.5">কোরআন তেলাওয়াত, শপথ ও জাতীয় সংগীত পাঠ</td>
                  </tr>
                  <tr>
                    <td className="border p-2.5">১ম পিরিয়ড</td>
                    <td className="border p-2.5">সকাল ৯:২০ - ১০:০৫</td>
                    <td className="border p-2.5">বাংলা / ইংরেজি ১ম পত্র</td>
                  </tr>
                  <tr>
                    <td className="border p-2.5">২য় পিরিয়ড</td>
                    <td className="border p-2.5">সকাল ১০:০৫ - ১০:৫০</td>
                    <td className="border p-2.5">সাধারণ গণিত / উচ্চতর গণিত</td>
                  </tr>
                  <tr>
                    <td className="border p-2.5">৩য় পিরিয়ড</td>
                    <td className="border p-2.5">সকাল ১০:৫০ - ১১:৩৫</td>
                    <td className="border p-2.5">বিজ্ঞান / বাংলাদেশ ও বিশ্বপরিচয়</td>
                  </tr>
                  <tr className="bg-amber-50/50 font-semibold text-amber-900">
                    <td className="border p-2.5">টিফিন বিরতি</td>
                    <td className="border p-2.5">সকাল ১১:৩৫ - ১২:১৫</td>
                    <td className="border p-2.5">দুপুরের খাবার ও বিশ্রাম</td>
                  </tr>
                  <tr>
                    <td className="border p-2.5">৪র্থ পিরিয়ড</td>
                    <td className="border p-2.5">দুপুর ১২:১৫ - ১:০০</td>
                    <td className="border p-2.5">তথ্য ও যোগাযোগ প্রযুক্তি (আইসিটি ল্যাব)</td>
                  </tr>
                  <tr>
                    <td className="border p-2.5">৫ম পিরিয়ড</td>
                    <td className="border p-2.5">দুপুর ১:০০ - ১:৪৫</td>
                    <td className="border p-2.5">ধর্ম ও নৈতিক শিক্ষা</td>
                  </tr>
                  <tr>
                    <td className="border p-2.5">৬ষ্ঠ পিরিয়ড</td>
                    <td className="border p-2.5">দুপুর ১:৪৫ - ২:৩০</td>
                    <td className="border p-2.5">সহশিক্ষা / ক্লাব / ক্রীড়া চর্চা</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Student Code of Conduct */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
            <h3 className="text-lg font-bold text-[#005a40] border-b pb-3 flex items-center gap-2">
              <ShieldAlert size={18} />
              <span>শিক্ষার্থীদের আচরণবিধি ও পোশাক নীতিমালা</span>
            </h3>

            <div className="mt-4 space-y-3 text-xs leading-relaxed text-gray-700">
              <div className="rounded-md border border-gray-100 bg-[#f9fbf9] p-3.5">
                <p className="font-bold text-gray-900 mb-1">১. ইউনিফর্ম ও ড্রেসকোড:</p>
                <p>সাদা শার্ট, নেভি ব্লু প্যান্ট/সালোয়ার, নির্ধারিত বিদ্যালয় মনোগ্রাম সম্বলিত ব্যাজ ও কালো জুতা পরিধান বাধ্যতামূলক।</p>
              </div>
              <div className="rounded-md border border-gray-100 bg-[#f9fbf9] p-3.5">
                <p className="font-bold text-gray-900 mb-1">২. ক্লাসে উপস্থিতি:</p>
                <p>সকল শিক্ষার্থীকে সকাল ৮:৫০ মিনিটের মধ্যে ক্যাম্পাসে উপস্থিত হতে হবে। ন্যূনতম ৮০% উপস্থিতি বাধ্যতামূলক।</p>
              </div>
              <div className="rounded-md border border-gray-100 bg-[#f9fbf9] p-3.5">
                <p className="font-bold text-gray-900 mb-1">৩. মোবাইল ফোন নিষেধাজ্ঞা:</p>
                <p>শ্রেণিকক্ষে শিক্ষার্থীদের স্মার্টফোন বা কোনো ইলেকট্রনিক গ্যাজেট আনা সম্পূর্ণ নিষিদ্ধ।</p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:col-span-4">
          <div className="rounded-lg border border-[#cbe0d3] bg-white p-5 shadow-xs">
            <h4 className="font-bold text-[#006a4e] border-b pb-2 text-sm">একাডেমিক লিঙ্কসমূহ</h4>
            <div className="mt-3 space-y-2 text-xs font-semibold">
              <a href="https://nctb.gov.bd" target="_blank" rel="noreferrer" className="block p-2 rounded hover:bg-emerald-50 text-[#006a4e]">
                → জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)
              </a>
              <a href="https://dhakaeducationboard.gov.bd" target="_blank" rel="noreferrer" className="block p-2 rounded hover:bg-emerald-50 text-[#006a4e]">
                → ঢাকা শিক্ষা বোর্ড পরীক্ষার ফলাফল
              </a>
              <a href="https://teachers.gov.bd" target="_blank" rel="noreferrer" className="block p-2 rounded hover:bg-emerald-50 text-[#006a4e]">
                → শিক্ষক বাতায়ন ডিজিটাল কনটেন্ট
              </a>
              <Link to="/notices" className="block p-2 rounded hover:bg-emerald-50 text-[#006a4e]">
                → পরীক্ষার ফলাফল সংক্রান্ত নোটিশ
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AcademicsPage;
