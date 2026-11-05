import React, { useRef, useState } from "react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import StudentIdCard, {
  STUDENT_CARD_THEMES,
  StudentCardData,
  StudentCardThemeId,
} from "@/components/students/StudentIdCard";
import {
  Check,
  CreditCard,
  Download,
  Eye,
  FileText,
  Layers,
  Palette,
  Printer,
  Sparkles,
  X,
} from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export interface StudentIdCardModalProps {
  student: StudentCardData | null;
  onClose: () => void;
}

export const StudentIdCardModal: React.FC<StudentIdCardModalProps> = ({
  student,
  onClose,
}) => {
  const { siteLogoUrl, websiteContent } = useSiteSettings();

  const [activeSide, setActiveSide] = useState<"front" | "back" | "both">("both");
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [selectedTheme, setSelectedTheme] = useState<StudentCardThemeId>("bd-green");
  const [validityYear, setValidityYear] = useState<string>("2026 – 2027");
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [showStamp, setShowStamp] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const printAreaRef = useRef<HTMLDivElement>(null);
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);
  const offscreenFrontRef = useRef<HTMLDivElement>(null);
  const offscreenBackRef = useRef<HTMLDivElement>(null);

  if (!student) return null;

  const schoolInfo = {
    schoolName:
      websiteContent?.schoolName || "MK Government Model High School & College",
    schoolNameBn:
      websiteContent?.schoolNameBn || "এম. কে. সরকারি মডেল স্কুল এন্ড কলেজ",
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

  // Clean, high-fidelity capture function that eliminates scroll, offset, and container clipping
  const captureCardCanvas = async (
    side: "front" | "back"
  ): Promise<HTMLCanvasElement | null> => {
    const cardWrapper =
      (side === "front" ? frontCardRef.current : backCardRef.current) ||
      (side === "front" ? offscreenFrontRef.current : offscreenBackRef.current);
    if (!cardWrapper) return null;

    const targetNode = (
      cardWrapper.querySelector(".student-id-card-root > div") ||
      cardWrapper.querySelector(".student-id-card-root") ||
      cardWrapper
    ) as HTMLElement;

    const isLandscape = orientation === "landscape";
    const targetWidth = isLandscape ? 508 : 320;
    const targetHeight = isLandscape ? 320 : 508;

    // Create an isolated container directly attached to document.body at (0,0)
    // with exact CR80 pixel dimensions (508x320 or 320x508).
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "0px";
    container.style.top = "0px";
    container.style.width = `${targetWidth}px`;
    container.style.height = `${targetHeight}px`;
    container.style.zIndex = "-99999";
    container.style.overflow = "hidden";
    container.style.pointerEvents = "none";
    container.style.margin = "0";
    container.style.padding = "0";
    container.style.backgroundColor = "transparent";

    // Clone the card element
    const clone = targetNode.cloneNode(true) as HTMLElement;
    clone.style.margin = "0";
    clone.style.transform = "none";
    clone.style.boxShadow = "none";
    clone.style.width = `${targetWidth}px`;
    clone.style.height = `${targetHeight}px`;
    clone.style.minWidth = `${targetWidth}px`;
    clone.style.minHeight = `${targetHeight}px`;
    clone.style.maxWidth = `${targetWidth}px`;
    clone.style.maxHeight = `${targetHeight}px`;
    clone.style.boxSizing = "border-box";

    container.appendChild(clone);
    document.body.appendChild(container);

    try {
      await document.fonts.ready;

      const images = Array.from(clone.querySelectorAll("img"));
      await Promise.all(
        images.map(async (img) => {
          if (!img.complete) {
            await new Promise<void>((resolve, reject) => {
              img.addEventListener("load", () => resolve(), { once: true });
              img.addEventListener(
                "error",
                () => reject(new Error(`Unable to load card image: ${img.src}`)),
                { once: true }
              );
            });
          }

          if (img.naturalWidth === 0) {
            throw new Error(`Unable to load card image: ${img.src}`);
          }

          await img.decode();
        })
      );

      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve())
      );

      const canvas = await html2canvas(clone, {
        scale: 3, // 300 DPI high-definition export
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        width: targetWidth,
        height: targetHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        logging: false,
      });

      return canvas;
    } finally {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  };

  // Download Front or Back as PNG
  const handleDownloadPng = async (sideToDownload: "front" | "back") => {
    try {
      setIsExporting(true);
      const canvas = await captureCardCanvas(sideToDownload);
      if (!canvas) {
        alert("Unable to generate card image. You can use 'Print ID Card' instead.");
        return;
      }

      const dataUrl = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      const safeName = `${student.name}_${student.surname || ""}`.trim().replace(/\s+/g, "_");
      link.download = `Student_ID_Card_${safeName}_CR80_${orientation}_${sideToDownload}_${student.id || "student"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export Student ID Card PNG:", err);
      alert("Unable to download image right now. You can use 'Print ID Card' instead.");
    } finally {
      setIsExporting(false);
    }
  };

  // Download CR80 Physical Standard PDF (Front & Back)
  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      const isLandscape = orientation === "landscape";
      const format: [number, number] = isLandscape ? [85.6, 54] : [54, 85.6];

      const pdf = new jsPDF({
        orientation: isLandscape ? "landscape" : "portrait",
        unit: "mm",
        format: format,
      });

      // Front
      const frontCanvas = await captureCardCanvas("front");
      if (frontCanvas) {
        const frontImg = frontCanvas.toDataURL("image/png", 1.0);
        pdf.addImage(frontImg, "PNG", 0, 0, format[0], format[1]);
      }

      // Back
      const backCanvas = await captureCardCanvas("back");
      if (backCanvas) {
        pdf.addPage(format, isLandscape ? "landscape" : "portrait");
        const backImg = backCanvas.toDataURL("image/png", 1.0);
        pdf.addImage(backImg, "PNG", 0, 0, format[0], format[1]);
      }

      const safeName = `${student.name}_${student.surname || ""}`.trim().replace(/\s+/g, "_");
      pdf.save(`Student_ID_Card_${safeName}_CR80_${student.id || "student"}.pdf`);
    } catch (err) {
      console.error("Failed to export Student ID Card PDF:", err);
      alert("Unable to export PDF. You can download PNG or use Print.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-5xl w-full p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[95vh] flex flex-col justify-between my-auto">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
              <CreditCard size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                  Student Digital ID Card
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold font-mono">
                  CR80: 85.6 mm × 54 mm (3.375" × 2.125")
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Official Bangladesh School & College Identity Card • {student.name} {student.surname || ""} ({student.class_name || "Student"})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTROLS BAR */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 py-3 border-b border-gray-100 dark:border-gray-700 text-xs">
          {/* Side Switch */}
          <div className="md:col-span-3 flex items-center gap-1 bg-gray-100 dark:bg-gray-700/60 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveSide("both")}
              className={`flex-1 py-1 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
                activeSide === "both"
                  ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
              }`}
            >
              <Layers size={13} />
              <span>Both</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSide("front")}
              className={`flex-1 py-1 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
                activeSide === "front"
                  ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
              }`}
            >
              <Eye size={13} />
              <span>Front</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSide("back")}
              className={`flex-1 py-1 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
                activeSide === "back"
                  ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
              }`}
            >
              <Eye size={13} />
              <span>Back</span>
            </button>
          </div>

          {/* Orientation Switch */}
          <div className="md:col-span-2 flex items-center gap-1 bg-gray-100 dark:bg-gray-700/60 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setOrientation("landscape")}
              className={`flex-1 py-1 px-2 rounded-lg font-bold transition text-center ${
                orientation === "landscape"
                  ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
              }`}
            >
              Landscape
            </button>
            <button
              type="button"
              onClick={() => setOrientation("portrait")}
              className={`flex-1 py-1 px-2 rounded-lg font-bold transition text-center ${
                orientation === "portrait"
                  ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
              }`}
            >
              Portrait
            </button>
          </div>

          {/* Theme Selector */}
          <div className="md:col-span-4 flex items-center gap-1.5 overflow-x-auto py-0.5">
            <Palette size={14} className="text-gray-400 shrink-0 ml-1" />
            {(Object.keys(STUDENT_CARD_THEMES) as StudentCardThemeId[]).map((themeKey) => {
              const themeObj = STUDENT_CARD_THEMES[themeKey];
              const isSelected = selectedTheme === themeKey;
              return (
                <button
                  key={themeKey}
                  type="button"
                  onClick={() => setSelectedTheme(themeKey)}
                  className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition shrink-0 ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                  }`}
                  title={themeObj.nameBn}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: themeObj.primaryBg }}
                  />
                  <span className="truncate max-w-[85px]">
                    {themeKey === "bd-green"
                      ? "Govt Green"
                      : themeKey === "royal-navy"
                      ? "Royal Navy"
                      : themeKey === "classic-maroon"
                      ? "Maroon"
                      : "ICT Teal"}
                  </span>
                  {isSelected && <Check size={11} className="text-emerald-600" />}
                </button>
              );
            })}
          </div>

          {/* Extra options */}
          <div className="md:col-span-3 flex items-center justify-end gap-2">
            <input
              type="text"
              value={validityYear}
              onChange={(e) => setValidityYear(e.target.value)}
              className="w-24 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-mono font-bold"
              placeholder="2026-2027"
              title="Academic Session / Validity"
            />
            <label className="flex items-center gap-1 cursor-pointer select-none text-[11px] font-medium text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={showStamp}
                onChange={(e) => setShowStamp(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-emerald-600"
              />
              <span>Seal</span>
            </label>
          </div>
        </div>

        {/* CARD PREVIEW AREA */}
        <div
          ref={printAreaRef}
          className="id-card-print-container my-3 py-4 px-2 overflow-x-auto flex items-center justify-center min-h-[420px] bg-gray-100/70 dark:bg-gray-900/50 rounded-2xl border border-gray-200/80 dark:border-gray-700"
        >
          <div className="flex flex-wrap items-center justify-center gap-6">
            {/* FRONT CARD CONTAINER */}
            {(activeSide === "front" || activeSide === "both") && (
              <div className="flex flex-col items-center gap-2 group">
                <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <span>Front Side (সম্মুখ ভাগ)</span>
                </div>
                <div className="card-wrapper shadow-xl hover:shadow-2xl transition rounded-2xl p-0">
                  <div
                    ref={frontCardRef}
                    className="rounded-2xl overflow-hidden inline-block"
                  >
                    <StudentIdCard
                      student={student}
                      side="front"
                      orientation={orientation}
                      theme={selectedTheme}
                      validityYear={validityYear}
                      issueDate={issueDate}
                      schoolInfo={schoolInfo}
                      showStamp={showStamp}
                    />
                  </div>
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
                <div className="card-wrapper shadow-xl hover:shadow-2xl transition rounded-2xl p-0">
                  <div
                    ref={backCardRef}
                    className="rounded-2xl overflow-hidden inline-block"
                  >
                    <StudentIdCard
                      student={student}
                      side="back"
                      orientation={orientation}
                      theme={selectedTheme}
                      validityYear={validityYear}
                      issueDate={issueDate}
                      schoolInfo={schoolInfo}
                      showStamp={showStamp}
                    />
                  </div>
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

        {/* OFF-SCREEN CARDS (ALWAYS MOUNTED FOR COMPLETE PDF & PNG EXPORT) */}
        <div
          className="fixed -left-[9999px] -top-[9999px] pointer-events-none -z-50"
          aria-hidden="true"
        >
          <div ref={offscreenFrontRef}>
            <StudentIdCard
              student={student}
              side="front"
              orientation={orientation}
              theme={selectedTheme}
              validityYear={validityYear}
              issueDate={issueDate}
              schoolInfo={schoolInfo}
              showStamp={showStamp}
            />
          </div>
          <div ref={offscreenBackRef}>
            <StudentIdCard
              student={student}
              side="back"
              orientation={orientation}
              theme={selectedTheme}
              validityYear={validityYear}
              issueDate={issueDate}
              schoolInfo={schoolInfo}
              showStamp={showStamp}
            />
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs">
          <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 text-[11px]">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              Standard Physical Size (CR80): 85.6 mm × 54 mm (3.375 in × 2.125 in)
            </span>
            <span>• ISO/IEC 7810 ID-1 standard format</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold transition"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-sm transition disabled:opacity-50"
              title="Download CR80 Physical Standard PDF (Front & Back)"
            >
              <FileText size={14} />
              <span>Download PDF (CR80)</span>
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

export default StudentIdCardModal;

