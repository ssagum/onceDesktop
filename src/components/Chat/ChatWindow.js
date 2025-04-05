import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
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
  subscribeToUnreadCount,
} from "./ChatService";
import { useUserLevel } from "../../utils/UserLevelContext";
import { IoPaperPlaneSharp } from "react-icons/io5";

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

// 내가 보낸 메시지 판별 로직 (컴포넌트 내부에 정의)


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
  margin-right: 15px;
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

const ChatWindow = () => {
  const { userLevelData, isLoggedIn, currentUser } = useUserLevel();
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
  const [unreadCountUnsubscribe, setUnreadCountUnsubscribe] = useState(null);

  // 현재 선택된 발신자 상태 관리
  const [selectedSender, setSelectedSender] = useState(null);
  const [showSenderDropdown, setShowSenderDropdown] = useState(false);
  const [departmentUsers, setDepartmentUsers] = useState([]);

  // 창 가시성 감지를 위한 ref
  const isVisibleRef = useRef(true);

  // 창 최소화/복원 감지
  useEffect(() => {
    const handleVisibilityChange = () => {
      // 페이지가 보이지 않게 되면 (최소화 등)
      if (document.hidden) {
        isVisibleRef.current = false;
      } else {
        // 페이지가 다시 보이게 되면
        if (!isVisibleRef.current) {
          isVisibleRef.current = true;

          // 시크릿 모드였다면 해제
          if (secretMode) {
            setSecretMode(false);

            // 로딩 애니메이션 표시
            setLoading(true);
            // 약간의 지연 후 채팅방 목록 다시 로드
            setTimeout(() => {
              fetchChatRooms();
            }, 500);
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [secretMode]);

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
      const role = currentUser?.role || "";
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
        
        // 안 읽은 메시지 수 실시간 구독 설정
        setupUnreadCountSubscription(deviceId, department, role, true);
      } else if (department) {
        // 시크릿 모드가 아닌 경우 또는 대표원장이 아닌 경우
        // 대표원장이라도 시크릿 모드가 아니면 "일반사용자" 역할로 가져오기
        const effectiveRole = isDirector && !isSecretMode ? "일반사용자" : role;

        const rooms = await getChatRooms(deviceId, department, effectiveRole);
        console.log("일반 모드: 가져온 채팅방 목록:", rooms);
        setChatRooms(rooms);
        
        // 안 읽은 메시지 수 실시간 구독 설정
        setupUnreadCountSubscription(deviceId, department, effectiveRole, false);
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
      setLoading(false);
    }
  };

  // 안 읽은 메시지 수 실시간 구독 설정 함수 추가
  const setupUnreadCountSubscription = async (deviceId, department, role, isSecretMode) => {
    // 기존 구독이 있으면 해제
    if (unreadCountUnsubscribe) {
      unreadCountUnsubscribe();
    }
    
    try {
      // 모든 채팅방에 대한 안 읽은 메시지 수 구독 설정
      const unsubscribeFunc = await subscribeToUnreadCount(
        deviceId, 
        department, 
        role,
        (totalCount, roomsUnreadData) => {
          // 채팅방별 안 읽은 메시지 수 업데이트
          setChatRooms(prevRooms => 
            prevRooms.map(room => ({
              ...room,
              unreadCount: roomsUnreadData[room.id] || 0
            }))
          );
        }
      );
      
      // 구독 해제 함수 저장
      setUnreadCountUnsubscribe(() => unsubscribeFunc);
    } catch (error) {
      console.error("안 읽은 메시지 수 구독 설정 중 오류:", error);
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
      if (userLevelData?.uid && userLevelData?.name) {
        // 로그인 상태
        setSelectedSender({
          id: userLevelData.uid,
          name: userLevelData.name || userLevelData.displayName || "사용자",
          department: userLevelData.department || "",
        });
      } else if (userLevelData?.department) {
        // 부서는 알지만 로그인은 안 된 상태
        try {
          const users = await getUsersFromDepartment(userLevelData.department);
          setDepartmentUsers(users);
          // 자동 선택하지 않음 (첫 번째 사용자 자동 선택 제거)
          setSelectedSender(null);
        } catch (error) {
          console.error("부서 사용자 목록 가져오기 오류:", error);
        }
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
    console.log("현재 사용자:", currentUser);

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

      // 개선된 발신자 선택 로직: 로그인된 사용자와 이름이 일치하는 경우 자동 선택
      if (userLevelData?.uid) {
        // uid로 찾기
        let currentUser = roomMembers.find(
          (member) => member.id === userLevelData.uid
        );
        
        // uid로 못 찾았으면 이름으로 찾기
        if (!currentUser && userLevelData.name) {
          currentUser = roomMembers.find(
            (member) => member.name === userLevelData.name
          );
        }
        
        // 사용자 정보가 있으면 발신자로 설정
        if (currentUser) {
          console.log("발신자 자동 설정:", currentUser.name);
          setSelectedSender(currentUser);
        } else if (roomMembers.length > 0) {
          // 매칭되는 사용자가 없고, 멤버가 있으면 첫 번째 멤버로 설정
          console.log("매칭되는 사용자가 없어 첫 번째 멤버로 설정:", roomMembers[0].name);
          setSelectedSender(roomMembers[0]);
        }
      } else if (roomMembers.length > 0) {
        // 로그인하지 않은 경우 첫 번째 멤버로 설정
        console.log("로그인하지 않아 첫 번째 멤버로 설정:", roomMembers[0].name);
        setSelectedSender(roomMembers[0]);
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
      
      // 메시지 로드 완료 후 즉시 스크롤을 맨 아래로 이동 (smooth 애니메이션 제거)
      if (messageEndRef.current) {
        messageEndRef.current.scrollIntoView({ behavior: "auto" });
      }
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
      if (messageUnsubscribe) {
        messageUnsubscribe();
      }
      if (unreadCountUnsubscribe) {
        unreadCountUnsubscribe();
      }
    };
  }, [messageUnsubscribe, unreadCountUnsubscribe]);

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
          <ModalHeader>시크릿 모드 진입</ModalHeader>
          <PasswordInput
            type="password"
            placeholder="비밀번호를 입력하세요"
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
    
    // 값을 설정
    setMessageText(text);
    
    // 멘션 관련 코드
    if (!text) {
      // 비어있으면 멘션 관련 상태 초기화
      setParsedMentions([]);
      setShowMentionSuggestions(false);
      return;
    }
    
    try {
      // 멘션 파싱 시도
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
      
      // 멘션 감지 (@다음에 텍스트 입력 중인지)
      const lastAtSymbolIndex = text.lastIndexOf("@");
      if (lastAtSymbolIndex !== -1 && lastAtSymbolIndex > text.lastIndexOf(" ")) {
        const query = text.slice(lastAtSymbolIndex + 1);
        setMentionQuery(query);
        
        if (mentionableUsers && mentionableUsers.length > 0) {
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
        }
      } else {
        setShowMentionSuggestions(false);
      }
    } catch (error) {
      console.error("메시지 입력 처리 중 오류:", error);
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
      // 사용자 ID 가져오기 (로그인된 경우 uid, 아니면 장치 ID 사용)
      const userId = userLevelData?.uid || localStorage.getItem("deviceId") || `device-${Date.now()}`;
      
      await addReaction(
        message.id,
        userId,
        reactionType,
        selectedRoom.id
      );
      
      console.log(`반응 추가 성공: 메시지 ID-${message.id}, 사용자-${userId}, 반응-${reactionType}`);
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
    // 메시지가 비어있거나, 선택된 채팅방이 없거나, 권한이 없거나, 이미 전송 중이면 무시
    if (!messageText.trim() || !selectedRoom || !canSend || isSending) {
      return;
    }
    
    try {
      // 전송 중 상태로 설정
      setIsSending(true);
      
      // 메시지 정보 구성
      const deviceId = localStorage.getItem("deviceId") || `device-${Date.now()}`;
      const messageData = {
        text: messageText.trim(),
        replyTo: replyToMessage
      };
      
      // 발신자 정보 
      const sender = {
        uid: userLevelData?.uid || deviceId,
        name: userLevelData?.name || "사용자",
        deviceId
      };
      
      // 메시지 전송
      await sendMessage(selectedRoom.id, messageData, sender);
      
      // 입력 필드 초기화
      setMessageText("");
      
      // 답장 상태 초기화
      setReplyToMessage(null);
      
    } catch (error) {
      console.error("메시지 전송 중 오류 발생:", error);
    } finally {
      // 전송 상태 해제
      setIsSending(false);
    }
  };

  // SendButton 클릭 핸들러
  const handleSendButtonClick = () => {
    if (canSend && messageText.trim() && !isSending) {
      handleSendMessage();
    }
  };

  // 새 메시지가 추가될 때 스크롤 맨 아래로 (애니메이션 없이)
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "auto" });
    }
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

  const messageGroups = useMemo(() => {
    if (!messages || messages.length === 0) {
      return [];
    }
    
    return groupMessagesByDate(messages);
  }, [messages]);

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

  // 우클릭 메뉴 클릭 핸들러
  const handleContextMenuClick = (e) => {
    // 이벤트 전파 중지 - 클릭 이벤트가 외부로 전파되지 않도록 함
    e.stopPropagation();
  };

  // 메뉴 터치 이벤트 핸들러 (모바일 지원)
  const handleMenuTouch = (e) => {
    // 이벤트 전파 중지 - 터치 이벤트가 외부로 전파되지 않도록 함
    e.stopPropagation();
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

        {showMembers && selectedRoom && (
          <MembersPanel>
            <MembersPanelHeader>
              {selectedRoom.type === "global"
                ? "전체 채팅 멤버"
                : `${selectedRoom.departmentName} 채팅 멤버`}
            </MembersPanelHeader>
            <MemberList>
              {members.map((member) => (
                <MemberItem key={member.id}>
                  <MemberAvatar>{getUserInitials(member.name)}</MemberAvatar>
                  <MemberInfo>
                    <MemberName>{member.name}</MemberName>
                    <MemberRole>{member.role || "사용자"}</MemberRole>
                  </MemberInfo>
                </MemberItem>
              ))}
            </MemberList>
          </MembersPanel>
        )}
      </Header>

      {!selectedRoom ? (
        // 채팅방 목록 화면
        <ChatRoomList>
          {loading ? (
            <div className="p-4 text-center">채팅방 목록을 불러오는 중...</div>
          ) : chatRooms.length > 0 ? (
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
            <div className="p-4 text-center">표시할 채팅방이 없습니다</div>
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
                  // 내 메시지 판별 로직 사용
                  const isMe = isMyMessage(message);
                  
                  // 멘션 처리
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
