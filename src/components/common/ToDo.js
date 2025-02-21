import React, { useState } from "react";
import styled from "styled-components";
import NameCoin from "./NameCoin";
import ModalTemplate from "./ModalTemplate";
import HospitalStaffSelector from "./HospitalStaffSelector";
import WhoSelector from "./WhoSelector";
import TaskAddModal from "../Task/TaskAddModal";

const ColorZone = styled.div``;
const TextZone = styled.div``;
const ManagingZone = styled.div``;

// 중요도에 따른 색상 매핑
const priorityColors = {
  상: "bg-red-400",
  중: "bg-yellow-400",
  하: "bg-green-400",
};

export default function ToDo({ task }) {
  const [whoModalOpen, setWhoModalOpen] = useState(false);
  const [taskDetailModalOpen, setTaskDetailModalOpen] = useState(false);

  const { title, priority, completedBy, id } = task;

  return (
    <>
      <div
        className="h-[56px] flex flex-row w-full items-center bg-onceBackground mb-[4px] pr-[10px] cursor-pointer"
        onClick={() => setTaskDetailModalOpen(true)}
      >
        <ColorZone className={`w-[20px] h-full ${priorityColors[priority]}`} />
        <TextZone className="flex-1 px-[20px]">
          <span>{title}</span>
        </TextZone>
        <div onClick={(e) => e.stopPropagation()}>
          <WhoSelector
            who={completedBy || "완료자"}
            onClick={() => setWhoModalOpen(true)}
          />
        </div>
      </div>

      <ModalTemplate isVisible={whoModalOpen} setIsVisible={setWhoModalOpen}>
        <HospitalStaffSelector
          onSelect={(staff) => {
            // TODO: Firestore 업데이트 로직
            setWhoModalOpen(false);
          }}
        />
      </ModalTemplate>

      <TaskAddModal
        isVisible={taskDetailModalOpen}
        setIsVisible={setTaskDetailModalOpen}
        task={task}
      />
    </>
  );
}
