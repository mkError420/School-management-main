import React, { useEffect, useState } from "react";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import { useAccessRole } from "@/context/AuthContext";
import { api } from "@/lib/api";
import ResultSheetModal from "@/components/results/ResultSheetModal";
import TabulationSheetModal from "@/components/results/TabulationSheetModal";
import BulkResultEntryModal from "@/components/results/BulkResultEntryModal";
import GradingScaleModal from "@/components/results/GradingScaleModal";

export const ResultsPage: React.FC = () => {
  const role = useAccessRole();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Filters
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedExam, setSelectedExam] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Data & State
  const [results, setResults] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dropdown options
  const [classesList, setClassesList] = useState<any[]>([]);
  const [examsList, setExamsList] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);

  // Modals state
  const [sheetModalOpen, setSheetModalOpen] = useState(false);
  const [activeStudentForSheet, setActiveStudentForSheet] = useState<string | number | undefined>(undefined);
  const [activeExamForSheet, setActiveExamForSheet] = useState<string | number | undefined>(undefined);

  const [tabulationModalOpen, setTabulationModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [scaleModalOpen, setScaleModalOpen] = useState(false);

  // Fetch dropdown options once
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [cRes, exRes, stRes] = await Promise.all([
          api.getAll("classes", { limit: 100 }),
          api.getAll("exams", { limit: 100 }),
          api.getAll("students", { limit: 200 }),
        ]);
        if (cRes.success && cRes.data?.classes) setClassesList(cRes.data.classes);
        if (exRes.success && exRes.data?.exams) setExamsList(exRes.data.exams);
        if (stRes.success && stRes.data?.students) setStudentsList(stRes.data.students);
      } catch (err) {
        console.warn("Could not load options for results filter:", err);
      }
    };
    fetchOptions();
  }, []);

  // Fetch results list
  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page,
        limit,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedClass !== "all") params.class_id = selectedClass;
      if (selectedExam !== "all") params.exam_id = selectedExam;
      if (selectedGrade !== "all") params.grade = selectedGrade;
      if (selectedStatus !== "all") params.status = selectedStatus;

      const response = await api.getAll("results", params);
      if (response.success && response.data) {
        setResults(response.data.results || []);
        setPagination(response.data.pagination || { total: 0, pages: 1 });
        if (response.data.stats) setStats(response.data.stats);
      } else {
        setError(response.message || "Failed to load results.");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred fetching results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, selectedClass, selectedExam, selectedGrade, selectedStatus]);

  useEffect(() => {
    fetchResults();
  }, [page, search, selectedClass, selectedExam, selectedGrade, selectedStatus]);

  // Open individual result sheet modal
  const handleOpenResultSheet = (studentId?: string | number, examId?: string | number) => {
    setActiveStudentForSheet(studentId || (studentsList[0]?.id));
    setActiveExamForSheet(examId || (examsList[0]?.id));
    setSheetModalOpen(true);
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case "A+":
        return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700";
      case "A":
        return "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/60 dark:text-green-300 dark:border-green-700";
      case "A-":
        return "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-700";
      case "B":
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700";
      case "C":
        return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700";
      case "D":
        return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-700";
      case "F":
      default:
        return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700";
    }
  };

  const tableColumns = [
    { header: "Student", accessor: "student" },
    { header: "Class", accessor: "class", className: "hidden md:table-cell" },
    { header: "Subject", accessor: "subject", className: "hidden sm:table-cell" },
    { header: "Assessment", accessor: "assessment", className: "hidden lg:table-cell" },
    { header: "Marks", accessor: "score" },
    { header: "BD Grade", accessor: "grade" },
    { header: "Point (GP)", accessor: "point", className: "hidden md:table-cell" },
    { header: "Status", accessor: "status", className: "hidden sm:table-cell" },
    { header: "Result Sheet", accessor: "sheet" },
    { header: "Actions", accessor: "actions" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl flex-1 m-4 mt-0 shadow-sm border border-gray-100 dark:border-gray-700/60">
      
      {/* Page Title & Main Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#707E94]/15 text-[#707E94] dark:bg-[#707E94]/20 dark:text-[#a4b3c7] rounded-xl">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                All Results &amp; Marksheets
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Bangladesh National Curriculum Grading System (A+, A, A-, B, C, D, F) &amp; Academic Transcripts
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* BD Grading System Info Button */}
          <button
            onClick={() => setScaleModalOpen(true)}
            title="View Bangladesh Grading System scale"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#707E94] dark:text-[#a4b3c7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">BD Grading System</span>
          </button>

          {/* Result Sheet Button */}
          <button
            onClick={() => handleOpenResultSheet()}
            title="Generate Student Result Sheet / Marksheet"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#D32F45] hover:bg-[#be2035] text-white shadow-xs transition active:scale-95 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Result Sheet (Marksheet)</span>
          </button>

          {/* Class Tabulation Sheet Button */}
          {(role === "admin" || role === "teacher") && (
            <button
              onClick={() => setTabulationModalOpen(true)}
              title="Generate Class Broad Sheet (ট্যাবুলেশন শিট)"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Tabulation Sheet</span>
            </button>
          )}

          {/* Bulk Marks Entry */}
          {(role === "admin" || role === "teacher") && (
            <button
              onClick={() => setBulkModalOpen(true)}
              title="Batch enter marks for class"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Bulk Marks Entry</span>
            </button>
          )}

          {/* Standard Single Create Modal */}
          {(role === "admin" || role === "teacher") && (
            <FormModal table="result" type="create" onSuccess={fetchResults} />
          )}
        </div>
      </div>

      {/* Bangladesh Quick Analytics Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="p-3.5 rounded-xl bg-primary-50/60 dark:bg-[#1a2332] border border-primary-200/60 dark:border-[#253147]">
          <span className="text-[11px] font-bold text-[#707E94] dark:text-[#a4b3c7] uppercase tracking-wider block">
            Total Results
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#707E94] dark:text-white mt-0.5">
            {stats?.total ?? pagination.total}
          </div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">Total subjects assessed</span>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
            Pass Rate (BD)
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
            {stats?.pass_rate !== undefined ? `${stats.pass_rate}%` : "—"}
          </div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            {stats?.passed ?? 0} Passed / {stats?.failed ?? 0} Failed
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
            GPA 5.00 (A+)
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300 mt-0.5">
            {stats?.gpa5_count ?? (stats?.grade_distribution?.["A+"] ?? 0)}
          </div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">Outstanding (Golden) standard</span>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40">
          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">
            A &amp; A- Grades
          </span>
          <div className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-300 mt-0.5">
            {(stats?.grade_distribution?.["A"] ?? 0) + (stats?.grade_distribution?.["A-"] ?? 0)}
          </div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">Above 60% mark benchmark</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/60">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <TableSearch
            value={search}
            onChange={setSearch}
            placeholder="Search student, roll, exam, subject..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-xs border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#707E94]/30"
          >
            <option value="all">All Classes</option>
            {classesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Exam Filter */}
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="text-xs border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#707E94]/30"
          >
            <option value="all">All Exams</option>
            {examsList.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
              </option>
            ))}
          </select>

          {/* Bangladesh Grade Filter */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="text-xs border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#707E94]/30"
          >
            <option value="all">All Grades</option>
            <option value="A+">Grade A+ (80-100%)</option>
            <option value="A">Grade A (70-79%)</option>
            <option value="A-">Grade A- (60-69%)</option>
            <option value="B">Grade B (50-59%)</option>
            <option value="C">Grade C (40-49%)</option>
            <option value="D">Grade D (33-39%)</option>
            <option value="F">Grade F (Fail)</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#707E94]/30"
          >
            <option value="all">All Status</option>
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700/60 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 font-semibold border-b border-gray-200 dark:border-gray-700">
              <th className="py-3 px-3">Student</th>
              <th className="py-3 px-3 hidden md:table-cell">Class</th>
              <th className="py-3 px-3 hidden sm:table-cell">Subject</th>
              <th className="py-3 px-3 hidden lg:table-cell">Assessment</th>
              <th className="py-3 px-3 text-center">Marks</th>
              <th className="py-3 px-3 text-center">BD Grade</th>
              <th className="py-3 px-3 text-center hidden md:table-cell">Point (GP)</th>
              <th className="py-3 px-3 text-center hidden sm:table-cell">Status</th>
              <th className="py-3 px-3 text-center">Result Sheet</th>
              <th className="py-3 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-gray-800 dark:text-gray-200">
            {loading ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-7 h-7 border-3 border-[#707E94] border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading Bangladesh results...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-rose-500">
                  <p>{error}</p>
                  <button onClick={fetchResults} className="mt-2 text-xs text-[#707E94] underline">
                    Try reloading
                  </button>
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-gray-400">
                  No results found matching your criteria.
                </td>
              </tr>
            ) : (
              results.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-primary-50/40 dark:hover:bg-[#1a2332] transition even:bg-slate-50/40 dark:even:bg-gray-800/40"
                >
                  {/* Student Name & Roll */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#707E94]/15 dark:bg-[#707E94]/20 flex items-center justify-center text-xs font-bold text-[#707E94] dark:text-[#a4b3c7] overflow-hidden flex-shrink-0">
                        {item.student_img ? (
                          <img src={item.student_img} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{(item.student_name?.[0] || "S").toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {item.student_name} {item.student_surname}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Roll: <span className="font-medium text-gray-600 dark:text-gray-300">{item.student_roll || item.student_id}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Class */}
                  <td className="py-3 px-3 hidden md:table-cell text-gray-600 dark:text-gray-300 font-medium">
                    {item.class_name || "—"}
                  </td>

                  {/* Subject */}
                  <td className="py-3 px-3 hidden sm:table-cell font-medium text-gray-900 dark:text-gray-100">
                    {item.subject_name || "General"}
                  </td>

                  {/* Assessment Type */}
                  <td className="py-3 px-3 hidden lg:table-cell">
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.exam_id ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      }`}>
                        {item.exam_id ? "Exam" : "Assignment"}
                      </span>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[140px] mt-0.5">
                        {item.exam_title || item.assignment_title || "Standard Evaluation"}
                      </p>
                    </div>
                  </td>

                  {/* Score */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-black text-gray-900 dark:text-gray-100 text-sm">
                      {item.score}
                    </span>
                    <span className="text-[10px] text-gray-400 block">
                      /{item.total_marks || 100}
                    </span>
                  </td>

                  {/* Bangladesh Grade Badge */}
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-black border ${getGradeBadge(item.grade)}`}>
                      {item.grade}
                    </span>
                  </td>

                  {/* Point (GP) */}
                  <td className="py-3 px-3 text-center hidden md:table-cell font-bold text-gray-800 dark:text-gray-200">
                    {Number(item.point || 0).toFixed(2)}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 text-center hidden sm:table-cell">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.status === "Passed"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                    }`}>
                      {item.status}
                    </span>
                  </td>

                  {/* Generate / View Result Sheet Action */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleOpenResultSheet(item.student_id, item.exam_id)}
                      title="View Official Bangladesh Result Sheet (Marksheet)"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-primary-100 hover:bg-primary-200 text-[#707E94] dark:bg-[#243044] dark:hover:bg-[#1a2332] dark:text-[#a4b3c7] transition cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <svg className="w-3.5 h-3.5 text-[#707E94] dark:text-[#a4b3c7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Sheet</span>
                    </button>
                  </td>

                  {/* Edit / Delete Actions */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {(role === "admin" || role === "teacher") && (
                        <FormModal table="result" type="update" data={item} onSuccess={fetchResults} />
                      )}
                      {role === "admin" && (
                        <FormModal table="result" type="delete" id={item.id} onSuccess={fetchResults} />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={pagination.pages}
        onPageChange={setPage}
        total={pagination.total}
        limit={limit}
      />

      {/* Bangladesh Result Sheet Modal */}
      <ResultSheetModal
        isOpen={sheetModalOpen}
        onClose={() => setSheetModalOpen(false)}
        studentId={activeStudentForSheet}
        examId={activeExamForSheet}
        availableExams={examsList}
        availableStudents={studentsList}
      />

      {/* Class Tabulation Sheet (Broad Sheet) Modal */}
      <TabulationSheetModal
        isOpen={tabulationModalOpen}
        onClose={() => setTabulationModalOpen(false)}
        classes={classesList}
        exams={examsList}
        initialClassId={selectedClass !== "all" ? selectedClass : classesList[0]?.id}
        initialExamId={selectedExam !== "all" ? selectedExam : examsList[0]?.id}
      />

      {/* Bulk Marks Entry Modal */}
      <BulkResultEntryModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        classes={classesList}
        exams={examsList}
        onSuccess={fetchResults}
      />

      {/* Bangladesh Grading Scale Modal */}
      <GradingScaleModal
        isOpen={scaleModalOpen}
        onClose={() => setScaleModalOpen(false)}
      />

    </div>
  );
};

export default ResultsPage;
