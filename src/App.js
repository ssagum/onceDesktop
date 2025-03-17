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
import { notification } from "./assets/sound";
// Toast Provider 추가
import { ToastProvider } from "./contexts/ToastContext";
import Management from "./pages/Managemnet";
import { useUserLevel } from "./utils/UserLevelContext";
// TODO: Add SDKs for Firebase products that you want to use

// 앱 시작 시간 기록 (처음 실행 시 이전 메시지 알림 방지용)
const APP_START_TIME = Date.now();
console.log("앱 시작 시간:", new Date(APP_START_TIME).toLocaleTimeString());

// 처리된 알림 메시지 ID를 추적하기 위한 Set
const processedNotifications = new Set();

const App = () => {
  const { userLevelData } = useUserLevel();

  useEffect(() => {
    if (!userLevelData || !userLevelData.location) return;

    console.log("호출 리스너 설정됨, 위치:", userLevelData.location);

    // 현재 사용자의 location을 대상으로 하는 호출만 필터링
    const q = query(
      collection(db, "calls"),
      where("receiverId", "==", userLevelData.location),
      orderBy("createdAt", "desc"),
      limit(5)
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
          const timeSinceAppStart = Math.floor((messageTime - APP_START_TIME)/1000);
          
          console.log("현재 시간:", new Date(currentTime).toLocaleTimeString());
          console.log("메시지 시간:", new Date(messageTime).toLocaleTimeString());
          console.log("앱 시작 후 경과 시간(초):", timeSinceAppStart);
          
          // 앱 시작 이후에 생성된 메시지만 알림 표시 (음수면 앱 시작 전 메시지)
          if (messageTime > APP_START_TIME) {
            console.log("앱 시작 이후 메시지 - 알림음 재생 및 토스트 알림 표시");
            
            // 디버깅: electron API 확인
            console.log("window.electron 확인:", window.electron);
            console.log("sendNotification 함수 확인:", window.electron?.sendNotification);
            
            // 알림음 재생
            try {
              // 이미 재생 중인 오디오가 있으면 중지
              const audio = new Audio(notification);
              audio.oncanplaythrough = () => {
                audio.play()
                  .then(() => console.log("알림음 재생 성공"))
                  .catch(error => console.error("알림음 재생 실패:", error));
              };
            } catch (error) {
              console.error("알림음 생성 실패:", error);
            }

            if (window.electron && window.electron.sendNotification) {
              const notificationMsg = `${data.senderId}에서 호출: ${data.message}`;
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
  }, [userLevelData]);

  return (
    <ToastProvider>
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
          <Route path="/management" element={<Management />} />
        </Routes>
        {/* <ChatBot /> */}
      </div>
    </ToastProvider>
  );
};

export default App;
