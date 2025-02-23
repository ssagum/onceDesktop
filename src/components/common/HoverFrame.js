import React from "react";

const HoverFrame = ({
  children,
  className = "",
  hoverBg = "hover:bg-hoverYellow",
  duration = 1000,
  ease = "ease-in-out",
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`transition-all duration-${duration} ${ease} ${hoverBg} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default HoverFrame;
