import React, { useEffect, useMemo, useState } from "react";
import { Calendar, momentLocalizer, type View, Views } from "react-big-calendar";
import moment from "moment";
import { BookOpen, CalendarDays, Clock3, GraduationCap, Pencil, Plus, Save, Trash2, UsersRound, X } from "lucide-react";
import { api } from "@/lib/api";
import { hasAdminAccess, useAuth } from "@/context/AuthContext";
import "react-big-calendar/lib/css/react-big-calendar.css";

type ScheduleLesson = {
  id: number;
  class_id: string | number;
  teacher_id: string;
  subject_id: string | number;
  title: string;
  day: string;
  start_time: string;
  end_time: string;
  subject_name?: string;
  class_name?: string;
  teacher_name?: string;
  teacher_surname?: string;
};

type ScheduleChild = {
  id: string;
  name: string;
  surname: string;
  class_id: string | number;
  class_name?: string;
};

type ScheduleEvent = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  subject: string;
  className: string;
  teacherName: string;
  lesson: ScheduleLesson;
};

type LessonDraft = {
  name: string;
  day: string;
  start_time: string;
  end_time: string;
  subject_id: string;
  class_id: string;
  teacher_id: string;
};

const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"];
const emptyLessonDraft: LessonDraft = {
  name: "",
  day: "MONDAY",
  start_time: "08:00",
  end_time: "09:00",
  subject_id: "",
  class_id: "",
  teacher_id: "",
};
const inputClass = "mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-800 outline-none focus:border-sky-600";

const localizer = momentLocalizer(moment);
const dayIndexes: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const timeOnDay = (date: Date, value: string) => {
  const timePart = String(value || "").replace("T", " ").split(" ").pop() || "00:00:00";
  const [hours = 0, minutes = 0] = timePart.split(":").map((part) => Number.parseInt(part, 10) || 0);
  return moment(date).hour(hours).minute(minutes).second(0).millisecond(0).toDate();
};

const timeInputValue = (value: string) => {
  const timePart = String(value || "").replace("T", " ").split(" ").pop() || "00:00";
  return timePart.slice(0, 5);
};

const ClassSchedulePage: React.FC = () => {
  const { role, user } = useAuth();
  const isAdmin = hasAdminAccess(role);
  const [schedule, setSchedule] = useState<ScheduleLesson[]>([]);
  const [children, setChildren] = useState<ScheduleChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [selectedTeacherId, setSelectedTeacherId] = useState("all");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<View>(Views.WEEK);
  const [selectedLesson, setSelectedLesson] = useState<ScheduleEvent | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [classes, setClasses] = useState<Array<{ id: string | number; name: string }>>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string; surname: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string | number; name: string }>>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [lessonDraft, setLessonDraft] = useState<LessonDraft>(emptyLessonDraft);
  const [savingLesson, setSavingLesson] = useState(false);
  const [deletingLesson, setDeletingLesson] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadSchedule = async () => {
      setLoading(true);
      setError(null);
      try {
        const dashboard = await api.getDashboard();
        if (!active) return;
        if (!dashboard.success) {
          setError(dashboard.message || "Unable to load the class schedule.");
          return;
        }
        setSchedule(Array.isArray(dashboard.data?.schedule) ? dashboard.data.schedule : []);

        if (role === "parent" && user?.id) {
          const profile = await api.getById<any>("parents", user.id);
          if (!active) return;
          if (!profile.success) {
            setError(profile.message || "Unable to load your children's profiles.");
            return;
          }
          const parentChildren = Array.isArray(profile.data?.children) ? profile.data.children : [];
          setChildren(parentChildren);
          setSelectedChildId((current) => current || parentChildren[0]?.id || "");
        }
      } catch {
        if (active) setError("Unable to reach the server. Try again.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadSchedule();
    return () => {
      active = false;
    };
  }, [role, user?.id, reloadKey]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    setLoadingOptions(true);
    Promise.all([
      api.getAll("classes", { page: 1, limit: 1000 }),
      api.getAll("teachers", { page: 1, limit: 1000 }),
      api.getAll("subjects", { page: 1, limit: 1000 }),
    ]).then(([classResponse, teacherResponse, subjectResponse]) => {
      if (!active) return;
      if (!classResponse.success || !teacherResponse.success || !subjectResponse.success) {
        setOptionsError(classResponse.message || teacherResponse.message || subjectResponse.message || "Unable to load schedule options.");
        return;
      }
      setClasses(classResponse.data?.classes || []);
      setTeachers(teacherResponse.data?.teachers || []);
      setSubjects(subjectResponse.data?.subjects || []);
      setOptionsError(null);
    }).catch(() => {
      if (active) setOptionsError("Unable to load classes, teachers, and subjects.");
    }).finally(() => {
      if (active) setLoadingOptions(false);
    });
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const classOptions = useMemo(() => {
    const options = new Map<string, string>();
    schedule.forEach((lesson) => options.set(String(lesson.class_id), lesson.class_name || `Class ${lesson.class_id}`));
    classes.forEach((item) => options.set(String(item.id), item.name));
    return Array.from(options, ([id, name]) => ({ id, name })).sort((left, right) => left.name.localeCompare(right.name));
  }, [classes, schedule]);

  const teacherOptions = useMemo(() => {
    return teachers.map((teacher) => ({ id: teacher.id, name: `${teacher.name} ${teacher.surname}`.trim() }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [teachers]);

  const visibleSchedule = useMemo(() => {
    let result = schedule;
    if (isAdmin && selectedClassId !== "all") result = result.filter((lesson) => String(lesson.class_id) === selectedClassId);
    if (isAdmin && selectedTeacherId !== "all") result = result.filter((lesson) => lesson.teacher_id === selectedTeacherId);
    if (role === "teacher" && selectedClassId !== "all") result = result.filter((lesson) => String(lesson.class_id) === selectedClassId);
    if (role === "parent") {
      const child = children.find((item) => item.id === selectedChildId);
      result = child ? result.filter((lesson) => String(lesson.class_id) === String(child.class_id)) : [];
    }
    return result;
  }, [children, isAdmin, role, schedule, selectedChildId, selectedClassId, selectedTeacherId]);

  const events = useMemo(() => {
    const weekStart = moment(calendarDate).startOf("week");
    return visibleSchedule.flatMap((lesson) => {
      const dayIndex = dayIndexes[String(lesson.day || "").toUpperCase()];
      if (dayIndex === undefined) return [];
      const day = weekStart.clone().add(dayIndex, "days").toDate();
      const subject = lesson.subject_name || lesson.title;
      const teacherName = [lesson.teacher_name, lesson.teacher_surname].filter(Boolean).join(" ");
      return [{
        id: lesson.id,
        title: [subject, lesson.class_name].filter(Boolean).join(" · "),
        start: timeOnDay(day, lesson.start_time),
        end: timeOnDay(day, lesson.end_time),
        subject,
        className: lesson.class_name || `Class ${lesson.class_id}`,
        teacherName,
        lesson,
      }];
    });
  }, [calendarDate, visibleSchedule]);

  const selectedChild = children.find((child) => child.id === selectedChildId);
  const title = role === "teacher" ? "My Teaching Schedule" : role === "student" ? "My Class Schedule" : role === "parent" ? "Child's Class Schedule" : "Class Schedule";

  const openNewLesson = () => {
    setEditingLessonId(null);
    setLessonDraft({
      ...emptyLessonDraft,
      class_id: selectedClassId === "all" ? String(classes[0]?.id || "") : selectedClassId,
      teacher_id: selectedTeacherId === "all" ? teachers[0]?.id || "" : selectedTeacherId,
      subject_id: String(subjects[0]?.id || ""),
    });
    setFormError(optionsError);
    setEditorOpen(true);
  };

  const openEditLesson = () => {
    if (!selectedLesson) return;
    const lesson = selectedLesson.lesson;
    setEditingLessonId(lesson.id);
    setLessonDraft({
      name: lesson.title,
      day: lesson.day,
      start_time: timeInputValue(lesson.start_time),
      end_time: timeInputValue(lesson.end_time),
      subject_id: String(lesson.subject_id),
      class_id: String(lesson.class_id),
      teacher_id: lesson.teacher_id,
    });
    setFormError(optionsError);
    setEditorOpen(true);
  };

  const saveLesson = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    if (!lessonDraft.name.trim() || !lessonDraft.class_id || !lessonDraft.teacher_id || !lessonDraft.subject_id) {
      setFormError("Complete every schedule field before saving.");
      return;
    }
    if (lessonDraft.end_time <= lessonDraft.start_time) {
      setFormError("End time must be later than start time.");
      return;
    }

    setSavingLesson(true);
    const date = moment(calendarDate).format("YYYY-MM-DD");
    const payload = {
      ...lessonDraft,
      name: lessonDraft.name.trim(),
      start_time: `${date} ${lessonDraft.start_time}:00`,
      end_time: `${date} ${lessonDraft.end_time}:00`,
    };
    try {
      const response = editingLessonId
        ? await api.update("lessons", editingLessonId, payload)
        : await api.create("lessons", payload);
      if (!response.success) {
        setFormError(response.message || "Unable to save this schedule.");
        return;
      }
      setEditorOpen(false);
      setSelectedLesson(null);
      setReloadKey((value) => value + 1);
    } catch {
      setFormError("Unable to reach the server. Try again.");
    } finally {
      setSavingLesson(false);
    }
  };

  const removeLesson = async () => {
    if (!selectedLesson || !window.confirm(`Delete ${selectedLesson.subject} for ${selectedLesson.className}?`)) return;
    setDeletingLesson(true);
    setFormError(null);
    try {
      const response = await api.delete("lessons", selectedLesson.id);
      if (!response.success) {
        setFormError(response.message || "Unable to delete this schedule.");
        return;
      }
      setSelectedLesson(null);
      setReloadKey((value) => value + 1);
    } catch {
      setFormError("Unable to reach the server. Try again.");
    } finally {
      setDeletingLesson(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-sky-700"><CalendarDays size={14} /> Academic / Timetable</p>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{isAdmin ? "Browse lessons by class or teacher." : role === "parent" ? "View the timetable linked to your child's profile." : "View lessons assigned to your profile."}</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-gray-600">{visibleSchedule.length} lesson{visibleSchedule.length === 1 ? "" : "s"}</p>
          {isAdmin && <button type="button" onClick={openNewLesson} disabled={loadingOptions || classes.length === 0 || teachers.length === 0 || subjects.length === 0} className="inline-flex items-center gap-2 rounded-md bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={16} />Add lesson</button>}
        </div>
      </header>

      <section className="overflow-hidden rounded-md border border-gray-200 bg-white">
        <div className="flex flex-wrap items-end gap-3 border-b border-gray-200 bg-gray-50/70 p-4">
          {isAdmin && <label className="min-w-48 flex-1 text-xs font-semibold text-gray-600">Class
            <select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)} className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-800 outline-none focus:border-sky-600">
              <option value="all">All classes</option>
              {classOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
          </label>}
          {(isAdmin || role === "teacher") && <label className="min-w-48 flex-1 text-xs font-semibold text-gray-600">{isAdmin ? "Teacher" : "My classes"}
            <select value={isAdmin ? selectedTeacherId : selectedClassId} onChange={(event) => isAdmin ? setSelectedTeacherId(event.target.value) : setSelectedClassId(event.target.value)} className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-800 outline-none focus:border-sky-600">
              <option value="all">{isAdmin ? "All teachers" : "All my classes"}</option>
              {(isAdmin ? teacherOptions : classOptions).map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
          </label>}
          {role === "parent" && <label className="min-w-48 flex-1 text-xs font-semibold text-gray-600">Child profile
            <select value={selectedChildId} onChange={(event) => setSelectedChildId(event.target.value)} disabled={children.length === 0} className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-800 outline-none focus:border-sky-600 disabled:bg-gray-100">
              {children.length === 0 && <option value="">No student profiles linked</option>}
              {children.map((child) => <option key={child.id} value={child.id}>{child.name} {child.surname}{child.class_name ? ` · ${child.class_name}` : ""}</option>)}
            </select>
          </label>}
          {role === "student" && <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700"><GraduationCap size={16} className="text-sky-700" />Personal class timetable</div>}
          {role === "parent" && selectedChild && <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700"><UsersRound size={16} className="text-sky-700" />{selectedChild.class_name || "Linked class"}</div>}
          {isAdmin && optionsError && <p role="alert" className="w-full text-sm text-red-700">{optionsError}</p>}
        </div>

        {error && <p role="alert" className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {selectedLesson && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 bg-sky-50 px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sky-950">
            <span className="flex items-center gap-2 font-semibold"><BookOpen size={15} />{selectedLesson.subject}</span>
            <span className="flex items-center gap-2"><UsersRound size={15} />{selectedLesson.className}</span>
            <span className="flex items-center gap-2"><GraduationCap size={15} />{selectedLesson.teacherName || "Teacher not assigned"}</span>
            <span className="flex items-center gap-2"><Clock3 size={15} />{moment(selectedLesson.start).format("ddd, h:mm A")}–{moment(selectedLesson.end).format("h:mm A")}</span>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && <><button type="button" onClick={openEditLesson} className="inline-flex items-center gap-1 rounded-md border border-sky-200 px-2.5 py-1.5 text-xs font-semibold text-sky-800 hover:bg-white"><Pencil size={13} />Edit</button><button type="button" onClick={() => void removeLesson()} disabled={deletingLesson} className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-white disabled:opacity-50"><Trash2 size={13} />{deletingLesson ? "Deleting..." : "Delete"}</button></>}
            <button type="button" onClick={() => setSelectedLesson(null)} className="text-xs font-semibold text-sky-800 hover:underline">Dismiss</button>
          </div>
        </div>}

        <div className="h-[calc(100vh-250px)] min-h-[520px] p-3 sm:p-5">
          {loading ? <div className="flex h-full items-center justify-center text-sm text-gray-500">Loading schedule...</div> : role === "parent" && children.length === 0 ? <div className="flex h-full items-center justify-center text-sm text-gray-500">No student profiles are linked to this parent account.</div> : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              views={[Views.WEEK, Views.DAY]}
              view={calendarView}
              date={calendarDate}
              onView={setCalendarView}
              onNavigate={setCalendarDate}
              onSelectEvent={(event) => setSelectedLesson(event as ScheduleEvent)}
              min={new Date(2025, 0, 1, 7, 0, 0)}
              max={new Date(2025, 0, 1, 18, 0, 0)}
              style={{ height: "100%" }}
              eventPropGetter={() => ({ style: { backgroundColor: "#d9eff8", border: "1px solid #94cfe3", color: "#123b4c", borderRadius: "5px" } })}
              messages={{ noEventsInRange: "No lessons scheduled for this period." }}
            />
          )}
        </div>
      </section>

      {editorOpen && isAdmin && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingLesson) setEditorOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="schedule-editor-title" className="w-full max-w-xl rounded-md bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div><h2 id="schedule-editor-title" className="font-semibold text-gray-900">{editingLessonId ? "Edit lesson schedule" : "Add lesson schedule"}</h2><p className="mt-1 text-xs text-gray-500">A teacher or class cannot have overlapping lessons.</p></div>
            <button type="button" onClick={() => setEditorOpen(false)} disabled={savingLesson} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"><X size={17} /></button>
          </header>
          <form onSubmit={saveLesson} className="space-y-4 p-5">
            {formError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
            <label className="block text-sm font-medium text-gray-700">Lesson name
              <input required maxLength={255} value={lessonDraft.name} onChange={(event) => setLessonDraft({ ...lessonDraft, name: event.target.value })} className={inputClass} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">Day
                <select required value={lessonDraft.day} onChange={(event) => setLessonDraft({ ...lessonDraft, day: event.target.value })} className={inputClass}>
                  {days.map((day) => <option key={day} value={day}>{day[0] + day.slice(1).toLowerCase()}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">Subject
                <select required value={lessonDraft.subject_id} onChange={(event) => setLessonDraft({ ...lessonDraft, subject_id: event.target.value })} className={inputClass}>
                  <option value="">Select subject</option>
                  {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">Class
                <select required value={lessonDraft.class_id} onChange={(event) => setLessonDraft({ ...lessonDraft, class_id: event.target.value })} className={inputClass}>
                  <option value="">Select class</option>
                  {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">Teacher
                <select required value={lessonDraft.teacher_id} onChange={(event) => setLessonDraft({ ...lessonDraft, teacher_id: event.target.value })} className={inputClass}>
                  <option value="">Select teacher</option>
                  {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name} {teacher.surname}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">Start time
                <input required type="time" value={lessonDraft.start_time} onChange={(event) => setLessonDraft({ ...lessonDraft, start_time: event.target.value })} className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-gray-700">End time
                <input required type="time" value={lessonDraft.end_time} onChange={(event) => setLessonDraft({ ...lessonDraft, end_time: event.target.value })} className={inputClass} />
              </label>
            </div>
            <footer className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button type="button" onClick={() => setEditorOpen(false)} disabled={savingLesson} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={savingLesson || loadingOptions} className="inline-flex items-center gap-2 rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50"><Save size={15} />{savingLesson ? "Saving..." : editingLessonId ? "Save changes" : "Save schedule"}</button>
            </footer>
          </form>
        </section>
      </div>}
    </div>
  );
};

export default ClassSchedulePage;
