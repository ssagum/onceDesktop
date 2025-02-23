import React, { useState } from "react";
import styled from "styled-components";
import HoverFrame from "../common/HoverFrame";
import ModalTemplate from "../common/ModalTemplate";
import WhereSelector from "../common/WhereSelector";
import { cancel } from "../../assets";

const CallContainer = styled(HoverFrame)`
  padding: 10px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 20px;
  align-items: center;
  cursor: pointer;
`;

const SenderInfo = styled.div`
  font-weight: 600;
  color: #1a73e8;
  width: 120px;
`;

const MessageContent = styled.div`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TimeStamp = styled.div`
  color: #666;
  font-size: 16px;
  min-width: 100px;
  text-align: right;
`;

// 모달 관련 스타일
const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 500px;
  background: white;
  padding: 30px;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const InfoRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const Label = styled.span`
  font-weight: 600;
  width: 80px;
`;

const Value = styled.span`
  flex: 1;
`;

export default function RenderCallItem({ call }) {
  const [showModal, setShowModal] = useState(false);

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "시간 정보 없음";

    // timestamp가 숫자인 경우
    const timeInMillis =
      typeof timestamp === "number"
        ? timestamp
        : // Firestore Timestamp 객체인 경우
        timestamp.toMillis
        ? timestamp.toMillis()
        : // Date 객체인 경우
        timestamp.getTime
        ? timestamp.getTime()
        : // seconds와 nanoseconds가 있는 경우
        timestamp.seconds
        ? timestamp.seconds * 1000
        : 0;

    const now = Date.now();
    const seconds = Math.floor((now - timeInMillis) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return `${seconds}초 전`;
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
    setShowModal(true);
  };

  return (
    <>
      <CallContainer onClick={handleModalClick}>
        <WhereSelector
          disabled={true}
          value={call.senderId}
          onClick={(e) => e.stopPropagation()}
        />
        <MessageContent>{call.message}</MessageContent>
        <TimeStamp>{formatRelativeTime(call.createdAt)}</TimeStamp>
      </CallContainer>

      <ModalTemplate
        isVisible={showModal}
        setIsVisible={setShowModal}
        showCancel={false}
        modalClassName="rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalContent>
          <ModalHeader>
            <span className="text-[24px] font-bold">호출 상세</span>
            <img
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(false);
              }}
              className="w-[24px] cursor-pointer"
              src={cancel}
              alt="닫기"
            />
          </ModalHeader>

          <ModalBody>
            <InfoRow>
              <Label>발신:</Label>
              <Value>{call.senderId}</Value>
            </InfoRow>
            <InfoRow>
              <Label>수신:</Label>
              <Value>{call.receiverId}</Value>
            </InfoRow>
            <InfoRow>
              <Label>시간:</Label>
              <Value>{formatRelativeTime(call.createdAt)}</Value>
            </InfoRow>
            <InfoRow>
              <Label>내용:</Label>
              <Value>{call.message}</Value>
            </InfoRow>
          </ModalBody>
        </ModalContent>
      </ModalTemplate>
    </>
  );
}
