import React, { useState } from "react";

export default function ModeToggle() {
  const [isDetailed, setIsDetailed] = useState(false);

  const toggleMode = () => {
    setIsDetailed((prev) => !prev);
  };

  return (
    <div className="flex flex-row items-center p-4">
      <span className="text-once18 text-[#111111] mr-[20px]">
        단순 호출 모드
      </span>
      <div
        className={`relative w-16 h-8 rounded-full cursor-pointer transition-all duration-300 ${
          isDetailed ? "bg-gray-300" : "bg-onceBlue"
        }`}
        onClick={toggleMode}
      >
        <div
          className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${
            isDetailed ? "translate-x-8 bg-blue-500" : "translate-x-1"
          }`}
        />
      </div>
    </div>
  );
}
