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
import PriorityToggle from "../common/PriorityToggle";
import { useToast } from "../../contexts/ToastContext";

const ModalHeaderZone = styled.div``;
const WhoZone = styled.div``;
const TitleZone = styled.div``;
const ContentZone = styled.div``;
const ButtonZone = styled.div``;

export default function RequestModal({ isVisible, setIsVisible }) {
  const { userLevelData } = useUserLevel();
  const [receiverPeople, setReceiverPeople] = useState([]);
  const [senderPeople, setSenderPeople] = useState([]);
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("중");
  const [title, setTitle] = useState("");

  // useToast 훅 사용
  const { showToast } = useToast();

  // 요청 메시지 전송 함수
  const sendRequestMessage = async () => {
    console.log("요청 시작:", {
      receiverPeople,
      senderPeople,
      message: message || `요청 메시지`,
    });

    if (receiverPeople.length === 0) {
      showToast("수신자를 선택해주세요.", "error");
      return;
    }

    if (senderPeople.length === 0) {
      showToast("발신자를 선택해주세요.", "error");
      return;
    }

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const formattedTime = `${hours}:${minutes}`;

    try {
      const requestData = {
        title: title || `요청`,
        message: message || `요청 메시지`,
        receiverPeople: receiverPeople,
        senderPeople: senderPeople,
        senderLocation: userLevelData.location,
        formattedTime,
        createdAt: Date.now(),
        createdAt2: serverTimestamp(),
        priority: priority,
        status: "대기중",
      };

      console.log("저장할 데이터:", requestData);

      await addDoc(collection(db, "requests"), requestData);
      console.log("요청 메시지 저장 성공");

      showToast(`요청을 성공적으로 전송하였습니다.`, "success");
      setIsVisible(false);
      setMessage("");
      setTitle("");
      setReceiverPeople([]);
    } catch (error) {
      console.error("요청 전송 에러 상세 정보:", error);
      showToast("요청 전송에 실패했습니다.", "error");
    }
  };

  const handleSenderChange = (selectedPeople) => {
    setSenderPeople(selectedPeople);
  };

  const handleReceiverChange = (selectedPeople) => {
    setReceiverPeople(selectedPeople);
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
            <WhoSelector
              who={"발신자"}
              selectedPeople={senderPeople}
              onPeopleChange={handleSenderChange}
            />
            <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[80px] ml-[40px]">
              수신:
            </label>
            <WhoSelector
              who={"수신자"}
              selectedPeople={receiverPeople}
              onPeopleChange={handleReceiverChange}
            />
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
          <div className="flex flex-row gap-x-[20px] w-full">
            <OnceOnOffButton
              text={"요청하기"}
              onClick={sendRequestMessage}
              on={receiverPeople.length > 0 && senderPeople.length > 0}
              alertMessage="발신자와 수신자를 모두 선택해주세요"
            />
          </div>
        </ButtonZone>
      </div>
    </ModalTemplate>
  );
}
