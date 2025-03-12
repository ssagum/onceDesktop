import React from "react";
import styled from "styled-components";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// 태스크 컨테이너 스타일
const TaskContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: grab;
  border-left: 4px solid
    ${({ priority }) => {
      switch (priority) {
        case "높음":
          return "#ff6b6b";
        case "중간":
          return "#ffd43b";
        case "낮음":
          return "#51cf66";
        default:
          return "#adb5bd";
      }
    }};
  position: relative;

  &:hover {
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  }

  /* 드래그 중일 때 스타일 */
  opacity: ${({ isDragging }) => (isDragging ? 0.5 : 1)};
`;

const TaskTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: #222;
`;

const TaskContent = styled.p`
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 8px;
`;

const TaskMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #888;
  flex-wrap: wrap;
  gap: 4px;
`;

const StatusBadge = styled.span`
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
  background-color: ${({ status }) => {
    switch (status) {
      case "todo":
        return "#e9ecef";
      case "in-progress":
        return "#e3fafc";
      case "completed":
        return "#ebfbee";
      default:
        return "#f8f9fa";
    }
  }};
  color: ${({ status }) => {
    switch (status) {
      case "todo":
        return "#495057";
      case "in-progress":
        return "#0c8599";
      case "completed":
        return "#2b8a3e";
      default:
        return "#495057";
    }
  }};
`;

const PriorityBadge = styled.span`
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
`;

const DepartmentBadge = styled.span`
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
  background-color: #e7f5ff;
  color: #1971c2;
  display: flex;
  align-items: center;
  gap: 2px;
`;

// 부서별 아이콘 표시를 위한 함수
const getDepartmentIcon = (departmentId) => {
  switch (departmentId) {
    case "dept-1":
      return "💻";
    case "dept-2":
      return "🎨";
    case "dept-3":
      return "📊";
    case "dept-4":
      return "👥";
    case "dept-5":
      return "💼";
    default:
      return "📁";
  }
};

// 부서 ID를 부서명으로 변환하는 함수
const getDepartmentName = (departmentId) => {
  switch (departmentId) {
    case "dept-1":
      return "개발팀";
    case "dept-2":
      return "디자인팀";
    case "dept-3":
      return "마케팅팀";
    case "dept-4":
      return "인사팀";
    case "dept-5":
      return "영업팀";
    default:
      return "미지정";
  }
};

const TaskItem = ({ task }) => {
  // dnd-kit의 useSortable 훅을 사용하여 드래그 기능 구현
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  // dnd-kit의 CSS 헬퍼를 사용하여 변환 효과 적용
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // 상태에 따른 텍스트 매핑
  const statusText = {
    todo: "예정",
    "in-progress": "진행 중",
    completed: "완료",
  };

  return (
    <TaskContainer
      ref={setNodeRef}
      style={style}
      priority={task.priority}
      isDragging={isDragging}
      {...attributes}
      {...listeners}
    >
      <TaskTitle>{task.title}</TaskTitle>
      <TaskContent>{task.content}</TaskContent>
      <TaskMeta>
        <StatusBadge status={task.status}>
          {statusText[task.status]}
        </StatusBadge>
        <PriorityBadge>우선순위: {task.priority}</PriorityBadge>
        <DepartmentBadge>
          {getDepartmentIcon(task.department)}{" "}
          {getDepartmentName(task.department)}
        </DepartmentBadge>
      </TaskMeta>
    </TaskContainer>
  );
};

export default TaskItem;
