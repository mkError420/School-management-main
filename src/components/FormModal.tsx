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
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
  </div>
);

const FormModal: React.FC<FormModalProps> = ({ table, type, data, id, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-lamaYellow hover:bg-yellow-400"
      : type === "update"
      ? "bg-lamaSky hover:bg-sky-400"
      : "bg-lamaPurple hover:bg-purple-400";

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
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <span className="text-red-600 text-lg">⚠️</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Confirm Deletion</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                This action cannot be undone. All data for this {table} will be permanently removed.
              </p>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
      <button
        className={`${size} flex items-center justify-center rounded-full ${bgColor} transition shadow-sm`}
        onClick={() => setOpen(true)}
        title={`${type} ${table}`}
      >
        <Image src={`/${type}.png`} alt={type} width={14} height={14} />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-white rounded-2xl relative w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 capitalize">
                {type} {table}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
              >
                <Image src="/close.png" alt="close" width={14} height={14} />
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
