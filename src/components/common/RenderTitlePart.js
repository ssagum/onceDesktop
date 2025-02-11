import React from "react";
import styled from "styled-components";
import HoverFrame from "./HoverFrame";
import ShrinkText from "./ShrinkText";

const FixedRightZone = styled.div``;
const GrowMiddleZone = styled.div``;
const FixedLeftZone = styled.div``;

export default function RenderTitlePart({
  item,
  category,
  title,
  owner,
  time,
  index,
}) {
  return (
    <HoverFrame className={`w-full flex flex-row h-[50px] items-center`}>
      <FixedRightZone
        className={`w-[100px] h-[34px] flex justify-center items-center text-center ${
          category === "전체" ? "bg-onceOrange" : "bg-onceBlue"
        }`}
      >
        <span className="text-white font-semibold text-once18">{category}</span>
      </FixedRightZone>
      <GrowMiddleZone className="flex-1 px-[20px]">
        <ShrinkText
          className={`text-once18 ${
            category === "전체" ? "text-onceOrange" : "text-black"
          }`}
          text={title}
        />
      </GrowMiddleZone>
      <FixedLeftZone className="flex flex-row w-[200px]">
        <div
          className={`flex flex-1 text-once18 ${
            category === "전체" ? "text-onceOrange" : "text-black"
          }`}
        >
          {owner}
        </div>
        <div
          className={`flex flex-1 text-once18 ${
            category === "전체" ? "text-onceOrange" : "text-black"
          }`}
        >
          {time}
        </div>
      </FixedLeftZone>
    </HoverFrame>
  );
}
