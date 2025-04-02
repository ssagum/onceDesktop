import React, { useState } from "react";
import styled from "styled-components";
import HoverFrame from "./HoverFrame";
import ShrinkText from "./ShrinkText";
import NoticeShowModal from "../Notice.js/NoticeShowModal";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useToast } from "../../contexts/ToastContext";

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
  justify-content: center;
  align-items: center;
`;

const AuthorDateContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 250px;
  justify-content: center;
`;

const AuthorDateCell = styled.div`
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
  text-align: center;
`;

export default function RenderTitlePart({
  row,
  isHomeMode = false,
  onEditPost,
}) {
  const [showModal, setShowModal] = useState(false);
  const { showToast } = useToast();

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // 게시글 삭제 함수
  const handleDeleteNotice = async (noticeId) => {
    try {
      const noticeRef = doc(db, "notices", noticeId);
      // 실제 삭제 대신 isHidden 필드를 true로 설정
      await updateDoc(noticeRef, {
        isHidden: true,
        updatedAt: Date.now(),
      });
      showToast("게시글이 삭제되었습니다.", "success");
      handleCloseModal();
      return true;
    } catch (error) {
      console.error("Error hiding notice:", error);
      showToast("게시글 삭제에 실패했습니다.", "error");
      return false;
    }
  };

  // 게시글 수정 함수
  const handleEditNotice = (notice) => {
    if (onEditPost && notice) {
      onEditPost(notice);
    }
    handleCloseModal();
  };

  // row가 undefined일 경우 기본값 설정
  const {
    number = "",
    classification = "전체",
    title = "제목 없음",
    author = "작성자 없음",
    createdAt = "날짜 없음",
    noticeType = "regular",
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
          className={`grid ${
            isHomeMode
              ? "grid-cols-[1fr,6fr,1fr,1fr]"
              : "grid-cols-[0.8fr,1.2fr,5fr,1fr,1fr]"
          } gap-4 py-3 hover:bg-gray-200 items-center`}
        >
          {!isHomeMode && (
            <div
              className={`flex items-center justify-center w-full ${
                noticeType === "notice" ? "font-bold text-lg" : "text-gray-700"
              }`}
            >
              {number}
            </div>
          )}
          <div
            className={`flex items-center justify-center ${
              classification === "전체"
                ? "bg-onceOrange text-white"
                : "bg-onceBlue text-white"
            } font-semibold text-once18 py-1 w-[100px] rounded mx-auto`}
          >
            {classification}
          </div>
          <div className="flex items-center justify-start px-[20px]">
            <ShrinkText
              className={`text-once18 ${
                noticeType === "notice" && !isHomeMode
                  ? "font-bold"
                  : classification === "전체"
                  ? "text-onceOrange"
                  : "text-black"
              }`}
              text={title}
            />
          </div>
          <div className="flex items-center justify-center text-once18">
            {author}
          </div>
          <div className="flex items-center justify-center text-once18">
            {relativeCreatedAt}
          </div>
        </HoverFrame>
      </div>

      <NoticeShowModal
        show={showModal}
        handleClose={handleCloseModal}
        notice={row}
        onEdit={handleEditNotice}
        onDelete={handleDeleteNotice}
      />
    </>
  );
}
