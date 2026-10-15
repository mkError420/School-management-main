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
  const { websiteContent: content } = useSiteSettings();
  const [activeCategory, setActiveCategory] = useState<string>("সকল");
  const [previewImage, setPreviewImage] = useState<SchoolGalleryItem | null>(null);

  const categories = ["সকল", "ক্যাম্পাস", "ল্যাব", "সমাবেশ", "ক্রীড়া", "বিজ্ঞান মেলা", "জাতীয় দিবস"];

  const filteredPhotos = useMemo(() => {
    const list = Array.isArray(content.gallery) ? content.gallery : [];
    if (activeCategory === "সকল") return list;
    return list.filter((item) => item.category === activeCategory);
  }, [content.gallery, activeCategory]);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <Link to="/" className="flex items-center gap-1 hover:text-[#006a4e]">
          <Home size={14} />
          <span>হোম</span>
        </Link>
        <span>/</span>
        <span className="text-[#006a4e]">ফটো গ্যালারি</span>
      </nav>

      {/* Page Header */}
      <div className="rounded-lg border border-[#cbe0d3] bg-[#004d38] p-6 text-white shadow-md sm:p-8">
        <span className="rounded bg-[#eab308] px-2.5 py-1 text-xs font-bold text-gray-950">
          ছবিতে আমাদের বিদ্যালয়
        </span>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">বিদ্যালয় ফটো গ্যালারি</h2>
        <p className="mt-1 text-xs text-emerald-200 sm:text-sm">
          ক্যাম্পাস প্রাঙ্গণ, ল্যাব, ক্রীড়া প্রতিযোগিতা ও বিভিন্ন জাতীয় দিবসের খণ্ডচিত্র
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`rounded-md px-3.5 py-1.5 text-xs font-bold transition ${
              activeCategory === cat
                ? "bg-[#006a4e] text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-[#006a4e]"
            }`}
          >
            {cat}
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
                alt={photo.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = "/images/bgimage.jpg";
                }}
              />
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
              <span className="flex items-center gap-1.5 rounded-full bg-[#006a4e] px-3 py-1.5 text-xs font-bold shadow-md">
                <ZoomIn size={14} />
                <span>বড় করে দেখুন</span>
              </span>
            </div>
            <div className="p-3 bg-white">
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-[#006a4e]">
                {photo.category}
              </span>
              <h4 className="mt-1 font-bold text-xs text-gray-900 line-clamp-1">{photo.title}</h4>
            </div>
          </div>
        ))}

        {filteredPhotos.length === 0 && (
          <div className="col-span-full rounded-md border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500">
            এই ক্যাটাগরিতে কোনো ছবি পাওয়া যায়নি।
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
              aria-label="বন্ধ করুন"
            >
              <X size={20} />
            </button>
            <img
              src={previewImage.imageUrl}
              alt={previewImage.title}
              className="max-h-[80vh] w-auto object-contain"
            />
            <div className="p-3 text-white bg-black/90">
              <span className="rounded bg-[#006a4e] px-2 py-0.5 text-xs font-bold">{previewImage.category}</span>
              <p className="mt-1 text-sm font-semibold">{previewImage.title}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
