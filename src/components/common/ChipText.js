import React from "react";

export default function ChipText({ text }) {
  if (text === "주문 필요") {
    return (
      <div className="flex w-[100px] h-[36px] items-center justify-center rounded-full bg-onceChipRed">
        <span className="text-onceRed">{text}</span>
      </div>
    );
  } else if (text === "승인") {
    return (
      <div className="flex w-[100px] h-[36px] items-center justify-center rounded-full bg-onceChipBlue">
        <span className="text-onceBlue">{text}</span>
      </div>
    );
  } else if (text === "주문 완료") {
    return (
      <div className="flex w-[100px] h-[36px] items-center justify-center rounded-full bg-onceChipOrange">
        <span className="text-onceOrange">{text}</span>
      </div>
    );
  } else if (text === "승인 전") {
    return (
      <div className="flex w-[100px] h-[36px] items-center justify-center rounded-full bg-onceChipYellow">
        <span className="text-onceYellow">{text}</span>
      </div>
    );
  } else if (text === "입고 완료" || text === "입고완료") {
    return (
      <div className="flex w-[100px] h-[36px] items-center justify-center rounded-full bg-onceChipGreen">
        <span className="text-onceGreen">{text}</span>
      </div>
    );
  } else if (text === "출고완료") {
    return (
      <div className="flex w-[100px] h-[36px] items-center justify-center rounded-full bg-onceChipBlue">
        <span className="text-onceBlue">{text}</span>
      </div>
    );
  } else {
    return (
      <div className="flex w-[100px] h-[36px] items-center justify-center rounded-full bg-onceChipBlue">
        <span className="text-onceBlue">{text}</span>
      </div>
    );
  }
}
