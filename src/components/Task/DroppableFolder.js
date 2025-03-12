import React, { useState, useEffect } from "react";
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

// 단일 드롭 가능한 폴더 컴포넌트
function DroppableFolder({ id, column, isSelected, onClick, children }) {
  const [clickStartTime, setClickStartTime] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isLongPressDetected, setIsLongPressDetected] = useState(false);

  // useDroppable 훅 사용 - 컴포넌트별 고유 ID 사용
  const { setNodeRef, isOver, active } = useDroppable({
    id: id,
    data: {
      type: "container",
      containerId: id,
      folderType: "DroppableFolder",
      isRealFolder: true,
      assignee: column.title,
    },
  });

  // 드래그 시작/종료 시 상태 업데이트
  useEffect(() => {
    if (!active && isLongPressDetected) {
      setIsLongPressDetected(false);
    }
  }, [active, isLongPressDetected]);

  // 마우스/터치 다운 핸들러
  const handleMouseDown = () => {
    setClickStartTime(Date.now());

    const timer = setTimeout(() => {
      setIsLongPressDetected(true);
      console.log(`롱 프레스 감지: ${id}`);
    }, 300);

    setLongPressTimer(timer);
  };

  // 마우스/터치 업 핸들러
  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    const clickDuration = Date.now() - clickStartTime;

    // 짧은 클릭이고 드래그 중이 아니면 클릭 이벤트 처리
    if (clickDuration < 300 && !isLongPressDetected && !active) {
      if (onClick) {
        console.log(`🖱️ 폴더 클릭: ${id}`);
        onClick(id);
      }
    }

    setClickStartTime(null);
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  // children이 함수인 경우 isOver와 active 상태를 전달
  const renderChildren = () => {
    if (typeof children === "function") {
      return children({ isOver, active });
    }

    // React.Children.map을 사용하여 isOver 속성을 모든 자식에게 전달
    if (React.Children.count(children) > 0) {
      return React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { isOver });
        }
        return child;
      });
    }

    // 자식이 없는 경우 기본 내용 반환
    return <div className="text-center py-2">{column.title || id}</div>;
  };

  return (
    <FolderContainer
      ref={setNodeRef}
      $isOver={isOver}
      $isSelected={isSelected}
      data-is-over={isOver ? "true" : "false"}
      data-is-selected={isSelected ? "true" : "false"}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
    >
      <div
        className="relative inline-block w-full h-full"
        data-droppable="true"
        data-container-id={column.id}
        data-folder-type="DroppableFolder"
      >
        {renderChildren()}
      </div>
    </FolderContainer>
  );
}

export default DroppableFolder;
