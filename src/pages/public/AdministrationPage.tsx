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
        <span className="text-[#006a4e]">প্রশাসন ও নেতৃবৃন্দের বাণী</span>
      </nav>

      {/* Page Header */}
      <div className="rounded-lg border border-[#cbe0d3] bg-[#004d38] p-6 text-white shadow-md sm:p-8">
        <span className="rounded bg-[#eab308] px-2.5 py-1 text-xs font-bold text-gray-950">
          বিদ্যালয় প্রশাসন
        </span>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">প্রশাসন ও শীর্ষ নেতৃবৃন্দের বাণী</h2>
        <p className="mt-1 text-xs text-emerald-200 sm:text-sm">
          বিদ্যালয় পরিচালনা পর্ষদ, প্রধান শিক্ষক ও সহকারী প্রধান শিক্ষক মহোদয়ের দিকনির্দেশনামূলক বক্তব্য
        </p>
      </div>

      <div className="space-y-8">
        {/* 1. PRINCIPAL MESSAGE */}
        <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs sm:p-8">
          <div className="border-b border-[#e2ece5] pb-3.5">
            <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-[#006a4e]">
              প্রধান শিক্ষকের বার্তা
            </span>
            <h3 className="mt-2 text-xl font-bold text-[#005a40]">
              {content.principalTitle || "প্রধান শিক্ষক মহোদয়ের বাণী"}
            </h3>
          </div>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row">
            <div className="shrink-0 text-center sm:w-52">
              <div className="mx-auto h-48 w-40 overflow-hidden rounded-md border-2 border-[#006a4e] bg-gray-100 shadow-md">
                <img
                  src={content.principalPhoto || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400"}
                  alt={content.principalName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/images/avatar.png";
                  }}
                />
              </div>
              <h4 className="mt-2 text-base font-bold text-gray-900">{content.principalName}</h4>
              <p className="text-xs font-semibold text-[#006a4e]">{content.principalTitle}</p>
              <p className="text-[11px] text-gray-500">{content.principalQualification}</p>
              <div className="mt-3 flex flex-col gap-1 text-[11px] text-gray-600">
                {content.principalPhone && <span>ফোন: {content.principalPhone}</span>}
                {content.principalEmail && <span>ইমেইল: {content.principalEmail}</span>}
              </div>
            </div>

            <div className="flex-1 space-y-4 text-sm leading-relaxed text-gray-800">
              <div className="rounded-md border-l-4 border-[#006a4e] bg-[#f9fbf9] p-5">
                <p className="italic">“{content.principalMessage}”</p>
              </div>
              <p className="text-xs text-gray-600">
                আমাদের উদ্দেশ্য প্রতিটি শিক্ষার্থীকে যুগোপযোগী ডিজিটাল শিক্ষা, নৈতিক শিক্ষা ও ক্রীড়া-সংস্কৃতি চর্চার মাধ্যমে একজন আদর্শ মানুষ হিসেবে গড়ে তোলা। সরকারের স্মার্ট বাংলাদেশ রূপকল্পের সাথে সংগতি রেখে আমাদের পাঠদান কার্যক্রম পরিচালিত হচ্ছে।
              </p>
            </div>
          </div>
        </section>

        {/* 2. ASSISTANT PRINCIPAL MESSAGE */}
        {content.asstPrincipalName && (
          <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs sm:p-8">
            <div className="border-b border-[#e2ece5] pb-3.5">
              <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-[#006a4e]">
                সহকারী প্রধান শিক্ষকের বার্তা
              </span>
              <h3 className="mt-2 text-xl font-bold text-[#005a40]">
                {content.asstPrincipalTitle || "সহকারী প্রধান শিক্ষকের বাণী"}
              </h3>
            </div>

            <div className="mt-6 flex flex-col gap-6 sm:flex-row">
              <div className="shrink-0 text-center sm:w-52">
                <div className="mx-auto h-44 w-36 overflow-hidden rounded-md border-2 border-emerald-600 bg-gray-100 shadow-md">
                  <img
                    src={content.asstPrincipalPhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"}
                    alt={content.asstPrincipalName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/images/avatar.png";
                    }}
                  />
                </div>
                <h4 className="mt-2 text-base font-bold text-gray-900">{content.asstPrincipalName}</h4>
                <p className="text-xs font-semibold text-[#006a4e]">{content.asstPrincipalTitle}</p>
              </div>

              <div className="flex-1 space-y-3 text-sm leading-relaxed text-gray-800">
                <div className="rounded-md border-l-4 border-emerald-700 bg-[#f9fbf9] p-5">
                  <p className="italic">“{content.asstPrincipalMessage}”</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. SMC PRESIDENT & MANAGING COMMITTEE */}
        <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs sm:p-8">
          <div className="border-b border-[#e2ece5] pb-3.5">
            <span className="rounded bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
              পরিচালনা পর্ষদ
            </span>
            <h3 className="mt-2 text-xl font-bold text-[#005a40]">ম্যানেজিং কমিটি (SMC) ও সভাপতির বার্তা</h3>
          </div>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row">
            <div className="shrink-0 text-center sm:w-52">
              <div className="mx-auto h-44 w-36 overflow-hidden rounded-md border-2 border-amber-600 bg-gray-100 shadow-md">
                <img
                  src={content.smcPresidentPhoto || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400"}
                  alt={content.smcPresidentName || "সভাপতি"}
                  className="h-full w-full object-cover"
                />
              </div>
              <h4 className="mt-2 text-base font-bold text-gray-900">{content.smcPresidentName || "প্রফেসর ড. আশরাফুল আলম"}</h4>
              <p className="text-xs font-semibold text-amber-800">{content.smcPresidentTitle || "সভাপতি, ম্যানেজিং কমিটি"}</p>
              <p className="text-[11px] text-gray-500 mt-1">কমিটি সদস্য সংখ্যা: {content.smcMembersCount || "১১ জন"}</p>
            </div>

            <div className="flex-1 space-y-4 text-sm leading-relaxed text-gray-800">
              <div className="rounded-md border-l-4 border-amber-600 bg-[#fffdf7] p-5">
                <p className="italic">“{content.smcPresidentMessage}”</p>
              </div>
              <div className="rounded-md border border-gray-100 bg-gray-50 p-4 text-xs text-gray-700">
                <p className="font-bold text-gray-900 mb-1">কমিটির দায়িত্ব ও পরিধি:</p>
                <p>
                  সরকারি বিধিমালা অনুযায়ী শিক্ষক-অভিভাবক সমন্বয়ে গঠিত ম্যানেজিং কমিটি বিদ্যালয়ের সার্বিক অবকাঠামো উন্নয়ন, শিক্ষা কার্যক্রমের তদারকি এবং স্বচ্ছ পরিচালনা নিশ্চিত করে থাকে।
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
