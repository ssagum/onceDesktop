import React, { useState, useEffect } from "react";
import ModalTemplate from "../common/ModalTemplate";
import styled from "styled-components";
import { cancel } from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import WhoSelector from "../common/WhoSelector";
import { useUserLevel } from "../../utils/UserLevelContext";
import UserChipText from "../common/UserChipText";
import ModeToggle from "../ModeToggle";
import { db } from "../../firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import PriorityToggle from "../common/PriorityToggle";
import { useToast } from "../../contexts/ToastContext";
import SelectableButton from "../common/SelectableButton";

const ModalHeaderZone = styled.div``;
const WhoZone = styled.div``;
const TitleZone = styled.div``;
const ContentZone = styled.div``;
const ButtonZone = styled.div``;
const DepartmentZone = styled.div`
  margin-bottom: 20px;
  width: 100%;
  padding: 0 20px;
`;

export default function RequestModal({ isVisible, setIsVisible }) {
  const { userLevelData } = useUserLevel();
  const [receiverPeople, setReceiverPeople] = useState([]);
  const [senderPeople, setSenderPeople] = useState([]);
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("중");
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [managersList, setManagersList] = useState([]);
  const [sendToManager, setSendToManager] = useState(false);

  // useToast 훅 사용
  const { showToast } = useToast();

  // 컴포넌트가 마운트될 때 사용자 정보 설정
  useEffect(() => {
    if (isVisible && userLevelData) {
      // 사용자가 있으면 발신자로 설정
      if (userLevelData.id) {
        setSenderPeople([userLevelData.id]);
      }

      // 부서 정보 설정
      if (userLevelData.department) {
        setDepartment(userLevelData.department);
      }
    }
  }, [isVisible, userLevelData]);

  // 부서가 변경될 때 해당 부서의 관리자(팀장/과장) 목록 가져오기
  useEffect(() => {
    if (!department) return;

    const fetchManagers = async () => {
      try {
        // 해당 부서의 팀장이나 과장 찾기
        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("department", "==", department),
          where("role", "in", ["manager", "admin"])
        );

        const querySnapshot = await getDocs(q);
        const managers = [];

        querySnapshot.forEach((doc) => {
          managers.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setManagersList(managers);
      } catch (error) {
        console.error("관리자 목록 가져오기 오류:", error);
      }
    };

    fetchManagers();
  }, [department]);

  // 부서 선택 핸들러
  const handleDepartmentChange = (value) => {
    setDepartment(value);
  };

  // 팀장/과장에게 보내기 토글 핸들러
  const toggleSendToManager = () => {
    const newValue = !sendToManager;
    setSendToManager(newValue);

    // 팀장/과장에게 보내기가 활성화되면 자동으로 관리자 목록을 수신자로 설정
    if (newValue && managersList.length > 0) {
      setReceiverPeople(managersList.map((manager) => manager.id));
    } else {
      // 비활성화되면 수신자 목록 초기화
      setReceiverPeople([]);
    }
  };

  // 요청 메시지 전송 함수
  const sendRequestMessage = async () => {
    console.log("요청 시작:", {
      receiverPeople,
      senderPeople,
      department,
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
        senderDepartment: department, // 발신자 부서 정보 추가
        formattedTime,
        createdAt: Date.now(),
        createdAt2: serverTimestamp(),
        priority: priority,
        status: "대기중",
        sentToManagers: sendToManager, // 관리자에게 보낸 요청인지 여부
      };

      console.log("저장할 데이터:", requestData);

      await addDoc(collection(db, "requests"), requestData);
      console.log("요청 메시지 저장 성공");

      showToast(`요청을 성공적으로 전송하였습니다.`, "success");
      setIsVisible(false);
      resetForm();
    } catch (error) {
      console.error("요청 전송 에러 상세 정보:", error);
      showToast("요청 전송에 실패했습니다.", "error");
    }
  };

  // 폼 리셋 함수
  const resetForm = () => {
    setMessage("");
    setTitle("");
    setReceiverPeople([]);
    setSendToManager(false);
    setPriority("중");
  };

  const handleSenderChange = (selectedPeople) => {
    setSenderPeople(selectedPeople);
  };

  const handleReceiverChange = (selectedPeople) => {
    // 사용자가 직접 수신자를 선택했을 때는 관리자 자동 선택 모드 해제
    if (sendToManager) {
      setSendToManager(false);
    }
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
            <img
              onClick={() => setIsVisible(false)}
              className="w-[30px]"
              src={cancel}
              alt="닫기"
              style={{ cursor: "pointer" }}
            />
          </div>
        </ModalHeaderZone>

        {/* 부서 선택 영역 추가 */}
        <DepartmentZone>
          <div className="flex flex-row items-center mb-2">
            <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[80px]">
              부서:
            </label>
            <div className="flex flex-row flex-wrap gap-2">
              {["진료", "간호", "물리치료", "원무", "방사선"].map((dept) => (
                <SelectableButton
                  key={dept}
                  field={department}
                  value={dept}
                  onChange={handleDepartmentChange}
                />
              ))}
            </div>
          </div>

          {/* 팀장/과장에게 보내기 옵션 */}
          {department && (
            <div className="flex items-center ml-[80px] mt-2">
              <input
                type="checkbox"
                id="sendToManager"
                checked={sendToManager}
                onChange={toggleSendToManager}
                className="mr-2 h-4 w-4"
              />
              <label htmlFor="sendToManager" className="text-gray-700">
                해당 부서 팀장/과장에게 발송 ({managersList.length}명)
              </label>
            </div>
          )}
        </DepartmentZone>

        <WhoZone className="flex flex-row items-center w-full px-[20px] my-[20px] justify-between">
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row items-center">
              <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[80px] whitespace-nowrap">
                발신:
              </label>
              <WhoSelector
                who={"발신자"}
                selectedPeople={senderPeople}
                onPeopleChange={handleSenderChange}
              />
            </div>
            <div className="flex flex-row items-center">
              <label className="h-[40px] ml-[20px] flex flex-row items-center font-semibold text-black w-[80px] whitespace-nowrap">
                수신:
              </label>
              <WhoSelector
                who={"수신자"}
                selectedPeople={receiverPeople}
                onPeopleChange={handleReceiverChange}
                disabled={sendToManager}
              />
            </div>
          </div>
          <div className="flex flex-row items-center justify-end">
            <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[80px] whitespace-nowrap">
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
              on={
                receiverPeople.length > 0 &&
                senderPeople.length > 0 &&
                department !== ""
              }
              alertMessage="발신자, 수신자, 부서를 모두 선택해주세요"
            />
          </div>
        </ButtonZone>
      </div>
    </ModalTemplate>
  );
}
