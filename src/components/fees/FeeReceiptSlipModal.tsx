import React, { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Printer,
  Receipt,
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
  const feeItems = receiptData.fee_items && receiptData.fee_items.length > 0
    ? receiptData.fee_items.map((it) => ({
        name: cleanFeeTitle(it.name),
        amount: Number(it.amount || 0),
        discount: (it as any).discount,
        late_fine: (it as any).late_fine,
        net: (it as any).net ?? Number(it.amount || 0),
      }))
    : parseFeeItems(cleanedTitle, receiptData.invoice_amount || receiptData.amount);

  const isCompact = feeItems.length > 3;
  const isMultiColumn = feeItems.length > 5;
  const isDense = feeItems.length > 10;
  const isUltraCompact = feeItems.length > 16;

  // Render a single copy of the receipt (fills exactly half of A4 page when in dual mode)
  const renderVoucherCopy = (copyTitle: string, copySub: string) => (
    <div className={`receipt-copy-box border-2 border-slate-800 rounded-xl ${
      isUltraCompact ? "p-1.5 gap-0.5" :
      isDense ? "p-2 gap-1" :
      isMultiColumn ? "p-2 sm:p-2.5 gap-1" :
      isCompact ? "p-2.5 sm:p-3 gap-1" : "p-3 sm:p-4 gap-1.5"
    } bg-white text-slate-900 flex flex-col justify-start shadow-xs print:shadow-none print:rounded-none`}>
      {/* 1. Header Row */}
      <div className={`flex items-center justify-between border-b-2 border-emerald-800 ${
        isUltraCompact ? "pb-0.5 mb-0.5" :
        isDense ? "pb-1 mb-1" : "pb-1.5 mb-1.5"
      } gap-2`}>
        <div className="flex items-center gap-1.5">
          {logo ? (
            <img
              src={logo}
              alt={schoolName}
              className={`${
                isUltraCompact ? "w-6 h-6 sm:w-7 sm:h-7" :
                isDense ? "w-7 h-7 sm:w-8 sm:h-8" :
                isMultiColumn ? "w-8 h-8 sm:w-9 sm:h-9" : "w-10 h-10"
              } object-contain rounded border border-slate-200 shrink-0`}
            />
          ) : (
            <div className={`${
              isUltraCompact ? "w-6 h-6 sm:w-7 sm:h-7" :
              isDense ? "w-7 h-7 sm:w-8 sm:h-8" : "w-9 h-9"
            } rounded bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0`}>
              <Building2 size={isUltraCompact ? 13 : isDense ? 14 : 18} />
            </div>
          )}
          <div className="leading-tight">
            <h2 className={`${
              isUltraCompact ? "text-[10.5px] sm:text-[11.5px]" :
              isDense ? "text-[11.5px] sm:text-xs" :
              isMultiColumn ? "text-xs sm:text-[13px]" : "text-sm sm:text-base"
            } font-black text-slate-900 uppercase tracking-tight`}>
              {schoolName}
            </h2>
            <p className={`${isUltraCompact ? "text-[7.5px] sm:text-[8px]" : "text-[8.5px] sm:text-[9px]"} text-slate-600 font-medium`}>
              {address} • মোবাইল: {contactPhone}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className={`inline-block px-1.5 py-0.2 rounded ${isUltraCompact ? "text-[7.5px]" : "text-[8.5px] sm:text-[9px]"} font-black uppercase tracking-wider bg-emerald-100 text-emerald-950 border border-emerald-400`}>
            {copyTitle}
          </div>
          <div className={`font-mono font-bold ${isUltraCompact ? "text-[8.5px] sm:text-[9px]" : "text-[9.5px] sm:text-[10px]"} text-slate-800 mt-0.2`}>
            রসিদ: {receiptData.receipt_no || `SLIP-${receiptData.invoice_no || "0001"}`}
          </div>
          <div className={`${isUltraCompact ? "text-[7.5px] sm:text-[8px]" : "text-[8.5px]"} text-slate-600`}>
            তারিখ: <strong>{receiptData.payment_date || new Date().toISOString().slice(0, 10)}</strong>
          </div>
        </div>
      </div>

      {/* 2. Student Details Grid */}
      <div className={`grid grid-cols-4 gap-1 bg-slate-50 ${
        isUltraCompact ? "p-0.75 mb-0.5" :
        isDense ? "p-1 mb-0.75" : "p-1.5 mb-1"
      } rounded-lg border border-slate-200 text-xs`}>
        <div>
          <span className="text-slate-500 block text-[7px] sm:text-[7.5px] uppercase font-bold">শিক্ষার্থীর নাম</span>
          <span className={`font-bold text-slate-900 truncate block ${isUltraCompact ? "text-[9px] sm:text-[9.5px]" : "text-[10px] sm:text-[11px]"}`}>
            {[receiptData.student_name, receiptData.student_surname].filter(Boolean).join(" ") || "Student"}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[7px] sm:text-[7.5px] uppercase font-bold">রোল / আইডি</span>
          <span className={`font-mono font-bold text-slate-800 truncate block ${isUltraCompact ? "text-[9px] sm:text-[9.5px]" : "text-[10px] sm:text-[11px]"}`}>
            রোল: {receiptData.student_roll || "—"} | ID: {receiptData.student_code || receiptData.student_id || "—"}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[7px] sm:text-[7.5px] uppercase font-bold">শ্রেণি ও শাখা</span>
          <span className={`font-semibold text-slate-800 truncate block ${isUltraCompact ? "text-[9px] sm:text-[9.5px]" : "text-[10px] sm:text-[11px]"}`}>
            {receiptData.class_name ? `Class ${receiptData.class_name}` : "General"}
            {receiptData.section_name ? ` (${receiptData.section_name})` : ""}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[7px] sm:text-[7.5px] uppercase font-bold">পরিশোধের মাধ্যম</span>
          <span className={`font-bold text-emerald-800 uppercase ${isUltraCompact ? "text-[8px] sm:text-[8.5px]" : "text-[9px] sm:text-[9.5px]"} truncate block`}>
            {receiptData.payment_method === "BKASH" ? "bKash (বিকাশ)" :
             receiptData.payment_method === "NAGAD" ? "Nagad (নগদ)" :
             receiptData.payment_method === "ROCKET" ? "Rocket (রকেট)" :
             receiptData.payment_method === "BANK_TRANSFER" ? "Bank / Challan" :
             String(receiptData.payment_method || "CASH").replace("_", " ")}
          </span>
        </div>
      </div>

      {/* 3. Fee Items Breakdown Table */}
      {isMultiColumn ? (
        // 2-Column Split Particulars Grid for many items (compact, fits all items & summary perfectly)
        <div className="my-0.2">
          <table className="w-full text-left border-collapse text-xs table-fixed border border-slate-300">
            <thead>
              <tr className={`border-b border-slate-300 ${isUltraCompact ? "text-[7.5px]" : isDense ? "text-[8px]" : "text-[8.5px] sm:text-[9px]"} text-slate-700 uppercase font-bold bg-slate-100`}>
                <th className="py-0.5 px-1 w-[35%] border-r border-slate-200">১. ফি খাত ও বিবরণ</th>
                <th className="py-0.5 px-1 text-right w-[15%] border-r-2 border-slate-300">টাকা</th>
                <th className="py-0.5 px-1 w-[35%] border-r border-slate-200">২. ফি খাত ও বিবরণ</th>
                <th className="py-0.5 px-1 text-right w-[15%]">টাকা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {Array.from({ length: Math.ceil(feeItems.length / 2) }).map((_, rIdx) => {
                const half = Math.ceil(feeItems.length / 2);
                const left = feeItems[rIdx];
                const right = feeItems[rIdx + half];
                return (
                  <tr key={rIdx} className="hover:bg-slate-50/50">
                    {/* Left Column Item */}
                    <td className={`${isUltraCompact ? "py-[0.5px]" : isDense ? "py-[1px]" : "py-0.75"} px-1 border-r border-slate-200 align-middle`}>
                      <div className="flex items-center gap-0.5 min-w-0">
                        <span className="font-mono text-slate-400 text-[7px] w-3.5 shrink-0">{rIdx + 1}.</span>
                        <span className={`font-semibold text-slate-900 truncate ${isUltraCompact ? "text-[7.5px] sm:text-[8px]" : isDense ? "text-[8px] sm:text-[8.5px]" : "text-[9.5px] sm:text-[10px]"}`} title={left.name}>
                          {left.name}
                        </span>
                      </div>
                    </td>
                    <td className={`${isUltraCompact ? "py-[0.5px]" : isDense ? "py-[1px]" : "py-0.75"} px-1 text-right font-medium text-slate-800 border-r-2 border-slate-300 align-middle ${isUltraCompact ? "text-[7.5px] sm:text-[8px]" : isDense ? "text-[8px] sm:text-[8.5px]" : "text-[9.5px] sm:text-[10px]"}`}>
                      {fmt(left.net ?? left.amount)}
                    </td>

                    {/* Right Column Item */}
                    <td className={`${isUltraCompact ? "py-[0.5px]" : isDense ? "py-[1px]" : "py-0.75"} px-1 border-r border-slate-200 align-middle`}>
                      {right ? (
                        <div className="flex items-center gap-0.5 min-w-0">
                          <span className="font-mono text-slate-400 text-[7px] w-4 shrink-0">{rIdx + half + 1}.</span>
                          <span className={`font-semibold text-slate-900 truncate ${isUltraCompact ? "text-[7.5px] sm:text-[8px]" : isDense ? "text-[8px] sm:text-[8.5px]" : "text-[9.5px] sm:text-[10px]"}`} title={right.name}>
                            {right.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className={`${isUltraCompact ? "py-[0.5px]" : isDense ? "py-[1px]" : "py-0.75"} px-1 text-right font-medium text-slate-800 align-middle ${isUltraCompact ? "text-[7.5px] sm:text-[8px]" : isDense ? "text-[8px] sm:text-[8.5px]" : "text-[9.5px] sm:text-[10px]"}`}>
                      {right ? fmt(right.net ?? right.amount) : ""}
                    </td>
                  </tr>
                );
              })}

              {/* Subtotal Summary Footer Row */}
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                <td className={`${isUltraCompact ? "py-0.5" : "py-0.75"} px-1 text-slate-800 border-r border-slate-200 ${isUltraCompact ? "text-[7.5px] sm:text-[8px]" : isDense ? "text-[8px] sm:text-[8.5px]" : "text-[9px] sm:text-[9.5px]"}`}>
                  মোট ফি খাত: <span className="font-black text-emerald-950">{feeItems.length} টি</span>
                </td>
                <td className={`${isUltraCompact ? "py-0.5" : "py-0.75"} px-1 text-right text-slate-600 border-r-2 border-slate-300 font-semibold ${isUltraCompact ? "text-[7.5px] sm:text-[8px]" : isDense ? "text-[8px] sm:text-[8.5px]" : "text-[9px] sm:text-[9.5px]"}`}>
                  {Number(receiptData.discount || 0) > 0 ? `ছাড়: -${fmt(receiptData.discount)}` : "—"}
                </td>
                <td className={`${isUltraCompact ? "py-0.5" : "py-0.75"} px-1 text-slate-800 border-r border-slate-200 text-right font-bold ${isUltraCompact ? "text-[7.5px] sm:text-[8px]" : isDense ? "text-[8px] sm:text-[8.5px]" : "text-[9px] sm:text-[9.5px]"}`}>
                  সর্বমোট প্রদেয় ফি (Net Total):
                </td>
                <td className={`${isUltraCompact ? "py-0.5" : "py-0.75"} px-1 text-right font-black text-slate-950 ${isUltraCompact ? "text-[8px] sm:text-[8.5px]" : isDense ? "text-[8.5px] sm:text-[9px]" : "text-[9px] sm:text-[9.5px]"}`}>
                  {fmt(receiptData.net_amount || receiptData.amount)}
                </td>
              </tr>
            </tbody>
          </table>
          <div className={`${isUltraCompact ? "text-[7px]" : "text-[8px] sm:text-[8.5px]"} text-slate-500 font-mono mt-0.2 flex items-center justify-between px-1`}>
            <span>ইনভয়েস #{receiptData.invoice_no || "INV-000"}</span>
            <span>শিক্ষাবর্ষ: {receiptData.academic_year || "2026-2027"}</span>
          </div>
        </div>
      ) : (
        // Standard 5-Column Table for 1 to 5 items
        <div className={isCompact ? "my-0.5" : "my-1"}>
          <table className="w-full text-left border-collapse text-xs table-fixed">
            <thead>
              <tr className={`border-b border-t-2 border-slate-300 ${isCompact ? "text-[9px] py-1" : "text-[10px] py-1.5"} text-slate-700 uppercase font-bold bg-slate-100/90`}>
                <th className={`${isCompact ? "py-1 px-2" : "py-1.5 px-2.5"} w-[48%]`}>ফি খাত ও বিবরণ (Fee Particulars)</th>
                <th className={`${isCompact ? "py-1 px-1.5" : "py-1.5 px-2"} text-right w-[15%]`}>নির্ধারিত ফি</th>
                <th className={`${isCompact ? "py-1 px-1.5" : "py-1.5 px-2"} text-right w-[11%]`}>মওকুফ/ছাড়</th>
                <th className={`${isCompact ? "py-1 px-1.5" : "py-1.5 px-2"} text-right w-[11%]`}>বিলম্ব ফি</th>
                <th className={`${isCompact ? "py-1 px-2" : "py-1.5 px-2.5"} text-right w-[15%]`}>প্রদেয় টাকা (Net)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {feeItems.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className={`${isCompact ? "py-0.75 px-2 text-[10.5px]" : "py-1.5 px-2.5 text-xs"} align-middle`}>
                    <div className="flex items-center gap-1.5">
                      {feeItems.length > 1 && (
                        <span className="w-1 h-1 rounded-full bg-emerald-700 shrink-0" />
                      )}
                      <span className="break-words font-semibold text-slate-900 leading-snug">
                        {it.name}
                      </span>
                    </div>
                  </td>
                  <td className={`${isCompact ? "py-0.75 px-1.5 text-[10.5px]" : "py-1.5 px-2 text-xs"} text-right font-medium text-slate-800 align-middle`}>
                    {fmt(it.amount)}
                  </td>
                  <td className={`${isCompact ? "py-0.75 px-1.5 text-[10.5px]" : "py-1.5 px-2 text-xs"} text-right text-emerald-700 font-medium align-middle`}>
                    {it.discount && it.discount > 0 ? `-${fmt(it.discount)}` : "—"}
                  </td>
                  <td className={`${isCompact ? "py-0.75 px-1.5 text-[10.5px]" : "py-1.5 px-2 text-xs"} text-right text-amber-700 font-medium align-middle`}>
                    {it.late_fine && it.late_fine > 0 ? `+${fmt(it.late_fine)}` : "—"}
                  </td>
                  <td className={`${isCompact ? "py-0.75 px-2 text-[10.5px]" : "py-1.5 px-2.5 text-xs"} text-right font-bold text-slate-900 align-middle`}>
                    {fmt(it.net ?? it.amount)}
                  </td>
                </tr>
              ))}

              {/* Subtotal row if more than 1 item */}
              {feeItems.length > 1 && (
                <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-bold">
                  <td className={`${isCompact ? "py-0.75 px-2 text-[10.5px]" : "py-1 px-2.5 text-xs"} text-slate-800`}>
                    মোট ফি (Subtotal - {feeItems.length} Items)
                  </td>
                  <td className={`${isCompact ? "py-0.75 px-1.5 text-[10.5px]" : "py-1 px-2 text-xs"} text-right font-semibold text-slate-800`}>
                    {fmt(receiptData.invoice_amount || receiptData.amount)}
                  </td>
                  <td className={`${isCompact ? "py-0.75 px-1.5 text-[10.5px]" : "py-1 px-2 text-xs"} text-right text-emerald-700 font-semibold`}>
                    {Number(receiptData.discount || 0) > 0 ? `-${fmt(receiptData.discount)}` : "—"}
                  </td>
                  <td className={`${isCompact ? "py-0.75 px-1.5 text-[10.5px]" : "py-1 px-2 text-xs"} text-right text-amber-700 font-semibold`}>
                    {Number(receiptData.late_fine || 0) > 0 ? `+${fmt(receiptData.late_fine)}` : "—"}
                  </td>
                  <td className={`${isCompact ? "py-0.75 px-2 text-[10.5px]" : "py-1 px-2.5 text-xs"} text-right font-black text-slate-950`}>
                    {fmt(receiptData.net_amount || receiptData.amount)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5 flex items-center justify-between px-1">
            <span>ইনভয়েস #{receiptData.invoice_no || "INV-000"}</span>
            <span>শিক্ষাবর্ষ: {receiptData.academic_year || "2026-2027"}</span>
          </div>
        </div>
      )}

      {/* 4. Summary Box & In Words */}
      <div className={`grid grid-cols-12 gap-1.5 items-center bg-slate-50 ${
        isUltraCompact ? "p-0.75 my-0.2" :
        isDense ? "p-1 my-0.5" :
        isCompact ? "p-1.5 my-0.5" : "p-2.5 my-1"
      } rounded-lg border border-slate-200 text-xs`}>
        <div className="col-span-7 pr-1">
          <div className={`text-slate-700 font-bold uppercase ${isUltraCompact ? "text-[7px]" : "text-[8px] sm:text-[8.5px]"}`}>টাকা কথায় (In Words):</div>
          <div className={`text-slate-900 font-semibold leading-tight break-words ${isUltraCompact ? "text-[8px]" : isDense ? "text-[8.5px]" : "text-[10px]"}`}>{wordsBn}</div>
          <div className={`text-slate-500 italic break-words ${isUltraCompact ? "text-[7px]" : "text-[7.5px] sm:text-[8px]"}`}>({wordsEn})</div>
          {receiptData.transaction_ref && (
            <div className={`font-mono text-slate-600 mt-0.2 truncate ${isUltraCompact ? "text-[7px]" : "text-[8px]"}`}>
              TrxID/Ref: <strong>{receiptData.transaction_ref}</strong>
            </div>
          )}
        </div>

        <div className="col-span-5 border-l border-slate-200 pl-1.5 space-y-0.2 text-xs">
          <div className={`flex justify-between text-slate-600 ${isUltraCompact ? "text-[8px]" : "text-[9.5px] sm:text-[10px]"}`}>
            <span>সর্বমোট প্রদেয় ফি:</span>
            <span className="font-semibold text-slate-900">{fmt(receiptData.net_amount || receiptData.amount)}</span>
          </div>
          <div className={`flex justify-between text-emerald-900 font-black border-t border-slate-200 pt-0.2 ${isUltraCompact ? "text-[8.5px]" : "text-[10px] sm:text-[11px]"}`}>
            <span>আদায়কৃত (Paid):</span>
            <span className={isUltraCompact ? "text-[9px]" : "text-xs sm:text-sm"}>{fmt(paidAmount)}</span>
          </div>
          <div className={`flex justify-between font-bold border-t border-slate-200 pt-0.2 ${isUltraCompact ? "text-[7.5px]" : "text-[9px] sm:text-[10px]"}`}>
            <span>বকেয়া (Due):</span>
            <span className={isFullPaid ? "text-emerald-700" : "text-rose-700"}>
              {isFullPaid ? "পরিশোধিত (Cleared)" : fmt(receiptData.remaining_due || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Signature Lines */}
      <div className={`grid grid-cols-2 gap-8 ${
        isUltraCompact ? "pt-0.5 mt-0.2" :
        isDense ? "pt-1 mt-0.5" :
        isCompact ? "pt-1.5 mt-0.5" : "pt-2 mt-1"
      } border-t border-slate-300 text-center text-xs text-slate-700`}>
        <div className="pb-0.5">
          <div className={`${isUltraCompact ? "h-2" : isDense ? "h-2.5" : isCompact ? "h-3.5" : "h-5"} border-b border-dashed border-slate-400 mb-0.5`} />
          <div className={`font-bold text-slate-800 ${isUltraCompact ? "text-[7.5px] sm:text-[8px]" : "text-[9px] sm:text-[10px]"}`}>আদায়কারীর স্বাক্ষর (Cashier)</div>
          <div className={`${isUltraCompact ? "text-[6.5px]" : "text-[7.5px] sm:text-[8px]"} text-slate-500`}>কম্পিউটার জেনারেটেড বিল ও রসিদ</div>
        </div>
        <div className="pb-0.5">
          <div className={`${isUltraCompact ? "h-2" : isDense ? "h-2.5" : isCompact ? "h-3.5" : "h-5"} border-b border-dashed border-slate-400 mb-0.5`} />
          <div className={`font-bold text-slate-800 ${isUltraCompact ? "text-[7.5px] sm:text-[8px]" : "text-[9px] sm:text-[10px]"}`}>অধ্যক্ষ / প্রধান শিক্ষকের স্বাক্ষর</div>
          <div className={`${isUltraCompact ? "text-[6.5px]" : "text-[7.5px] sm:text-[8px]"} text-slate-500`}>Principal / Headmaster</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      {/* Global Print Stylesheet for Full-Page A4 Output */}
      <style>{`
        @media print {
          html, body {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          @page {
            size: A4 portrait;
            margin: 3.5mm 5mm !important;
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
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-sizing: border-box !important;
          }
          .a4-dual-container {
            width: 100% !important;
            height: auto !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            gap: 1.5mm !important;
            box-sizing: border-box !important;
          }
          .receipt-copy-box {
            width: 100% !important;
            height: auto !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            box-sizing: border-box !important;
            padding: 1.5mm 3mm !important;
            border: 1.5px solid #1e293b !important;
            border-radius: 4px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .a4-scissors-divider {
            height: 3.5mm !important;
            margin: 0.5mm 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar (Hidden during printing) */}
        <div className="p-3 sm:p-3.5 border-b border-gray-100 flex flex-wrap items-center justify-between bg-slate-50 shrink-0 gap-2 no-print">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm">
            <Receipt size={17} className="text-[#005a40] shrink-0" />
            <span className="font-bold">বাংলাদেশ স্কুল ও কলেজ ফি রসিদ (A4 Money Receipt)</span>
            <div className="hidden md:flex items-center gap-1 bg-slate-200 p-0.5 rounded-lg text-[11px] ml-2">
              <button
                type="button"
                onClick={() => setLayoutMode("DUAL_STACKED")}
                className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                  layoutMode === "DUAL_STACKED"
                    ? "bg-white text-emerald-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="A4 সাইজে সম্পূর্ণ পাতাজুড়ে ২টি কপি উপর-নিচ"
              >
                ২-কপি (A4 ফুল পেজ)
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("DUAL_SIDE")}
                className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
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
                className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-[#005a40] text-white hover:bg-[#004732] rounded-lg transition shadow-xs cursor-pointer"
              title="প্রিন্ট করুন অথবা সেভ করে পিডিএফ ফাইল ডাউনলোড করুন"
            >
              <Printer size={13} />
              <span>প্রিন্ট / পিডিএফ ডাউনলোড (Print & PDF)</span>
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
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100/70 flex justify-center">
          <div
            className="w-full max-w-[760px] bg-white p-3 sm:p-5 rounded-xl border border-slate-300 shadow-sm print:p-0 print:border-none print:shadow-none print:max-w-none"
            id="fee-receipt-printable"
          >
            {layoutMode === "DUAL_STACKED" ? (
              <div className="a4-dual-container space-y-3 print:space-y-0">
                {/* Part 1: Institution / Office Copy */}
                {renderVoucherCopy("প্রতিষ্ঠান / ব্যাংক কপি (OFFICE COPY)", "অফিস সংরক্ষণ কপি")}

                {/* Perforation / Scissor Line */}
                <div className="a4-scissors-divider flex items-center justify-center gap-2 text-slate-400 text-[9px] font-mono select-none py-1">
                  <Scissors size={13} />
                  <span className="border-b border-dashed border-slate-400 flex-1" />
                  <span>এখানে কাটুন (Cut along the dotted line)</span>
                  <span className="border-b border-dashed border-slate-400 flex-1" />
                </div>

                {/* Part 2: Student / Guardian Copy */}
                {renderVoucherCopy("শিক্ষার্থী / অভিভাবক কপি (STUDENT COPY)", "শিক্ষার্থী সংরক্ষণ কপি")}
              </div>
            ) : layoutMode === "DUAL_SIDE" ? (
              <div className="grid grid-cols-2 gap-3">
                {renderVoucherCopy("প্রতিষ্ঠান কপি (OFFICE)", "অফিস সংরক্ষণ")}
                {renderVoucherCopy("শিক্ষার্থী কপি (STUDENT)", "শিক্ষার্থী সংরক্ষণ")}
              </div>
            ) : (
              renderVoucherCopy("মূল মানি রসিদ (OFFICIAL MONEY RECEIPT)", "আদায় ও হিসাব কপি")
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeReceiptSlipModal;
