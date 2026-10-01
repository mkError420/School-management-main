import { useEffect, useState } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import { api } from '@/lib/api';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment)
const dayIndexes: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
}

const BigCalendar = () => {
  const [view, setView] = useState<View>(Views.WEEK);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.getDashboard().then((response) => {
      if (!active) return;
      if (!response.success) {
        setError(response.message || 'Unable to load your schedule.');
        return;
      }

      const weekStart = moment().startOf('week').toDate();
      const schedule = Array.isArray(response.data?.schedule) ? response.data.schedule : [];
      const calendarEvents = schedule.flatMap((lesson: Record<string, any>) => {
        const dayIndex = dayIndexes[String(lesson.day || '').toUpperCase()];
        if (dayIndex === undefined) return [];

        const startTime = String(lesson.start_time || '').split(/[ T]/)[1] || '00:00:00';
        const endTime = String(lesson.end_time || '').split(/[ T]/)[1] || '00:00:00';
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        const start = new Date(weekStart);
        const end = new Date(weekStart);
        start.setDate(start.getDate() + dayIndex);
        end.setDate(end.getDate() + dayIndex);
        start.setHours(startHour || 0, startMinute || 0, 0, 0);
        end.setHours(endHour || 0, endMinute || 0, 0, 0);

        return [{
          title: [lesson.title, lesson.subject_name, lesson.class_name].filter(Boolean).join(' · '),
          start,
          end,
        }];
      });
      setEvents(calendarEvents);
    }).catch(() => {
      if (active) setError('Unable to load your schedule.');
    });

    return () => {
      active = false;
    };
  }, []);

  const handleOnChangeView =(selectedView: View) => {
    setView(selectedView);
  }
  return (
    <div className="h-full">
      {error && <p role="alert" className="mb-2 text-sm text-red-600">{error}</p>}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={["week", "day"]}
        view={view}
        style={{ height: "98%" }}
        onView={handleOnChangeView}
        min={new Date(2025, 0, 1, 7, 0, 0)}
        max={new Date(2025, 0, 1, 18, 0, 0)}
      />
    </div>
  )
};

export default BigCalendar;