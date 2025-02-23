import React from "react";

const OnceOnOffButton = ({ text, on = false, onClick, className = "" }) => {
  return (
    <div
      onClick={onClick}
      className={`${
        on
          ? "bg-onceBlue text-white border-onceBlue"
          : "bg-white text-onceBlue border-onceBlue"
      } border-2 w-full rounded-md h-[40px] flex justify-center items-center cursor-pointer ${className}`}
    >
      {text}
    </div>
  );
};

export default OnceOnOffButton;
