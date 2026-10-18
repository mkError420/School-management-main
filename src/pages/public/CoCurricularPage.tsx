import React from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  CheckCircle2,
  HeartHandshake,
  Home,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export const CoCurricularPage: React.FC = () => {
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
        <span className="text-[#006a4e]">{t("সহশিক্ষা ও ক্লাব কার্যক্রম", "Co-Curricular & Club Activities")}</span>
      </nav>

      {/* Page Header */}
      <div className="rounded-lg border border-[#cbe0d3] bg-[#004d38] p-6 text-white shadow-md sm:p-8">
        <span className="rounded bg-[#eab308] px-2.5 py-1 text-xs font-bold text-gray-950">
          {t("মেধা ও মননশীলতা বিকাশ", "Developing Talents & Intellect")}
        </span>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
          {t("সহশিক্ষা ও ক্লাব কার্যক্রম", "Co-Curricular & Club Activities")}
        </h2>
        <p className="mt-1 text-xs text-emerald-200 sm:text-sm">
          {t(
            "শৃঙ্খলা, নেতৃত্ব ও সৃজনশীলতা অর্জনে আমাদের বিভিন্ন ক্লাব ও সমাজসেবামূলক উদ্যোগ",
            "Our clubs and community initiatives cultivate leadership, discipline, and creative brilliance"
          )}
        </p>
      </div>

      {/* Clubs Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {(content.coCurricular || []).map((club, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-xs transition hover:border-[#006a4e] hover:shadow-md"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-[#006a4e]">
                {t(club.badge, club.badgeEn)}
              </span>
              <Award size={18} className="text-[#006a4e]" />
            </div>
            <h3 className="mt-3 text-base font-bold text-gray-900">{t(club.title, club.titleEn)}</h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-600">{t(club.description, club.descriptionEn)}</p>
          </div>
        ))}
      </div>

      {/* Achievements & Facilities */}
      <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
        <h3 className="text-lg font-bold text-[#005a40] border-b pb-3 flex items-center gap-2">
          <span>{t("সহশিক্ষা কার্যক্রমে আমাদের অর্জনসমূহ", "Our Co-Curricular Achievements")}</span>
        </h3>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
          <div className="rounded border border-emerald-100 bg-[#f4f9f6] p-4">
            <h4 className="font-bold text-[#006a4e] text-sm mb-1">
              {t("জাতীয় স্কাউট সমাবেশ", "National Scout Jamboree")}
            </h4>
            <p className="text-gray-700">
              {t(
                "জাতীয় স্কাউট জাম্বুরিতে আমাদের স্কাউট ও গাইড দল একাধিকবার শ্রেষ্ঠ দল হিসেবে পুরস্কৃত হয়েছে।",
                "Our Scout & Guide troop has repeatedly been awarded the Best Contingent at the National Scout Jamboree."
              )}
            </p>
          </div>
          <div className="rounded border border-amber-100 bg-[#fefce8] p-4">
            <h4 className="font-bold text-amber-900 text-sm mb-1">
              {t("বিজ্ঞান অলিম্পিয়াড", "Science Olympiad")}
            </h4>
            <p className="text-gray-700">
              {t(
                "বিভাগীয় ও জাতীয় বিজ্ঞান মেলায় শিক্ষার্থীদের উদ্ভাবিত রোবোটিক্স ও পরিবেশবান্ধব প্রকল্প পুরস্কৃত।",
                "Robotics and eco-friendly projects developed by our students have won laurels at divisional and national science fairs."
              )}
            </p>
          </div>
          <div className="rounded border border-blue-100 bg-[#f0f9ff] p-4">
            <h4 className="font-bold text-blue-900 text-sm mb-1">
              {t("বিতর্ক চ্যাম্পিয়নশিপ", "Debate Championship")}
            </h4>
            <p className="text-gray-700">
              {t(
                "আন্তঃস্কুল বারোয়ারি ও সনাতনী বিতর্ক প্রতিযোগিতায় আমাদের দল কৃতিত্বপূর্ণ স্থান অর্জন করেছে।",
                "Our debate society consistently secures top positions in inter-school parliamentary and traditional debate competitions."
              )}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CoCurricularPage;
