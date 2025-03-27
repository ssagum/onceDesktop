import React from "react";

export default function ChipText({ text }) {
  // 비품 신청 상태
  if (text === "승인됨") {
    return (
      <div className="flex w-[100px] h-[36px] items-center justify-center rounded-full bg-onceChipBlue">
        <span className="text-onceBlue">{text}</span>
      </div>
    );
  } else if (text === "주문 완료" || text === "주문완료") {
    return (
      <div className="flex w-[100px] h-[36px] items-center justify-center rounded-full bg-onceChipOrange">
        <span className="text-onceOrange">{text}</span>
      </div>
    );
  } else if (text === "장바구니") {
    return (
      <div className="flex w-[100px] h-[36px] items-center justify-center rounded-full bg-purple-100">
        <span className="text-purple-700">{text}</span>
      </div>
    );
  } else if (text === "승인 전" || text === "대기중") {
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
  }
  // 휴가 신청 상태
  else if (text === "반려됨" || text === "취소됨") {
    return (
      <div className="flex w-[100px] h-[36px] items-center justify-center rounded-full bg-onceChipRed">
        <span className="text-onceRed">{text}</span>
      </div>
    );
  }
  // 요청 상태
  else if (text === "완료됨") {
    return (
      <div className="flex w-[100px] h-[36px] items-center justify-center rounded-full bg-onceChipGreen">
        <span className="text-onceGreen">{text}</span>
      </div>
    );
  }
  // 신청 유형
  else if (text === "휴가" || text === "반차" || text === "경조사") {
    return (
      <div className="flex w-[100px] h-[36px] items-center justify-center rounded-full bg-onceChipPurple">
        <span className="text-oncePurple">{text}</span>
      </div>
    );
  } else if (text === "신청" || text === "요청") {
    return (
      <div className="flex w-[100px] h-[36px] items-center justify-center rounded-full bg-onceChipYellow">
        <span className="text-onceYellow">{text}</span>
      </div>
    );
  }
  // 기본값
  else {
    return (
      <div className="flex w-[100px] h-[36px] items-center justify-center rounded-full bg-onceChipBlue">
        <span className="text-onceBlue">{text}</span>
      </div>
    );
  }
}
