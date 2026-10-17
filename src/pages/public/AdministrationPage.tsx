import React from "react";
import { Link } from "react-router-dom";
import {
  Award,
  GraduationCap,
  HeartHandshake,
  Home,
  Mail,
  Phone,
  Shield,
  Users,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export const AdministrationPage: React.FC = () => {
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
        <span className="text-[#006a4e]">{t("প্রশাসন ও নেতৃবৃন্দের বাণী", "Administration & Leadership Messages")}</span>
      </nav>

      {/* Page Header */}
      <div className="rounded-lg border border-[#cbe0d3] bg-[#004d38] p-6 text-white shadow-md sm:p-8">
        <span className="rounded bg-[#eab308] px-2.5 py-1 text-xs font-bold text-gray-950">
          {t("বিদ্যালয় প্রশাসন", "School Administration")}
        </span>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
          {t("প্রশাসন ও শীর্ষ নেতৃবৃন্দের বাণী", "Administration & Leadership Messages")}
        </h2>
        <p className="mt-1 text-xs text-emerald-200 sm:text-sm">
          {t("বিদ্যালয় পরিচালনা পর্ষদ, প্রধান শিক্ষক ও সহকারী প্রধান শিক্ষক মহোদয়ের দিকনির্দেশনামূলক বক্তব্য", "Guidance and directives from the School Managing Committee, Principal, and Assistant Principal")}
        </p>
      </div>

      <div className="space-y-8">
        {/* 1. PRINCIPAL MESSAGE */}
        <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs sm:p-8">
          <div className="border-b border-[#e2ece5] pb-3.5">
            <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-[#006a4e]">
              {t("প্রধান শিক্ষকের বার্তা", "Principal's Message")}
            </span>
            <h3 className="mt-2 text-xl font-bold text-[#005a40]">
              {t(content.principalTitle, content.principalTitleEn) || t("প্রধান শিক্ষক মহোদয়ের বাণী", "Message from the Principal")}
            </h3>
          </div>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row">
            <div className="shrink-0 text-center sm:w-52">
              <div className="mx-auto h-48 w-40 overflow-hidden rounded-md border-2 border-[#006a4e] bg-gray-100 shadow-md">
                <img
                  src={content.principalPhoto || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400"}
                  alt={t(content.principalName, content.principalNameEn)}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/images/avatar.png";
                  }}
                />
              </div>
              <h4 className="mt-2 text-base font-bold text-gray-900">{t(content.principalName, content.principalNameEn)}</h4>
              <p className="text-xs font-semibold text-[#006a4e]">{t(content.principalTitle, content.principalTitleEn)}</p>
              <p className="text-[11px] text-gray-500">{t(content.principalQualification, content.principalQualificationEn)}</p>
              <div className="mt-3 flex flex-col gap-1 text-[11px] text-gray-600">
                {content.principalPhone && <span>{t("ফোন:", "Phone:")} {formatDigits(content.principalPhone)}</span>}
                {content.principalEmail && <span>{t("ইমেইল:", "Email:")} {content.principalEmail}</span>}
              </div>
            </div>

            <div className="flex-1 space-y-4 text-sm leading-relaxed text-gray-800">
              <div className="rounded-md border-l-4 border-[#006a4e] bg-[#f9fbf9] p-5">
                <p className="italic">“{t(content.principalMessage, content.principalMessageEn)}”</p>
              </div>
              <p className="text-xs text-gray-600">
                {t(
                  "আমাদের উদ্দেশ্য প্রতিটি শিক্ষার্থীকে যুগোপযোগী ডিজিটাল শিক্ষা, নৈতিক শিক্ষা ও ক্রীড়া-সংস্কৃতি চর্চার মাধ্যমে একজন আদর্শ মানুষ হিসেবে গড়ে তোলা। সরকারের স্মার্ট বাংলাদেশ রূপকল্পের সাথে সংগতি রেখে আমাদের পাঠদান কার্যক্রম পরিচালিত হচ্ছে।",
                  "Our goal is to nurture every student into an exemplary human being through modern digital education, moral grounding, sports, and cultural enrichment, aligned with national education benchmarks."
                )}
              </p>
            </div>
          </div>
        </section>

        {/* 2. ASSISTANT PRINCIPAL MESSAGE */}
        {content.asstPrincipalName && (
          <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs sm:p-8">
            <div className="border-b border-[#e2ece5] pb-3.5">
              <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-[#006a4e]">
                {t("সহকারী প্রধান শিক্ষকের বার্তা", "Assistant Principal's Message")}
              </span>
              <h3 className="mt-2 text-xl font-bold text-[#005a40]">
                {t(content.asstPrincipalTitle, content.asstPrincipalTitleEn) || t("সহকারী প্রধান শিক্ষকের বাণী", "Message from the Assistant Principal")}
              </h3>
            </div>

            <div className="mt-6 flex flex-col gap-6 sm:flex-row">
              <div className="shrink-0 text-center sm:w-52">
                <div className="mx-auto h-44 w-36 overflow-hidden rounded-md border-2 border-emerald-600 bg-gray-100 shadow-md">
                  <img
                    src={content.asstPrincipalPhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"}
                    alt={t(content.asstPrincipalName, content.asstPrincipalNameEn)}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/images/avatar.png";
                    }}
                  />
                </div>
                <h4 className="mt-2 text-base font-bold text-gray-900">{t(content.asstPrincipalName, content.asstPrincipalNameEn)}</h4>
                <p className="text-xs font-semibold text-[#006a4e]">{t(content.asstPrincipalTitle, content.asstPrincipalTitleEn)}</p>
              </div>

              <div className="flex-1 space-y-3 text-sm leading-relaxed text-gray-800">
                <div className="rounded-md border-l-4 border-emerald-700 bg-[#f9fbf9] p-5">
                  <p className="italic">“{t(content.asstPrincipalMessage, content.asstPrincipalMessageEn)}”</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. SMC PRESIDENT & MANAGING COMMITTEE */}
        <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs sm:p-8">
          <div className="border-b border-[#e2ece5] pb-3.5">
            <span className="rounded bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
              {t("পরিচালনা পর্ষদ", "Managing Committee")}
            </span>
            <h3 className="mt-2 text-xl font-bold text-[#005a40]">
              {t("ম্যানেজিং কমিটি (SMC) ও সভাপতির বার্তা", "Managing Committee (SMC) & President's Message")}
            </h3>
          </div>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row">
            <div className="shrink-0 text-center sm:w-52">
              <div className="mx-auto h-44 w-36 overflow-hidden rounded-md border-2 border-amber-600 bg-gray-100 shadow-md">
                <img
                  src={content.smcPresidentPhoto || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400"}
                  alt={t(content.smcPresidentName, content.smcPresidentNameEn) || "President"}
                  className="h-full w-full object-cover"
                />
              </div>
              <h4 className="mt-2 text-base font-bold text-gray-900">
                {t(content.smcPresidentName, content.smcPresidentNameEn) || t("প্রফেসর ড. আশরাফুল আলম", "Prof. Dr. Ashraful Alam")}
              </h4>
              <p className="text-xs font-semibold text-amber-800">
                {t(content.smcPresidentTitle, content.smcPresidentTitleEn) || t("সভাপতি, ম্যানেজিং কমিটি", "President, Managing Committee")}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                {t("কমিটি সদস্য সংখ্যা:", "Committee Members:")} {formatDigits(content.smcMembersCount || "11")} {t("জন", "")}
              </p>
            </div>

            <div className="flex-1 space-y-4 text-sm leading-relaxed text-gray-800">
              <div className="rounded-md border-l-4 border-amber-600 bg-[#fffdf7] p-5">
                <p className="italic">“{t(content.smcPresidentMessage, content.smcPresidentMessageEn)}”</p>
              </div>
              <div className="rounded-md border border-gray-100 bg-gray-50 p-4 text-xs text-gray-700">
                <p className="font-bold text-gray-900 mb-1">
                  {t("কমিটির দায়িত্ব ও পরিধি:", "Scope & Responsibilities of the Committee:")}
                </p>
                <p>
                  {t(
                    "সরকারি বিধিমালা অনুযায়ী শিক্ষক-অভিভাবক সমন্বয়ে গঠিত ম্যানেজিং কমিটি বিদ্যালয়ের সার্বিক অবকাঠামো উন্নয়ন, শিক্ষা কার্যক্রমের তদারকি এবং স্বচ্ছ পরিচালনা নিশ্চিত করে থাকে।",
                    "Formed under national guidelines comprising educators and guardians, the Managing Committee ensures infrastructure development, academic oversight, and accountable governance."
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdministrationPage;
