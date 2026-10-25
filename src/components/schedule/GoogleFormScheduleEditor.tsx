import React, { useState } from "react";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Clock3,
  FileText,
  GraduationCap,
  HelpCircle,
  Info,
  Layers,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import type { LessonDraft } from "@/pages/ClassSchedulePage";

export interface GoogleFormScheduleEditorProps {
  lessonDraft: LessonDraft;
  setLessonDraft: React.Dispatch<React.SetStateAction<LessonDraft>>;
  classes: Array<{ id: string | number; name: string }>;
  teachers: Array<{ id: string; name: string; surname: string }>;
  subjects: Array<{ id: string | number; name: string }>;
  editingLessonId: number | null;
  savingLesson: boolean;
  formError: string | null;
  formSuccess?: string | null;
  onSave: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onCancel?: () => void;
  onReset?: () => void;
  isModal?: boolean;
}

const ALL_DAYS = [
  { key: "SUNDAY", label: "Sunday", short: "Sun" },
  { key: "MONDAY", label: "Monday", short: "Mon" },
  { key: "TUESDAY", label: "Tuesday", short: "Tue" },
  { key: "WEDNESDAY", label: "Wednesday", short: "Wed" },
  { key: "THURSDAY", label: "Thursday", short: "Thu" },
  { key: "FRIDAY", label: "Friday", short: "Fri" },
  { key: "SATURDAY", label: "Saturday", short: "Sat" },
];

const formatTime12h = (time: string): string => {
  if (!time) return "";
  const [hStr, mStr] = time.split(":");
  let h = parseInt(hStr, 10) || 0;
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
};

const calculateDuration = (startVal: string, endVal: string): number => {
  if (!startVal || !endVal) return 0;
  const [sh, sm] = startVal.split(":").map(Number);
  const [eh, em] = endVal.split(":").map(Number);
  const startMins = (sh || 0) * 60 + (sm || 0);
  const endMins = (eh || 0) * 60 + (em || 0);
  return Math.max(0, endMins - startMins);
};

export const GoogleFormScheduleEditor: React.FC<GoogleFormScheduleEditorProps> = ({
  lessonDraft,
  setLessonDraft,
  classes,
  teachers,
  subjects,
  editingLessonId,
  savingLesson,
  formError,
  formSuccess,
  onSave,
  onCancel,
  onReset,
  isModal = false,
}) => {
  const [activeCard, setActiveCard] = useState<string>("title");

  const duration = calculateDuration(lessonDraft.start_time, lessonDraft.end_time);
  const isTimeInvalid = lessonDraft.end_time <= lessonDraft.start_time;

  const getCardClasses = (cardId: string) => {
    const isActive = activeCard === cardId;
    return `relative rounded-xl border bg-white dark:bg-gray-900 p-5 sm:p-6 transition-all duration-200 ${
      isActive
        ? "border-l-[6px] border-l-[#673ab7] dark:border-l-purple-500 border-gray-300 dark:border-gray-700 shadow-md ring-1 ring-purple-100 dark:ring-purple-950/40"
        : "border-l-[6px] border-l-transparent border-gray-200 dark:border-gray-800 shadow-xs hover:border-gray-300 dark:hover:border-gray-700"
    }`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Top Banner & Header Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        {/* Iconic Google Form Purple Accent Top Bar */}
        <div className="h-3.5 bg-gradient-to-r from-[#673ab7] via-[#7e57c2] to-[#512da8]" />

        <div className="p-6 sm:p-7 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              <Sparkles size={13} className="text-purple-600 dark:text-purple-400" />
              Academic Class Routine Form
            </span>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
              {editingLessonId ? "Editing Active Routine" : "New Routine Entry"}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {editingLessonId ? "Edit Class Schedule Options" : "Class Schedule Options"}
          </h2>

          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Configure weekly classroom routine options, class section, curriculum subject, assigned teacher, and timetable slots.
            Changes sync automatically with the live master schedule and student portal.
          </p>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-red-500 font-medium flex items-center gap-1">
              * Indicates required question
            </span>
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-500" />
              Auto-saves to database
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification if any */}
      {formSuccess && (
        <div
          role="status"
          className="rounded-xl border border-emerald-300 bg-emerald-50 dark:border-emerald-800/80 dark:bg-emerald-950/40 p-4 text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-3 shadow-xs animate-in fade-in"
        >
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="flex-1">
            <p className="font-semibold">Schedule Saved Successfully</p>
            <p className="text-xs mt-0.5 text-emerald-700 dark:text-emerald-300">{formSuccess}</p>
          </div>
        </div>
      )}

      {/* Error Notification if any */}
      {formError && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 p-4 text-xs sm:text-sm text-red-700 dark:text-red-300 flex items-center gap-3 shadow-xs animate-in fade-in"
        >
          <AlertCircle size={18} className="shrink-0 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <p className="font-semibold">Unable to Save Schedule</p>
            <p className="text-xs mt-0.5">{formError}</p>
          </div>
        </div>
      )}

      {/* FORM BODY */}
      <form onSubmit={onSave} className="space-y-4">
        {/* QUESTION 1: Lesson / Topic Title (Short Answer) */}
        <section
          className={getCardClasses("title")}
          onClick={() => setActiveCard("title")}
        >
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <label className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              Lesson / Topic Title <span className="text-red-500">*</span>
            </label>
            <span className="rounded-md bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300 uppercase">
              Short Answer
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Enter the formal course lecture or routine title (e.g., Mathematics 101, Advanced Chemistry, English Literature).
          </p>

          <div className="relative">
            <input
              required
              maxLength={255}
              placeholder="Your answer"
              value={lessonDraft.name}
              onFocus={() => setActiveCard("title")}
              onChange={(e) => setLessonDraft({ ...lessonDraft, name: e.target.value })}
              className="w-full bg-transparent border-b-2 border-gray-300 dark:border-gray-700 py-2 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#673ab7] dark:focus:border-purple-400 transition"
            />
          </div>
        </section>

        {/* QUESTION 2: Day of the Week (Multiple Choice) */}
        <section
          className={getCardClasses("day")}
          onClick={() => setActiveCard("day")}
        >
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <label className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              Day of the Week <span className="text-red-500">*</span>
            </label>
            <span className="rounded-md bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300 uppercase">
              Multiple Choice
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3.5">
            Select which school day this recurring lesson period takes place every week.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ALL_DAYS.map((day) => {
              const isSelected = lessonDraft.day.toUpperCase() === day.key;
              return (
                <label
                  key={day.key}
                  onClick={() => {
                    setActiveCard("day");
                    setLessonDraft({ ...lessonDraft, day: day.key });
                  }}
                  className={`group flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? "border-[#673ab7] bg-purple-50/50 dark:bg-purple-950/20 shadow-xs"
                      : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  {/* Authentic Google Form Radio Button */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                      isSelected
                        ? "border-[#673ab7] dark:border-purple-400"
                        : "border-gray-400 dark:border-gray-500 group-hover:border-[#673ab7]"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#673ab7] dark:bg-purple-400 animate-in zoom-in" />
                    )}
                  </div>

                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs sm:text-sm font-medium ${
                        isSelected
                          ? "text-[#673ab7] dark:text-purple-300 font-semibold"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {day.label}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase font-mono">{day.short}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        {/* QUESTION 3: Academic Class / Cohort (Dropdown / Selection) */}
        <section
          className={getCardClasses("class")}
          onClick={() => setActiveCard("class")}
        >
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <label className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              Target Class / Cohort <span className="text-red-500">*</span>
            </label>
            <span className="rounded-md bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300 uppercase">
              Dropdown
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3.5">
            Select the designated student classroom or cohort section assigned to this lecture.
          </p>

          <div className="relative">
            <select
              required
              value={lessonDraft.class_id}
              onFocus={() => setActiveCard("class")}
              onChange={(e) => setLessonDraft({ ...lessonDraft, class_id: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-[#673ab7] dark:focus:border-purple-400 transition"
            >
              <option value="">Choose Class / Section...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* QUESTION 4: Subject Discipline (Dropdown / Selection) */}
        <section
          className={getCardClasses("subject")}
          onClick={() => setActiveCard("subject")}
        >
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <label className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              Curriculum Subject <span className="text-red-500">*</span>
            </label>
            <span className="rounded-md bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300 uppercase">
              Dropdown
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3.5">
            Select the approved curriculum subject discipline to be taught.
          </p>

          <div className="relative">
            <select
              required
              value={lessonDraft.subject_id}
              onFocus={() => setActiveCard("subject")}
              onChange={(e) => setLessonDraft({ ...lessonDraft, subject_id: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-[#673ab7] dark:focus:border-purple-400 transition"
            >
              <option value="">Choose Academic Subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* QUESTION 5: Assigned Teacher / Instructor (Dropdown / Selection) */}
        <section
          className={getCardClasses("teacher")}
          onClick={() => setActiveCard("teacher")}
        >
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <label className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              Assigned Teacher / Instructor <span className="text-red-500">*</span>
            </label>
            <span className="rounded-md bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300 uppercase">
              Dropdown
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3.5">
            Allocate the faculty instructor responsible for leading this class session.
          </p>

          <div className="relative">
            <select
              required
              value={lessonDraft.teacher_id}
              onFocus={() => setActiveCard("teacher")}
              onChange={(e) => setLessonDraft({ ...lessonDraft, teacher_id: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-[#673ab7] dark:focus:border-purple-400 transition"
            >
              <option value="">Choose Instructor / Teacher...</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.surname}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* QUESTION 6: Class Schedule Timing (Time Block) */}
        <section
          className={getCardClasses("timing")}
          onClick={() => setActiveCard("timing")}
        >
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <label className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              Class Period Timing (Start & End Time) <span className="text-red-500">*</span>
            </label>
            <span className="rounded-md bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300 uppercase">
              Time
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3.5">
            Specify the starting time and concluding time for this lesson. Duration calculates automatically.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Start Time
              </span>
              <input
                required
                type="time"
                value={lessonDraft.start_time}
                onFocus={() => setActiveCard("timing")}
                onChange={(e) => setLessonDraft({ ...lessonDraft, start_time: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-[#673ab7] dark:focus:border-purple-400 transition"
              />
            </div>

            <div>
              <span className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                End Time
              </span>
              <input
                required
                type="time"
                value={lessonDraft.end_time}
                onFocus={() => setActiveCard("timing")}
                onChange={(e) => setLessonDraft({ ...lessonDraft, end_time: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-[#673ab7] dark:focus:border-purple-400 transition"
              />
            </div>
          </div>

          {/* Timing preview and validation */}
          <div className="mt-3.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
              <Clock3 size={14} className="text-[#673ab7] dark:text-purple-400" />
              <span>Routine Window:</span>
              <strong className="text-gray-900 dark:text-white">
                {formatTime12h(lessonDraft.start_time)} – {formatTime12h(lessonDraft.end_time)}
              </strong>
            </span>

            {isTimeInvalid ? (
              <span className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle size={13} />
                End time must be after start time
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold rounded-md bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 text-purple-800 dark:text-purple-300">
                {duration} minutes
              </span>
            )}
          </div>
        </section>

        {/* BOTTOM ACTION BAR */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Google Form Signature Submit Button */}
            <button
              type="submit"
              disabled={savingLesson || isTimeInvalid}
              className="inline-flex items-center gap-2 rounded-lg bg-[#673ab7] hover:bg-[#5e35b1] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:shadow disabled:opacity-50"
            >
              <Send size={15} />
              <span>
                {savingLesson
                  ? "Submitting..."
                  : editingLessonId
                  ? "Update Schedule"
                  : "Submit Schedule"}
              </span>
            </button>

            {/* Clear Form Button */}
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                disabled={savingLesson}
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#673ab7] dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition"
              >
                <RotateCcw size={14} />
                <span>Clear form</span>
              </button>
            )}
          </div>

          {isModal && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={savingLesson}
              className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Close
            </button>
          )}
        </div>

        {/* Google Form Watermark / Notice */}
        <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 pt-2 pb-4">
          Never submit passwords through Google Forms. · School Timetable Management System
        </p>
      </form>
    </div>
  );
};

export default GoogleFormScheduleEditor;
