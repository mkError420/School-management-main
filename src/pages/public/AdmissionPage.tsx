import React from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  FileText,
  Home,
  Info,
  PhoneCall,
  School,
  Users,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { BdGovEmblem } from "@/components/government/GovtEmblem";

export const AdmissionPage: React.FC = () => {
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
        <span className="text-[#006a4e]">ভর্তি সংক্রান্ত তথ্য</span>
      </nav>

      {/* Page Header */}
      <div className="rounded-lg border border-[#cbe0d3] bg-[#004d38] p-6 text-white shadow-md sm:p-8">
        <span className="rounded bg-[#eab308] px-2.5 py-1 text-xs font-bold text-gray-950">
          ভর্তি বিজ্ঞপ্তি ২০২৬
        </span>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">অনলাইন শিক্ষার্থী ভর্তি নীতিমালা ও আবেদন</h2>
        <p className="mt-1 text-xs text-emerald-200 sm:text-sm">
          গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের নীতিমালা অনুযায়ী কেন্দ্রীয় ডিজিটাল লটারির মাধ্যমে ভর্তি পরিচালিত হয়
        </p>
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          {/* Circular & Guidelines */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
            <h3 className="text-lg font-bold text-[#005a40] border-b pb-3 flex items-center gap-2">
              <FileCheck size={18} />
              <span>ভর্তি সংক্রান্ত সাধারণ নীতিমালা</span>
            </h3>

            <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-700">
              <p>{content.admissionGuidelines}</p>

              <div className="rounded-md border border-emerald-200 bg-[#f4f9f6] p-4 text-xs space-y-2">
                <p className="font-bold text-[#006a4e] text-sm">গুরুত্বপূর্ণ সময়সূচী ও নিয়মাবলি:</p>
                <ul className="list-inside list-disc space-y-1.5 text-gray-700">
                  <li>আবেদন জমা দেওয়ার শেষ সময়: শিক্ষা মন্ত্রণালয় কর্তৃক নির্ধারিত সরকারি বিজ্ঞপ্তি মোতাবেক।</li>
                  <li>কেন্দ্রীয় ডিজিটাল লটারির ফলাফল প্রকাশ: মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তর (মাউশি) কর্তৃক সরাসরি।</li>
                  <li>ভর্তি সম্পন্নকরণ: লটারিতে নির্বাচিত শিক্ষার্থীদের মূল কাগজপত্র যাচাই সাপেক্ষে ভর্তি নিশ্চিত করা হবে।</li>
                </ul>
              </div>

              <div className="pt-2">
                <a
                  href={content.admissionFormUrl || "https://gsa.teletalk.com.bd"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-[#006a4e] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#00503a]"
                >
                  <ExternalLink size={15} />
                  <span>সরকারি ভর্তি পোর্টাল (GSA) - অনলাইন আবেদন করুন</span>
                </a>
              </div>
            </div>
          </section>

          {/* Seat Capacity Matrix */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
            <h3 className="text-lg font-bold text-[#005a40] border-b pb-3 flex items-center gap-2">
              <Users size={18} />
              <span>শ্রেণিভিত্তিক শূন্য আসনের বিবরণ</span>
            </h3>

            <div className="mt-4">
              <p className="text-xs text-gray-600 mb-3">{content.admissionSeats}</p>

              <table className="w-full text-xs text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-[#006a4e] text-white">
                    <th className="border p-2.5">শ্রেণি</th>
                    <th className="border p-2.5">শাখা</th>
                    <th className="border p-2.5">মোট আসন</th>
                    <th className="border p-2.5">ভর্তির মাধ্যম</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="border p-2.5 font-bold">৬ষ্ঠ শ্রেণি</td>
                    <td className="border p-2.5">ক, খ ও গ শাখা</td>
                    <td className="border p-2.5 font-bold text-[#006a4e]">১২০ জন</td>
                    <td className="border p-2.5">কেন্দ্রীয় ডিজিটাল লটারি</td>
                  </tr>
                  <tr>
                    <td className="border p-2.5 font-bold">৭ম শ্রেণি</td>
                    <td className="border p-2.5">ক ও খ শাখা</td>
                    <td className="border p-2.5 font-bold text-[#006a4e]">৩০ জন (আসন সাপেক্ষে)</td>
                    <td className="border p-2.5">কেন্দ্রীয় ডিজিটাল লটারি</td>
                  </tr>
                  <tr>
                    <td className="border p-2.5 font-bold">৮ম শ্রেণি</td>
                    <td className="border p-2.5">ক ও খ শাখা</td>
                    <td className="border p-2.5 font-bold text-[#006a4e]">২৫ জন (আসন সাপেক্ষে)</td>
                    <td className="border p-2.5">কেন্দ্রীয় ডিজিটাল লটারি</td>
                  </tr>
                  <tr>
                    <td className="border p-2.5 font-bold">৯ম শ্রেণি</td>
                    <td className="border p-2.5">বিজ্ঞান, মানবিক ও বাণিজ্য</td>
                    <td className="border p-2.5 font-bold text-[#006a4e]">৬০ জন</td>
                    <td className="border p-2.5">কেন্দ্রীয় ডিজিটাল লটারি / জেএসসি সমমান</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Required Documents Checklist */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
            <h3 className="text-lg font-bold text-[#005a40] border-b pb-3 flex items-center gap-2">
              <CheckCircle2 size={18} />
              <span>ভর্তির সময় প্রয়োজনীয় নথিপত্র</span>
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              {[
                "অনলাইনে পূরণকৃত মূল আবেদনপত্রের প্রিন্ট কপি",
                "কেন্দ্রীয় লটারিতে নির্বাচিত হওয়ার প্রমাণপত্র/রোল স্লিপ",
                "অনলাইন ভেরিফাইড ডিজিটাল জন্ম নিবন্ধন সনদের সত্যায়িত কপি",
                "পূর্ববর্তী বিদ্যালয়ের প্রশংসাপত্র/ছাড়পত্র (টিসি) এর মূল কপি",
                "শিক্ষার্থীর সদ্য তোলা ৪ কপি পাসপোর্ট সাইজ রঙিন ছবি",
                "পিতা ও মাতার জাতীয় পরিচয়পত্রের (NID) ফটোকপি",
                "বিশেষ কোটা (মুক্তিযোদ্ধা, প্রতিবন্ধী, ক্যাচমেন্ট) সংক্রান্ত সনদপত্র (প্রযোজ্য ক্ষেত্রে)",
              ].map((doc, idx) => (
                <div key={idx} className="flex items-start gap-2 rounded border border-gray-100 bg-[#fbfdfc] p-3">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#006a4e]" />
                  <span className="text-gray-800">{doc}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:col-span-4">
          <div className="rounded-lg border border-[#cbe0d3] bg-white p-5 shadow-xs">
            <h4 className="font-bold text-[#006a4e] border-b pb-2 text-sm">ভর্তি হেল্পডেস্ক</h4>
            <p className="mt-2 text-xs text-gray-600">ভর্তি সংক্রান্ত যেকোনো তথ্যের জন্য বিদ্যালয়ের ভর্তি শাখায় যোগাযোগ করুন:</p>
            <div className="mt-3 space-y-2 text-xs font-semibold text-gray-800">
              <p>ফোন: {content.phone}</p>
              <p>ইমেইল: {content.email}</p>
              <p>অফিস সময়: {content.officeHours}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdmissionPage;
