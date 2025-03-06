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

/**
 * 통합 ToDo 컴포넌트
 * @param {Object} task - 업무 객체
 * @param {boolean} showCompleter - 완료자 표시/설정 UI 표시 여부 (HomeMainCanvas용)
 * @param {boolean} isDraggable - 드래그 가능 여부 (TaskMainCanvas용)
 * @param {Function} onTaskComplete - 업무 완료 핸들러
 * @param {Function} renderDragHandle - 드래그 핸들 렌더링 함수 (TaskMainCanvas에서 제공)
 */
export default function ToDo({
  task,
  tasks,
  showCompleter = false,
  isDraggable = false,
  onTaskComplete,
  renderDragHandle = null,
  onTaskClick,
}) {
  const [whoModalOpen, setWhoModalOpen] = useState(false);
  const [taskDetailModalOpen, setTaskDetailModalOpen] = useState(false);

  // tasks 배열이 전달된 경우
  if (Array.isArray(tasks)) {
    return (
      <div className="w-full">
        {tasks.length > 0 ? (
          tasks.map((taskItem) => (
            <SingleTodoItem
              key={taskItem.id}
              task={taskItem}
              showCompleter={showCompleter}
              isDraggable={isDraggable}
              onTaskComplete={onTaskComplete}
              renderDragHandle={renderDragHandle}
              onTaskClick={onTaskClick}
            />
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            표시할 업무가 없습니다.
          </div>
        )}
      </div>
    );
  }

  // 단일 task가 전달된 경우
  return (
    <SingleTodoItem
      task={task}
      showCompleter={showCompleter}
      isDraggable={isDraggable}
      onTaskComplete={onTaskComplete}
      renderDragHandle={renderDragHandle}
      onTaskClick={onTaskClick}
    />
  );
}

// 단일 ToDo 아이템 컴포넌트
function SingleTodoItem({
  task,
  showCompleter,
  isDraggable,
  onTaskComplete,
  renderDragHandle,
  onTaskClick,
}) {
  const [whoModalOpen, setWhoModalOpen] = useState(false);

  // task가 없거나 문자열인 경우
  if (!task || typeof task === "string") {
    return (
      <div className="h-[56px] flex flex-row w-full items-center bg-onceBackground mb-[4px] pr-[10px]">
        <ColorZone className="w-[20px] h-full bg-yellow-400" />
        <TextZone className="flex-1 px-[20px]">
          <span className="font-medium">{task || "제목 없음"}</span>
        </TextZone>
      </div>
    );
  }

  const {
    id,
    title,
    content,
    priority = "중",
    completed = false,
    completedBy,
  } = task;

  const handleCompleteTask = (staffId) => {
    if (onTaskComplete) {
      onTaskComplete(id, staffId);
    }
    setWhoModalOpen(false);
  };

  const handleClick = () => {
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

  return (
    <>
      <div
        className={`h-[56px] flex flex-row w-full items-center bg-onceBackground mb-[4px] pr-[10px] ${
          isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
        }`}
        onClick={isDraggable ? undefined : handleClick}
      >
        <ColorZone
          className={`w-[20px] h-full ${
            priorityColors[priority] || "bg-yellow-400"
          }`}
        />

        <TextZone className="flex-1 px-[20px] flex flex-col justify-center">
          <span
            className={`font-medium ${
              completed ? "line-through text-gray-500" : ""
            }`}
          >
            {title || content || "제목 없음"}
          </span>
        </TextZone>

        {showCompleter && (
          <div onClick={(e) => e.stopPropagation()}>
            <WhoSelector
              who={completedBy || "완료자"}
              onClick={() => setWhoModalOpen(true)}
            />
          </div>
        )}
      </div>

      {showCompleter && (
        <ModalTemplate isVisible={whoModalOpen} setIsVisible={setWhoModalOpen}>
          <HospitalStaffSelector
            onSelect={(staff) => handleCompleteTask(staff.id)}
          />
        </ModalTemplate>
      )}
    </>
  );
}
