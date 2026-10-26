"use client"

import React, { Suspense, lazy, useState } from "react";
import Image from "@/components/Image";
import { api } from "@/lib/api";

const EntityForm = lazy(() => import("./forms/EntityForm"));

type TableType =
  | "teacher" | "student" | "parent" | "subject" | "class"
  | "lesson" | "exam" | "assignment" | "result" | "attendance"
  | "event" | "announcement";

type ModalType = "create" | "update" | "delete";

interface FormModalProps {
  table: TableType;
  type: ModalType;
  data?: any;
  id?: number | string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const resourceMap: Record<TableType, string> = {
  teacher: "teachers",
  student: "students",
  parent: "parents",
  subject: "subjects",
  class: "classes",
  lesson: "lessons",
  exam: "exams",
  assignment: "assignments",
  result: "results",
  attendance: "attendance",
  event: "events",
  announcement: "announcements",
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#707E94]"></div>
  </div>
);

const FormModal: React.FC<FormModalProps> = ({ table, type, data, id, onSuccess, trigger }) => {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-[#707E94] hover:bg-[#5a6679]"
      : type === "update"
      ? "bg-[#707E94]/80 hover:bg-[#707E94]"
      : "bg-[#D32F45] hover:bg-[#be2035]";

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await api.delete(resourceMap[table], id);
      if (res.success) {
        setOpen(false);
        onSuccess?.();
      } else {
        setError(res.message || "Delete failed");
      }
    } catch (err: any) {
      setError(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleFormSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  const FormContent = () => {
    if (type === "delete" && id !== undefined && id !== null) {
      return (
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D32F45]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[#D32F45] text-lg">⚠️</span>
            </div>
            <div>
              <h3 className="font-semibold text-black dark:text-white">Confirm Deletion</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                This action cannot be undone. All data for this {table} will be permanently removed.
              </p>
            </div>
          </div>
          {error && <p className="text-sm text-[#D32F45] bg-[#D32F45]/10 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium text-white bg-[#D32F45] rounded-lg hover:bg-[#be2035] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? "Deleting..." : `Delete ${table}`}
            </button>
          </div>
        </div>
      );
    }

    return (
      <Suspense fallback={<LoadingSpinner />}>
        <EntityForm entity={table} type={type as "create" | "update"} data={data} onSuccess={handleFormSuccess} />
      </Suspense>
    );
  };

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="inline-flex cursor-pointer">
          {trigger}
        </span>
      ) : (
        <button
          className={`${size} flex items-center justify-center rounded-full ${bgColor} transition shadow-sm text-white`}
          onClick={() => setOpen(true)}
          title={`${type} ${table}`}
        >
          <Image src={`/${type}.png`} alt={type} width={14} height={14} />
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl relative w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-black dark:text-white capitalize">
                {type} {table}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <Image src="/close.png" alt="close" width={14} height={14} className="dark:brightness-0 dark:invert" />
              </button>
            </div>
            <FormContent />
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
