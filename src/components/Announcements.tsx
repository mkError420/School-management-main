import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

interface Announcement {
  id: number;
  title: string;
  description: string;
  date: string;
  class_name?: string;
}

const bgColors = ["bg-lamaPurpleLight", "bg-lamaYellowLight", "bg-lamaSkyLight"];

const Announcements: React.FC = () => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fallback: Announcement[] = [
      { id: 1, title: "Term 1 Exam Schedule Released", description: "The mid-term examination timetable is now officially published.", date: "2026-10-01" },
      { id: 2, title: "Library Renovation Opening", description: "The newly renovated school digital library opens next Monday.", date: "2026-10-03" },
      { id: 3, title: "Winter Uniform Notice", description: "All students are requested to switch to the winter school uniform.", date: "2026-10-10" },
    ];

    api.getAll("announcements", { limit: 4 }).then((res) => {
      if (res.success && res.data?.announcements?.length > 0) {
        setItems(res.data.announcements.slice(0, 4));
      } else {
        setItems(fallback);
      }
      setLoading(false);
    }).catch(() => {
      setItems(fallback);
      setLoading(false);
    });
  }, []);

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base font-semibold text-gray-800">Announcements</h1>
        <Link to="/list/announcements" className="text-xs text-purple-600 hover:underline font-medium">
          View All
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl p-3 bg-gray-50 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-2 bg-gray-100 rounded w-full" />
              </div>
            ))
          : items.map((item, i) => (
              <div key={item.id} className={`${bgColors[i % bgColors.length]} rounded-xl p-3`}>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm font-semibold text-gray-800 leading-tight">{item.title}</h2>
                  <span className="text-[10px] text-gray-500 bg-white rounded-md px-1.5 py-0.5 whitespace-nowrap ml-2">
                    {item.date}
                  </span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
              </div>
            ))}
      </div>
    </div>
  );
};

export default Announcements;