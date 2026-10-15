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

const BOOK_CATEGORIES = ["সকল", "গণিত", "বিজ্ঞান", "সাহিত্য", "ইংরেজি", "ইতিহাস", "পদার্থবিজ্ঞান", "রসায়ন", "তথ্যপ্রযুক্তি"];

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen size={20} />,
  BookMarked: <BookMarked size={20} />,
  Users: <Users size={20} />,
  Monitor: <Monitor size={20} />,
};

const STUDY_TIPS = [
  { tip: "প্রতিদিন কমপক্ষে ৩০ মিনিট বই পড়ার অভ্যাস গড়ে তোলো।", icon: Clock },
  { tip: "কঠিন বিষয়গুলো নোট করে রাখো এবং বারবার রিভিশন দাও।", icon: Lightbulb },
  { tip: "গ্রুপ স্টাডিতে অংশ নাও — অন্যকে শেখালে নিজেও শেখা যায়।", icon: Users },
  { tip: "ডিজিটাল রিসোর্স ব্যবহার করো — মুক্তপাঠ ও শিক্ষা বাতায়ন অন্বেষণ করো।", icon: Wifi },
];

export const StudyCornerPage: React.FC = () => {
  const { websiteContent: content } = useSiteSettings();
  const [bookSearch, setBookSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("সকল");

  const books = content.studyCornerBooks?.length
    ? content.studyCornerBooks
    : [
        { title: "Algebra & Higher Mathematics", author: "S.L. Loney", category: "গণিত" },
        { title: "General Science Encyclopedia", author: "Various Authors", category: "বিজ্ঞান" },
        { title: "বাংলা সাহিত্য সমগ্র", author: "রবীন্দ্রনাথ ঠাকুর", category: "সাহিত্য" },
        { title: "English Grammar & Composition", author: "Wren & Martin", category: "ইংরেজি" },
        { title: "বাংলাদেশের ইতিহাস ও সংস্কৃতি", author: "ড. মুহম্মদ কুদরাত-এ-খুদা", category: "ইতিহাস" },
        { title: "Physics for Class 9-10", author: "NCTB", category: "পদার্থবিজ্ঞান" },
        { title: "Chemistry Practical Guide", author: "Prof. Md. Abdur Rahim", category: "রসায়ন" },
        { title: "Computer Science & ICT", author: "Digital Bangladesh Series", category: "তথ্যপ্রযুক্তি" },
      ];

  const resources = content.studyCornerResources?.length
    ? content.studyCornerResources
    : [
        { title: "ডিজিটাল লাইব্রেরি অ্যাক্সেস", description: "মুক্তপাঠ ও শিক্ষা বাতায়নের ই-বুক ও ভিডিও লেকচার", icon: "BookOpen" },
        { title: "শান্ত পাঠ কক্ষ", description: "শিক্ষার্থীদের নিরিবিলি স্ব-অধ্যয়নের জন্য বিশেষ কক্ষ", icon: "BookMarked" },
        { title: "গ্রুপ স্টাডি জোন", description: "দলগত আলোচনা ও প্রজেক্ট ওয়ার্কের জন্য উন্মুক্ত এলাকা", icon: "Users" },
        { title: "কম্পিউটার রিসার্চ ডেস্ক", description: "ইন্টারনেটসহ কম্পিউটার ব্যবহারের সুবিধা", icon: "Monitor" },
      ];

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchCat = selectedCategory === "সকল" || book.category === selectedCategory;
      const matchSearch =
        !bookSearch.trim() ||
        book.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
        book.author.toLowerCase().includes(bookSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [books, selectedCategory, bookSearch]);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <Link to="/" className="flex items-center gap-1 hover:text-[#006a4e]">
          <Home size={14} />
          <span>হোম</span>
        </Link>
        <span>/</span>
        <span className="text-[#006a4e]">Study Corner</span>
      </nav>

      {/* Page Header Banner */}
      <div className="rounded-lg border-2 border-[#006a4e]/40 bg-gradient-to-r from-[#004d38] via-[#006a4e] to-[#005a40] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="rounded bg-[#eab308] px-2.5 py-1 text-xs font-bold text-gray-950">
              পাঠ ও গবেষণা কেন্দ্র
            </span>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              {content.studyCornerTitle || "Study Corner — জ্ঞান অন্বেষণের কেন্দ্র"}
            </h2>
            <p className="mt-1 text-xs text-emerald-200 sm:text-sm">
              শিক্ষার্থীদের সমৃদ্ধ মানসিক বিকাশ ও জ্ঞান আহরণের জন্য বিদ্যালয়ের বিশেষ পাঠ ও গবেষণা কেন্দ্র
            </p>
          </div>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "রেফারেন্স বই", value: "৫০০+" },
              { label: "ই-রিসোর্স", value: "১০০+" },
              { label: "দৈনিক পাঠক", value: "৮০+" },
              { label: "আসন", value: "৪০" },
            ].map((s, i) => (
              <div key={i} className="rounded-md bg-white/15 p-2 text-center backdrop-blur-xs">
                <p className="text-lg font-extrabold">{s.value}</p>
                <p className="text-[10px] font-medium text-emerald-200">{s.label}</p>
              </div>
            ))}
          </div>
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
            />
            <div className="absolute inset-x-0 bottom-0 bg-[#004d38]/90 py-1 text-center text-[10px] font-bold text-white">
              জ্ঞানের আলোয় আলোকিত
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {/* Quote */}
            <div className="rounded-md border-l-4 border-[#006a4e] bg-[#f4f9f6] p-5 shadow-2xs">
              <p className="font-serif text-lg font-bold italic text-[#004d38] sm:text-xl">
                {content.studyCornerQuote || "\u201c\u099c\u09cd\u099e\u09be\u09a8\u0987 \u09b6\u0995\u09cd\u09a4\u09bf\u0964 \u09aa\u09a1\u09bc\u09cb \u098f\u09ac\u0982 \u09a8\u09bf\u099c\u09c7\u0995\u09c7 \u0986\u09b2\u09cb\u0995\u09bf\u09a4 \u0995\u09b0\u09cb\u0964\u201d"}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#006a4e]">— Study Corner, বিদ্যালয় পাঠ কেন্দ্র</p>
            </div>

            <p className="text-sm leading-relaxed text-gray-700">
              {content.studyCornerText ||
                "বিদ্যালয়ের Study Corner হলো শিক্ষার্থীদের জন্য একটি বিশেষ পাঠ ও গবেষণা কেন্দ্র যেখানে রয়েছে সমৃদ্ধ পাঠাগার, ডিজিটাল রিসোর্স, বিজ্ঞান ও গণিতের রেফারেন্স বই, এবং শান্ত পরিবেশে স্ব-অধ্যয়নের সুযোগ। এখানে শিক্ষার্থীরা পাঠ্যক্রমের বাইরেও নানা বিষয়ে জ্ঞান আহরণ করতে পারে।"}
            </p>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-[#006a4e]">
                সোমবার - শনিবার
              </span>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                সকাল ৮:০০ - বিকাল ৪:০০
              </span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                বিনামূল্যে প্রবেশ
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities / Resources Section */}
      <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
        <h3 className="flex items-center gap-2 border-b pb-3 text-lg font-bold text-[#005a40]">
          <Award size={18} className="text-[#006a4e]" />
          <span>Study Corner-এর সুযোগ-সুবিধাসমূহ</span>
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
              <h4 className="text-sm font-bold text-gray-900">{res.title}</h4>
              <p className="text-xs leading-relaxed text-gray-600">{res.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Book Catalogue with Filter */}
      <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-[#005a40]">
            <BookOpen size={18} />
            <span>Study Corner পাঠাগারের বইসমূহ</span>
          </h3>
          {/* Search */}
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              placeholder="বই বা লেখক খুঁজুন..."
              className="w-full rounded-md border border-[#cbe0d3] bg-[#f9fbf9] py-1.5 pl-8 pr-3 text-xs text-gray-900 outline-none transition focus:border-[#006a4e] focus:bg-white"
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Category Filters */}
        <div className="mt-4 flex flex-wrap gap-1.5 border-b border-gray-100 pb-3">
          <Filter size={14} className="mt-1 shrink-0 text-gray-400" />
          {BOOK_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                selectedCategory === cat
                  ? "bg-[#006a4e] text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-[#006a4e]"
              }`}
            >
              {cat}
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
                  <p className="text-xs font-bold leading-snug text-gray-900">{book.title}</p>
                  <p className="mt-0.5 text-[10px] text-gray-500">{book.author}</p>
                  <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                    {book.category}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-4 rounded-md border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500">
              কোনো বই পাওয়া যায়নি।
            </div>
          )}
        </div>
      </section>

      {/* Study Tips Section */}
      <section className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs">
        <h3 className="flex items-center gap-2 border-b pb-3 text-lg font-bold text-[#005a40]">
          <Star size={18} className="text-[#eab308]" />
          <span>কার্যকর অধ্যয়নের টিপস ও কৌশল</span>
        </h3>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {STUDY_TIPS.map((t, i) => {
            const Icon = t.icon;
            return (
              <div
                key={i}
                className="rounded-lg border border-[#e4ede7] bg-gradient-to-br from-[#f4f9f6] to-white p-4 text-center"
              >
                <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#006a4e]/10 text-[#006a4e]">
                  <Icon size={18} />
                </span>
                <p className="text-xs leading-relaxed text-gray-700">{t.tip}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Digital Resources Links */}
      <section className="rounded-lg border-2 border-[#006a4e]/30 bg-gradient-to-br from-[#f2f9f5] to-white p-6 shadow-xs">
        <h3 className="flex items-center gap-2 border-b border-emerald-100 pb-3 text-lg font-bold text-[#005a40]">
          <Monitor size={18} />
          <span>বিনামূল্যে ডিজিটাল শিক্ষা উপকরণ</span>
        </h3>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { name: "মুক্তপাঠ (ই-লার্নিং প্লাটফর্ম)", url: "https://muktopaath.gov.bd", desc: "সরকারি ই-বুক ও ভিডিও কোর্স" },
            { name: "শিক্ষা বাতায়ন (Teachers Portal)", url: "https://teachers.gov.bd", desc: "শিক্ষক ও শিক্ষার্থীদের জন্য ডিজিটাল কন্টেন্ট" },
            { name: "NCTB ডিজিটাল পাঠ্যপুস্তক", url: "https://nctb.gov.bd", desc: "জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড" },
            { name: "Khan Academy (বাংলা)", url: "https://bn.khanacademy.org", desc: "বিনামূল্যে গণিত ও বিজ্ঞান শিক্ষা" },
          ].map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-md border border-[#cbe0d3] bg-white p-4 transition hover:border-[#006a4e] hover:shadow-sm"
            >
              <div>
                <p className="text-sm font-bold text-gray-900">{link.name}</p>
                <p className="text-xs text-gray-500">{link.desc}</p>
              </div>
              <ArrowRight size={15} className="shrink-0 text-[#006a4e]" />
            </a>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <div className="rounded-lg bg-[#006a4e] p-5 text-center text-white">
        <p className="text-sm font-bold">Study Corner আপনার জন্য সর্বদা উন্মুক্ত</p>
        <p className="mt-1 text-xs text-emerald-200">
          বিদ্যালয়ের যেকোনো কার্যদিবসে সকাল ৮টা থেকে বিকাল ৪টার মধ্যে Study Corner পরিদর্শন করুন।
        </p>
        <Link
          to="/contact"
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#eab308] px-5 py-2 text-xs font-bold text-gray-950 transition hover:bg-[#fde047]"
        >
          <span>যোগাযোগ করুন</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
};

export default StudyCornerPage;
