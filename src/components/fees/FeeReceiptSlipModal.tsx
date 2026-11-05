import React, { useEffect } from "react";
import {
  Building2,
  CheckCircle2,
  Download,
  Printer,
  Receipt,
  X,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { FeeReceiptData } from "@/types/fees";

interface FeeReceiptSlipModalProps {
  receiptData: FeeReceiptData | null;
  onClose: () => void;
}

export const FeeReceiptSlipModal: React.FC<FeeReceiptSlipModalProps> = ({
  receiptData,
  onClose,
}) => {
  const { siteName, currencySymbol: cs, websiteContent, siteLogoUrl } = useSiteSettings();

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Top Control Bar (Hidden during window.print) */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50 no-print">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Receipt size={17} className="text-[#005a40]" />
            <span>Money Receipt / Fee Voucher Slip</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#005a40] text-white hover:bg-[#004732] rounded-lg transition shadow-xs"
            >
              <Printer size={13} />
              <span>Print Slip</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="p-6 md:p-8 bg-white print:p-0 text-slate-900" id="fee-receipt-printable">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-emerald-800/80 pb-4 mb-5 gap-4">
            <div className="flex items-center gap-3">
              {logo ? (
                <img
                  src={logo}
                  alt={schoolName}
                  className="w-14 h-14 object-contain rounded-lg border border-gray-100"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-800 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                  <Building2 size={24} />
                </div>
              )}
              <div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  {schoolName}
                </h2>
                <p className="text-[11px] text-slate-600 leading-tight">
                  {address}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Tel: {contactPhone} • Email: {contactEmail}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block px-3 py-1 rounded-md text-[11px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-900 border border-emerald-300">
                Official Money Receipt
              </span>
              <div className="font-mono font-bold text-slate-900 text-xs mt-1.5">
                {receiptData.receipt_no || `SLIP-${receiptData.invoice_no || "0001"}`}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Date: <strong>{receiptData.payment_date || new Date().toISOString().slice(0, 10)}</strong>
              </div>
            </div>
          </div>

          {/* Student Info Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs mb-5">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Student Name</span>
              <span className="font-bold text-slate-900 text-sm">
                {[receiptData.student_name, receiptData.student_surname].filter(Boolean).join(" ") || "Student"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Student ID / Roll</span>
              <span className="font-mono font-bold text-slate-800">
                {receiptData.student_code || receiptData.student_id || "—"}
                {receiptData.student_roll ? ` (Roll: ${receiptData.student_roll})` : ""}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Class / Section</span>
              <span className="font-semibold text-slate-800">
                {receiptData.class_name ? `Class ${receiptData.class_name}` : "General"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Payment Mode</span>
              <span className="font-bold text-emerald-800 uppercase text-[11px]">
                {String(receiptData.payment_method || "CASH").replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Fee Breakdown Table */}
          <table className="w-full text-left border-collapse text-xs mb-5">
            <thead>
              <tr className="border-b-2 border-slate-200 text-[11px] text-slate-500 uppercase font-bold tracking-wider bg-slate-50/70">
                <th className="py-2 px-2.5">Fee Category / Description</th>
                <th className="py-2 px-2 text-right">Billed Amount</th>
                <th className="py-2 px-2 text-right">Discount</th>
                <th className="py-2 px-2 text-right">Net Payable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-2.5">
                  <div className="font-bold text-slate-900">
                    {receiptData.invoice_title || receiptData.category_name || "Academic Fee"}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Invoice #{receiptData.invoice_no || "INV-000"} • Year: {receiptData.academic_year || "2026-2027"}
                  </div>
                </td>
                <td className="py-3 px-2 text-right font-semibold text-slate-800">
                  {fmt(receiptData.invoice_amount || receiptData.amount)}
                </td>
                <td className="py-3 px-2 text-right text-slate-500">
                  {Number(receiptData.discount || 0) > 0 ? `-${fmt(receiptData.discount)}` : "—"}
                </td>
                <td className="py-3 px-2 text-right font-bold text-slate-900">
                  {fmt(receiptData.net_amount || receiptData.amount)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Amount Calculation Box */}
          <div className="flex justify-end mb-6">
            <div className="w-72 space-y-1.5 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
              <div className="flex justify-between text-slate-600">
                <span>Net Billed Fee:</span>
                <span className="font-semibold text-slate-900">
                  {fmt(receiptData.net_amount || receiptData.amount)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-800 font-bold border-t border-slate-200 pt-1.5">
                <span>Amount Paid:</span>
                <span className="text-sm font-black">{fmt(receiptData.total_paid || receiptData.amount)}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-bold border-t border-slate-200 pt-1.5 text-xs">
                <span>Remaining Due:</span>
                <span className={isFullPaid ? "text-emerald-700" : "text-rose-700"}>
                  {isFullPaid ? "Cleared / Paid" : fmt(receiptData.remaining_due || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Status Badge & Ref */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className={isFullPaid ? "text-emerald-700" : "text-amber-600"} />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payment Status</div>
                <div className="font-black text-xs text-slate-900">
                  {isFullPaid ? "PAID IN FULL" : (Number(receiptData.total_paid || 0) > 0 ? "PARTIALLY PAID" : "PENDING PAYMENT")}
                </div>
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-500 font-mono">
              Ref: <strong className="text-slate-800">{receiptData.transaction_ref || "SYSTEM_RECORD"}</strong>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-12 pt-6 border-t border-dashed border-slate-300 text-center text-xs text-slate-600">
            <div>
              <div className="h-8 border-b border-slate-400 mb-1" />
              <div className="font-bold text-slate-800">Student / Guardian Signature</div>
              <div className="text-[10px] text-slate-400">Acknowledged receipt of bill</div>
            </div>
            <div>
              <div className="h-8 border-b border-slate-400 mb-1" />
              <div className="font-bold text-slate-800">Authorized Accounts Officer</div>
              <div className="text-[10px] text-slate-400">Seal &amp; Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeReceiptSlipModal;

