import React from "react";

const DayToggle = ({ text, isOn, onClick, disabled }) => {
  return (
    <div
      className={`flex items-center justify-center w-[30px] h-[30px] rounded-full cursor-pointer
        ${
          disabled
            ? "bg-gray-200 text-gray-500"
            : isOn
            ? "bg-onceBlue text-white"
            : "bg-gray-100 text-gray-600"
        } 
        ${!disabled && "hover:opacity-80"}`}
      onClick={() => !disabled && onClick()}
    >
      <span className="text-[14px] font-medium">{text}</span>
    </div>
  );
};

export default DayToggle;
