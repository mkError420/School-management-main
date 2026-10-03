"use client"

import Image from "@/components/Image";
import { useState } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const events = [
  { id: 1, title: "Event 01", time: "12.00 PM - 2:00 PM", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit" },
  { id: 2, title: "Event 02", time: "12.00 PM - 2:00 PM", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit" },
  { id: 3, title: "Event 03", time: "12.00 PM - 2:00 PM", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit" },
];

const EventCalendar = () => {
  const [value, onChange] = useState<Value>(new Date());

  return (
    <div className='bg-white dark:bg-gray-800 p-4 rounded-md'>
      <div className="[&_.react-calendar]:bg-white [&_.react-calendar]:dark:bg-gray-800 [&_.react-calendar]:dark:text-gray-100 [&_.react-calendar]:border-0 [&_.react-calendar__tile]:dark:text-gray-200 [&_.react-calendar__tile--active]:dark:bg-purple-600 [&_.react-calendar__navigation_button]:dark:text-gray-200 [&_.react-calendar__navigation_button:hover]:dark:bg-gray-700 [&_.react-calendar__tile:hover]:dark:bg-gray-700 [&_.react-calendar__month-view__weekdays__weekday]:dark:text-gray-400">
        <Calendar onChange={onChange} value={value}/>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold my-4 text-gray-800 dark:text-gray-100">Events</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20}/>
      </div>

      <div className="flex flex-col gap-4">
        {events.map(event => (
          <div
            className="p-5 rounded-md border-2 border-gray-100 dark:border-gray-700 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple dark:bg-gray-700/40"
            key={event.id}
          >
            <div className="flex items-center justify-between">
              <h1 className="font-semibold text-gray-700 dark:text-gray-200">{event.title}</h1>
              <span className="text-gray-500 dark:text-gray-400 text-xs">{event.time}</span>
            </div>
            <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">{event.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventCalendar;