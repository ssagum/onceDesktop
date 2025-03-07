import React, { useState } from "react";
import styled from "styled-components";
import ModalTemplate from "./ModalTemplate";
import HospitalStaffSelector from "./HospitalStaffSelector";
import NameCoin from "./NameCoin";
import hospitalStaff from "../../datas/users";

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
      console.log("WhoSelector: 중복된 직원 ID가 제거됨", {
        before: selectedStaffIds,
        after: uniqueStaffIds,
      });

      onPeopleChange(uniqueStaffIds);
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
      className="h-[40px] bg-white flex justify-center items-center border border-gray-300 rounded-md px-4 w-[120px]"
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
