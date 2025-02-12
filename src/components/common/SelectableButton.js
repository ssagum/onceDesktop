import React from "react";

const SelectableButton = ({ field, value, onChange, className = "" }) => {
  const isSelected = field === value;

  return (
    <button
      className={`w-[110px] border rounded-md h-[40px] mr-[20px] ${
        isSelected
          ? "bg-onceBlue text-white border-onceBlue"
          : "border-gray-400 bg-white text-black"
      } ${className}`}
      onClick={() => onChange(value)}
    >
      {value}
    </button>
  );
};

export default SelectableButton;
