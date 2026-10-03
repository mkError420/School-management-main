import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Entity =
  | "teacher" | "student" | "parent" | "subject" | "class" | "lesson"
  | "exam" | "assignment" | "result" | "attendance" | "event" | "announcement";

type SelectOption = { value: string; label: string };
type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "number" | "date" | "datetime-local" | "textarea" | "select" | "multiselect" | "checkbox" | "file";
  required?: boolean;
  options?: SelectOption[];
  resource?: string;
  collection?: string;
  resourcesByValue?: Record<string, string>;
  min?: number;
  max?: number;
};

const collectionNames: Record<string, string> = {
  teachers: "teachers", students: "students", parents: "parents", subjects: "subjects",
  classes: "classes", grades: "grades", lessons: "lessons", exams: "exams",
  assignments: "assignments",
};

const apiResources: Record<Entity, string> = {
  teacher: "teachers", student: "students", parent: "parents", subject: "subjects",
  class: "classes", lesson: "lessons", exam: "exams", assignment: "assignments",
  result: "results", attendance: "attendance", event: "events", announcement: "announcements",
};

const fieldsByEntity: Record<Entity, Field[]> = {
  teacher: [
    { name: "username", label: "Username", required: true },
    { name: "password", label: "Password", type: "password", required: true },
    { name: "name", label: "First name", required: true },
    { name: "surname", label: "Last name", required: true },
    { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Phone" },
    { name: "address", label: "Address", type: "textarea", required: true },
    { name: "blood_type", label: "Blood type", required: true },
    { name: "sex", label: "Sex", type: "select", required: true, options: [{ value: "MALE", label: "Male" }, { value: "FEMALE", label: "Female" }] },
    { name: "img", label: "Teacher photo", type: "file" },
    { name: "subject_ids", label: "Subjects", type: "multiselect", resource: "subjects" },
    { name: "class_ids", label: "Classes", type: "multiselect", resource: "classes" },
  ],
  student: [
    { name: "username", label: "Username", required: true },
    { name: "password", label: "Password", type: "password", required: true },
    { name: "name", label: "First name", required: true },
    { name: "surname", label: "Last name", required: true },
    { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Phone" },
    { name: "address", label: "Address", type: "textarea", required: true },
    { name: "blood_type", label: "Blood type", required: true },
    { name: "sex", label: "Sex", type: "select", required: true, options: [{ value: "MALE", label: "Male" }, { value: "FEMALE", label: "Female" }] },
    { name: "img", label: "Student photo", type: "file" },
    { name: "parent_id", label: "Parent", type: "select", required: true, resource: "parents" },
    { name: "class_id", label: "Class", type: "select", required: true, resource: "classes" },
    { name: "grade_id", label: "Grade", type: "select", required: true, resource: "grades" },
  ],
  parent: [
    { name: "username", label: "Username", required: true },
    { name: "password", label: "Password", type: "password", required: true },
    { name: "name", label: "First name", required: true },
    { name: "surname", label: "Last name", required: true },
    { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Phone", required: true },
    { name: "address", label: "Address", type: "textarea", required: true },
    { name: "img", label: "Parent photo", type: "file" },
  ],
  subject: [{ name: "name", label: "Subject name", required: true }],
  class: [
    { name: "name", label: "Class name", required: true },
    { name: "capacity", label: "Capacity", type: "number", required: true, min: 1 },
    { name: "supervisor_id", label: "Supervisor", type: "select", required: true, resource: "teachers" },
    { name: "grade_id", label: "Grade", type: "select", required: true, resource: "grades" },
  ],
  lesson: [
    { name: "name", label: "Lesson name", required: true },
    { name: "day", label: "Day", type: "select", required: true, options: ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"].map((day) => ({ value: day, label: day[0] + day.slice(1).toLowerCase() })) },
    { name: "start_time", label: "Start time", type: "datetime-local", required: true },
    { name: "end_time", label: "End time", type: "datetime-local", required: true },
    { name: "subject_id", label: "Subject", type: "select", required: true, resource: "subjects" },
    { name: "class_id", label: "Class", type: "select", required: true, resource: "classes" },
    { name: "teacher_id", label: "Teacher", type: "select", required: true, resource: "teachers" },
  ],
  exam: [
    { name: "title", label: "Exam title", required: true },
    { name: "start_time", label: "Start time", type: "datetime-local", required: true },
    { name: "end_time", label: "End time", type: "datetime-local", required: true },
    { name: "lesson_id", label: "Lesson", type: "select", required: true, resource: "lessons" },
  ],
  assignment: [
    { name: "title", label: "Assignment title", required: true },
    { name: "start_date", label: "Start date", type: "datetime-local", required: true },
    { name: "due_date", label: "Due date", type: "datetime-local", required: true },
    { name: "lesson_id", label: "Lesson", type: "select", required: true, resource: "lessons" },
  ],
  result: [
    { name: "score", label: "Score (%)", type: "number", required: true, min: 0, max: 100 },
    { name: "student_id", label: "Student", type: "select", required: true, resource: "students" },
    { name: "result_type", label: "Result type", type: "select", required: true, options: [{ value: "exam", label: "Exam" }, { value: "assignment", label: "Assignment" }] },
    { name: "assessment_id", label: "Exam or assignment", type: "select", required: true, resourcesByValue: { exam: "exams", assignment: "assignments" } },
  ],
  attendance: [
    { name: "date", label: "Date", type: "date", required: true },
    { name: "student_id", label: "Student", type: "select", required: true, resource: "students" },
    { name: "lesson_id", label: "Lesson", type: "select", required: true, resource: "lessons" },
    { name: "present", label: "Present", type: "checkbox" },
  ],
  event: [
    { name: "title", label: "Event title", required: true },
    { name: "description", label: "Description", type: "textarea" },
    { name: "start_time", label: "Start time", type: "datetime-local", required: true },
    { name: "end_time", label: "End time", type: "datetime-local", required: true },
    { name: "class_id", label: "Class (optional)", type: "select", resource: "classes" },
  ],
  announcement: [
    { name: "title", label: "Announcement title", required: true },
    { name: "description", label: "Description", type: "textarea" },
    { name: "date", label: "Date", type: "date", required: true },
    { name: "class_id", label: "Class (optional)", type: "select", resource: "classes" },
  ],
};

interface EntityFormProps {
  entity: Entity;
  type: "create" | "update";
  data?: Record<string, any>;
  onSuccess?: () => void;
}

const formatOptionLabel = (resource: string, item: Record<string, any>) => {
  if (resource === "grades") return `Grade ${item.level}`;
  const name = [item.name, item.surname].filter(Boolean).join(" ");
  return name || item.title || item.username || `#${item.id}`;
};

const formatInputValue = (field: Field, value: any) => {
  if (value == null) return "";
  if (field.type === "datetime-local") return String(value).replace(" ", "T").slice(0, 16);
  if (field.type === "date") return String(value).slice(0, 10);
  return value;
};

const EntityForm: React.FC<EntityFormProps> = ({ entity, type, data, onSuccess }) => {
  const fields = fieldsByEntity[entity];
  const [values, setValues] = useState<Record<string, any>>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [options, setOptions] = useState<Record<string, SelectOption[]>>({});
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiredResources = useMemo(() => Array.from(new Set(fields.flatMap((field) => [field.resource, ...Object.values(field.resourcesByValue || {})].filter(Boolean) as string[]))), [fields]);

  useEffect(() => {
    let active = true;
    setLoadingOptions(true);
    Promise.all(requiredResources.map(async (resource) => {
      const response = await api.getAll(resource, { page: 1, limit: 1000 });
      const collection = collectionNames[resource];
      if (!response.success || !Array.isArray(response.data?.[collection])) {
        throw new Error(response.message || `Unable to load ${resource} options.`);
      }
      return [resource, response.data[collection].map((item: Record<string, any>) => ({ value: String(item.id), label: formatOptionLabel(resource, item) }))] as const;
    })).then((entries) => {
      if (active) setOptions(Object.fromEntries(entries));
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load form options.");
    }).finally(() => {
      if (active) setLoadingOptions(false);
    });
    return () => {
      active = false;
    };
  }, [requiredResources]);

  useEffect(() => {
    const initialValues: Record<string, any> = {};
    fields.forEach((field) => {
      if (field.name === "password") {
        initialValues[field.name] = "";
      } else if (field.type === "file") {
        initialValues[field.name] = null;
      } else if (entity === "teacher" && field.name === "subject_ids") {
        initialValues[field.name] = data?.subjects?.map((item: any) => String(item.id)) || [];
      } else if (entity === "teacher" && field.name === "class_ids") {
        initialValues[field.name] = data?.classes?.map((item: any) => String(item.id)) || [];
      } else if (entity === "result" && field.name === "result_type") {
        initialValues[field.name] = data?.assignment_id ? "assignment" : "exam";
      } else if (entity === "result" && field.name === "assessment_id") {
        initialValues[field.name] = String(data?.assignment_id || data?.exam_id || "");
      } else {
        initialValues[field.name] = field.type === "checkbox"
          ? Boolean(data?.[field.name])
          : formatInputValue(field, data?.[field.name]);
      }
    });
    setValues(initialValues);
    setSelectedImage(null);
  }, [data, entity, fields]);

  useEffect(() => {
    if (!selectedImage) {
      setImagePreview((entity === "teacher" || entity === "student" || entity === "parent") ? data?.img || null : null);
      return;
    }
    const previewUrl = URL.createObjectURL(selectedImage);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [data?.img, entity, selectedImage]);

  const setValue = (name: string, value: any) => {
    setValues((current) => name === "result_type"
      ? { ...current, [name]: value, assessment_id: "" }
      : { ...current, [name]: value });
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Record<string, any> = {};
    fields.forEach((field) => {
      if (field.name === "result_type" || field.name === "assessment_id") return;
      if (field.type === "file") return;
      const value = values[field.name];
      if (field.name === "username" && type === "update") return;
      if (field.type === "datetime-local" && value) payload[field.name] = String(value).replace("T", " ") + (String(value).length === 16 ? ":00" : "");
      else if (field.type === "number") payload[field.name] = value === "" ? "" : Number(value);
      else if (field.type === "select" && !value) payload[field.name] = null;
      else payload[field.name] = value;
    });

    if (entity === "result") {
      const selectedType = values.result_type;
      payload.exam_id = selectedType === "exam" ? values.assessment_id : null;
      payload.assignment_id = selectedType === "assignment" ? values.assessment_id : null;
    }

    try {
      let response;
      if ((entity === "teacher" || entity === "student" || entity === "parent") && selectedImage) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((item) => formData.append(`${key}[]`, String(item)));
          } else if (value !== null && value !== undefined) {
            formData.append(key, String(value));
          }
        });
        formData.append("img", selectedImage, selectedImage.name);
        response = type === "create"
          ? await api.create(apiResources[entity], formData)
          : await api.updateMultipart(apiResources[entity], data?.id, formData);
      } else {
        response = type === "create"
          ? await api.create(apiResources[entity], payload)
          : await api.update(apiResources[entity], data?.id, payload);
      }
      if (!response.success) {
        setError(response.message || `Unable to ${type} ${entity}.`);
        return;
      }
      onSuccess?.();
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : `Unable to ${type} ${entity}.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="flex flex-col gap-5 p-6" onSubmit={handleSubmit}>
      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
      {loadingOptions && <p className="text-sm text-gray-500">Loading available records...</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          if (entity === "result" && field.name === "assessment_id" && !values.result_type) return null;
          if (field.name === "password" && type === "update") {
            return (
              <label key={field.name} className="flex flex-col gap-1.5 text-sm text-gray-700">
                {field.label} (leave blank to keep current)
                <input type="password" autoComplete="new-password" value={values[field.name] || ""} onChange={(event) => setValue(field.name, event.target.value)} minLength={6} className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-sky-500" />
              </label>
            );
          }

          if (field.type === "checkbox") {
            return (
              <label key={field.name} className="flex items-center gap-2 self-end py-2 text-sm text-gray-700">
                <input type="checkbox" checked={Boolean(values[field.name])} onChange={(event) => setValue(field.name, event.target.checked)} className="h-4 w-4" />
                {field.label}
              </label>
            );
          }

          if (field.type === "file") {
            return (
              <div key={field.name} className="flex flex-col gap-2 text-sm text-gray-700 sm:col-span-2">
                <span className="font-medium">{field.label}</span>
                <div className="flex flex-wrap items-center gap-4 rounded-md border border-dashed border-gray-300 bg-gray-50 p-3">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Photo preview" className="h-20 w-20 rounded-md border border-gray-200 object-cover" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-md bg-white text-xs text-gray-400">No photo</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        if (file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                          setError("Choose a JPG, PNG, or WebP image.");
                          event.target.value = "";
                          return;
                        }
                        if (file && file.size > 5 * 1024 * 1024) {
                          setError("Photo must be no larger than 5 MB.");
                          event.target.value = "";
                          return;
                        }
                        setSelectedImage(file);
                        setError(null);
                      }}
                      className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-sky-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-sky-800 hover:file:bg-sky-200"
                    />
                    <p className="mt-2 text-xs text-gray-500">JPG, PNG, or WebP. Maximum file size 5 MB.</p>
                    {type === "update" && data?.img && !selectedImage && <p className="mt-1 text-xs text-gray-500">Choose a new image to replace the current photo.</p>}
                  </div>
                </div>
              </div>
            );
          }

          const optionResource = field.resourcesByValue?.[values.result_type] || field.resource;
          const fieldOptions = field.options || (optionResource ? options[optionResource] || [] : []);
          const inputClass = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-500";
          const label = <span>{field.label}{field.required ? " *" : ""}</span>;

          return (
            <label key={field.name} className={`flex flex-col gap-1.5 text-sm text-gray-700 ${field.type === "textarea" ? "sm:col-span-2" : ""}`}>
              {label}
              {field.type === "textarea" ? (
                <textarea required={field.required} value={values[field.name] ?? ""} onChange={(event) => setValue(field.name, event.target.value)} rows={3} className={inputClass} />
              ) : field.type === "select" || field.type === "multiselect" ? (
                <select
                  required={field.required}
                  multiple={field.type === "multiselect"}
                  value={values[field.name] ?? (field.type === "multiselect" ? [] : "")}
                  onChange={(event) => setValue(field.name, field.type === "multiselect" ? Array.from(event.target.selectedOptions, (option) => option.value) : event.target.value)}
                  className={`${inputClass} ${field.type === "multiselect" ? "min-h-24" : ""}`}
                >
                  {field.type !== "multiselect" && <option value="">Select {field.label.toLowerCase()}</option>}
                  {fieldOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              ) : (
                <input
                  required={field.required}
                  type={field.type || "text"}
                  disabled={field.name === "username" && type === "update"}
                  min={field.min}
                  max={field.max}
                  minLength={field.type === "password" ? 6 : undefined}
                  autoComplete={field.type === "password" ? "new-password" : undefined}
                  value={values[field.name] ?? ""}
                  onChange={(event) => setValue(field.name, event.target.value)}
                  className={`${inputClass} ${field.name === "username" && type === "update" ? "bg-gray-100 text-gray-500" : ""}`}
                />
              )}
            </label>
          );
        })}
      </div>
      <div className="flex justify-end border-t border-gray-100 pt-4">
        <button type="submit" disabled={saving || loadingOptions} className="rounded-md bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? "Saving..." : type === "create" ? `Create ${entity}` : `Save changes`}
        </button>
      </div>
    </form>
  );
};

export default EntityForm;