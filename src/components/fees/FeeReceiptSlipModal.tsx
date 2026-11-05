import React, { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Columns,
  Maximize2,
  Minimize2,
  Printer,
  Receipt,
  Rows,
  Scissors,
  X,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { FeeReceiptData } from "@/types/fees";
import { numberToBengaliWords, numberToEnglishWords } from "@/lib/numberToWordsBn";
import { cleanFeeTitle, parseFeeItems } from "@/lib/cleanFeeText";

interface FeeReceiptSlipModalProps {
  receiptData: FeeReceiptData | null;
  onClose: () => void;
}

export const FeeReceiptSlipModal: React.FC<FeeReceiptSlipModalProps> = ({
  receiptData,
  onClose,
}) => {
  const { siteName, currencySymbol: cs, websiteContent, siteLogoUrl } = useSiteSettings();
  const [layoutMode, setLayoutMode] = useState<"DUAL_STACKED" | "DUAL_SIDE" | "SINGLE">("DUAL_STACKED");

  const fmt = (n: number | string | undefined) =>
    `${cs || "৳"}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  useEffect(() => {
    if (receiptData) {
      document.body.classList.add("printing-receipt-active");
    } else {
      document.body.classList.remove("printing-receipt-active");
    }
    return () => {
      document.body.classList.remove("printing-receipt-active");
    };
  }, [receiptData]);

  if (!receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  const isFullPaid = (receiptData.remaining_due ?? 0) <= 0;
  const logo = siteLogoUrl || (websiteContent as any)?.general?.logo_url;
  const schoolName = siteName || (websiteContent as any)?.general?.school_name || "ACADEMIA SCHOOL & COLLEGE";
  const contactPhone = (websiteContent as any)?.contact?.phone || "+880 1700-000000";
  const contactEmail = (websiteContent as any)?.contact?.email || "info@school.edu.bd";
  const address = (websiteContent as any)?.contact?.address || "Dhaka, Bangladesh";
  const paidAmount = Number(receiptData.total_paid || receiptData.amount || 0);

  const wordsBn = numberToBengaliWords(paidAmount);
  const wordsEn = numberToEnglishWords(paidAmount);

  // Clean title & parse multi-fee particulars
  const rawTitle = receiptData.invoice_title || receiptData.category_name || "মাসিক বেতন (Monthly Tuition Fee)";
  const cleanedTitle = cleanFeeTitle(rawTitle);
  const feeItems = parseFeeItems(cleanedTitle, receiptData.invoice_amount || receiptData.amount);

  // Render a compact single copy of the receipt (tailored to fit A4 precisely without text overflow)
  const renderVoucherCopy = (copyTitle: string, copySub: string) => (
    <div className="border border-slate-700/80 rounded-lg p-2.5 sm:p-3 bg-white text-slate-900 text-[10px] leading-tight relative shadow-xs print:shadow-none print:border-slate-800">
      {/* Header Row */}
      <div className="flex items-center justify-between border-b border-emerald-800 pb-1.5 mb-1.5 gap-2">
        <div className="flex items-center gap-2">
          {logo ? (
            <img
              src={logo}
              alt={schoolName}
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <Building2 size={16} />
            </div>
          )}
          <div className="leading-tight">
            <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">
              {schoolName}
            </h2>
            <p className="text-[9px] text-slate-600 line-clamp-1">
              {address} • মোবাইল: {contactPhone}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-950 border border-emerald-300">
            {copyTitle}
          </div>
          <div className="font-mono font-bold text-[10px] text-slate-800 mt-0.5">
            রসিদ: {receiptData.receipt_no || `SLIP-${receiptData.invoice_no || "0001"}`}
          </div>
          <div className="text-[9px] text-slate-600">
            তারিখ: <strong>{receiptData.payment_date || new Date().toISOString().slice(0, 10)}</strong>
          </div>
        </div>
      </div>

      {/* Student Details Grid */}
      <div className="grid grid-cols-4 gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200 text-[10px] mb-1.5 leading-snug">
        <div>
          <span className="text-slate-500 block text-[8px] uppercase font-bold">শিক্ষার্থীর নাম</span>
          <span className="font-bold text-slate-900 truncate block">
            {[receiptData.student_name, receiptData.student_surname].filter(Boolean).join(" ") || "Student"}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[8px] uppercase font-bold">রোল / আইডি</span>
          <span className="font-mono font-bold text-slate-800 truncate block">
            রোল: {receiptData.student_roll || "—"} | ID: {receiptData.student_code || receiptData.student_id || "—"}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[8px] uppercase font-bold">শ্রেণি ও শাখা</span>
          <span className="font-semibold text-slate-800 truncate block">
            {receiptData.class_name ? `Class ${receiptData.class_name}` : "General"}
            {receiptData.section_name ? ` (${receiptData.section_name})` : ""}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[8px] uppercase font-bold">পরিশোধের মাধ্যম</span>
          <span className="font-bold text-emerald-800 uppercase text-[9px] truncate block">
            {receiptData.payment_method === "BKASH" ? "bKash (বিকাশ)" :
             receiptData.payment_method === "NAGAD" ? "Nagad (নগদ)" :
             receiptData.payment_method === "ROCKET" ? "Rocket (রকেট)" :
             receiptData.payment_method === "BANK_TRANSFER" ? "Bank / Challan" :
             String(receiptData.payment_method || "CASH").replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Fee Items Breakdown Table with Explicit Widths and Clean Text Wrapping */}
      <table className="w-full text-left border-collapse text-[10px] mb-1.5 table-fixed">
        <thead>
          <tr className="border-b border-t border-slate-300 text-[8.5px] text-slate-700 uppercase font-bold bg-slate-100/90">
            <th className="py-1 px-2 w-[52%]">ফি খাত ও বিবরণ (Fee Particulars)</th>
            <th className="py-1 px-1.5 text-right w-[14%]">নির্ধারিত ফি</th>
            <th className="py-1 px-1.5 text-right w-[11%]">মওকুফ/ছাড়</th>
            <th className="py-1 px-1.5 text-right w-[9%]">বিলম্ব ফি</th>
            <th className="py-1 px-2 text-right w-[14%]">প্রদেয় টাকা (Net)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <tr>
            <td className="py-1.5 px-2 align-top">
              <div className="font-bold text-slate-900 text-[10px] sm:text-[10.5px] leading-snug break-words">
                {feeItems.length > 1 ? (
                  <div className="space-y-1">
                    {feeItems.map((it, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 shrink-0 mt-1" />
                        <span className="break-words font-semibold text-slate-900">{it.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="break-words">{cleanedTitle}</span>
                )}
              </div>
              <div className="text-[8.5px] text-slate-500 font-mono mt-0.5">
                ইনভয়েস #{receiptData.invoice_no || "INV-000"} • শিক্ষাবর্ষ: {receiptData.academic_year || "2026-2027"}
              </div>
            </td>
            <td className="py-1.5 px-1.5 text-right font-semibold text-slate-800 align-top">
              {fmt(receiptData.invoice_amount || receiptData.amount)}
            </td>
            <td className="py-1.5 px-1.5 text-right text-emerald-700 font-semibold align-top">
              {Number(receiptData.discount || 0) > 0 ? `-${fmt(receiptData.discount)}` : "—"}
            </td>
            <td className="py-1.5 px-1.5 text-right text-amber-700 font-semibold align-top">
              {Number(receiptData.late_fine || 0) > 0 ? `+${fmt(receiptData.late_fine)}` : "—"}
            </td>
            <td className="py-1.5 px-2 text-right font-bold text-slate-900 align-top">
              {fmt(receiptData.net_amount || receiptData.amount)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Summary Box & In Words */}
      <div className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-1.5 rounded border border-slate-200 mb-1.5 text-[9px]">
        <div className="col-span-7 pr-1">
          <div className="text-slate-700 font-bold">টাকা কথায় (In Words):</div>
          <div className="text-slate-900 font-semibold leading-tight break-words">{wordsBn}</div>
          <div className="text-slate-500 italic text-[8px] break-words">({wordsEn})</div>
          {receiptData.transaction_ref && (
            <div className="text-[8px] font-mono text-slate-600 mt-0.5 truncate">
              TrxID/Ref: <strong>{receiptData.transaction_ref}</strong>
            </div>
          )}
        </div>

        <div className="col-span-5 border-l border-slate-200 pl-2 space-y-0.5 text-[9px]">
          <div className="flex justify-between text-slate-600">
            <span>সর্বমোট প্রদেয়:</span>
            <span className="font-semibold text-slate-900">{fmt(receiptData.net_amount || receiptData.amount)}</span>
          </div>
          <div className="flex justify-between text-emerald-900 font-black border-t border-slate-200 pt-0.5">
            <span>আদায়কৃত (Paid):</span>
            <span className="text-[10px]">{fmt(paidAmount)}</span>
          </div>
          <div className="flex justify-between font-bold border-t border-slate-200 pt-0.5">
            <span>বকেয়া (Due):</span>
            <span className={isFullPaid ? "text-emerald-700" : "text-rose-700"}>
              {isFullPaid ? "পরিশোধিত (Cleared)" : fmt(receiptData.remaining_due || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Signature Lines */}
      <div className="grid grid-cols-2 gap-10 pt-3.5 mt-1 border-t border-slate-300 text-center text-[8.5px] text-slate-700">
        <div>
          <div className="h-5 border-b border-dashed border-slate-400 mb-0.5" />
          <div className="font-bold text-slate-800">আদায়কারীর স্বাক্ষর (Cashier)</div>
          <div className="text-[7.5px] text-slate-500">কম্পিউটার জেনারেটেড বিল ও রসিদ</div>
        </div>
        <div>
          <div className="h-5 border-b border-dashed border-slate-400 mb-0.5" />
          <div className="font-bold text-slate-800">অধ্যক্ষ / প্রধান শিক্ষকের স্বাক্ষর</div>
          <div className="text-[7.5px] text-slate-500">Principal / Headmaster</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      {/* Global Print Stylesheet for Perfect A4 Output */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          body * {
            visibility: hidden;
          }
          #fee-receipt-printable, #fee-receipt-printable * {
            visibility: visible;
          }
          #fee-receipt-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar (Hidden during printing) */}
        <div className="p-3 sm:p-3.5 border-b border-gray-100 flex flex-wrap items-center justify-between bg-slate-50 shrink-0 gap-2 no-print">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm">
            <Receipt size={17} className="text-[#005a40] shrink-0" />
            <span className="font-bold">বাংলাদেশ স্কুল ও কলেজ ফি রসিদ (Money Receipt)</span>
            <div className="hidden md:flex items-center gap-1 bg-slate-200 p-0.5 rounded-lg text-[11px] ml-2">
              <button
                type="button"
                onClick={() => setLayoutMode("DUAL_STACKED")}
                className={`px-2 py-0.5 rounded font-semibold transition cursor-pointer ${
                  layoutMode === "DUAL_STACKED"
                    ? "bg-white text-emerald-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="A4 সাইজে ২টি কপি উপর-নিচ"
              >
                ২-কপি (A4 এক পাতা)
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("DUAL_SIDE")}
                className={`px-2 py-0.5 rounded font-semibold transition cursor-pointer ${
                  layoutMode === "DUAL_SIDE"
                    ? "bg-white text-emerald-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="পাশাপাশি ২-কপি"
              >
                পাশাপাশি ২-কপি
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("SINGLE")}
                className={`px-2 py-0.5 rounded font-semibold transition cursor-pointer ${
                  layoutMode === "SINGLE"
                    ? "bg-white text-emerald-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="একক রসিদ"
              >
                একক কপি
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#005a40] text-white hover:bg-[#004732] rounded-lg transition shadow-xs cursor-pointer"
            >
              <Printer size={13} />
              <span>প্রিন্ট রসিদ (Print A4)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              title="Close"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Canvas Fitted to A4 Proportions */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-100/60 flex justify-center">
          <div
            className="w-full max-w-[700px] bg-white p-3 sm:p-4 rounded-xl border border-slate-300 shadow-sm print:p-0 print:border-none print:shadow-none print:max-w-none"
            id="fee-receipt-printable"
          >
            {layoutMode === "DUAL_STACKED" ? (
              <div className="space-y-2">
                {/* Part 1: Institution / Office Copy */}
                {renderVoucherCopy("প্রতিষ্ঠান / ব্যাংক কপি (Office Copy)", "অফিস সংরক্ষণ কপি")}

                {/* Perforation / Scissor Line */}
                <div className="flex items-center justify-center gap-2 text-slate-400 text-[8px] font-mono select-none py-0.5">
                  <Scissors size={11} />
                  <span className="border-b border-dashed border-slate-400 flex-1" />
                  <span>এখানে কাটুন (Cut along the dotted line)</span>
                  <span className="border-b border-dashed border-slate-400 flex-1" />
                </div>

                {/* Part 2: Student / Guardian Copy */}
                {renderVoucherCopy("শিক্ষার্থী / অভিভাবক কপি (Student Copy)", "শিক্ষার্থী সংরক্ষণ কপি")}
              </div>
            ) : layoutMode === "DUAL_SIDE" ? (
              <div className="grid grid-cols-2 gap-2">
                {renderVoucherCopy("প্রতিষ্ঠান কপি (Office)", "অফিস সংরক্ষণ")}
                {renderVoucherCopy("শিক্ষার্থী কপি (Student)", "শিক্ষার্থী সংরক্ষণ")}
              </div>
            ) : (
              renderVoucherCopy("মূল মানি রসিদ (Official Money Receipt)", "আদায় ও হিসাব কপি")
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeReceiptSlipModal;
