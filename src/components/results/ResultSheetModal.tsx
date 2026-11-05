import React, { useEffect, useMemo, useState, useRef } from "react";
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
    group?: string;
  };
  exam: {
    id: number | string;
    title: string;
    date: string;
    total_marks: number;
    subject_name?: string;
    class_name?: string;
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
    min?: number;
    max?: number;
  }>;
  generated_at: string;
}

interface ResultSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string | number;
  examId?: string | number;
  availableExams?: Array<{ id: number | string; title: string; class_id?: number | string; subject_name?: string; date?: string }>;
  availableStudents?: Array<{ id: string; name: string; surname: string; roll?: string; class_name?: string; class_id?: number | string }>;
}

const EMPTY_EXAMS: Array<{ id: number | string; title: string; class_id?: number | string; subject_name?: string; date?: string }> = [];
const EMPTY_STUDENTS: Array<{ id: string; name: string; surname: string; roll?: string; class_name?: string; class_id?: number | string }> = [];

export const ResultSheetModal: React.FC<ResultSheetModalProps> = ({
  isOpen,
  onClose,
  studentId: initialStudentId,
  examId: initialExamId,
  availableExams = EMPTY_EXAMS,
  availableStudents = EMPTY_STUDENTS,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | number | undefined>(initialStudentId);
  const [selectedExamId, setSelectedExamId] = useState<string | number | undefined>(initialExamId);
  const [data, setData] = useState<ResultSheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);
  const selectedStudent = useMemo(
    () => availableStudents.find((student) => String(student.id) === String(selectedStudentId)),
    [availableStudents, selectedStudentId]
  );
  const studentExams = useMemo(() => availableExams.filter((exam) =>
    !exam.class_id || !selectedStudent?.class_id || String(exam.class_id) === String(selectedStudent.class_id)
  ), [availableExams, selectedStudent]);

  useEffect(() => {
    setSelectedStudentId(initialStudentId ?? availableStudents[0]?.id);
    setSelectedExamId(initialExamId);
  }, [initialStudentId, initialExamId, availableStudents]);

  useEffect(() => {
    if (!selectedExamId || studentExams.length === 0) return;
    if (!studentExams.some((exam) => String(exam.id) === String(selectedExamId))) {
      setSelectedExamId(undefined);
    }
  }, [selectedExamId, studentExams]);

  const fetchSheet = async () => {
    const currentRequestId = ++requestId.current;
    if (!selectedStudentId) {
      setData(null);
      setLoading(false);
      setError(
        availableStudents.length > 0
          ? "Select a student to generate a result sheet."
          : "No students are available to generate a result sheet.",
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.getResultSheet(selectedStudentId, selectedExamId);
      if (currentRequestId !== requestId.current) return;
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || "Failed to load result sheet.");
        setData(null);
      }
    } catch (err: any) {
      if (currentRequestId !== requestId.current) return;
      setError(err?.message || "Error fetching result sheet.");
      setData(null);
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void fetchSheet();
    }
    return () => {
      requestId.current++;
    };
  }, [isOpen, selectedStudentId, selectedExamId, availableStudents]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getGradeBadgeColor = (grade: string) => {
    return grade === "F"
      ? "bg-red-50 text-red-800 border-red-200"
      : "bg-emerald-50 text-emerald-800 border-emerald-200";
  };

  const hasComponentMarks = data?.subjects.some(
    (subject) => subject.cq_marks != null || subject.mcq_marks != null || subject.practical_marks != null,
  ) ?? false;
  const examDateParts = data?.exam.date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const examDate = examDateParts
    ? new Date(Number(examDateParts[1]), Number(examDateParts[2]) - 1, Number(examDateParts[3]))
    : data ? new Date(data.exam.date) : null;
  const examYear = examDate && !Number.isNaN(examDate.getTime()) ? examDate.getFullYear() : "—";
  const examDateLabel = examDate && !Number.isNaN(examDate.getTime())
    ? examDate.toLocaleDateString("en-BD", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Container */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-5xl max-h-[94vh] flex flex-col border border-gray-200 dark:border-gray-800 print:border-none print:shadow-none print:max-w-none print:max-h-none print:w-full print:rounded-none">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/80 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-[#006a4e] border border-emerald-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <div>
              <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
                Academic Transcript / নম্বরপত্র
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Official student marksheet · Bangladesh grading scale · GPA out of 5.00
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Student Switcher (if list provided) */}
            {availableStudents.length > 0 && (
              <select
                value={selectedStudentId || ""}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                aria-label="Select student"
                className="text-xs border border-gray-300 dark:border-gray-700 rounded-md px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#006a4e]/30"
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
                aria-label="Select examination"
                className="text-xs border border-gray-300 dark:border-gray-700 rounded-md px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#006a4e]/30"
              >
                <option value="">Latest available examination</option>
                {studentExams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}{ex.subject_name ? ` · ${ex.subject_name}` : ""}
                  </option>
                ))}
              </select>
            )}

            {/* Print Button */}
            <button
              onClick={handlePrint}
              disabled={loading || !data || data.subjects.length === 0}
              className="inline-flex items-center gap-1.5 bg-[#006a4e] hover:bg-[#00563f] text-white text-xs font-semibold px-3.5 py-1.5 rounded-md transition disabled:opacity-50 cursor-pointer"
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
              <div className="w-10 h-10 border-4 border-[#707E94] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium">Preparing Bangladesh-style result sheet...</p>
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
              className="bg-white text-gray-900 p-5 sm:p-8 rounded-md border border-gray-300 shadow-sm relative mx-auto max-w-4xl print:border print:border-black print:shadow-none print:p-4 print:max-w-none print:w-full print:m-0"
            >
              <div className="relative text-center border-b-2 border-[#006a4e] pb-4 mb-4">
                <div className="absolute left-0 top-0 hidden sm:block text-left text-[9px] font-semibold leading-relaxed text-gray-500">
                  <p>EIIN: {data.institute.eiin || "—"}</p>
                  {data.institute.phone && <p>{data.institute.phone}</p>}
                </div>
                <p className="text-xs font-semibold tracking-widest text-[#006a4e]">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</p>
                <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-gray-500">{data.institute.board || "শিক্ষা মন্ত্রণালয়"}</p>
                <h1 className="text-xl sm:text-3xl font-bold tracking-wide text-gray-900 font-serif mt-1">
                  {data.institute.name}
                </h1>
                {data.institute.address && (
                  <p className="text-xs text-gray-600 font-medium mt-1">
                    {data.institute.address}
                  </p>
                )}
                {data.institute.curriculum && (
                  <p className="text-[10px] text-gray-500 mt-0.5">{data.institute.curriculum}</p>
                )}
                <div className="mt-3 inline-flex items-center gap-2 border-y border-[#006a4e] px-5 py-1.5 print-avoid-break">
                  <span className="h-2 w-2 rounded-full bg-[#f42a41]" aria-hidden="true" />
                  <span className="font-bold tracking-wide text-sm text-[#006a4e]">Academic Transcript / নম্বরপত্র</span>
                  <span className="h-2 w-2 rounded-full bg-[#f42a41]" aria-hidden="true" />
                </div>
                <p className="text-sm font-bold text-gray-800 mt-2">
                  {data.exam.title} · শিক্ষাবর্ষ {examYear}
                </p>
                {data.exam.subject_name && <p className="text-[11px] text-gray-600">{data.exam.subject_name}</p>}
              </div>

              <div className="grid grid-cols-1 gap-3 mb-5 text-xs sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-4 print-avoid-break">
                <div className="sm:col-span-2 rounded-md p-3 border border-gray-300">
                  <h3 className="font-bold text-[#006a4e] text-[11px] border-b border-gray-300 pb-1 mb-2 tracking-wide flex items-center justify-between">
                    <span>Student particulars / শিক্ষার্থীর তথ্য</span>
                    <span className="text-[10px] text-gray-600 font-semibold">ID: {data.student.id}</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-gray-800">
                    <div>
                      <span className="text-gray-500 text-[10px] block">শিক্ষার্থীর নাম · Student Name</span>
                      <strong className="text-xs sm:text-sm font-bold text-gray-950">{data.student.full_name}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">রোল · Roll No.</span>
                      <strong className="text-sm font-bold text-[#006a4e]">{data.student.roll}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">শ্রেণি{data.student.section ? " ও শাখা" : ""} · Class{data.student.section ? " & Section" : ""}</span>
                      <span className="font-semibold text-gray-900">
                        {data.student.class_name}{data.student.section ? ` · ${data.student.section}` : ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">শিক্ষাস্তর · Academic Level</span>
                      <span className="font-semibold text-gray-900">{data.student.grade_level}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">অভিভাবক · Guardian</span>
                      <span className="font-medium text-gray-800">{data.student.parent_name || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">যোগাযোগ · Guardian Phone</span>
                      <span className="font-medium text-gray-800">{data.student.parent_phone || "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-md p-3 border border-gray-300">
                  <h4 className="font-bold text-gray-800 tracking-wide text-center border-b border-gray-300 pb-1 mb-2 text-[10px]">
                    Examination details / পরীক্ষার তথ্য
                  </h4>
                  <dl className="space-y-2 text-[10px]">
                    <div className="flex items-start justify-between gap-2">
                      <dt className="text-gray-500">Examination</dt>
                      <dd className="text-right font-semibold text-gray-800">{data.exam.title}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <dt className="text-gray-500">Session</dt>
                      <dd className="font-semibold text-gray-800">{examYear}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <dt className="text-gray-500">Exam date</dt>
                      <dd className="text-right font-semibold text-gray-800">{examDateLabel}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <dt className="text-gray-500">Class / শ্রেণি</dt>
                      <dd className="text-right font-semibold text-gray-800">{data.student.class_name}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-gray-50 rounded-md p-2.5 border border-gray-300 text-[10px]">
                  <h4 className="font-bold text-gray-800 tracking-wide text-center border-b border-gray-300 pb-1 mb-1">
                    Grading scale / গ্রেডিং স্কেল
                  </h4>
                  <table className="w-full text-center">
                    <thead>
                      <tr className="text-gray-600 border-b border-gray-300">
                          <th className="py-0.5">Marks</th>
                        <th className="py-0.5">Grade</th>
                          <th className="py-0.5">GPA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 font-medium">
                      {data.grading_scale.map((tier) => (
                        <tr key={tier.grade}>
                          <td className="py-0.5">{tier.range}</td>
                          <td className={`font-bold ${tier.grade === "F" ? "text-red-700" : "text-[#006a4e]"}`}>{tier.grade}</td>
                          <td>{Number(tier.point).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Subject-wise Marks Table */}
              <div className="mb-5 overflow-x-auto rounded-md border border-gray-300 print:overflow-visible">
                <table className="w-full min-w-[720px] print:min-w-0 text-left border-collapse text-xs print:text-[9px]">
                  <thead>
                    <tr className="bg-[#006a4e] text-white text-[11px] uppercase tracking-wider font-semibold">
                      <th scope="col" className="py-2 px-3 text-center w-10">ক্রম</th>
                      <th scope="col" className="py-2 px-3">বিষয় · Subject</th>
                      <th scope="col" className="py-2 px-2 text-center w-20">পূর্ণমান</th>
                      {hasComponentMarks && (
                        <>
                          <th scope="col" className="py-2 px-2 text-center w-16">CQ</th>
                          <th scope="col" className="py-2 px-2 text-center w-16">MCQ</th>
                          <th scope="col" className="py-2 px-2 text-center w-20">Practical</th>
                        </>
                      )}
                      <th scope="col" className="py-2 px-2 text-center w-24">প্রাপ্ত নম্বর</th>
                      <th scope="col" className="py-2 px-2 text-center w-20">Highest</th>
                      <th scope="col" className="py-2 px-2 text-center w-16">Grade</th>
                      <th scope="col" className="py-2 px-2 text-center w-16">GP</th>
                      <th scope="col" className="py-2 px-3 text-center w-24">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.subjects.length === 0 ? (
                      <tr>
                        <td colSpan={hasComponentMarks ? 11 : 8} className="py-8 text-center text-gray-500">
                          <strong className="block text-gray-700">কোনো নম্বর পাওয়া যায়নি</strong>
                          No subject marks have been recorded for this examination.
                        </td>
                      </tr>
                    ) : (
                      data.subjects.map((sub, idx) => (
                        <tr key={sub.id || idx} className="hover:bg-emerald-50/60 transition">
                          <td className="py-2 px-3 text-center font-medium text-gray-500">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-gray-900">{sub.subject_name}</td>
                          <td className="py-2 px-2 text-center text-gray-600">{sub.total_marks}</td>
                          {hasComponentMarks && (
                            <>
                              <td className="py-2 px-2 text-center text-gray-600">{sub.cq_marks ?? "—"}</td>
                              <td className="py-2 px-2 text-center text-gray-600">{sub.mcq_marks ?? "—"}</td>
                              <td className="py-2 px-2 text-center text-gray-600">{sub.practical_marks ?? "—"}</td>
                            </>
                          )}
                          <td className="py-2 px-2 text-center font-bold text-gray-950">
                            {sub.score}
                            {sub.total_marks !== 100 && (
                              <span className="text-[10px] text-gray-500 font-normal ml-1">({sub.percentage}%)</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center text-gray-600">{sub.highest_in_class}</td>
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
                  {data.subjects.length > 0 && <tfoot className="bg-gray-100 border-t-2 border-gray-300 font-bold text-gray-900 text-xs">
                    <tr>
                      <td colSpan={2} className="py-2 px-3 text-right uppercase tracking-wider">
                        মোট নম্বর · Total:
                      </td>
                      <td className="py-2 px-2 text-center">{data.summary.total_full_marks}</td>
                      {hasComponentMarks && <td colSpan={3} className="py-2 px-2 text-center text-gray-500">Component marks</td>}
                      <td className="py-2 px-2 text-center font-bold text-[#006a4e] text-sm">
                        {data.summary.total_obtained}
                      </td>
                      <td colSpan={4} className="py-2 px-3 text-right text-[11px] text-gray-600">
                        Average / গড়: {data.summary.percentage}%
                      </td>
                    </tr>
                  </tfoot>}
                </table>
              </div>

              {/* Bangladesh Overall Result Evaluation Banner */}
              {data.subjects.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 p-3 border-y-2 border-[#006a4e] mb-5 text-center print-avoid-break">
                <div className="p-2 border border-gray-200 rounded-md">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-wider">GPA (5.00) · জিপিএ</span>
                  <div className={`text-2xl font-bold mt-0.5 ${data.summary.status === "Passed" ? "text-[#006a4e]" : "text-red-700"}`}>
                    {data.summary.gpa}
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">মোট নম্বর: {data.summary.total_obtained} / {data.summary.total_full_marks}</span>
                </div>

                <div className="p-2 border border-gray-200 rounded-md">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-wider">Final Grade · চূড়ান্ত গ্রেড</span>
                  <div className="mt-0.5">
                    <span className={`inline-block px-3 py-0.5 text-xl font-bold rounded-md border ${getGradeBadgeColor(data.summary.grade)}`}>
                      {data.summary.grade}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">{data.summary.remarks}</span>
                </div>

                <div className="p-2 border border-gray-200 rounded-md">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-wider">Result · ফলাফল</span>
                  <div className="mt-1">
                    <span className={`inline-block px-3 py-1 text-xs uppercase font-bold rounded-md ${
                      data.summary.status === "Passed"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}>
                      {data.summary.status === "Passed" ? "উত্তীর্ণ · PASSED" : "অনুত্তীর্ণ · FAILED"}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium mt-0.5 block">
                    {data.summary.has_fail ? "Subject fail rule applied" : "Qualified"}
                  </span>
                </div>

                <div className="p-2 border border-gray-200 rounded-md">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-wider">মেধাক্রম · Merit Position</span>
                  <div className="text-2xl font-bold text-[#006a4e] mt-0.5">
                    {data.summary.merit_position}
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">শ্রেণিতে অবস্থান</span>
                </div>
              </div>
              ) : (
                <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-center text-xs text-amber-800 print-avoid-break">
                  ফলাফল প্রকাশের জন্য এখনো কোনো বিষয়ের নম্বর এন্ট্রি করা হয়নি।
                  <span className="block">No marks are available to calculate the final GPA or result.</span>
                </div>
              )}

              {/* Remarks Note */}
              {data.subjects.length > 0 && (
                <div className="text-[11px] text-gray-600 border border-gray-200 rounded-md p-2.5 mb-8 bg-gray-50 print-avoid-break">
                  <strong className="text-gray-800">নোট · Note:</strong> Any F grade in a subject results in overall GPA 0.00 and a failed final result under the applied grading rule.
                </div>
              )}
              <p className="text-right text-[10px] text-gray-500 -mt-5 mb-5">Generated on {data.generated_at}</p>

              {/* Result approval signatures */}
              <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-8 sm:pt-10 border-t border-gray-300 text-center text-[10px] sm:text-xs mt-4 print-avoid-break">
                <div>
                  <div className="border-b border-gray-400 w-3/4 mx-auto mb-1"></div>
                  <p className="font-bold text-gray-800">শ্রেণি শিক্ষক · Class Teacher</p>
                  <p className="text-[10px] text-gray-400">স্বাক্ষর ও তারিখ · Signature &amp; Date</p>
                </div>

                <div>
                  <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-full mx-auto -mt-6 mb-1 flex items-center justify-center text-[9px] text-gray-400 uppercase font-semibold">
                    সিল
                  </div>
                  <p className="font-bold text-gray-800">প্রতিষ্ঠানের সিল · Institution Seal</p>
                </div>

                <div>
                  <div className="border-b border-gray-400 w-3/4 mx-auto mb-1"></div>
                  <p className="font-bold text-gray-800 font-serif">প্রধান শিক্ষক · Headmaster / Principal</p>
                  <p className="text-[10px] text-gray-400">অনুমোদনকারী কর্তৃপক্ষ · Academic Authority</p>
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
