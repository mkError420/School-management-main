"use client";

import React from "react";
import EntityForm from "./EntityForm";

interface AssignmentFormProps {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({ type, data, onSuccess }) => {
  return <EntityForm entity="assignment" type={type} data={data} onSuccess={onSuccess} />;
};

export default AssignmentForm;