// ChatService.js - Firebase 연동 버전
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import {
  WELCOME_MESSAGES,
  INITIAL_CHAT_ROOMS,
  SYSTEM_USER,
  DEPARTMENTS,
} from "./data/initialData";

// 채팅방 타입
export const CHAT_TYPES = {
  GLOBAL: "global", // 전체 채팅
  TEAM: "team", // 팀 채팅
};

// 채팅방 ID 생성 함수
export const generateChatRoomId = (type, departmentName = null) => {
  if (type === CHAT_TYPES.GLOBAL) {
    return "global-chat";
  } else if (type === CHAT_TYPES.TEAM && departmentName) {
    return `team-chat-${departmentName}`;
  }
  return null;
};

// 초기 채팅방 설정
export const initializeChatRooms = async () => {
  try {
    // 전체 채팅방 생성
    const globalChatId = generateChatRoomId(CHAT_TYPES.GLOBAL);
    const globalChatRef = doc(db, "chatRooms", globalChatId);
    const globalChatDoc = await getDoc(globalChatRef);

    if (!globalChatDoc.exists()) {
      await setDoc(globalChatRef, {
        id: globalChatId,
        name: "전체 채팅",
        type: CHAT_TYPES.GLOBAL,
        createdAt: serverTimestamp(),
      });

      // 전체 채팅방 웰컴 메시지
      await addDoc(collection(db, "chatRooms", globalChatId, "messages"), {
        roomId: globalChatId,
        text: WELCOME_MESSAGES.global,
        senderId: SYSTEM_USER.id,
        senderName: SYSTEM_USER.name,
        createdAt: serverTimestamp(),
        readBy: [SYSTEM_USER.id],
      });
    }

    // 각 부서별 채팅방 생성
    for (const dept of DEPARTMENTS) {
      const teamChatId = generateChatRoomId(CHAT_TYPES.TEAM, dept);
      const teamChatRef = doc(db, "chatRooms", teamChatId);
      const teamChatDoc = await getDoc(teamChatRef);

      if (!teamChatDoc.exists()) {
        await setDoc(teamChatRef, {
          id: teamChatId,
          name: `${dept} 채팅`,
          type: CHAT_TYPES.TEAM,
          departmentName: dept,
          createdAt: serverTimestamp(),
        });

        // 부서 채팅방 웰컴 메시지
        await addDoc(collection(db, "chatRooms", teamChatId, "messages"), {
          roomId: teamChatId,
          text: WELCOME_MESSAGES.team(dept),
          senderId: SYSTEM_USER.id,
          senderName: SYSTEM_USER.name,
          createdAt: serverTimestamp(),
          readBy: [SYSTEM_USER.id],
        });
      }
    }

    console.log("채팅방 초기화 완료");
    return true;
  } catch (error) {
    console.error("채팅방 초기화 오류:", error);
    return false;
  }
};

// 부서별 사용자 목록 가져오기
export const getUsersFromDepartment = async (department) => {
  try {
    const usersRef = collection(db, "users");
    const q = department
      ? query(usersRef, where("department", "==", department))
      : usersRef;

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      name: doc.data().name || doc.data().displayName || "사용자", // 이름 필드 참조
    }));
  } catch (error) {
    console.error("사용자 목록 가져오기 실패:", error);
    return [];
  }
};

// 채팅방 멤버 목록 가져오기
export const getChatRoomMembers = async (roomId) => {
  try {
    const roomRef = doc(db, "chatRooms", roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      return [];
    }

    const roomData = roomDoc.data();

    if (roomData.type === CHAT_TYPES.GLOBAL) {
      // 전체 채팅방인 경우 모든 사용자 반환 (단, 경영지원팀 제외)
      const allUsers = await getUsersFromDepartment();
      // 경영지원팀 사용자 필터링
      return allUsers.filter((user) => user.department !== "경영지원팀");
    } else if (roomData.type === CHAT_TYPES.TEAM) {
      // 팀 채팅방인 경우 해당 부서 사용자만 반환
      return await getUsersFromDepartment(roomData.departmentName);
    }

    return [];
  } catch (error) {
    console.error("채팅방 멤버 목록 가져오기 실패:", error);
    return [];
  }
};

// 멘션 가능한 사용자 목록 가져오기
export const getMentionableUsers = async (roomId) => {
  try {
    const members = await getChatRoomMembers(roomId);
    // @전체 옵션 추가
    return [
      { id: "all", name: "전체", displayText: "@전체" },
      ...members.map((member) => ({
        id: member.id,
        name: member.name,
        displayText: `@${member.name}`,
        department: member.department,
        role: member.role,
      })),
    ];
  } catch (error) {
    console.error("멘션 가능한 사용자 목록 가져오기 실패:", error);
    return [];
  }
};

// 텍스트에서 멘션 추출
export const extractMentions = (text) => {
  const mentionRegex = /@(\S+)/g;
  const matches = text.match(mentionRegex) || [];
  return matches;
};

// 채팅방 접근 권한 확인
export const canAccessChatRoom = (user, room) => {
  if (!user || !room) return false;

  // 전체 채팅방은 모든 사용자 접근 가능 (경영지원팀 포함)
  if (room.type === CHAT_TYPES.GLOBAL) {
    return true;
  }

  // 팀 채팅방은 같은 부서 또는 원장님만 접근 가능
  if (room.type === CHAT_TYPES.TEAM) {
    // 원장님은 모든 팀 채팅방 접근 가능
    if (user.role === "대표원장") {
      return true;
    }

    // 일반 사용자는 본인 부서 채팅방만 접근 가능
    return room.departmentName === user.department;
  }

  return false;
};

// 채팅방에 메시지 전송 권한 확인
export const canSendMessage = (user, room) => {
  if (!user || !room) return false;

  // 대표원장은 모든 채팅방에서 메시지 전송 가능
  if (user.role === "대표원장") {
    return true;
  }

  // 전체 채팅방은 경영지원팀을 제외한 모든 사용자 전송 가능
  if (room.type === CHAT_TYPES.GLOBAL) {
    return user.department !== "경영지원팀";
  }

  // 팀 채팅방은 해당 부서 사용자만 전송 가능
  if (room.type === CHAT_TYPES.TEAM) {
    return room.departmentName === user.department;
  }

  return false;
};

// 채팅방 목록 가져오기
export const getChatRooms = async (
  deviceId,
  department,
  role,
  isSecretMode = false
) => {
  console.log("채팅방 목록 요청:", deviceId, department, role, isSecretMode);

  try {
    // 모든 채팅방 가져오기
    const chatRoomsRef = collection(db, "chatRooms");
    const snapshot = await getDocs(chatRoomsRef);
    const allRooms = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // 서버 타임스탬프 필드 처리
      createdAt:
        doc.data().createdAt instanceof Timestamp
          ? doc.data().createdAt.toDate()
          : doc.data().createdAt,
    }));

    // 사용자 객체 구성
    const currentUser = {
      deviceId: deviceId,
      department: department,
      role: role || "",
    };

    let accessibleRooms = [];

    // 대표원장은 시크릿 모드와 상관없이 모든 채팅방 접근 가능
    if (role === "대표원장") {
      // 원장님은 모든 채팅방 접근 가능
      accessibleRooms = allRooms.map((room) => ({
        ...room,
        // 원장팀 채팅방은 isMine = true, 나머지는 false
        isMine:
          room.departmentName === "원장팀" || room.type === CHAT_TYPES.GLOBAL,
        // 대표원장은 모든 채팅방에서 메시지 전송 가능
        canSend: true,
      }));
    } else {
      // 일반 사용자는 전체 채팅방과 본인 부서 채팅방만 접근 가능
      accessibleRooms = allRooms
        .filter((room) => {
          // 경영지원팀도 전체 채팅방에 접근 가능
          return canAccessChatRoom(currentUser, room);
        })
        .map((room) => ({
          ...room,
          isMine: true,
          canSend: canSendMessage(currentUser, room),
        }));
    }

    // 각 채팅방에 대해 읽지 않은 메시지 수 설정
    for (let i = 0; i < accessibleRooms.length; i++) {
      const room = accessibleRooms[i];
      const unreadCount = await getUnreadMessageCountByRoom(deviceId, room.id);
      accessibleRooms[i] = { ...room, unreadCount };
    }

    console.log("반환된 채팅방 목록:", accessibleRooms.length);
    return accessibleRooms;
  } catch (error) {
    console.error("채팅방 목록 가져오기 오류:", error);
    return [];
  }
};

// 채팅방의 메시지 목록 가져오기
export const getChatMessages = async (roomId) => {
  try {
    const messagesRef = collection(db, "chatRooms", roomId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // 서버 타임스탬프 필드 처리
      createdAt:
        doc.data().createdAt instanceof Timestamp
          ? doc.data().createdAt.toDate()
          : new Date(doc.data().createdAt),
    }));
  } catch (error) {
    console.error("메시지 목록 가져오기 오류:", error);
    return [];
  }
};

// 채팅방의 메시지 리스너 설정
export const subscribeToMessages = (roomId, callback) => {
  try {
    const messagesRef = collection(db, "chatRooms", roomId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // 서버 타임스탬프 필드 처리
        createdAt:
          doc.data().createdAt instanceof Timestamp
            ? doc.data().createdAt.toDate()
            : new Date(doc.data().createdAt),
      }));
      callback(messages);
    });
  } catch (error) {
    console.error("메시지 구독 오류:", error);
    return () => {}; // 빈 정리 함수 반환
  }
};

// 메시지 전송
export const sendMessage = async (roomId, message, user) => {
  try {
    // 멘션 추출
    const mentions = extractMentions(message.text);

    const messageData = {
      roomId,
      text: message.text,
      senderId: user.uid,
      senderName: user.name || user.displayName || "사용자",
      createdAt: serverTimestamp(),
      readBy: [user.deviceId || `device-${Date.now()}`], // 읽음 표시에 장치 ID 사용
    };

    // 멘션이 있는 경우에만 mentions 필드 추가
    if (mentions.length > 0) {
      messageData.mentions = mentions;
    }

    // 답장 정보가 있는 경우에만 replyTo 필드 추가
    if (message.replyTo) {
      messageData.replyTo = message.replyTo;
    }

    const docRef = await addDoc(
      collection(db, "chatRooms", roomId, "messages"),
      messageData
    );
    return docRef.id;
  } catch (error) {
    console.error("메시지 전송 오류:", error);
    return null;
  }
};

// 메시지를 읽음으로 표시 - 장치 ID 기반으로 변경
export const markMessageAsRead = async (messageId, deviceId, roomId) => {
  try {
    const messageRef = doc(db, "chatRooms", roomId, "messages", messageId);
    await updateDoc(messageRef, {
      readBy: arrayUnion(deviceId),
    });
    return true;
  } catch (error) {
    console.error("메시지 읽음 표시 오류:", error);
    return false;
  }
};

// 채팅방별 읽지 않은 메시지 수 가져오기 - 장치 ID 기반으로 변경
export const getUnreadMessageCountByRoom = async (deviceId, roomId) => {
  try {
    const messagesRef = collection(db, "chatRooms", roomId, "messages");
    const q = query(messagesRef, where("readBy", "array-contains", deviceId));

    const allMessagesSnapshot = await getDocs(messagesRef);
    const readMessagesSnapshot = await getDocs(q);

    const totalMessages = allMessagesSnapshot.size;
    const readMessages = readMessagesSnapshot.size;

    return totalMessages - readMessages;
  } catch (error) {
    console.error("채팅방별 읽지 않은 메시지 수 확인 오류:", error);
    return 0;
  }
};

// 전체 읽지 않은 메시지 수 가져오기 - 장치 ID 기반으로 변경
export const getUnreadMessageCount = async (deviceId, department, role) => {
  try {
    // 접근 가능한 채팅방 목록 가져오기
    const rooms = await getChatRooms(deviceId, department, role);

    // 접근 가능한 채팅방의 읽지 않은 메시지 합계 계산
    const totalUnread = rooms.reduce(
      (total, room) => total + room.unreadCount,
      0
    );

    console.log("전체 읽지 않은 메시지 수:", totalUnread);
    return totalUnread;
  } catch (error) {
    console.error("전체 읽지 않은 메시지 수 확인 오류:", error);
    return 0;
  }
};

// 메시지 전송 시간 포맷팅
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return "";

  const messageDate =
    timestamp instanceof Date ? timestamp : new Date(timestamp);

  if (isNaN(messageDate.getTime())) {
    return "";
  }

  const now = new Date();
  const diffMs = now - messageDate;
  const diffHours = diffMs / (1000 * 60 * 60);

  // 24시간 이내의 메시지
  if (diffHours < 24) {
    const hours = messageDate.getHours();
    const minutes = messageDate.getMinutes();
    const ampm = hours >= 12 ? "오후" : "오전";
    const displayHours = hours % 12 || 12;
    return `${ampm} ${displayHours}:${minutes.toString().padStart(2, "0")}`;
  }

  // 일주일 이내 메시지
  const diffDays = diffHours / 24;
  if (diffDays < 7) {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const dayName = days[messageDate.getDay()];
    return `${dayName}요일`;
  }

  // 그 외 메시지
  return `${messageDate.getFullYear()}/${(messageDate.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${messageDate.getDate().toString().padStart(2, "0")}`;
};

// 반응 추가하기
export const addReaction = async (messageId, userId, reactionType, roomId) => {
  try {
    const messageRef = doc(db, "chatRooms", roomId, "messages", messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) {
      return false;
    }

    const messageData = messageDoc.data();
    const reactions = messageData.reactions || {};

    // 이미 같은 반응이 있는지 확인
    if (reactions[reactionType] && reactions[reactionType].includes(userId)) {
      // 반응 제거
      const updatedReactions = { ...reactions };
      updatedReactions[reactionType] = updatedReactions[reactionType].filter(
        (id) => id !== userId
      );

      // 반응이 없으면 키 삭제
      if (updatedReactions[reactionType].length === 0) {
        delete updatedReactions[reactionType];
      }

      await updateDoc(messageRef, {
        reactions:
          Object.keys(updatedReactions).length > 0 ? updatedReactions : {},
      });
    } else {
      // 반응 추가
      const updatedReactions = { ...reactions };
      if (!updatedReactions[reactionType]) {
        updatedReactions[reactionType] = [];
      }
      updatedReactions[reactionType].push(userId);

      await updateDoc(messageRef, { reactions: updatedReactions });
    }

    return true;
  } catch (error) {
    console.error("반응 추가/제거 오류:", error);
    return false;
  }
};

// 안 읽은 메시지 수 실시간 구독 함수
export const subscribeToUnreadCount = async (deviceId, department, role, callback) => {
  try {
    console.log("안 읽은 메시지 수 실시간 구독 설정:", { deviceId, department, role });
    
    // 사용자의 채팅방 목록 가져오기
    const chatRooms = await getChatRooms(deviceId, department, role);
    
    // 각 채팅방별 구독 관리
    const unsubscribeFunctions = [];
    
    // 총 안 읽은 메시지 수
    let totalUnreadCount = 0;
    
    // 각 채팅방별로 메시지 구독 설정
    for (const room of chatRooms) {
      const unsubscribe = subscribeToMessages(room.id, (messages) => {
        // 현재 채팅방의 안 읽은 메시지 수 계산
        const unreadMessages = messages.filter(msg => !msg.readBy || !msg.readBy.includes(deviceId));
        const roomUnreadCount = unreadMessages.length;
        
        // 룸 ID와 안 읽은 메시지 수를 로컬 스토리지에 저장
        try {
          const roomsUnreadData = JSON.parse(localStorage.getItem('roomsUnreadData') || '{}');
          roomsUnreadData[room.id] = roomUnreadCount;
          localStorage.setItem('roomsUnreadData', JSON.stringify(roomsUnreadData));
          
          // 모든 채팅방의 총 안 읽은 메시지 수 계산
          const totalCount = Object.values(roomsUnreadData).reduce((sum, count) => sum + count, 0);
          
          // 콜백 호출하여 상태 업데이트
          if (totalCount !== totalUnreadCount) {
            totalUnreadCount = totalCount;
            callback(totalCount);
          }
        } catch (error) {
          console.error("안 읽은 메시지 수 저장 중 오류:", error);
        }
      });
      
      unsubscribeFunctions.push(unsubscribe);
    }
    
    // 초기 안 읽은 메시지 수 계산
    const initialCount = await getUnreadMessageCount(deviceId, department, role);
    callback(initialCount);
    
    // 구독 해제 함수 반환
    return () => {
      console.log("채팅 안 읽은 메시지 구독 해제");
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  } catch (error) {
    console.error("안 읽은 메시지 구독 설정 중 오류:", error);
    // 오류 발생 시 빈 함수 반환
    return () => {};
  }
};
