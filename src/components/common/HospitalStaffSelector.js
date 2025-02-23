import React, { useState, useEffect, useRef } from "react";
import hospitalStaff from "../../datas/users"; // 주어진 데이터 파일 경로에 맞게 조정
import NameCoin from "./NameCoin";
import OnceOnOffButton from "./OnceOnOffButton";
import styled from "styled-components";

const StyledContainer = styled.div`
  height: 40px;
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 0 10px;
  cursor: pointer;
`;

const HospitalStaffSelector = ({
  selectedStaff,
  setSelectedStaff,
  onConfirm,
}) => {
  // 임시 선택 상태를 관리하기 위한 state 추가
  const [tempSelectedStaff, setTempSelectedStaff] = useState(selectedStaff);

  // 병원 인원 데이터를 부서(팀)별로 그룹화하고 팀장을 맨 앞으로 정렬
  const groupedStaff = hospitalStaff.reduce((acc, staff) => {
    if (!acc[staff.department]) {
      acc[staff.department] = [];
    }
    acc[staff.department].push(staff);
    return acc;
  }, {});

  // 각 부서별로 팀장을 맨 앞으로 정렬하고 나머지는 가나다순으로 정렬
  Object.keys(groupedStaff).forEach((department) => {
    groupedStaff[department].sort((a, b) => {
      if (a.departmentLeader && !b.departmentLeader) return -1;
      if (!a.departmentLeader && b.departmentLeader) return 1;
      if (!a.departmentLeader && !b.departmentLeader) {
        return a.name.localeCompare(b.name, "ko");
      }
      return 0;
    });
  });

  // 부서 체크박스 클릭 시: 임시 선택 상태만 변경
  const handleDepartmentToggle = (department) => {
    const departmentStaff = groupedStaff[department];
    const allSelected = departmentStaff.every((staff) =>
      tempSelectedStaff.includes(staff.id)
    );

    if (allSelected) {
      setTempSelectedStaff((prev) =>
        prev.filter((id) => !departmentStaff.some((staff) => staff.id === id))
      );
    } else {
      const newIds = departmentStaff
        .map((staff) => staff.id)
        .filter((id) => !tempSelectedStaff.includes(id));
      setTempSelectedStaff((prev) => [...prev, ...newIds]);
    }
  };

  // 개별 직원 체크박스 클릭 시 임시 선택 상태만 변경
  const handleStaffToggle = (staffId) => {
    if (tempSelectedStaff.includes(staffId)) {
      setTempSelectedStaff((prev) => prev.filter((id) => id !== staffId));
    } else {
      setTempSelectedStaff((prev) => [...prev, staffId]);
    }
  };

  // 확인 버튼 클릭 핸들러 수정
  const handleConfirm = () => {
    setSelectedStaff(tempSelectedStaff);
    onConfirm?.(); // Modal 닫기
  };

  // 부서 체크박스의 indeterminate(부분 선택) 상태를 설정하기 위한 컴포넌트
  const DepartmentCheckbox = ({ allSelected, onChange }) => {
    return (
      <input
        type="checkbox"
        checked={allSelected}
        onChange={onChange}
        className="form-checkbox h-5 w-5 text-blue-600"
      />
    );
  };

  return (
    <div className="w-[800px] p-4">
      {Object.entries(groupedStaff).map(([department, staffList]) => {
        // tempSelectedStaff로 변경
        const allSelected = staffList.every((staff) =>
          tempSelectedStaff.includes(staff.id)
        );

        return (
          <div
            key={department}
            className="mb-4 border p-4 rounded shadow-sm bg-white"
          >
            <div className="flex items-center mb-2 gap-x-2">
              <span className="font-bold">{department}</span>
              <DepartmentCheckbox
                allSelected={allSelected}
                onChange={() => handleDepartmentToggle(department)}
              />
            </div>
            {/* 해당 부서에 속한 개별 직원 체크박스 목록 */}
            <div className="grid grid-cols-5 gap-2">
              {staffList.map((staff) => (
                <div key={staff.id} className="flex items-center gap-x-2">
                  <NameCoin item={staff} />
                  <span>{staff.name}</span>
                  <input
                    type="checkbox"
                    checked={tempSelectedStaff.includes(staff.id)}
                    onChange={() => handleStaffToggle(staff.id)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {/* 확인 버튼 영역 */}
      <div className="flex justify-end mt-4">
        <OnceOnOffButton
          text="확인"
          on={true}
          onClick={handleConfirm}
          className="w-[120px]"
        />
      </div>
    </div>
  );
};

export default HospitalStaffSelector;
