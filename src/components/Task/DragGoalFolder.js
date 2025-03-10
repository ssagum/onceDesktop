import React from "react";
import styled from "styled-components";
import { useDroppable } from "@dnd-kit/core";

// ★ 폴더 컨테이너: 폴더 느낌의 디자인과 드래그 시 애니메이션 효과 적용 ★
const FolderContainer = styled.div`
  width: 240px;
  transition: transform 0.3s ease, background 0.3s ease, border-color 0.3s ease,
    box-shadow 0.3s ease;
  transform: ${(props) => (props.isOver ? "scale(1.10)" : "scale(1)")};
  cursor: pointer;
`;

export default function DragGoalFolder({ column, tasks, onClick, isSelected }) {
  // useDroppable 훅을 사용해 드래그 오버 상태를 감지합니다.
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "container", containerId: column.id },
  });

  // 클릭 핸들러
  const handleClick = () => {
    if (onClick) {
      onClick(column.id);
    }
  };

  return (
    <FolderContainer ref={setNodeRef} isOver={isOver} onClick={handleClick}>
      {/* 폴더 하단: 배경색이 기본적으로 bg-onceHover 클래스 적용 */}
      <div className="relative inline-block">
        <svg
          className="w-[198px] h-[33px]"
          viewBox="0 0 198 33"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon
            points="0,0 154,0 198,33 0,33"
            className={`fill-white stroke-onceHover stroke-[8] ${
              isOver ? "fill-blue-50" : ""
            } ${isSelected ? "fill-blue-50" : ""}`}
          />
          <foreignObject x="0" y="0" width="143" height="33">
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              className={`flex items-center justify-center w-full h-full text-black border-l-[8px] border-onceHover ${
                isSelected ? "font-bold" : ""
              }`}
            >
              {column.title}
              {isSelected && (
                <svg
                  className="ml-2 w-5 h-5 text-blue-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </foreignObject>
        </svg>
        <div
          className={`w-[240px] h-[50px] bg-onceHover flex flex-wrap gap-2 justify-center items-center ${
            isSelected ? "bg-blue-100" : ""
          }`}
        >
          {column.taskIds.map((taskId, index) => (
            <div
              key={taskId}
              className={`w-10 h-10 rounded-full ${
                isSelected ? "bg-blue-200" : "bg-gray-200"
              } flex items-center justify-center`}
            >
              {`+${index + 1}`}
            </div>
          ))}
        </div>
      </div>
    </FolderContainer>
  );
}
