import React from "react";

const HoverFrame = ({
  children,
  className = "",
  hoverBg = "hover:bg-hoverYellow",
  duration = 1000,
  ease = "ease-in-out",
}) => {
  return (
    <div
      className={`transition-all duration-${duration} ${ease} ${hoverBg} ${className}`}
    >
      {children}
    </div>
  );
};

export default HoverFrame;
