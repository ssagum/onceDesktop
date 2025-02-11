import React, { useState } from "react";
import styled from "styled-components";
import NameCoin from "./NameCoin";
import ModalTemplate from "./ModalTemplate";
import HospitalStaffSelector from "./HospitalStaffSelector";
import WhoSelector from "./WhoSelector";

const ColorZone = styled.div``;
const TextZone = styled.div``;
const ManagingZone = styled.div``;

export default function ToDo() {
  const [whoModalOpen, setWhoModalOpen] = useState(false);

  return (
    <div className="h-[56px] flex flex-row w-full items-center bg-onceBackground mb-[4px] pr-[10px]">
      <ColorZone className={`w-[20px] h-full bg-red-400`} />
      <TextZone className={`flex-1 px-[20px]`}>
        <span>업무제목</span>
      </TextZone>
      <WhoSelector who={"완료자"} />
      <ModalTemplate isVisible={whoModalOpen} setIsVisible={setWhoModalOpen}>
        <HospitalStaffSelector />
      </ModalTemplate>
    </div>
  );
}
