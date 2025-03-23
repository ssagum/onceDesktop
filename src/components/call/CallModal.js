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
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import WhereSelector from "../common/WhereSelector.js";
import { useToast } from "../../contexts/ToastContext";
import { IoSettingsSharp } from "react-icons/io5";

const ModalHeaderZone = styled.div``;
const WhoZone = styled.div``;
const TitleZone = styled.div``;
const ContentZone = styled.div``;
const ButtonZone = styled.div``;

// 모드 토글 스위치 컴포넌트 - 스타일드 컴포넌트로 정의
const ToggleContainer = styled.div`
  display: flex;
  position: relative;
  width: 340px;
  height: 50px;
  margin-left: 25px;
  border-radius: 30px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  background-color: #f5f5f5;
`;

const ToggleOption = styled.div.attrs((props) => ({
  // active 속성은 styled-components 내부에서만 사용하고 HTML로 전달하지 않도록 함
  "data-active": props.active ? "true" : "false",
}))`
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50%;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.3s ease;
  color: ${(props) => (props.active ? "#fff" : "#555")};
  font-size: 16px;
`;

const ToggleSlider = styled.div.attrs((props) => ({
  // position 속성을 HTML로 전달하지 않도록 함
  "data-position": props.position || "left",
}))`
  position: absolute;
  top: 4px;
  left: ${(props) => (props.position === "left" ? "4px" : "50%")};
  width: calc(50% - 8px);
  height: calc(100% - 8px);
  background-color: #007bff;
  border-radius: 16px;
  transition: left 0.3s ease;
`;

const ToggleIcon = styled.span`
  margin-right: 10px;
  font-size: 22px;
`;

// 프리셋 버튼 스타일 추가
const PresetContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-bottom: 20px;
`;

const PresetButton = styled.button`
  background-color: ${(props) => {
    if (props.disabled) return "#9D9D9C";
    if (props.isEmpty) return "#9D9D9C"; // 설정되지 않은 프리셋은 회색
    return "#002D5D"; // 설정된 프리셋은 진한 파란색
  }};
  color: ${(props) => (props.disabled ? "#999" : "white")};
  padding: 16px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 16px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;

  &:hover {
    background-color: ${(props) => {
      if (props.disabled) return "#f0f0f0";
      if (props.isEmpty) return "#4B5563";
      return "#1d4ed8";
    }};
    border-color: ${(props) => {
      if (props.disabled) return "#e2e8f0";
      if (props.isEmpty) return "#4B5563";
      return "#1d4ed8";
    }};
  }
`;

const PresetContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const PresetTitle = styled.div`
  font-weight: 600;
  font-size: 18px;
  margin-bottom: 4px;
  color: ${(props) => (props.disabled ? "#999" : "white")};
`;

const PresetMessage = styled.div`
  font-size: 14px;
  color: ${(props) => (props.disabled ? "#999" : "rgba(255, 255, 255, 0.8)")};
`;

const EditButton = styled.button`
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;

  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }
`;

// 프리셋 로컬 스토리지 키
const PRESETS_STORAGE_KEY = "callPresets";

// 초기 프리셋 데이터 (기본값)
const defaultPresets = [
  {
    receiver: "원무과장실 PC",
    message: "원무과장실 PC 호출",
  },
  { receiver: "X-RAY실", message: "X-RAY실 호출" },
  { receiver: "C-ARM실", message: "C-ARM실 호출" },
  { receiver: "원장실", message: "원장실 호출" },
  { receiver: "", message: "" },
  { receiver: "", message: "" },
  { receiver: "", message: "" },
];

// 로컬 스토리지에서 프리셋 데이터 로드
const getStoredPresets = () => {
  try {
    const storedPresets = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (storedPresets) {
      return JSON.parse(storedPresets);
    }
  } catch (e) {
    console.error("로컬 스토리지에서 프리셋 데이터 로드 실패:", e);
  }
  return defaultPresets;
};

// 로컬 스토리지에 프리셋 데이터 저장
const savePresetsToStorage = (presets) => {
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch (e) {
    console.error("로컬 스토리지에 프리셋 데이터 저장 실패:", e);
  }
};

export default function CallModal({ isVisible, setIsVisible }) {
  const { userLevelData } = useUserLevel();
  const [receiverId, setReceiverId] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState("preset");
  const [editingPreset, setEditingPreset] = useState(null);
  const [editPresetName, setEditPresetName] = useState("");
  const [editPresetMessage, setEditPresetMessage] = useState("");
  const [editPresetReceiver, setEditPresetReceiver] = useState("");
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [currentPresetIndex, setCurrentPresetIndex] = useState(null);
  const [currentPreset, setCurrentPreset] = useState("");
  const [presets, setPresets] = useState(getStoredPresets());

  // useToast 훅 사용
  const { showToast } = useToast();

  // 설정되지 않은 프리셋 확인
  const isEmptyPreset = (preset) => {
    return !preset.receiver;
  };

  // 프리셋이 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    savePresetsToStorage(presets);
  }, [presets]);

  // 프리셋 설정 모달 열기
  const openPresetModal = (preset, index) => {
    setCurrentPresetIndex(index);
    // 빈 프리셋인 경우 인덱스 기반 이름 생성
    const presetNumber = index - 3 > 0 ? index - 3 : index + 1;
    setCurrentPreset(preset.receiver || `빈 프리셋 ${presetNumber}`);
    setEditPresetMessage(preset.message || "");
    setEditPresetReceiver(preset.receiver || "");
    setShowPresetModal(true);
  };

  // 프리셋 설정 모달 닫기
  const closePresetModal = () => {
    setShowPresetModal(false);
    setCurrentPresetIndex(null);
    setCurrentPreset("");
    setEditPresetMessage("");
    setEditPresetReceiver("");
  };

  // 프리셋 저장
  const savePresetName = () => {
    if (!editPresetReceiver) {
      showToast("수신 부서를 선택해주세요.", "error");
      return;
    }

    // 프리셋 배열 복사 후 현재 프리셋 업데이트
    const updatedPresets = [...presets];
    updatedPresets[currentPresetIndex] = {
      receiver: editPresetReceiver,
      message: editPresetMessage || `${editPresetReceiver} 호출`,
    };

    // 상태 업데이트
    setPresets(updatedPresets);

    // 로그 출력 (실제 구현에서는 제거할 수 있음)
    console.log(
      `프리셋 ${currentPresetIndex}를 다음과 같이 설정했습니다:
      수신: ${editPresetReceiver}
      메시지: ${editPresetMessage || `${editPresetReceiver} 호출`}`
    );

    showToast(`프리셋이 저장되었습니다.`, "success");
    closePresetModal();
  };

  // 호출 메시지 전송 함수
  const sendCallMessage = async () => {
    console.log("호출 시작:", {
      receiverId,
      senderId: userLevelData.location,
      message: message || `${receiverId} 호출`,
    });

    if (!receiverId) {
      console.log("receiverId가 없음:", receiverId);
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

  // 프리셋 버튼 클릭 핸들러
  const handlePresetClick = (preset, index) => {
    if (preset.receiver === userLevelData.location) return; // 현재 위치와 같으면 아무것도 하지 않음
    if (!preset.receiver) {
      // 설정되지 않은 프리셋인 경우 설정 모달 열기
      openPresetModal(preset, index);
      return;
    }

    console.log("프리셋 클릭 - 호출 준비:", {
      preset,
      receiver: preset.receiver,
    });

    // 리액트 상태 업데이트가 비동기적이므로 함수 내에서 직접 값을 전달
    const targetReceiver = preset.receiver;
    const targetMessage = preset.message || `${preset.receiver} 호출`;

    // 상태 업데이트
    setReceiverId(targetReceiver);
    setMessage(targetMessage);

    // 직접 호출 함수를 정의해서 호출
    const directCallMessage = async () => {
      console.log("직접 호출 시작:", {
        receiverId: targetReceiver,
        senderId: userLevelData.location,
        message: targetMessage,
      });

      if (!targetReceiver) {
        console.log("targetReceiver가 없음:", targetReceiver);
        showToast("수신 부서를 선택해주세요.", "error");
        return;
      }

      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const formattedTime = `${hours}:${minutes}`;

      try {
        const callData = {
          message: targetMessage,
          receiverId: targetReceiver,
          senderId: userLevelData.location,
          formattedTime,
          createdAt: Date.now(),
          createdAt2: serverTimestamp(),
          [targetReceiver]: true,
          [userLevelData.location]: true,
        };

        console.log("저장할 데이터:", callData);

        const docRef = await addDoc(collection(db, "calls"), callData);
        console.log("호출 메시지 저장 성공:", docRef.id);

        setIsVisible(false);
        setMessage("");
        setReceiverId("");
        showToast(`${targetReceiver} 호출하였습니다.`, "success");
      } catch (error) {
        console.error("호출 에러 상세 정보:", error);
        showToast("호출 전송에 실패했습니다.", "error");
      }
    };

    // 바로 호출 메시지를 보냄 (상태 업데이트 기다리지 않고)
    directCallMessage();
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
          <div className="flex flex-row items-center">
            {/* 모드 전환 토글 - 호출 글자 바로 옆으로 이동 */}
            <span className="text-[34px] font-bold">호출</span>
            <ToggleContainer>
              <ToggleSlider position={mode === "preset" ? "left" : "right"} />
              <ToggleOption
                active={mode === "preset"}
                onClick={() => setMode("preset")}
              >
                <ToggleIcon>⚡</ToggleIcon>
                프리셋 모드
              </ToggleOption>
              <ToggleOption
                active={mode === "normal"}
                onClick={() => setMode("normal")}
              >
                <ToggleIcon>📝</ToggleIcon>
                일반 모드
              </ToggleOption>
            </ToggleContainer>
          </div>
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

        {mode === "preset" ? (
          // 프리셋 모드 UI
          <>
            <div className="w-full mt-6 mb-4">
              <div className="bg-yellow-100 border-l-4 border-yellow-500 mb-5 p-4 rounded-md shadow-sm ">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">🔔</span>
                  <p className="text-[16px] font-bold text-yellow-700">
                    버튼을 클릭하면{" "}
                    <span className="text-red-600">즉시 호출</span>됩니다!
                  </p>
                </div>
              </div>
              <PresetContainer>
                {presets.map((preset, index) => (
                  <PresetButton
                    key={index}
                    onClick={() => handlePresetClick(preset, index)}
                    disabled={preset.receiver === userLevelData.location}
                    isEmpty={isEmptyPreset(preset)}
                  >
                    <PresetContent>
                      <PresetTitle>
                        {isEmptyPreset(preset)
                          ? `빈 프리셋 ${index - 3 > 0 ? index - 3 : index + 1}`
                          : preset.receiver}
                      </PresetTitle>
                      <PresetMessage>
                        {isEmptyPreset(preset)
                          ? "설정되지 않은 프리셋입니다"
                          : `메시지: "${
                              preset.message || `${preset.receiver} 호출`
                            }"`}
                      </PresetMessage>
                    </PresetContent>
                    <EditButton
                      onClick={(e) => {
                        e.stopPropagation();
                        openPresetModal(preset, index);
                      }}
                    >
                      <IoSettingsSharp size={20} />
                    </EditButton>
                  </PresetButton>
                ))}
              </PresetContainer>
            </div>
          </>
        ) : (
          // 일반 모드 UI
          <>
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
            <ContentZone className="flex flex-col w-full px-[20px] mb-[20px] h-full">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="단순 호출 시에는 내용을 작성하지 않으시고 비워 두시는 것이 권장됩니다."
                className="border border-gray-400 rounded-md h-full p-4 w-full bg-textBackground"
              />
            </ContentZone>
            <ButtonZone className="flex flex-row w-full justify-center px-[20px]">
              <div className="flex flex-row gap-x-[20px] w-full">
                <OnceOnOffButton
                  text={"호출하기"}
                  onClick={sendCallMessage}
                  on={receiverId !== ""}
                  toastMessage="수신 위치를 선택해주세요"
                />
              </div>
            </ButtonZone>
          </>
        )}
      </div>

      {/* 프리셋 설정 모달 */}
      {showPresetModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-[400px] shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {presets[currentPresetIndex].receiver ||
                  `빈 프리셋 ${
                    currentPresetIndex - 3 > 0
                      ? currentPresetIndex - 3
                      : currentPresetIndex + 1
                  }`}{" "}
                설정
              </h3>
              <button
                onClick={closePresetModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수신 부서
                </label>
                <WhereSelector
                  value={editPresetReceiver}
                  onChange={setEditPresetReceiver}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  호출 메시지 (선택사항)
                </label>
                <input
                  type="text"
                  value={editPresetMessage}
                  onChange={(e) => setEditPresetMessage(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="기본적으로 '부서명 호출'로 전송됩니다"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  onClick={closePresetModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none"
                >
                  취소
                </button>
                <button
                  onClick={savePresetName}
                  className="px-4 py-2 bg-[#002D5D] text-white rounded-md hover:bg-blue-700 focus:outline-none"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalTemplate>
  );
}
