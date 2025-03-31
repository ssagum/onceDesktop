import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { db } from "../../firebase.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useUserLevel } from "../../utils/UserLevelContext";
import RenderCallItem from "./RenderCallItem";
import { useToast } from "../../contexts/ToastContext";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
`;

const NoCallMessage = styled.div`
  text-align: center;
  color: #666;
  padding: 20px;
`;

const TestButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
  gap: 10px;
`;

const TestButton = styled.button`
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #e0e0e0;
  }

  &:active {
    background-color: #d0d0d0;
  }
`;

const getTimeInMillis = (timestamp) => {
  if (!timestamp) return 0;

  return typeof timestamp === "number"
    ? timestamp
    : timestamp.toMillis
    ? timestamp.toMillis()
    : timestamp.getTime
    ? timestamp.getTime()
    : timestamp.seconds
    ? timestamp.seconds * 1000
    : 0;
};

export default function ReceivedCallList() {
  const [calls, setCalls] = useState([]);
  const { userLevelData } = useUserLevel();
  const { showToast } = useToast();

  // 테스트 데이터 생성 함수
  const createTestCalls = async (targetReceiver) => {
    if (!userLevelData?.location) {
      showToast("사용자 위치 정보가 없습니다.", "error");
      return;
    }

    const callTypes = ["예약", "호출", "채팅", "시스템"];
    const senders = ["접수실", "검사실", "간호사실", "원무과", "물리치료실"];

    // 각 타입별 특화된 메시지 정의
    const typeMessages = {
      예약: [
        "환자 예약이 추가되었습니다",
        "예약 취소 요청이 들어왔습니다",
        "예약 일정 변경 요청",
      ],
      호출: [
        "지금 바로 와주세요",
        "환자 호출 응대 부탁드립니다",
        "긴급 상황입니다",
      ],
      채팅: [
        "메신저에서 멘션되었습니다",
        "중요 대화가 진행 중입니다",
        "회의 채팅방에 초대되었습니다",
      ],
      시스템: [
        "시스템 업데이트가 필요합니다",
        "백업 완료 알림",
        "디스크 공간 부족 경고",
      ],
    };

    try {
      // 4개의 다른 타입 호출 생성
      for (let i = 0; i < 4; i++) {
        const type = callTypes[i];
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const formattedTime = `${hours}:${minutes}`;
        const randomSender =
          senders[Math.floor(Math.random() * senders.length)];

        // 타입별 메시지 배열에서 하나 선택
        const typeMessageArray = typeMessages[type];
        const typeMessage =
          typeMessageArray[Math.floor(Math.random() * typeMessageArray.length)];

        const callData = {
          message: typeMessage,
          receiverId: targetReceiver,
          senderId: randomSender,
          formattedTime,
          createdAt: Date.now() - i * 60000, // 1분씩 시간차
          createdAt2: serverTimestamp(),
          type: type,
          [targetReceiver]: true,
          [randomSender]: true,
        };

        await addDoc(collection(db, "calls"), callData);
      }

      showToast(
        `${targetReceiver} 테스트 호출 4개가 생성되었습니다.`,
        "success"
      );
    } catch (error) {
      console.error("테스트 호출 생성 실패:", error);
      showToast("테스트 호출 생성에 실패했습니다.", "error");
    }
  };

  useEffect(() => {
    if (!userLevelData?.location && !userLevelData?.department) return;

    const callsRef = collection(db, "calls");
    const q = query(
      callsRef,
      where("receiverId", "in", [
        userLevelData.location,
        userLevelData.department,
      ]),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const callsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const sortedCalls = callsData.sort(
        (a, b) => getTimeInMillis(b.createdAt) - getTimeInMillis(a.createdAt)
      );
      setCalls(sortedCalls);
    });

    return () => unsubscribe();
  }, [userLevelData?.location, userLevelData?.department]);

  return (
    <Container className="scrollbar-hide">
      {calls.length > 0 ? (
        calls.map((call) => <RenderCallItem key={call.id} call={call} />)
      ) : (
        <NoCallMessage>수신된 호출이 없습니다.</NoCallMessage>
      )}
    </Container>
  );
}
