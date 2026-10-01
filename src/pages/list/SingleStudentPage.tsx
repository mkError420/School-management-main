import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import StudentProfileView, { type StudentProfileDetails } from "./StudentProfileView";

const SingleStudentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [details, setDetails] = useState<StudentProfileDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    if (!id) {
      setError("A student ID was not provided.");
      setLoading(false);
      return;
    }

    api.getById<StudentProfileDetails>("students", id).then((response) => {
      if (!active) return;
      if (!response.success || !response.data?.student) {
        setDetails(null);
        setError(response.message || "Unable to load this student.");
        return;
      }
      setDetails({
        ...response.data,
        attendance: response.data.attendance || [],
        results: response.data.results || [],
        lessons: response.data.lessons || [],
        teachers: response.data.teachers || [],
        exams: response.data.exams || [],
        assignments: response.data.assignments || [],
        announcements: response.data.announcements || [],
      });
    }).catch((requestError: unknown) => {
      if (!active) return;
      setDetails(null);
      setError(requestError instanceof Error ? requestError.message : "Unable to load this student.");
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [id, reload]);

  if (loading) {
    return <div className="m-4 flex min-h-64 items-center justify-center text-sm text-gray-500">Loading student details...</div>;
  }

  if (error || !details) {
    return (
      <div className="m-4 rounded-xl border border-red-200 bg-white p-6" role="alert">
        <h1 className="text-lg font-semibold text-gray-900">Student details unavailable</h1>
        <p className="mt-2 text-sm text-red-700">{error || "This student could not be found."}</p>
        <div className="mt-4 flex gap-3">
          <button onClick={() => setReload((value) => value + 1)} className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">Retry</button>
          <Link to="/list/students" className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Back to students</Link>
        </div>
      </div>
    );
  }

  return <StudentProfileView details={details} onReload={() => setReload((value) => value + 1)} />;
};

export default SingleStudentPage;
