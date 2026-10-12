import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface TabulationSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes?: Array<{ id: number | string; name: string }>;
  exams?: Array<{ id: number | string; title: string }>;
  initialClassId?: number | string;
  initialExamId?: number | string;
}

export const TabulationSheetModal: React.FC<TabulationSheetModalProps> = ({
  isOpen,
  onClose,
  classes = [],
  exams = [],
  initialClassId,
  initialExamId,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<number | string>(initialClassId || (classes[0]?.id || ""));
  const [selectedExamId, setSelectedExamId] = useState<number | string>(initialExamId || "");
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialClassId) setSelectedClassId(initialClassId);
    if (initialExamId) setSelectedExamId(initialExamId);
  }, [initialClassId, initialExamId]);

  const fetchTabulation = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.getTabulationSheet(selectedClassId, selectedExamId);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || "Failed to load Tabulation Sheet.");
        setData(null);
      }
    } catch (err: any) {
      setError(err?.message || "Error fetching Tabulation Sheet.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && selectedClassId) {
      fetchTabulation();
    }
  }, [isOpen, selectedClassId, selectedExamId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A+": return "text-emerald-700 bg-emerald-50 border-emerald-300";
      case "A":  return "text-green-700 bg-green-50 border-green-300";
      case "A-": return "text-teal-700 bg-teal-50 border-teal-300";
      case "B":  return "text-blue-700 bg-blue-50 border-blue-300";
      case "C":  return "text-amber-700 bg-amber-50 border-amber-300";
      case "D":  return "text-orange-700 bg-orange-50 border-orange-300";
      case "F":
      default:   return "text-rose-700 bg-rose-50 border-rose-300 font-bold";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col border border-gray-200 dark:border-gray-800 print:border-none print:shadow-none print:max-w-none print:max-h-none print:w-full print:rounded-none">
        
        {/* Header Controls (Hidden on Print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/80 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            <div>
              <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
                Class Broad-Sheet / Tabulation Sheet (ট্যাবুলেশন শিট)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Consolidated Class Results &amp; Merit Positions
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Class Selector */}
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Class: {c.name}
                </option>
              ))}
            </select>

            {/* Exam Selector */}
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="text-xs border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Exams / Latest</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  Exam: {ex.title}
                </option>
              ))}
            </select>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              disabled={loading || !data}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Landscape
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabulation Sheet Content */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 print:p-2 print:overflow-visible">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-gray-500">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium">Preparing class broad-sheet...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-800">
              <h3 className="text-base font-semibold text-rose-800 dark:text-rose-200">Unable to generate Tabulation Sheet</h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{error}</p>
              <button
                onClick={fetchTabulation}
                className="mt-4 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : data ? (
            <div className="bg-white text-gray-900 p-4 sm:p-6 rounded-xl border border-gray-300 shadow-xs print:border-none print:shadow-none print:p-0">
              {/* Institution Header */}
              <div className="text-center border-b pb-3 mb-4">
                <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-gray-900 font-serif">
                  {data.institute.name}
                </h1>
                <p className="text-xs text-gray-600">
                  {data.institute.address} &bull; EIIN: {data.institute.eiin}
                </p>
                <div className="inline-block mt-1">
                  <span className="bg-gray-900 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                    Tabulation Sheet (Broad Sheet) &bull; {data.exam.title}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-4 text-xs font-medium text-gray-700 mt-2">
                  <span>Class: <strong>{data.class.name}</strong></span>
                  <span>&bull;</span>
                  <span>Total Students: <strong>{data.stats.total_students}</strong></span>
                  <span>&bull;</span>
                  <span>Date: <strong>{data.generated_at}</strong></span>
                </div>
              </div>

              {/* Statistics Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-4 text-center text-xs print:mb-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">Appeared</span>
                  <p className="text-lg font-bold text-blue-900">{data.stats.total_appeared}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">Passed</span>
                  <p className="text-lg font-bold text-emerald-700">{data.stats.passed}</p>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-2">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">Failed</span>
                  <p className="text-lg font-bold text-rose-700">{data.stats.failed}</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">Pass Rate</span>
                  <p className="text-lg font-bold text-purple-900">{data.stats.pass_rate}%</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">A+ (GPA 5.0)</span>
                  <p className="text-lg font-bold text-amber-700">{data.stats.grade_distribution["A+"] || 0}</p>
                </div>
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-2">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">A &amp; A-</span>
                  <p className="text-lg font-bold text-teal-800">
                    {(data.stats.grade_distribution["A"] || 0) + (data.stats.grade_distribution["A-"] || 0)}
                  </p>
                </div>
              </div>

              {/* Broad Sheet Table */}
              <div className="overflow-x-auto border border-gray-300 rounded-lg">
                <table className="w-full text-left border-collapse text-[11px] whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-800 text-white font-semibold">
                      <th className="py-2 px-2 text-center border-r border-gray-700 w-10">Roll</th>
                      <th className="py-2 px-3 border-r border-gray-700 min-w-[140px]">Student Name</th>
                      {data.subjects.map((sub: any) => (
                        <th key={sub.id} className="py-2 px-2 text-center border-r border-gray-700 min-w-[65px]">
                          {sub.name}
                        </th>
                      ))}
                      <th className="py-2 px-2 text-center border-r border-gray-700 w-16">Total</th>
                      <th className="py-2 px-2 text-center border-r border-gray-700 w-14">GPA</th>
                      <th className="py-2 px-2 text-center border-r border-gray-700 w-12">Grade</th>
                      <th className="py-2 px-2 text-center border-r border-gray-700 w-14">Rank</th>
                      <th className="py-2 px-2 text-center w-16">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.students.length === 0 ? (
                      <tr>
                        <td colSpan={data.subjects.length + 7} className="py-6 text-center text-gray-400 italic">
                          No students or results recorded in this class.
                        </td>
                      </tr>
                    ) : (
                      data.students.map((student: any) => (
                        <tr key={student.student_id} className="hover:bg-slate-50 transition even:bg-slate-50/50">
                          <td className="py-1.5 px-2 text-center font-bold text-gray-800 border-r border-gray-200">
                            {student.roll}
                          </td>
                          <td className="py-1.5 px-3 font-semibold text-gray-900 border-r border-gray-200">
                            {student.name}
                          </td>
                          {data.subjects.map((sub: any) => {
                            const mark = student.marks[sub.id];
                            if (!mark) {
                              return (
                                <td key={sub.id} className="py-1.5 px-2 text-center text-gray-400 border-r border-gray-200">
                                  —
                                </td>
                              );
                            }
                            return (
                              <td key={sub.id} className="py-1.5 px-2 text-center border-r border-gray-200">
                                <span className={`font-semibold ${mark.grade === "F" ? "text-rose-600 font-bold" : "text-gray-900"}`}>
                                  {mark.score}
                                </span>
                                <span className="text-[9px] text-gray-400 ml-0.5">({mark.grade})</span>
                              </td>
                            );
                          })}
                          <td className="py-1.5 px-2 text-center font-bold text-gray-900 border-r border-gray-200">
                            {student.total_obtained}
                          </td>
                          <td className={`py-1.5 px-2 text-center font-black border-r border-gray-200 ${student.has_fail ? "text-rose-600" : "text-purple-900"}`}>
                            {student.gpa}
                          </td>
                          <td className="py-1.5 px-2 text-center border-r border-gray-200">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${getGradeColor(student.grade)}`}>
                              {student.grade}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-center font-bold text-amber-700 border-r border-gray-200">
                            {student.rank === "F" ? "—" : student.rank}
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              student.status === "Passed" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            }`}>
                              {student.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-12 text-center text-xs mt-6 border-t">
                <div>
                  <div className="border-b border-gray-400 w-3/4 mx-auto mb-1"></div>
                  <p className="font-bold text-gray-800">Class Teacher</p>
                </div>
                <div>
                  <div className="border-b border-gray-400 w-3/4 mx-auto mb-1"></div>
                  <p className="font-bold text-gray-800">Exam Controller</p>
                </div>
                <div>
                  <div className="border-b border-gray-400 w-3/4 mx-auto mb-1"></div>
                  <p className="font-bold text-purple-950">Headmaster / Principal</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
};

export default TabulationSheetModal;
