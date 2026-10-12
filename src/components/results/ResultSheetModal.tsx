import React, { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";

export interface ResultSheetData {
  student: {
    id: string;
    name: string;
    surname: string;
    full_name: string;
    roll: string;
    class_id: number | string;
    class_name: string;
    grade_level: string | number;
    section?: string;
    img?: string;
    blood_type?: string;
    sex?: string;
    parent_name?: string;
    parent_phone?: string;
  };
  exam: {
    id: number | string;
    title: string;
    date: string;
    total_marks: number;
  };
  institute: {
    name: string;
    address: string;
    eiin: string;
    board: string;
    curriculum: string;
    phone: string;
    email: string;
    website: string;
  };
  subjects: Array<{
    id: number | string;
    subject_id: number | string;
    subject_name: string;
    exam_title: string;
    total_marks: number;
    score: number;
    cq_marks?: number | null;
    mcq_marks?: number | null;
    practical_marks?: number | null;
    highest_in_class: number;
    grade: string;
    point: number;
    status: string;
    remarks: string;
    percentage: number;
  }>;
  summary: {
    gpa: string;
    grade: string;
    status: string;
    total_full_marks: number;
    total_obtained: number;
    percentage: number;
    remarks: string;
    has_fail: boolean;
    merit_position: string;
  };
  grading_scale: Array<{
    range: string;
    grade: string;
    point: number;
    remarks: string;
    color: string;
  }>;
  generated_at: string;
}

interface ResultSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string | number;
  examId?: string | number;
  availableExams?: Array<{ id: number | string; title: string }>;
  availableStudents?: Array<{ id: string; name: string; surname: string; roll?: string; class_name?: string }>;
}

export const ResultSheetModal: React.FC<ResultSheetModalProps> = ({
  isOpen,
  onClose,
  studentId: initialStudentId,
  examId: initialExamId,
  availableExams = [],
  availableStudents = [],
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | number | undefined>(initialStudentId);
  const [selectedExamId, setSelectedExamId] = useState<string | number | undefined>(initialExamId);
  const [data, setData] = useState<ResultSheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialStudentId) setSelectedStudentId(initialStudentId);
    if (initialExamId) setSelectedExamId(initialExamId);
  }, [initialStudentId, initialExamId]);

  const fetchSheet = async () => {
    if (!selectedStudentId) {
      if (availableStudents.length > 0) {
        setSelectedStudentId(availableStudents[0].id);
        return;
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.getResultSheet(selectedStudentId, selectedExamId);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || "Failed to load result sheet.");
        setData(null);
      }
    } catch (err: any) {
      setError(err?.message || "Error fetching result sheet.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSheet();
    }
  }, [isOpen, selectedStudentId, selectedExamId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getGradeBadgeColor = (grade: string) => {
    switch (grade) {
      case "A+":
        return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700";
      case "A":
        return "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700";
      case "A-":
        return "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-700";
      case "B":
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700";
      case "C":
        return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700";
      case "D":
        return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700";
      case "F":
      default:
        return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Container */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col border border-gray-200 dark:border-gray-800 print:border-none print:shadow-none print:max-w-none print:max-h-none print:w-full print:rounded-none">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/80 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <div>
              <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
                Bangladesh Academic Transcript / Result Sheet
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Official Marks Certificate with National Curriculum (NCTB) Grading System
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Student Switcher (if list provided) */}
            {availableStudents.length > 0 && (
              <select
                value={selectedStudentId || ""}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="text-xs border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              >
                {availableStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.surname} {s.roll ? `(Roll: ${s.roll})` : ""}
                  </option>
                ))}
              </select>
            )}

            {/* Exam Switcher */}
            {availableExams.length > 0 && (
              <select
                value={selectedExamId || ""}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="text-xs border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Exams / Latest</option>
                {availableExams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}
                  </option>
                ))}
              </select>
            )}

            {/* Print Button */}
            <button
              onClick={handlePrint}
              disabled={loading || !data}
              className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save PDF
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body / Result Sheet Printable Area */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 print:p-0 print:overflow-visible">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[350px] gap-3 text-gray-500">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium">Generating official Bangladesh result sheet...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-800">
              <div className="w-12 h-12 mx-auto mb-3 text-rose-500">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-rose-800 dark:text-rose-200">Unable to generate Result Sheet</h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{error}</p>
              <button
                onClick={fetchSheet}
                className="mt-4 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : data ? (
            <div
              ref={sheetRef}
              id="printable-result-sheet"
              className="bg-white text-gray-900 p-6 sm:p-8 rounded-xl border-4 border-double border-purple-900/40 shadow-sm relative mx-auto max-w-3xl print:border-4 print:border-double print:border-black print:shadow-none print:p-4 print:max-w-none print:w-full print:m-0"
            >
              {/* Decorative Corner Ornaments (Bangladesh Certificate Aesthetic) */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-purple-800 pointer-events-none"></div>
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-purple-800 pointer-events-none"></div>
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-purple-800 pointer-events-none"></div>
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-purple-800 pointer-events-none"></div>

              {/* Institution Header */}
              <div className="text-center border-b-2 border-purple-900/30 pb-4 mb-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-50 border-2 border-purple-700 text-purple-900 font-black text-xl mb-2 shadow-xs">
                  BD
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-purple-950 font-serif">
                  {data.institute.name}
                </h1>
                <p className="text-xs text-gray-600 font-medium">
                  {data.institute.address} &bull; EIIN: {data.institute.eiin}
                </p>
                <p className="text-[11px] text-gray-500 italic mt-0.5">
                  Affiliated with {data.institute.board}
                </p>

                {/* Badge Banner */}
                <div className="mt-3 inline-block">
                  <span className="bg-purple-900 text-white font-bold tracking-widest text-xs uppercase px-5 py-1 rounded-full shadow-xs">
                    Academic Transcript / Marksheet
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-800 mt-2">
                  {data.exam.title} &bull; Academic Session {new Date().getFullYear()}
                </p>
              </div>

              {/* Student Details & Official BD Grading Scale side by side */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 text-xs">
                {/* Student Info Box (2 cols) */}
                <div className="md:col-span-2 bg-purple-50/50 rounded-lg p-3 border border-purple-200">
                  <h3 className="font-bold text-purple-950 uppercase text-[11px] border-b border-purple-200 pb-1 mb-2 tracking-wider flex items-center justify-between">
                    <span>Student Particulars</span>
                    <span className="text-[10px] text-purple-700 font-semibold">ID: {data.student.id}</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-gray-800">
                    <div>
                      <span className="text-gray-500 text-[11px] block">Student Name</span>
                      <strong className="text-sm font-bold text-gray-950">{data.student.full_name}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[11px] block">Roll Number</span>
                      <strong className="text-sm font-bold text-purple-900">{data.student.roll}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[11px] block">Class & Section</span>
                      <span className="font-semibold text-gray-900">{data.student.class_name} ({data.student.section || "A"})</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[11px] block">Grade Level</span>
                      <span className="font-semibold text-gray-900">Grade {data.student.grade_level}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[11px] block">Guardian Name</span>
                      <span className="font-medium text-gray-800">{data.student.parent_name || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[11px] block">Date of Issue</span>
                      <span className="font-medium text-gray-800">{data.generated_at}</span>
                    </div>
                  </div>
                </div>

                {/* Bangladesh 7-tier Grading Scale Table (1 col) */}
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-[10px]">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wide text-center border-b border-slate-200 pb-1 mb-1">
                    Grading System (NCTB)
                  </h4>
                  <table className="w-full text-center">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-200">
                        <th className="py-0.5">Marks Range</th>
                        <th className="py-0.5">Grade</th>
                        <th className="py-0.5">Point</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr><td className="py-0.5">80 - 100%</td><td className="font-bold text-emerald-700">A+</td><td>5.00</td></tr>
                      <tr><td className="py-0.5">70 - 79%</td><td className="font-bold text-green-700">A</td><td>4.00</td></tr>
                      <tr><td className="py-0.5">60 - 69%</td><td className="font-bold text-teal-700">A-</td><td>3.50</td></tr>
                      <tr><td className="py-0.5">50 - 59%</td><td className="font-bold text-blue-700">B</td><td>3.00</td></tr>
                      <tr><td className="py-0.5">40 - 49%</td><td className="font-bold text-amber-700">C</td><td>2.00</td></tr>
                      <tr><td className="py-0.5">33 - 39%</td><td className="font-bold text-orange-700">D</td><td>1.00</td></tr>
                      <tr><td className="py-0.5">00 - 32%</td><td className="font-bold text-rose-700">F</td><td>0.00</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Subject-wise Marks Table */}
              <div className="mb-5 overflow-hidden rounded-lg border border-gray-300">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-purple-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-2 px-3 text-center w-10">Sl</th>
                      <th className="py-2 px-3">Subject Name</th>
                      <th className="py-2 px-2 text-center w-20">Full Marks</th>
                      <th className="py-2 px-2 text-center w-24">Marks Obtained</th>
                      <th className="py-2 px-2 text-center w-20">Highest</th>
                      <th className="py-2 px-2 text-center w-16">Grade</th>
                      <th className="py-2 px-2 text-center w-16">GP</th>
                      <th className="py-2 px-3 text-center w-24">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.subjects.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-gray-400 italic">
                          No subject marks recorded for this assessment.
                        </td>
                      </tr>
                    ) : (
                      data.subjects.map((sub, idx) => (
                        <tr key={sub.id || idx} className="hover:bg-purple-50/40 transition">
                          <td className="py-2 px-3 text-center font-medium text-gray-500">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-gray-900">{sub.subject_name}</td>
                          <td className="py-2 px-2 text-center text-gray-600">{sub.total_marks}</td>
                          <td className="py-2 px-2 text-center font-bold text-gray-950">
                            {sub.score}
                            {sub.total_marks !== 100 && (
                              <span className="text-[10px] text-gray-500 font-normal ml-1">({sub.percentage}%)</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center text-gray-600 font-medium">{sub.highest_in_class}</td>
                          <td className="py-2 px-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getGradeBadgeColor(sub.grade)}`}>
                              {sub.grade}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center font-bold text-gray-800">
                            {Number(sub.point).toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`text-[11px] font-semibold ${sub.status === "Passed" ? "text-emerald-700" : "text-rose-600 font-bold"}`}>
                              {sub.status === "Passed" ? sub.remarks : "Failed"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {/* Totals Row */}
                  <tfoot className="bg-gray-100 border-t-2 border-gray-300 font-bold text-gray-900 text-xs">
                    <tr>
                      <td colSpan={2} className="py-2 px-3 text-right uppercase tracking-wider">
                        Total Marks:
                      </td>
                      <td className="py-2 px-2 text-center">{data.summary.total_full_marks}</td>
                      <td className="py-2 px-2 text-center font-black text-purple-950 text-sm">
                        {data.summary.total_obtained}
                      </td>
                      <td colSpan={4} className="py-2 px-3 text-right text-[11px] text-gray-600">
                        Average: {data.summary.percentage}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Bangladesh Overall Result Evaluation Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-purple-50 border-2 border-purple-300 mb-6 text-center">
                <div className="p-2 rounded-lg bg-white shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-wider">GPA (5.00 Scale)</span>
                  <div className={`text-2xl font-black mt-0.5 ${data.summary.has_fail ? "text-rose-600" : "text-purple-900"}`}>
                    {data.summary.gpa}
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">Grade Point Average</span>
                </div>

                <div className="p-2 rounded-lg bg-white shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-wider">Final Grade</span>
                  <div className="mt-0.5">
                    <span className={`inline-block px-3 py-0.5 text-xl font-black rounded-lg border ${getGradeBadgeColor(data.summary.grade)}`}>
                      {data.summary.grade}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">{data.summary.remarks}</span>
                </div>

                <div className="p-2 rounded-lg bg-white shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-wider">Result Status</span>
                  <div className="mt-1">
                    <span className={`inline-block px-3 py-1 text-xs uppercase font-extrabold rounded-full ${
                      data.summary.status === "Passed"
                        ? "bg-emerald-600 text-white"
                        : "bg-rose-600 text-white"
                    }`}>
                      {data.summary.status === "Passed" ? "PASSED (PROMOTED)" : "FAILED"}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium mt-0.5 block">
                    {data.summary.has_fail ? "Subject fail rule applied" : "Qualified"}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-white shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-wider">Class Merit Position</span>
                  <div className="text-2xl font-black text-amber-600 mt-0.5">
                    {data.summary.merit_position}
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">Class Rank</span>
                </div>
              </div>

              {/* Remarks Note */}
              <div className="text-[11px] text-gray-600 border border-gray-200 rounded-lg p-2.5 mb-8 bg-gray-50/50">
                <strong className="text-gray-800">Note:</strong> Bangladesh Grading Rule requires passing all compulsory subjects. A grade of &quot;F&quot; (below 33%) in any subject results in an overall GPA of 0.00 and Final Grade F.
              </div>

              {/* Bangladesh Official Signature Blocks */}
              <div className="grid grid-cols-3 gap-6 pt-10 border-t border-gray-300 text-center text-xs mt-4">
                <div>
                  <div className="border-b border-gray-400 w-3/4 mx-auto mb-1"></div>
                  <p className="font-bold text-gray-800">Class Teacher</p>
                  <p className="text-[10px] text-gray-400">Signature & Date</p>
                </div>

                <div>
                  <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-full mx-auto -mt-6 mb-1 flex items-center justify-center text-[9px] text-gray-400 uppercase font-semibold">
                    Official Seal
                  </div>
                  <p className="font-bold text-gray-800">Institution Seal</p>
                </div>

                <div>
                  <div className="border-b border-gray-400 w-3/4 mx-auto mb-1"></div>
                  <p className="font-bold text-purple-950 font-serif">Headmaster / Principal</p>
                  <p className="text-[10px] text-gray-400">Academic Authority</p>
                </div>
              </div>

            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
};

export default ResultSheetModal;
