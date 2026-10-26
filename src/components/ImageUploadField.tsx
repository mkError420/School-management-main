import React, { useRef, useState } from "react";
import {
  Upload,
  Link as LinkIcon,
  X,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  ExternalLink,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";

export interface ImageUploadFieldProps {
  label: string;
  labelEn?: string;
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: "square" | "video" | "banner" | "portrait";
  placeholder?: string;
  helperText?: string;
  presets?: Array<{ label: string; url: string }>;
  disabled?: boolean;
  className?: string;
  uploadEndpoint?: "notice" | "logo" | "general";
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  labelEn,
  value,
  onChange,
  aspectRatio = "video",
  placeholder = "https://... অথবা /images/...",
  helperText,
  presets = [],
  disabled = false,
  className = "",
  uploadEndpoint = "general",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Aspect ratio classes for preview
  const aspectClass =
    aspectRatio === "square"
      ? "w-24 h-24 sm:w-28 sm:h-28"
      : aspectRatio === "portrait"
        ? "w-24 h-32 sm:w-28 sm:h-36"
        : aspectRatio === "banner"
          ? "w-full max-w-sm h-28 sm:h-32"
          : "w-36 h-24 sm:w-44 sm:h-28";

  const handleFileProcess = async (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith("image/") && !file.name.match(/\.(jpg|jpeg|png|webp|svg|gif)$/i)) {
      setUploadError("শুধুমাত্র ইমেজ ফাইল (JPG, PNG, WebP, SVG) আপলোড করা যাবে।");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("ফাইলের সাইজ সর্বোচ্চ ১০ MB হতে পারবে।");
      return;
    }

    setIsUploading(true);
    setImgError(false);

    try {
      // 1. Try server-side upload API first
      let uploadRes: any;
      if (uploadEndpoint === "logo") {
        uploadRes = await api.uploadSiteLogo(file);
      } else {
        uploadRes = await api.uploadNoticeFile(file);
      }

      if (uploadRes && uploadRes.success && (uploadRes.data?.file_url || uploadRes.data?.site_logo)) {
        const uploadedUrl = uploadRes.data.file_url || uploadRes.data.site_logo;
        onChange(uploadedUrl);
        setIsUploading(false);
        return;
      }
    } catch {
      // Ignore and fallback to client FileReader base64
    }

    // 2. Fallback: Base64 Data URL (ensures 100% offline & static support)
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (dataUrl) {
        onChange(dataUrl);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setUploadError("ছবিটি লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    // reset input so the same file can be re-selected if needed
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const triggerBrowse = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleClear = () => {
    onChange("");
    setImgError(false);
    setUploadError(null);
  };

  const isDataUrl = value?.startsWith("data:");
  const hasValue = Boolean(value && value.trim());

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label & Dual Lang Info */}
      <div className="flex flex-wrap items-center justify-between gap-1">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {label}
          {labelEn && (
            <span className="ml-1 text-[11px] font-normal text-blue-700 dark:text-blue-300">
              ({labelEn})
            </span>
          )}
        </label>

        <div className="flex items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setShowUrlInput((prev) => !prev)}
            className="inline-flex items-center gap-1 font-semibold text-[#006a4e] hover:underline dark:text-emerald-400"
          >
            <LinkIcon size={11} />
            <span>{showUrlInput ? "লিংক লুকান" : "সরাসরি লিংক"}</span>
          </button>
        </div>
      </div>

      {/* Main Upload Box */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-lg border p-2.5 transition ${isDragOver
          ? "border-[#006a4e] bg-emerald-50/70 dark:border-emerald-500 dark:bg-emerald-950/30"
          : "border-gray-200 bg-white hover:border-gray-300 dark:border-slate-700 dark:bg-slate-800"
          }`}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
          onChange={handleFileChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {/* Preview Thumbnail Box */}
        <div
          className={`relative shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100 dark:border-slate-700 dark:bg-slate-900 flex items-center justify-center ${aspectClass}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center gap-1 text-[#006a4e]">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-[10px] font-bold">আপলোড হচ্ছে...</span>
            </div>
          ) : hasValue && !imgError ? (
            <img
              src={value}
              alt={label}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 p-2 text-center">
              <ImageIcon size={22} />
              <span className="text-[10px] font-medium leading-tight">
                {imgError ? "ছবি লোড হয়নি" : "কোনো ছবি নেই"}
              </span>
            </div>
          )}

          {/* Quick Clear Button on Image */}
          {hasValue && !isUploading && (
            <button
              type="button"
              onClick={handleClear}
              title="ছবি মুছুন (Remove Image)"
              className="absolute right-1 top-1 rounded-full bg-red-600/90 p-1 text-white shadow-xs transition hover:bg-red-700"
            >
              <X size={11} />
            </button>
          )}

          {/* Type Badge */}
          {hasValue && !isUploading && !imgError && (
            <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-semibold text-white backdrop-blur-xs">
              {isDataUrl ? "Uploaded" : "URL"}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-1 flex-col justify-center gap-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={triggerBrowse}
              disabled={disabled || isUploading}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#00503a] disabled:opacity-50"
            >
              <Upload size={13} />
              <span>ডিভাইস থেকে আপলোড</span>
            </button>

            {hasValue && (
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled || isUploading}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
              >
                <X size={12} />
                <span>রিমুভ</span>
              </button>
            )}

            {hasValue && !isDataUrl && (
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-[#006a4e] dark:text-gray-400"
              >
                <ExternalLink size={11} />
                <span>ওপেন</span>
              </a>
            )}
          </div>

          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            JPG, PNG, WebP বা SVG ফরম্যাট (ড্র্যাগ ও ড্রপ গ্রহণযোগ্য)। সর্বোচ্চ ১০ MB।
          </p>

          {/* Quick Presets (If Available) */}
          {presets.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-semibold text-gray-500 flex items-center gap-0.5">
                নমুনা ছবি:
              </span>
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onChange(preset.url);
                    setImgError(false);
                  }}
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-medium transition ${value === preset.url
                    ? "border-[#006a4e] bg-emerald-50 text-[#006a4e] font-bold dark:border-emerald-500 dark:bg-emerald-950/40"
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-300"
                    }`}
                >
                  {value === preset.url && <Check size={10} className="inline mr-0.5" />}
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Optional Direct URL Input Field */}
      {showUrlInput && (
        <div className="rounded-md border border-blue-200 bg-blue-50/40 p-2 dark:border-blue-900/40 dark:bg-slate-900/40">
          <label className="block text-[11px] font-semibold text-blue-900 dark:text-blue-300">
            ইমেজ সরাসরি ওয়েব লিঙ্ক বা পাথ (Direct Image URL or Path):
            <input
              type="text"
              value={value || ""}
              onChange={(e) => {
                onChange(e.target.value);
                setImgError(false);
              }}
              placeholder={placeholder}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-black outline-none transition focus:border-[#006a4e] focus:ring-1 focus:ring-[#006a4e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
        </div>
      )}

      {/* Upload Error Message */}
      {uploadError && (
        <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">
          ✕ {uploadError}
        </p>
      )}

      {/* Helper text */}
      {helperText && (
        <p className="text-[11px] text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
};

export default ImageUploadField;
