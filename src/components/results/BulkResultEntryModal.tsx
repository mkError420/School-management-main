import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface BulkResultEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes?: Array<{ id: number | string; name: string }>;
  exams?: Array<{ id: number | string; title: string; total_marks?: number; class_id?: number | string }>;
  onSuccess?: () => void;
}

export const BulkResultEntryModal: React.FC<BulkResultEntryModalProps> = ({
  isOpen,
  onClose,
  classes = [],
  exams = [],
  onSuccess,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<number | string>(classes[0]?.id || "");
  const [selectedExamId, setSelectedExamId] = useState<number | string>(exams[0]?.id || "");
  const [totalMarks, setTotalMarks] = useState<number>(100);
  const [students, setStudents] = useState<Array<any>>([]);
  const [marksMap, setMarksMap] = useState<Record<string, number | "">>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Set initial selections
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
    if (exams.length > 0 && !selectedExamId) {
      setSelectedExamId(exams[0].id);
    }
  }, [classes, exams]);

  // Adjust total marks when exam changes
  useEffect(() => {
    const examObj = exams.find((e) => String(e.id) === String(selectedExamId));
    if (examObj && examObj.total_marks) {
      setTotalMarks(Number(examObj.total_marks));
    }
  }, [selectedExamId, exams]);

  // Fetch students of the selected class
  useEffect(() => {
    if (!isOpen || !selectedClassId) return;

    let active = true;
    setLoadingStudents(true);
    setError(null);
    setSuccessMsg(null);

    const loadData = async () => {
      try {
        // 1. Fetch students in the class
        const studRes = await api.getAll("students", { class_id: selectedClassId, limit: 200 });
        if (!active) return;
        const studentList = studRes.data?.students || [];
        setStudents(studentList);

        // 2. Fetch existing results for this exam to prefill marks
        if (selectedExamId) {
          const resRes = await api.getAll("results", { class_id: selectedClassId, exam_id: selectedExamId, limit: 300 });
          if (!active) return;
          const existingResults = resRes.data?.results || [];
          const initialMap: Record<string, number | ""> = {};
          studentList.forEach((st: any) => {
            const found = existingResults.find((r: any) => String(r.student_id) === String(st.id));
            initialMap[st.id] = found ? Number(found.score) : "";
          });
          setMarksMap(initialMap);
        } else {
          const emptyMap: Record<string, number | ""> = {};
          studentList.forEach((st: any) => {
            emptyMap[st.id] = "";
          });
          setMarksMap(emptyMap);
        }
      } catch (err: any) {
        if (active) setError(err?.message || "Failed to load class students.");
      } finally {
        if (active) setLoadingStudents(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [isOpen, selectedClassId, selectedExamId]);

  if (!isOpen) return null;

  const calculateBdGrade = (score: number | "", full: number) => {
    if (score === "" || isNaN(Number(score))) return { grade: "—", gp: "—", color: "text-gray-400" };
    const pct = (Number(score) / (full || 100)) * 100;
    if (pct >= 80) return { grade: "A+", gp: "5.00", color: "text-emerald-700 bg-emerald-50 border-emerald-300 font-bold" };
    if (pct >= 70) return { grade: "A",  gp: "4.00", color: "text-green-700 bg-green-50 border-green-300 font-bold" };
    if (pct >= 60) return { grade: "A-", gp: "3.50", color: "text-teal-700 bg-teal-50 border-teal-300 font-bold" };
    if (pct >= 50) return { grade: "B",  gp: "3.00", color: "text-blue-700 bg-blue-50 border-blue-300 font-bold" };
    if (pct >= 40) return { grade: "C",  gp: "2.00", color: "text-amber-700 bg-amber-50 border-amber-300 font-bold" };
    if (pct >= 33) return { grade: "D",  gp: "1.00", color: "text-orange-700 bg-orange-50 border-orange-300 font-bold" };
    return { grade: "F", gp: "0.00", color: "text-rose-700 bg-rose-50 border-rose-300 font-black" };
  };

  const handleScoreChange = (studentId: string, val: string) => {
    if (val === "") {
      setMarksMap((prev) => ({ ...prev, [studentId]: "" }));
      return;
    }
    const num = Number(val);
    if (isNaN(num)) return;
    const clamped = Math.max(0, Math.min(totalMarks, num));
    setMarksMap((prev) => ({ ...prev, [studentId]: clamped }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) {
      setError("Please select an Exam to record marks.");
      return;
    }

    const payloadResults = Object.entries(marksMap)
      .filter(([_, score]) => score !== "" && !isNaN(Number(score)))
      .map(([studentId, score]) => ({
        student_id: studentId,
        score: Number(score),
        total_marks: totalMarks,
      }));

    if (payloadResults.length === 0) {
      setError("Please enter marks for at least one student.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await api.bulkSaveResults({
        exam_id: Number(selectedExamId),
        total_marks: totalMarks,
        results: payloadResults,
      });

      if (response.success) {
        setSuccessMsg(response.message || `Successfully recorded results for ${payloadResults.length} students.`);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(response.message || "Failed to record results.");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col border border-gray-200 dark:border-gray-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/80">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#707E94]/15 text-[#707E94] dark:bg-[#707E94]/20 dark:text-[#a4b3c7]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </span>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base">
                Batch Marks Entry (Bangladesh System)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Quickly enter exam marks with live Bangladesh letter grades and grade points
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* Filter / Settings Row */}
          <div className="p-4 bg-[#707E94]/10 dark:bg-[#707E94]/15 border-b border-[#707E94]/20 dark:border-[#707E94]/40 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Select Class *
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full text-xs border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-[#707E94]/30"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Select Exam / Assessment *
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full text-xs border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-[#707E94]/30"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Total / Full Marks
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={totalMarks}
                onChange={(e) => setTotalMarks(Math.max(1, Number(e.target.value)))}
                className="w-full text-xs border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-[#707E94]/30"
              />
            </div>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mx-4 mt-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <svg className="w-4 h-4 text-rose-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mx-4 mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Student Marks Table */}
          <div className="flex-1 overflow-y-auto p-4">
            {loadingStudents ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-2">
                <div className="w-8 h-8 border-3 border-[#707E94] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs">Loading class students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                No students enrolled in this class.
              </div>
            ) : (
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                      <th className="py-2.5 px-3 w-16 text-center">Roll</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3 w-36 text-center">Marks Obtained (/{totalMarks})</th>
                      <th className="py-2.5 px-3 w-24 text-center">BD Grade</th>
                      <th className="py-2.5 px-3 w-20 text-center">GP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                    {students.map((st) => {
                      const scoreVal = marksMap[st.id] ?? "";
                      const bd = calculateBdGrade(scoreVal, totalMarks);

                      return (
                        <tr key={st.id} className="hover:bg-[#707E94]/10 dark:hover:bg-[#707E94]/10">
                          <td className="py-2 px-3 text-center font-bold text-gray-600 dark:text-gray-400">
                            {st.username || st.id}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {st.name} {st.surname}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={totalMarks}
                              placeholder="0"
                              value={scoreVal}
                              onChange={(e) => handleScoreChange(st.id, e.target.value)}
                              className="w-24 text-center text-sm font-bold border border-gray-300 dark:border-gray-600 rounded-lg p-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-[#707E94]/30"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded text-xs border ${bd.color}`}>
                              {bd.grade}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-gray-700 dark:text-gray-300">
                            {bd.gp}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Students entered: {Object.values(marksMap).filter((v) => v !== "").length} of {students.length}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || loadingStudents || students.length === 0}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#D32F45] hover:bg-[#be2035] text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving Marks...</span>
                  </>
                ) : (
                  <span>Save All Results</span>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};

export default BulkResultEntryModal;
