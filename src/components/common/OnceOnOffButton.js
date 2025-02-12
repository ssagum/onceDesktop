import React from "react";

export default function OnceOnOffButton({
  on = false,
  text = "버튼",
  onClick = () => {},
  alertMessage = "버튼이 꺼져 있습니다.",
  className = "w-full rounded-md h-[50px]", // 추가적인 className prop
}) {
  console.log("on pddrop:", on);
  const handleClick = () => {
    if (on) {
      // 활성 상태(on)인 경우, 전달된 onClick 함수 실행 (있다면)
      if (onClick) {
        onClick();
      }
    } else {
      // 비활성 상태(off)인 경우, alert 표시
      alert(alertMessage);
    }
  };

  // on 상태에 따라 배경 및 텍스트 색상 결정
  const bgColor = on ? "bg-onceBlue" : "bg-onceWhite";
  const textColor = on ? "text-white" : "text-onceBlue";

  return (
    <button
      onClick={handleClick}
      className={`${bgColor} ${textColor} border-onceBlue border-2 ${className}`}
    >
      {text}
    </button>
  );
}
