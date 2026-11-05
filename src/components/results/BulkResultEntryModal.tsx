import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  LoaderCircle,
  Save,
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

  const classExams = useMemo(
    () => exams.filter((exam) => !exam.class_id || String(exam.class_id) === selectedClassId),
    [exams, selectedClassId]
  );
  const selectedExam = classExams.find((exam) => String(exam.id) === selectedExamId);
  const enteredCount = Object.values(marksMap).filter((score) => score !== "").length;

  useEffect(() => {
    if (!isOpen) return;
    if (!classes.some((item) => String(item.id) === selectedClassId)) {
      setSelectedClassId(String(classes[0]?.id ?? ""));
    }
  }, [classes, isOpen, selectedClassId]);

  useEffect(() => {
    if (!isOpen) return;
    if (!classExams.some((exam) => String(exam.id) === selectedExamId)) {
      setSelectedExamId(String(classExams[0]?.id ?? ""));
    }
  }, [classExams, isOpen, selectedExamId]);

  useEffect(() => {
    if (selectedExam?.total_marks && Number(selectedExam.total_marks) > 0) {
      setTotalMarks(Number(selectedExam.total_marks));
    }
  }, [selectedExam]);

  useEffect(() => {
    if (!isOpen || !selectedClassId) {
      setStudents([]);
      setMarksMap({});
      return;
    }

    let active = true;
    setLoadingStudents(true);
    setError(null);
    setSuccessMsg(null);

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
        if (!active) return;
        setStudents(sortedRoster);

        if (!selectedExamId) {
          setMarksMap(Object.fromEntries(sortedRoster.map((student) => [student.id, ""])));
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
        setMarksMap(Object.fromEntries(sortedRoster.map((student) => [
          student.id,
          existingByStudent.get(String(student.id)) ?? "",
        ])));
      } catch (loadError) {
        if (active) {
          setStudents([]);
          setMarksMap({});
          setError(loadError instanceof Error ? loadError.message : "Failed to load class results.");
        }
      } finally {
        if (active) setLoadingStudents(false);
      }
    };

    void loadRoster();
    return () => {
      active = false;
    };
  }, [isOpen, selectedClassId, selectedExamId]);

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
      setError("Select a class before entering results.");
      return;
    }
    if (!selectedExamId) {
      setError("Select an exam or assessment for this class.");
      return;
    }
    if (!Number.isInteger(totalMarks) || totalMarks < 1 || totalMarks > 1000) {
      setError("Full marks must be a whole number between 1 and 1000.");
      return;
    }

    const enteredResults = Object.entries(marksMap)
      .filter((entry): entry is [string, number] => typeof entry[1] === "number")
      .map(([studentId, score]) => ({
        student_id: studentId,
        score,
        total_marks: totalMarks,
      }));
    if (enteredResults.length === 0) {
      setError("Enter marks for at least one student before saving.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await api.bulkSaveResults({
        exam_id: Number(selectedExamId),
        total_marks: totalMarks,
        results: enteredResults,
      });
      if (!response.success) throw new Error(response.message || "Failed to save results.");
      setSuccessMsg(response.message || `Saved results for ${enteredResults.length} students.`);
      onSuccess?.();
      window.setTimeout(onClose, 1000);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-2 backdrop-blur-sm sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-result-title"
        className="flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:max-h-[92vh]"
      >
        <header className="flex items-start justify-between gap-3 border-b-2 border-[#006a4e] bg-slate-50 px-4 py-3 dark:bg-gray-800 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-lg bg-[#006a4e]/10 p-2 text-[#006a4e] dark:bg-emerald-950/50 dark:text-emerald-300">
              <GraduationCap size={21} />
            </div>
            <div className="min-w-0">
              <h2 id="create-result-title" className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                Create Result · ফলাফল এন্ট্রি
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Class-wise marksheet entry with Bangladesh grades and grade points.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close result entry" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-gray-700 dark:hover:text-white">
            <X size={19} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid grid-cols-1 gap-3 border-b border-slate-200 bg-[#006a4e]/5 p-4 dark:border-gray-700 dark:bg-emerald-950/10 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                <Users size={13} className="text-[#006a4e]" /> Class
              </span>
              <select
                required
                value={selectedClassId}
                onChange={(event) => setSelectedClassId(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/15 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              >
                <option value="">Select class</option>
                {classes.map((item) => <option key={item.id} value={String(item.id)}>Class {item.name}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                <ClipboardList size={13} className="text-[#006a4e]" /> Exam / Assessment
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
                <BookOpen size={13} className="text-[#006a4e]" /> Subject
              </span>
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                {selectedExam?.subject_name || "Exam subject"}
              </p>
            </div>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                <CalendarDays size={13} className="text-[#006a4e]" /> Full Marks
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

          <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">শিক্ষার্থীর নম্বরপত্র</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Enter obtained marks; grade and GPA are calculated automatically.</p>
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
                      const score = marksMap[student.id] ?? "";
                      const grade = getBangladeshGrade(score, totalMarks);
                      return (
                        <tr key={student.id} className="odd:bg-white even:bg-slate-50/70 hover:bg-emerald-50/70 dark:odd:bg-gray-900 dark:even:bg-gray-800/70 dark:hover:bg-emerald-950/20">
                          <td className="px-3 py-2.5 text-center font-bold text-slate-600 dark:text-slate-300">
                            {student.roll || index + 1}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">{student.name} {student.surname}</span>
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
                              className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-center text-sm font-bold text-slate-900 outline-none focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/15 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`inline-flex min-w-12 justify-center rounded border px-2 py-1 font-bold ${grade.color}`}>{grade.grade}</span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-slate-700 dark:text-slate-200">{grade.point}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/70 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Marks entered: <strong className="text-slate-900 dark:text-white">{enteredCount}</strong> / {students.length}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-gray-600 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || loadingStudents || students.length === 0 || !selectedExamId}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-4 py-2 text-xs font-semibold text-white hover:bg-[#00563f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Saving results..." : "Save class results"}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
};

export default BulkResultEntryModal;
