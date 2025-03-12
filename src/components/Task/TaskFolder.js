import React from "react";
import styled from "styled-components";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import TaskItem from "./TaskItem";

const FolderContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  min-width: 300px;
  height: 100%;
  flex: 1;
`;

const FolderHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const FolderTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
`;

const TaskCount = styled.span`
  background-color: #e0e0e0;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  color: #555;
`;

const TasksContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  overflow-y: auto;
  min-height: 100px;

  /* 드롭 영역 하이라이트 효과 */
  ${(props) =>
    props.isOver &&
    `
    background-color: rgba(0, 0, 255, 0.05);
    border: 2px dashed #0066ff;
    border-radius: 4px;
  `}
`;

const TaskFolder = ({ id, title, tasks }) => {
  // useDroppable 훅을 사용하여 드롭 가능한 영역 생성
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "folder" },
  });

  // 폴더 내 태스크 아이디 목록
  const taskIds = tasks.map((task) => task.id);

  return (
    <FolderContainer>
      <FolderHeader>
        <FolderTitle>{title}</FolderTitle>
        <TaskCount>{tasks.length}</TaskCount>
      </FolderHeader>

      <TasksContainer ref={setNodeRef} isOver={isOver}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </SortableContext>
      </TasksContainer>
    </FolderContainer>
  );
};

export default TaskFolder;
