import React from "react";
import { bell, message, notice, task } from "../../assets";

export default function InsideHeader({ title }) {
  return (
    <div className="flex flex-row items-center">
      <div className="w-[40px] h-[40px] flex justify-center items-center">
        {title === "원내공지" && (
          <img src={notice} alt="logo" className="w-[36px] h-auto" />
        )}
        {title === "원장님" && (
          <img src={task} alt="logo" className="w-[34px] h-auto" />
        )}
        {title === "알림" && (
          <img src={message} alt="logo" className="w-[36px] h-auto" />
        )}
      </div>
      <div className="ml-[20px] text-once20 font-semibold">{title}</div>
      <div className="ml-[20px] w-[60px] h-[26px] flex justify-center items-center rounded-lg bg-onceBlue text-once14 font-semibold text-white">
        New
      </div>
    </div>
  );
}
