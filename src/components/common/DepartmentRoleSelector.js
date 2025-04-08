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
 * @param {Array<string>} [allowedOptions] - 표시할 허용된 옵션 목록 (옵션)
 */
export default function DepartmentRoleSelector({
  label = "담당 부서/역할",
  value = "",
  onChange,
  disabled = false,
  onlyLeaders = false,
  allowedOptions,
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
            allowedOptions={allowedOptions}
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
  allowedOptions,
}) => {
  // 1. roleOptions에서 모든 가능한 역할과 팀 이름 추출
  const allPossibleOptions = [];
  Object.entries(roleOptions).forEach(([departmentKey, roles]) => {
    // --- 팀 이름 생성 로직 수정 --- 
    let teamName = null;
    if (roles.includes("팀원") && departmentKey !== "대표원장") {
        // roleOptions 키가 이미 '팀'으로 끝나는지 확인
        if (departmentKey.endsWith('팀')) {
            teamName = departmentKey; // 이미 팀 이름 형태
        } else {
            // 특정 매핑 우선 적용
            if (departmentKey === "원무") teamName = "원무팀";
            else if (departmentKey === "경영지원") teamName = "경영지원팀";
            else if (departmentKey === "진료") teamName = "진료팀"; 
            else if (departmentKey === "간호") teamName = "간호팀";
            else if (departmentKey === "물리치료") teamName = "물리치료팀";
            else if (departmentKey === "영상의학") teamName = "영상의학팀";
            else {
                 // 기본 규칙: 부서명 + 팀 (안전 장치)
                 // 위 매핑에서 대부분 처리되어야 함
                 teamName = `${departmentKey}팀`;
            }
        }
    }
    // 팀 이름 추가
    if (teamName && !allPossibleOptions.find(opt => opt.value === teamName)) {
        allPossibleOptions.push({ value: teamName, display: teamName, group: "팀 업무", isLeader: false });
    }
    // --- --- ---

    // 역할(리더) 추가 (기존 로직 유지)
    roles.forEach(role => {
      if (role !== "팀원" && !allPossibleOptions.find(opt => opt.value === role)) {
          const isLeaderRole = role.includes("팀장") || role.includes("과장") || role.includes("원장");
         allPossibleOptions.push({ value: role, display: role, group: "팀장 업무", isLeader: isLeaderRole });
      }
    });
  });
  // "미배정" 옵션 추가 (항상 리스트업 대상)
   if (!allPossibleOptions.find(opt => opt.value === "미배정")) {
       allPossibleOptions.push({ value: "미배정", display: "미배정", group: "기타", isLeader: false });
   }

  console.log("DepartmentRoleList - All Possible Options (Revised Team Name Logic):", allPossibleOptions);
  console.log("DepartmentRoleList - Allowed Options Prop:", allowedOptions);

  // 2. allowedOptions로 필터링 (allowedOptions가 없으면 모든 옵션 허용)
  let filteredItems = allPossibleOptions;
  if (allowedOptions && Array.isArray(allowedOptions)) {
      // allowedOptions에 있는 항목만 남김 ("미배정"도 allowedOptions에 있어야 함)
      // TaskAddModal에서 getAllowedTaskSelections가 "미배정"을 포함해서 반환해야 함
     filteredItems = allPossibleOptions.filter(item => allowedOptions.includes(item.value));
  }

  console.log("DepartmentRoleList - Filtered by Allowed Options:", filteredItems);

  // 3. onlyLeaders로 필터링 (기본 필터링)
  let finalFilteredItems = [...filteredItems]; // 복사본 생성
  if (onlyLeaders) {
    finalFilteredItems = finalFilteredItems.filter(item => item.isLeader);
    console.log("DepartmentRoleList - Filtered by onlyLeaders (Writer):", finalFilteredItems);
  } else {
    // --- 담당자(Assignee)일 경우 추가 로직: 허용된 리더의 팀 추가 --- 
    const leadersInList = finalFilteredItems.filter(item => item.isLeader);
    const teamsToAdd = new Set();

    console.log("DepartmentRoleList (Assignee) - Leaders found in allowed list:", leadersInList.map(l => l.value));

    // --- leaderToTeamMap 생성 로직 수정 --- 
    const leaderToTeamMap = {};
    Object.entries(roleOptions).forEach(([deptKey, roles]) => {
        // 해당 부서의 팀 이름 결정 (위와 동일한 로직 사용)
        let teamNameToMap = null;
        if (roles.includes('팀원') && deptKey !== "대표원장") {
             if (deptKey.endsWith('팀')) {
                 teamNameToMap = deptKey;
             } else {
                 if (deptKey === "원무") teamNameToMap = "원무팀";
                 else if (deptKey === "경영지원") teamNameToMap = "경영지원팀";
                 else if (deptKey === "진료") teamNameToMap = "진료팀"; 
                 else if (deptKey === "간호") teamNameToMap = "간호팀";
                 else if (deptKey === "물리치료") teamNameToMap = "물리치료팀";
                 else if (deptKey === "영상의학") teamNameToMap = "영상의학팀";
                 else teamNameToMap = `${deptKey}팀`;
             }
        }

        roles.forEach(role => {
            if (role !== '팀원' && teamNameToMap) { // 리더 역할이고 해당하는 팀 이름이 있을 때만 매핑
                leaderToTeamMap[role] = teamNameToMap;
            }
        });
    });
    // --- --- ---
    console.log("DepartmentRoleList (Assignee) - Leader to Team Map (Revised):", leaderToTeamMap);


    leadersInList.forEach(leaderItem => {
        const correspondingTeam = leaderToTeamMap[leaderItem.value];
        if (correspondingTeam) {
             console.log(`DepartmentRoleList (Assignee) - Adding team '${correspondingTeam}' for leader '${leaderItem.value}'`);
             // 해당 팀이 allPossibleOptions에 실제로 존재하는지 확인 후 추가
             const teamExists = allPossibleOptions.find(opt => opt.value === correspondingTeam);
             if(teamExists && !finalFilteredItems.some(item => item.value === correspondingTeam)) {
                teamsToAdd.add(teamExists); // 팀 객체를 추가
             }
        }
    });

    // 찾은 팀들을 최종 목록에 추가
    finalFilteredItems.push(...teamsToAdd);
    console.log("DepartmentRoleList (Assignee) - Final list after adding teams:", finalFilteredItems.map(i => i.value));
    // --- --- ---

  }

  // console.log("DepartmentRoleList - Filtered by onlyLeaders:", finalFilteredItems); // 이전 로그 위치 변경

  // 4. 그룹화 (팀장/팀/기타)
   const groupedItems = finalFilteredItems.reduce((acc, item) => {
       const groupKey = item.group; // group is "팀 업무", "팀장 업무", "기타"
       if (!acc[groupKey]) {
           acc[groupKey] = [];
       }
       acc[groupKey].push(item);
       return acc;
   }, {});

   // 그룹 순서 정의
    const groupOrder = ["팀장 업무", "팀 업무", "기타"];
    const sortedGroups = Object.entries(groupedItems).sort(([groupA], [groupB]) => {
        const indexA = groupOrder.indexOf(groupA);
        const indexB = groupOrder.indexOf(groupB);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });


  return (
    <div className="w-full max-h-[400px] overflow-y-auto p-4">
      {sortedGroups.length === 0 && (
          <div className="text-center text-gray-500 py-4">선택 가능한 항목이 없습니다.</div>
      )}
      {sortedGroups.map(([group, groupItems]) => (
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

/**
 * 리더 역할 이름으로 팀 이름을 찾는 헬퍼 함수
 * @param {string} leaderRole - 팀장, 과장 등 리더 역할 이름
 * @returns {string | null} 해당하는 팀 이름 또는 null
 */
const getTeamNameFromLeader = (leaderRole) => {
  // roleOptions 데이터를 역으로 탐색
  for (const [departmentKey, roles] of Object.entries(roleOptions)) {
    if (roles.includes(leaderRole) && leaderRole !== '팀원') {
      // 리더가 속한 부서(departmentKey)를 찾음
      // 해당 부서에 '팀원' 역할이 있는지 확인하여 팀 이름을 결정
      if (roles.includes('팀원')) {
           // 특정 팀 이름 매핑 우선 적용
           if (departmentKey === "원무") return "원무팀";
           if (departmentKey === "경영지원") return "경영지원팀";
           if (departmentKey === "진료") return "진료팀";
           if (departmentKey === "간호") return "간호팀";
           if (departmentKey === "물리치료") return "물리치료팀";
           if (departmentKey === "영상의학") return "영상의학팀";
           // 기본 규칙 (부서명 + 팀)
           return `${departmentKey}팀`;
      }
      // '팀원' 역할이 없는 부서의 리더 (예: 대표원장)는 특정 팀 없음
      return null;
    }
  }
  // 리더 역할을 roleOptions에서 찾지 못한 경우
  return null;
};

export const getAllowedTaskSelections = (userLevelData, currentUser, fieldType) => {
  // ... (기존 사용자 정보 및 헬퍼 함수 정의 부분 유지) ...

  let allowed = [];
  const finalAllowedSet = new Set(); // 최종 결과를 Set으로 관리하여 중복 방지

  if (fieldType === 'writer') {
    // --- 작성자 선택 로직 ---
    // ... (이전 로직 유지) ...
    // 결과를 Set에 추가
    allowed.forEach(opt => finalAllowedSet.add(opt));

  } else if (fieldType === 'assignee') {
    // --- 담당자 선택 로직 ---
    let initialAllowed = [];
    finalAllowedSet.add("미배정"); // 항상 미배정 포함

    if (isOwner) {
      // 대표원장: 모든 역할/팀 선택 가능
      initialAllowed = [...allOptionsFlat.filter(opt => opt !== "미배정")];
    } else if (isLeader) {
        // 팀장/과장: 자신, 자신의 팀, 미배정
        initialAllowed.push(role); // 자신
        const teamName = getTeamName(department);
        if (teamName) initialAllowed.push(teamName); // 자신의 팀

        // 원무과장 특별 케이스
        if (isAdminMgr) {
            const radiologyTeam = getTeamName("영상의학");
            const radiologyLeader = getLeaderRole("영상의학");
            if (radiologyTeam) initialAllowed.push(radiologyTeam);
            if (radiologyLeader) initialAllowed.push(radiologyLeader);
        }
    } else {
        // 팀원: 자신의 팀장, 자신의 팀, 미배정
        const leader = getLeaderRole(department);
        if (leader) initialAllowed.push(leader); // 자신의 팀장
        const teamName = getTeamName(department);
        if (teamName) initialAllowed.push(teamName); // 자신의 팀
    }

    // 초기 허용 목록을 Set에 추가
    initialAllowed.forEach(opt => finalAllowedSet.add(opt));

    console.log(`getAllowedTaskSelections (assignee) - Step A: Initial allowed roles/teams:`, [...finalAllowedSet]);

    // --- 추가 로직: 허용된 리더의 팀도 추가 ---
    const currentLeaders = [...finalAllowedSet].filter(opt => allLeaders.includes(opt));
    console.log(`getAllowedTaskSelections (assignee) - Step B: Leaders found in allowed set:`, currentLeaders);

    currentLeaders.forEach(leaderRole => {
        const correspondingTeam = getTeamNameFromLeader(leaderRole);
        if (correspondingTeam) {
            console.log(`getAllowedTaskSelections (assignee) - Step C: For leader ${leaderRole}, found team ${correspondingTeam}. Adding to set.`);
            finalAllowedSet.add(correspondingTeam);
        } else {
             console.log(`getAllowedTaskSelections (assignee) - Step C: For leader ${leaderRole}, no corresponding team found.`);
        }
    });
    // --- ---
    console.log(`getAllowedTaskSelections (assignee) - Step D: Allowed options after adding leader's teams:`, [...finalAllowedSet]);
  }

  // 최종 반환 배열 생성
  allowed = Array.from(finalAllowedSet);

  // --- 최종 필터링을 위한 모든 유효한 옵션 목록 생성 (역할 + 팀 이름 + 미배정) ---
  const allValidOptionsForFiltering = [];
  // ... (이전 로직 유지 - allValidOptionsForFiltering 생성) ...
  console.log("getAllowedTaskSelections - All Valid Options for Final Filtering:", allValidOptionsForFiltering);
  // --- --- ---

  // 생성된 유효 옵션 목록(allValidOptionsForFiltering)을 기준으로 최종 필터링
  const finalAllowed = allowed.filter(opt => allValidOptionsForFiltering.includes(opt));

  console.log(`getAllowedTaskSelections 최종 반환 (${fieldType}):`, finalAllowed);
  return finalAllowed;
};
