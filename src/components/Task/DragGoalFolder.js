import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useDroppable } from "@dnd-kit/core";

// ★ 폴더 컨테이너: transient props($) 문법을 사용하여 DOM 경고 해결 ★
const FolderContainer = styled.div`
  width: 240px;
  transition: transform 0.3s ease, background 0.3s ease, border-color 0.3s ease,
    box-shadow 0.3s ease;
  transform: ${(props) =>
    props.$isOver
      ? "scale(1.10)"
      : props.$isSelected
      ? "scale(1.05)"
      : "scale(1)"};
  cursor: pointer;
  position: relative;

  /* 드래그 오버 시 테두리 효과 추가 */
  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: ${(props) =>
      props.$isOver ? "3px dashed #3B82F6" : "0px solid transparent"};
    border-radius: 4px;
    pointer-events: none;
    opacity: ${(props) => (props.$isOver ? "1" : "0")};
    transition: opacity 0.3s ease;
  }
`;

export default function DragGoalFolder({
  column,
  tasks,
  onClick,
  isSelected,
  title,
}) {
  // 드래그 중인지 여부를 추적하는 상태 추가
  const [isDragging, setIsDragging] = useState(false);

  // useDroppable 훅을 사용해 드래그 오버 상태를 감지하고, 드롭 시 assignee 정보를 포함합니다.
  const { setNodeRef, isOver, active } = useDroppable({
    id: title,
  });

  // active 상태가 변경될 때마다 isDragging 업데이트
  useEffect(() => {
    setIsDragging(!!active);
  }, [active]);

  // 클릭 핸들러 - 드래그 중이 아닐 때만 작동하도록 수정
  const handleClick = () => {
    // 드래그 중이면 클릭 이벤트 무시
    if (isDragging) {
      console.log("드래그 중이므로 클릭 무시");
      return;
    }

    if (onClick) {
      console.log("🖱️ 폴더 클릭:", column.id);
      onClick(column.id);
    }
  };

  return (
    <FolderContainer
      ref={setNodeRef}
      $isOver={isOver}
      $isSelected={isSelected}
      onClick={handleClick}
      data-is-over={isOver ? "true" : "false"}
      data-is-selected={isSelected ? "true" : "false"}
      data-is-dragging={isDragging ? "true" : "false"}
    >
      {/* 폴더 하단: 배경색이 기본적으로 bg-onceHover 클래스 적용 */}
      <div
        className="relative inline-block w-full h-full"
        data-droppable="true"
        data-container-id={column.id}
        data-folder-type="DragGoalFolder"
      >
        <svg
          className="w-[198px] h-[33px]"
          viewBox="0 0 198 33"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon
            points="0,0 154,0 198,33 0,33"
            className={`fill-white stroke-onceHover stroke-[8] ${
              isOver && !isSelected ? "fill-blue-50" : ""
            } ${isSelected ? "fill-blue-100" : ""} ${
              isOver && isSelected ? "fill-blue-200" : ""
            }`}
          />
          <foreignObject x="0" y="0" width="143" height="33">
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              className={`flex items-center justify-center w-full h-full text-black border-l-[8px] ${
                isOver && !isSelected ? "border-blue-400" : "border-onceHover"
              } ${isSelected ? "font-bold border-blue-500" : ""} ${
                isOver && isSelected ? "border-blue-600" : ""
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
            isSelected && !isOver ? "bg-blue-100" : ""
          } ${isOver && !isSelected ? "bg-blue-50" : ""} ${
            isOver && isSelected ? "bg-blue-200" : ""
          }`}
        >
          {column.taskIds?.length > 0 && (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isSelected && !isOver ? "bg-blue-200" : "bg-gray-200"
              } ${isOver && !isSelected ? "bg-blue-100" : ""} ${
                isOver && isSelected ? "bg-blue-300" : ""
              }`}
            >
              {`+${column.taskIds.length}`}
            </div>
          )}
        </div>
      </div>
    </FolderContainer>
  );
}
