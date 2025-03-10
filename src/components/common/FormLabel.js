import React from "react";

const FormLabel = ({ label, required = false, className = "" }) => {
  return (
    <label
      className={`w-[80px] flex items-center font-semibold text-black ${className}`}
      style={{ whiteSpace: "nowrap" }}
    >
      {label}:{required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

export default FormLabel;
