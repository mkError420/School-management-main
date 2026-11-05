import React, { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Copy,
  Printer,
  Receipt,
  Scissors,
  X,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { FeeReceiptData } from "@/types/fees";
import { numberToBengaliWords, numberToEnglishWords } from "@/lib/numberToWordsBn";

interface FeeReceiptSlipModalProps {
  receiptData: FeeReceiptData | null;
  onClose: () => void;
}

export const FeeReceiptSlipModal: React.FC<FeeReceiptSlipModalProps> = ({
  receiptData,
  onClose,
}) => {
  const { siteName, currencySymbol: cs, websiteContent, siteLogoUrl } = useSiteSettings();
  const [layoutMode, setLayoutMode] = useState<"DUAL" | "SINGLE">("DUAL");

  const fmt = (n: number | string | undefined) =>
    `${cs}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

  // Render a single copy of the voucher
  const renderVoucherCopy = (copyTitle: string, copySub: string) => (
    <div className="border-2 border-slate-700/80 rounded-xl p-4 sm:p-5 bg-white relative text-slate-900 text-xs">
      {/* Top watermark / copy badge */}
      <div className="flex items-center justify-between border-b-2 border-emerald-800/90 pb-3 mb-3">
        <div className="flex items-center gap-3">
          {logo ? (
            <img
              src={logo}
              alt={schoolName}
              className="w-12 h-12 object-contain rounded-lg border border-slate-200"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-lg">
              <Building2 size={22} />
            </div>
          )}
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tight leading-tight">
              {schoolName}
            </h2>
            <p className="text-[10px] text-slate-600 font-medium">
              {address}
            </p>
            <p className="text-[9px] text-slate-500">
              মোবাইল: {contactPhone} • ইমেইল: {contactEmail}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100/80 text-emerald-950 border border-emerald-400">
            {copyTitle}
          </div>
          <div className="text-[9px] text-slate-500 font-semibold mt-0.5">{copySub}</div>
          <div className="font-mono font-bold text-[11px] text-slate-800 mt-1">
            রসিদ নং: {receiptData.receipt_no || `SLIP-${receiptData.invoice_no || "0001"}`}
          </div>
          <div className="text-[10px] text-slate-600">
            তারিখ: <strong>{receiptData.payment_date || new Date().toISOString().slice(0, 10)}</strong>
          </div>
        </div>
      </div>

      {/* Student Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] mb-3">
        <div>
          <span className="text-slate-500 block text-[9px] uppercase font-bold">শিক্ষার্থীর নাম (Student Name)</span>
          <span className="font-bold text-slate-900 text-xs">
            {[receiptData.student_name, receiptData.student_surname].filter(Boolean).join(" ") || "Student"}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[9px] uppercase font-bold">রোল / আইডি (Roll &amp; ID)</span>
          <span className="font-mono font-bold text-slate-800">
            রোল: {receiptData.student_roll || "—"} | আইডি: {receiptData.student_code || receiptData.student_id || "—"}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[9px] uppercase font-bold">শ্রেণি ও শাখা (Class &amp; Section)</span>
          <span className="font-semibold text-slate-800">
            {receiptData.class_name ? `Class ${receiptData.class_name}` : "General"}
            {receiptData.section_name ? ` (${receiptData.section_name})` : ""}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[9px] uppercase font-bold">পরিশোধের মাধ্যম (Payment Method)</span>
          <span className="font-bold text-emerald-800 uppercase text-[10px]">
            {receiptData.payment_method === "BKASH" ? "bKash (বিকাশ)" :
             receiptData.payment_method === "NAGAD" ? "Nagad (নগদ)" :
             receiptData.payment_method === "ROCKET" ? "Rocket (রকেট)" :
             receiptData.payment_method === "BANK_TRANSFER" ? "Bank / Challan" :
             String(receiptData.payment_method || "CASH").replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Fee Items Breakdown Table */}
      <table className="w-full text-left border-collapse text-xs mb-3">
        <thead>
          <tr className="border-b border-t border-slate-300 text-[10px] text-slate-700 uppercase font-bold bg-slate-100/80">
            <th className="py-1.5 px-2">ফি খাত / বিবরণ (Fee Particulars)</th>
            <th className="py-1.5 px-2 text-right">নির্ধারিত ফি (Amount)</th>
            <th className="py-1.5 px-2 text-right">মওকুফ/ছাড় (Waiver)</th>
            <th className="py-1.5 px-2 text-right">বিলম্ব ফি (Fine)</th>
            <th className="py-1.5 px-2 text-right">প্রদেয় টাকা (Net Payable)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <tr>
            <td className="py-2 px-2">
              <div className="font-bold text-slate-900">
                {receiptData.invoice_title || receiptData.category_name || "Academic Fee (মাসিক/পরীক্ষা ফি)"}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                ইনভয়েস #{receiptData.invoice_no || "INV-000"} • শিক্ষাবর্ষ: {receiptData.academic_year || "2026-2027"}
              </div>
            </td>
            <td className="py-2 px-2 text-right font-semibold text-slate-800">
              {fmt(receiptData.invoice_amount || receiptData.amount)}
            </td>
            <td className="py-2 px-2 text-right text-emerald-700 font-semibold">
              {Number(receiptData.discount || 0) > 0 ? `-${fmt(receiptData.discount)}` : "—"}
            </td>
            <td className="py-2 px-2 text-right text-amber-700 font-semibold">
              {Number(receiptData.late_fine || 0) > 0 ? `+${fmt(receiptData.late_fine)}` : "—"}
            </td>
            <td className="py-2 px-2 text-right font-bold text-slate-900">
              {fmt(receiptData.net_amount || receiptData.amount)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Summary Box & In Words */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end mb-3">
        <div className="sm:col-span-7 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200/80 text-[11px]">
          <div className="text-emerald-950 font-bold mb-0.5">টাকা কথায় (In Words):</div>
          <div className="text-slate-800 font-semibold">{wordsBn}</div>
          <div className="text-slate-600 text-[10px] italic mt-0.5">({wordsEn})</div>
          {receiptData.transaction_ref && (
            <div className="mt-1 text-[10px] font-mono text-slate-600">
              ট্রানজেকশন / রেফারেন্স আইডি: <strong className="text-slate-900">{receiptData.transaction_ref}</strong>
            </div>
          )}
        </div>

        <div className="sm:col-span-5 space-y-1 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <div className="flex justify-between text-slate-600">
            <span>সর্বমোট প্রদেয় ফি:</span>
            <span className="font-semibold text-slate-900">
              {fmt(receiptData.net_amount || receiptData.amount)}
            </span>
          </div>
          <div className="flex justify-between text-emerald-900 font-black border-t border-slate-200 pt-1">
            <span>আদায়কৃত টাকা (Paid):</span>
            <span className="text-sm">{fmt(paidAmount)}</span>
          </div>
          <div className="flex justify-between text-rose-700 font-bold border-t border-slate-200 pt-1 text-[11px]">
            <span>অবশিষ্ট বকেয়া (Due):</span>
            <span className={isFullPaid ? "text-emerald-700 font-semibold" : "text-rose-700 font-bold"}>
              {isFullPaid ? "পরিশোধিত (Cleared)" : fmt(receiptData.remaining_due || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Signature Lines */}
      <div className="grid grid-cols-2 gap-8 pt-5 mt-2 border-t border-slate-300 text-center text-[10px] text-slate-700">
        <div>
          <div className="h-6 border-b border-dashed border-slate-400 mb-1" />
          <div className="font-bold text-slate-800">আদায়কারীর স্বাক্ষর (Cashier)</div>
          <div className="text-[9px] text-slate-500">কম্পিউটার জেনারেটেড বিল ও রসিদ</div>
        </div>
        <div>
          <div className="h-6 border-b border-dashed border-slate-400 mb-1" />
          <div className="font-bold text-slate-800">অধ্যক্ষ / প্রধান শিক্ষকের স্বাক্ষর</div>
          <div className="text-[9px] text-slate-500">Principal / Headmaster</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Top Control Bar (Hidden during window.print) */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50 no-print">
          <div className="flex items-center gap-3 text-slate-800 font-bold text-sm">
            <Receipt size={18} className="text-[#005a40]" />
            <span>বাংলাদেশ স্কুল ও কলেজ ফি রসিদ (Money Receipt Slip)</span>
            <div className="hidden sm:flex items-center gap-1 bg-slate-200 p-0.5 rounded-lg text-xs ml-2">
              <button
                type="button"
                onClick={() => setLayoutMode("DUAL")}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${layoutMode === "DUAL" ? "bg-white text-emerald-900 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                ২-কপি (প্রতিষ্ঠান + শিক্ষার্থী)
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("SINGLE")}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${layoutMode === "SINGLE" ? "bg-white text-emerald-900 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                একক কপি
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#005a40] text-white hover:bg-[#004732] rounded-lg transition shadow-xs cursor-pointer"
            >
              <Printer size={14} />
              <span>প্রিন্ট রসিদ (Print)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="p-4 md:p-6 bg-white print:p-0 text-slate-900" id="fee-receipt-printable">
          {layoutMode === "DUAL" ? (
            <div className="space-y-4">
              {/* Part 1: Institution Copy */}
              {renderVoucherCopy("প্রতিষ্ঠান / ব্যাংক কপি (Office Copy)", "অফিস সংরক্ষণ কপি")}

              {/* Perforation / Scissor Line */}
              <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-mono py-1 select-none">
                <Scissors size={14} />
                <span className="border-b border-dashed border-slate-400 flex-1" />
                <span>এখানে কাটুন (Cut along the dotted line)</span>
                <span className="border-b border-dashed border-slate-400 flex-1" />
              </div>

              {/* Part 2: Student Copy */}
              {renderVoucherCopy("শিক্ষার্থী / অভিভাবক কপি (Student Copy)", "শিক্ষার্থী সংরক্ষণ কপি")}
            </div>
          ) : (
            renderVoucherCopy("মূল মানি রসিদ (Official Money Receipt)", "আদায় ও হিসাব কপি")
          )}
        </div>
      </div>
    </div>
  );
};

export default FeeReceiptSlipModal;
