import React from "react";

const PriorityToggle = ({ text, isOn, onClick }) => {
  return (
    <div
      className={`flex items-center justify-center w-[40px] h-[40px] rounded-full cursor-pointer
        ${isOn ? "bg-[#FBAB3A] text-white" : "bg-gray-100 text-gray-600"} 
        hover:opacity-80`}
      onClick={onClick}
    >
      <span className="text-[14px] font-medium">{text}</span>
    </div>
  );
};

export default PriorityToggle;
