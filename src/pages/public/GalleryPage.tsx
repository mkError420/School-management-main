import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Home,
  Image as ImageIcon,
  X,
  ZoomIn,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import type { SchoolGalleryItem } from "@/types/site";

export const GalleryPage: React.FC = () => {
  const { websiteContent: content, t, lang, formatDigits } = useSiteSettings();
  const [activeCategory, setActiveCategory] = useState<string>("সকল");
  const [previewImage, setPreviewImage] = useState<SchoolGalleryItem | null>(null);

  // Dynamic Categories from content.gallery
  const categories = useMemo(() => {
    const list = Array.isArray(content.gallery) ? content.gallery : [];
    const catMap = new Map<string, { labelBn: string; labelEn: string }>();

    // Baseline categories
    catMap.set("সকল", { labelBn: "সকল", labelEn: "All" });
    catMap.set("ক্যাম্পাস", { labelBn: "ক্যাম্পাস", labelEn: "Campus" });
    catMap.set("ল্যাব", { labelBn: "ল্যাব", labelEn: "Labs" });
    catMap.set("সমাবেশ", { labelBn: "সমাবেশ", labelEn: "Assembly" });
    catMap.set("ক্রীড়া", { labelBn: "ক্রীড়া", labelEn: "Sports" });
    catMap.set("বিজ্ঞান মেলা", { labelBn: "বিজ্ঞান মেলা", labelEn: "Science Fair" });
    catMap.set("জাতীয় দিবস", { labelBn: "জাতীয় দিবস", labelEn: "National Days" });

    // Extract all dynamic categories present in content.gallery
    list.forEach((item) => {
      const bn = (item.category || "").trim();
      const en = (item.categoryEn || "").trim();
      if (bn && !catMap.has(bn)) {
        catMap.set(bn, { labelBn: bn, labelEn: en || bn });
      }
    });

    const result: Array<{ key: string; labelBn: string; labelEn: string; count: number }> = [];
    catMap.forEach((val, key) => {
      let count = 0;
      if (key === "সকল") {
        count = list.length;
      } else {
        count = list.filter((p) => {
          const itemCatBn = (p.category || "").trim().toLowerCase();
          const itemCatEn = (p.categoryEn || "").trim().toLowerCase();
          const target = key.toLowerCase();
          return (
            itemCatBn === target ||
            itemCatEn === target ||
            itemCatBn.includes(target) ||
            itemCatEn.includes(target)
          );
        }).length;
      }

      // Show "সকল", or any category that has at least 1 photo
      if (key === "সকল" || count > 0) {
        result.push({ key, labelBn: val.labelBn, labelEn: val.labelEn, count });
      }
    });

    return result;
  }, [content.gallery]);

  const filteredPhotos = useMemo(() => {
    const list = Array.isArray(content.gallery) ? content.gallery : [];
    if (activeCategory === "সকল") return list;
    return list.filter((item) => {
      const catBn = (item.category || "").trim().toLowerCase();
      const catEn = (item.categoryEn || "").trim().toLowerCase();
      const act = activeCategory.trim().toLowerCase();
      return (
        catBn === act ||
        catEn === act ||
        catBn.includes(act) ||
        (act === "campus" && (catBn.includes("ক্যাম্পাস") || catEn.includes("campus"))) ||
        (act === "labs" && (catBn.includes("ল্যাব") || catEn.includes("lab"))) ||
        (act === "assembly" && (catBn.includes("সমাবেশ") || catEn.includes("assembly"))) ||
        (act === "sports" && (catBn.includes("ক্রীড়া") || catEn.includes("sport"))) ||
        (act === "science fair" && (catBn.includes("বিজ্ঞান") || catEn.includes("science"))) ||
        (act === "national days" && (catBn.includes("দিবস") || catEn.includes("national")))
      );
    });
  }, [content.gallery, activeCategory]);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <Link to="/" className="flex items-center gap-1 hover:text-[#006a4e]">
          <Home size={14} />
          <span>{t("হোম", "Home")}</span>
        </Link>
        <span>/</span>
        <span className="text-[#006a4e]">{t("ফটো গ্যালারি", "Photo Gallery")}</span>
      </nav>

      {/* Page Header */}
      <div className="rounded-lg border border-[#cbe0d3] bg-[#004d38] p-6 text-white shadow-md sm:p-8">
        <span className="rounded bg-[#eab308] px-2.5 py-1 text-xs font-bold text-gray-950">
          {t("ছবিতে আমাদের বিদ্যালয়", "Our School in Pictures")}
        </span>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
          {t("বিদ্যালয় ফটো গ্যালারি", "School Photo Gallery")}
        </h2>
        <p className="mt-1 text-xs text-emerald-200 sm:text-sm">
          {t(
            "ক্যাম্পাস প্রাঙ্গণ, ল্যাব, ক্রীড়া প্রতিযোগিতা ও বিভিন্ন জাতীয় দিবসের খণ্ডচিত্র",
            "Moments captured from campus grounds, laboratories, sports meets, and national day celebrations"
          )} ({formatDigits((content.gallery || []).length)} {t("টি ছবি", "Photos")})
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-xs">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setActiveCategory(cat.key)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition ${
              activeCategory === cat.key
                ? "bg-[#006a4e] text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-[#006a4e]"
            }`}
          >
            <span>{t(cat.labelBn, cat.labelEn)}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activeCategory === cat.key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              {formatDigits(cat.count)}
            </span>
          </button>
        ))}
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
        {filteredPhotos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => setPreviewImage(photo)}
            className="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-xs transition hover:border-[#006a4e] hover:shadow-md"
          >
            <div className="aspect-4/3 w-full overflow-hidden">
              <img
                src={photo.imageUrl}
                alt={t(photo.title, photo.titleEn)}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = "/images/bgimage.jpg";
                }}
              />
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
              <span className="flex items-center gap-1.5 rounded-full bg-[#006a4e] px-3 py-1.5 text-xs font-bold shadow-md">
                <ZoomIn size={14} />
                <span>{t("বড় করে দেখুন", "Enlarge")}</span>
              </span>
            </div>
            <div className="p-3 bg-white">
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-[#006a4e]">
                {t(photo.category, photo.categoryEn)}
              </span>
              <h4 className="mt-1 font-bold text-xs text-gray-900 line-clamp-1">
                {t(photo.title, photo.titleEn)}
              </h4>
            </div>
          </div>
        ))}

        {filteredPhotos.length === 0 && (
          <div className="col-span-full rounded-md border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500">
            {t("এই ক্যাটাগরিতে কোনো ছবি পাওয়া যায়নি।", "No photos found in this category.")}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-lg bg-black"
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <img
              src={previewImage.imageUrl}
              alt={t(previewImage.title, previewImage.titleEn)}
              className="max-h-[80vh] w-auto object-contain"
            />
            <div className="p-3 text-white bg-black/90">
              <span className="rounded bg-[#006a4e] px-2 py-0.5 text-xs font-bold">
                {t(previewImage.category, previewImage.categoryEn)}
              </span>
              <p className="mt-1 text-sm font-semibold">
                {t(previewImage.title, previewImage.titleEn)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
