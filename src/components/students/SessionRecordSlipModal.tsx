import React, { useRef } from "react";
import { Printer, X, CheckCircle2, ShieldCheck, Award, Calendar, BookOpen, User, Wallet, FileText } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { StudentSessionHistory } from "@/types/promotion";

interface SessionRecordSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: StudentSessionHistory;
  studentName: string;
  studentUsername?: string;
  guardianName?: string;
  guardianPhone?: string;
}

export const SessionRecordSlipModal: React.FC<SessionRecordSlipModalProps> = ({
  isOpen,
  onClose,
  record,
  studentName,
  studentUsername,
  guardianName,
  guardianPhone,
}) => {
  const { siteName, siteLogo, currencySymbol: cs } = useSiteSettings();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  const fmt = (val: number | string | undefined | null) =>
    `${cs}${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const statusBengali: Record<string, string> = {
    PROMOTED: "পরবর্তী শ্রেণীতে উত্তীর্ণ (Promoted)",
    RETAINED: "একই শ্রেণীতে বহাল (Retained)",
    PASSED_OUT: "চূড়ান্ত উত্তীর্ণ / সমাপনী (Graduated)",
    TRANSFERRED: "ছাড়পত্র / টিসি প্রাপ্ত (Transferred)",
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PROMOTED":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "RETAINED":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "PASSED_OUT":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "TRANSFERRED":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-slip-title"
        className="my-auto w-full max-w-3xl rounded-2xl bg-white text-gray-900 shadow-2xl overflow-hidden border border-gray-200"
      >
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Award className="text-emerald-400" size={18} />
            <span className="font-semibold text-sm">
              Academic Session Transcript & Progression Slip (সেশন সমাপনী ও প্রমোশন প্রতিলিপি)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Slip / প্রিন্ট</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─── Printable Document Area ─── */}
        <div ref={printRef} className="p-6 sm:p-8 space-y-6 text-sm bg-white print:p-0 print:m-0">
          {/* Institutional Header */}
          <div className="text-center border-b-2 border-emerald-900/40 pb-4 relative">
            <div className="flex items-center justify-center gap-3 mb-2">
              {siteLogo && (
                <img src={siteLogo} alt="" className="h-14 w-14 object-contain" />
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                  {siteName || "ACADEMIA HIGH SCHOOL & COLLEGE"}
                </h1>
                <p className="text-xs text-gray-600 font-medium">
                  গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত ও শিক্ষা বোর্ড নিবন্ধিত প্রতিষ্ঠান
                </p>
                <p className="text-[11px] text-gray-500">
                  Govt. Approved & Board Affiliated Educational Institution • EIIN: 134521
                </p>
              </div>
            </div>

            <div className="mt-3 inline-block px-4 py-1 rounded-full bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider shadow-xs">
              Academic Session Completion & Promotion Certificate
            </div>
            <p className="text-xs font-bold text-emerald-900 mt-1">
              শিক্ষাবর্ষ সমাপনী ও শ্রেণী প্রমোশন সনদপত্র (সেশন: {record.session_year})
            </p>
          </div>

          {/* Student & Session Identification Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-semibold">Student Name (শিক্ষার্থী)</span>
              <span className="font-bold text-gray-900 text-sm">{studentName}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-semibold">Student ID (আইডি)</span>
              <span className="font-mono font-bold text-gray-900">{record.student_id}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-semibold">Completed Session (সমাপ্ত সেশন)</span>
              <span className="font-bold text-emerald-900">{record.session_year}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-semibold">Class (শ্রেণী)</span>
              <span className="font-bold text-gray-800">{record.class_name}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-semibold">Session Roll No (রোল নম্বর)</span>
              <span className="font-bold text-gray-800">{record.roll || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-semibold">Version & Shift (ভার্সন ও শিফট)</span>
              <span className="font-semibold text-gray-800">{record.version || "Bangla"} Version • {record.shift || "Day"}</span>
            </div>
            {guardianName && (
              <div className="col-span-2">
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Guardian / Parent (অভিভাবক)</span>
                <span className="font-medium text-gray-800">{guardianName} {guardianPhone ? `(${guardianPhone})` : ""}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-semibold">Promotion Date</span>
              <span className="text-gray-700 font-mono text-[11px]">
                {new Date(record.promoted_at).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" })}
              </span>
            </div>
          </div>

          {/* Performance & Attendance 2-Column Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Academic Evaluation */}
            <div className="rounded-xl border border-slate-200 p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Award size={14} className="text-amber-500" />
                  Academic Performance (ফলাফল)
                </span>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono">Annual Exam</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100">
                  <span className="text-[10px] text-gray-500 block uppercase">GPA (জিপিএ)</span>
                  <span className="text-base font-black text-amber-700">
                    {record.gpa !== null && record.gpa !== undefined ? Number(record.gpa).toFixed(2) : "—"}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100">
                  <span className="text-[10px] text-gray-500 block uppercase">Grade (গ্রেড)</span>
                  <span className="text-base font-black text-purple-700">
                    {record.grade_letter || (record.gpa && record.gpa >= 5 ? "A+" : record.gpa && record.gpa >= 4 ? "A" : "Pass")}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-sky-50/60 border border-sky-100">
                  <span className="text-[10px] text-gray-500 block uppercase">Merit / Rank</span>
                  <span className="text-base font-black text-sky-700">
                    {record.merit_position ? `#${record.merit_position}` : "—"}
                  </span>
                </div>
              </div>
              {record.total_marks ? (
                <div className="text-[11px] text-gray-600 flex justify-between pt-1 border-t border-slate-100">
                  <span>Total Exam Marks (মোট প্রাপ্ত নম্বর):</span>
                  <strong className="text-gray-900 font-mono">{record.total_marks}</strong>
                </div>
              ) : null}
            </div>

            {/* Attendance & Session Participation */}
            <div className="rounded-xl border border-slate-200 p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Calendar size={14} className="text-teal-600" />
                  Attendance Record (উপস্থিতি)
                </span>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono">Academic Session</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-gray-500 block uppercase">Working Days</span>
                  <span className="text-sm font-bold text-gray-800">{record.attendance_total_days || 0}</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 block uppercase">Present Days</span>
                  <span className="text-sm font-bold text-emerald-800">{record.attendance_present_days || 0}</span>
                </div>
                <div className="p-2 rounded-lg bg-teal-50 border border-teal-100">
                  <span className="text-[10px] text-teal-700 block uppercase">Att. Rate</span>
                  <span className="text-sm font-bold text-teal-800">
                    {record.attendance_rate !== undefined ? `${record.attendance_rate}%` : "—"}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 italic pt-1">
                {record.attendance_rate >= 80 ? "Satisfactory attendance compliance (সন্তোষজনক উপস্থিতি)" : "Attendance records maintained as per board guidelines"}
              </p>
            </div>
          </div>

          {/* Fee & Accounts Clearance Section (Crucial Requirement) */}
          <div className="rounded-xl border-2 border-emerald-900/30 p-4 bg-emerald-50/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <Wallet size={15} className="text-emerald-700" />
                Session Accounts & Fee Clearance Record (সেশনের বেতন ও ফি ছাড়পত্র)
              </span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                record.fee_clearance_status === "CLEARED" || record.fee_due <= 0
                  ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                  : "bg-rose-100 text-rose-900 border-rose-300"
              }`}>
                {record.fee_clearance_status === "CLEARED" || record.fee_due <= 0 ? (
                  <>
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>ALL DUES CLEARED (বকেয়ামুক্ত)</span>
                  </>
                ) : (
                  <>
                    <span>OUTSTANDING DUES PENDING</span>
                  </>
                )}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center bg-white p-3 rounded-lg border border-emerald-100">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Total Session Billed (মোট ধার্যকৃত)</span>
                <span className="text-sm font-bold text-gray-900">{fmt(record.fee_billed)}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Total Paid (পরিশোধিত ফি)</span>
                <span className="text-sm font-bold text-emerald-700">{fmt(record.fee_paid)}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Balance / Due (বকেয়া)</span>
                <span className={`text-sm font-black ${record.fee_due > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                  {fmt(record.fee_due)}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-gray-500">
              * Note: All fee invoices and money receipt vouchers of session {record.session_year} are permanently archived and accessible from student and parent profiles.
            </p>
          </div>

          {/* Promotion & Re-admission Decision Box */}
          <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] text-gray-500 uppercase font-semibold block">
                  Official Academic Progression Status (প্রমোশন ও ভর্তি সিদ্ধান্ত)
                </span>
                <span className={`inline-block mt-1 px-3 py-1 rounded-md text-xs font-black uppercase tracking-wide border ${getStatusBadgeClass(record.promotion_status)}`}>
                  {statusBengali[record.promotion_status] || record.promotion_status}
                </span>
              </div>
              {record.next_class_name && (
                <div className="sm:text-right">
                  <span className="text-[11px] text-gray-500 uppercase font-semibold block">
                    Admitted to New Session & Class (নতুন সেশন ও শ্রেণী)
                  </span>
                  <span className="font-bold text-gray-900 text-sm">
                    {record.next_class_name} ({record.next_session_year || "Next Session"})
                    {record.next_roll ? ` • Roll: ${record.next_roll}` : ""}
                  </span>
                </div>
              )}
            </div>

            {record.remarks && (
              <p className="text-xs text-gray-700 bg-white p-2.5 rounded-lg border border-slate-200 mt-2 font-medium">
                <strong>Remarks (মন্তব্য):</strong> {record.remarks}
              </p>
            )}
          </div>

          {/* Official Signatures & Seal Block */}
          <div className="pt-10 grid grid-cols-3 gap-4 text-center text-xs text-gray-700">
            <div>
              <div className="border-t border-gray-400 pt-1.5 font-semibold text-gray-900">
                Class Teacher
              </div>
              <span className="text-[10px] text-gray-500">শ্রেণী শিক্ষক</span>
            </div>
            <div>
              <div className="border-t border-gray-400 pt-1.5 font-semibold text-gray-900">
                Accounts Officer
              </div>
              <span className="text-[10px] text-gray-500">হিসাব শাখা (ফি ছাড়পত্র)</span>
            </div>
            <div>
              <div className="border-t border-gray-400 pt-1.5 font-bold text-gray-900">
                Headmaster / Principal
              </div>
              <span className="text-[10px] text-gray-500">প্রধান শিক্ষক / অধ্যক্ষ</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] text-gray-400">
            <span>Generated by School Management System (Bangladesh Curriculum Standard)</span>
            <span>Document Ref: SLIP-{record.session_year.replace(/[^a-zA-Z0-9]/g, "")}-{record.student_id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionRecordSlipModal;

