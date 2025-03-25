import React from "react";
import { createRoot } from "react-dom/client";
import ChatWindow from "./components/Chat/ChatWindow";
import { UserLevelProvider } from "./utils/UserLevelContext";
import "./index.css";

// 로그와 디버깅을 위한 코드
console.log("채팅창 시작: ChatWindow 컴포넌트:", typeof ChatWindow);

// 채팅 앱 컴포넌트
const ChatApp = () => {
  return (
    <UserLevelProvider>
      <ChatWindow />
    </UserLevelProvider>
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
