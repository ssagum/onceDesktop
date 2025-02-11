import React, { useState } from "react";
import styled from "styled-components";
import ModalTemplate from "./ModalTemplate";
import HospitalStaffSelector from "./HospitalStaffSelector";

const ManagingZone = styled.button``;

export default function WhoSelector({ who }) {
  const [whoModalOpen, setWhoModalOpen] = useState(false);

  return (
    <ManagingZone
      className={`w-[130px] h-[40px] bg-white flex justify-center items-center border border-onceGray rounded-md`}
      onClick={() => setWhoModalOpen(true)}
    >
      <span className="text-onceGray">{who} ▼</span>
      <ModalTemplate isVisible={whoModalOpen} setIsVisible={setWhoModalOpen}>
        <HospitalStaffSelector />
      </ModalTemplate>
    </ManagingZone>
  );
}
