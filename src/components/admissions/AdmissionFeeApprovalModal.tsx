import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Coins,
  CreditCard,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Layers,
  Printer,
  Receipt,
  Sparkles,
  Tag,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { FeeCategory, PaymentMethod } from "@/types/fees";
import { AdmissionItem } from "@/components/AdmissionSection";

export interface AdmissionFeeApprovalModalProps {
  admission: AdmissionItem | null;
  onClose: () => void;
  onApproved: (updatedAdmission: AdmissionItem) => void;
}

const defaultAdmissionCategory: FeeCategory = {
  id: 2,
  name: "Admission / Enrollment Fee",
  code: "ADMS",
  default_amount: 350,
  frequency: "ONE_TIME",
  status: "ACTIVE",
  description: "Standard one-time registration and admission fee",
};

export const AdmissionFeeApprovalModal: React.FC<AdmissionFeeApprovalModalProps> = ({
  admission,
  onClose,
  onApproved,
}) => {
  const { siteName, currencySymbol: cs, websiteContent, siteLogoUrl } = useSiteSettings();
  const fmt = (n: number | string) =>
    `${cs}${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const [categories, setCategories] = useState<FeeCategory[]>([defaultAdmissionCategory]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(2);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

  // Fee inputs
  const [amount, setAmount] = useState<number>(350);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentOption, setPaymentOption] = useState<"FULL" | "PARTIAL" | "LATER" | "WAIVED">("FULL");
  const [paidNow, setPaidNow] = useState<number>(350);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [transactionRef, setTransactionRef] = useState<string>("");
  const [notes, setNotes] = useState<string>("Admission fee collected upon application approval");
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Submission & Post-approval states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    admission: AdmissionItem;
    studentId: string;
    invoiceNo: string;
    receiptNo?: string | null;
    netAmount: number;
    paidAmount: number;
    status: string;
  } | null>(null);

  // Fetch live fee categories from Fees section
  useEffect(() => {
    let active = true;
    setLoadingCategories(true);
    api
      .getFeeCategories()
      .then((res: any) => {
        if (!active) return;
        const catList: FeeCategory[] = res?.categories || res?.data?.categories || [];
        if (Array.isArray(catList) && catList.length > 0) {
          setCategories(catList);
          // Find Admission / Enrollment Fee category
          const admissionCat =
            catList.find(
              (c) =>
                c.code?.toUpperCase() === "ADMS" ||
                c.name?.toLowerCase().includes("admission") ||
                c.name?.toLowerCase().includes("enrollment")
            ) || catList[0];

          if (admissionCat) {
            setSelectedCategoryId(Number(admissionCat.id));
            const baseAmount = Number(admissionCat.default_amount) || 350;
            setAmount(baseAmount);
            setPaidNow(baseAmount);
          }
        }
      })
      .catch((err) => {
        console.warn("Could not load fee categories from server, using defaults.", err);
      })
      .finally(() => {
        if (active) setLoadingCategories(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!admission) return null;

  const currentCategory =
    categories.find((c) => Number(c.id) === Number(selectedCategoryId)) || categories[0] || defaultAdmissionCategory;

  const handleCategoryChange = (catId: number) => {
    setSelectedCategoryId(catId);
    const cat = categories.find((c) => Number(c.id) === Number(catId));
    if (cat) {
      const baseAmount = Number(cat.default_amount) || 0;
      setAmount(baseAmount);
      if (paymentOption === "FULL") {
        setPaidNow(Math.max(0, baseAmount - discount));
      } else if (paymentOption === "WAIVED") {
        setDiscount(baseAmount);
        setPaidNow(0);
      }
    }
  };

  const handleDiscountChange = (newDiscount: number) => {
    setDiscount(newDiscount);
    const net = Math.max(0, amount - newDiscount);
    if (paymentOption === "FULL") {
      setPaidNow(net);
    } else if (paymentOption === "LATER" || paymentOption === "WAIVED") {
      setPaidNow(0);
    } else {
      setPaidNow((prev) => Math.min(prev, net));
    }
  };

  const handlePaymentOptionSelect = (option: "FULL" | "PARTIAL" | "LATER" | "WAIVED") => {
    setPaymentOption(option);
    const net = Math.max(0, amount - discount);
    if (option === "FULL") {
      setPaidNow(net);
    } else if (option === "PARTIAL") {
      setPaidNow(Math.round(net / 2));
    } else if (option === "LATER") {
      setPaidNow(0);
    } else if (option === "WAIVED") {
      setDiscount(amount);
      setPaidNow(0);
    }
  };

  const netPayable = Math.max(0, amount - discount);
  const remainingDue = Math.max(0, netPayable - paidNow);

  // Submit Approval and generate Invoice/Payment
  const handleConfirmApproval = async (skipFee = false) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: Record<string, any> = {
        status: "APPROVED",
      };

      if (!skipFee) {
        payload.admission_fee = {
          fee_category_id: selectedCategoryId,
          amount: Number(amount),
          discount: Number(discount),
          paid_now: Number(paidNow),
          payment_method: paymentMethod,
          transaction_ref: transactionRef.trim(),
          notes: notes.trim(),
          academic_year: "2026-2027",
        };
      }

      // Step 1: Update admission status to APPROVED (auto-enrolls student)
      const res = await api.update("admissions", admission.id, payload);

      if (!res.success) {
        setErrorMessage(res.message || "Failed to approve admission. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const updatedAdmission = res.data || { ...admission, status: "APPROVED" };
      const enrolledStudentId =
        updatedAdmission.enrolled_student_id ||
        res.data?.enrolled_student_id ||
        `STU-${admission.id}`;

      let invoiceNo = res.data?.fee_receipt?.invoice_no || `INV-2026-${String(admission.id).padStart(4, "0")}`;
      let receiptNo = res.data?.fee_receipt?.receipt_no || (paidNow > 0 ? `REC-2026-${String(admission.id).padStart(4, "0")}` : null);

      // Step 2: If backend update did not generate fee invoice, create it via fees API
      if (!skipFee && !res.data?.fee_receipt && enrolledStudentId) {
        try {
          const feeRes: any = await api.create("fees", {
            student_id: enrolledStudentId,
            fee_category_id: selectedCategoryId,
            title: `${currentCategory.name} - ${admission.first_name} ${admission.last_name}`,
            amount: Number(amount),
            discount: Number(discount),
            paid_now: Number(paidNow),
            payment_method: paymentMethod,
            transaction_ref: transactionRef.trim(),
            due_date: dueDate,
            academic_year: "2026-2027",
            notes: notes.trim(),
          });

          if (feeRes?.invoice_no) invoiceNo = feeRes.invoice_no;
          if (feeRes?.receipt_no) receiptNo = feeRes.receipt_no;
        } catch (feeError) {
          console.warn("Direct fee generation fallback notice:", feeError);
        }
      }

      onApproved(updatedAdmission);

      if (skipFee) {
        onClose();
        return;
      }

      setSuccessResult({
        admission: updatedAdmission,
        studentId: enrolledStudentId,
        invoiceNo,
        receiptNo,
        netAmount: netPayable,
        paidAmount: paidNow,
        status: paidNow >= netPayable ? "PAID" : paidNow > 0 ? "PARTIAL" : "UNPAID",
      });
    } catch (err: any) {
      console.error("Failed to approve admission and record fee:", err);
      setErrorMessage("An unexpected network error occurred while processing approval.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct print money receipt
  const handlePrintReceipt = () => {
    if (!successResult) return;
    const printWindow = window.open("", "_blank", "width=850,height=900");
    if (!printWindow) {
      alert("Popup blocked. Please allow popups for this site to print the receipt.");
      return;
    }

    const schoolName = websiteContent?.schoolName || siteName || "MK Model High School & College";
    const schoolAddress =
      websiteContent?.address || websiteContent?.addressEn || "College Road, Dhanmondi, Dhaka-1205";
    const schoolPhone = websiteContent?.phone || "+880 2 1234 5678";
    const eiin = websiteContent?.eiin || "123456";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Admission Money Receipt - ${admission.first_name} ${admission.last_name}</title>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          body { padding: 30px; background: #fff; color: #1e293b; font-size: 13px; line-height: 1.5; }
          .receipt-container { max-width: 720px; margin: 0 auto; border: 2px solid #047857; border-radius: 16px; padding: 24px; }
          .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 20px; }
          .school-name { font-size: 20px; font-weight: 800; color: #047857; text-transform: uppercase; }
          .sub-info { font-size: 11px; color: #64748b; margin-top: 4px; }
          .title-badge { display: inline-block; background: #047857; color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 12px; border-radius: 6px; margin-top: 8px; }
          .voucher-meta { display: flex; justify-content: space-between; margin-bottom: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
          .meta-block { font-size: 12px; }
          .meta-label { color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 600; }
          .meta-val { font-weight: 700; color: #0f172a; font-family: monospace; font-size: 13px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f1f5f9; padding: 14px; border-radius: 10px; margin-bottom: 20px; font-size: 12px; }
          .info-item span:first-child { color: #64748b; font-size: 11px; display: block; }
          .info-item span:last-child { font-weight: 700; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #047857; color: white; padding: 8px 12px; font-size: 11px; text-transform: uppercase; text-align: left; }
          td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
          .totals { margin-left: auto; width: 280px; margin-bottom: 25px; }
          .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: #475569; }
          .totals-row.highlight { font-size: 14px; font-weight: 800; color: #047857; border-top: 2px solid #047857; padding-top: 8px; margin-top: 4px; }
          .footer-signs { display: flex; justify-content: space-between; margin-top: 45px; padding-top: 10px; }
          .sign-col { text-align: center; width: 180px; border-top: 1px dashed #64748b; font-size: 11px; font-weight: 600; color: #475569; padding-top: 6px; }
          @media print {
            body { padding: 0; }
            .receipt-container { border: 1px solid #047857; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div class="school-name">${schoolName}</div>
            <div class="sub-info">${schoolAddress} • Phone: ${schoolPhone}</div>
            <div class="sub-info">EIIN: <strong>${eiin}</strong> • Academic Session: 2026–2027</div>
            <div class="title-badge">Official Admission Fee Money Receipt</div>
          </div>

          <div class="voucher-meta">
            <div class="meta-block">
              <div class="meta-label">Receipt Voucher No</div>
              <div class="meta-val">${successResult.receiptNo || "REC-PENDING"}</div>
            </div>
            <div class="meta-block">
              <div class="meta-label">Invoice Reference</div>
              <div class="meta-val">${successResult.invoiceNo}</div>
            </div>
            <div class="meta-block" style="text-align: right;">
              <div class="meta-label">Payment Date</div>
              <div class="meta-val">${new Date().toISOString().split("T")[0]}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span>Student Full Name</span>
              <span>${admission.first_name} ${admission.last_name}</span>
            </div>
            <div class="info-item">
              <span>Enrolled Student ID / Roll</span>
              <span>${successResult.studentId} • Roll: ${admission.roll || "01"}</span>
            </div>
            <div class="info-item">
              <span>Class & Medium</span>
              <span>${admission.class_name || "New Admission"} • ${admission.version || "Bangla"} Version</span>
            </div>
            <div class="info-item">
              <span>Guardian & Mobile</span>
              <span>${admission.parent_name || "Guardian"} • ${admission.parent_phone || "N/A"}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Fee Particulars / Category</th>
                <th style="text-align: right;">Standard Rate</th>
                <th style="text-align: right;">Waiver / Discount</th>
                <th style="text-align: right;">Net Payable</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>${currentCategory.name}</strong>
                  <div style="font-size: 10px; color: #64748b;">Admission verification and classroom seat allocation</div>
                </td>
                <td style="text-align: right;">${fmt(amount)}</td>
                <td style="text-align: right; color: #dc2626;">${discount > 0 ? `-${fmt(discount)}` : `${cs}0.00`}</td>
                <td style="text-align: right; font-weight: 700;">${fmt(netPayable)}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>Total Assessed Fee:</span>
              <span>${fmt(amount)}</span>
            </div>
            <div class="totals-row">
              <span>Special Waiver:</span>
              <span>${fmt(discount)}</span>
            </div>
            <div class="totals-row highlight">
              <span>Amount Paid (${paymentMethod.replace("_", " ")}):</span>
              <span>${fmt(paidNow)}</span>
            </div>
            ${
              remainingDue > 0
                ? `<div class="totals-row" style="color: #dc2626; font-weight: 700; margin-top: 4px;">
                    <span>Balance Due:</span>
                    <span>${fmt(remainingDue)}</span>
                  </div>`
                : `<div class="totals-row" style="color: #047857; font-weight: 700; margin-top: 4px;">
                    <span>Status:</span>
                    <span>PAID IN FULL</span>
                  </div>`
            }
          </div>

          <div style="font-size: 11px; color: #64748b; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <strong>Transaction Ref:</strong> ${transactionRef || "Verified Cash / Bank Payment"} • <strong>Payment Mode:</strong> ${paymentMethod.replace("_", " ")} • <strong>Notes:</strong> ${notes}
          </div>

          <div class="footer-signs">
            <div class="sign-col">
              Parent / Guardian Signature
            </div>
            <div class="sign-col">
              Accounts Officer Seal & Sign
            </div>
            <div class="sign-col">
              Headmaster / Principal
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[95vh] flex flex-col justify-between my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* SUCCESS CONFIRMATION SCREEN */}
        {successResult ? (
          <div className="space-y-5 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/10">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">
                Admission Approved & Enrolled!
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Student <strong className="text-gray-900 dark:text-gray-100">{admission.first_name} {admission.last_name}</strong> is now enrolled in the school directory.
              </p>
            </div>

            {/* Voucher summary card */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-left grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Student ID</span>
                <span className="font-mono font-bold text-gray-900 dark:text-gray-100 text-sm">
                  {successResult.studentId}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Class & Roll</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {admission.class_name || "Assigned"} (Roll: {admission.roll || "01"})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Fee Invoice No</span>
                <span className="font-mono font-semibold text-emerald-800 dark:text-emerald-300">
                  {successResult.invoiceNo}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Money Receipt No</span>
                <span className="font-mono font-semibold text-emerald-800 dark:text-emerald-300">
                  {successResult.receiptNo || "Paid Later / Invoiced"}
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                <span className="font-bold text-gray-700 dark:text-gray-300">Admission Fee Paid:</span>
                <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                  {fmt(successResult.paidAmount)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition"
              >
                <Printer size={15} />
                <span>Print Money Receipt</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-800 dark:text-gray-200 font-bold text-xs transition"
              >
                Done & Close
              </button>
            </div>
          </div>
        ) : (
          /* APPROVAL & FEE COLLECTION FORM */
          <>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span>Approve Admission & Collect Fee</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                      Fees Directory
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enroll student into classroom and generate official admission fee voucher
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="my-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Applicant Mini Card */}
            <div className="my-3 bg-gradient-to-r from-gray-50 to-emerald-50/30 dark:from-gray-900/40 dark:to-emerald-950/20 rounded-2xl p-3 border border-gray-200 dark:border-gray-700 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Applicant</span>
                <span className="font-bold text-gray-900 dark:text-gray-100 truncate block">
                  {admission.first_name} {admission.last_name}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Application No</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 block truncate">
                  {admission.application_no}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Class / Roll</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200 block truncate">
                  {admission.class_name || "Assigned"} • Roll {admission.roll || "01"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Guardian</span>
                <span className="text-gray-700 dark:text-gray-300 block truncate font-medium">
                  {admission.parent_name || admission.parent_phone || "Parent"}
                </span>
              </div>
            </div>

            {/* FEE SETUP FORM */}
            <div className="space-y-3.5 my-1 overflow-y-auto max-h-[60vh] pr-1">
              {/* Fee Category from Fees Section */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Tag size={13} className="text-emerald-600" />
                    <span>Fee Category (from Fees Section) *</span>
                  </label>
                  <span className="text-[11px] text-gray-400">
                    Default rate: <strong className="text-emerald-700 dark:text-emerald-300">{fmt(currentCategory.default_amount)}</strong>
                  </span>
                </div>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => handleCategoryChange(Number(e.target.value))}
                  disabled={loadingCategories}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({fmt(cat.default_amount)}) - {cat.frequency}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount, Discount, Net Calculation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Admission Fee ({cs}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setAmount(val);
                      if (paymentOption === "FULL") setPaidNow(Math.max(0, val - discount));
                    }}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Discount / Waiver ({cs})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => handleDiscountChange(Number(e.target.value) || 0)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Net Payable ({cs})
                  </label>
                  <div className="w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <span>{fmt(netPayable)}</span>
                    <span className="text-[10px] font-bold uppercase opacity-80">Net Total</span>
                  </div>
                </div>
              </div>

              {/* Collection Mode Tabs */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Collection & Settlement Option *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handlePaymentOptionSelect("FULL")}
                    className={`py-2 px-2.5 rounded-xl font-bold border transition text-center flex flex-col items-center gap-0.5 ${
                      paymentOption === "FULL"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xs">Paid in Full</span>
                    <span className={`text-[10px] font-normal ${paymentOption === "FULL" ? "text-emerald-100" : "text-gray-400"}`}>
                      Collect {fmt(netPayable)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePaymentOptionSelect("PARTIAL")}
                    className={`py-2 px-2.5 rounded-xl font-bold border transition text-center flex flex-col items-center gap-0.5 ${
                      paymentOption === "PARTIAL"
                        ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xs">Partial Payment</span>
                    <span className={`text-[10px] font-normal ${paymentOption === "PARTIAL" ? "text-amber-100" : "text-gray-400"}`}>
                      Deposit now
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePaymentOptionSelect("LATER")}
                    className={`py-2 px-2.5 rounded-xl font-bold border transition text-center flex flex-col items-center gap-0.5 ${
                      paymentOption === "LATER"
                        ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xs">Pay Later</span>
                    <span className={`text-[10px] font-normal ${paymentOption === "LATER" ? "text-sky-100" : "text-gray-400"}`}>
                      Invoice to Due
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePaymentOptionSelect("WAIVED")}
                    className={`py-2 px-2.5 rounded-xl font-bold border transition text-center flex flex-col items-center gap-0.5 ${
                      paymentOption === "WAIVED"
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xs">100% Free Waiver</span>
                    <span className={`text-[10px] font-normal ${paymentOption === "WAIVED" ? "text-purple-100" : "text-gray-400"}`}>
                      Free admission
                    </span>
                  </button>
                </div>
              </div>

              {/* Payment Details when collecting payment */}
              {paymentOption !== "LATER" && paymentOption !== "WAIVED" && (
                <div className="bg-gray-50 dark:bg-gray-900/60 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Amount Paid Now ({cs}) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={netPayable}
                        step="0.01"
                        value={paidNow}
                        onChange={(e) => setPaidNow(Math.min(netPayable, Number(e.target.value) || 0))}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Payment Method *
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200"
                      >
                        <option value="CASH">Cash Payment</option>
                        <option value="MOBILE_BANKING">Mobile Banking (bKash / Nagad / Rocket)</option>
                        <option value="BANK_TRANSFER">Bank Deposit / Transfer</option>
                        <option value="CARD">Debit / Credit Card</option>
                        <option value="CHEQUE">Cheque / Pay Order</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Transaction Ref / Money Receipt Slip No. (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. bKash TrxID or Cash Memo / Slip #104"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-800 dark:text-gray-200"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Remarks / Fee Memo
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300"
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs">
              <button
                type="button"
                onClick={() => handleConfirmApproval(true)}
                disabled={isSubmitting}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-semibold underline text-[11px] transition disabled:opacity-50"
              >
                Skip Fee & Just Approve
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmApproval(false)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                >
                  <UserCheck size={16} />
                  <span>
                    {isSubmitting
                      ? "Processing..."
                      : paymentOption === "FULL"
                      ? `Approve & Collect ${fmt(paidNow)}`
                      : paymentOption === "PARTIAL"
                      ? `Approve & Collect ${fmt(paidNow)}`
                      : paymentOption === "LATER"
                      ? `Approve & Invoice ${fmt(netPayable)}`
                      : "Approve with Full Waiver"}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdmissionFeeApprovalModal;

