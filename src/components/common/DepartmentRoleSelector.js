import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { roleOptions } from "../../datas/users";

const DropdownContainer = styled.div`
  position: relative;
`;

const DropdownButton = styled.button`
  height: 40px;
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 0 10px;
  cursor: pointer;

  &.selected {
    border-color: #4f46e5 !important;
    color: #4f46e5 !important;
    background-color: #eef2ff !important;
    font-weight: 600;
  }

  &:hover {
    background-color: #f8fafc;
    border-color: #94a3b8;
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
  min-width: 250px;
`;

/**
 * 담당 부서/역할 선택 컴포넌트
 * @param {string} label - 라벨 텍스트
 * @param {string} value - 선택된 값 (예: "간호팀" 또는 "간호팀장")
 * @param {Function} onChange - 값 변경 시 호출될 함수
 * @param {boolean} disabled - 비활성화 여부
 * @param {boolean} onlyLeaders - true일 경우 팀장급 역할만 표시
 */
export default function DepartmentRoleSelector({
  label = "담당 부서/역할",
  value = "",
  onChange,
  disabled = false,
  onlyLeaders = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 선택된 값을 표시
  const getDisplayText = () => {
    if (!value) return label;
    return value;
  };

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

  const handleClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (selection) => {
    onChange?.(selection);
    setIsOpen(false);
  };

  return (
    <DropdownContainer ref={dropdownRef}>
      <DropdownButton
        disabled={disabled}
        className={`w-[200px] ${value ? "selected" : ""}`}
        onClick={handleClick}
      >
        <span>
          {getDisplayText()} {!disabled && "▼"}
        </span>
      </DropdownButton>

      {isOpen && !disabled && (
        <DropdownContent>
          <DepartmentRoleList
            onSelect={handleSelect}
            selectedValue={value}
            onlyLeaders={onlyLeaders}
          />
        </DropdownContent>
      )}
    </DropdownContainer>
  );
}

/**
 * 부서 및 역할 목록 컴포넌트
 */
const DepartmentRoleList = ({
  onSelect,
  selectedValue,
  onlyLeaders = false,
}) => {
  // roleOptions에서 부서와 역할 목록 가져오기
  const departments = Object.keys(roleOptions);

  // 모든 부서와 역할을 분리하여 항목 목록으로 만들기
  const items = [];

  departments.forEach((department) => {
    // 팀장급만 표시해야 하는 경우 팀원 역할은 건너뜀
    if (!onlyLeaders) {
      // 1. 팀원인 경우 부서 이름으로 표시 (예: "간호팀")
      if (roleOptions[department].includes("팀원")) {
        items.push({
          value: department,
          display: department,
          group: "팀 업무",
        });
      }
    }

    // 2. 팀장인 경우 역할 직책으로 표시 (예: "간호팀장")
    roleOptions[department].forEach((role) => {
      if (role !== "팀원") {
        items.push({
          value: role,
          display: role,
          group: "팀장 업무",
        });
      }
    });
  });

  // 팀장급만 표시하는 경우 그룹화 변경
  const groupedItems = onlyLeaders
    ? { "팀장급 담당자": items }
    : {
        "팀 업무": items.filter((item) => item.group === "팀 업무"),
        "팀장 업무": items.filter((item) => item.group === "팀장 업무"),
      };

  return (
    <div className="w-full max-h-[400px] overflow-y-auto p-4">
      {Object.entries(groupedItems).map(([group, groupItems]) => (
        <div key={group} className="mb-4">
          <div className="font-bold text-gray-700 mb-2">{group}</div>
          <div className="pl-4">
            {groupItems.map((item) => (
              <div
                key={item.value}
                className={`py-2 px-4 cursor-pointer rounded-md transition-all duration-200 ${
                  selectedValue === item.value
                    ? "bg-indigo-100 text-indigo-700 font-semibold"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => onSelect(item.value)}
              >
                <span className="font-medium">{item.display}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
