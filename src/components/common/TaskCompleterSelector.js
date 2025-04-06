import React, { useState, useEffect } from "react";
import styled from "styled-components";
import WhoSelector from "./WhoSelector";
import ModalTemplate from "./ModalTemplate";
import HospitalStaffSelector from "./HospitalStaffSelector";
import NameCoin from "./NameCoin";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "../../contexts/ToastContext";
import { format, isPast, isToday } from "date-fns";

const CompletedIndicator = styled.div`
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 10px;
`;

// 이름에서 언더스코어 제거하는 함수
const formatActorName = (name) => {
  if (!name || typeof name !== "string") return name;

  // 언더스코어가 있으면 앞부분만 반환
  const underscoreIndex = name.indexOf("_");
  if (underscoreIndex > 0) {
    return name.substring(0, underscoreIndex);
  }

  return name;
};

export default function TaskCompleterSelector({
  selectedPeople = [],
  onPeopleChange,
  isCurrentDate = false,
  isCompleted = false,
  taskDate,
}) {
  const [staffSelectionModalOpen, setStaffSelectionModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [tempSelectedStaff, setTempSelectedStaff] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [localIsCompleted, setLocalIsCompleted] = useState(isCompleted);
  const { showToast } = useToast();

  // isCompleted prop이 변경되면 내부 상태도 업데이트
  useEffect(() => {
    setLocalIsCompleted(isCompleted);
  }, [isCompleted]);

  // 사용자 정보 조회
  useEffect(() => {
    const fetchStaffData = async () => {
      const data = [];

      for (const staffId of selectedPeople) {
        try {
          const docRef = doc(db, "users", staffId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            const name = formatActorName(userData.name || "이름 없음");
            data.push({
              id: staffId,
              name: name,
              department: userData.department || "",
              role: userData.role || "",
            });
          }
        } catch (error) {
          console.error("사용자 정보 조회 중 오류:", error);
        }
      }

      setStaffData(data);
    };

    if (selectedPeople.length > 0) {
      fetchStaffData();
    }
  }, [selectedPeople]);

  // 사용자 선택 핸들러
  const handlePeopleChange = (selectedStaffIds) => {
    setTempSelectedStaff(selectedStaffIds);
    setStaffSelectionModalOpen(false);
    setConfirmModalOpen(true);
  };

  // 확인 버튼 클릭 핸들러
  const handleConfirm = () => {
    if (onPeopleChange && tempSelectedStaff.length > 0) {
      onPeopleChange(tempSelectedStaff);
      setLocalIsCompleted(true); // 완료 상태를 즉시 로컬에서 업데이트
    }
    setConfirmModalOpen(false);
  };

  // 취소 버튼 클릭 핸들러
  const handleCancel = () => {
    setTempSelectedStaff([]);
    setConfirmModalOpen(false);
  };

  // 날짜 상태에 따른 텍스트 결정 함수
  const getStatusText = () => {
    if (selectedPeople.length > 0) return ""; // 완료자가 있으면 텍스트 없음

    // 날짜가 없으면 기본값
    if (!taskDate) return "미완료";

    const taskDateObj =
      typeof taskDate === "string"
        ? new Date(taskDate.replace(/\//g, "-"))
        : taskDate;

    // 오늘이거나 과거인 경우
    if (isToday(taskDateObj) || isPast(taskDateObj)) {
      return "미완료";
    } else {
      // 미래인 경우
      return "예정";
    }
  };

  // 완료자 클릭 핸들러
  const handleSelectorClick = () => {
    if (!isCurrentDate) {
      showToast(
        "오늘이 아닌 날짜의 업무는 완료 처리할 수 없습니다.",
        "warning"
      );
      return;
    }

    if (localIsCompleted) {
      showToast("이미 완료된 업무입니다. 변경할 수 없습니다.", "warning");
      return;
    }

    setStaffSelectionModalOpen(true);
  };

  // 이미 완료되었거나 현재 날짜가 아닌 경우 읽기 전용 표시
  if (localIsCompleted || !isCurrentDate) {
    return (
      <CompletedIndicator
        className="cursor-pointer"
        onClick={handleSelectorClick}
      >
        {selectedPeople.length === 0 ? (
          <span className="text-onceGray">{getStatusText()}</span>
        ) : (
          <div className="flex items-center gap-2">
            {staffData.length > 0 ? (
              staffData.length <= 2 ? (
                staffData.map((staff) => (
                  <NameCoin
                    key={staff.id}
                    item={{
                      id: staff.id,
                      name: staff.name, // 강제로 이름만 사용
                      department: staff.department,
                    }}
                  />
                ))
              ) : (
                <>
                  <NameCoin
                    item={{
                      id: staffData[0].id,
                      name: staffData[0].name, // 강제로 이름만 사용
                      department: staffData[0].department,
                    }}
                  />
                  <NameCoin extraCount={staffData.length - 1} />
                </>
              )
            ) : (
              <span className="text-gray-500">완료됨</span>
            )}
          </div>
        )}
      </CompletedIndicator>
    );
  }

  // 현재 날짜이고 완료되지 않은 경우에는 선택 가능
  return (
    <>
      <div
        onClick={handleSelectorClick}
        className="h-[40px] bg-white flex justify-center items-center border border-gray-300 rounded-md px-4 cursor-pointer"
      >
        <span className="text-onceGray">완료자 ▼</span>
      </div>

      {/* 직원 선택 모달 */}
      <ModalTemplate
        isVisible={staffSelectionModalOpen}
        setIsVisible={setStaffSelectionModalOpen}
      >
        <div className="p-4">
          <HospitalStaffSelector
            selectedStaff={selectedPeople}
            setSelectedStaff={handlePeopleChange}
            onConfirm={() => setStaffSelectionModalOpen(false)}
          />
        </div>
      </ModalTemplate>

      {/* 확인 모달 - 디자인 개선 */}
      <ModalTemplate
        isVisible={confirmModalOpen}
        setIsVisible={setConfirmModalOpen}
        showCancel={false}
      >
        <div className="p-6 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-center mb-6">
            <h3 className="font-bold text-xl text-gray-800">완료 확인</h3>
            <div className="w-full border-b border-gray-200 mt-2 mb-4"></div>
            <p className="text-gray-600">
              완료자를 한 번 확정하면 변경할 수 없습니다.
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <button
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              onClick={handleCancel}
            >
              취소
            </button>
            <button
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
              onClick={handleConfirm}
            >
              확인
            </button>
          </div>
        </div>
      </ModalTemplate>
    </>
  );
}
