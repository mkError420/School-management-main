import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  BookMarked,
  Home,
  Monitor,
  Users,
  Search,
  Star,
  Clock,
  Wifi,
  Lightbulb,
  Award,
  ArrowRight,
  Filter,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen size={20} />,
  BookMarked: <BookMarked size={20} />,
  Users: <Users size={20} />,
  Monitor: <Monitor size={20} />,
  Award: <Award size={20} />,
  Lightbulb: <Lightbulb size={20} />,
  Clock: <Clock size={20} />,
  Wifi: <Wifi size={20} />,
  Star: <Star size={20} />,
};

const DEFAULT_STATS = [
  { label: "রেফারেন্স বই", labelEn: "Reference Books", value: "৫০০+", valueEn: "500+" },
  { label: "ই-রিসোর্স", labelEn: "E-Resources", value: "১০০+", valueEn: "100+" },
  { label: "দৈনিক পাঠক", labelEn: "Daily Readers", value: "৮০+", valueEn: "80+" },
  { label: "আসন", labelEn: "Seats", value: "৪০", valueEn: "40" },
];

const DEFAULT_BOOKS = [
  { title: "Algebra & Higher Mathematics", titleEn: "Algebra & Higher Mathematics", author: "S.L. Loney", authorEn: "S.L. Loney", category: "গণিত", categoryEn: "Mathematics" },
  { title: "General Science Encyclopedia", titleEn: "General Science Encyclopedia", author: "Various Authors", authorEn: "Various Authors", category: "বিজ্ঞান", categoryEn: "Science" },
  { title: "বাংলা সাহিত্য সমগ্র", titleEn: "Collected Bengali Literature", author: "রবীন্দ্রনাথ ঠাকুর", authorEn: "Rabindranath Tagore", category: "সাহিত্য", categoryEn: "Literature" },
  { title: "English Grammar & Composition", titleEn: "English Grammar & Composition", author: "Wren & Martin", authorEn: "Wren & Martin", category: "ইংরেজি", categoryEn: "English" },
  { title: "বাংলাদেশের ইতিহাস ও সংস্কৃতি", titleEn: "History & Culture of Bangladesh", author: "ড. মুহম্মদ কুদরাত-এ-খুদা", authorEn: "Dr. Muhammad Qudrat-i-Khuda", category: "ইতিহাস", categoryEn: "History" },
  { title: "Physics for Class 9-10", titleEn: "Physics for Class 9-10", author: "NCTB", authorEn: "NCTB", category: "পদার্থবিজ্ঞান", categoryEn: "Physics" },
  { title: "Chemistry Practical Guide", titleEn: "Chemistry Practical Guide", author: "Prof. Md. Abdur Rahim", authorEn: "Prof. Md. Abdur Rahim", category: "রসায়ন", categoryEn: "Chemistry" },
  { title: "Computer Science & ICT", titleEn: "Computer Science & ICT", author: "Digital Bangladesh Series", authorEn: "Digital Bangladesh Series", category: "তথ্যপ্রযুক্তি", categoryEn: "ICT" },
];

const DEFAULT_RESOURCES = [
  { title: "ডিজিটাল লাইব্রেরি অ্যাক্সেস", titleEn: "Digital Library Access", description: "মুক্তপাঠ ও শিক্ষা বাতায়নের ই-বুক ও ভিডিও লেকচার", descriptionEn: "E-books & video lectures via Muktopaath & Teachers Portal", icon: "BookOpen" },
  { title: "শান্ত পাঠ কক্ষ", titleEn: "Quiet Reading Room", description: "শিক্ষার্থীদের নিরিবিলি স্ব-অধ্যয়নের জন্য বিশেষ কক্ষ", descriptionEn: "Specialized silent room for uninterrupted self-study", icon: "BookMarked" },
  { title: "গ্রুপ স্টাডি জোন", titleEn: "Group Study Zone", description: "দলগত আলোচনা ও প্রজেক্ট ওয়ার্কের জন্য উন্মুক্ত এলাকা", descriptionEn: "Open area for group discussion & team projects", icon: "Users" },
  { title: "কম্পিউটার রিসার্চ ডেস্ক", titleEn: "Computer Research Desk", description: "ইন্টারনেটসহ কম্পিউটার ব্যবহারের সুবিধা", descriptionEn: "Computer and high-speed internet access", icon: "Monitor" },
];

const DEFAULT_LINKS = [
  { name: "মুক্তপাঠ (ই-লার্নিং প্লাটফর্ম)", nameEn: "Muktopaath (E-Learning Platform)", url: "https://muktopaath.gov.bd", desc: "সরকারি ই-বুক ও ভিডিও কোর্স", descEn: "Official government e-books & video courses" },
  { name: "শিক্ষা বাতায়ন (Teachers Portal)", nameEn: "Teachers Portal (Shikkhok Batayan)", url: "https://teachers.gov.bd", desc: "শিক্ষক ও শিক্ষার্থীদের জন্য ডিজিটাল কন্টেন্ট", descEn: "Digital learning content for teachers and students" },
  { name: "NCTB ডিজিটাল পাঠ্যপুস্তক", nameEn: "NCTB Digital Textbooks", url: "https://nctb.gov.bd", desc: "জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড", descEn: "National Curriculum & Textbook Board Portal" },
  { name: "Khan Academy (বাংলা)", nameEn: "Khan Academy (Bangla)", url: "https://bn.khanacademy.org", desc: "বিনামূল্যে গণিত ও বিজ্ঞান শিক্ষা", descEn: "Free mathematics & science education" },
];

const DEFAULT_TIPS = [
  { tip: "প্রতিদিন কমপক্ষে ৩০ মিনিট বই পড়ার অভ্যাস গড়ে তোলো।", tipEn: "Cultivate the habit of reading for at least 30 minutes every day." },
  { tip: "কঠিন বিষয়গুলো নোট করে রাখো এবং বারবার রিভিশন দাও।", tipEn: "Take notes on difficult topics and revise them regularly." },
  { tip: "গ্রুপ স্টাডিতে অংশ নাও — অন্যকে শেখালে নিজেও শেখা যায়।", tipEn: "Participate in group study — teaching others deepens your own understanding." },
  { tip: "ডিজিটাল রিসোর্স ব্যবহার করো — মুক্তপাঠ ও শিক্ষা বাতায়ন অন্বেষণ করো।", tipEn: "Utilize digital tools — explore Muktopaath and Teachers Portal." },
];

const TIP_ICONS = [Clock, Lightbulb, Users, Wifi, Award, Star];

export const StudyCornerPage: React.FC = () => {
  const { websiteContent: content, t, lang, formatDigits } = useSiteSettings();
  const [bookSearch, setBookSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("সকল");

  const books = content.studyCornerBooks?.length ? content.studyCornerBooks : DEFAULT_BOOKS;
  const resources = content.studyCornerResources?.length ? content.studyCornerResources : DEFAULT_RESOURCES;
  const stats = content.studyCornerStats?.length ? content.studyCornerStats : DEFAULT_STATS;
  const links = content.studyCornerLinks?.length ? content.studyCornerLinks : DEFAULT_LINKS;
  const tips = content.studyCornerTips?.length ? content.studyCornerTips : DEFAULT_TIPS;

  // Dynamically compute book categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      const cat = lang === "en" ? (b.categoryEn || b.category) : b.category;
      if (cat && cat.trim()) {
        set.add(cat.trim());
      }
    });
    return [lang === "en" ? "All" : "সকল", ...Array.from(set)];
  }, [books, lang]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const catCurrent = lang === "en" ? (book.categoryEn || book.category) : book.category;
      const allKey = lang === "en" ? "All" : "সকল";
      const matchCat = selectedCategory === allKey || selectedCategory === "সকল" || selectedCategory === "All" || catCurrent === selectedCategory || book.category === selectedCategory || (book.categoryEn || "") === selectedCategory;

      const q = bookSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        book.title?.toLowerCase().includes(q) ||
        book.titleEn?.toLowerCase().includes(q) ||
        book.author?.toLowerCase().includes(q) ||
        book.authorEn?.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [books, selectedCategory, bookSearch, lang]);

  return (
    <div className="space-y-8 font-sans">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <Link to="/" className="flex items-center gap-1 hover:text-[#006a4e]">
          <Home size={14} />
          <span>{t("হোম", "Home")}</span>
        </Link>
        <span>/</span>
        <span className="text-[#006a4e]">{t("স্টাডি কর্নার", "Study Corner")}</span>
      </nav>

      {/* Page Header Banner */}
      <div className="rounded-lg border-2 border-[#006a4e]/40 bg-gradient-to-r from-[#004d38] via-[#006a4e] to-[#005a40] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="rounded bg-[#eab308] px-2.5 py-1 text-xs font-bold text-gray-950">
              {t("পাঠ ও গবেষণা কেন্দ্র", "Study & Research Center")}
            </span>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              {t(content.studyCornerTitle, content.studyCornerTitleEn) || t("Study Corner — জ্ঞান অন্বেষণের কেন্দ্র", "Study Corner — Center for Knowledge Exploration")}
            </h2>
            <p className="mt-1 text-xs text-emerald-200 sm:text-sm">
              {t(content.studyCornerSubtitle, content.studyCornerSubtitleEn) ||
                t(
                  "শিক্ষার্থীদের সমৃদ্ধ মানসিক বিকাশ ও জ্ঞান আহরণের জন্য বিদ্যালয়ের বিশেষ পাঠ ও গবেষণা কেন্দ্র",
                  "Dedicated study and research center for student enrichment and cognitive growth"
                )}
            </p>
          </div>

          {/* Quick Stats */}
          {stats.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stats.map((s, i) => (
                <div key={i} className="rounded-md bg-white/15 p-2 text-center backdrop-blur-xs">
                  <p className="text-lg font-extrabold">{formatDigits(t(s.value, s.valueEn))}</p>
                  <p className="text-[10px] font-medium text-emerald-200">{t(s.label, s.labelEn)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Intro + Image */}
      <section className="relative overflow-hidden rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="relative mx-auto h-56 w-44 shrink-0 overflow-hidden rounded-lg border-2 border-[#006a4e] bg-gray-100 shadow-xl sm:mx-0">
            <img
              src={content.studyCornerImage || "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=600"}
              alt="Study Corner"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/images/bgimage.jpg";
              }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-[#004d38]/90 py-1 text-center text-[10px] font-bold text-white">
              {t("জ্ঞানের আলোয় আলোকিত", "Illuminated by Knowledge")}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {/* Quote */}
            <div className="rounded-md border-l-4 border-[#006a4e] bg-[#f4f9f6] p-5 shadow-2xs">
              <p className="font-serif text-lg font-bold italic text-[#004d38] sm:text-xl">
                {t(content.studyCornerQuote, content.studyCornerQuoteEn) || t("“জ্ঞানই শক্তি। পড়ো এবং নিজেকে আলোকিত করো।”", "“Knowledge is power. Read and enlighten yourself.”")}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#006a4e]">
                — {t(content.studyCornerQuoteAuthor, content.studyCornerQuoteAuthorEn) || t("Study Corner, বিদ্যালয় পাঠ কেন্দ্র", "Study Corner, School Study Center")}
              </p>
            </div>

            <p className="text-sm leading-relaxed text-gray-700">
              {t(content.studyCornerText, content.studyCornerTextEn) ||
                t(
                  "বিদ্যালয়ের Study Corner হলো শিক্ষার্থীদের জন্য একটি বিশেষ পাঠ ও গবেষণা কেন্দ্র যেখানে রয়েছে সমৃদ্ধ পাঠাগার, ডিজিটাল রিসোর্স, বিজ্ঞান ও গণিতের রেফারেন্স বই, এবং শান্ত পরিবেশে স্ব-অধ্যয়নের সুযোগ। এখানে শিক্ষার্থীরা পাঠ্যক্রমের বাইরেও নানা বিষয়ে জ্ঞান আহরণ করতে পারে।",
                  "The school's Study Corner is a premier learning and research hub equipped with a rich library, digital resources, reference books in science and mathematics, and serene spaces for self-study."
                )}
            </p>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-[#006a4e]">
                {t(content.studyCornerDays, content.studyCornerDaysEn) || t("সোমবার - শনিবার", "Monday - Saturday")}
              </span>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                {formatDigits(t(content.studyCornerHours, content.studyCornerHoursEn)) || t("সকাল ৮:০০ - বিকাল ৪:০০", "8:00 AM - 4:00 PM")}
              </span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                {t(content.studyCornerFee, content.studyCornerFeeEn) || t("বিনামূল্যে প্রবেশ", "Free Admission")}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities / Resources Section */}
      {resources.length > 0 && (
        <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
          <h3 className="flex items-center gap-2 border-b pb-3 text-lg font-bold text-[#005a40]">
            <Award size={18} className="text-[#006a4e]" />
            <span>{t("Study Corner-এর সুযোগ-সুবিধাসমূহ", "Study Corner Facilities")}</span>
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {resources.map((res, i) => (
              <div
                key={i}
                className="group flex flex-col items-center gap-3 rounded-lg border border-[#e4ede7] bg-[#f7faf8] p-5 text-center transition hover:border-[#006a4e] hover:shadow-md"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#006a4e]/10 text-[#006a4e] group-hover:bg-[#006a4e] group-hover:text-white transition">
                  {RESOURCE_ICONS[res.icon] ?? <BookOpen size={20} />}
                </span>
                <h4 className="text-sm font-bold text-gray-900">{t(res.title, res.titleEn)}</h4>
                <p className="text-xs leading-relaxed text-gray-600">{t(res.description, res.descriptionEn)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Book Catalogue with Filter */}
      <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-[#005a40]">
            <BookOpen size={18} />
            <span>
              {t("Study Corner পাঠাগারের বইসমূহ", "Study Corner Library Books")} ({formatDigits(books.length)})
            </span>
          </h3>
          {/* Search */}
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              placeholder={t("বই বা লেখক খুঁজুন...", "Search book or author...")}
              className="w-full rounded-md border border-[#cbe0d3] bg-[#f9fbf9] py-1.5 pl-8 pr-3 text-xs text-gray-900 outline-none transition focus:border-[#006a4e] focus:bg-white"
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Category Filters */}
        <div className="mt-4 flex flex-wrap gap-1.5 border-b border-gray-100 pb-3">
          <Filter size={14} className="mt-1 shrink-0 text-gray-400" />
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${selectedCategory === cat
                ? "bg-[#006a4e] text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-[#006a4e]"
                }`}
            >
              {cat === "সকল" ? t("সকল", "All") : cat}
            </button>
          ))}
        </div>

        {/* Book Grid */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {filteredBooks.length > 0 ? (
            filteredBooks.map((book, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-md border border-gray-100 bg-[#fcfdfc] p-3 transition hover:border-[#006a4e] hover:shadow-2xs"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#006a4e]/10 text-[#006a4e]">
                  <BookOpen size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-snug text-gray-900">{t(book.title, book.titleEn)}</p>
                  <p className="mt-0.5 text-[10px] text-gray-500">{t(book.author, book.authorEn)}</p>
                  <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                    {t(book.category, book.categoryEn)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-4 rounded-md border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500">
              {t("কোনো বই পাওয়া যায়নি।", "No books found.")}
            </div>
          )}
        </div>
      </section>

      {/* Study Tips Section */}
      {tips.length > 0 && (
        <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
          <h3 className="flex items-center gap-2 border-b pb-3 text-lg font-bold text-[#005a40]">
            <span>{t("কার্যকর অধ্যয়নের টিপস ও কৌশল", "Effective Study Tips & Strategies")}</span>
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {tips.map((tItem, i) => {
              const Icon = TIP_ICONS[i % TIP_ICONS.length];
              return (
                <div
                  key={i}
                  className="rounded-lg border border-[#e4ede7] bg-gradient-to-br from-[#f4f9f6] to-white p-4 text-center"
                >
                  <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#006a4e]/10 text-[#006a4e]">
                    <Icon size={18} />
                  </span>
                  <p className="text-xs leading-relaxed text-gray-700">{t(tItem.tip, tItem.tipEn)}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Digital Resources Links */}
      {links.length > 0 && (
        <section className="rounded-lg border-2 border-[#006a4e]/30 bg-gradient-to-br from-[#f2f9f5] to-white p-6 shadow-xs">
          <h3 className="flex items-center gap-2 border-b border-emerald-100 pb-3 text-lg font-bold text-[#005a40]">
            <Monitor size={18} />
            <span>{t("বিনামূল্যে ডিজিটাল শিক্ষা উপকরণ", "Free Digital Learning Materials")}</span>
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-md border border-[#cbe0d3] bg-white p-4 transition hover:border-[#006a4e] hover:shadow-sm"
              >
                <div>
                  <p className="text-sm font-bold text-gray-900">{t(link.name, link.nameEn)}</p>
                  <p className="text-xs text-gray-500">{t(link.desc, link.descEn)}</p>
                </div>
                <ArrowRight size={15} className="shrink-0 text-[#006a4e]" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* CTA Footer */}
      <div className="rounded-lg bg-[#006a4e] p-5 text-center text-white">
        <p className="text-sm font-bold">{t("Study Corner আপনার জন্য সর্বদা উন্মুক্ত", "Study Corner is Always Open for You")}</p>
        <p className="mt-1 text-xs text-emerald-200">
          {t(
            `বিদ্যালয়ের যেকোনো কার্যদিবসে ${content.studyCornerHours || "সকাল ৮:০০ থেকে বিকাল ৪:০০"}-এর মধ্যে Study Corner পরিদর্শন করুন।`,
            `Visit Study Corner on any school working day between ${content.studyCornerHoursEn || content.studyCornerHours || "8:00 AM and 4:00 PM"}.`
          )}
        </p>
        <Link
          to="/contact"
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#eab308] px-5 py-2 text-xs font-bold text-gray-950 transition hover:bg-[#fde047]"
        >
          <span>{t("যোগাযোগ করুন", "Contact Us")}</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
};

export default StudyCornerPage;
