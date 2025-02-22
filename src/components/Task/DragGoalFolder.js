import React from "react";
import styled from "styled-components";
import { useDroppable } from "@dnd-kit/core";

// ★ 폴더 컨테이너: 폴더 느낌의 디자인과 드래그 시 애니메이션 효과 적용 ★
const FolderContainer = styled.div`
  width: 240px;
  transition: transform 0.3s ease, background 0.3s ease, border-color 0.3s ease,
    box-shadow 0.3s ease;
  transform: ${(props) => (props.isOver ? "scale(1.10)" : "scale(1)")};
`;

export default function DragGoalFolder({ column, tasks }) {
  // useDroppable 훅을 사용해 드래그 오버 상태를 감지합니다.
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "container", containerId: column.id },
  });

  return (
    <FolderContainer ref={setNodeRef} isOver={isOver}>
      {/* 폴더 하단: 배경색이 기본적으로 bg-onceHover 클래스 적용 */}
      <div className="relative inline-block">
        <svg
          className="w-[170px] h-[30px]"
          viewBox="0 0 170 30"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon
            points="0,0 120,0 170,40 0,30"
            className="fill-white stroke-onceHover stroke-[6]"
          />
          <foreignObject x="0" y="0" width="110" height="30">
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              className="flex items-center justify-center w-full h-full text-black border-l-[6px] border-onceHover"
            >
              {column.title}
            </div>
          </foreignObject>
        </svg>
        <div className="w-[240px] h-[50px] bg-onceHover flex flex-wrap gap-2 justify-center items-center">
          {column.taskIds.map((taskId, index) => (
            <div
              key={taskId}
              className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"
            >
              {`+${index + 1}`}
            </div>
          ))}
        </div>
      </div>
    </FolderContainer>
  );
}
