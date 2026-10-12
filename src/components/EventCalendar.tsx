"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { api } from "@/lib/api";
import { useAccessRole } from "@/context/AuthContext";
import FormModal from "@/components/FormModal";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronRight,
  RefreshCw,
  X,
  AlertCircle,
  ExternalLink,
  Play,
  Pause,
  Radio,
  Eye,
  ChevronUp,
  ChevronDown,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export interface EventItem {
  id: number;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  class_id?: number | null;
  class_name?: string | null;
}

const parseDate = (dateStr?: string): Date | null => {
  if (!dateStr) return null;
  const isoStr = dateStr.includes(" ") ? dateStr.replace(" ", "T") : dateStr;
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? null : d;
};

const formatTimeRange = (startStr?: string, endStr?: string): string => {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  if (!start) return "";

  const startFormatted = start.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (!end) return startFormatted;

  const endFormatted = end.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${startFormatted} - ${endFormatted}`;
};

const formatDateOnly = (dateStr?: string | Date): string => {
  const d = typeof dateStr === "string" ? parseDate(dateStr) : dateStr;
  if (!d) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getEventBadge = (startStr?: string) => {
  const date = parseDate(startStr);
  if (!date) return null;
  const now = new Date();
  const startOfDayNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDayEvent = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startOfDayEvent - startOfDayNow) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { label: "Today", bg: "bg-emerald-500 text-white animate-pulse" };
  if (diffDays === 1) return { label: "Tomorrow", bg: "bg-indigo-600 text-white" };
  if (diffDays > 1 && diffDays <= 7) return { label: `In ${diffDays} days`, bg: "bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-semibold" };
  if (diffDays > 7) return { label: formatDateOnly(date), bg: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300" };
  return { label: "Completed", bg: "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400" };
};

const isEventOnDate = (event: EventItem, targetDate: Date): boolean => {
  const start = parseDate(event.start_time);
  if (!start) return false;
  const end = parseDate(event.end_time) || start;

  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const targetDay = targetDate.getDate();

  const dayStart = new Date(targetYear, targetMonth, targetDay, 0, 0, 0, 0).getTime();
  const dayEnd = new Date(targetYear, targetMonth, targetDay, 23, 59, 59, 999).getTime();

  return start.getTime() <= dayEnd && end.getTime() >= dayStart;
};

const borderAccents = [
  "border-l-indigo-500",
  "border-l-purple-500",
  "border-l-sky-500",
  "border-l-emerald-500",
  "border-l-amber-500",
  "border-l-rose-500",
];

const EventCalendar: React.FC = () => {
  const role = useAccessRole();
  const [calendarValue, setCalendarValue] = useState<Value>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ticker Controls State
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [speed, setSpeed] = useState<"normal" | "slow" | "fast">("normal");
  const [viewMode, setViewMode] = useState<"ticker" | "list">("ticker");
  const [showCalendar, setShowCalendar] = useState(true);
  const [selectedEventModal, setSelectedEventModal] = useState<EventItem | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAll("events", { limit: 50 });
      if (res.success && res.data) {
        const list = Array.isArray(res.data.events)
          ? res.data.events
          : Array.isArray(res.data)
            ? res.data
            : [];
        setEvents(list);
      } else {
        setError(res.message || "Unable to load events.");
      }
    } catch {
      setError("Unable to load events from the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle date click on calendar
  const handleDateChange = (val: Value) => {
    setCalendarValue(val);
    const clickedDate =
      val instanceof Date ? val : Array.isArray(val) && val[0] ? val[0] : null;

    if (clickedDate) {
      if (
        selectedDate &&
        clickedDate.getFullYear() === selectedDate.getFullYear() &&
        clickedDate.getMonth() === selectedDate.getMonth() &&
        clickedDate.getDate() === selectedDate.getDate()
      ) {
        // Toggle filter off
        setSelectedDate(null);
      } else {
        setSelectedDate(clickedDate);
      }
    }
  };

  // Filter events based on selected date or show upcoming/all
  const displayedEvents = useMemo(() => {
    if (selectedDate) {
      return events.filter((e) => isEventOnDate(e, selectedDate));
    }
    // Default: Sort by start_time ascending
    return [...events].sort((a, b) => {
      const aTime = parseDate(a.start_time)?.getTime() || 0;
      const bTime = parseDate(b.start_time)?.getTime() || 0;
      return aTime - bTime;
    });
  }, [events, selectedDate]);

  // Build duplicated items list for seamless bottom-to-top infinite scrolling
  const tickerItems = useMemo(() => {
    if (displayedEvents.length === 0) return [];
    // Ensure sufficient items count for smooth looping
    let base = [...displayedEvents];
    while (base.length < 5) {
      base = [...base, ...displayedEvents];
    }
    // Duplicate exactly once to seamlessly loop from translateY(0) to translateY(-50%)
    return [...base, ...base];
  }, [displayedEvents]);

  // Duration in seconds for one full loop
  const speedMultiplier = speed === "slow" ? 0.7 : speed === "fast" ? 1.6 : 1.0;
  const animationDurationSeconds = Math.max(
    18,
    Math.round((displayedEvents.length || 5) * 4.5 / speedMultiplier)
  );

  const effectivePaused = isPaused || isHovered;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80 flex flex-col gap-3.5">
      {/* ─── Top Breaking News / Live Events Ticker Bar ──────────────── */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white p-2.5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/90 text-[10px] font-black tracking-wider uppercase shadow-xs">
            <Radio size={11} className="animate-pulse text-white" />
            <span>LIVE EVENTS</span>
          </div>

          {/* Horizontal Scrolling Marquee */}
          <div className="flex-1 overflow-hidden relative text-xs">
            {events.length === 0 ? (
              <span className="text-purple-100 text-xs italic">
                {loading ? "Fetching school events feed…" : "No active events announced"}
              </span>
            ) : (
              <div
                className="whitespace-nowrap flex gap-8 animate-ticker-horizontal items-center"
                style={{ "--ticker-h-duration": `${Math.max(20, events.length * 5)}s` } as React.CSSProperties}
              >
                {[...events, ...events].map((ev, i) => (
                  <button
                    key={`${ev.id}-${i}`}
                    type="button"
                    onClick={() => setSelectedEventModal(ev)}
                    className="inline-flex items-center gap-1.5 text-purple-100 hover:text-white transition font-medium cursor-pointer"
                  >
                    <span className="text-amber-300 font-bold">✦</span>
                    <span className="font-semibold text-white">{ev.title}</span>
                    <span className="text-[11px] text-purple-200 opacity-90">
                      ({formatDateOnly(ev.start_time)}{ev.class_name ? ` · Class ${ev.class_name}` : ""})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Header Section with Ticker Controls ─────────────────────── */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <CalendarIcon size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
                Events Section
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300">
                {events.length}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Infinite Bottom-to-Top News Ticker
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Ticker / List View Mode Toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-gray-700/60 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setViewMode("ticker")}
              title="Infinite Bottom-to-Top Ticker"
              className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition ${viewMode === "ticker"
                ? "bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                }`}
            >
              <Zap size={11} />
              <span>Ticker</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="Static List View"
              className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition ${viewMode === "list"
                ? "bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                }`}
            >
              <Layers size={11} />
              <span>List</span>
            </button>
          </div>

          {/* Toggle Calendar Visibility */}
          <button
            type="button"
            onClick={() => setShowCalendar((prev) => !prev)}
            title={showCalendar ? "Hide Calendar Picker" : "Show Calendar Picker"}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            {showCalendar ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {/* Create Event Modal for Admins & Teachers */}
          {(role === "admin" || role === "teacher") && (
            <FormModal table="event" type="create" onSuccess={fetchEvents} />
          )}

          <Link
            to="/list/events"
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline flex items-center gap-0.5 ml-1"
          >
            All
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* ─── Top Calendar Picker (Collapsible) ───────────────────────── */}
      {showCalendar && (
        <div className="rounded-xl p-2 bg-slate-50/70 dark:bg-gray-700/30 border border-slate-100 dark:border-gray-700/60 transition-all">
          <div className="[&_.react-calendar]:w-full [&_.react-calendar]:border-0 [&_.react-calendar]:font-sans [&_.react-calendar]:bg-transparent [&_.react-calendar]:text-gray-800 [&_.react-calendar]:dark:text-gray-100 [&_.react-calendar__navigation]:mb-2 [&_.react-calendar__navigation_button]:rounded-lg [&_.react-calendar__navigation_button]:min-w-[34px] [&_.react-calendar__navigation_button]:h-8 [&_.react-calendar__navigation_button]:hover:bg-purple-100/60 [&_.react-calendar__navigation_button]:dark:hover:bg-gray-600 [&_.react-calendar__navigation_button]:font-semibold [&_.react-calendar__navigation_button]:text-sm [&_.react-calendar__tile]:rounded-lg [&_.react-calendar__tile]:py-2 [&_.react-calendar__tile]:text-xs [&_.react-calendar__tile]:transition-all [&_.react-calendar__tile--now]:bg-purple-50 [&_.react-calendar__tile--now]:text-purple-700 [&_.react-calendar__tile--now]:font-bold [&_.react-calendar__tile--now]:dark:bg-purple-950/50 [&_.react-calendar__tile--now]:dark:text-purple-300 [&_.react-calendar__tile--active]:!bg-purple-600 [&_.react-calendar__tile--active]:!text-white [&_.react-calendar__tile--active]:shadow-sm [&_.react-calendar__tile:hover]:bg-purple-100/40 [&_.react-calendar__tile:hover]:dark:bg-gray-600 [&_.react-calendar__month-view__weekdays]:font-semibold [&_.react-calendar__month-view__weekdays]:text-[11px] [&_.react-calendar__month-view__weekdays__weekday]:text-gray-500 [&_.react-calendar__month-view__weekdays__weekday]:dark:text-gray-400 [&_.react-calendar__month-view__weekdays__weekday_abbr]:no-underline">
            <Calendar
              onChange={handleDateChange}
              value={calendarValue}
              tileContent={({ date, view }) => {
                if (view === "month") {
                  const hasEvents = events.some((e) => isEventOnDate(e, date));
                  if (hasEvents) {
                    return (
                      <div className="flex justify-center items-center mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
                      </div>
                    );
                  }
                }
                return null;
              }}
            />
          </div>
        </div>
      )}

      {/* ─── Filter Banner (if date filtered) ───────────────────────── */}
      {selectedDate && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 text-xs">
          <span className="text-purple-800 dark:text-purple-200 font-medium">
            Events on <span className="font-bold">{formatDateOnly(selectedDate)}</span> ({displayedEvents.length})
          </span>
          <button
            type="button"
            onClick={() => setSelectedDate(null)}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 font-semibold flex items-center gap-1"
          >
            <X size={13} />
            Show All
          </button>
        </div>
      )}

      {/* ─── Ticker Control Strip (Play/Pause, Speed, Live State) ─────── */}
      {viewMode === "ticker" && displayedEvents.length > 0 && (
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-gray-700/40 border border-slate-100 dark:border-gray-700/60 text-[11px]">
          <div className="flex items-center gap-2">
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-950/50 hover:bg-purple-200 transition"
              title={isPaused ? "Resume Ticker" : "Pause Ticker"}
            >
              {isPaused ? <Play size={10} className="fill-current" /> : <Pause size={10} className="fill-current" />}
              <span>{isPaused ? "Play" : "Pause"}</span>
            </button>

            {/* Status indicator */}
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1 text-[10px]">
              {effectivePaused ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Paused {isHovered ? "(hovered)" : ""}
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Scrolling bottom-to-top
                </span>
              )}
            </span>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1">
            <span className="text-gray-400 text-[10px]">Speed:</span>
            {(["slow", "normal", "fast"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${speed === s
                  ? "bg-purple-600 text-white"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800"
                  }`}
              >
                {s === "slow" ? "0.7x" : s === "normal" ? "1x" : "1.5x"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Error Notification ─────────────────────────────────────── */}
      {error && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs">
          <span className="flex items-center gap-1.5">
            <AlertCircle size={14} />
            {error}
          </span>
          <button
            type="button"
            onClick={fetchEvents}
            className="font-semibold underline flex items-center gap-1"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      )}

      {/* ─── Main Events Container (Ticker Mode or List Mode) ───────── */}
      {loading ? (
        <div className="flex flex-col gap-3 py-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-gray-700/40 border border-slate-100 dark:border-gray-700 animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-full" />
            </div>
          ))}
        </div>
      ) : displayedEvents.length === 0 ? (
        <div className="text-center py-8 px-4 bg-slate-50/70 dark:bg-gray-700/30 rounded-xl border border-slate-100 dark:border-gray-700/60">
          <CalendarIcon size={30} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {selectedDate
              ? `No events scheduled on ${formatDateOnly(selectedDate)}`
              : "No upcoming events scheduled"}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            {selectedDate ? (
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="text-purple-600 dark:text-purple-400 underline font-medium hover:text-purple-700"
              >
                Clear filter & show all events
              </button>
            ) : (
              "New events published by teachers or administrators will stream here."
            )}
          </p>
        </div>
      ) : viewMode === "ticker" ? (
        /* ─── Infinite Bottom-to-Top Ticker Viewport ──────────────── */
        <div
          className={`relative overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700/80 bg-slate-50/40 dark:bg-gray-800/40 ${showCalendar ? "h-[350px]" : "h-[460px]"
            } transition-all`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Top Gradient Fade Mask */}
          <div className="pointer-events-none absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-white dark:from-gray-800 to-transparent z-10" />

          {/* Scrolling Content Track (Bottom-to-Top Infinite) */}
          <div
            className="animate-ticker-vertical flex flex-col gap-3 p-3 pt-4"
            style={
              {
                "--ticker-duration": `${animationDurationSeconds}s`,
                animationPlayState: effectivePaused ? "paused" : "running",
              } as React.CSSProperties
            }
          >
            {tickerItems.map((event, idx) => {
              const accent = borderAccents[idx % borderAccents.length];
              const eventDate = formatDateOnly(event.start_time);
              const timeRange = formatTimeRange(event.start_time, event.end_time);
              const badge = getEventBadge(event.start_time);

              return (
                <div
                  key={`${event.id}-ticker-${idx}`}
                  className={`p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-700/80 border-l-4 ${accent} bg-white dark:bg-gray-700/60 shadow-xs hover:shadow-md transition-all group relative cursor-pointer`}
                  onClick={() => setSelectedEventModal(event)}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-gray-800 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition leading-snug">
                          {event.title}
                        </span>
                        {badge && (
                          <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${badge.bg}`}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div
                      className="flex items-center gap-1 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedEventModal(event)}
                        className="p-1 rounded-md text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                        title="View Details"
                      >
                        <Eye size={13} />
                      </button>

                      {(role === "admin" || role === "teacher") && (
                        <>
                          <FormModal
                            table="event"
                            type="update"
                            data={event}
                            onSuccess={fetchEvents}
                          />
                          {role === "admin" && (
                            <FormModal
                              table="event"
                              type="delete"
                              id={event.id}
                              onSuccess={fetchEvents}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Metadata: Date, Time & Class */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400 mb-1.5">
                    <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                      <CalendarIcon size={12} className="text-purple-500" />
                      {eventDate}
                    </span>
                    {timeRange && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} className="text-gray-400" />
                        {timeRange}
                      </span>
                    )}
                    <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-gray-600/70 text-gray-600 dark:text-gray-300 text-[10px] font-medium">
                      {event.class_name ? `Class ${event.class_name}` : "All Classes"}
                    </span>
                  </div>

                  {/* Description preview */}
                  {event.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  {/* Card footer */}
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-[10px] text-gray-400">
                    <span>ID #{event.id}</span>
                    <span className="text-purple-600 dark:text-purple-400 font-semibold group-hover:underline flex items-center gap-0.5">
                      Quick View →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Gradient Fade Mask */}
          <div className="pointer-events-none absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-white dark:from-gray-800 to-transparent z-10" />
        </div>
      ) : (
        /* ─── Static List View ────────────────────────────────────── */
        <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1">
          {displayedEvents.map((event, idx) => {
            const accent = borderAccents[idx % borderAccents.length];
            const eventDate = formatDateOnly(event.start_time);
            const timeRange = formatTimeRange(event.start_time, event.end_time);
            const badge = getEventBadge(event.start_time);

            return (
              <div
                key={event.id}
                className={`p-3.5 rounded-xl border border-gray-100 dark:border-gray-700/80 border-l-4 ${accent} bg-white dark:bg-gray-700/30 shadow-xs hover:shadow-md transition-all group`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedEventModal(event)}
                      className="font-semibold text-sm text-gray-800 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition text-left"
                    >
                      {event.title}
                    </button>
                    {badge && (
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${badge.bg}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {(role === "admin" || role === "teacher") && (
                      <>
                        <FormModal
                          table="event"
                          type="update"
                          data={event}
                          onSuccess={fetchEvents}
                        />
                        {role === "admin" && (
                          <FormModal
                            table="event"
                            type="delete"
                            id={event.id}
                            onSuccess={fetchEvents}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400 mb-1.5">
                  <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                    <CalendarIcon size={12} className="text-purple-500" />
                    {eventDate}
                  </span>
                  {timeRange && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="text-gray-400" />
                      {timeRange}
                    </span>
                  )}
                  <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-gray-600/70 text-gray-600 dark:text-gray-300 text-[10px] font-medium">
                    {event.class_name ? `Class ${event.class_name}` : "All Classes"}
                  </span>
                </div>

                {event.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                )}

                <div className="mt-2.5 pt-2 border-t border-gray-100/80 dark:border-gray-700/60 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">ID #{event.id}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedEventModal(event)}
                    className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline flex items-center gap-1"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Footer: View All in Events Directory ───────────────────── */}
      <Link
        to="/list/events"
        className="w-full py-2.5 px-3 rounded-xl border border-dashed border-purple-200 dark:border-purple-800/60 hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 text-purple-600 dark:text-purple-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition mt-1"
      >
        <span>View Full Events Directory ({events.length})</span>
        <ChevronRight size={14} />
      </Link>

      {/* ─── Quick View Modal for Selected Event ────────────────────── */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500" />
            <div className="p-5 md:p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300">
                    Event Details
                  </span>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">
                    {selectedEventModal.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEventModal(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Timing & Details Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-gray-700/40 border border-slate-100 dark:border-gray-700/60 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px]">Date</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1 mt-0.5">
                    <CalendarIcon size={13} className="text-purple-500" />
                    {formatDateOnly(selectedEventModal.start_time)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Time</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1 mt-0.5">
                    <Clock size={13} className="text-purple-500" />
                    {formatTimeRange(selectedEventModal.start_time, selectedEventModal.end_time) || "All Day"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400 block text-[10px]">Target Audience</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100 mt-0.5 inline-block">
                    {selectedEventModal.class_name ? `Class ${selectedEventModal.class_name}` : "All Classes & Grades"}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed p-3 rounded-xl bg-slate-50/60 dark:bg-gray-700/20 border border-slate-100 dark:border-gray-700/50 whitespace-pre-wrap">
                  {selectedEventModal.description || "No detailed description provided for this event."}
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                <Link
                  to={`/list/events?search=${encodeURIComponent(selectedEventModal.title)}`}
                  className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  <ExternalLink size={13} />
                  Open in All Events
                </Link>

                <button
                  type="button"
                  onClick={() => setSelectedEventModal(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;