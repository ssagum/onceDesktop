import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { chatting } from "../../assets";
import { useUserLevel } from "../../utils/UserLevelContext";
import { getChatRooms, getUnreadMessageCount, subscribeToUnreadCount } from "./ChatService";

const SquareContainer = styled.div`
  width: 110px;
  height: 110px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: white;
  border-radius: 0.75rem;
  padding-top: 8px;
  cursor: pointer;
  position: relative;
`;

const UnreadBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: #ff5050;
  color: white;
  border-radius: 9999px;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 0 6px;
`;

const IconContainer = styled.div`
  width: 40px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Title = styled.span`
  font-size: 18px;
`;

// 전체 채팅 스퀘어 컴포넌트
const ChatSquare = ({ onClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { userLevelData, currentUser } = useUserLevel();
  const [unsubscribe, setUnsubscribe] = useState(null);

  useEffect(() => {
    // 안 읽은 메시지 수 가져오기 및 구독 설정
    const initializeChat = async () => {
      try {
        // 장치 ID 가져오기 (또는 생성)
        const deviceId = localStorage.getItem("deviceId") || `device-${Date.now()}`;
        if (!localStorage.getItem("deviceId")) {
          localStorage.setItem("deviceId", deviceId);
        }

        // 사용자 정보 가져오기
        const department = userLevelData?.department || "";
        const role = currentUser?.role || "";

        // 초기 안 읽은 메시지 수 가져오기
        const initialCount = await getUnreadMessageCount(deviceId, department, role);
        setUnreadCount(initialCount);

        // 실시간 구독 설정
        const unsubscribeFunc = await subscribeToUnreadCount(
          deviceId, 
          department, 
          role,
          (count) => {
            console.log("실시간 안 읽은 메시지 수 업데이트:", count);
            setUnreadCount(count);
          }
        );

        // 구독 함수 저장
        setUnsubscribe(() => unsubscribeFunc);
      } catch (error) {
        console.error("채팅 초기화 중 오류 발생:", error);
      }
    };

    if (userLevelData?.uid || userLevelData?.department) {
      initializeChat();
    }

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      if (unsubscribe) {
        console.log("채팅 안 읽은 메시지 구독 해제");
        unsubscribe();
      }
    };
  }, [userLevelData?.uid, userLevelData?.department, currentUser?.role]);

  // 포맷팅된 안 읽은 메시지 수 표시
  const formattedUnreadCount = unreadCount > 99 
    ? "99+" 
    : unreadCount > 9 
      ? `${unreadCount}+` 
      : unreadCount;

  return (
    <SquareContainer onClick={onClick}>
      {unreadCount > 0 && (
        <UnreadBadge>
          {formattedUnreadCount}
        </UnreadBadge>
      )}
      <IconContainer>
        <img src={chatting} alt="채팅" className="w-[40px]" />
      </IconContainer>
      <Title>채팅</Title>
    </SquareContainer>
  );
};

export default ChatSquare; 