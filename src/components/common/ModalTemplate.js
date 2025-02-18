import React, { useEffect } from "react";
import styled from "styled-components";
import { cancel as cancelIcon } from "../../assets";

const ModalZone = styled.div``;
const CancelZone = styled.div``;

const ModalChip = () => {
  useEffect(() => {
    // 모달이 열릴 때 body에 overflow: hidden 스타일 적용
    document.body.style.overflow = "hidden";
    return () => {
      // 모달이 닫힐 때 body 스타일 원래대로 복구
      document.body.style.overflow = "auto";
    };
  }, []);

  return <div />;
};

const ModalTemplate = ({
  isVisible,
  setIsVisible,
  showCancel = true,
  modalClassName = "flex flex-col bg-white",
  children,
}) => {
  if (!isVisible) return null;

  return (
    <ModalZone
      className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 z-10"
      // 모달 배경 클릭 시 닫힘
      onClick={() => setIsVisible(false)}
    >
      <div
        className={modalClassName}
        // 모달 내부 클릭 시 이벤트 전파 중단 (모달 닫힘 방지)
        onClick={(e) => e.stopPropagation()}
      >
        {showCancel && (
          <CancelZone className="flex flex-row w-full bg-white justify-end mt-[15px] h-[50px] pr-[20px] pt-[10px]">
            <img
              onClick={() => setIsVisible(false)}
              className="w-[30px]"
              src={cancelIcon}
              alt="닫기"
              style={{ cursor: "pointer" }}
            />
          </CancelZone>
        )}
        {children}
        {/* <ContentZone className="flex flex-col w-full overflow-auto scrollbar-hide">
          {children}
        </ContentZone> */}
      </div>
      <ModalChip />
    </ModalZone>
  );
};

export default ModalTemplate;
