import React, { useState, useEffect } from "react";
import ModalTemplate from "./ModalTemplate";
import { cancel } from "../../assets";
import styled from "styled-components";
import { db } from "../../firebase"; // firebase 설정 파일에서 가져오기
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { useUserLevel } from "../../utils/UserLevelContext";

const ModalContent = styled.div`
  width: 600px;
  background: white;
  padding: 30px;
  border-radius: 10px;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const NoCallsMessage = styled.div`
  font-size: 18px;
  color: #999;
  text-align: center;
  padding: 20px;
`;

// formatRelativeTime 함수 추가
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

const ChatHistoryModal = ({ isVisible, setIsVisible }) => {
  const [recentCalls, setRecentCalls] = useState([]);
  const { userLevelData, updateUserLevelData } = useUserLevel();
  const receiverId = userLevelData.location; // location을 receiverId로 사용

  useEffect(() => {
    if (!isVisible) return;

    // 전체 calls 컬렉션을 가져오기
    const q = query(collection(db, "calls"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        if (querySnapshot.empty) {
          setRecentCalls([]);
          return;
        }

        const allCalls = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          docId: doc.id,
        }));

        // 클라이언트 측에서 필터링 및 정렬
        const filteredCalls = allCalls
          .filter((call) => call[receiverId] === true)
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 10);

        setRecentCalls(filteredCalls);
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    });

    return () => unsubscribe();
  }, [isVisible, receiverId]);

  return (
    <ModalTemplate
      isVisible={isVisible}
      setIsVisible={setIsVisible}
      showCancel={false}
      modalClassName="rounded-xl"
    >
      <ModalContent>
        <ModalHeader>
          <span className="text-[24px] font-bold">최근 연락 기록</span>
          <img
            onClick={() => setIsVisible(false)}
            className="w-[24px] cursor-pointer"
            src={cancel}
            alt="닫기"
          />
        </ModalHeader>

        <div className="h-[500px] overflow-y-auto p-4 bg-slate-100 rounded-md shadow-inner">
          {recentCalls.length === 0 ? (
            <NoCallsMessage>연락 기록이 없습니다.</NoCallsMessage>
          ) : (
            <ul className="flex flex-col gap-4">
              {recentCalls.map((call) => (
                <li
                  key={call.docId}
                  className={`max-w-[70%] p-3 rounded-[20px] shadow-md ${
                    call.senderId === receiverId
                      ? "bg-[#DFF7C8] self-end text-right ml-auto"
                      : "bg-[#EFEFEF] self-start text-left mr-auto"
                  }`}
                >
                  <p className="text-[16px] text-[#333]">
                    {call.senderId === receiverId
                      ? `${call.message} - ${formatRelativeTime(
                          call.createdAt
                        )}`
                      : `${call.senderId} - ${formatRelativeTime(
                          call.createdAt
                        )}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ModalContent>
    </ModalTemplate>
  );
};

export default ChatHistoryModal;
