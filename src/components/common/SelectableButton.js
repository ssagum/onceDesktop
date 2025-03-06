import React from "react";

const SelectableButton = ({
  field,
  value,
  onChange,
  className = "",
  disabled = false,
}) => {
  const isSelected = field === value;

  return (
    <button
      className={`w-[110px] border rounded-md h-[40px] mr-[20px] ${
        isSelected
          ? "bg-onceBlue text-white border-onceBlue"
          : "border-gray-400 bg-white text-black"
      } ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`}
      onClick={() => {
        if (!disabled) onChange(value);
      }}
      disabled={disabled}>
      {value}
    </button>
  );
};

export default SelectableButton;
