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
import PriorityToggle from "../common/PriorityToggle";

const ModalHeaderZone = styled.div``;
const WhoZone = styled.div``;
const TitleZone = styled.div``;
const ContentZone = styled.div``;
const ButtonZone = styled.div``;

export default function RequestModal({ isVisible, setIsVisible }) {
  const { userLevelData } = useUserLevel();
  const [receiverId, setReceiverId] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("중");
  const [title, setTitle] = useState("");

  // 호출 메시지 전송 함수
  const sendCallMessage = async () => {
    console.log("호출 시작:", {
      receiverId,
      senderId: userLevelData.location,
      message: message || `${receiverId} 호출`,
    });

    if (!receiverId) {
      alert("수신 부서를 선택해주세요.");
      return;
    }

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const formattedTime = `${hours}:${minutes}`;

    try {
      const callData = {
        title: title || `${receiverId} 호출`,
        message: message || `${receiverId} 호출`,
        receiverId: receiverId,
        senderId: userLevelData.location,
        formattedTime,
        createdAt: Date.now(),
        createdAt2: serverTimestamp(),
        [receiverId]: true,
        [userLevelData.location]: true,
        priority: priority,
      };

      console.log("저장할 데이터:", callData);

      await addDoc(collection(db, "calls"), callData);
      console.log("호출 메시지 저장 성공");

      alert(`${receiverId} 호출하였습니다.`);
      setIsVisible(false);
      setMessage("");
      setTitle("");
    } catch (error) {
      console.error("호출 에러 상세 정보:", error);
      alert("호출 전송에 실패했습니다.");
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
      modalClassName="rounded-xl"
    >
      <div className="flex flex-col items-center w-onceBigModal h-onceBigModalH bg-white px-[40px] py-[30px]">
        <ModalHeaderZone className="flex flex-row w-full justify-between h-[50px] items-center">
          <span className="text-[34px] font-bold">요청</span>
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
        <WhoZone className="flex flex-row items-center w-full px-[20px] my-[20px] justify-between">
          <div className="flex flex-row items-center">
            <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[60px]">
              발신:
            </label>
            <WhereSelector disabled={true} value={userLevelData.location} />
            <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[80px] ml-[40px]">
              수신:
            </label>
            <WhereSelector value={receiverId} onChange={setReceiverId} />
          </div>
          <div className="flex flex-row items-center">
            <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[80px] ml-[40px]">
              중요도:
            </label>
            <div className="flex flex-row gap-x-[10px]">
              {["상", "중", "하"].map((level) => (
                <PriorityToggle
                  key={level}
                  text={level}
                  isOn={priority === level}
                  onClick={() => setPriority(level)}
                />
              ))}
            </div>
          </div>
        </WhoZone>
        <TitleZone className="flex flex-row items-center w-full px-[20px] mb-[20px]">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="요청 제목을 입력해주세요"
            className="border border-gray-400 rounded-md h-[40px] px-4 w-full bg-textBackground"
          />
        </TitleZone>
        <ContentZone className="flex flex-col w-full px-[20px] mb-[20px] h-full">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="요청 내용을 작성해주세요"
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
          </div>
        </ButtonZone>
      </div>
    </ModalTemplate>
  );
}
