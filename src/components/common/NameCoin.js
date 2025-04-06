import React from "react";

export default function NameCoin({ item, extraCount, isLeader }) {
  // item.name이 문자열인지 확인하고 처리
  let originalName = "";
  if (item && typeof item.name === "string") {
    originalName = item.name;
  }

  // 이름에서 언더스코어 처리
  let processedName = originalName;
  const underscoreIndex = originalName.indexOf("_");
  if (underscoreIndex > 0) {
    processedName = originalName.substring(0, underscoreIndex);
  }

  // 이름 길이에 따라 표시할 텍스트 결정 (2글자 또는 3글자 처리)
  const displayName =
    processedName.length === 3
      ? processedName.slice(1) // 3글자면 뒤 2글자
      : processedName.length === 2
      ? processedName // 2글자면 그대로
      : processedName; // 그 외 경우 (1글자 등) 그대로

  // extraCount가 있으면 +N 형식으로 표시
  const display = extraCount ? `+${extraCount}` : displayName;

  // 배경색 결정:
  // hospitalOwner가 true면 onceOrange,
  // departmentLeader가 true거나 isLeader가 true면 onceGreen,
  // 그 외에는 onceBlue
  const bgClass = item?.hospitalOwner
    ? "bg-onceOrange"
    : item?.departmentLeader || isLeader
    ? "bg-onceGreen"
    : "bg-onceBlue";

  return (
    <div
      className={`rounded-full flex w-[36px] h-[36px] ${bgClass} text-once16 text-white text-center justify-center items-center`}
    >
      {display}
    </div>
  );
}
