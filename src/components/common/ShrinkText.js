import React from "react";

const ShrinkText = ({ text, lines, className = "" }) => {
  const lineClass =
    lines === 1 ? "truncate" : `line-clamp-${lines} overflow-hidden`;

  return (
    <div
      className={`${lineClass} text-ellipsis ${className}`}
      style={{
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: lines,
        wordBreak: "break-word",
      }}
    >
      {text}
    </div>
  );
};

export default ShrinkText;
