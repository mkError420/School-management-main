import React, { useMemo, useState } from "react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import StudentIdCard, {
  STUDENT_CARD_THEMES,
  StudentCardData,
  StudentCardThemeId,
} from "@/components/students/StudentIdCard";
import {
  CheckSquare,
  CreditCard,
  Printer,
  Search,
  Square,
  Users,
  X,
} from "lucide-react";

export interface StudentBatchIdCardModalProps {
  students: StudentCardData[];
  onClose: () => void;
}

export const StudentBatchIdCardModal: React.FC<StudentBatchIdCardModalProps> = ({
  students,
  onClose,
}) => {
  const { siteLogoUrl, websiteContent } = useSiteSettings();

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(() =>
    students.map((s) => s.id)
  );
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [orientation, setOrientation] = useState<"landscape" | "portrait">(
    "landscape"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTheme, setSelectedTheme] =
    useState<StudentCardThemeId>("bd-green");
  const [printSide, setPrintSide] = useState<"front" | "back" | "both">("both");
  const [validityYear, setValidityYear] = useState<string>("2026 – 2027");
  const [showStamp, setShowStamp] = useState<boolean>(true);

  const schoolInfo = {
    schoolName:
      websiteContent?.schoolName || "MK Government Model High School & College",
    schoolNameBn:
      websiteContent?.schoolNameBn || "এম. কে. সরকারি মডেল স্কুল এন্ড কলেজ",
    eiin: websiteContent?.eiin || "123456",
    schoolCode: websiteContent?.schoolCode || "1001",
    establishedYear: websiteContent?.establishedYear || "1985",
    address:
      websiteContent?.address ||
      websiteContent?.addressEn ||
      "College Road, Dhanmondi, Dhaka-1205, Bangladesh",
    phone: websiteContent?.phone || "+880 2 1234 5678",
    email: websiteContent?.email || "info@mkschool.edu.bd",
    logo: siteLogoUrl,
  };

  // Distinct classes
  const classOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.class_name) set.add(s.class_name);
    });
    return Array.from(set);
  }, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchClass =
        classFilter === "ALL" || s.class_name === classFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        `${s.name} ${s.surname || ""}`.toLowerCase().includes(q) ||
        (s.id || "").toLowerCase().includes(q) ||
        (s.roll || "").toLowerCase().includes(q) ||
        (s.class_name || "").toLowerCase().includes(q);
      return matchClass && matchSearch;
    });
  }, [students, classFilter, searchQuery]);

  // Toggle selection
  const handleToggleSelectAll = () => {
    const visibleIds = filteredStudents.map((s) => s.id);
    const allSelected = visibleIds.every((id) => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds((prev) =>
        prev.filter((id) => !visibleIds.includes(id))
      );
    } else {
      setSelectedStudentIds((prev) =>
        Array.from(new Set([...prev, ...visibleIds]))
      );
    }
  };

  const handleToggleOne = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const studentsToPrint = useMemo(() => {
    return students.filter((s) => selectedStudentIds.includes(s.id));
  }, [students, selectedStudentIds]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-6xl w-full p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[95vh] flex flex-col justify-between my-auto">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <Users size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                  Bulk Student ID Card Printing
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold font-mono">
                  CR80: 85.6 mm × 54 mm
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Generate official Bangladesh format ID cards for selected students or the entire class at once
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* TOOLBAR CONTROLS */}
        <div className="py-3 border-b border-gray-100 dark:border-gray-700/80 grid grid-cols-1 md:grid-cols-12 gap-2.5 text-xs items-center">
          {/* Orientation Toggle */}
          <div className="md:col-span-3 flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
            <button
              onClick={() => setOrientation("landscape")}
              className={`flex-1 py-1.5 px-1.5 rounded-lg font-bold text-[11px] transition ${
                orientation === "landscape"
                  ? "bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Landscape
            </button>
            <button
              onClick={() => setOrientation("portrait")}
              className={`flex-1 py-1.5 px-1.5 rounded-lg font-bold text-[11px] transition ${
                orientation === "portrait"
                  ? "bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Portrait
            </button>
          </div>

          {/* Search */}
          <div className="md:col-span-3 relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by name, roll, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none text-[11px]"
            />
          </div>

          {/* Class Filter */}
          <div className="md:col-span-3">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5 text-[11px] font-medium"
            >
              <option value="ALL">All Classes ({students.length})</option>
              {classOptions.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Theme & Side */}
          <div className="md:col-span-3 flex items-center gap-1.5">
            <select
              value={selectedTheme}
              onChange={(e) =>
                setSelectedTheme(e.target.value as StudentCardThemeId)
              }
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-1.5 text-[11px] font-medium"
            >
              {Object.values(STUDENT_CARD_THEMES).map((thm) => (
                <option key={thm.id} value={thm.id}>
                  {thm.nameBn}
                </option>
              ))}
            </select>

            <select
              value={printSide}
              onChange={(e) =>
                setPrintSide(e.target.value as "front" | "back" | "both")
              }
              className="w-28 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-1.5 py-1.5 text-[11px] font-medium"
            >
              <option value="both">Both</option>
              <option value="front">Front</option>
              <option value="back">Back</option>
            </select>
          </div>
        </div>

        {/* STUDENT SELECTION PILLS BAR */}
        <div className="py-2 px-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs my-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 hover:underline text-[11px]"
            >
              {filteredStudents.every((s) => selectedStudentIds.includes(s.id)) ? (
                <CheckSquare size={14} />
              ) : (
                <Square size={14} />
              )}
              <span>Select All ({filteredStudents.length})</span>
            </button>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600 dark:text-gray-400 font-semibold text-[11px]">
              To Print:{" "}
              <strong className="text-emerald-700 dark:text-emerald-300">
                {selectedStudentIds.length}
              </strong>{" "}
              of {students.length} students
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <input
              type="text"
              value={validityYear}
              onChange={(e) => setValidityYear(e.target.value)}
              className="w-24 px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] font-mono font-bold"
              placeholder="2026-2027"
              title="Academic Session / Validity"
            />
            <label className="flex items-center gap-1 cursor-pointer select-none font-medium text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={showStamp}
                onChange={(e) => setShowStamp(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-emerald-600"
              />
              <span>Seal</span>
            </label>
          </div>
        </div>

        {/* CARD GRID / PRINT PREVIEW AREA */}
        <div className="id-card-print-container my-2 p-4 overflow-y-auto max-h-[55vh] bg-gray-100/70 dark:bg-gray-900/50 rounded-2xl border border-gray-200/80 dark:border-gray-700">
          {studentsToPrint.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-xs">
              No students selected. Please select at least one student to generate ID cards.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start justify-items-center">
              {studentsToPrint.map((studentItem) => (
                <div
                  key={studentItem.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 relative flex flex-col items-center gap-3 w-full max-w-[700px]"
                >
                  {/* Item selection checkbox header */}
                  <div className="w-full flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700 text-xs print:hidden">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800 dark:text-gray-200">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(studentItem.id)}
                        onChange={() => handleToggleOne(studentItem.id)}
                        className="w-4 h-4 rounded text-emerald-600"
                      />
                      <span>
                        {studentItem.name} {studentItem.surname || ""}
                      </span>
                      <span className="text-[11px] font-normal text-gray-400 font-mono">
                        (Roll: {studentItem.roll || "—"})
                      </span>
                    </label>

                    <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 font-medium">
                      {studentItem.class_name || "Student"}
                    </span>
                  </div>

                  {/* Render Side(s) */}
                  <div className="flex flex-wrap items-center justify-center gap-4 py-2">
                    {(printSide === "front" || printSide === "both") && (
                      <div className="relative p-1 border border-dashed border-gray-300 rounded-2xl">
                        <div className="absolute -top-2.5 left-4 px-1.5 py-0.2 bg-gray-200 text-gray-600 text-[8px] font-mono rounded print:hidden">
                          FRONT
                        </div>
                        <StudentIdCard
                          student={studentItem}
                          side="front"
                          orientation={orientation}
                          theme={selectedTheme}
                          validityYear={validityYear}
                          schoolInfo={schoolInfo}
                          showStamp={showStamp}
                        />
                      </div>
                    )}

                    {(printSide === "back" || printSide === "both") && (
                      <div className="relative p-1 border border-dashed border-gray-300 rounded-2xl">
                        <div className="absolute -top-2.5 left-4 px-1.5 py-0.2 bg-gray-200 text-gray-600 text-[8px] font-mono rounded print:hidden">
                          BACK
                        </div>
                        <StudentIdCard
                          student={studentItem}
                          side="back"
                          orientation={orientation}
                          theme={selectedTheme}
                          validityYear={validityYear}
                          schoolInfo={schoolInfo}
                          showStamp={showStamp}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs">
          <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 text-[11px]">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              Bulk CR80 Standard Output
            </span>
            <span>• Ready for double-sided sheet or individual card printers</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold transition"
            >
              Cancel
            </button>

            <button
              onClick={handlePrint}
              disabled={studentsToPrint.length === 0}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <Printer size={15} />
              <span>Print {studentsToPrint.length} ID Cards</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentBatchIdCardModal;

