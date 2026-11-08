import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  Sparkles,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Coins,
} from "lucide-react";
import { api } from "@/lib/api";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { PromotionStatus } from "@/types/promotion";

interface StudentBasic {
  id: string;
  name: string;
  surname?: string;
  roll?: string;
  class_id?: number | string;
  class_name?: string;
  session_year?: string;
  version?: string;
}

interface StudentPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  singleStudent?: StudentBasic | null;
}

interface ClassOption {
  id: number;
  name: string;
  capacity?: number;
}

export const StudentPromotionModal: React.FC<StudentPromotionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  singleStudent = null,
}) => {
  const { currencySymbol: cs } = useSiteSettings();

  // Mode: "SINGLE" or "BATCH"
  const isSingle = Boolean(singleStudent);

  // Form states
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sourceClassId, setSourceClassId] = useState<string>("");
  const [targetClassId, setTargetClassId] = useState<string>("");
  const [completedSession, setCompletedSession] = useState<string>(
    singleStudent?.session_year || "2026-2027"
  );
  const [targetSession, setTargetSession] = useState<string>("2027");

  // Single student fields
  const [singleTargetRoll, setSingleTargetRoll] = useState<string>("");
  const [singleStatus, setSingleStatus] = useState<PromotionStatus>("PROMOTED");
  const [singleGpa, setSingleGpa] = useState<string>("");
  const [singleRemarks, setSingleRemarks] = useState<string>("");

  // Batch students list
  const [classStudents, setClassStudents] = useState<StudentBasic[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Record<string, boolean>>({});
  const [customRolls, setCustomRolls] = useState<Record<string, string>>({});
  const [customStatuses, setCustomStatuses] = useState<Record<string, PromotionStatus>>({});

  // Session Re-Admission Fee Option
  const [createSessionFee, setCreateSessionFee] = useState<boolean>(true);
  const [sessionFeeAmount, setSessionFeeAmount] = useState<number>(2000);
  const [sessionFeeTitle, setSessionFeeTitle] = useState<string>(
    "Annual Session Charge & Re-Admission Fee (সেশন ফি ও পুনর্ভর্তি) - 2027"
  );

  // Processing states
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load classes
  useEffect(() => {
    if (!isOpen) return;
    setLoadingClasses(true);
    api
      .getAll<{ classes?: ClassOption[] }>("classes", { limit: 100 })
      .then((res) => {
        const clsList =
          res.data?.classes ||
          (Array.isArray(res.data) ? res.data : []) ||
          [];
        setClasses(clsList);

        if (singleStudent && singleStudent.class_id) {
          setSourceClassId(String(singleStudent.class_id));
          // Try to default targetClass to next class if available
          const currIdx = clsList.findIndex((c) => String(c.id) === String(singleStudent.class_id));
          if (currIdx >= 0 && currIdx + 1 < clsList.length) {
            setTargetClassId(String(clsList[currIdx + 1].id));
          } else if (clsList.length > 0) {
            setTargetClassId(String(clsList[0].id));
          }
        } else if (clsList.length > 0) {
          setSourceClassId(String(clsList[0].id));
          if (clsList.length > 1) {
            setTargetClassId(String(clsList[1].id));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingClasses(false));
  }, [isOpen, singleStudent]);

  // If single student, initialize default fields
  useEffect(() => {
    if (singleStudent) {
      setCompletedSession(singleStudent.session_year || "2026-2027");
      setSingleTargetRoll(singleStudent.roll || "01");
      setSingleRemarks(
        `Promoted from ${singleStudent.class_name || "previous class"} to next session`
      );
    }
  }, [singleStudent]);

  // Update session fee title when target session changes
  useEffect(() => {
    setSessionFeeTitle(
      `Annual Session Charge & Re-Admission Fee (সেশন ফি ও পুনর্ভর্তি) - ${targetSession}`
    );
  }, [targetSession]);

  // Load students for source class when in batch mode
  useEffect(() => {
    if (!isOpen || isSingle || !sourceClassId) return;
    setLoadingStudents(true);
    api
      .getAll<{ students?: StudentBasic[] }>("students", {
        class_id: sourceClassId,
        limit: 1000,
      })
      .then((res) => {
        const list = res.data?.students || (Array.isArray(res.data) ? res.data : []) || [];
        setClassStudents(list);

        // Select all by default and prepare rolls
        const sel: Record<string, boolean> = {};
        const rolls: Record<string, string> = {};
        const stats: Record<string, PromotionStatus> = {};

        list.forEach((st, idx) => {
          sel[st.id] = true;
          rolls[st.id] = st.roll || String(idx + 1).padStart(2, "0");
          stats[st.id] = "PROMOTED";
        });

        setSelectedStudentIds(sel);
        setCustomRolls(rolls);
        setCustomStatuses(stats);
      })
      .catch(() => {})
      .finally(() => setLoadingStudents(false));
  }, [isOpen, isSingle, sourceClassId]);

  if (!isOpen) return null;

  const toggleSelectAll = (checked: boolean) => {
    const sel: Record<string, boolean> = {};
    classStudents.forEach((st) => {
      sel[st.id] = checked;
    });
    setSelectedStudentIds(sel);
  };

  const selectedCount = Object.values(selectedStudentIds).filter(Boolean).length;

  const handleRollChange = (id: string, roll: string) => {
    setCustomRolls((prev) => ({ ...prev, [id]: roll }));
  };

  const handleStatusChange = (id: string, status: PromotionStatus) => {
    setCustomStatuses((prev) => ({ ...prev, [id]: status }));
  };

  // Auto assign sequential rolls (1 to N)
  const autoAssignRolls = () => {
    const rolls: Record<string, string> = {};
    let rollCounter = 1;
    classStudents.forEach((st) => {
      if (selectedStudentIds[st.id]) {
        rolls[st.id] = String(rollCounter++).padStart(2, "0");
      } else {
        rolls[st.id] = st.roll || "";
      }
    });
    setCustomRolls((prev) => ({ ...prev, ...rolls }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (isSingle && singleStudent) {
        const payload = {
          student_id: singleStudent.id,
          completed_session: completedSession.trim(),
          target_session: targetSession.trim(),
          target_class_id: targetClassId ? Number(targetClassId) : undefined,
          target_roll: singleTargetRoll.trim(),
          promotion_status: singleStatus,
          gpa: singleGpa ? Number(singleGpa) : null,
          remarks: singleRemarks.trim(),
          create_session_fee: createSessionFee,
          session_fee_amount: sessionFeeAmount,
          session_fee_title: sessionFeeTitle,
        };

        const res = await api.promoteStudents(payload);
        if (res.success) {
          setSuccessMsg("শিক্ষার্থী সফলভাবে পরবর্তী সেশন ও শ্রেণীতে উত্তীর্ণ / ভর্তি সম্পন্ন হয়েছে!");
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1200);
        } else {
          setErrorMsg(res.message || "Failed to promote student. Check details.");
        }
      } else {
        // Batch promotion
        const selectedList = classStudents.filter((st) => selectedStudentIds[st.id]);
        if (selectedList.length === 0) {
          setErrorMsg("Please select at least one student to promote.");
          setSubmitting(false);
          return;
        }

        const studentsPayload = selectedList.map((st) => ({
          student_id: st.id,
          completed_session: completedSession.trim(),
          target_session: targetSession.trim(),
          target_class_id: targetClassId ? Number(targetClassId) : undefined,
          target_roll: customRolls[st.id] || st.roll,
          promotion_status: customStatuses[st.id] || "PROMOTED",
        }));

        const payload = {
          students: studentsPayload,
          completed_session: completedSession.trim(),
          target_session: targetSession.trim(),
          target_class_id: targetClassId ? Number(targetClassId) : undefined,
          create_session_fee: createSessionFee,
          session_fee_amount: sessionFeeAmount,
          session_fee_title: sessionFeeTitle,
        };

        const res = await api.promoteStudents(payload);
        if (res.success) {
          setSuccessMsg(
            `সফলভাবে ${res.data?.promoted_count || selectedList.length} জন শিক্ষার্থীর সেশন প্রমোশন সম্পন্ন হয়েছে!`
          );
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1400);
        } else {
          setErrorMsg(res.message || "Batch promotion failed. Please check entries.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error while processing promotion.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="promotion-modal-title"
        className="my-auto w-full max-w-4xl rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <GraduationCap size={22} className="text-emerald-300" />
            </div>
            <div>
              <h2 id="promotion-modal-title" className="text-base sm:text-lg font-bold">
                {isSingle
                  ? "Student Session Progression & Re-Admission"
                  : "Batch Student Promotion & Session Admission"}
              </h2>
              <p className="text-xs text-emerald-200/80">
                {isSingle
                  ? `Promote ${singleStudent?.name} ${singleStudent?.surname || ""} to new academic session & class`
                  : "শিক্ষাবর্ষ পরিবর্তন, ক্লাস প্রমোশন ও পুনর্ভর্তি (বাংলাদেশ শিক্ষা বোর্ড মানসম্মত)"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Messages */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={16} className="shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* ── Section 1: Academic Sessions & Classes Setup ── */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/60 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Calendar size={15} className="text-emerald-600" />
                Session & Class Progression Details (সেশন ও শ্রেণী নির্বাচন)
              </span>
              <span className="text-[11px] text-gray-500">All previous session records are permanently saved</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Completed Session */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Completed Session (সমাপ্ত সেশন) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={completedSession}
                  onChange={(e) => setCompletedSession(e.target.value)}
                  placeholder="e.g. 2026-2027 or 2026"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                />
              </div>

              {/* Target / New Session */}
              <div>
                <label className="block font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                  Target Session (নতুন শিক্ষাবর্ষ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={targetSession}
                  onChange={(e) => setTargetSession(e.target.value)}
                  placeholder="e.g. 2027 or 2027-2028"
                  className="w-full px-3 py-2 rounded-lg border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                />
              </div>

              {/* Source Class (Batch mode) or Current Class */}
              {!isSingle ? (
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Current Class (বর্তমান শ্রেণী) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={sourceClassId}
                    onChange={(e) => setSourceClassId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Current Class (বর্তমান শ্রেণী)
                  </label>
                  <div className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold">
                    {singleStudent?.class_name || "Class"} (Roll: {singleStudent?.roll || "—"})
                  </div>
                </div>
              )}

              {/* Target Class */}
              <div>
                <label className="block font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                  Target Class (উত্তীর্ণ শ্রেণী) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                >
                  <option value="">Select target class...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Section 2: Single Student Custom Inputs (If in Single Mode) ── */}
          {isSingle && singleStudent && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
              <span className="font-bold text-gray-800 dark:text-gray-100 block pb-1 border-b border-gray-100 dark:border-gray-800">
                Student Promotion Settings (শিক্ষার্থীর রোল ও রেজাল্ট)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Roll No. (নতুন রোল নম্বর) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={singleTargetRoll}
                    onChange={(e) => setSingleTargetRoll(e.target.value)}
                    placeholder="e.g. 01"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Promotion Status (প্রমোশনের ধরন)
                  </label>
                  <select
                    value={singleStatus}
                    onChange={(e) => setSingleStatus(e.target.value as PromotionStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold"
                  >
                    <option value="PROMOTED">Promoted (পরবর্তী ক্লাসে উত্তীর্ণ)</option>
                    <option value="RETAINED">Retained (একই ক্লাসে বহাল)</option>
                    <option value="PASSED_OUT">Passed Out / Graduated (এসএসসি/এইচএসসি সমাপনী)</option>
                    <option value="TRANSFERRED">Transferred / TC (ছাড়পত্র প্রাপ্ত)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Final GPA / Grade (জিপিএ)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={singleGpa}
                    onChange={(e) => setSingleGpa(e.target.value)}
                    placeholder="e.g. 5.00 (Leave blank to auto-calculate)"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Promotion Remarks / Notes (মন্তব্য)
                  </label>
                  <input
                    type="text"
                    value={singleRemarks}
                    onChange={(e) => setSingleRemarks(e.target.value)}
                    placeholder="e.g. Promoted to Class 7 with excellence in annual evaluation"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Section 3: Batch Students Table (If in Batch Mode) ── */}
          {!isSingle && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden space-y-2">
              <div className="flex flex-wrap items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 gap-2">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-emerald-600" />
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    Students of Selected Class ({classStudents.length})
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                    {selectedCount} Selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={autoAssignRolls}
                    className="px-2.5 py-1 rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 text-[11px] font-medium transition cursor-pointer"
                  >
                    Auto Assign 1..N Rolls
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(selectedCount !== classStudents.length)}
                    className="px-2.5 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-semibold transition cursor-pointer"
                  >
                    {selectedCount === classStudents.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
              </div>

              {loadingStudents ? (
                <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
                  <RefreshCw size={16} className="animate-spin text-emerald-600" />
                  <span>Loading class students...</span>
                </div>
              ) : classStudents.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No students found in this class. Please select another class.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-[11px] text-gray-600 dark:text-gray-400 sticky top-0">
                      <tr>
                        <th className="p-2 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedCount === classStudents.length && classStudents.length > 0}
                            onChange={(e) => toggleSelectAll(e.target.checked)}
                          />
                        </th>
                        <th className="p-2">Student</th>
                        <th className="p-2 w-24">Current Roll</th>
                        <th className="p-2 w-28">New Roll</th>
                        <th className="p-2 w-36">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {classStudents.map((st) => {
                        const isChecked = Boolean(selectedStudentIds[st.id]);
                        return (
                          <tr
                            key={st.id}
                            className={`hover:bg-emerald-50/40 dark:hover:bg-gray-800/40 transition ${
                              isChecked ? "" : "opacity-50"
                            }`}
                          >
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) =>
                                  setSelectedStudentIds((prev) => ({
                                    ...prev,
                                    [st.id]: e.target.checked,
                                  }))
                                }
                              />
                            </td>
                            <td className="p-2">
                              <span className="font-semibold text-gray-800 dark:text-gray-200 block">
                                {st.name} {st.surname || ""}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                ID: {st.id} • {st.version || "Bangla"}
                              </span>
                            </td>
                            <td className="p-2 font-mono text-gray-500">{st.roll || "—"}</td>
                            <td className="p-2">
                              <input
                                type="text"
                                disabled={!isChecked}
                                value={customRolls[st.id] || ""}
                                onChange={(e) => handleRollChange(st.id, e.target.value)}
                                className="w-20 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono font-bold text-center"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                disabled={!isChecked}
                                value={customStatuses[st.id] || "PROMOTED"}
                                onChange={(e) =>
                                  handleStatusChange(st.id, e.target.value as PromotionStatus)
                                }
                                className="w-32 px-1.5 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-medium text-[11px]"
                              >
                                <option value="PROMOTED">Promoted</option>
                                <option value="RETAINED">Retained</option>
                                <option value="PASSED_OUT">Graduated</option>
                                <option value="TRANSFERRED">Transferred</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Section 4: Annual Session Fee / Re-Admission Invoice Generation ── */}
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-950 dark:text-emerald-300">
                <input
                  type="checkbox"
                  checked={createSessionFee}
                  onChange={(e) => setCreateSessionFee(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <Coins size={16} className="text-emerald-600" />
                <span>
                  Generate New Session Re-Admission Fee Voucher (পুনর্ভর্তি ও সেশন ফি ইনভয়েস তৈরি করুন)
                </span>
              </label>
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                Recommended for Bangladesh Schools
              </span>
            </div>

            {createSessionFee && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">
                    Session Fee Amount (সেশন ফি পরিমাণ)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 font-bold">{cs}</span>
                    <input
                      type="number"
                      required={createSessionFee}
                      min="0"
                      value={sessionFeeAmount}
                      onChange={(e) => setSessionFeeAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">
                    Fee Invoice Title (চালান শিরোনাম)
                  </label>
                  <input
                    type="text"
                    required={createSessionFee}
                    value={sessionFeeTitle}
                    onChange={(e) => setSessionFeeTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
            <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">
              * The student's past session billing records and payment slips remain completely untouched in their profile, while this creates an initial invoice for the new academic session.
            </p>
          </div>

          {/* ── Section 5: Historical Preservation Notice ── */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-3.5 flex items-start gap-2.5">
            <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed">
              <strong>Complete Historical Preservation:</strong> Upon promotion, the system permanently records the student's completed session attendance, examination GPA, and fee clearance status in their immutable academic history. Both students and parents will be able to view and print all past session records and money receipts anytime.
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-gray-700 dark:text-gray-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold shadow-md shadow-emerald-700/20 transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Processing Promotion...</span>
                </>
              ) : (
                <>
                  <FileCheck size={15} />
                  <span>
                    {isSingle
                      ? "Confirm Promotion & Admission"
                      : `Promote ${selectedCount} Student${selectedCount === 1 ? "" : "s"}`}
                  </span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentPromotionModal;

