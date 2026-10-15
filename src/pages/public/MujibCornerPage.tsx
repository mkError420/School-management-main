import React from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  Compass,
  Heart,
  Home,
  Sparkles,
  Star,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { BdGovEmblem } from "@/components/government/GovtEmblem";

export const MujibCornerPage: React.FC = () => {
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
        <span className="text-amber-800">মুজিব কর্নার ও মুক্তিযুদ্ধ চেতনা</span>
      </nav>

      {/* Page Header */}
      <div className="rounded-lg border-2 border-amber-600 bg-gradient-to-r from-amber-900 via-amber-800 to-red-950 p-6 text-white shadow-lg sm:p-8">
        <span className="rounded bg-[#eab308] px-2.5 py-1 text-xs font-bold text-gray-950">
          জাতির পিতা ও মুক্তিযুদ্ধ কর্নার
        </span>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
          {content.mujibCornerTitle || "মুজিব কর্নার ও মুক্তিযুদ্ধ চেতনা"}
        </h2>
        <p className="mt-1 text-xs text-amber-200 sm:text-sm">
          জাতির পিতা বঙ্গবন্ধু শেখ মুজিবুর রহমানের জীবনাদর্শ ও মহান মুক্তিযুদ্ধের অবিনাশী চেতনা
        </p>
      </div>

      {/* Hero Quote Card */}
      <section className="relative overflow-hidden rounded-lg border-2 border-amber-600/40 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative mx-auto h-56 w-44 shrink-0 overflow-hidden rounded-md border-4 border-amber-600 bg-white shadow-xl sm:mx-0">
            <img
              src={content.mujibCornerImage || "https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&q=80&w=600"}
              alt="Bangabandhu Mujib Corner"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-amber-900/90 py-1 text-center text-xs font-bold text-white">
              হাজার বছরের শ্রেষ্ঠ বাঙালি
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="rounded-md border-l-4 border-amber-700 bg-white p-5 shadow-2xs">
              <p className="font-serif text-lg font-bold italic text-amber-950 sm:text-xl">
                {content.mujibCornerQuote || "“সোনার বাংলা গড়তে হলে সোনার মানুষ চাই” — বঙ্গবন্ধু"}
              </p>
            </div>
            <p className="text-sm leading-relaxed text-gray-700">
              {content.mujibCornerText ||
                "জাতির পিতা বঙ্গবন্ধু শেখ মুজিবুর রহমানের জীবনাদর্শ, মুক্তিসংগ্রাম ও মুক্তিযুদ্ধের চেতনা শিক্ষার্থীদের মাঝে ছড়িয়ে দিতে বিদ্যালয়ে স্থাপন করা হয়েছে সমৃদ্ধ 'মুজিব কর্নার'। এখানে রয়েছে মুক্তিযুদ্ধভিত্তিক দুর্লভ গ্রন্থ, আলোকচিত্র ও প্রামাণ্য দলিল।"}
            </p>
          </div>
        </div>
      </section>

      {/* Timeline of Liberation & Education Vision */}
      <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
        <h3 className="text-lg font-bold text-[#005a40] border-b pb-3 flex items-center gap-2">
          <Star size={18} className="text-amber-600" />
          <span>শিক্ষা ক্ষেত্রে বঙ্গবন্ধুর যুগান্তকারী পদক্ষেপ</span>
        </h3>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs leading-relaxed">
          <div className="rounded-lg border border-emerald-100 bg-[#f4f9f6] p-4">
            <h4 className="font-bold text-[#006a4e] text-sm mb-1.5">প্রাথমিক শিক্ষা জাতীয়করণ</h4>
            <p className="text-gray-700">১৯৭৩ সালে বঙ্গবন্ধু একযোগে ৩৬,১৬৫টি প্রাথমিক বিদ্যালয় জাতীয়করণ করেন এবং ১ লাখ ৫৭ হাজার শিক্ষকের চাকরি সরকারি করেন।</p>
          </div>

          <div className="rounded-lg border border-amber-100 bg-[#fefce8] p-4">
            <h4 className="font-bold text-amber-900 text-sm mb-1.5">কুদরাত-এ-খুদা শিক্ষা কমিশন</h4>
            <p className="text-gray-700">১৯৭২ সালে ড. কুদরাত-এ-খুদাকে সভাপতি করে স্বাধীন বাংলাদেশের প্রথম বৈজ্ঞানিক ও গণমুখী শিক্ষা কমিশন গঠন করেন।</p>
          </div>

          <div className="rounded-lg border border-red-100 bg-[#fff5f5] p-4">
            <h4 className="font-bold text-red-900 text-sm mb-1.5">বিনামূল্যে বই ও শিক্ষা উপকরণ</h4>
            <p className="text-gray-700">স্বাধীনতার পরপরই দরিদ্র ও প্রান্তিক শিক্ষার্থীদের মাঝে বিনামূল্যে পাঠ্যপুস্তক ও খাদ্য সহায়তার সূচনা করেন।</p>
          </div>
        </div>
      </section>

      {/* Books and Resources in Mujib Corner */}
      <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
        <h3 className="text-lg font-bold text-[#005a40] border-b pb-3 flex items-center gap-2">
          <BookOpen size={18} />
          <span>বিদ্যালয় মুজিব কর্নারে সংরক্ষিত দুর্লভ গ্রন্থসমূহ</span>
        </h3>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 text-xs font-semibold text-gray-800">
          {[
            "অসমাপ্ত আত্মজীবনী - শেখ মুজিবুর রহমান",
            "কারাগারের রোজনামচা - শেখ মুজিবুর রহমান",
            "আমার দেখা নয়াচীন - শেখ মুজিবুর রহমান",
            "বঙ্গবন্ধুর ৭ই মার্চের ভাষণ ও বিশ্বঐতিহ্য দলিল",
            "বাংলাদেশের স্বাধীনতা যুদ্ধ: দলিলপত্র (১৬ খণ্ড)",
            "একাত্তরের দিনগুলি - জাহানারা ইমাম",
            "মুক্তিযুদ্ধের কিশোর ইতিহাস - সেলিনা হোসেন",
            "বঙ্গবন্ধু ও বাংলাদেশ - ইতিহাস সংকলন",
          ].map((book, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded border border-gray-100 bg-[#fcfdfc] p-3">
              <BookOpen size={15} className="shrink-0 text-amber-700" />
              <span>{book}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MujibCornerPage;
