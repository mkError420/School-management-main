import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  LoaderCircle,
  Pencil,
  Save,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { api } from "@/lib/api";

interface ClassOption {
  id: number | string;
  name: string;
}

interface ExamOption {
  id: number | string;
  title: string;
  total_marks?: number;
  class_id?: number | string;
  subject_name?: string;
  date?: string;
}

interface ResultStudent {
  id: string;
  name: string;
  surname: string;
  roll?: string | number;
  username?: string;
}

interface BulkResultEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes?: ClassOption[];
  exams?: ExamOption[];
  onSuccess?: () => void;
  mode?: "create" | "update";
  editingResult?: any;
}

type GradeResult = {
  grade: string;
  point: string;
  color: string;
};

const getBangladeshGrade = (score: number | "", fullMarks: number): GradeResult => {
  if (score === "" || !Number.isFinite(Number(score)) || fullMarks <= 0) {
    return { grade: "—", point: "—", color: "text-slate-400" };
  }
  const percentage = (Number(score) / fullMarks) * 100;
  if (percentage >= 80) return { grade: "A+", point: "5.00", color: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300" };
  if (percentage >= 70) return { grade: "A", point: "4.00", color: "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300" };
  if (percentage >= 60) return { grade: "A-", point: "3.50", color: "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-300" };
  if (percentage >= 50) return { grade: "B", point: "3.00", color: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300" };
  if (percentage >= 40) return { grade: "C", point: "2.00", color: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300" };
  if (percentage >= 33) return { grade: "D", point: "1.00", color: "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-300" };
  return { grade: "F", point: "0.00", color: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300" };
};

const BulkResultEntryModal: React.FC<BulkResultEntryModalProps> = ({
  isOpen,
  onClose,
  classes = [],
  exams = [],
  onSuccess,
  mode = "create",
  editingResult = null,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [totalMarks, setTotalMarks] = useState(100);
  const [students, setStudents] = useState<ResultStudent[]>([]);
  const [marksMap, setMarksMap] = useState<Record<string, number | "">>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Breakdown Marks & Remarks for detail update
  const [cqMarks, setCqMarks] = useState<string>("");
  const [mcqMarks, setMcqMarks] = useState<string>("");
  const [practicalMarks, setPracticalMarks] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");

  // Merge classes with editingResult's class if not found
  const allClasses = useMemo(() => {
    const list = [...classes];
    if (editingResult && editingResult.class_id && !list.some((c) => String(c.id) === String(editingResult.class_id))) {
      list.unshift({
        id: editingResult.class_id,
        name: editingResult.class_name ? String(editingResult.class_name).replace(/^Class\s*/i, "") : String(editingResult.class_id),
      });
    }
    return list;
  }, [classes, editingResult]);

  // Merge exams with editingResult's exam or assignment if not found
  const classExams = useMemo(() => {
    let list = exams.filter((exam) => !exam.class_id || String(exam.class_id) === selectedClassId);
    if (editingResult && (editingResult.exam_id || editingResult.assignment_id)) {
      const matchId = String(editingResult.exam_id || editingResult.assignment_id);
      if (!list.some((e) => String(e.id) === matchId)) {
        list = [
          {
            id: matchId,
            title: editingResult.exam_title || editingResult.assignment_title || "Exam / Assessment",
            total_marks: editingResult.total_marks || 100,
            subject_name: editingResult.subject_name || "General",
            class_id: editingResult.class_id,
          },
          ...list,
        ];
      }
    }
    return list;
  }, [exams, selectedClassId, editingResult]);

  const selectedExam = classExams.find((exam) => String(exam.id) === selectedExamId);
  const enteredCount = Object.values(marksMap).filter((score) => score !== "").length;

  // Initialize form state when modal opens or editingResult changes
  useEffect(() => {
    if (!isOpen) return;

    if (mode === "update" && editingResult) {
      const targetClassId = String(editingResult.class_id || editingResult.student_class_id || "");
      const targetExamId = String(editingResult.exam_id || editingResult.assignment_id || "");
      const targetTotal = Number(editingResult.total_marks || 100);

      setSelectedClassId(targetClassId);
      setSelectedExamId(targetExamId);
      setTotalMarks(targetTotal > 0 ? targetTotal : 100);

      setCqMarks(editingResult.cq_marks !== undefined && editingResult.cq_marks !== null ? String(editingResult.cq_marks) : "");
      setMcqMarks(editingResult.mcq_marks !== undefined && editingResult.mcq_marks !== null ? String(editingResult.mcq_marks) : "");
      setPracticalMarks(editingResult.practical_marks !== undefined && editingResult.practical_marks !== null ? String(editingResult.practical_marks) : "");
      setRemarks(editingResult.remarks || "");

      if (editingResult.student_id) {
        setMarksMap((prev) => ({
          ...prev,
          [String(editingResult.student_id)]: editingResult.score !== undefined ? Number(editingResult.score) : "",
        }));
      }
      setError(null);
      setSuccessMsg(null);
    } else {
      if (!allClasses.some((item) => String(item.id) === selectedClassId)) {
        setSelectedClassId(String(allClasses[0]?.id ?? ""));
      }
      setCqMarks("");
      setMcqMarks("");
      setPracticalMarks("");
      setRemarks("");
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, mode, editingResult, allClasses]);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "create") {
      if (!classExams.some((exam) => String(exam.id) === selectedExamId)) {
        setSelectedExamId(String(classExams[0]?.id ?? ""));
      }
    }
  }, [classExams, isOpen, mode, selectedExamId]);

  useEffect(() => {
    if (selectedExam?.total_marks && Number(selectedExam.total_marks) > 0) {
      setTotalMarks(Number(selectedExam.total_marks));
    }
  }, [selectedExam]);

  // Load students and their existing marks for the selected class & exam
  useEffect(() => {
    if (!isOpen || !selectedClassId) {
      setStudents([]);
      setMarksMap({});
      return;
    }

    let active = true;
    setLoadingStudents(true);
    setError(null);

    const loadRoster = async () => {
      try {
        const studentResponse = await api.getAll("students", { class_id: selectedClassId, limit: 500 });
        if (!studentResponse.success) throw new Error(studentResponse.message || "Failed to load class students.");
        const roster = (studentResponse.data?.students || []) as ResultStudent[];
        const sortedRoster = [...roster].sort((a, b) => {
          const aRoll = String(a.roll ?? "");
          const bRoll = String(b.roll ?? "");
          const numericOrder = Number(aRoll) - Number(bRoll);
          return Number.isFinite(numericOrder) && numericOrder !== 0
            ? numericOrder
            : aRoll.localeCompare(bRoll, undefined, { numeric: true }) || a.name.localeCompare(b.name);
        });

        // Ensure editing student is in the roster if in update mode
        if (editingResult && editingResult.student_id && !sortedRoster.some((s) => String(s.id) === String(editingResult.student_id))) {
          sortedRoster.unshift({
            id: String(editingResult.student_id),
            name: editingResult.student_name || "Student",
            surname: editingResult.student_surname || "",
            roll: editingResult.student_roll || "—",
          });
        }

        if (!active) return;
        setStudents(sortedRoster);

        if (!selectedExamId) {
          const defaultMap: Record<string, number | ""> = {};
          sortedRoster.forEach((student) => {
            if (editingResult && String(student.id) === String(editingResult.student_id)) {
              defaultMap[student.id] = Number(editingResult.score);
            } else {
              defaultMap[student.id] = "";
            }
          });
          setMarksMap(defaultMap);
          return;
        }

        const resultResponse = await api.getAll("results", {
          class_id: selectedClassId,
          exam_id: selectedExamId,
          limit: 500,
        });
        if (!resultResponse.success) throw new Error(resultResponse.message || "Failed to load saved marks.");
        if (!active) return;

        const existingByStudent = new Map<string, number>();
        (resultResponse.data?.results || []).forEach((result: { student_id: string; score: number }) => {
          existingByStudent.set(String(result.student_id), Number(result.score));
        });

        const initialMarks: Record<string, number | ""> = {};
        sortedRoster.forEach((student) => {
          if (editingResult && String(student.id) === String(editingResult.student_id)) {
            initialMarks[student.id] = existingByStudent.get(String(student.id)) ?? Number(editingResult.score);
          } else {
            initialMarks[student.id] = existingByStudent.get(String(student.id)) ?? "";
          }
        });
        setMarksMap(initialMarks);
      } catch (loadError) {
        if (active) {
          if (editingResult) {
            // Fallback for single student update if roster load fails
            setStudents([
              {
                id: String(editingResult.student_id),
                name: editingResult.student_name || "Student",
                surname: editingResult.student_surname || "",
                roll: editingResult.student_roll || "—",
              },
            ]);
            setMarksMap({ [String(editingResult.student_id)]: Number(editingResult.score) });
          } else {
            setStudents([]);
            setMarksMap({});
            setError(loadError instanceof Error ? loadError.message : "Failed to load class results.");
          }
        }
      } finally {
        if (active) setLoadingStudents(false);
      }
    };

    void loadRoster();
    return () => {
      active = false;
    };
  }, [isOpen, selectedClassId, selectedExamId, editingResult]);

  if (!isOpen) return null;

  const handleScoreChange = (studentId: string, value: string) => {
    if (value === "") {
      setMarksMap((previous) => ({ ...previous, [studentId]: "" }));
      return;
    }
    const parsedScore = Number(value);
    if (!Number.isFinite(parsedScore)) return;
    const safeScore = Math.max(0, Math.min(totalMarks, Math.trunc(parsedScore)));
    setMarksMap((previous) => ({ ...previous, [studentId]: safeScore }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedClassId) {
      setError("শ্রেণি নির্বাচন করুন (Select a class before entering results).");
      return;
    }
    if (!selectedExamId) {
      setError("পরীক্ষা অথবা মূল্যায়ন নির্বাচন করুন (Select an exam or assessment).");
      return;
    }
    if (!Number.isInteger(totalMarks) || totalMarks < 1 || totalMarks > 1000) {
      setError("মোট নম্বর ১ থেকে ১০০০ এর মধ্যে হতে হবে (Full marks must be between 1 and 1000).");
      return;
    }

    const enteredResults = Object.entries(marksMap)
      .filter((entry): entry is [string, number] => typeof entry[1] === "number")
      .map(([studentId, score]) => ({
        student_id: studentId,
        score,
        total_marks: totalMarks,
      }));

    if (enteredResults.length === 0 && (!editingResult || marksMap[editingResult.student_id] === "")) {
      setError("কমপক্ষে একজন শিক্ষার্থীর নম্বর প্রদান করুন (Enter marks for at least one student).");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === "update" && editingResult?.id) {
        // Individual result update with full Bangladesh fields
        const activeScore = typeof marksMap[editingResult.student_id] === "number"
          ? marksMap[editingResult.student_id]
          : Number(editingResult.score);

        const updatePayload: Record<string, any> = {
          score: activeScore,
          total_marks: totalMarks,
          student_id: editingResult.student_id,
        };

        if (selectedExamId) {
          if (editingResult.assignment_id && !editingResult.exam_id) {
            updatePayload.assignment_id = Number(selectedExamId);
          } else {
            updatePayload.exam_id = Number(selectedExamId);
          }
        }
        if (cqMarks !== "") updatePayload.cq_marks = Number(cqMarks);
        if (mcqMarks !== "") updatePayload.mcq_marks = Number(mcqMarks);
        if (practicalMarks !== "") updatePayload.practical_marks = Number(practicalMarks);
        if (remarks) updatePayload.remarks = remarks;

        const updateRes = await api.update("results", editingResult.id, updatePayload);
        if (!updateRes.success) throw new Error(updateRes.message || "ফলাফল আপডেট ব্যর্থ হয়েছে (Failed to update result).");

        // If additional students in the roster were also edited, persist them via bulk save
        if (enteredResults.length > 1 && selectedExamId) {
          try {
            await api.bulkSaveResults({
              exam_id: Number(selectedExamId),
              total_marks: totalMarks,
              results: enteredResults,
            });
          } catch (bulkErr) {
            console.warn("Secondary class marksheet bulk save warning:", bulkErr);
          }
        }

        setSuccessMsg(updateRes.message || "ফলাফল সফলভাবে আপডেট ও সংরক্ষণ করা হয়েছে! (Result updated successfully)");
        onSuccess?.();
        window.setTimeout(onClose, 900);
      } else {
        // Create / Bulk Save
        const response = await api.bulkSaveResults({
          exam_id: Number(selectedExamId),
          total_marks: totalMarks,
          results: enteredResults,
        });
        if (!response.success) throw new Error(response.message || "ফলাফল সংরক্ষণ ব্যর্থ হয়েছে (Failed to save results).");
        setSuccessMsg(response.message || `সফলভাবে ${enteredResults.length} জন শিক্ষার্থীর ফলাফল সংরক্ষিত হয়েছে।`);
        onSuccess?.();
        window.setTimeout(onClose, 900);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "সংরক্ষণ করার সময় ত্রুটি ঘটেছে (An unexpected error occurred).");
    } finally {
      setSaving(false);
    }
  };

  const isUpdateMode = mode === "update";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-2 backdrop-blur-sm sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-result-title"
        className="flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:max-h-[92vh]"
      >
        {/* ========================================================= */}
        {/* MODAL HEADER (Exact Same Styling for Create & Update)      */}
        {/* ========================================================= */}
        <header className="flex items-start justify-between gap-3 border-b-2 border-[#006a4e] bg-slate-50 px-4 py-3 dark:bg-gray-800 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-lg bg-[#006a4e]/10 p-2 text-[#006a4e] dark:bg-emerald-950/50 dark:text-emerald-300">
              <GraduationCap size={21} />
            </div>
            <div className="min-w-0">
              <h2 id="create-result-title" className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                {isUpdateMode ? "Update Result · ফলাফল সংশোধন ও আপডেট" : "Create Result · ফলাফল এন্ট্রি"}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {isUpdateMode
                  ? "Class marksheet & student result update with Bangladesh grades and grade points."
                  : "Class-wise marksheet entry with Bangladesh grades and grade points."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close result modal"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-gray-700 dark:hover:text-white cursor-pointer"
          >
            <X size={19} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* ========================================================= */}
          {/* TOP CONTROLS BAR: Class, Exam, Subject, Full Marks        */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 gap-3 border-b border-slate-200 bg-[#006a4e]/5 p-4 dark:border-gray-700 dark:bg-emerald-950/10 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                <Users size={13} className="text-[#006a4e]" /> Class (শ্রেণি)
              </span>
              <select
                required
                value={selectedClassId}
                onChange={(event) => setSelectedClassId(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/15 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              >
                <option value="">Select class</option>
                {allClasses.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    Class {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                <ClipboardList size={13} className="text-[#006a4e]" /> Exam / Assessment (পরীক্ষা)
              </span>
              <select
                required
                value={selectedExamId}
                onChange={(event) => setSelectedExamId(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/15 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              >
                <option value="">Select exam</option>
                {classExams.map((exam) => (
                  <option key={exam.id} value={String(exam.id)}>
                    {exam.title}{exam.subject_name ? ` · ${exam.subject_name}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
              <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                <BookOpen size={13} className="text-[#006a4e]" /> Subject (বিষয়)
              </span>
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                {selectedExam?.subject_name || editingResult?.subject_name || "Exam subject"}
              </p>
            </div>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                <CalendarDays size={13} className="text-[#006a4e]" /> Full Marks (পূর্ণমান)
              </span>
              <input
                type="number"
                required
                min={1}
                max={1000}
                step={1}
                value={totalMarks}
                onChange={(event) => setTotalMarks(Number(event.target.value))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/15 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </label>
          </div>

          {/* ========================================================= */}
          {/* ALERTS (Error & Success Messages)                         */}
          {/* ========================================================= */}
          {error && (
            <div role="alert" className="mx-4 mt-3 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300 sm:mx-6">
              <AlertCircle size={15} className="mt-0.5 shrink-0" /> <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div role="status" className="mx-4 mt-3 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300 sm:mx-6">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> <span>{successMsg}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* SPOTLIGHT CARD: EDITING STUDENT (In Update Mode)          */}
          {/* ========================================================= */}
          {isUpdateMode && editingResult && (
            <div className="mx-4 mt-3 rounded-lg border border-[#006a4e]/30 bg-emerald-50/60 p-3.5 dark:border-emerald-800/40 dark:bg-emerald-950/20 sm:mx-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100/80 pb-2.5 dark:border-emerald-900/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#006a4e] text-sm font-bold text-white shadow-xs overflow-hidden shrink-0">
                    {editingResult.student_img ? (
                      <img src={editingResult.student_img} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span>{(editingResult.student_name?.[0] || "S").toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {editingResult.student_name} {editingResult.student_surname}
                      </h4>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center gap-1">
                        <Pencil size={10} />
                        <span>সম্পাদনাধীন শিক্ষার্থী · Selected Student</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      রোল: <strong className="text-slate-900 dark:text-slate-100">{editingResult.student_roll || "—"}</strong> · 
                      শ্রেণি: <strong className="text-slate-900 dark:text-slate-100">{editingResult.class_name || "General"}</strong> · 
                      শিক্ষার্থী আইডি: <span className="font-mono text-slate-500">{editingResult.student_id}</span>
                    </p>
                  </div>
                </div>

                {/* Live Calculated Bangladesh Grade for Active Student */}
                {(() => {
                  const activeScore = marksMap[editingResult.student_id] !== undefined
                    ? marksMap[editingResult.student_id]
                    : editingResult.score;
                  const activeGrade = getBangladeshGrade(activeScore, totalMarks);
                  const pct = activeScore !== "" && Number.isFinite(Number(activeScore)) && totalMarks > 0
                    ? Math.round((Number(activeScore) / totalMarks) * 100)
                    : 0;
                  return (
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                          গ্রেড ও জিপিএ
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {pct}% নম্বর
                        </span>
                      </div>
                      <div className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 ${activeGrade.color}`}>
                        <span className="text-sm font-black">{activeGrade.grade}</span>
                        <span className="text-xs font-bold">({activeGrade.point})</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Marks Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    মোট প্রাপ্ত নম্বর (Score) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={totalMarks}
                    required
                    value={marksMap[editingResult.student_id] ?? ""}
                    onChange={(e) => handleScoreChange(editingResult.student_id, e.target.value)}
                    placeholder="নম্বর লিখুন"
                    className="w-full rounded-md border border-emerald-300 bg-white px-2.5 py-1.5 text-center text-sm font-black text-slate-900 focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/20 dark:border-emerald-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    রচনামূলক (CQ Marks)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={totalMarks}
                    placeholder="ঐচ্ছিক"
                    value={cqMarks}
                    onChange={(e) => setCqMarks(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-center text-sm font-semibold text-slate-800 focus:border-[#006a4e] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    নৈর্ব্যক্তিক (MCQ Marks)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={totalMarks}
                    placeholder="ঐচ্ছিক"
                    value={mcqMarks}
                    onChange={(e) => setMcqMarks(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-center text-sm font-semibold text-slate-800 focus:border-[#006a4e] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    ব্যবহারিক (Practical)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={totalMarks}
                    placeholder="ঐচ্ছিক"
                    value={practicalMarks}
                    onChange={(e) => setPracticalMarks(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-center text-sm font-semibold text-slate-800 focus:border-[#006a4e] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Remarks Field */}
              <div className="pt-2">
                <input
                  type="text"
                  placeholder="শিক্ষকের মন্তব্য (Remarks / Feedback, e.g. চমৎকার ফলাফল, নিয়মিত উপস্থিতি প্রয়োজন)..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:border-[#006a4e] dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200"
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STUDENT MARKS TABLE                                       */}
          {/* ========================================================= */}
          <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>শিক্ষার্থীর নম্বরপত্র ও ফলাফল খাতা</span>
                  {isUpdateMode && (
                    <span className="text-[11px] font-normal text-emerald-700 dark:text-emerald-400">
                      (Class Marksheet)
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Enter obtained marks; Bangladesh grade and GPA are calculated automatically.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-300">
                {students.length} students
              </span>
            </div>

            {loadingStudents ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-2 text-sm text-slate-500">
                <LoaderCircle size={24} className="animate-spin text-[#006a4e]" />
                Loading class result register...
              </div>
            ) : !selectedClassId ? (
              <div className="rounded-md border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500 dark:border-gray-700">
                Select a class to load its students.
              </div>
            ) : students.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500 dark:border-gray-700">
                No students are enrolled in this class.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border border-slate-300 dark:border-gray-700">
                <table className="w-full min-w-[690px] border-collapse text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-slate-200">
                    <tr className="border-b border-slate-300 dark:border-gray-700">
                      <th className="w-16 px-3 py-3 text-center">Roll</th>
                      <th className="px-3 py-3">Student name</th>
                      <th className="w-36 px-3 py-3 text-center">Marks / {totalMarks}</th>
                      <th className="w-24 px-3 py-3 text-center">Grade</th>
                      <th className="w-24 px-3 py-3 text-center">GPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                    {students.map((student, index) => {
                      const isTarget = isUpdateMode && editingResult && String(student.id) === String(editingResult.student_id);
                      const score = marksMap[student.id] ?? "";
                      const grade = getBangladeshGrade(score, totalMarks);

                      return (
                        <tr
                          key={student.id}
                          className={`transition ${
                            isTarget
                              ? "bg-emerald-50/90 font-semibold text-slate-900 ring-1 ring-inset ring-[#006a4e]/40 dark:bg-emerald-950/40"
                              : "odd:bg-white even:bg-slate-50/70 hover:bg-emerald-50/50 dark:odd:bg-gray-900 dark:even:bg-gray-800/70 dark:hover:bg-emerald-950/20"
                          }`}
                        >
                          <td className="px-3 py-2.5 text-center font-bold text-slate-600 dark:text-slate-300">
                            {student.roll || index + 1}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800 dark:text-slate-100">
                                {student.name} {student.surname}
                              </span>
                              {isTarget && (
                                <span className="rounded bg-[#006a4e] px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
                                  সম্পাদনাধীন
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              aria-label={`Marks for ${student.name} ${student.surname}`}
                              type="number"
                              min={0}
                              max={totalMarks}
                              step={1}
                              placeholder="—"
                              value={score}
                              onChange={(event) => handleScoreChange(student.id, event.target.value)}
                              className={`w-24 rounded-md border px-2 py-1.5 text-center text-sm font-bold outline-none focus:ring-2 focus:ring-[#006a4e]/15 ${
                                isTarget
                                  ? "border-emerald-500 bg-white text-[#006a4e] ring-1 ring-emerald-400 dark:bg-gray-900 dark:text-emerald-300"
                                  : "border-slate-300 bg-white text-slate-900 focus:border-[#006a4e] dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                              }`}
                            />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`inline-flex min-w-12 justify-center rounded border px-2 py-1 font-bold ${grade.color}`}>
                              {grade.grade}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-slate-700 dark:text-slate-200">
                            {grade.point}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* MODAL FOOTER                                              */}
          {/* ========================================================= */}
          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/70 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Marks entered: <strong className="text-slate-900 dark:text-white">{enteredCount}</strong> / {students.length}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-gray-600 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-700 cursor-pointer"
              >
                Cancel (বাতিল)
              </button>
              <button
                type="submit"
                disabled={saving || loadingStudents || students.length === 0 || !selectedExamId}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-4 py-2 text-xs font-semibold text-white hover:bg-[#00563f] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {saving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
                {saving
                  ? (isUpdateMode ? "Updating result..." : "Saving results...")
                  : (isUpdateMode ? "Update Result · ফলাফল সংরক্ষণ করুন" : "Save class results")}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
};

export default BulkResultEntryModal;
