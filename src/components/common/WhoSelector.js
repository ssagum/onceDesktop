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
  cursor: pointer;
`;

export default function WhoSelector({
  who,
  selectedPeople = [],
  onPeopleChange,
}) {
  const [whoModalOpen, setWhoModalOpen] = useState(false);

  const selectedStaff = hospitalStaff.filter((staff) =>
    selectedPeople.includes(staff.id)
  );

  const handleStaffSelect = (selectedStaffIds) => {
    onPeopleChange?.(selectedStaffIds);
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
      onClick={() => setWhoModalOpen(true)}
      className="h-[40px] bg-white flex justify-center items-center border border-gray-300 rounded-md px-4"
    >
      {renderSelectedStaff()}
      <ModalTemplate isVisible={whoModalOpen} setIsVisible={setWhoModalOpen}>
        <HospitalStaffSelector
          selectedStaff={selectedPeople}
          setSelectedStaff={handleStaffSelect}
          onConfirm={() => setWhoModalOpen(false)}
        />
      </ModalTemplate>
    </SelectorButton>
  );
}
