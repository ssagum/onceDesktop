import React, { useState, useEffect } from "react";
import ModalTemplate from "../common/ModalTemplate";
import styled from "styled-components";
import { cancel } from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import { useUserLevel } from "../../utils/UserLevelContext";
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
const TitleZone = styled.div``;
const ContentZone = styled.div``;
const ButtonZone = styled.div``;
const DepartmentZone = styled.div`
  margin-bottom: 20px;
  width: 100%;
  padding: 0 20px;
`;

// 부서 목록 상수로 정의
const DEPARTMENTS = [
  "진료팀",
  "간호팀",
  "물리치료팀",
  "원무팀",
  "영상의학팀",
  "대표원장",
];

export default function RequestModal({ isVisible, setIsVisible }) {
  const { userLevelData } = useUserLevel();
  const [receiverDepartment, setReceiverDepartment] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("중");
  const [title, setTitle] = useState("");
  const [senderDepartment, setSenderDepartment] = useState("");
  const [managersList, setManagersList] = useState([]);
  const [sendToManager, setSendToManager] = useState(false);
  const [receiverManagersList, setReceiverManagersList] = useState([]);

  // useToast 훅 사용
  const { showToast } = useToast();

  // 컴포넌트가 마운트될 때 사용자 정보 설정
  useEffect(() => {
    if (isVisible && userLevelData) {
      // 부서 정보 설정 - 발신 부서는 자동으로 사용자의 부서로 설정
      if (userLevelData.department) {
        setSenderDepartment(userLevelData.department);
      }

      // 폼 초기화
      resetForm();
    }
  }, [isVisible, userLevelData]);

  // 수신 부서가 변경될 때 해당 부서의 관리자(팀장/과장) 목록 가져오기
  useEffect(() => {
    if (!receiverDepartment) return;

    const fetchManagers = async () => {
      try {
        // 해당 부서의 팀장이나 과장 찾기
        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("department", "==", receiverDepartment),
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

        setReceiverManagersList(managers);
      } catch (error) {
        console.error("수신 부서 관리자 목록 가져오기 오류:", error);
      }
    };

    fetchManagers();
  }, [receiverDepartment]);

  // 수신 부서 선택 핸들러
  const handleReceiverDepartmentChange = (value) => {
    setReceiverDepartment(value);
    // 부서가 변경되면 관리자 전송 옵션 초기화
    setSendToManager(false);
  };

  // 팀장/과장에게 보내기 토글 핸들러
  const toggleSendToManager = () => {
    setSendToManager(!sendToManager);
  };

  // 요청 메시지 전송 함수
  const sendRequestMessage = async () => {
    if (!receiverDepartment) {
      showToast("수신 부서를 선택해주세요.", "error");
      return;
    }

    if (!senderDepartment) {
      showToast("발신 부서 정보가 없습니다.", "error");
      return;
    }

    if (!title.trim()) {
      showToast("요청 제목을 입력해주세요.", "error");
      return;
    }

    if (!message.trim()) {
      showToast("요청 내용을 입력해주세요.", "error");
      return;
    }

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const formattedTime = `${hours}:${minutes}`;

    try {
      // 요청 데이터 생성
      const requestData = {
        title: title,
        message: message,
        receiverDepartment: receiverDepartment,
        senderDepartment: senderDepartment,
        senderName: userLevelData.name || "알 수 없음",
        senderLocation: userLevelData.location || "",
        formattedTime,
        createdAt: Date.now(),
        createdAt2: serverTimestamp(),
        priority: priority,
        status: "대기중",
        sentToManagers: sendToManager,
        senderId: userLevelData.id || "",
      };

      // Firestore에 요청 데이터 저장
      const requestDocRef = await addDoc(
        collection(db, "requests"),
        requestData
      );
      const requestId = requestDocRef.id;

      // 호출(call) 데이터 생성 - 수신부서에 알림
      const callData = {
        message: `[${senderDepartment}] ${title}`,
        receiverId: receiverDepartment, // 수신 부서를 receiverId로 설정
        senderId: senderDepartment, // 발신 부서를 senderId로 설정
        formattedTime,
        createdAt: Date.now(),
        createdAt2: serverTimestamp(),
        type: "요청", // 호출 타입을 '요청'으로 설정
        requestId: requestId, // 요청 ID 저장 (나중에 링크용)
        [receiverDepartment]: true, // 수신 부서 필드 설정
        [senderDepartment]: true, // 발신 부서 필드 설정
      };

      // Firestore에 호출 데이터 저장
      await addDoc(collection(db, "calls"), callData);

      showToast(`요청이 성공적으로 전송되었습니다.`, "success");
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
    setReceiverDepartment("");
    setSendToManager(false);
    setPriority("중");
  };

  return (
    <ModalTemplate
      isVisible={isVisible}
      setIsVisible={setIsVisible}
      showCancel={false}
      modalClassName="rounded-xl"
    >
      <div className="flex flex-col items-center w-onceBigModal h-onceBigModalH bg-white px-[40px] py-[30px]">
        <ModalHeaderZone className="flex flex-row w-full justify-between h-[50px] items-center mb-6">
          <span className="text-[34px] font-bold">부서 요청</span>
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

        {/* 부서 정보 표시 영역 */}
        <DepartmentZone>
          <div className="flex flex-row items-center justify-between mb-4">
            {/* 발신 및 수신 부서 영역 */}
            <div className="flex flex-1 items-center">
              {/* 발신 부서 정보 (자동) */}
              <div className="flex items-center mr-6">
                <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[80px]">
                  발신 부서:
                </label>
                <div className="bg-gray-100 px-4 py-2 rounded-md text-gray-800 font-medium">
                  {senderDepartment || "부서 정보 없음"}
                </div>
              </div>

              {/* 수신 부서 선택 (드롭다운으로 변경) */}
              <div className="flex items-center">
                <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[80px]">
                  수신 부서:
                </label>
                <select
                  value={receiverDepartment}
                  onChange={(e) =>
                    handleReceiverDepartmentChange(e.target.value)
                  }
                  className="bg-white border border-gray-300 rounded-md px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">부서 선택</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 중요도 선택 영역 */}
            <div className="flex items-center justify-end">
              <label className="h-[40px] flex items-center font-semibold text-black w-[70px] whitespace-nowrap">
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
          </div>

          {/* 팀장/과장에게 보내기 옵션 */}
          {receiverDepartment && receiverManagersList.length > 0 && (
            <div className="flex items-center ml-[80px] mt-2 mb-2">
              <input
                type="checkbox"
                id="sendToManager"
                checked={sendToManager}
                onChange={toggleSendToManager}
                className="mr-2 h-4 w-4"
              />
              <label htmlFor="sendToManager" className="text-gray-700">
                {receiverDepartment} 팀장/과장에게만 발송 (
                {receiverManagersList.length}명)
              </label>
            </div>
          )}
        </DepartmentZone>

        {/* 제목 입력 영역 */}
        <TitleZone className="flex flex-row items-center w-full px-[20px] mb-[20px]">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="요청 제목을 입력해주세요"
            className="border border-gray-400 rounded-md h-[40px] px-4 w-full bg-textBackground"
          />
        </TitleZone>

        {/* 내용 입력 영역 */}
        <ContentZone className="flex flex-col w-full px-[20px] mb-[20px] h-full">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="요청 내용을 작성해주세요"
            className="border border-gray-400 rounded-md h-full p-4 w-full bg-textBackground"
          />
        </ContentZone>

        {/* 버튼 영역 */}
        <ButtonZone className="flex flex-row w-full justify-center px-[20px]">
          <div className="flex flex-row gap-x-[20px] w-full">
            <OnceOnOffButton
              text={"요청하기"}
              onClick={sendRequestMessage}
              on={
                receiverDepartment !== "" &&
                senderDepartment !== "" &&
                title.trim() !== "" &&
                message.trim() !== ""
              }
              alertMessage="모든 필수 항목을 입력해주세요"
            />
          </div>
        </ButtonZone>
      </div>
    </ModalTemplate>
  );
}
