import React, { useState, useEffect, useRef } from "react";
import hospitalStaff from "../../datas/users"; // 주어진 데이터 파일 경로에 맞게 조정
import NameCoin from "./NameCoin";
import OnceOnOffButton from "./OnceOnOffButton";

const HospitalStaffSelector = () => {
  // 선택된 직원 id를 저장하는 상태 (배열 형태)
  const [selectedStaff, setSelectedStaff] = useState([]);

  // 병원 인원 데이터를 부서(팀)별로 그룹화
  const groupedStaff = hospitalStaff.reduce((acc, staff) => {
    if (!acc[staff.department]) {
      acc[staff.department] = [];
    }
    acc[staff.department].push(staff);
    return acc;
  }, {});

  // 부서 체크박스 클릭 시: 해당 부서에 속한 모든 직원의 선택 상태를 토글
  const handleDepartmentToggle = (department) => {
    const departmentStaff = groupedStaff[department];
    const allSelected = departmentStaff.every((staff) =>
      selectedStaff.includes(staff.id)
    );

    if (allSelected) {
      // 모두 선택되어 있다면 모두 해제
      setSelectedStaff((prev) =>
        prev.filter((id) => !departmentStaff.some((staff) => staff.id === id))
      );
    } else {
      // 선택되어 있지 않다면 부서에 속한 모든 직원 id를 추가
      const newIds = departmentStaff
        .map((staff) => staff.id)
        .filter((id) => !selectedStaff.includes(id));
      setSelectedStaff((prev) => [...prev, ...newIds]);
    }
  };

  // 개별 직원 체크박스 클릭 시 선택 상태 토글
  const handleStaffToggle = (staffId) => {
    if (selectedStaff.includes(staffId)) {
      setSelectedStaff((prev) => prev.filter((id) => id !== staffId));
    } else {
      setSelectedStaff((prev) => [...prev, staffId]);
    }
  };

  // 부서 체크박스의 indeterminate(부분 선택) 상태를 설정하기 위한 컴포넌트
  const DepartmentCheckbox = ({ allSelected, someSelected, onChange }) => {
    const ref = useRef(null);

    useEffect(() => {
      if (ref.current) {
        ref.current.indeterminate = someSelected;
      }
    }, [someSelected]);

    return (
      <input
        ref={ref}
        type="checkbox"
        checked={allSelected}
        onChange={onChange}
        className="form-checkbox h-5 w-5 text-blue-600"
      />
    );
  };

  return (
    <div className="w-[600px] h-[660px] p-4">
      {Object.entries(groupedStaff).map(([department, staffList]) => {
        // 부서에 속한 직원이 모두 선택되었는지, 일부만 선택되었는지 판단
        const allSelected = staffList.every((staff) =>
          selectedStaff.includes(staff.id)
        );
        const someSelected =
          staffList.some((staff) => selectedStaff.includes(staff.id)) &&
          !allSelected;

        return (
          <div
            key={department}
            className="mb-4 border p-4 rounded shadow-sm bg-white"
          >
            {/* 부서(팀) 체크박스 */}
            <div className="flex items-center mb-2 gap-x-2">
              <span className="font-bold">{department}</span>
              <DepartmentCheckbox
                allSelected={allSelected}
                someSelected={someSelected}
                onChange={() => handleDepartmentToggle(department)}
              />
            </div>
            {/* 해당 부서에 속한 개별 직원 체크박스 목록 */}
            <div className="grid grid-cols-3 gap-2">
              {staffList.map((staff) => (
                <div key={staff.id} className="flex items-center gap-x-2">
                  <NameCoin item={staff} />
                  <span>{staff.name}</span>
                  <input
                    type="checkbox"
                    checked={selectedStaff.includes(staff.id)}
                    onChange={() => handleStaffToggle(staff.id)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <OnceOnOffButton text={"완료하기"} />
    </div>
  );
};

export default HospitalStaffSelector;
