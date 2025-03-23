import React from "react";
import { useToast } from "../../contexts/ToastContext";

const OnceOnOffButton = ({
  text,
  on = false,
  onClick,
  className = "",
  disabled = false,
  toastMessage,
}) => {
  const { showToast } = useToast();

  const handleClick = () => {
    if (disabled) return;

    if (!on && toastMessage) {
      showToast(toastMessage, "error");
      return;
    }

    onClick();
  };

  return (
    <div
      onClick={handleClick}
      className={`${
        on
          ? "bg-onceBlue text-white border-onceBlue"
          : "bg-white text-onceBlue border-onceBlue"
      } border-2 w-full rounded-md h-[40px] flex justify-center items-center ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } select-none ${className}`}
    >
      {text}
    </div>
  );
};

export default OnceOnOffButton;
