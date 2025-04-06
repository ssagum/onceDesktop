import React, { useState, useEffect } from "react";
import styled from "styled-components";
import ModalTemplate from "./ModalTemplate";
import HospitalStaffSelector from "./HospitalStaffSelector";
import NameCoin from "./NameCoin";
import { db } from "../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const SelectorButton = styled.div`
  height: 40px;
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 0 10px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
`;

export default function WhoSelector({
  who,
  selectedPeople = [],
  onPeopleChange,
  onClick,
  singleSelectMode = false,
  disabled = false,
}) {
  const [whoModalOpen, setWhoModalOpen] = useState(false);
  const [hospitalStaff, setHospitalStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Firebase에서 사용자 데이터 가져오기
  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        setIsLoading(true);
        const usersQuery = query(collection(db, "users"));
        const querySnapshot = await getDocs(usersQuery);

        const staffData = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();

          // 퇴직자가 아닌 경우만 추가
          if (!userData.status || userData.status !== "퇴직") {
            staffData.push({
              id: doc.id,
              name: userData.name || "",
              department: userData.department || "",
              role: userData.role || "",
            });
          }
        });

        setHospitalStaff(staffData);
      } catch (error) {
        console.error("직원 데이터를 가져오는 중 오류 발생:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaffData();
  }, []);

  const selectedStaff = hospitalStaff.filter((staff) =>
    selectedPeople.includes(staff.id)
  );

  const handleClick = (e) => {
    if (disabled) return;

    if (onClick) {
      onClick(e);
    }
    setWhoModalOpen(true);
  };

  const handleStaffSelect = (selectedStaffIds) => {
    if (disabled) return;

    if (onPeopleChange) {
      // 중복 제거
      const uniqueStaffIds = [...new Set(selectedStaffIds)];

      onPeopleChange(uniqueStaffIds);
      // 모달 닫기
      setWhoModalOpen(false);
    }
  };

  const handleSingleStaffSelect = (staff) => {
    const staffId = staff.id || staff;

    if (onPeopleChange) {
      onPeopleChange([staffId]); // 배열로 전달하여 일관성 유지
    }

    setWhoModalOpen(false);
  };

  const renderSelectedStaff = () => {
    if (isLoading) {
      return <span className="text-onceGray">로딩 중...</span>;
    }

    if (selectedStaff.length === 0) {
      return <span className="text-onceGray">{who} ▼</span>;
    }

    if (selectedStaff.length <= 2) {
      return (
        <div className="flex items-center gap-2">
          {selectedStaff.map((staff) => (
            <NameCoin key={staff.id} item={staff} />
          ))}
          <span className="text-onceGray">▼</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <NameCoin item={selectedStaff[0]} />
        <NameCoin extraCount={selectedStaff.length - 1} />
        <span className="text-onceGray">▼</span>
      </div>
    );
  };

  return (
    <SelectorButton
      onClick={handleClick}
      className="h-[40px] bg-white flex justify-center items-center border border-gray-300 rounded-md px-4 w-full"
      disabled={disabled}
    >
      {renderSelectedStaff()}
      <ModalTemplate isVisible={whoModalOpen} setIsVisible={setWhoModalOpen}>
        <div className="p-4">
          <HospitalStaffSelector
            selectedStaff={selectedPeople}
            setSelectedStaff={handleStaffSelect}
            onConfirm={() => setWhoModalOpen(false)}
            onSelect={singleSelectMode ? handleSingleStaffSelect : undefined}
          />
        </div>
      </ModalTemplate>
    </SelectorButton>
  );
}
