import React, { useState, useEffect } from "react";
import styled from "styled-components";
import WhoSelector from "./WhoSelector";
import ModalTemplate from "./ModalTemplate";
import HospitalStaffSelector from "./HospitalStaffSelector";
import NameCoin from "./NameCoin";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "../../contexts/ToastContext";

const CompletedIndicator = styled.div`
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 10px;
`;

export default function TaskCompleterSelector({
  selectedPeople = [],
  onPeopleChange,
  isCurrentDate = false,
  isCompleted = false,
}) {
  const [staffSelectionModalOpen, setStaffSelectionModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [tempSelectedStaff, setTempSelectedStaff] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const { showToast } = useToast();

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
            data.push({
              id: staffId,
              name: userData.name || "이름 없음",
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
    }
    setConfirmModalOpen(false);
  };

  // 취소 버튼 클릭 핸들러
  const handleCancel = () => {
    setTempSelectedStaff([]);
    setConfirmModalOpen(false);
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

    if (isCompleted) {
      showToast("이미 완료된 업무입니다. 변경할 수 없습니다.", "warning");
      return;
    }

    setStaffSelectionModalOpen(true);
  };

  // 이미 완료되었거나 현재 날짜가 아닌 경우 읽기 전용 표시
  if (isCompleted || !isCurrentDate) {
    return (
      <CompletedIndicator
        className="cursor-pointer"
        onClick={handleSelectorClick}
      >
        {selectedPeople.length === 0 ? (
          <span className="text-onceGray">미완료</span>
        ) : (
          <div className="flex items-center gap-2">
            {staffData.length > 0 ? (
              staffData.length <= 2 ? (
                staffData.map((staff) => (
                  <NameCoin key={staff.id} item={staff} />
                ))
              ) : (
                <>
                  <NameCoin item={staffData[0]} />
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
