import React from "react";

const PriorityToggle = ({ text, isOn, onClick }) => {
  // text 값에 따른 배경색 설정
  const getBgColorClass = () => {
    if (!isOn) return "bg-gray-100 text-gray-600";

    switch (text) {
      case "상":
        return "bg-onceBlue text-white"; // onceRed
      case "중":
        return "bg-onceBlue text-white"; // onceYellow
      case "하":
        return "bg-onceBlue text-white"; // onceGreen
      default:
        return "bg-[#FBAB3A] text-white";
    }
  };

  return (
    <div
      className={`flex items-center justify-center w-[40px] h-[40px] rounded-full cursor-pointer
        ${getBgColorClass()} 
        hover:opacity-80`}
      onClick={onClick}
    >
      <span className="text-[14px] font-medium">{text}</span>
    </div>
  );
};

export default PriorityToggle;
