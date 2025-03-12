import React from "react";
import styled from "styled-components";
import { useDroppable } from "@dnd-kit/core";

const FolderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: ${(props) => (props.isSelected ? "#e7f5ff" : "#f8f9fa")};
  border: 1px solid ${(props) => (props.isSelected ? "#339af0" : "#dee2e6")};
  border-radius: 8px;
  padding: 16px;
  min-width: 120px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${(props) => (props.isSelected ? "#e7f5ff" : "#f1f3f5")};
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }

  /* 드롭 영역 하이라이트 효과 */
  ${(props) =>
    props.isOver &&
    `
    background-color: rgba(51, 154, 240, 0.1);
    border: 2px dashed #339af0;
    box-shadow: 0 0 10px rgba(51, 154, 240, 0.3);
  `}
`;

const FolderIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: ${(props) => (props.isSelected ? "#339af0" : "#e9ecef")};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  color: ${(props) => (props.isSelected ? "white" : "#495057")};
  font-size: 20px;
  transition: all 0.2s ease;
`;

const FolderName = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  text-align: center;
`;

const TaskCount = styled.span`
  background-color: ${(props) => (props.isSelected ? "#339af0" : "#e9ecef")};
  color: ${(props) => (props.isSelected ? "white" : "#495057")};
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  transition: all 0.2s ease;
`;

// 부서별 아이콘 표시를 위한 함수
const getDepartmentIcon = (departmentName) => {
  switch (departmentName) {
    case "개발팀":
      return "💻";
    case "디자인팀":
      return "🎨";
    case "마케팅팀":
      return "📊";
    case "인사팀":
      return "👥";
    case "영업팀":
      return "💼";
    default:
      return "📁";
  }
};

const DepartmentFolder = ({ department, taskCount, isSelected, onSelect }) => {
  // useDroppable 훅을 사용하여 드롭 가능한 영역 생성
  const { setNodeRef, isOver } = useDroppable({
    id: department.id,
    data: {
      type: "department",
      department,
    },
  });

  return (
    <FolderContainer
      ref={setNodeRef}
      isSelected={isSelected}
      isOver={isOver}
      onClick={() => onSelect(department)}
    >
      <FolderIcon isSelected={isSelected}>
        {getDepartmentIcon(department.name)}
      </FolderIcon>
      <FolderName>{department.name}</FolderName>
      <TaskCount isSelected={isSelected}>{taskCount}개 할 일</TaskCount>

      {/* 드롭 안내 메시지 */}
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-blue-50 bg-opacity-70">
          <p className="text-sm font-medium text-blue-600">이곳에 놓기</p>
        </div>
      )}
    </FolderContainer>
  );
};

export default DepartmentFolder;
