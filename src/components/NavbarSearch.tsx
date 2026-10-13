import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import {
  Search,
  X,
  Loader2,
  GraduationCap,
  UserCheck,
  BookOpen,
  Layers,
  Bell,
  Calendar,
  FileText,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export interface SearchResultItem {
  id: string | number;
  type: "student" | "teacher" | "course" | "class" | "lesson" | "announcement" | "event" | "exam" | "assignment";
  title: string;
  subtitle?: string;
  badge?: string;
  img?: string | null;
  url: string;
  list_url?: string;
}

interface SearchResponseData {
  query: string;
  total: number;
  results: SearchResultItem[];
  categories: Record<string, SearchResultItem[]>;
}

const CATEGORY_TABS = [
  { key: "all", label: "All" },
  { key: "students", label: "Students" },
  { key: "teachers", label: "Teachers" },
  { key: "courses", label: "Courses" },
  { key: "classes", label: "Classes" },
  { key: "announcements", label: "Notices" },
];

export const NavbarSearch: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultsData, setResultsData] = useState<SearchResponseData | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search fetch
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResultsData(null);
      setLoading(false);
      setSelectedIndex(-1);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.getAll("search", { q: trimmed });
        if (res.success && res.data) {
          setResultsData(res.data);
        } else {
          setResultsData(null);
        }
      } catch (err) {
        console.error("Search failed:", err);
        setResultsData(null);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  // Filtered results according to active tab
  const displayedResults = useMemo(() => {
    if (!resultsData) return [];
    if (activeTab === "all") {
      return resultsData.results || [];
    }
    const catItems = resultsData.categories?.[activeTab] || [];
    return catItems;
  }, [resultsData, activeTab]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [displayedResults]);

  const handleSelectResult = (item: SearchResultItem) => {
    setIsOpen(false);
    setIsMobileOpen(false);
    setQuery("");
    navigate(item.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && e.key !== "Escape") {
      setIsOpen(true);
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < displayedResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : displayedResults.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && displayedResults[selectedIndex]) {
        handleSelectResult(displayedResults[selectedIndex]);
      } else if (query.trim()) {
        // Fallback: navigate to primary listing page based on tab
        setIsOpen(false);
        setIsMobileOpen(false);
        const encoded = encodeURIComponent(query.trim());
        if (activeTab === "teachers") {
          navigate(`/list/teachers?search=${encoded}`);
        } else if (activeTab === "courses") {
          navigate(`/list/subjects?search=${encoded}`);
        } else if (activeTab === "classes") {
          navigate(`/list/classes?search=${encoded}`);
        } else if (activeTab === "announcements") {
          navigate(`/list/announcements?search=${encoded}`);
        } else {
          // If first item exists, go to its list, otherwise default to students
          const first = displayedResults[0];
          if (first?.list_url) {
            navigate(first.list_url);
          } else {
            navigate(`/list/students?search=${encoded}`);
          }
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setIsMobileOpen(false);
      inputRef.current?.blur();
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "student":
        return <GraduationCap className="h-4 w-4 text-sky-600 dark:text-sky-400" />;
      case "teacher":
        return <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case "course":
      case "subject":
        return <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      case "class":
        return <Layers className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case "announcement":
        return <Bell className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
      case "event":
        return <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
      case "lesson":
      case "exam":
      case "assignment":
      default:
        return <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Desktop Search Bar */}
      <div className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 dark:ring-slate-600 px-3 py-1.5 focus-within:ring-purple-500 bg-gray-50 dark:bg-slate-800 transition-all w-[240px] lg:w-[280px]">
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 text-purple-600 animate-spin shrink-0" />
        ) : (
          <Search className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search courses, students, teachers..."
          className="w-full bg-transparent outline-none text-xs text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResultsData(null);
              inputRef.current?.focus();
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Mobile Search Button */}
      <button
        type="button"
        onClick={() => {
          setIsMobileOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 50);
        }}
        className="md:hidden flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
        title="Search"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Mobile Search Modal Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
              <Search className="h-4 w-4 text-purple-600 shrink-0" />
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search courses, students, teachers..."
                className="w-full bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400"
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-purple-600" />}
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-gray-400 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="ml-1 text-xs font-semibold text-purple-600 px-2 py-1"
              >
                Done
              </button>
            </div>

            {/* Results in mobile modal */}
            <div className="overflow-y-auto flex-1 mt-2">
              {renderDropdownContent()}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Results Dropdown */}
      {isOpen && !isMobileOpen && (
        <div className="hidden md:flex flex-col absolute left-0 top-full mt-2 w-[380px] lg:w-[420px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-slate-700/80 z-50 overflow-hidden animate-in fade-in duration-150">
          {renderDropdownContent()}
        </div>
      )}
    </div>
  );

  function renderDropdownContent() {
    const hasQuery = query.trim().length > 0;

    return (
      <div className="flex flex-col max-h-[460px]">
        {/* Category Tabs */}
        {hasQuery && resultsData && resultsData.total > 0 && (
          <div className="flex items-center gap-1.5 p-2.5 border-b border-gray-100 dark:border-slate-800 overflow-x-auto no-scrollbar bg-gray-50/70 dark:bg-slate-900/60">
            {CATEGORY_TABS.map((tab) => {
              const count =
                tab.key === "all"
                  ? resultsData.total
                  : resultsData.categories?.[tab.key]?.length || 0;
              if (tab.key !== "all" && count === 0) return null;

              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSelectedIndex(-1);
                  }}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer ${
                    active
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {tab.label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* List of items */}
        <div className="overflow-y-auto p-2 space-y-1 flex-1">
          {loading && displayedResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600 mb-2" />
              <p className="text-xs">Searching database...</p>
            </div>
          ) : !hasQuery ? (
            <div className="p-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 mb-2">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                Quick Global Search
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Type student name, teacher, course, class, or notice title.
              </p>
            </div>
          ) : displayedResults.length === 0 ? (
            <div className="py-8 text-center px-4">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                No matching results found
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                No records matched &ldquo;{query}&rdquo;
              </p>
            </div>
          ) : (
            displayedResults.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={`${item.type}-${item.id}-${idx}`}
                  onClick={() => handleSelectResult(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition cursor-pointer ${
                    isSelected
                      ? "bg-purple-50 dark:bg-purple-950/50 text-purple-900 dark:text-purple-100"
                      : "hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {/* Avatar or Icon */}
                  {item.img ? (
                    <img
                      src={item.img}
                      alt={item.title}
                      className="h-8 w-8 rounded-full object-cover shrink-0 border border-gray-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-slate-800 shrink-0">
                      {getItemIcon(item.type)}
                    </div>
                  )}

                  {/* Text details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs truncate">
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className="shrink-0 text-[10px] px-1.5 py-0.2 rounded-full font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>

                  <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0 opacity-0 group-hover:opacity-100" />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts / view all */}
        {hasQuery && displayedResults.length > 0 && (
          <div className="p-2 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/40 flex items-center justify-between text-[11px] text-gray-500">
            <span>Press <kbd className="font-mono bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-gray-200 dark:border-slate-700 text-[10px]">Enter</kbd> to open</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsMobileOpen(false);
                const encoded = encodeURIComponent(query.trim());
                navigate(`/list/students?search=${encoded}`);
              }}
              className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
            >
              See all results &rarr;
            </button>
          </div>
        )}
      </div>
    );
  }
};

export default NavbarSearch;
