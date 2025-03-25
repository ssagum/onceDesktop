import React, { createContext, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import ChatWindow from "./components/Chat/ChatWindow";
import "./index.css";

// 로그와 디버깅을 위한 코드
console.log("채팅창 시작: ChatWindow 컴포넌트:", typeof ChatWindow);

// 임시 사용자 데이터 생성
const tempUserData = {
  uid: "temp-user-" + Date.now(),
  email: "temp@example.com",
  displayName: "임시사용자",
  name: "임시사용자",
  department: "경영지원팀", // 가정: 현재 사용자는 경영지원팀
  role: "", // 일반 사용자(원장님이 아님)
};

// 임시 컨텍스트 생성
export const TempUserLevelContext = createContext({
  userLevelData: tempUserData,
  updateUserLevelData: () => {},
});

// 채팅 앱 컴포넌트
const ChatApp = () => {
  const [userLevelData, setUserLevelData] = useState(tempUserData);

  // URL 파라미터에서 mode=director가 있으면 원장님 모드 활성화
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get("mode");

    if (mode === "director") {
      // 원장님 모드
      setUserLevelData({
        ...tempUserData,
        department: "원장팀",
        role: "대표원장",
      });
      console.log("원장님 모드로 실행됩니다");
    }
  }, []);

  const updateUserLevelData = (data) => {
    setUserLevelData((prev) => ({ ...prev, ...data }));
  };

  return (
    <TempUserLevelContext.Provider
      value={{ userLevelData, updateUserLevelData }}
    >
      <ChatWindow />
    </TempUserLevelContext.Provider>
  );
};

// 앱 렌더링
const container = document.getElementById("chat-root");
console.log("chat-root 요소 찾음:", !!container);

if (container) {
  try {
    const root = createRoot(container);
    root.render(<ChatApp />);
    console.log("채팅 앱 렌더링 완료");
  } catch (error) {
    console.error("채팅 앱 렌더링 중 오류 발생:", error);
  }
} else {
  console.error("chat-root 요소를 찾을 수 없습니다");
}
