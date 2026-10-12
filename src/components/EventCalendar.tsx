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
];

const EventCalendar: React.FC = () => {
  const role = useAccessRole();
  const [calendarValue, setCalendarValue] = useState<Value>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        // Clicking same date again toggles filter off
        setSelectedDate(null);
      } else {
        setSelectedDate(clickedDate);
      }
    }
  };

  // Filter events based on selected date or show upcoming
  const displayedEvents = useMemo(() => {
    if (selectedDate) {
      return events.filter((e) => isEventOnDate(e, selectedDate));
    }
    // Default: Sort by start_time ascending
    return [...events]
      .sort((a, b) => {
        const aTime = parseDate(a.start_time)?.getTime() || 0;
        const bTime = parseDate(b.start_time)?.getTime() || 0;
        return aTime - bTime;
      })
      .slice(0, 5);
  }, [events, selectedDate]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80 flex flex-col gap-4">
      {/* ─── Top Calendar Picker ─────────────────────────────────────── */}
      <div className="rounded-xl p-2 bg-slate-50/60 dark:bg-gray-700/30 border border-slate-100 dark:border-gray-700/60">
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

      {/* ─── Header Section ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/80 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <CalendarIcon size={18} className="text-purple-600 dark:text-purple-400" />
            Events
          </h2>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
            {events.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {(role === "admin" || role === "teacher") && (
            <FormModal table="event" type="create" onSuccess={fetchEvents} />
          )}
          <Link
            to="/list/events"
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline flex items-center gap-1"
          >
            View All
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* ─── Date Filter Notice (if filtered) ───────────────────────── */}
      {selectedDate && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 text-xs">
          <span className="text-purple-800 dark:text-purple-200 font-medium">
            Events on <span className="font-bold">{formatDateOnly(selectedDate)}</span>
          </span>
          <button
            onClick={() => setSelectedDate(null)}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 font-semibold flex items-center gap-1"
          >
            <X size={13} />
            Show All
          </button>
        </div>
      )}

      {/* ─── Events List ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {error && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs">
            <span className="flex items-center gap-1.5">
              <AlertCircle size={14} />
              {error}
            </span>
            <button
              onClick={fetchEvents}
              className="font-semibold underline flex items-center gap-1"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        )}

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-gray-700/40 border border-slate-100 dark:border-gray-700 animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-full" />
            </div>
          ))
        ) : displayedEvents.length === 0 ? (
          <div className="text-center py-6 px-3 bg-slate-50/70 dark:bg-gray-700/30 rounded-xl border border-slate-100 dark:border-gray-700/60">
            <CalendarIcon size={28} className="mx-auto text-gray-400 dark:text-gray-500 mb-1.5" />
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {selectedDate
                ? `No events on ${formatDateOnly(selectedDate)}`
                : "No upcoming events scheduled"}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              {selectedDate ? (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-purple-600 dark:text-purple-400 underline font-medium hover:text-purple-700"
                >
                  Show all events
                </button>
              ) : (
                "New events will appear here once scheduled."
              )}
            </p>
          </div>
        ) : (
          displayedEvents.map((event, idx) => {
            const accent = borderAccents[idx % borderAccents.length];
            const eventDate = formatDateOnly(event.start_time);
            const timeRange = formatTimeRange(event.start_time, event.end_time);

            return (
              <div
                key={event.id}
                className={`p-3.5 rounded-xl border border-gray-100 dark:border-gray-700/80 border-l-4 ${accent} bg-white dark:bg-gray-700/30 shadow-xs hover:shadow-md transition-all group`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <Link
                    to={`/list/events?search=${encodeURIComponent(event.title)}`}
                    className="font-semibold text-sm text-gray-800 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition leading-snug flex items-center gap-1.5"
                    title="View in All Events"
                  >
                    <span>{event.title}</span>
                    <ExternalLink
                      size={12}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-500"
                    />
                  </Link>

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

                {/* Date & Time and Class metadata */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400 mb-1.5">
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

                {/* Description */}
                {event.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                )}

                {/* Bottom link to view in All Events */}
                <div className="mt-2.5 pt-2 border-t border-gray-100/80 dark:border-gray-700/60 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">ID #{event.id}</span>
                  <Link
                    to={`/list/events?search=${encodeURIComponent(event.title)}`}
                    className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline flex items-center gap-1"
                  >
                    View in All Events →
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Footer: Browse All Events Directory ─────────────────────── */}
      <Link
        to="/list/events"
        className="w-full py-2.5 px-3 rounded-xl border border-dashed border-purple-200 dark:border-purple-800/60 hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 text-purple-600 dark:text-purple-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition mt-1"
      >
        <CalendarIcon size={14} />
        <span>View All Events in Full Directory ({events.length})</span>
        <ChevronRight size={14} />
      </Link>
    </div>
  );
};

export default EventCalendar;