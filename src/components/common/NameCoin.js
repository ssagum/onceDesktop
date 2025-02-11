import React from "react";

export default function NameCoin({ item }) {
  // 성씨(첫 글자)를 제거하여 나머지 이름을 표시
  const displayName = item?.name.slice(1);

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
      {displayName}
    </div>
  );
}
