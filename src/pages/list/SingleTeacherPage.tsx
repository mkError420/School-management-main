import React from "react";
import { useParams } from "react-router-dom";
import Image from "@/components/Image";

const SingleTeacherPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="bg-white p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm">
      <h1 className="text-xl font-semibold mb-4">Teacher Details</h1>
      <p className="text-gray-600">Teacher ID: {id}</p>
      <p className="text-gray-500 mt-2">Teacher details page - Coming soon</p>
    </div>
  );
};

export default SingleTeacherPage;
