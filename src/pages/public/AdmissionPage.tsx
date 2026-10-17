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
  const { websiteContent: content, t, lang, formatDigits } = useSiteSettings();

  const requiredDocuments = [
    {
      bn: "অনলাইনে পূরণকৃত মূল আবেদনপত্রের প্রিন্ট কপি",
      en: "Printed copy of the online application form"
    },
    {
      bn: "কেন্দ্রীয় লটারিতে নির্বাচিত হওয়ার প্রমাণপত্র/রোল স্লিপ",
      en: "Proof of selection in the central digital lottery / roll slip"
    },
    {
      bn: "অনলাইন ভেরিফাইড ডিজিটাল জন্ম নিবন্ধন সনদের সত্যায়িত কপি",
      en: "Attested copy of online-verified digital birth registration certificate"
    },
    {
      bn: "পূর্ববর্তী বিদ্যালয়ের প্রশংসাপত্র/ছাড়পত্র (টিসি) এর মূল কপি",
      en: "Original Transfer Certificate (TC) and testimonial from previous school"
    },
    {
      bn: "শিক্ষার্থীর সদ্য তোলা ৪ কপি পাসপোর্ট সাইজ রঙিন ছবি",
      en: "4 copies of recent passport-size colored photographs of the student"
    },
    {
      bn: "পিতা ও মাতার জাতীয় পরিচয়পত্রের (NID) ফটোকপি",
      en: "Photocopies of National Identity Cards (NID) of both parents"
    },
    {
      bn: "বিশেষ কোটা (মুক্তিযোদ্ধা, প্রতিবন্ধী, ক্যাচমেন্ট) সংক্রান্ত সনদপত্র (প্রযোজ্য ক্ষেত্রে)",
      en: "Certificates supporting special quota (freedom fighter, disability, catchment) where applicable"
    },
  ];

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <Link to="/" className="flex items-center gap-1 hover:text-[#006a4e]">
          <Home size={14} />
          <span>{t("হোম", "Home")}</span>
        </Link>
        <span>/</span>
        <span className="text-[#006a4e]">{t("ভর্তি সংক্রান্ত তথ্য", "Admission Information")}</span>
      </nav>

      {/* Page Header */}
      <div className="rounded-lg border border-[#cbe0d3] bg-[#004d38] p-6 text-white shadow-md sm:p-8">
        <span className="rounded bg-[#eab308] px-2.5 py-1 text-xs font-bold text-gray-950">
          {t("ভর্তি বিজ্ঞপ্তি ২০২৬", "Admission Circular")}
        </span>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
          {t("অনলাইন শিক্ষার্থী ভর্তি নীতিমালা ও আবেদন", "Online Student Admission Guidelines & Application")}
        </h2>
        <p className="mt-1 text-xs text-emerald-200 sm:text-sm">
          {t(
            "গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের নীতিমালা অনুযায়ী কেন্দ্রীয় ডিজিটাল লটারির মাধ্যমে ভর্তি পরিচালিত হয়",
            "Admissions are conducted via centralized digital lottery in accordance with government regulations"
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          {/* Circular & Guidelines */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
            <h3 className="text-lg font-bold text-[#005a40] border-b pb-3 flex items-center gap-2">
              <FileCheck size={18} />
              <span>{t("ভর্তি সংক্রান্ত সাধারণ নীতিমালা", "General Admission Guidelines")}</span>
            </h3>

            <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-700">
              <p>{t(content.admissionGuidelines, content.admissionGuidelinesEn)}</p>

              <div className="rounded-md border border-emerald-200 bg-[#f4f9f6] p-4 text-xs space-y-2">
                <p className="font-bold text-[#006a4e] text-sm">
                  {t("গুরুত্বপূর্ণ সময়সূচী ও নিয়মাবলি:", "Important Timeline & Rules:")}
                </p>
                <ul className="list-inside list-disc space-y-1.5 text-gray-700">
                  <li>{t("আবেদন জমা দেওয়ার শেষ সময়: শিক্ষা মন্ত্রণালয় কর্তৃক নির্ধারিত সরকারি বিজ্ঞপ্তি মোতাবেক।", "Application Deadline: As per official circular published by the Ministry of Education.")}</li>
                  <li>{t("কেন্দ্রীয় ডিজিটাল লটারির ফলাফল প্রকাশ: মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তর (মাউশি) কর্তৃক সরাসরি।", "Lottery Results: Directly published by the Directorate of Secondary and Higher Education (DSHE).")}</li>
                  <li>{t("ভর্তি সম্পন্নকরণ: লটারিতে নির্বাচিত শিক্ষার্থীদের মূল কাগজপত্র যাচাই সাপেক্ষে ভর্তি নিশ্চিত করা হবে।", "Admission Confirmation: Selected students must verify original certificates to finalize enrollment.")}</li>
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
                  <span>{t("সরকারি ভর্তি পোর্টাল (GSA) - অনলাইন আবেদন করুন", "Govt Admission Portal (GSA) - Apply Online")}</span>
                </a>
              </div>
            </div>
          </section>

          {/* Seat Capacity Matrix */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
            <h3 className="text-lg font-bold text-[#005a40] border-b pb-3 flex items-center gap-2">
              <Users size={18} />
              <span>{t("শ্রেণিভিত্তিক শূন্য আসনের বিবরণ", "Class-wise Available Seats")}</span>
            </h3>

            <div className="mt-4">
              <p className="text-xs text-gray-600 mb-3">{t(content.admissionSeats, content.admissionSeatsEn)}</p>

              <table className="w-full text-xs text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-[#006a4e] text-white">
                    <th className="border p-2.5">{t("শ্রেণি", "Class")}</th>
                    <th className="border p-2.5">{t(" শাখা", "Sections")}</th>
                    <th className="border p-2.5">{t("মোট আসন", "Total Seats")}</th>
                    <th className="border p-2.5">{t("ভর্তির মাধ্যম", "Admission Process")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="border p-2.5 font-bold">{t("৬ষ্ঠ শ্রেণি", "Class 6")}</td>
                    <td className="border p-2.5">{t("ক, খ ও গ শাখা", "Sections A, B & C")}</td>
                    <td className="border p-2.5 font-bold text-[#006a4e]">{formatDigits("120")} {t("জন", "Seats")}</td>
                    <td className="border p-2.5">{t("কেন্দ্রীয় ডিজিটাল লটারি", "Central Digital Lottery")}</td>
                  </tr>
                  <tr>
                    <td className="border p-2.5 font-bold">{t("৭ম শ্রেণি", "Class 7")}</td>
                    <td className="border p-2.5">{t("ক ও খ শাখা", "Sections A & B")}</td>
                    <td className="border p-2.5 font-bold text-[#006a4e]">{formatDigits("30")} {t("জন (আসন সাপেক্ষে)", "Seats (Vacancy basis)")}</td>
                    <td className="border p-2.5">{t("কেন্দ্রীয় ডিজিটাল লটারি", "Central Digital Lottery")}</td>
                  </tr>
                  <tr>
                    <td className="border p-2.5 font-bold">{t("৮ম শ্রেণি", "Class 8")}</td>
                    <td className="border p-2.5">{t("ক ও খ শাখা", "Sections A & B")}</td>
                    <td className="border p-2.5 font-bold text-[#006a4e]">{formatDigits("25")} {t("জন (আসন সাপেক্ষে)", "Seats (Vacancy basis)")}</td>
                    <td className="border p-2.5">{t("কেন্দ্রীয় ডিজিটাল লটারি", "Central Digital Lottery")}</td>
                  </tr>
                  <tr>
                    <td className="border p-2.5 font-bold">{t("৯ম শ্রেণি", "Class 9")}</td>
                    <td className="border p-2.5">{t("বিজ্ঞান, মানবিক ও বাণিজ্য", "Science, Humanities & Business")}</td>
                    <td className="border p-2.5 font-bold text-[#006a4e]">{formatDigits("60")} {t("জন", "Seats")}</td>
                    <td className="border p-2.5">{t("কেন্দ্রীয় ডিজিটাল লটারি / জেএসসি সমমান", "Central Digital Lottery / JSC Equivalent")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Required Documents Checklist */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
            <h3 className="text-lg font-bold text-[#005a40] border-b pb-3 flex items-center gap-2">
              <CheckCircle2 size={18} />
              <span>{t("ভর্তির সময় প্রয়োজনীয় নথিপত্র", "Required Documents for Admission")}</span>
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              {requiredDocuments.map((doc, idx) => (
                <div key={idx} className="flex items-start gap-2 rounded border border-gray-100 bg-[#fbfdfc] p-3">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#006a4e]" />
                  <span className="text-gray-800">{t(doc.bn, doc.en)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:col-span-4">
          <div className="rounded-lg border border-[#cbe0d3] bg-white p-5 shadow-xs">
            <h4 className="font-bold text-[#006a4e] border-b pb-2 text-sm">{t("ভর্তি হেল্পডেস্ক", "Admission Helpdesk")}</h4>
            <p className="mt-2 text-xs text-gray-600">
              {t("ভর্তি সংক্রান্ত যেকোনো তথ্যের জন্য বিদ্যালয়ের ভর্তি শাখায় যোগাযোগ করুন:", "For any admission inquiries, please contact the admission desk:")}
            </p>
            <div className="mt-3 space-y-2 text-xs font-semibold text-gray-800">
              <p>{t("ফোন:", "Phone:")} {formatDigits(content.phone)}</p>
              <p>{t("ইমেইল:", "Email:")} {content.email}</p>
              <p>{t("অফিস সময়:", "Office Hours:")} {t(content.officeHours, content.officeHoursEn)}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdmissionPage;
