import React, { useRef, useState } from "react";
import { StaffMember } from "@/types/staff";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import StaffIdCard, {
  CARD_THEMES,
  CardThemeId,
} from "@/components/staff/StaffIdCard";
import {
  Check,
  CreditCard,
  Download,
  Eye,
  Layers,
  Palette,
  Printer,
  RotateCw,
  Sliders,
  Sparkles,
  X,
} from "lucide-react";
import html2canvas from "html2canvas";

export interface StaffIdCardModalProps {
  staff: StaffMember | null;
  onClose: () => void;
}

export const StaffIdCardModal: React.FC<StaffIdCardModalProps> = ({
  staff,
  onClose,
}) => {
  const { siteLogoUrl, websiteContent } = useSiteSettings();

  const [activeSide, setActiveSide] = useState<"front" | "back" | "both">("both");
  const [selectedTheme, setSelectedTheme] = useState<CardThemeId>("bd-green");
  const [validityYear, setValidityYear] = useState<string>("2026 – 2028");
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [showStamp, setShowStamp] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const printAreaRef = useRef<HTMLDivElement>(null);
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  if (!staff) return null;

  const schoolInfo = {
    schoolName: websiteContent?.schoolName || "MK Government Model High School",
    schoolNameBn: websiteContent?.schoolNameBn || "এম. কে. সরকারি মডেল উচ্চ বিদ্যালয়",
    eiin: websiteContent?.eiin || "123456",
    schoolCode: websiteContent?.schoolCode || "1001",
    establishedYear: websiteContent?.establishedYear || "1985",
    address:
      websiteContent?.address ||
      websiteContent?.addressEn ||
      "College Road, Dhanmondi, Dhaka-1205, Bangladesh",
    phone: websiteContent?.phone || "+880 2 1234 5678",
    email: websiteContent?.email || "info@mkschool.edu.bd",
    logo: siteLogoUrl,
  };

  // Direct Print function
  const handlePrint = () => {
    window.print();
  };

  // Download Front or Back as PNG
  const handleDownloadPng = async (sideToDownload: "front" | "back") => {
    const targetRef = sideToDownload === "front" ? frontCardRef : backCardRef;
    if (!targetRef.current) return;

    try {
      setIsExporting(true);
      const canvas = await html2canvas(targetRef.current, {
        scale: 3, // 300 DPI high-definition export
        useCORS: true,
        backgroundColor: null,
      });

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const safeName = `${staff.name}_${staff.surname}`.replace(/\s+/g, "_");
      link.download = `ID_Card_${safeName}_${sideToDownload}_${staff.staff_no || "staff"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export ID Card:", err);
      alert("Unable to download image right now. You can use 'Print ID Card' instead.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[95vh] flex flex-col justify-between my-auto">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
              <CreditCard size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                  Staff & Teacher Digital ID Card
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                  বাংলাদেশ জাতীয় মডেল
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Official Bangladesh institutional format for{" "}
                <strong>
                  {staff.name} {staff.surname}
                </strong>{" "}
                ({staff.staff_no})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL CONTROLS TOOLBAR */}
        <div className="py-3.5 border-b border-gray-100 dark:border-gray-700/80 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs items-center">
          {/* Side View Switcher */}
          <div className="md:col-span-4 flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
            <button
              onClick={() => setActiveSide("both")}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                activeSide === "both"
                  ? "bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Layers size={13} />
              <span>Both Sides</span>
            </button>
            <button
              onClick={() => setActiveSide("front")}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                activeSide === "front"
                  ? "bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>Front</span>
            </button>
            <button
              onClick={() => setActiveSide("back")}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                activeSide === "back"
                  ? "bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>Back</span>
            </button>
          </div>

          {/* Theme Palette Switcher */}
          <div className="md:col-span-4 flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400 font-semibold shrink-0 flex items-center gap-1">
              <Palette size={13} /> Theme:
            </span>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value as CardThemeId)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5 text-gray-800 dark:text-gray-200 font-medium focus:outline-none"
            >
              {Object.values(CARD_THEMES).map((thm) => (
                <option key={thm.id} value={thm.id}>
                  {thm.nameBn}
                </option>
              ))}
            </select>
          </div>

          {/* Session / Validity Year & Stamp Toggle */}
          <div className="md:col-span-4 flex items-center justify-end gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 font-semibold">Session:</span>
              <input
                type="text"
                value={validityYear}
                onChange={(e) => setValidityYear(e.target.value)}
                className="w-24 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-mono font-bold"
                placeholder="2026-2028"
              />
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-gray-600 dark:text-gray-300 font-medium select-none">
              <input
                type="checkbox"
                checked={showStamp}
                onChange={(e) => setShowStamp(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span>Seal Stamp</span>
            </label>
          </div>
        </div>

        {/* CARD PREVIEW AREA (With Printable ID Selector) */}
        <div
          ref={printAreaRef}
          className="id-card-print-container my-4 py-4 px-2 overflow-x-auto flex items-center justify-center min-h-[530px] bg-gray-100/70 dark:bg-gray-900/50 rounded-2xl border border-gray-200/80 dark:border-gray-700"
        >
          <div className="flex flex-wrap items-center justify-center gap-6">
            {/* FRONT CARD CONTAINER */}
            {(activeSide === "front" || activeSide === "both") && (
              <div className="flex flex-col items-center gap-2 group">
                <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <span>Front Side (সম্মুখ ভাগ)</span>
                </div>
                <div ref={frontCardRef} className="card-wrapper shadow-xl hover:shadow-2xl transition rounded-2xl">
                  <StaffIdCard
                    staff={staff}
                    side="front"
                    theme={selectedTheme}
                    validityYear={validityYear}
                    issueDate={issueDate}
                    schoolInfo={schoolInfo}
                    showStamp={showStamp}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadPng("front")}
                  disabled={isExporting}
                  className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition"
                >
                  <Download size={12} />
                  <span>Download Front PNG</span>
                </button>
              </div>
            )}

            {/* BACK CARD CONTAINER */}
            {(activeSide === "back" || activeSide === "both") && (
              <div className="flex flex-col items-center gap-2 group">
                <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <span>Back Side (পেছনের অংশ)</span>
                </div>
                <div ref={backCardRef} className="card-wrapper shadow-xl hover:shadow-2xl transition rounded-2xl">
                  <StaffIdCard
                    staff={staff}
                    side="back"
                    theme={selectedTheme}
                    validityYear={validityYear}
                    issueDate={issueDate}
                    schoolInfo={schoolInfo}
                    showStamp={showStamp}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadPng("back")}
                  disabled={isExporting}
                  className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition"
                >
                  <Download size={12} />
                  <span>Download Back PNG</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs">
          <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 text-[11px]">
            <Sparkles size={14} className="text-amber-500 shrink-0" />
            <span>
              Standard CR-80 PVC ID Card format (54mm × 85.6mm) • Ready for lanyard or plastic sleeve
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold transition"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-600/20 transition"
            >
              <Printer size={15} />
              <span>Print ID Card</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffIdCardModal;

