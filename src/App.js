import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
// Import the functions you need from the SDKs you need
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import Notice from "./pages/Notice";
import Education from "./pages/Education";
import Warehouse from "./pages/Warehouse";
import Call from "./pages/Call";
import Write from "./pages/Write";
import Task from "./pages/Task";
import Schedule from "./pages/Schedule";
import Vacation from "./pages/Vacation";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import { notification, NOTIFICATION_BASE64 } from "./assets/sound";
// Toast Provider 추가
import { ToastProvider } from "./contexts/ToastContext";
import { useUserLevel } from "./utils/UserLevelContext";
import Parking from "./pages/Parking";
import { initializeChatRooms } from "./components/Chat/ChatService";
// 신청 현황 페이지 추가
import Requests from "./pages/Requests";
// AudioContext 추가
import { AudioProvider, useAudio } from "./contexts/AudioContext";
// TODO: Add SDKs for Firebase products that you want to use

// 앱 시작 시간 기록 (처음 실행 시 이전 메시지 알림 방지용)
const APP_START_TIME = Date.now();
console.log("앱 시작 시간:", new Date(APP_START_TIME).toLocaleTimeString());

// 처리된 알림 메시지 ID를 추적하기 위한 Set
const processedNotifications = new Set();

const AppContent = () => {
  const { userLevelData } = useUserLevel();
  const { playNotificationSound } = useAudio();

  // 모든 미디어 요소에 대한 전역 볼륨 설정
  useEffect(() => {
    // HTML Media Element 기본 볼륨 정책 설정
    // 이는 새로 생성되는 모든 Audio 객체의 기본 볼륨에 영향을 줍니다
    try {
      const mediaElements = document.querySelectorAll('audio, video');
      mediaElements.forEach(element => {
        // 볼륨 속성을 직접 조작
        element.defaultMuted = false;
        
        // 모든 오디오 요소에 볼륨 변경 이벤트 리스너 추가
        element.addEventListener('volumechange', (e) => {
          console.log('미디어 요소 볼륨 변경됨:', e.target.volume);
        });
      });
      
      console.log('미디어 요소 기본 설정 적용 완료');
    } catch (error) {
      console.error('미디어 요소 설정 오류:', error);
    }
  }, []);

  useEffect(() => {
    if (
      !userLevelData ||
      (!userLevelData.location && !userLevelData.department)
    )
      return;

    console.log(
      "호출 리스너 설정됨, 위치:",
      userLevelData.location,
      "부서:",
      userLevelData.department
    );

    // 현재 사용자의 location이나 department를 대상으로 하는 호출 필터링
    const q = query(
      collection(db, "calls"),
      where("receiverId", "in", [
        userLevelData.location,
        userLevelData.department,
      ]),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("호출 데이터 변경 감지:", snapshot.docChanges().length);

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const docId = change.doc.id;

          // 이미 처리된 알림인지 확인 (중복 방지)
          if (processedNotifications.has(docId)) {
            console.log("이미 처리된 알림:", docId);
            return;
          }

          // 처리된 알림으로 표시
          processedNotifications.add(docId);

          console.log("새로운 호출 데이터:", data);

          // 메시지 시간 확인
          const currentTime = Date.now();
          const messageTime = data.createdAt;
          const timeSinceAppStart = Math.floor(
            (messageTime - APP_START_TIME) / 1000
          );

          console.log("현재 시간:", new Date(currentTime).toLocaleTimeString());
          console.log(
            "메시지 시간:",
            new Date(messageTime).toLocaleTimeString()
          );
          console.log("앱 시작 후 경과 시간(초):", timeSinceAppStart);

          // 앱 시작 이후에 생성된 메시지만 알림 표시 (음수면 앱 시작 전 메시지)
          if (messageTime > APP_START_TIME) {
            console.log(
              "앱 시작 이후 메시지 - 알림음 재생 및 토스트 알림 표시"
            );

            // 디버깅: electron API 확인
            console.log("window.electron 확인:", window.electron);
            console.log(
              "sendNotification 함수 확인:",
              window.electron?.sendNotification
            );

            // 알림음 재생 - 이전에 작동하던 방식으로 복원
            try {
              // 먼저 notification 객체 사용
              playNotificationSound(notification);
              console.log("notification 객체로 알림음 재생 시도");
              
              // 백업으로 Base64 데이터 시도
              setTimeout(() => {
                console.log("백업: Base64 데이터로 알림음 재생 시도");
                playNotificationSound(NOTIFICATION_BASE64);
              }, 300);
            } catch (error) {
              console.error("알림음 재생 오류:", error);
            }

            if (window.electron && window.electron.sendNotification) {
              // 호출 타입에 따른 메시지 포맷팅
              const callType = data.type || "호출";
              let typePrefix = "";

              switch (callType) {
                case "예약":
                  typePrefix = "📅 ";
                  break;
                case "호출":
                  typePrefix = "🔔 ";
                  break;
                case "채팅":
                  typePrefix = "💬 ";
                  break;
                case "시스템":
                  typePrefix = "🔧 ";
                  break;
                default:
                  typePrefix = "🔔 ";
                  break;
              }

              const notificationMsg = `${typePrefix}${data.senderId}: ${data.message}`;
              console.log("알림 메시지:", notificationMsg);
              try {
                window.electron.sendNotification(notificationMsg);
                console.log("sendNotification 함수 호출 완료");
              } catch (error) {
                console.error("sendNotification 호출 실패:", error);
              }
            } else {
              console.error("알림 기능을 찾을 수 없음: ", window.electron);
            }
          } else {
            console.log("앱 시작 전 메시지 - 알림 표시되지 않음");
          }
        }
      });
    });

    return () => unsubscribe();
  }, [userLevelData, playNotificationSound]);

  // Firebase 채팅방 초기화
  useEffect(() => {
    const initializeChat = async () => {
      try {
        await initializeChatRooms();
      } catch (error) {
        console.error("채팅방 초기화 오류:", error);
      }
    };

    initializeChat();
  }, []);

  // 알림음 테스트 함수 (개발 환경에서만 사용)
  const testNotificationSound = () => {
    console.log("알림음 테스트 시작");
    
    // 직접 재생 방식으로 변경
    try {
      // 다양한 방법 시도
      console.log("1. notification 객체로 재생 시도");
      playNotificationSound(notification);
      
      // 300ms 후에 백업 방식 시도
      setTimeout(() => {
        console.log("2. Base64 데이터로 재생 시도");
        playNotificationSound(NOTIFICATION_BASE64);
      }, 300);
    } catch (error) {
      console.error("알림음 테스트 오류:", error);
    }
  };
  
  // 개발 환경에서 키보드 단축키를 통한 알림음 테스트
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+T를 누르면 알림음 테스트
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        testNotificationSound();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playNotificationSound]);

  return (
    <div className="bg-primary w-full overflow-hidden bg-onceBackground">
      {/* 헤더부분 */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Notice" element={<Notice />} />
        <Route path="/Education" element={<Education />} />
        <Route path="/Warehouse" element={<Warehouse />} />
        <Route path="/write" element={<Write />} />
        <Route path="/Call" element={<Call />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/task" element={<Task />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/parking" element={<Parking />} />
        <Route path="/requests" element={<Requests />} />
      </Routes>
      {/* <ChatBot /> */}
    </div>
  );
};

const App = () => {
  return (
    <AudioProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AudioProvider>
  );
};

export default App;
