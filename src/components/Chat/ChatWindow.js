import React, { useState, useEffect, useRef, useContext } from "react";
import styled from "styled-components";
import {
  getChatRooms,
  getChatMessages,
  subscribeToMessages,
  getChatRoomMembers,
  getMentionableUsers,
  extractMentions,
  canSendMessage,
  formatMessageTime,
  sendMessage,
  markMessageAsRead,
  addReaction,
  initializeChatRooms,
  CHAT_TYPES,
} from "./ChatService";
import { useUserLevel } from "../../utils/UserLevelContext";
import { IoPaperPlaneSharp } from "react-icons/io5";
import { db } from "../../firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: #f5f6f8;
  font-family: "Noto Sans KR", sans-serif;
`;

const Header = styled.div`
  background-color: #fff;
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid #e6e6e6;
  position: relative;
`;

const Title = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: #333;
  flex: 1;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  margin-right: 10px;
  color: #304ffd;
  display: ${(props) => (props.visible ? "block" : "none")};
`;

const ChatRoomList = styled.div`
  flex: 1;
  overflow-y: auto;
  background-color: #fff;
`;

const ChatRoomItem = styled.div`
  display: flex;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  align-items: center;
  background-color: ${(props) => (props.isMyTeam ? "#f0f8ff" : "#fff")};

  &:hover {
    background-color: ${(props) => (props.isMyTeam ? "#e6f2ff" : "#f8f9fa")};
  }
`;

const ChatRoomProfile = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  background-color: ${(props) => (props.isMyTeam ? "#1e88e5" : "#304ffd")};
  margin-right: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
  font-size: 18px;
`;

const ChatRoomInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ChatRoomName = styled.div`
  font-size: 18px;
  font-weight: ${(props) => (props.isMyTeam ? "600" : "500")};
  margin-bottom: 5px;
  color: ${(props) => (props.isMyTeam ? "#1976d2" : "inherit")};
`;

const ChatRoomLastMessage = styled.div`
  font-size: 16px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UnreadBadge = styled.div`
  background-color: #ff5050;
  color: white;
  font-size: 14px;
  border-radius: 12px;
  padding: 2px 8px;
  margin-left: 4px;
  font-weight: bold;
`;

const MessageContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
`;

const MessageGroup = styled.div`
  margin-bottom: 20px;
`;

const MessageDate = styled.div`
  text-align: center;
  margin: 10px auto;
  font-size: 14px;
  color: #555;
  background: #e8e8e8;
  border-radius: 10px;
  padding: 5px 10px;
  display: block;
  width: fit-content;
  font-weight: 500;
  border: 1px solid #ddd;
`;

const MessageItem = styled.div`
  display: flex;
  flex-direction: ${(props) => (props.isMe ? "row-reverse" : "row")};
  align-items: flex-start;
  margin-bottom: 10px;
`;

const MessageProfile = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 19px;
  background-color: #ccc;
  margin: ${(props) => (props.isMe ? "0 0 0 8px" : "0 8px 0 0")};
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  color: white;
  flex-shrink: 0;
`;

const MessageContent = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 70%;
`;

const SenderUserName = styled.div`
  font-size: 16px;
  font-weight: 500;
`;

const MessageBubble = styled.div`
  background-color: ${(props) => (props.isMe ? "#304ffd" : "#fff")};
  color: ${(props) => (props.isMe ? "#fff" : "#333")};
  border-radius: ${(props) =>
    props.isMe ? "15px 2px 15px 15px" : "2px 15px 15px 15px"};
  padding: 10px 14px;
  font-size: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  border: ${(props) => (props.isMe ? "none" : "1px solid #e6e6e6")};
  margin: ${(props) => (props.isMe ? "0 0 0 10px" : "0 10px 0 0")};
  word-break: break-word;
  position: relative;

  ${(props) =>
    props.hasMention &&
    `
    border-left: 3px solid #ffb100;
  `}

  ${(props) =>
    props.isReply &&
    `
    margin-top: 5px;
    `}

  // 멘션 스타일
  .mention {
    color: ${(props) => (props.isMe ? "#ffdd9e" : "#304ffd")};
    font-weight: bold;
    background-color: ${(props) =>
      props.isMe ? "rgba(255, 221, 158, 0.3)" : "rgba(48, 79, 253, 0.1)"};
    padding: 2px 4px;
    border-radius: 4px;
  }
`;

const MessageTime = styled.span`
  font-size: 13px;
  color: #666;
  margin: ${(props) => (props.isMe ? "0 5px 0 0" : "0 0 0 5px")};
  align-self: flex-end;
  white-space: nowrap;
  min-width: 60px;
  text-align: ${(props) => (props.isMe ? "right" : "left")};
  font-weight: 500;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: row;
  padding: 10px;
  background-color: #fff;
  border-top: 1px solid #e6e6e6;
  position: relative;
  min-height: 60px;
  max-height: 150px;
  align-items: flex-end;
`;

const MessageInput = styled.textarea`
  flex: 1;
  border: 1px solid #e6e6e6;
  border-radius: 20px;
  padding: 10px 15px;
  font-size: 16px;
  outline: none;
  background-color: ${(props) => (props.disabled ? "#f5f5f5" : "#fff")};
  resize: none;
  min-height: 40px;
  max-height: 120px;
  font-family: inherit;

  &:focus {
    border-color: ${(props) => (props.disabled ? "#e6e6e6" : "#304ffd")};
  }
`;

const SendButton = styled.button`
  background-color: ${(props) => (props.disabled ? "#cccccc" : "#304ffd")};
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  margin-left: 10px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
  transition: background-color 0.2s;
  margin-bottom: 6px;

  &:hover {
    background-color: ${(props) => (props.disabled ? "#cccccc" : "#263ed9")};
  }
`;

const ReadOnlyBanner = styled.div`
  background-color: #fff8e1;
  color: #ff9800;
  text-align: center;
  padding: 8px;
  font-size: 16px;
  border-top: 1px solid #ffe0b2;
  border-bottom: 1px solid #ffe0b2;
`;

const MembersButton = styled.button`
  background: none;
  border: none;
  color: #304ffd;
  font-size: 16px;
  cursor: pointer;
  margin-left: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    text-decoration: underline;
  }
`;

const MembersCount = styled.span`
  background-color: #eee;
  color: #333;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  margin-left: 5px;
`;

const MembersPanel = styled.div`
  position: absolute;
  top: 60px;
  right: 0;
  width: 240px;
  max-height: 300px;
  background-color: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  padding: 10px 0;
`;

const MembersPanelHeader = styled.div`
  padding: 0 15px 10px;
  font-weight: 600;
  color: #333;
  font-size: 16px;
  border-bottom: 1px solid #e6e6e6;
`;

const MemberList = styled.div`
  max-height: 250px;
  overflow-y: auto;
`;

const MemberItem = styled.div`
  padding: 8px 15px;
  display: flex;
  align-items: center;

  &:hover {
    background-color: #f5f6f8;
  }
`;

const MemberAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: #304ffd;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  margin-right: 10px;
  font-size: 14px;
`;

const MemberInfo = styled.div`
  flex: 1;
`;

const MemberName = styled.div`
  font-size: 16px;
  font-weight: 500;
`;

const MemberRole = styled.div`
  font-size: 14px;
  color: #666;
`;

const MentionSuggestions = styled.div`
  position: absolute;
  bottom: 70px;
  left: 20px;
  background-color: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
  width: 200px;
`;

const MentionItem = styled.div`
  padding: 8px 15px;
  cursor: pointer;

  &:hover,
  &.active {
    background-color: #f0f8ff;
  }
`;

const MentionText = styled.span`
  color: #304ffd;
  font-weight: bold;
`;

// 멘션 입력 컨테이너 스타일 수정
const MentionInputContainer = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  align-items: flex-start;
  border: 1px solid #e6e6e6;
  border-radius: 20px;
  padding: 2px 10px;
  background-color: ${(props) => (props.disabled ? "#f5f5f5" : "#fff")};
  min-height: 40px;
  max-height: 120px;
  overflow-y: auto;
  overflow-x: hidden; /* 가로 스크롤 방지 */
  word-break: break-word; /* 단어 내에서도 줄바꿈 허용 */
  overflow-wrap: break-word; /* 가로로 길어지지 않도록 처리 */
  margin-bottom: 4px;

  /* 스크롤바 숨기기 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer, Edge */

  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }

  &:focus-within {
    border-color: #304ffd;
  }
`;

// 멘션 칩 스타일 추가
const MentionChip = styled.span`
  display: inline-flex;
  align-items: center;
  background-color: rgba(48, 79, 253, 0.1);
  color: #304ffd;
  font-weight: bold;
  padding: 2px 6px;
  margin-right: 5px;
  border-radius: 4px;
  white-space: nowrap;
`;

const MentionInput = styled.div`
  flex: 1;
  min-width: 50px;
  outline: none;
  padding: 5px;
  font-size: 16px;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
  position: relative;

  &:after {
    content: "";
    position: absolute;
    left: 0; /* 오른쪽이 아닌 왼쪽에 위치 */
    top: calc(50% - 10px);
    height: 15px;
    width: 1px;
    background-color: #304ffd;
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0%,
    100% {
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
  }
`;

// 좌측에 위치하지만 수직 중앙 정렬된 Placeholder 스타일 수정
const Placeholder = styled.div`
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #aaa;
  font-size: 14px;
  pointer-events: none;
`;

// 수직 중앙 정렬된 CursorIndicator 스타일 수정
const CursorIndicator = styled.div`
  position: relative;
  width: 2px;
  height: 15px;
  background-color: #304ffd;
  display: inline-block;
  margin-right: 4px;
  vertical-align: middle;
  animation: blink 1s infinite;

  @keyframes blink {
    0%,
    100% {
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
  }
`;

const ContextMenu = styled.div`
  position: absolute;
  background-color: white;
  border: 1px solid #e6e6e6;
  border-radius: 5px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: 5px 0;
`;

const ContextMenuItem = styled.div`
  padding: 8px 15px;
  cursor: pointer;
  font-size: 15px;
  display: flex;
  align-items: center;

  &:hover {
    background-color: #f5f5f5;
  }
`;

const ReactionIconsContainer = styled.div`
  display: flex;
  padding: 8px 15px;
  gap: 10px;
  border-top: 1px solid #e6e6e6;
  background-color: #f0f7ff;
  border-radius: 0 0 5px 5px;
  justify-content: center;
`;

const ReactionIconButton = styled.div`
  cursor: pointer;
  font-size: 18px;
  transition: transform 0.2s;
  background-color: rgba(48, 79, 253, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.2);
    background-color: rgba(48, 79, 253, 0.2);
  }
`;

// ReplyPreviewContainer 스타일 수정
const ReplyPreviewContainer = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background-color: #f7f7f7;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  border-left: 3px solid #304ffd;
  box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.05);
  z-index: 5;
  margin-bottom: -1px;
`;

const ReplyPreviewContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`;

const ReplyPreviewSender = styled.span`
  font-weight: 600;
  color: #304ffd;
  font-size: 15px;
`;

const ReplyPreviewText = styled.span`
  color: #666;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
  max-width: 90%;
`;

const ReplyPreviewCancel = styled.span`
  color: #999;
  cursor: pointer;
  font-size: 16px;
  margin-left: 10px;

  &:hover {
    color: #666;
  }
`;

// 답장 메시지 UI를 위한 새로운 스타일 컴포넌트 추가
const ReplyQuote = styled.div`
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid
    ${(props) =>
      props.isMe ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.05)"};
  position: relative;
  padding-left: 8px;

  &:before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 4px;
    width: 2px;
    background-color: ${(props) => (props.isMe ? "#ffdd9e" : "#304ffd")};
    border-radius: 1px;
  }
`;

const ReplyQuoteSender = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${(props) => (props.isMe ? "#ffdd9e" : "#304ffd")};
  margin-bottom: 2px;
`;

const ReplyQuoteText = styled.div`
  font-size: 13px;
  color: ${(props) => (props.isMe ? "rgba(255, 255, 255, 0.8)" : "#666")};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// 스타일 컴포넌트 추가
const MessageReactionContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 4px;
  justify-content: ${(props) => (props.isMe ? "flex-end" : "flex-start")};
`;

const ReactionBubble = styled.div`
  background-color: rgba(48, 79, 253, 0.1);
  border-radius: 12px;
  padding: 2px 8px;
  margin-right: 5px;
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #304ffd;
  cursor: pointer;
  margin-top: 2px;

  &:hover {
    background-color: rgba(48, 79, 253, 0.2);
  }

  span {
    margin-left: 3px;
  }
`;

const ReactionMenu = styled.div`
  position: absolute;
  background-color: white;
  border: 1px solid #e6e6e6;
  border-radius: 24px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: 8px;
  display: flex;
  gap: 8px;
`;

const ReactionButton = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  background-color: #f0f2f5;
  transition: transform 0.2s;

  &:hover {
    background-color: #e4e6eb;
    transform: scale(1.1);
  }
`;

// 스타일 컴포넌트 추가
const SenderSelector = styled.div`
  position: relative;
  min-width: 100px;
  border: 1px solid #e6e6e6;
  border-radius: 20px;
  padding: 8px 10px;
  margin-right: 10px;
  background-color: #f5f5f5;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: #333;
  transition: all 0.2s;
  margin-bottom: 5px;
  z-index: 10;

  &:hover {
    background-color: #e9e9e9;
  }

  svg {
    margin-left: 5px;
    font-size: 12px;
  }
`;

const SenderDropdown = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 240px;
  max-height: 300px;
  background-color: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  padding: 10px 0;
`;

const SenderDropdownHeader = styled.div`
  padding: 0 15px 10px;
  font-weight: 600;
  color: #333;
  font-size: 16px;
  border-bottom: 1px solid #e6e6e6;
`;

const SenderOptionsList = styled.div`
  max-height: 250px;
  overflow-y: auto;
`;

const SenderOption = styled.div`
  padding: 8px 15px;
  display: flex;
  align-items: center;
  cursor: pointer;

  &:hover {
    background-color: #f5f6f8;
  }

  &.selected {
    background-color: #f0f8ff;
  }
`;

const SenderAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: #304ffd;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  margin-right: 10px;
  font-size: 14px;
`;

const SenderInfo = styled.div`
  flex: 1;
`;

const SenderRole = styled.div`
  font-size: 14px;
  color: #666;
`;

// 날짜별로 메시지 그룹화 함수
const groupMessagesByDate = (messages) => {
  const groups = {};

  messages.forEach((message) => {
    const date = new Date(message.createdAt);
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }

    groups[dateKey].push(message);
  });

  return Object.entries(groups)
    .map(([dateKey, messages]) => {
      const [year, month, day] = dateKey.split("-").map(Number);
      const date = new Date(year, month, day);
      return {
        date,
        messages,
      };
    })
    .sort((a, b) => a.date - b.date);
};

// 날짜 포맷팅 함수
const formatDate = (date) => {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  };
  return date.toLocaleDateString("ko-KR", options);
};

// 더미 메시지 데이터
const DUMMY_MESSAGES = {
  "global-chat": [
    {
      id: "msg1",
      text: "안녕하세요! 전체 채팅방입니다.",
      senderId: "admin",
      senderName: "관리자",
      createdAt: new Date(Date.now() - 3600000),
      readBy: ["admin"],
    },
    {
      id: "msg2",
      text: "여기서 모든 부서와 대화할 수 있습니다.",
      senderId: "admin",
      senderName: "관리자",
      createdAt: new Date(Date.now() - 3000000),
      readBy: ["admin"],
    },
  ],
  "team-chat-원장팀": [
    {
      id: "msg1",
      text: "원장팀 채팅방입니다.",
      senderId: "admin",
      senderName: "관리자",
      createdAt: new Date(Date.now() - 3600000),
      readBy: ["admin"],
    },
  ],
  "team-chat-간호팀": [
    {
      id: "msg1",
      text: "간호팀 채팅방입니다.",
      senderId: "admin",
      senderName: "관리자",
      createdAt: new Date(Date.now() - 3600000),
      readBy: ["admin"],
    },
  ],
  "team-chat-경영지원팀": [
    {
      id: "msg1",
      text: "경영지원팀 채팅방입니다.",
      senderId: "admin",
      senderName: "관리자",
      createdAt: new Date(Date.now() - 3600000),
      readBy: ["admin"],
    },
  ],
  "team-chat-의사팀": [
    {
      id: "msg1",
      text: "의사팀 채팅방입니다.",
      senderId: "admin",
      senderName: "관리자",
      createdAt: new Date(Date.now() - 3600000),
      readBy: ["admin"],
    },
  ],
};

// 텍스트 내 멘션 하이라이트 처리
const highlightMentions = (text) => {
  if (!text) return "";

  // @로 시작하는 단어를 정규식으로 찾아서 하이라이트
  return text.replace(/@(\S+)/g, '<span class="mention">@$1</span>');
};

// 시크릿 모드 아이콘 스타일
const SecretModeIcon = styled.div`
  font-size: 20px;
  cursor: pointer;
  margin-right: 5px;
  opacity: 0.7;
  transition: opacity 0.2s;
  &:hover {
    opacity: 1;
  }
`;

// 비밀번호 모달 컴포넌트 스타일
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 300px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
  text-align: center;
`;

const PasswordInput = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 16px;
`;

const ModalButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ModalButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  background-color: ${(props) => (props.primary ? "#304ffd" : "#f5f5f5")};
  color: ${(props) => (props.primary ? "white" : "#333")};

  &:hover {
    background-color: ${(props) => (props.primary ? "#263ed9" : "#e9e9e9")};
  }
`;

// 로딩 화면 컴포넌트 추가
const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #f5f6f8;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99999; /* z-index 값을 극단적으로 높게 설정 */
  opacity: 1; /* 항상 완전 불투명하게 설정 */
  transition: none; /* 애니메이션 효과 제거 */
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #e0e0e0;
  border-top: 4px solid #304ffd;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const ChatWindow = () => {
  const { userLevelData, isLoggedIn } = useUserLevel();
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const messageEndRef = useRef(null);
  const inputRef = useRef(null);
  const scrollPositionRef = useRef(0); // 스크롤 위치 저장용 ref 추가
  const [loading, setLoading] = useState(true);
  const [canSend, setCanSend] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // 시크릿 모드 관련 상태
  const [secretMode, setSecretMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  // 멤버 관련 상태
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState([]);

  // 멘션 관련 상태
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionableUsers, setMentionableUsers] = useState([]);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);

  const [parsedMentions, setParsedMentions] = useState([]);
  const mentionInputRef = useRef(null);

  // 우클릭 메뉴 관련 상태
  const [contextMenu, setContextMenu] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [reactionMenu, setReactionMenu] = useState(null);

  // 롱프레스 관련 상태 및 변수들
  const longPressTimeout = useRef(null);
  const longPressDelay = 300; // 롱프레스 인식 시간을 300ms로 줄임
  const longPressStartPos = useRef({ x: 0, y: 0 });

  // 메시지 구독 관련
  const [messageUnsubscribe, setMessageUnsubscribe] = useState(null);

  // 현재 선택된 발신자 상태 관리
  const [selectedSender, setSelectedSender] = useState(null);
  const [showSenderDropdown, setShowSenderDropdown] = useState(false);
  const [departmentUsers, setDepartmentUsers] = useState([]);

  // 창 가시성 감지를 위한 ref
  const isVisibleRef = useRef(true);

  // 창 최소화/복원 감지
  useEffect(() => {
    const handleVisibilityChange = () => {
      // 페이지가 보이지 않게 되면 (최소화, 작업표시줄로 이동 등)
      if (document.hidden) {
        isVisibleRef.current = false;

        // 시크릿 모드였다면 즉시 채팅방에서 리스트로 돌아감
        if (secretMode) {
          console.log("앱 최소화: 시크릿 모드 감지, 로딩 화면 표시");
          // 먼저 로딩 화면 표시 - 확실하게 우선 적용
          setLoading(true);

          // 작은 지연 후 상태 변경 (로딩이 확실히 적용된 후)
          setTimeout(() => {
            console.log("앱 최소화: 채팅방 상태 초기화 및 시크릿 모드 해제");
            // 구독 정리
            if (messageUnsubscribe) {
              messageUnsubscribe();
              setMessageUnsubscribe(null);
            }

            // 채팅방 상태 초기화
            setMessages([]);
            setSelectedRoom(null);

            // 답장 상태, 멘션 상태 등 초기화
            setReplyToMessage(null);
            setShowMentionSuggestions(false);
            setShowMembers(false);

            // 시크릿 모드 해제
            setSecretMode(false);
          }, 50); // 아주 짧은 지연으로 로딩 화면이 먼저 렌더링되도록 함
        }
      } else {
        // 페이지가 다시 보이게 되면
        if (!isVisibleRef.current) {
          isVisibleRef.current = true;

          // 최소화 상태에서 복귀한 경우 (로딩 화면이 표시 중이면)
          if (loading) {
            console.log("앱 복귀: 로딩 상태 확인됨, 채팅방 목록 로드");
            // 일반 모드로 채팅방 목록 로드
            fetchChatRooms(false);

            // 충분한 지연 후 로딩 상태 해제 (2초 동안 로딩 화면 유지)
            setTimeout(() => {
              console.log("앱 복귀: 로딩 화면 해제 (2초 지연 후)");
              setLoading(false);
            }, 2000);
          } else {
            console.log("앱 복귀: 로딩 상태 아님, 아무 작업 안함");
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [secretMode, messageUnsubscribe, loading]);

  // 로딩 화면 없이 채팅방 목록을 조용히 새로고침
  const silentlyRefreshChatRooms = async () => {
    try {
      // 장치 ID 가져오기
      const deviceId =
        localStorage.getItem("deviceId") || `device-${Date.now()}`;
      if (!localStorage.getItem("deviceId")) {
        localStorage.setItem("deviceId", deviceId);
      }

      // 사용자 정보 가져오기
      const department = userLevelData?.department || "";
      const role = userLevelData?.role || "";
      const isDirector = role === "대표원장";

      // 시크릿 모드로 채팅방 목록 조회
      const rooms = await getChatRooms(deviceId, department, role, true);

      // 상태 업데이트
      setChatRooms(rooms);
    } catch (error) {
      console.error("채팅방 목록 조용히 갱신 중 오류:", error);
    }
  };

  // 비밀번호 모달 토글
  const togglePasswordModal = () => {
    setShowPasswordModal(!showPasswordModal);
    setPassword("");
    setPasswordError(false);
  };

  // 시크릿 모드 진입 시도
  const attemptSecretMode = () => {
    if (password === SECRET_PASSWORD) {
      setSecretMode(true);
      setShowPasswordModal(false);
      setPassword("");
      setPasswordError(false);

      // 시크릿 모드 진입 시 채팅방 목록 다시 로드
      fetchChatRooms(true);
    } else {
      setPasswordError(true);
    }
  };

  // 시크릿 모드 비밀번호 체크 (실제 구현에서는 보안을 위해 서버에서 확인해야 함)
  const SECRET_PASSWORD = "1234"; // 실제 구현에서는 환경변수나 서버에서 관리해야 합니다

  // 채팅방 목록 불러오기 함수 수정
  const fetchChatRooms = async (isSecretMode = secretMode) => {
    try {
      setLoading(true);

      // 장치 ID 가져오기 (또는 생성)
      const deviceId =
        localStorage.getItem("deviceId") || `device-${Date.now()}`;
      if (!localStorage.getItem("deviceId")) {
        localStorage.setItem("deviceId", deviceId);
      }

      // userLevelData에서 department와 role 가져오기
      const department = userLevelData?.department || "";
      const role = userLevelData?.role || "";
      const isDirector = role === "대표원장";

      console.log("현재 사용자 정보:", {
        department,
        role,
        userLevelData,
        isSecretMode,
      });

      // 대표원장이고 시크릿 모드인 경우에만 모든 채팅방 가져오기
      if (isDirector && isSecretMode) {
        // 모든 채팅방 가져오기 (시크릿 모드)
        const rooms = await getChatRooms(deviceId, department, role, true);
        console.log("시크릿 모드: 모든 채팅방 목록:", rooms);
        setChatRooms(rooms);
      } else if (department) {
        // 시크릿 모드가 아닌 경우 또는 대표원장이 아닌 경우
        // 대표원장이라도 시크릿 모드가 아니면 "일반사용자" 역할로 가져오기
        const effectiveRole = isDirector && !isSecretMode ? "일반사용자" : role;

        const rooms = await getChatRooms(deviceId, department, effectiveRole);
        console.log("일반 모드: 가져온 채팅방 목록:", rooms);
        setChatRooms(rooms);
      } else {
        // 부서가 없는 경우 전체 채팅방만 표시
        const globalRoomId = "global-chat";
        const globalRoom = {
          id: globalRoomId,
          name: "전체 채팅",
          type: CHAT_TYPES.GLOBAL,
          canSend: true, // 부서가 없어도 전체 채팅에서는 메시지 전송 허용
          unreadCount: 0,
          isMine: true,
        };
        setChatRooms([globalRoom]);
      }
    } catch (error) {
      console.error("채팅방 목록 가져오기 오류:", error);
    } finally {
      // 약간의 지연 후 로딩 상태 해제 - 부드러운 전환을 위해
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  };

  // Firebase 초기화
  useEffect(() => {
    const setupFirebase = async () => {
      try {
        // 채팅방 초기화 (없으면 생성)
        await initializeChatRooms();
      } catch (error) {
        console.error("Firebase 초기화 오류:", error);
      }
    };

    setupFirebase();
  }, []);

  // 초기 발신자 설정 - 로그인 상태면 해당 사용자, 아니면 부서의 첫 번째 사용자
  useEffect(() => {
    const initSender = async () => {
      try {
        console.log("발신자 설정 시도:", userLevelData);

        // 현재 사용자 설정
        if (userLevelData?.uid || userLevelData?.name) {
          const sender = {
            id: userLevelData?.uid || `temp-${Date.now()}`,
            name: userLevelData?.name || userLevelData?.displayName || "사용자",
            role: userLevelData?.role || "",
            department: userLevelData?.department || "",
          };

          console.log("로그인 유저로 발신자 설정:", sender.name);
          setSelectedSender(sender);

          // 사용자 정보 저장 (로컬 스토리지)
          try {
            localStorage.setItem("lastSender", JSON.stringify(sender));
          } catch (err) {
            console.error("발신자 정보 저장 실패:", err);
          }
        } else if (userLevelData?.department) {
          // 부서는 알지만 로그인은 안 된 상태
          try {
            const users = await getUsersFromDepartment(
              userLevelData.department
            );
            if (users && users.length > 0) {
              setDepartmentUsers(users);

              // 이전에 저장된 발신자 정보 확인
              try {
                const savedSender = localStorage.getItem("lastSender");
                if (savedSender) {
                  const sender = JSON.parse(savedSender);
                  console.log("저장된 발신자 정보 사용:", sender.name);
                  setSelectedSender(sender);
                } else {
                  // 저장된 정보 없음 - 미설정
                  setSelectedSender(null);
                  console.log(
                    "로그인 안된 상태로 발신자 미설정, 부서원 목록 로드됨:",
                    users.length
                  );
                }
              } catch (err) {
                console.error("저장된 발신자 정보 복원 실패:", err);
                setSelectedSender(null);
              }
            } else {
              console.warn("부서에 사용자가 없습니다. 발신자를 선택해주세요.");
            }
          } catch (error) {
            console.error("부서 사용자 목록 가져오기 오류:", error);
          }
        }
      } catch (error) {
        console.error("발신자 초기화 중 오류 발생:", error);
      }
    };

    initSender();
  }, [userLevelData]);

  // 채팅방 목록 불러오기
  useEffect(() => {
    fetchChatRooms(secretMode);
  }, [userLevelData, secretMode]); // userLevelData와 secretMode가 변경될 때마다 다시 실행

  // 채팅방을 선택했을 때 해당 채팅방의 메시지 표시
  const handleSelectRoom = async (room) => {
    // 이전 구독 정리
    if (messageUnsubscribe) {
      messageUnsubscribe();
    }

    setSelectedRoom(room);
    setMessages([]);

    // 디버깅 로그 추가
    console.log("선택된 채팅방:", room);
    console.log("채팅방 타입:", room.type);
    console.log("유저 레벨 데이터:", userLevelData);
    console.log("사용자 부서:", userLevelData?.department);
    console.log("현재 발신자:", selectedSender);

    // 메시지 전송 권한 설정 - 개선된 로직
    if (room.id === "global-chat" || room.type === CHAT_TYPES.GLOBAL) {
      // 전체 채팅 여부를 ID와 타입 모두 확인 (더 안전한 접근)
      const isManagementTeam = userLevelData?.department === "경영지원팀";
      console.log("경영지원팀 여부:", isManagementTeam);

      // 전체 채팅인 경우:
      // 1. 경영지원팀이 아니면 권한 있음
      // 2. 부서가 할당되지 않은 경우(빈 문자열)도 권한 있음
      setCanSend(!isManagementTeam || !userLevelData?.department);
      console.log(
        "전체 채팅 권한 설정:",
        !isManagementTeam || !userLevelData?.department
      );
    } else {
      // 다른 채팅방은 기존 로직 유지
      setCanSend(room.canSend);
      console.log("팀 채팅 권한 설정:", room.canSend);
    }

    // 채팅방 멤버 가져오기
    try {
      const roomMembers = await getChatRoomMembers(room.id);
      setMembers(roomMembers);

      // 멘션 가능한 사용자 목록
      const mentionable = await getMentionableUsers(room.id);
      setMentionableUsers(mentionable);

      // 채팅방 멤버를 발신자 선택 목록으로도 사용
      setDepartmentUsers(roomMembers);

      // 아직 발신자가 설정되지 않았거나 로그인 상태에서만 발신자 재설정
      if (!selectedSender) {
        if (userLevelData?.uid) {
          // 로그인 상태 - 사용자 정보로 설정
          const currentUser = roomMembers.find(
            (member) => member.id === userLevelData.uid
          );
          if (currentUser) {
            console.log(
              "채팅방 진입 시 로그인 사용자를 발신자로 설정:",
              currentUser.name
            );
            setSelectedSender(currentUser);
          } else if (roomMembers.length > 0) {
            // 목록에 사용자가 없으면 첫 번째 멤버로 설정
            console.log(
              "사용자를 찾을 수 없어 첫 번째 멤버로 설정:",
              roomMembers[0].name
            );
            setSelectedSender(roomMembers[0]);
          }
        } else if (roomMembers.length > 0) {
          // 비로그인 상태 - 첫 번째 멤버로 설정
          console.log(
            "비로그인 상태에서 첫 번째 멤버로 설정:",
            roomMembers[0].name
          );
          setSelectedSender(roomMembers[0]);
        }
      } else {
        console.log("이미 발신자가 설정됨:", selectedSender.name);
      }
    } catch (error) {
      console.error("채팅방 멤버 가져오기 오류:", error);
    }

    // 선택한 채팅방의 메시지를 실시간으로 구독
    const unsubscribe = subscribeToMessages(room.id, (updatedMessages) => {
      setMessages(updatedMessages);

      // 수신한 메시지 중 안 읽은 메시지를 읽음으로 표시 - 컴퓨터 기준으로 변경
      const deviceId =
        localStorage.getItem("deviceId") || `device-${Date.now()}`;
      if (!localStorage.getItem("deviceId")) {
        localStorage.setItem("deviceId", deviceId);
      }

      updatedMessages.forEach((msg) => {
        if (!msg.readBy || !msg.readBy.includes(deviceId)) {
          markMessageAsRead(msg.id, deviceId, room.id);
        }
      });
    });

    setMessageUnsubscribe(() => unsubscribe);

    // 채팅방 선택 시 해당 채팅방의 안 읽은 메시지 수 초기화
    setChatRooms((prevRooms) =>
      prevRooms.map((r) => (r.id === room.id ? { ...r, unreadCount: 0 } : r))
    );

    // 멤버 패널 초기화
    setShowMembers(false);
  };

  // 컴포넌트 언마운트 시 구독 정리
  useEffect(() => {
    return () => {
      // 구독 해제
      if (messageUnsubscribe) {
        console.log("채팅 메시지 구독 해제");
        messageUnsubscribe();
        setMessageUnsubscribe(null);
      }
    };
  }, [messageUnsubscribe]);

  // 라우팅 변경 감지(홈으로 이동 등)를 위한 추가 정리 함수
  useEffect(() => {
    const cleanupResources = () => {
      console.log("리소스 정리 실행");
      if (messageUnsubscribe) {
        console.log("채팅 메시지 구독 해제 (navigation)");
        messageUnsubscribe();
        setMessageUnsubscribe(null);
        setMessages([]); // 메시지 상태 초기화
      }
    };

    window.addEventListener("beforeunload", cleanupResources);
    window.addEventListener("popstate", cleanupResources);

    return () => {
      window.removeEventListener("beforeunload", cleanupResources);
      window.removeEventListener("popstate", cleanupResources);
      cleanupResources(); // 컴포넌트 언마운트 시에도 강제 정리
    };
  }, [messageUnsubscribe]);

  // 비밀번호 입력 처리
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setPasswordError(false);
  };

  // 비밀번호 입력 시 엔터키 처리
  const handlePasswordKeyDown = (e) => {
    if (e.key === "Enter") {
      attemptSecretMode();
    }
  };

  // 비밀번호 모달 렌더링
  const renderPasswordModal = () => {
    if (!showPasswordModal) return null;

    return (
      <ModalOverlay onClick={togglePasswordModal}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <PasswordInput
            type="password"
            placeholder="모바일 채팅은 아직 지원하지 않습니다."
            value={password}
            onChange={handlePasswordChange}
            onKeyDown={handlePasswordKeyDown}
            style={{ borderColor: passwordError ? "red" : "#ddd" }}
          />
          {passwordError && (
            <div
              style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}
            >
              비밀번호가 일치하지 않습니다.
            </div>
          )}
          <ModalButtonContainer>
            <ModalButton onClick={togglePasswordModal}>취소</ModalButton>
            <ModalButton primary onClick={attemptSecretMode}>
              확인
            </ModalButton>
          </ModalButtonContainer>
        </ModalContent>
      </ModalOverlay>
    );
  };

  // 헤더에 시크릿 모드 아이콘 추가
  const renderSecretModeIcon = () => {
    const isDirector = userLevelData?.role === "대표원장";

    console.log("isDirector", userLevelData);

    if (!isDirector) return null;

    return (
      <SecretModeIcon onClick={togglePasswordModal}>
        📶
        {secretMode && (
          <span
            style={{ fontSize: "12px", marginLeft: "2px", color: "#304ffd" }}
          >
            ON
          </span>
        )}
      </SecretModeIcon>
    );
  };

  // 뒤로가기 버튼을 눌렀을 때 채팅방 목록으로 돌아가기
  const handleBack = () => {
    setSelectedRoom(null);
    setMessages([]);
    setShowMembers(false);
    setMentionQuery("");
    setShowMentionSuggestions(false);
  };

  // 멤버 패널 토글
  const toggleMembersPanel = () => {
    setShowMembers(!showMembers);
  };

  // 멘션 관련 기능
  // 메시지 입력 처리
  const handleInputChange = (e) => {
    const text = e.target.value;

    // 이전 텍스트와 동일한 경우 중복 업데이트 방지
    if (text === messageText) return;

    // 이전 스크롤 위치 저장
    const container = document.querySelector(".mention-input-container");
    const prevScrollTop = container ? container.scrollTop : 0;
    const isUserScrolled = prevScrollTop > 0;

    setMessageText(text);

    // 입력 영역 높이 조절
    if (inputRef.current) {
      // 먼저 높이를 초기화
      inputRef.current.style.height = "40px";
      // 실제 콘텐츠 높이 계산
      const scrollHeight = inputRef.current.scrollHeight;
      const newHeight = Math.min(120, scrollHeight); // 최대 높이 제한

      // 높이 적용
      inputRef.current.style.height = `${newHeight}px`;

      // MentionInputContainer 높이도 조정
      if (container) {
        // 높이 설정 (padding 고려)
        container.style.height = `${newHeight}px`;

        // 스크롤 위치 조정
        if (text.length === 0) {
          // 텍스트가 없으면 스크롤 초기화
          container.scrollTop = 0;
        } else if (isUserScrolled) {
          // 사용자가 스크롤 중이면 위치 유지
          container.scrollTop = prevScrollTop;
        } else {
          // 아니면 자동 스크롤
          container.scrollTop = container.scrollHeight;
        }

        // 스크롤 위치 ref에 저장
        scrollPositionRef.current = container.scrollTop;
      }
    }

    // 멘션 관련 코드
    if (!text) {
      setParsedMentions([]);
      setShowMentionSuggestions(false);
      return;
    }

    parseInputForMentions(text);

    // 멘션 감지 (@다음에 텍스트 입력 중인지)
    const lastAtSymbolIndex = text.lastIndexOf("@");
    if (lastAtSymbolIndex !== -1 && lastAtSymbolIndex > text.lastIndexOf(" ")) {
      const query = text.slice(lastAtSymbolIndex + 1);
      setMentionQuery(query);

      // 멘션 쿼리로 사용자 필터링
      if (query) {
        const filtered = mentionableUsers.filter((user) =>
          user.name.toLowerCase().includes(query.toLowerCase())
        );
        setMentionSuggestions(filtered);
        setShowMentionSuggestions(filtered.length > 0);
        setActiveMentionIndex(0); // 첫 번째 항목 선택
      } else {
        setMentionSuggestions(mentionableUsers);
        setShowMentionSuggestions(true);
        setActiveMentionIndex(0);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };

  // 멘션 선택 처리
  const handleSelectMention = (user) => {
    // @뒤의 부분을 선택한 사용자 이름으로 교체
    const lastAtSymbolIndex = messageText.lastIndexOf("@");
    const newText =
      messageText.substring(0, lastAtSymbolIndex) + user.displayText + " ";

    setMessageText(newText);
    setShowMentionSuggestions(false);
    parseInputForMentions(newText);

    // 입력 포커스 유지
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // 입력 텍스트에서 멘션 파싱
  const parseInputForMentions = (text) => {
    const mentionRegex = /@(\S+)/g;
    const matches = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      matches.push({
        text: match[0],
        index: match.index,
        length: match[0].length,
      });
    }

    setParsedMentions(matches);
  };

  // 키보드 네비게이션 처리
  const handleKeyDown = (e) => {
    if (showMentionSuggestions) {
      // 위/아래 키로 멘션 선택
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveMentionIndex((prev) =>
          Math.min(prev + 1, mentionSuggestions.length - 1)
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveMentionIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        // 엔터 키로 멘션 선택
        e.preventDefault();
        if (mentionSuggestions[activeMentionIndex]) {
          handleSelectMention(mentionSuggestions[activeMentionIndex]);
        }
      } else if (e.key === "Escape") {
        // Esc 키로 멘션 취소
        e.preventDefault();
        setShowMentionSuggestions(false);
      }
    } else if (
      e.key === "Enter" &&
      !e.shiftKey &&
      canSend &&
      messageText.trim() &&
      !isSending
    ) {
      // 메시지 전송 (Shift+Enter는 줄바꿈)
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 우클릭 메뉴 열기 (수정)
  const handleMessageContextMenu = (e, message) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      message: message,
    });
  };

  // 반응 메뉴 열기
  const handleOpenReactionMenu = (e, message) => {
    e.stopPropagation();
    setReactionMenu({
      x: e.clientX,
      y: e.clientY,
      message: message,
    });
    setContextMenu(null); // 컨텍스트 메뉴 닫기
  };

  // 반응 추가 - 반응 추가 후 컨텍스트 메뉴 닫기
  const handleAddReaction = async (message, reactionType) => {
    try {
      await addReaction(
        message.id,
        userLevelData.uid,
        reactionType,
        selectedRoom.id
      );
    } catch (error) {
      console.error("반응 추가 오류:", error);
    } finally {
      // 반응 추가 후 항상 컨텍스트 메뉴와 반응 메뉴 닫기
      setContextMenu(null);
      setReactionMenu(null);
    }
  };

  // 문서 클릭/터치 시 우클릭 메뉴와 반응 메뉴 닫기
  useEffect(() => {
    // 메뉴 외부 클릭 감지
    const handleOutsideClick = (e) => {
      // 메뉴 요소 찾기
      const menuElements = document.querySelectorAll(".context-menu-container");

      // 클릭된 요소가 메뉴 외부인지 확인
      let isOutside = true;
      menuElements.forEach((menu) => {
        if (menu.contains(e.target)) {
          isOutside = false;
        }
      });

      // 메뉴 외부 클릭이면 닫기
      if (isOutside && (contextMenu || reactionMenu)) {
        setContextMenu(null);
        setReactionMenu(null);
      }
    };

    // 모바일 터치 이벤트 핸들러 - 메뉴 외부 터치 시만 닫기
    const handleDocumentTouch = (e) => {
      // 메뉴가 열려있고 메뉴 영역 외부를 터치했을 때만 처리
      if (contextMenu || reactionMenu) {
        // 메뉴 외부 터치 감지 로직
        const menuElements = document.querySelectorAll(
          ".context-menu-container"
        );
        let isOutside = true;

        for (let menu of menuElements) {
          const rect = menu.getBoundingClientRect();
          const x = e.touches[0].clientX;
          const y = e.touches[0].clientY;

          // 터치 좌표가 메뉴 영역 내에 있는지 확인
          if (
            x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom
          ) {
            isOutside = false;
            break;
          }
        }

        // 메뉴 외부 터치면 닫기
        if (isOutside) {
          setContextMenu(null);
          setReactionMenu(null);
        }
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener("click", handleOutsideClick);
    document.addEventListener("touchstart", handleDocumentTouch);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
      document.removeEventListener("touchstart", handleDocumentTouch);
    };
  }, [contextMenu, reactionMenu]);

  // 반응 아이콘 렌더링
  const renderReactionIcon = (type) => {
    switch (type) {
      case "heart":
        return "❤️";
      case "thumbsUp":
        return "👍";
      case "check":
        return "✅";
      default:
        return "👍";
    }
  };

  // 반응 개수 계산
  const getReactionCount = (reactions, type) => {
    return reactions && reactions[type] ? reactions[type].length : 0;
  };

  // 답장하기 기능
  const handleReply = (message) => {
    setReplyToMessage(message);
    setContextMenu(null);
    // 입력란에 포커스
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // 답장 취소하기
  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  // 현재 메시지에 대한 모든 반응 렌더링
  const renderReactions = (message, isMe) => {
    if (!message.reactions) return null;

    return (
      <MessageReactionContainer isMe={isMe}>
        {Object.entries(message.reactions).map(([type, users]) => {
          if (users.length === 0) return null;

          return (
            <ReactionBubble
              key={type}
              onClick={(e) => {
                e.stopPropagation();
                handleAddReaction(message, type);
              }}
            >
              {renderReactionIcon(type)}
              <span>{users.length}</span>
            </ReactionBubble>
          );
        })}
      </MessageReactionContainer>
    );
  };

  // 메시지 전송 처리 - 선택한 발신자 정보 사용
  const handleSendMessage = async () => {
    // 메시지가 비어있거나, 선택된 채팅방이 없거나, 권한이 없거나, 이미 전송 중이거나, 발신자가 선택되지 않았으면 무시
    if (
      !messageText.trim() ||
      !selectedRoom ||
      !canSend ||
      isSending ||
      !selectedSender
    )
      return;

    // 메시지 전송 중 상태로 설정 (락 설정)
    setIsSending(true);

    // 전송할 메시지 텍스트 저장 (상태 변경 전에)
    const textToSend = messageText.trim();

    try {
      // 상태 초기화 - 메시지를 먼저 비워서 UI에 즉시 반영되도록 함
      setMessageText("");
      setParsedMentions([]);
      setShowMentionSuggestions(false);

      // 입력창 높이 즉시 초기화
      if (inputRef.current) {
        inputRef.current.style.height = "40px";
      }

      const container = document.querySelector(".mention-input-container");
      if (container) {
        container.style.height = "40px"; // 초기 높이로 설정
        container.scrollTop = 0; // 스크롤 위치 초기화
      }

      // 답장 정보 구성
      const replyInfo = replyToMessage
        ? {
            id: replyToMessage.id,
            text: replyToMessage.text,
            senderName: replyToMessage.senderName,
          }
        : undefined;

      // 메시지 객체 구성
      const messageData = {
        text: textToSend,
        replyTo: replyInfo,
      };

      // 디바이스 ID 가져오기 (또는 생성)
      const deviceId =
        localStorage.getItem("deviceId") || `device-${Date.now()}`;
      if (!localStorage.getItem("deviceId")) {
        localStorage.setItem("deviceId", deviceId);
      }

      // Firebase에 메시지 저장 - 선택한 발신자 정보 사용
      await sendMessage(selectedRoom.id, messageData, {
        uid: selectedSender.id,
        name: selectedSender.name,
        deviceId: deviceId,
      });

      // 멘션 감지 및 호출 알림 생성
      const mentionRegex = /@(\S+)/g;
      const mentions = textToSend.match(mentionRegex);

      if (mentions && mentions.length > 0) {
        // 중복 제거한 멘션 목록
        const uniqueMentions = [...new Set(mentions)];

        for (const mention of uniqueMentions) {
          // 멘션된 사용자 이름 추출 (@제거)
          const mentionedName = mention.slice(1);

          // '@전체' 멘션은 제외 - 기능 숨김
          if (mentionedName === "전체") {
            console.log("전체 멘션은 현재 비활성화되어 있습니다.");
            continue;
          }

          // 멘션된 사용자 찾기
          const mentionedUser = mentionableUsers.find(
            (user) =>
              user.name === mentionedName ||
              user.displayName === mentionedName ||
              user.displayText?.includes(mentionedName)
          );

          if (mentionedUser && mentionedUser.department) {
            const userDepartment = mentionedUser.department;
            console.log(
              `멘션된 사용자: ${mentionedName}, 부서: ${userDepartment}`
            );

            // 부서 이름 표준화 - 팀 접미사 추가
            let departmentName = userDepartment;
            if (!departmentName.includes("팀")) {
              departmentName = `${departmentName}팀`;
            }

            // 현재 시간 포맷팅
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, "0");
            const minutes = String(now.getMinutes()).padStart(2, "0");
            const formattedTime = `${hours}:${minutes}`;

            // 호출 알림 데이터 구성
            const callData = {
              message: `${selectedRoom.name}에서 ${selectedSender.name}님이 ${mentionedName}(${departmentName})님을 언급했습니다.`,
              receiverId: departmentName, // 부서를 receiverId로 설정
              senderId: selectedSender.name,
              formattedTime,
              createdAt: Date.now(),
              createdAt2: serverTimestamp(),
              type: "chat",
              department: departmentName,
              senderInfo: selectedSender.name,
            };

            // Firestore에 호출 알림 저장
            try {
              const docRef = await addDoc(collection(db, "calls"), callData);
              console.log(
                `${mentionedName}(${departmentName}) 멘션 호출 생성 완료 - 문서 ID: ${docRef.id}`
              );
            } catch (error) {
              console.error("멘션 호출 생성 오류:", error);
            }
          } else {
            console.log(
              `멘션된 사용자를 찾을 수 없거나 부서 정보가 없습니다: ${mentionedName}`
            );
          }
        }
      }

      // 답장 상태 초기화
      setReplyToMessage(null);
    } catch (error) {
      console.error("메시지 전송 오류:", error);
    } finally {
      // 메시지 전송 완료 후 전송 상태 해제 (락 해제)
      setIsSending(false);

      // 안정적인 초기화를 위해 setTimeout 사용
      setTimeout(() => {
        // 입력 필드가 깨끗하게 비워졌는지 한번 더 확인
        if (inputRef.current && inputRef.current.value !== "") {
          inputRef.current.value = "";
        }

        // 입력창 높이 한 번 더 초기화
        if (inputRef.current) {
          inputRef.current.style.height = "40px";
        }

        const container = document.querySelector(".mention-input-container");
        if (container) {
          container.style.height = "40px";
          container.scrollTop = 0;
        }
      }, 100);
    }
  };

  // SendButton 클릭 핸들러
  const handleSendButtonClick = () => {
    if (canSend && messageText.trim() && !isSending) {
      handleSendMessage();
    }
  };

  // 새 메시지가 추가될 때 스크롤 맨 아래로
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  // 입력 필드 상태 모니터링
  useEffect(() => {
    // 메시지 전송 후 입력 필드가 비어있는데도 UI에 텍스트가 보이는 경우 강제로 초기화
    if (messageText === "" && inputRef.current) {
      // DOM 요소의 값을 강제로 비웁니다
      inputRef.current.value = "";
    }
  }, [messageText]);

  // 사용자 이니셜 가져오기
  const getUserInitials = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  // 채팅방 이니셜 가져오기
  const getRoomInitials = (name) => {
    if (!name) return "?";
    if (name.includes("전체")) return "전";

    // 팀 이름에서 첫 글자 가져오기 ('간호팀 채팅' -> '간')
    const teamName = name.split(" ")[0]; // '간호팀' 부분 추출
    return teamName.charAt(0);
  };

  const messageGroups = groupMessagesByDate(messages);

  // 현재 사용자가 원장님인지 확인
  const isDirector = userLevelData?.role === "대표원장";

  // 메시지 표시 부분에서 멘션된 텍스트 하이라이트
  const renderMessageText = (message) => {
    const highlightedText = highlightMentions(message.text);
    return <div dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  // 현재 사용자가 멘션된 메시지인지 확인
  const isUserMentioned = (message) => {
    if (!message.mentions || !userLevelData) return false;

    const userMention = `@${userLevelData.name || userLevelData.displayName}`;
    return (
      message.mentions.includes(userMention) ||
      message.mentions.includes("@전체")
    );
  };

  // 렌더링된 입력 필드 (멘션 칩 포함)
  const renderInput = () => {
    if (!messageText) {
      return null;
    }

    let result = [];
    let lastIndex = 0;

    // 줄바꿈 문자를 <br> 태그로 변환
    const renderText = (text) => {
      return text.split("\n").map((line, i, arr) => (
        <React.Fragment key={`line-${i}`}>
          {line}
          {i < arr.length - 1 && <br />}
        </React.Fragment>
      ));
    };

    parsedMentions.forEach((mention) => {
      // 멘션 이전 텍스트 추가
      if (mention.index > lastIndex) {
        result.push(
          <span key={`text-${lastIndex}`}>
            {renderText(messageText.substring(lastIndex, mention.index))}
          </span>
        );
      }

      // 멘션 칩 추가
      result.push(
        <MentionChip key={`mention-${mention.index}`}>
          {mention.text}
        </MentionChip>
      );

      lastIndex = mention.index + mention.length;
    });

    // 마지막 멘션 이후 텍스트 추가
    if (lastIndex < messageText.length) {
      result.push(
        <span key={`text-${lastIndex}`}>
          {renderText(messageText.substring(lastIndex))}
        </span>
      );
    }

    return result;
  };

  // 우클릭 메뉴 클릭 이벤트 처리
  const handleContextMenuClick = (e) => {
    e.stopPropagation();
  };

  // 메뉴 터치 이벤트 처리 함수
  const handleMenuTouch = (e) => {
    e.stopPropagation(); // 이벤트 버블링 방지
  };

  // 발신자 선택 토글 - 이벤트 버블링 중지
  const toggleSenderDropdown = (e) => {
    e.stopPropagation(); // 이벤트 버블링 중지
    setShowSenderDropdown(!showSenderDropdown);
  };

  // 발신자 선택 처리 - 이벤트 버블링 중지
  const handleSelectSender = (e, user) => {
    e.stopPropagation(); // 이벤트 버블링 중지
    setSelectedSender(user);
    setShowSenderDropdown(false);
  };

  // 문서 클릭 시 발신자 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      const selectorElement = document.querySelector(".sender-selector");
      if (selectorElement && !selectorElement.contains(e.target)) {
        setShowSenderDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // 클릭 위치로 커서 이동 처리 함수 추가
  const handleContainerClick = (e) => {
    if (!inputRef.current || !canSend) return;

    const container = document.querySelector(".mention-input-container");
    if (!container) return;

    // 컨테이너 내부 클릭 위치 계산
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 입력 필드에 포커스
    inputRef.current.focus();

    // 클릭 위치에 가장 가까운 텍스트 위치 계산
    // (정확한 구현은 복잡하므로 간단히 처리)
    // textarea의 내부 요소이므로 입력 필드 클릭만으로도 적절한 위치에 커서가 위치함
  };

  return (
    <Container>
      {/* 로딩 화면 - props 제거하고 항상 완전 불투명하게 표시 */}
      {loading && (
        <LoadingOverlay>
          <LoadingSpinner />
        </LoadingOverlay>
      )}

      <Header>
        <BackButton visible={selectedRoom !== null} onClick={handleBack}>
          &lt;
        </BackButton>
        <Title>{selectedRoom ? selectedRoom.name : "채팅"}</Title>

        {renderSecretModeIcon()}

        {selectedRoom && (
          <MembersButton onClick={toggleMembersPanel}>
            멤버 <MembersCount>{members.length}</MembersCount>
          </MembersButton>
        )}
      </Header>

      {!selectedRoom ? (
        // 채팅방 목록 화면
        <ChatRoomList>
          {chatRooms.length > 0 ? (
            chatRooms.map((room) => (
              <ChatRoomItem
                key={room.id}
                onClick={() => handleSelectRoom(room)}
                isMyTeam={room.isMine}
              >
                <ChatRoomProfile isMyTeam={room.isMine}>
                  {getRoomInitials(room.name)}
                </ChatRoomProfile>
                <ChatRoomInfo>
                  <ChatRoomName isMyTeam={room.isMine}>
                    {room.name}
                  </ChatRoomName>
                  <ChatRoomLastMessage>
                    {DUMMY_MESSAGES[room.id]?.length > 0
                      ? DUMMY_MESSAGES[room.id][
                          DUMMY_MESSAGES[room.id].length - 1
                        ].text
                      : "새로운 채팅방입니다"}
                  </ChatRoomLastMessage>
                </ChatRoomInfo>
                {room.unreadCount > 0 && (
                  <UnreadBadge>
                    {room.unreadCount > 9 ? `9+` : room.unreadCount}
                  </UnreadBadge>
                )}
              </ChatRoomItem>
            ))
          ) : (
            <div
              style={{ padding: "20px", textAlign: "center", color: "#666" }}
            >
              표시할 채팅방이 없습니다
            </div>
          )}
        </ChatRoomList>
      ) : (
        // 채팅 인터페이스
        <>
          <MessageContainer>
            {isDirector &&
              !selectedRoom.canSend &&
              selectedRoom.type !== "global" && (
                <ReadOnlyBanner>
                  이 채팅방에서는 메시지를 볼 수만 있습니다. 메시지 전송 권한이
                  없습니다.
                </ReadOnlyBanner>
              )}

            {messageGroups.map((group, groupIndex) => (
              <MessageGroup key={groupIndex}>
                <MessageDate>{formatDate(group.date)}</MessageDate>

                {group.messages.map((message) => {
                  // 로그인 상태에 따라 다른 방식으로 내 메시지 판단
                  let isMe = false;

                  if (isLoggedIn) {
                    // 로그인 상태: userLevelData.uid로 판단
                    isMe = message.senderId === userLevelData?.uid;
                  } else {
                    // 비로그인 상태: 오직 deviceId만으로 판단 (readBy 배열은 사용하지 않음)
                    const deviceId = localStorage.getItem("deviceId");
                    isMe = message.deviceId === deviceId;

                    // 디버깅용 로그
                    console.log(`메시지 ID: ${message.id}`);
                    console.log(
                      `메시지 발신자: ${message.senderName} (${message.senderId})`
                    );
                    console.log(`메시지 디바이스ID: ${message.deviceId}`);
                    console.log(`내 디바이스ID: ${deviceId}`);
                    console.log(`isMe: ${isMe}`);
                  }

                  const isMentioned = isUserMentioned(message);
                  return (
                    <MessageItem key={message.id} isMe={isMe}>
                      {/* 내 메시지가 아닐 때만 좌측에 프로필 표시 */}
                      {!isMe && (
                        <MessageProfile isMe={isMe}>
                          {getUserInitials(message.senderName)}
                        </MessageProfile>
                      )}

                      <MessageContent>
                        {!isMe && (
                          <SenderUserName isMe={isMe}>
                            {message.senderName}
                          </SenderUserName>
                        )}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: isMe ? "flex-end" : "flex-start",
                            width: "100%",
                          }}
                        >
                          {isMe && (
                            <MessageTime isMe={isMe}>
                              {formatMessageTime(message.createdAt)}
                            </MessageTime>
                          )}
                          <MessageBubble
                            isMe={isMe}
                            hasMention={isMentioned}
                            isReply={!!message.replyTo}
                            onContextMenu={(e) =>
                              handleMessageContextMenu(e, message)
                            }
                          >
                            {message.replyTo && (
                              <ReplyQuote isMe={isMe}>
                                <ReplyQuoteSender isMe={isMe}>
                                  {message.replyTo.senderName}
                                </ReplyQuoteSender>
                                <ReplyQuoteText isMe={isMe}>
                                  {message.replyTo.text}
                                </ReplyQuoteText>
                              </ReplyQuote>
                            )}
                            {renderMessageText(message)}
                          </MessageBubble>
                          {!isMe && (
                            <MessageTime isMe={isMe}>
                              {formatMessageTime(message.createdAt)}
                            </MessageTime>
                          )}
                        </div>
                        {renderReactions(message, isMe)}
                      </MessageContent>
                    </MessageItem>
                  );
                })}
              </MessageGroup>
            ))}
            <div ref={messageEndRef} />
          </MessageContainer>

          <InputContainer>
            {showMentionSuggestions && (
              <MentionSuggestions>
                {mentionSuggestions.map((user, index) => (
                  <MentionItem
                    key={user.id}
                    onClick={(e) => handleSelectMention(user)}
                    className={index === activeMentionIndex ? "active" : ""}
                  >
                    {user.displayText}
                  </MentionItem>
                ))}
              </MentionSuggestions>
            )}

            {/* 답장 메시지 UI - 카카오톡 스타일 */}
            {replyToMessage && (
              <ReplyPreviewContainer>
                <ReplyPreviewContent>
                  <ReplyPreviewSender>
                    {replyToMessage.senderName}에게 답장
                  </ReplyPreviewSender>
                  <ReplyPreviewText>{replyToMessage.text}</ReplyPreviewText>
                </ReplyPreviewContent>
                <ReplyPreviewCancel onClick={handleCancelReply}>
                  ✕
                </ReplyPreviewCancel>
              </ReplyPreviewContainer>
            )}

            {/* 발신자 선택 UI 추가 */}
            <SenderSelector
              onClick={toggleSenderDropdown}
              className="sender-selector"
            >
              {selectedSender ? (
                <>
                  <span style={{ marginLeft: "5px", flex: 1 }}>
                    {selectedSender.name}
                  </span>
                  <span style={{ fontSize: "10px", marginLeft: "4px" }}>▼</span>
                </>
              ) : (
                <>
                  <span>발신자 선택</span>
                  <span style={{ fontSize: "10px", marginLeft: "4px" }}>▼</span>
                </>
              )}

              {showSenderDropdown && (
                <SenderDropdown onClick={(e) => e.stopPropagation()}>
                  <SenderDropdownHeader>발신자 선택</SenderDropdownHeader>
                  <SenderOptionsList>
                    {members.length > 0 ? (
                      members.map((user) => (
                        <SenderOption
                          key={user.id}
                          onClick={(e) => handleSelectSender(e, user)}
                          className={
                            selectedSender?.id === user.id ? "selected" : ""
                          }
                        >
                          <SenderInfo>
                            <SenderUserName>{user.name}</SenderUserName>
                            <SenderRole>{user.role || "사용자"}</SenderRole>
                          </SenderInfo>
                        </SenderOption>
                      ))
                    ) : (
                      <div style={{ padding: "10px 15px", color: "#999" }}>
                        사용자가 없습니다
                      </div>
                    )}
                  </SenderOptionsList>
                </SenderDropdown>
              )}
            </SenderSelector>

            {/* 멘션 칩 포함된 입력 필드 - 세로로만 중앙 정렬, 가로는 항상 좌측 */}
            <MentionInputContainer
              disabled={!canSend}
              className="mention-input-container"
              onClick={handleContainerClick}
              onBlur={() => {
                // 포커스를 잃을 때 현재 스크롤 위치 저장
                const container = document.querySelector(
                  ".mention-input-container"
                );
                if (container) {
                  scrollPositionRef.current = container.scrollTop;
                }
              }}
              onFocus={() => {
                // 포커스를 얻을 때 저장된 스크롤 위치 복원
                const container = document.querySelector(
                  ".mention-input-container"
                );
                if (container) {
                  setTimeout(() => {
                    container.scrollTop = scrollPositionRef.current;
                  }, 0);
                }
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  width: "100%",
                  minHeight: "36px",
                  position: "relative",
                  padding: "2px 5px",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  height: !messageText ? "100%" : "auto",
                }}
              >
                {!messageText && (
                  <>
                    <CursorIndicator />
                    <Placeholder>
                      {canSend
                        ? "@멘션으로 사용자를 언급하세요"
                        : "해당 채팅방에 입력 권한이 없습니다"}
                    </Placeholder>
                  </>
                )}
                {renderInput()}
                {messageText && (
                  <MentionInput
                    style={{ minHeight: "24px", marginLeft: "1px" }}
                  />
                )}
              </div>
              <MessageInput
                ref={inputRef}
                key={`message-input-${selectedRoom?.id || "default"}`}
                type="text"
                placeholder=""
                value={messageText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={!canSend}
                onBlur={() => {
                  // 포커스를 잃을 때 현재 스크롤 위치 저장
                  const container = document.querySelector(
                    ".mention-input-container"
                  );
                  if (container) {
                    scrollPositionRef.current = container.scrollTop;
                  }
                }}
                onFocus={() => {
                  // 포커스를 얻을 때 저장된 스크롤 위치 복원
                  const container = document.querySelector(
                    ".mention-input-container"
                  );
                  if (container) {
                    setTimeout(() => {
                      container.scrollTop = scrollPositionRef.current;
                    }, 0);
                  }
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  zIndex: 1,
                  cursor: "text",
                  resize: "none",
                  overflow: "hidden",
                  minHeight: "36px",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              />
            </MentionInputContainer>

            <SendButton
              onClick={handleSendButtonClick}
              disabled={!canSend || !messageText.trim() || !selectedSender}
            >
              <IoPaperPlaneSharp size={18} />
            </SendButton>
          </InputContainer>
        </>
      )}

      {/* 우클릭 메뉴 */}
      {contextMenu && (
        <ContextMenu
          className="context-menu-container"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={handleContextMenuClick}
          onTouchStart={handleMenuTouch}
          onTouchMove={handleMenuTouch}
          onTouchEnd={handleMenuTouch}
        >
          <ContextMenuItem onClick={() => handleReply(contextMenu.message)}>
            답변하기
          </ContextMenuItem>
          <ReactionIconsContainer>
            <ReactionIconButton
              onClick={() => handleAddReaction(contextMenu.message, "heart")}
            >
              ❤️
            </ReactionIconButton>
            <ReactionIconButton
              onClick={() => handleAddReaction(contextMenu.message, "thumbsUp")}
            >
              👍
            </ReactionIconButton>
            <ReactionIconButton
              onClick={() => handleAddReaction(contextMenu.message, "check")}
            >
              ✅
            </ReactionIconButton>
          </ReactionIconsContainer>
        </ContextMenu>
      )}

      {/* 반응 메뉴 */}
      {reactionMenu && (
        <ReactionMenu
          className="context-menu-container"
          style={{
            top: reactionMenu.y - 60,
            left: Math.max(10, reactionMenu.x - 60),
          }}
          onClick={handleContextMenuClick}
          onTouchStart={handleMenuTouch}
          onTouchMove={handleMenuTouch}
          onTouchEnd={handleMenuTouch}
        >
          <ReactionButton
            onClick={() => handleAddReaction(reactionMenu.message, "heart")}
          >
            ❤️
          </ReactionButton>
          <ReactionButton
            onClick={() => handleAddReaction(reactionMenu.message, "thumbsUp")}
          >
            👍
          </ReactionButton>
          <ReactionButton
            onClick={() => handleAddReaction(reactionMenu.message, "check")}
          >
            ✅
          </ReactionButton>
        </ReactionMenu>
      )}

      {renderPasswordModal()}
    </Container>
  );
};

export default ChatWindow;
