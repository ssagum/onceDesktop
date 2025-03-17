import React, { useState } from "react";
import ModalTemplate from "../common/ModalTemplate";
import styled from "styled-components";
import { cancel } from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import WhoSelector from "../common/WhoSelector";
import { useUserLevel } from "../../utils/UserLevelContext";
import UserChipText from "../common/UserChipText";
import ModeToggle from "../ModeToggle";
import { db } from "../../firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import WhereSelector from "../common/WhereSelector.js";
import { useToast } from "../../contexts/ToastContext";

const ModalHeaderZone = styled.div``;
const WhoZone = styled.div``;
const TitleZone = styled.div``;
const ContentZone = styled.div``;
const ButtonZone = styled.div``;

export default function CallModal({ isVisible, setIsVisible }) {
  const { userLevelData } = useUserLevel();
  const [receiverId, setReceiverId] = useState("");
  const [message, setMessage] = useState("");

  // useToast 훅 사용
  const { showToast } = useToast();

  // 호출 메시지 전송 함수
  const sendCallMessage = async () => {
    console.log("호출 시작:", {
      receiverId,
      senderId: userLevelData.location,
      message: message || `${receiverId} 호출`,
    });

    if (!receiverId) {
      showToast("수신 부서를 선택해주세요.", "error");
      return;
    }

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const formattedTime = `${hours}:${minutes}`;

    try {
      const callData = {
        message: message || `${receiverId} 호출`,
        receiverId: receiverId,
        senderId: userLevelData.location,
        formattedTime,
        createdAt: Date.now(),
        createdAt2: serverTimestamp(),
        [receiverId]: true,
        [userLevelData.location]: true,
      };

      console.log("저장할 데이터:", callData);

      const docRef = await addDoc(collection(db, "calls"), callData);
      console.log("호출 메시지 저장 성공:", docRef.id);

      setIsVisible(false);
      setMessage("");
      setReceiverId("");
      showToast(`${receiverId} 호출하였습니다.`, "success");
    } catch (error) {
      console.error("호출 에러 상세 정보:", error);
      showToast("호출 전송에 실패했습니다.", "error");
    }
  };

  const handleReceiverChange = (selectedValue) => {
    setReceiverId(selectedValue);
  };

  return (
    <ModalTemplate
      isVisible={isVisible}
      setIsVisible={setIsVisible}
      showCancel={false}
      modalClassName="rounded-xl">
      <div className="flex flex-col items-center w-onceBigModal h-onceBigModalH bg-white px-[40px] py-[30px]">
        <ModalHeaderZone className="flex flex-row w-full justify-between h-[50px] items-center">
          <span className="text-[34px] font-bold">호출</span>
          <div className="flex flex-row items-center">
            {/* <ModeToggle /> */}
            <img
              onClick={() => setIsVisible(false)}
              className="w-[30px]"
              src={cancel}
              alt="닫기"
              style={{ cursor: "pointer" }}
            />
          </div>
        </ModalHeaderZone>
        <WhoZone className="flex flex-row items-center w-full px-[20px] my-[20px]">
          <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[60px]">
            발신:
          </label>
          <WhereSelector disabled={true} value={userLevelData.location} />
          <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[80px] ml-[40px]">
            수신:
          </label>
          <WhereSelector value={receiverId} onChange={setReceiverId} />
        </WhoZone>
        {/* <TitleZone className="flex flex-row items-center w-full px-[20px]">
          <input
            type="text"
            placeholder="공지제목"
            className="border border-gray-400 rounded-md h-[40px] px-4 w-full bg-textBackground"
          />
        </TitleZone> */}
        <ContentZone className="flex flex-col w-full px-[20px] mb-[20px] h-full">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="단순 호출 시에는 내용을 작성하지 않으시고 비워 두시는 것이 권장됩니다."
            className="border border-gray-400 rounded-md h-full p-4 w-full bg-textBackground"
          />
        </ContentZone>
        <ButtonZone className="flex flex-row w-full justify-center px-[20px]">
          {/* <div className="flex flex-row gap-x-[20px] w-full">
            <OnceOnOffButton text={"수정"} />
            <OnceOnOffButton text={"삭제"} />
            <OnceOnOffButton text={"확인"} />
          </div> */}
          {/* <div className="flex flex-row gap-x-[20px] w-full">
            <OnceOnOffButton text={"확인"} />
          </div> */}
          <div className="flex flex-row gap-x-[20px] w-full">
            <OnceOnOffButton
              text={"호출하기"}
              onClick={sendCallMessage}
              on={receiverId !== ""}
              alertMessage="수신 위치를 선택해주세요"
            />
            <OnceOnOffButton
              text={"알림 테스트"}
              onClick={() => {
                console.log("알림 테스트 시작");
                console.log("window.electron 확인:", window.electron);
                
                // 1. 브라우저 네이티브 알림 테스트
                try {
                  if (window.Notification && window.Notification.permission === "granted") {
                    new window.Notification("브라우저 알림 테스트", {
                      body: "브라우저 API를 통한 알림 테스트입니다."
                    });
                    console.log("브라우저 알림 표시됨");
                  } else if (window.Notification) {
                    window.Notification.requestPermission().then(permission => {
                      if (permission === "granted") {
                        new window.Notification("브라우저 알림 테스트", {
                          body: "브라우저 API를 통한 알림 테스트입니다."
                        });
                      }
                    });
                  }
                } catch (e) {
                  console.error("브라우저 알림 실패:", e);
                }
                
                // 2. Electron IPC 알림 테스트
                if (window.electron && window.electron.sendNotification) {
                  console.log("sendNotification 함수 호출");
                  window.electron.sendNotification("테스트 알림 메시지입니다.");
                  console.log("sendNotification 함수 호출 완료");
                } else {
                  console.error("electron API를 찾을 수 없음");
                  
                  // 3. 토스트 알림 표시 (showToast는 컴포넌트에서 가져온 함수)
                  showToast("Electron API가 없습니다. 알림을 표시할 수 없습니다.", "error");
                }
              }}
              on={true}
            />
            <OnceOnOffButton
              text={"IPC 테스트"}
              onClick={() => {
                console.log("IPC 테스트 시작");
                if (window.electron && window.electron.testIPC) {
                  console.log("testIPC 함수 호출");
                  window.electron.testIPC("테스트 메시지");
                  console.log("testIPC 함수 호출 완료");
                } else {
                  console.error("IPC 테스트 함수를 찾을 수 없음");
                }
              }}
              on={true}
            />
          </div>
        </ButtonZone>
      </div>
    </ModalTemplate>
  );
}
