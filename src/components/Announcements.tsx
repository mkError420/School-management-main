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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.getAll("announcements", { limit: 4 }).then((res) => {
      if (!active) return;
      if (res.success) {
        setItems(Array.isArray(res.data?.announcements) ? res.data.announcements.slice(0, 4) : []);
      } else {
        setError(res.message || "Unable to load announcements.");
      }
    }).catch(() => {
      if (active) setError("Unable to load announcements.");
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100">Announcements</h1>
        <Link to="/list/announcements" className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium">
          View All
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl p-3 bg-gray-50 dark:bg-gray-700/50 animate-pulse">
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2" />
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-full" />
              </div>
            ))
          : items.length === 0 && !error
            ? <p className="text-sm text-gray-500 dark:text-gray-400">No announcements yet.</p>
            : items.map((item, i) => (
              <div key={item.id} className={`${bgColors[i % bgColors.length]} dark:bg-opacity-20 rounded-xl p-3`}>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{item.title}</h2>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-700 rounded-md px-1.5 py-0.5 whitespace-nowrap ml-2">
                    {item.date}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{item.description}</p>
              </div>
            ))}
      </div>
    </div>
  );
};

export default Announcements;