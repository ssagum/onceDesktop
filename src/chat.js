import React from "react";
import { createRoot } from "react-dom/client";
import ChatWindow from "./components/Chat/ChatWindow";
import { UserLevelProvider } from "./utils/UserLevelContext";
import "./index.css";

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

if (container) {
  try {
    const root = createRoot(container);
    root.render(<ChatApp />);
  } catch (error) {
    console.error("채팅 앱 렌더링 중 오류 발생:", error);
  }
} else {
  console.error("chat-root 요소를 찾을 수 없습니다");
}
