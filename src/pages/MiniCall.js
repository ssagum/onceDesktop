import React, { useEffect, useState } from "react";
import { db } from "../firebase.js";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import logoLong from "./assets";
import { useToast } from "../contexts/ToastContext";
import { useAudio } from "../contexts/AudioContext";

const MiniCall = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [receiverId, setReceiverId] = useState(
    localStorage.getItem("receiverId") || "개발1실"
  );
  const [recentCalls, setRecentCalls] = useState([]);
  const receiverOptions = ["개발1실", "개발2실", "개발3실", "개발4실"];
  const [latestCall, setLatestCall] = useState(null);
  const [isSending, setIsSending] = useState(false); // 쿨타임 상태
  const [firstTime, setFirstTime] = useState(true);
  const { showToast } = useToast();
  const { playNotificationSound } = useAudio();

  // 📌 Firestore에서 실시간 호출 기록 불러오기
  useEffect(() => {
    if (!receiverId) return;

    const q = query(
      collection(db, "calls"),
      where(`${receiverId}`, "==", true),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        setRecentCalls([]);
        setLatestCall(null);
        console.log("No recent calls found");
        return;
      }

      const calls = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        docId: doc.id,
      }));

      setRecentCalls(calls);

      // 📢 최신 호출 기록 필터링 및 사운드 재생
      const thisTimeLatestReceivedCall = calls.find(
        (call) => call.receiverId === receiverId
      );

      if (!thisTimeLatestReceivedCall) {
        console.log("No matching call found");
        return;
      }

      if (firstTime === true) {
        setLatestCall(thisTimeLatestReceivedCall);
        setFirstTime(false);
        console.log("First time");
      } else {
        if (thisTimeLatestReceivedCall.docId !== latestCall?.docId) {
          console.log(
            "step3",
            thisTimeLatestReceivedCall.docId,
            latestCall?.docId
          );
          setLatestCall(thisTimeLatestReceivedCall);
          playNotificationSound("/notification.mp3");
        } else {
          console.log("No new calls");
        }
      }
    });

    return () => unsubscribe();
  }, [receiverId, latestCall]);

  // Firestore에 호출 메시지 저장
  const handleCallCreate = (location) => {
    if (!socket) {
      initSocket();
    }

    // 소켓 이벤트 발생
    if (socket) {
      socket.emit("call-create", {
        location,
        sender: user.name,
      });
      showToast(`${location} 호출하였습니다.`, "success");
    }
  };

  // 위치 선택 시 로컬 스토리지에 저장
  const handleSelectReceiver = (option) => {
    setLatestCall(null);
    setFirstTime(true);
    setReceiverId(option);
    localStorage.setItem("receiverId", option);
  };

  return (
    <div className="w-[400px] h-[250px] bg-white shadow-lg overflow-hidden">
      {/* 상단 탭 */}
      <div className={`flex min-w-[400px] justify-around text-white py-2`}>
        <button
          className={`flex-1 h-[40px] px-4  ${
            activeTab === "home" ? " bg-[#1B3764]" : "bg-[#999]"
          }`}
          onClick={() => setActiveTab("home")}
        >
          HOME
        </button>
        <button
          className={`flex-1 h-[40px] px-4  ${
            activeTab === "settings" ? " bg-[#1B3764]" : "bg-[#999]"
          }`}
          onClick={() => setActiveTab("settings")}
        >
          내 위치 설정
        </button>
        <button
          className={`flex-1 h-[40px] px-4 ${
            activeTab === "history" ? " bg-[#1B3764]" : "bg-[#999]"
          }`}
          onClick={() => setActiveTab("history")}
        >
          연락 기록
        </button>
      </div>

      {/* 탭 내용 */}
      <div className="">
        {activeTab === "home" && (
          <div className="flex flex-col h-[250px]">
            <div className="flex my-[10px] h-[40px] mx-[10px] justify-center rounded-lg items-center text-center bg-slate-300">
              <p>
                최근 받은 연락:{" "}
                {latestCall
                  ? `${latestCall.senderId} - ${latestCall.formattedTime}`
                  : "기록 없음"}
              </p>
            </div>
            <div className="flex w-full justify-between items-center px-[10px]">
              {receiverOptions.map((location) => (
                <button
                  key={location}
                  onClick={() => handleCallCreate(location)}
                  className={`${
                    receiverId !== location ? "bg-[#1B3764]" : "bg-[#888]"
                  } text-white py-2 rounded w-[90px] text-[16px]`}
                  disabled={receiverId === location}
                >
                  {location}
                </button>
              ))}
            </div>
            <div className="flex-1 flex-col flex pt-[20px] items-center">
              <img src={logoLong} alt="Logo" className="w-[200px]" />
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div>
            <div className="flex my-[10px] h-[40px] mx-[10px] justify-center rounded-lg items-center text-center bg-slate-300">
              <p>
                최근 받은 연락:{" "}
                {latestCall
                  ? `${latestCall.senderId} - ${latestCall.formattedTime}`
                  : "기록 없음"}
              </p>
            </div>
            <div className="flex w-full justify-between items-center px-[10px]">
              {receiverOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSelectReceiver(option)}
                  className={`${
                    receiverId === option ? "bg-[#1B3764]" : "bg-[#888]"
                  } text-white py-2 rounded w-[90px] text-[16px]`}
                  disabled={receiverId === option}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="flex-1 flex-col flex pt-[20px] items-center">
              <img src={logoLong} alt="Logo" className="w-[200px]" />
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="h-[300px] overflow-y-scroll p-4 bg-slate-100 rounded-md shadow-inner">
            <ul className="flex flex-col gap-4">
              {recentCalls.map((call) => (
                <li
                  key={call.docId}
                  className={`max-w-[70%] p-3 rounded-xl shadow-md ${
                    call.senderId === receiverId
                      ? "bg-green-200 self-end text-right ml-auto"
                      : "bg-gray-200 self-start text-left mr-auto"
                  }`}
                >
                  <p className="text-sm text-gray-700">
                    {call.senderId === receiverId
                      ? `${call.message} - ${call.formattedTime} `
                      : `${call.senderId} - ${call.formattedTime}`}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiniCall;
