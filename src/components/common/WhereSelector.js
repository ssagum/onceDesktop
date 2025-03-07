import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import PlaceSelector from "./PlaceSelector";

const DropdownContainer = styled.div`
  position: relative;
`;

const DropdownButton = styled.button`
  opacity: ${(props) => (props.disabled ? 1 : 1)};
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};

  &.selected {
    ${(props) =>
      props.disabled
        ? `
      border-color: #059669 !important;
      color: #059669 !important;
      background-color: #ecfdf5 !important;
      `
        : `
      border-color: #4f46e5 !important;
      color: #4f46e5 !important;
      background-color: #eef2ff !important;
      `}
  }

  &:hover {
    ${(props) =>
      !props.disabled &&
      `
      background-color: #f8fafc;
      border-color: #94a3b8;
    `}
  }
`;

const DropdownContent = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 50;
  margin-top: 4px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

export default function WhereSelector({
  disabled = false,
  defaultValue = null,
  value,
  onChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (place) => {
    onChange?.(place);
    setIsOpen(false);
  };

  const handleClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const displayValue = value || defaultValue || "수신위치 선택";

  return (
    <DropdownContainer ref={dropdownRef}>
      <DropdownButton
        disabled={disabled}
        className={`w-[120px] h-[32px] text-[12px] bg-white flex justify-center items-center border border-onceGray rounded-md transition-all duration-200 ${
          displayValue !== "수신위치 선택" ? "selected" : ""
        }`}
        onClick={handleClick}>
        <span className="text-inherit">
          {displayValue} {!disabled && "▼"}
        </span>
      </DropdownButton>
      {isOpen && !disabled && (
        <DropdownContent>
          <PlaceSelector
            onSelect={handleSelect}
            onClose={() => setIsOpen(false)}
            selectedPlace={displayValue}
          />
        </DropdownContent>
      )}
    </DropdownContainer>
  );
}
