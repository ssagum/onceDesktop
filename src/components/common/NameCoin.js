import React from "react";

export default function NameCoin({ item, extraCount }) {
  // 이름이 3글자면 첫 글자 제거, 2글자면 그대로 유지
  const displayName =
    item?.name.length === 3 ? item?.name.slice(1) : item?.name;

  // extraCount가 있으면 +N 형식으로 표시
  const display = extraCount ? `+${extraCount}` : displayName;

  // 배경색 결정: hospitalOwner가 true면 onceOrange, departmentLeader가 true면 onceGreen, 그 외에는 onceBlue
  const bgClass = item?.hospitalOwner
    ? "bg-onceOrange"
    : item?.departmentLeader
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
