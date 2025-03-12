import React from "react";
import DroppableFolder from "./DroppableFolder";

// 폴더 내부의 UI만 담당하는 컴포넌트
const FolderContent = ({ column, isSelected, isOver }) => {
  return (
    <>
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
    </>
  );
};

// 메인 컴포넌트 - dnd-kit 문서의 패턴을 따르는 방식으로 구현
export default function DragGoalFolder2({
  column,
  tasks,
  onClick,
  isSelected,
}) {
  // 함수형 렌더링 패턴 사용
  return (
    <DroppableFolder
      id={column.id}
      column={column}
      isSelected={isSelected}
      onClick={onClick}
    >
      {({ isOver }) => (
        <FolderContent
          column={column}
          isSelected={isSelected}
          isOver={isOver}
        />
      )}
    </DroppableFolder>
  );
}
