import React, { useMemo, useState } from "react";
import { StaffMember, StaffType } from "@/types/staff";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import StaffIdCard, {
  CARD_THEMES,
  CardThemeId,
} from "@/components/staff/StaffIdCard";
import {
  Check,
  CheckSquare,
  CreditCard,
  Filter,
  Grid,
  Layers,
  Palette,
  Printer,
  Search,
  Square,
  Users,
  X,
} from "lucide-react";

export interface StaffBatchIdCardModalProps {
  staffList: StaffMember[];
  onClose: () => void;
}

export const StaffBatchIdCardModal: React.FC<StaffBatchIdCardModalProps> = ({
  staffList,
  onClose,
}) => {
  const { siteLogoUrl, websiteContent } = useSiteSettings();

  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(() =>
    staffList.map((s) => s.id)
  );
  const [typeFilter, setTypeFilter] = useState<"ALL" | StaffType>("ALL");
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTheme, setSelectedTheme] = useState<CardThemeId>("bd-green");
  const [printSide, setPrintSide] = useState<"front" | "back" | "both">("both");
  const [validityYear, setValidityYear] = useState<string>("2026 – 2028");
  const [showStamp, setShowStamp] = useState<boolean>(true);
  const [cardsPerPage, setCardsPerPage] = useState<4 | 6>(4);

  const schoolInfo = {
    schoolName: websiteContent?.schoolName || "MK Government Model High School",
    schoolNameBn: websiteContent?.schoolNameBn || "এম. কে. সরকারি মডেল উচ্চ বিদ্যালয়",
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

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchType = typeFilter === "ALL" || s.type === typeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        `${s.name} ${s.surname}`.toLowerCase().includes(q) ||
        (s.staff_no || "").toLowerCase().includes(q) ||
        (s.designation || "").toLowerCase().includes(q) ||
        (s.department || "").toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [staffList, typeFilter, searchQuery]);

  // Toggle selection
  const handleToggleSelectAll = () => {
    const visibleIds = filteredStaff.map((s) => s.id);
    const allSelected = visibleIds.every((id) => selectedStaffIds.includes(id));
    if (allSelected) {
      setSelectedStaffIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedStaffIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleOne = (id: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // The actual staff members to print
  const staffToPrint = useMemo(() => {
    return staffList.filter((s) => selectedStaffIds.includes(s.id));
  }, [staffList, selectedStaffIds]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-6xl w-full p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[95vh] flex flex-col justify-between my-auto">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 text-white shadow-md shadow-emerald-500/20">
              <Users size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                  Bulk / Batch Staff ID Card Printing
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold font-mono">
                  CR80: 85.6 mm × 54 mm (3.375" × 2.125")
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Generate official Bangladesh format ID cards for all faculty and staff members at once
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
              Landscape (85.6×54)
            </button>
            <button
              onClick={() => setOrientation("portrait")}
              className={`flex-1 py-1.5 px-1.5 rounded-lg font-bold text-[11px] transition ${
                orientation === "portrait"
                  ? "bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Portrait (54×85.6)
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
              placeholder="Filter by name, ID, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none text-[11px]"
            />
          </div>

          {/* Type Filter */}
          <div className="md:col-span-3 flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`flex-1 py-1 px-1 rounded-lg font-bold text-[10.5px] transition ${
                typeFilter === "ALL"
                  ? "bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All ({staffList.length})
            </button>
            <button
              onClick={() => setTypeFilter("TEACHING")}
              className={`flex-1 py-1 px-1 rounded-lg font-bold text-[10.5px] transition ${
                typeFilter === "TEACHING"
                  ? "bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Teachers
            </button>
            <button
              onClick={() => setTypeFilter("ADMINISTRATIVE")}
              className={`flex-1 py-1 px-1 rounded-lg font-bold text-[10.5px] transition ${
                typeFilter === "ADMINISTRATIVE"
                  ? "bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => setTypeFilter("SUPPORT")}
              className={`flex-1 py-1 px-1 rounded-lg font-bold text-[10.5px] transition ${
                typeFilter === "SUPPORT"
                  ? "bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Support
            </button>
          </div>

          {/* Theme & Side */}
          <div className="md:col-span-3 flex items-center gap-1.5">
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value as CardThemeId)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-1.5 text-[11px] font-medium"
            >
              {Object.values(CARD_THEMES).map((thm) => (
                <option key={thm.id} value={thm.id}>
                  {thm.nameBn}
                </option>
              ))}
            </select>

            <select
              value={printSide}
              onChange={(e) => setPrintSide(e.target.value as "front" | "back" | "both")}
              className="w-28 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-1.5 py-1.5 text-[11px] font-medium"
            >
              <option value="both">Both</option>
              <option value="front">Front</option>
              <option value="back">Back</option>
            </select>
          </div>
        </div>

        {/* STAFF SELECTION PILLS BAR */}
        <div className="py-2 px-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs my-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 hover:underline text-[11px]"
            >
              {filteredStaff.every((s) => selectedStaffIds.includes(s.id)) ? (
                <CheckSquare size={14} />
              ) : (
                <Square size={14} />
              )}
              <span>Select All ({filteredStaff.length})</span>
            </button>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600 dark:text-gray-400 font-semibold text-[11px]">
              To Print:{" "}
              <strong className="text-emerald-700 dark:text-emerald-300">
                {selectedStaffIds.length}
              </strong>{" "}
              of {staffList.length} staff
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <input
              type="text"
              value={validityYear}
              onChange={(e) => setValidityYear(e.target.value)}
              className="w-24 px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] font-mono font-bold"
              placeholder="2026-2028"
            />
            <label className="flex items-center gap-1 cursor-pointer select-none font-medium text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={showStamp}
                onChange={(e) => setShowStamp(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-emerald-600"
              />
              <span>Stamp</span>
            </label>
          </div>
        </div>

        {/* CARD GRID / PRINT PREVIEW AREA */}
        <div className="id-card-print-container my-2 p-4 overflow-y-auto max-h-[55vh] bg-gray-100/70 dark:bg-gray-900/50 rounded-2xl border border-gray-200/80 dark:border-gray-700">
          {staffToPrint.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-xs">
              No staff members selected. Please select at least one staff member to generate ID cards.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start justify-items-center">
              {staffToPrint.map((staffItem) => (
                <div
                  key={staffItem.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 relative flex flex-col items-center gap-3 w-full max-w-[700px]"
                >
                  {/* Item selection checkbox header */}
                  <div className="w-full flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700 text-xs print:hidden">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800 dark:text-gray-200">
                      <input
                        type="checkbox"
                        checked={selectedStaffIds.includes(staffItem.id)}
                        onChange={() => handleToggleOne(staffItem.id)}
                        className="w-4 h-4 rounded text-emerald-600"
                      />
                      <span>
                        {staffItem.name} {staffItem.surname}
                      </span>
                      <span className="text-[11px] font-normal text-gray-400 font-mono">
                        ({staffItem.staff_no})
                      </span>
                    </label>

                    <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 font-medium">
                      {staffItem.designation}
                    </span>
                  </div>

                  {/* Render Side(s) with dashed cut-mark borders for physical trimming */}
                  <div className="flex flex-wrap items-center justify-center gap-4 py-2">
                    {/* Front Side */}
                    {(printSide === "front" || printSide === "both") && (
                      <div className="relative p-1 border border-dashed border-gray-300 rounded-2xl">
                        <div className="absolute -top-2.5 left-4 px-1.5 py-0.2 bg-gray-200 text-gray-600 text-[8px] font-mono rounded print:hidden">
                          FRONT
                        </div>
                        <StaffIdCard
                          staff={staffItem}
                          side="front"
                          orientation={orientation}
                          theme={selectedTheme}
                          validityYear={validityYear}
                          schoolInfo={schoolInfo}
                          showStamp={showStamp}
                        />
                      </div>
                    )}

                    {/* Back Side */}
                    {(printSide === "back" || printSide === "both") && (
                      <div className="relative p-1 border border-dashed border-gray-300 rounded-2xl">
                        <div className="absolute -top-2.5 left-4 px-1.5 py-0.2 bg-gray-200 text-gray-600 text-[8px] font-mono rounded print:hidden">
                          BACK
                        </div>
                        <StaffIdCard
                          staff={staffItem}
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
          <div className="text-gray-500 dark:text-gray-400 text-[11px]">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              Standard Physical Size (CR80): 85.6 mm × 54 mm (or 3.375 in × 2.125 in)
            </span>
            {" • "}Select <strong>"A4"</strong> paper and enable <strong>"Background graphics"</strong> in print dialog.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={staffToPrint.length === 0}
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <Printer size={15} />
              <span>
                Print {staffToPrint.length} ID Card
                {staffToPrint.length === 1 ? "" : "s"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffBatchIdCardModal;
