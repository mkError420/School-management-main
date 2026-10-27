import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useAccessRole } from "@/context/AuthContext";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import {
  Bell,
  Calendar,
  Download,
  Eye,
  FileText,
  Filter,
  Grid,
  Image as ImageIcon,
  Layers,
  List,
  Printer,
  RefreshCw,
  Search,
  Users,
  X,
  FileDown,
  ExternalLink,
  Sparkles,
  Clock,
  ArrowUpDown,
  FileCode,
  CheckCircle,
  Plus,
} from "lucide-react";

export interface AnnouncementItem {
  id: number | string;
  title: string;
  description?: string | null;
  date: string;
  category?: string | null;
  class_id?: number | string | null;
  class_name?: string | null;
  document_attachment?: string | null;
  attachment_original_name?: string | null;
  attachment_mime_type?: string | null;
  attachment_size?: number | null;
  attachment_url?: string | null;
  is_read?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

interface ClassOption {
  id: number | string;
  name: string;
}

const AnnouncementsPage: React.FC = () => {
  const role = useAccessRole();

  // Data states
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filters & Controls
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState<string>(() => searchParams.get("search") || "");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [attachmentFilter, setAttachmentFilter] = useState<string>("all"); // 'all', 'with_attachment', 'images', 'documents'
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  useEffect(() => {
    const q = searchParams.get("search");
    if (q !== null) {
      setSearch(q);
    }
  }, [searchParams]);

  // Notice Details / Attachment Preview Modal state
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [markingAllRead, setMarkingAllRead] = useState<boolean>(false);

  // Load available classes for target filter
  useEffect(() => {
    let active = true;
    api.getAll("classes", { page: 1, limit: 100 })
      .then((res) => {
        if (!active) return;
        if (res.success && Array.isArray(res.data?.classes)) {
          setClasses(res.data.classes.map((c: any) => ({ id: c.id, name: c.name })));
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Fetch announcements
  const fetchAnnouncements = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {
        page,
        limit,
        search: search.trim(),
      };

      if (selectedClass === "school_wide") {
        params.class_id = "school_wide";
      } else if (selectedClass !== "all") {
        params.class_id = selectedClass;
      }

      if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }

      if (attachmentFilter === "with_attachment") {
        params.has_attachment = "1";
      }

      const res = await api.getAll("announcements", params);

      if (res.success && Array.isArray(res.data?.announcements)) {
        let items: AnnouncementItem[] = res.data.announcements;

        // In-memory filter for specific mime types if requested
        if (attachmentFilter === "images") {
          items = items.filter(
            (item) => item.attachment_mime_type?.startsWith("image/") ||
              /\.(jpg|jpeg|png|webp|gif)$/i.test(item.attachment_original_name || "")
          );
        } else if (attachmentFilter === "documents") {
          items = items.filter(
            (item) =>
              (item.document_attachment || item.attachment_url) &&
              !item.attachment_mime_type?.startsWith("image/") &&
              !/\.(jpg|jpeg|png|webp|gif)$/i.test(item.attachment_original_name || "")
          );
        }

        // Sorting
        if (sortBy === "oldest") {
          items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        } else {
          items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        setAnnouncements(items);
        const p = res.data.pagination;
        setTotalPages(Math.max(1, Number(p?.pages) || 1));
        setTotalCount(Number(p?.total) || items.length);
        if (res.data.unread_count !== undefined) {
          setUnreadCount(Number(res.data.unread_count) || 0);
        }
      } else {
        setAnnouncements([]);
        setError(res.message || "Failed to load announcements");
      }
    } catch (err: any) {
      setAnnouncements([]);
      setError(err?.message || "Unable to connect to server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, search, selectedClass, selectedCategory, attachmentFilter, sortBy]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Sync when announcements are updated anywhere
  useEffect(() => {
    const handleSync = () => { void fetchAnnouncements(true); };
    window.addEventListener("school-announcements-updated", handleSync);
    return () => {
      window.removeEventListener("school-announcements-updated", handleSync);
    };
  }, [fetchAnnouncements]);

  // Reset page when search or class filter changes
  useEffect(() => {
    setPage(1);
  }, [search, selectedClass, selectedCategory, attachmentFilter, sortBy]);

  // Key metrics calculation
  const metrics = useMemo(() => {
    const total = totalCount || announcements.length;
    const schoolWide = announcements.filter((a) => !a.class_id).length;
    const classSpecific = announcements.filter((a) => !!a.class_id).length;
    const withAttachments = announcements.filter(
      (a) => !!(a.document_attachment || a.attachment_url)
    ).length;
    return { total, schoolWide, classSpecific, withAttachments };
  }, [announcements, totalCount]);

  // Open details and mark single announcement as read
  const openAnnouncementDetails = async (item: AnnouncementItem) => {
    setSelectedAnnouncement(item);
    if (!item.is_read) {
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, is_read: true } : a))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await api.create("announcements?action=mark-read", { id: item.id });
        window.dispatchEvent(new Event("school-announcements-updated"));
      } catch (err) {
        console.error("Failed to mark announcement as read", err);
      }
    }
  };

  // Mark all visible announcements as read
  const handleMarkAllAsRead = async () => {
    setMarkingAllRead(true);
    try {
      await api.create("announcements?action=mark-all-read", {});
      setAnnouncements((prev) => prev.map((a) => ({ ...a, is_read: true })));
      setUnreadCount(0);
      window.dispatchEvent(new Event("school-announcements-updated"));
    } catch (err) {
      console.error("Failed to mark all announcements as read", err);
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Build authenticated media URL for viewing/downloading
  const getAttachmentUrl = (item: AnnouncementItem) => {
    const token = api.getToken();
    const base = item.attachment_url || `/backend/api/announcements?action=attachment&id=${item.id}`;
    return token ? `${base}&token=${encodeURIComponent(token)}` : base;
  };

  const isImageAttachment = (item: AnnouncementItem) => {
    if (item.attachment_mime_type?.startsWith("image/")) return true;
    if (item.attachment_original_name && /\.(jpg|jpeg|png|webp|gif)$/i.test(item.attachment_original_name)) return true;
    return false;
  };

  const isPdfAttachment = (item: AnnouncementItem) => {
    if (item.attachment_mime_type === "application/pdf") return true;
    if (item.attachment_original_name && /\.pdf$/i.test(item.attachment_original_name)) return true;
    return false;
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Authenticated download helper
  const handleDownloadAttachment = async (item: AnnouncementItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (downloadingId) return;
    setDownloadingId(item.id);

    try {
      const { blob, filename, mime } = await api.downloadAnnouncementAttachment(item.id);
      const fileBlob = blob.type ? blob : new Blob([blob], { type: mime });
      const objectUrl = URL.createObjectURL(fileBlob);

      const isViewable = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"].includes(mime);
      if (isViewable) {
        const opened = window.open(objectUrl, "_blank");
        if (!opened) {
          const link = document.createElement("a");
          link.href = objectUrl;
          link.download = filename || item.attachment_original_name || "announcement_file";
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
      } else {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = filename || item.attachment_original_name || "announcement_file";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } catch {
      // Fallback direct URL with auth query
      window.open(getAttachmentUrl(item), "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  // Print announcement notice helper
  const handlePrintNotice = (item: AnnouncementItem) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Notice: ${item.title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 0 auto; }
          .header { border-bottom: 3px double #0284c7; padding-bottom: 20px; margin-bottom: 25px; text-align: center; }
          .school-name { font-size: 24px; font-weight: 800; color: #0369a1; letter-spacing: 1px; text-transform: uppercase; margin: 0; }
          .sub { font-size: 13px; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 2px; }
          .notice-tag { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 4px; font-weight: 700; font-size: 12px; margin-top: 15px; }
          .meta-row { display: flex; justify-content: space-between; margin-bottom: 25px; font-size: 13px; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .title { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
          .content { font-size: 15px; color: #334155; white-space: pre-wrap; line-height: 1.8; margin-bottom: 30px; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="school-name">Official Notice Board</h1>
          <div class="sub">Academic Announcement</div>
          <div class="notice-tag">${item.class_name ? `Target Class: ${item.class_name}` : "School-Wide Notice (All Students)"}</div>
        </div>
        <div class="meta-row">
          <div><strong>Date:</strong> ${item.date}</div>
          <div><strong>Notice ID:</strong> #${item.id}</div>
        </div>
        <h2 class="title">${item.title}</h2>
        <div class="content">${item.description || "No additional details provided."}</div>
        ${
          item.attachment_original_name
            ? `<div style="font-size: 13px; color: #475569; margin-top: 15px; padding: 10px; background: #f1f5f9; border-radius: 6px;"><strong>Attachment:</strong> ${item.attachment_original_name}</div>`
            : ""
        }
        <div class="footer">
          <div>Authorized Administration &bull; Academic Portal</div>
          <div>Printed on: ${new Date().toLocaleDateString()}</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 bg-gray-50/60 dark:bg-gray-900 min-h-screen">
      {/* ─── Top Header & Primary Action ─────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D32F45] text-white shadow-md shadow-purple-500/20">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                All Announcements
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                School-wide circulars, notices, and class bulletins with document attachments
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchAnnouncements(true)}
            disabled={refreshing}
            title="Refresh announcements list"
            className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-xs hover:bg-gray-50 dark:hover:bg-gray-700/60 active:scale-95 transition cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[#707E94]" : ""}`} />
            <span>Refresh</span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead}
              title="Mark all announcements as read"
              className="flex items-center gap-1.5 rounded-xl border border-[#707E94]/30 dark:border-[#707E94]/40 bg-[#707E94]/10 dark:bg-[#707E94]/20 px-3.5 py-2.5 text-xs font-semibold text-[#707E94] dark:text-[#a4b3c7] shadow-xs hover:bg-[#707E94]/15 dark:hover:bg-[#707E94]/20 active:scale-95 transition cursor-pointer"
            >
              <CheckCircle className="h-3.5 w-3.5 text-[#707E94] dark:text-[#a4b3c7]" />
              <span>{markingAllRead ? "Marking..." : `Mark all as read (${unreadCount})`}</span>
            </button>
          )}

          {(role === "admin" || role === "teacher") && (
            <div className="flex items-center">
              <FormModal
                table="announcement"
                type="create"
                onSuccess={() => {
                  setPage(1);
                  void fetchAnnouncements(true);
                  window.dispatchEvent(new Event("school-announcements-updated"));
                }}
                trigger={
                  <button
                    type="button"
                    title="Create new announcement"
                    className="flex items-center gap-2 rounded-xl bg-[#D32F45] hover:bg-[#b82639] active:scale-95 text-white px-3.5 py-2.5 text-xs font-semibold shadow-xs hover:shadow-md transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Announcement</span>
                  </button>
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── Statistics Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Total Announcements */}
        <div className="rounded-2xl border border-[#707E94]/20 dark:border-[#707E94]/20 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#707E94] dark:text-[#a4b3c7]">
              Total Notices
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#707E94]/10 dark:bg-[#707E94]/20 text-[#707E94] dark:text-[#a4b3c7]">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              {metrics.total}
            </span>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">published</span>
          </div>
        </div>

        {/* School-Wide */}
        <div className="rounded-2xl border border-sky-100 dark:border-sky-900/30 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              School-Wide
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              {metrics.schoolWide}
            </span>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">for all classes</span>
          </div>
        </div>

        {/* Class-Specific */}
        <div className="rounded-2xl border border-amber-100 dark:border-amber-900/30 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Class Targets
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              {metrics.classSpecific}
            </span>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">targeted notices</span>
          </div>
        </div>

        {/* With Attachments */}
        <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              With Files
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <FileDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              {metrics.withAttachments}
            </span>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">images & docs</span>
          </div>
        </div>
      </div>

      {/* ─── Filter & Toolbar Card ───────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search announcements by title or content..."
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/50 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-gray-800 dark:text-gray-200 outline-none transition focus:border-[#707E94] focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-[#707E94]/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filters & View Toggles */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Target Class Filter */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="announcement-target-class" className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5 text-[#707E94]" />
                <span className="hidden sm:inline">Audience:</span>
              </label>
              <select
                id="announcement-target-class"
                aria-label="Target class audience"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 outline-none focus:border-[#707E94] focus:ring-1 focus:ring-[#707E94]/30"
              >
                <option value="all">All Audiences</option>
                <option value="school_wide">School-Wide Only</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={String(cls.id)}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <select
              aria-label="Filter by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 outline-none focus:border-[#707E94] focus:ring-1 focus:ring-[#707E94]/30"
            >
              <option value="all">All Categories</option>
              <option value="Admission">Admission</option>
              <option value="Examination">Examination</option>
              <option value="Academic">Academic</option>
              <option value="General">General</option>
            </select>

            {/* Attachment Filter */}
            <select
              aria-label="Filter by attachment type"
              value={attachmentFilter}
              onChange={(e) => setAttachmentFilter(e.target.value)}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 outline-none focus:border-[#707E94] focus:ring-1 focus:ring-[#707E94]/30"
            >
              <option value="all">All Notices</option>
              <option value="with_attachment">With File Attached</option>
              <option value="images">Images Only</option>
              <option value="documents">Documents / PDF Only</option>
            </select>

            {/* Sort order */}
            <button
              type="button"
              onClick={() => setSortBy((prev) => (prev === "newest" ? "oldest" : "newest"))}
              title={`Sorting: ${sortBy === "newest" ? "Newest first" : "Oldest first"}`}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-[#707E94]" />
              <span className="capitalize">{sortBy}</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  viewMode === "table"
                    ? "bg-white dark:bg-gray-800 text-[#707E94] shadow-xs"
                    : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-gray-800 text-[#707E94] shadow-xs"
                    : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
                title="Notice Board Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content: Error State ───────────────────────────── */}
      {error && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
          <p className="font-semibold">{error}</p>
          <button
            onClick={() => fetchAnnouncements()}
            className="mt-2 text-xs font-semibold text-red-800 underline hover:no-underline"
          >
            Click to retry
          </button>
        </div>
      )}

      {/* ─── Loading Skeleton ────────────────────────────────────── */}
      {loading ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800 p-6 shadow-xs space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-3 animate-pulse border-b border-gray-100 dark:border-gray-700/40 last:border-0">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
              </div>
              <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="h-7 w-24 bg-gray-100 dark:bg-gray-800 rounded-lg" />
            </div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#707E94]/10 dark:bg-[#707E94]/20 text-[#707E94] dark:text-[#a4b3c7] mb-4">
            <Bell className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No announcements found</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {search || selectedClass !== "all" || attachmentFilter !== "all"
              ? "No announcements matched your search filters. Try adjusting your search query or filters."
              : "There are currently no active announcements. Click the button below to publish the first notice."}
          </p>
          {(role === "admin" || role === "teacher") && (
            <div className="mt-5 flex justify-center">
              <FormModal
                table="announcement"
                type="create"
                onSuccess={() => {
                  setPage(1);
                  void fetchAnnouncements(true);
                  window.dispatchEvent(new Event("school-announcements-updated"));
                }}
                trigger={
                  <button
                    type="button"
                    title="Create new announcement"
                    className="flex items-center gap-2 rounded-xl bg-[#D32F45] hover:bg-[#b82639] active:scale-95 text-white px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-md shadow-red-500/20 transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Announcement</span>
                  </button>
                }
              />
            </div>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* ─── Table View ─────────────────────────────────────────── */
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700/60 bg-gray-50/70 dark:bg-gray-900/40 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="py-3.5 px-4 sm:px-6">Announcement & Details</th>
                  <th className="py-3.5 px-4 hidden sm:table-cell">Category & Audience</th>
                  <th className="py-3.5 px-4">Publish Date</th>
                  <th className="py-3.5 px-4">Document / Image</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/40 text-xs sm:text-sm">
                {announcements.map((item) => {
                  const hasAttachment = !!(item.document_attachment || item.attachment_url);
                  const isImg = isImageAttachment(item);
                  const isPdf = isPdfAttachment(item);

                  return (
                    <tr
                      key={item.id}
                      onClick={() => openAnnouncementDetails(item)}
                      className="group cursor-pointer transition hover:bg-primary-50/60 dark:hover:bg-[#1a2332]"
                    >
                      {/* Title & Description */}
                      <td className="py-4 px-4 sm:px-6 max-w-xs md:max-w-md">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[#707E94]/15 text-[#707E94] dark:bg-[#707E94]/20 dark:text-[#a4b3c7] font-bold text-xs">
                            <Bell className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-[#556275] transition truncate flex items-center gap-2">
                              <span className="truncate">{item.title}</span>
                              {!item.is_read && (
                                <span className="shrink-0 rounded-full bg-[#D32F45] px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                                  New
                                </span>
                              )}
                            </h4>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                              {item.description || "No detailed description provided."}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Target Class Audience & Category */}
                      <td className="py-4 px-4 hidden sm:table-cell whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            item.category === "Admission"
                              ? "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300"
                              : item.category === "Examination"
                              ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                              : item.category === "Academic"
                              ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                          }`}>
                            {item.category || "General"}
                          </span>
                          {item.class_name ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/40 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              {item.class_name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/40 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                              School-Wide
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span>{item.date}</span>
                        </div>
                      </td>

                      {/* Document or Image Attachment Badge */}
                      <td className="py-4 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {hasAttachment ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleDownloadAttachment(item, e)}
                              disabled={downloadingId === item.id}
                              title={`Download or Open: ${item.attachment_original_name || "Attachment"}`}
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition active:scale-95 shadow-xs ${
                                isImg
                                  ? "bg-primary-100 text-primary-800 hover:bg-primary-200 dark:bg-[#243044] dark:text-[#a4b3c7]"
                                  : isPdf
                                  ? "bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950/60 dark:text-rose-300"
                                  : "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-950/60 dark:text-blue-300"
                              }`}
                            >
                              {downloadingId === item.id ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : isImg ? (
                                <ImageIcon className="h-3.5 w-3.5" />
                              ) : isPdf ? (
                                <FileText className="h-3.5 w-3.5" />
                              ) : (
                                <Download className="h-3.5 w-3.5" />
                              )}
                              <span className="truncate max-w-[110px]">
                                {item.attachment_original_name || (isImg ? "Image" : "Document")}
                              </span>
                              {item.attachment_size ? (
                                <span className="opacity-75 text-[10px]">
                                  ({formatFileSize(item.attachment_size)})
                                </span>
                              ) : null}
                            </button>

                            {/* If image, small quick-look button */}
                            {isImg && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setImagePreviewUrl(getAttachmentUrl(item));
                                }}
                                title="Enlarge image"
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-[#707E94]/15 hover:text-[#556275] transition"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-xs">— No File —</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            type="button"
                            onClick={() => openAnnouncementDetails(item)}
                            title="View full notice details"
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-primary-50 hover:text-[#707E94] dark:hover:bg-[#1a2332] transition cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Print notice */}
                          <button
                            type="button"
                            onClick={() => handlePrintNotice(item)}
                            title="Print notice"
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-sky-100 hover:text-sky-700 dark:hover:bg-sky-900/50 transition cursor-pointer"
                          >
                            <Printer className="h-4 w-4" />
                          </button>

                          {/* Edit / Delete modals for authorized roles */}
                          {(role === "admin" || role === "teacher") && (
                            <FormModal
                              table="announcement"
                              type="update"
                              data={item}
                              onSuccess={() => fetchAnnouncements(true)}
                            />
                          )}

                          {role === "admin" && (
                            <FormModal
                              table="announcement"
                              type="delete"
                              id={item.id}
                              onSuccess={() => fetchAnnouncements(true)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-100 dark:border-gray-700/60 p-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              total={totalCount}
              limit={limit}
            />
          </div>
        </div>
      ) : (
        /* ─── Notice Board / Grid Cards View ──────────────────────── */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {announcements.map((item) => {
              const hasAttachment = !!(item.document_attachment || item.attachment_url);
              const isImg = isImageAttachment(item);
              const isPdf = isPdfAttachment(item);

              return (
                <div
                  key={item.id}
                  onClick={() => openAnnouncementDetails(item)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-gray-200 dark:border-gray-700/70 bg-white dark:bg-gray-800 p-5 shadow-xs transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer overflow-hidden"
                >
                  {/* Top Color Accent */}
                  <div
                    className={`absolute inset-x-0 top-0 h-1.5 ${
                      item.class_name ? "bg-amber-500" : "bg-[#D32F45]"
                    }`}
                  />

                  <div>
                    {/* Header Chips */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          item.category === "Admission"
                            ? "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300"
                            : item.category === "Examination"
                            ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                            : item.category === "Academic"
                            ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                        }`}>
                          {item.category || "General"}
                        </span>
                        {item.class_name ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                            Class: {item.class_name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 text-[11px] font-bold text-sky-700 dark:text-sky-300">
                            School-Wide
                          </span>
                        )}
                      </div>

                      <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        {item.date}
                      </span>
                    </div>

                    {/* Notice Title */}
                    <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-[#556275] transition line-clamp-2 flex items-center gap-2">
                      <span className="line-clamp-2 flex-1">{item.title}</span>
                      {!item.is_read && (
                        <span className="shrink-0 rounded-full bg-[#D32F45] px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                          New
                        </span>
                      )}
                    </h3>

                    {/* Notice Body */}
                    <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                      {item.description || "No detailed description provided."}
                    </p>

                    {/* Attachment preview box if present */}
                    {hasAttachment && (
                      <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700/80 bg-gray-50/80 dark:bg-gray-900/50 p-2.5 overflow-hidden">
                        {isImg ? (
                          <div className="relative rounded-lg overflow-hidden max-h-36 bg-gray-900/10 dark:bg-gray-950 flex items-center justify-center">
                            <img
                              src={getAttachmentUrl(item)}
                              alt={item.title}
                              className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                              <span className="text-[11px] text-white font-medium flex items-center gap-1">
                                <Eye className="h-3 w-3" /> Click to view full image
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                              isPdf ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"
                            }`}>
                              {isPdf ? <FileText className="h-5 w-5" /> : <FileDown className="h-5 w-5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                                {item.attachment_original_name || "Attached Document"}
                              </p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                {isPdf ? "PDF Document" : "Downloadable File"}{" "}
                                {item.attachment_size ? `• ${formatFileSize(item.attachment_size)}` : ""}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Controls */}
                  <div
                    className="mt-5 pt-3.5 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => openAnnouncementDetails(item)}
                      className="text-xs font-bold text-[#707E94] hover:text-[#556275] dark:text-[#a4b3c7] dark:hover:text-white flex items-center gap-1"
                    >
                      <span>Read More</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>

                    <div className="flex items-center gap-1">
                      {hasAttachment && (
                        <button
                          type="button"
                          onClick={(e) => handleDownloadAttachment(item, e)}
                          title="Download attachment"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#556275] transition"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handlePrintNotice(item)}
                        title="Print notice"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-sky-600 transition"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>

                      {(role === "admin" || role === "teacher") && (
                        <FormModal
                          table="announcement"
                          type="update"
                          data={item}
                          onSuccess={() => fetchAnnouncements(true)}
                        />
                      )}

                      {role === "admin" && (
                        <FormModal
                          table="announcement"
                          type="delete"
                          id={item.id}
                          onSuccess={() => fetchAnnouncements(true)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination for Grid */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800 p-4 shadow-xs">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              total={totalCount}
              limit={limit}
            />
          </div>
        </div>
      )}

      {/* ─── Full Notice Details Modal ────────────────────────────── */}
      {selectedAnnouncement && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs transition-opacity"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-gray-800 p-6 sm:p-8 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setSelectedAnnouncement(null)}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`rounded-md px-2.5 py-0.5 text-xs font-bold ${
                selectedAnnouncement.category === "Admission"
                  ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                  : selectedAnnouncement.category === "Examination"
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
                  : selectedAnnouncement.category === "Academic"
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
                  : "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"
              }`}>
                {selectedAnnouncement.category || "General"}
              </span>
              {selectedAnnouncement.class_name ? (
                <span className="rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/40 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                  Target: {selectedAnnouncement.class_name}
                </span>
              ) : (
                <span className="rounded-md bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/40 px-2.5 py-0.5 text-xs font-bold text-sky-700 dark:text-sky-300">
                  School-Wide Announcement
                </span>
              )}
              <span className="text-xs text-gray-400">
                Notice #{selectedAnnouncement.id}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              {selectedAnnouncement.title}
            </h2>

            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pb-4 border-b border-gray-100 dark:border-gray-700/60">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#707E94]" />
                Date: <strong>{selectedAnnouncement.date}</strong>
              </span>
              {selectedAnnouncement.created_at && (
                <span>Published: {new Date(selectedAnnouncement.created_at).toLocaleDateString()}</span>
              )}
            </div>

            {/* Modal Notice Body */}
            <div className="mt-5 space-y-4 text-sm sm:text-base text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-normal">
              {selectedAnnouncement.description || (
                <p className="italic text-gray-400">No additional description was provided with this notice.</p>
              )}
            </div>

            {/* Embedded Attachment Section */}
            {(selectedAnnouncement.document_attachment || selectedAnnouncement.attachment_url) && (
              <div className="mt-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <FileDown className="h-4 w-4 text-[#707E94]" />
                    Attached Notice Document or Image
                  </h4>
                  {selectedAnnouncement.attachment_size ? (
                    <span className="text-[11px] text-gray-500">
                      {formatFileSize(selectedAnnouncement.attachment_size)}
                    </span>
                  ) : null}
                </div>

                {/* If Image: display image preview */}
                {isImageAttachment(selectedAnnouncement) ? (
                  <div className="space-y-3">
                    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black/5 dark:bg-black/40 max-h-80 flex items-center justify-center">
                      <img
                        src={getAttachmentUrl(selectedAnnouncement)}
                        alt={selectedAnnouncement.title}
                        className="w-full h-auto max-h-80 object-contain cursor-zoom-in"
                        onClick={() => setImagePreviewUrl(getAttachmentUrl(selectedAnnouncement))}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-xs text-gray-500 truncate max-w-xs">
                        {selectedAnnouncement.attachment_original_name || "Announcement Image"}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setImagePreviewUrl(getAttachmentUrl(selectedAnnouncement))}
                          className="rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 transition"
                        >
                          Enlarge
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadAttachment(selectedAnnouncement)}
                          className="rounded-lg bg-[#D32F45] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#be2035] transition flex items-center gap-1"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download Image
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* If Document or PDF */
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
                        isPdfAttachment(selectedAnnouncement)
                          ? "bg-rose-100 text-rose-600 dark:bg-rose-950/60"
                          : "bg-blue-100 text-blue-600 dark:bg-blue-950/60"
                      }`}>
                        {isPdfAttachment(selectedAnnouncement) ? (
                          <FileText className="h-6 w-6" />
                        ) : (
                          <FileDown className="h-6 w-6" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {selectedAnnouncement.attachment_original_name || "Attachment Document"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {isPdfAttachment(selectedAnnouncement) ? "Adobe PDF Document" : "Official Notice File"}{" "}
                          {selectedAnnouncement.attachment_size
                            ? `• ${formatFileSize(selectedAnnouncement.attachment_size)}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadAttachment(selectedAnnouncement)}
                      disabled={downloadingId === selectedAnnouncement.id}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-[#D32F45] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#be2035] active:scale-95 transition cursor-pointer"
                    >
                      {downloadingId === selectedAnnouncement.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      <span>Download / Open File</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/60">
              <button
                type="button"
                onClick={() => handlePrintNotice(selectedAnnouncement)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Official Notice</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAnnouncement(null)}
                  className="rounded-xl bg-gray-100 dark:bg-gray-700 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Lightbox Fullscreen Image Preview ────────────────────── */}
      {imagePreviewUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setImagePreviewUrl(null)}
        >
          <button
            type="button"
            onClick={() => setImagePreviewUrl(null)}
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={imagePreviewUrl}
            alt="Announcement Full Preview"
            className="max-h-[90vh] max-w-[95vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
