import React from "react";

const OnceOnOffButton = ({
  text,
  on = false,
  onClick,
  className = "",
  disabled = false,
}) => {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`${
        on
          ? "bg-onceBlue text-white border-onceBlue"
          : "bg-white text-onceBlue border-onceBlue"
      } border-2 w-full rounded-md h-[40px] flex justify-center items-center ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
    >
      {text}
    </div>
  );
};

export default OnceOnOffButton;
