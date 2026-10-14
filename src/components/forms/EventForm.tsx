"use client";

import React, { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

interface EventFormProps {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ type, data, onSuccess }) => {
  const [title, setTitle] = useState(data?.title || "");
  const [description, setDescription] = useState(data?.description || "");
  const [startTime, setStartTime] = useState(data?.start_time ? data.start_time.replace(" ", "T").substring(0, 16) : "");
  const [endTime, setEndTime] = useState(data?.end_time ? data.end_time.replace(" ", "T").substring(0, 16) : "");
  const [classId, setClassId] = useState(data?.class_id || "");
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    api.getAll("classes", { page: 1, limit: 100 }).then((res) => {
      if (res.success && res.data) {
        const list = Array.isArray(res.data.classes) ? res.data.classes : Array.isArray(res.data) ? res.data : [];
        setClasses(list);
      }
    }).catch(() => {});
  }, []);

  const handleFileChange = (f: File | null) => {
    if (!f) return;
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowed.includes(f.type) && !f.name.match(/\.(pdf|jpg|jpeg|png|webp|gif)$/i)) {
      setError("Only PDF or image files (JPG, PNG, WebP, GIF) are allowed.");
      return;
    }
    if (f.size > 25 * 1024 * 1024) {
      setError("Document must be 25 MB or smaller.");
      return;
    }
    setError(null);
    setFile(f);
    setRemoveAttachment(false);
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("start_time", startTime.replace("T", " ") + (startTime.length === 16 ? ":00" : ""));
      formData.append("end_time", endTime.replace("T", " ") + (endTime.length === 16 ? ":00" : ""));
      if (classId) formData.append("class_id", String(classId));
      if (file) formData.append("document_attachment", file, file.name);
      if (removeAttachment) formData.append("remove_attachment", "1");

      const res = type === "create"
        ? await api.create("events", formData)
        : await api.update("events", data?.id, formData);

      if (res.success) {
        onSuccess?.();
      } else {
        setError(res.message || "Failed to save event");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const hasExistingAttachment = !removeAttachment && !!data?.attachment_original_name && !file;
  const isPdf = file ? file.type === "application/pdf" : data?.attachment_mime_type === "application/pdf";

  return (
    <form className="flex flex-col gap-4 text-sm" onSubmit={handleSubmit}>
      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
        {type === "create" ? "Create a New Event" : "Update Event"}
      </h2>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col gap-1">
        <label className="font-medium text-gray-700 dark:text-gray-300 text-xs">
          Event Title *
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Annual Sports Meet 2026"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 outline-none focus:border-[#707E94]"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <label className="font-medium text-gray-700 dark:text-gray-300 text-xs">
          Description
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Event details, schedule, or guidelines..."
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 outline-none focus:border-[#707E94]"
        />
      </div>

      {/* Dates Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-medium text-gray-700 dark:text-gray-300 text-xs">
            Start Time *
          </label>
          <input
            type="datetime-local"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 outline-none focus:border-[#707E94]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium text-gray-700 dark:text-gray-300 text-xs">
            End Time *
          </label>
          <input
            type="datetime-local"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 outline-none focus:border-[#707E94]"
          />
        </div>
      </div>

      {/* Class */}
      <div className="flex flex-col gap-1">
        <label className="font-medium text-gray-700 dark:text-gray-300 text-xs">
          Target Class (Optional)
        </label>
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 outline-none focus:border-[#707E94]"
        >
          <option value="">All Classes &amp; Students</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              Class {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Document Upload Field (Image or PDF) */}
      <div className="flex flex-col gap-1">
        <label className="font-medium text-gray-700 dark:text-gray-300 text-xs">
          Upload Event Document / Notice (Image or PDF)
        </label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed p-4 transition text-center ${
            dragOver
              ? "border-[#707E94] bg-[#707E94]/10 dark:bg-[#707E94]/20"
              : "border-gray-300 bg-gray-50 hover:border-[#707E94]/40 hover:bg-[#707E94]/10 dark:bg-gray-700/40 dark:border-gray-600"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
              e.target.value = "";
            }}
          />

          {(file || hasExistingAttachment) ? (
            <div className="flex items-center gap-3 text-left">
              {isPdf ? (
                <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 font-bold text-xs flex-shrink-0">
                  PDF
                </div>
              ) : filePreview ? (
                <img src={filePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover border flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-[#707E94]/15 dark:bg-[#707E94]/20 flex items-center justify-center text-[#707E94] font-bold text-xs flex-shrink-0">
                  IMG
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 dark:text-gray-200 text-xs truncate">
                  {file ? file.name : data?.attachment_original_name}
                </p>
                <p className="text-[11px] text-gray-400">
                  {file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : "Attached file"}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setFilePreview(null);
                  if (hasExistingAttachment) setRemoveAttachment(true);
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-100 text-rose-700 hover:bg-rose-200 transition"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="py-2">
              <p className="text-xs font-semibold text-[#707E94] dark:text-[#a4b3c7]">
                Click or drag &amp; drop document to upload
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                PDF, JPG, PNG, WebP — max 25 MB
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 rounded-xl bg-[#D32F45] hover:bg-[#be2035] text-white font-semibold text-xs transition disabled:opacity-50"
        >
          {saving ? "Saving..." : type === "create" ? "Create Event" : "Update Event"}
        </button>
      </div>
    </form>
  );
};

export default EventForm;