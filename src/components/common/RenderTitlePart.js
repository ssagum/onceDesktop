import React, { useState } from "react";
import styled from "styled-components";
import HoverFrame from "./HoverFrame";
import ShrinkText from "./ShrinkText";
import NoticeShowModal from "../Notice.js/NoticeShowModal";

const FixedRightZone = styled.div`
  width: 100px;
  height: 34px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
`;

const GrowMiddleZone = styled.div`
  flex: 1;
  padding: 0 20px;
`;

const FixedLeftZone = styled.div`
  display: flex;
  flex-direction: row;
`;

export default function RenderTitlePart({ row }) {
  const [showModal, setShowModal] = useState(false);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // row가 undefined일 경우 기본값 설정
  const {
    classification = "기타",
    title = "제목 없음",
    author = "작성자 없음",
    createdAt = "날짜 없음",
  } = row || {}; // row가 undefined일 경우 빈 객체로 대체

  const formatRelativeTime = (timestamp) => {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return `${seconds}초 전`;
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  const relativeCreatedAt = formatRelativeTime(createdAt);

  return (
    <>
      <div onClick={handleOpenModal} className="cursor-pointer">
        <HoverFrame
          className={`w-full flex flex-row h-[50px] items-center grid-cols-[1fr,6fr,1fr,1fr]`}
        >
          <FixedRightZone
            className={`${
              classification === "전체" ? "bg-onceOrange" : "bg-onceBlue"
            }`}
          >
            <span className="text-white font-semibold text-once18">
              {classification}
            </span>
          </FixedRightZone>
          <GrowMiddleZone className="flex-1 px-[20px]">
            <ShrinkText
              className={`text-once18 ${
                classification === "전체" ? "text-onceOrange" : "text-black"
              }`}
              text={title}
            />
          </GrowMiddleZone>
          <div className="flex flex-row w-[250px]">
            <div
              className={`flex flex-1 text-once18 ml-[20px] justify-center items-center ${
                classification === "전체" ? "text-onceOrange" : "text-black"
              }`}
            >
              {author}
            </div>
            <div
              className={`flex flex-1 text-once18 justify-center items-center ${
                classification === "전체" ? "text-onceOrange" : "text-black"
              }`}
            >
              {relativeCreatedAt}
            </div>
          </div>
        </HoverFrame>
      </div>

      <NoticeShowModal
        show={showModal}
        handleClose={handleCloseModal}
        notice={row}
      />
    </>
  );
}
