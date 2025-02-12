import React from "react";

export default function UserChipText({ text, yellowMode = false }) {
  if (yellowMode === false) {
    return (
      <div className="flex w-full h-[36px] items-center justify-center rounded-full bg-onceChipBlue">
        <span className="text-onceBlue">{text}</span>
      </div>
    );
  } else {
    return (
      <div className="flex w-full h-[36px] items-center justify-center rounded-full bg-onceChipGreen">
        <span className="text-onceGreen">{text}</span>
      </div>
    );
  }
}
