import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import TeacherProfileView, { type TeacherProfileDetails } from "./TeacherProfileView";

const SingleTeacherPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [details, setDetails] = useState<TeacherProfileDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    if (!id) {
      setError("A teacher ID was not provided.");
      setLoading(false);
      return;
    }

    api.getById<TeacherProfileDetails>("teachers", id).then((response) => {
      if (!active) return;
      if (!response.success || !response.data?.teacher) {
        setDetails(null);
        setError(response.message || "Unable to load this teacher.");
        return;
      }
      setDetails({
        ...response.data,
        subjects: response.data.subjects || [],
        classes: response.data.classes || [],
        supervised_classes: response.data.supervised_classes || [],
        lessons: response.data.lessons || [],
        exams: response.data.exams || [],
        assignments: response.data.assignments || [],
        students: response.data.students || [],
        results: response.data.results || [],
        attendance: response.data.attendance || { total: 0, present: 0 },
        announcements: response.data.announcements || [],
      });
    }).catch((requestError: unknown) => {
      if (!active) return;
      setDetails(null);
      setError(requestError instanceof Error ? requestError.message : "Unable to load this teacher.");
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [id, reload]);

  if (loading) {
    return <div className="m-4 flex min-h-64 items-center justify-center text-sm text-gray-500">Loading teacher details...</div>;
  }

  if (error || !details) {
    return (
      <div className="m-4 rounded-xl border border-red-200 bg-white p-6" role="alert">
        <h1 className="text-lg font-semibold text-gray-900">Teacher details unavailable</h1>
        <p className="mt-2 text-sm text-red-700">{error || "This teacher could not be found."}</p>
        <div className="mt-4 flex gap-3">
          <button onClick={() => setReload((value) => value + 1)} className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">Retry</button>
          <Link to="/list/teachers" className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Back to teachers</Link>
        </div>
      </div>
    );
  }

  return <TeacherProfileView details={details} onReload={() => setReload((value) => value + 1)} />;
};

export default SingleTeacherPage;
