import React, { useState, useEffect, useRef } from "react";
import NameCoin from "./NameCoin";
import OnceOnOffButton from "./OnceOnOffButton";
import styled from "styled-components";
import { db } from "../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

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
  selectedStaff = [],
  setSelectedStaff,
  onConfirm,
  onSelect,
}) => {
  // 임시 선택 상태를 관리하기 위한 state 추가
  const [tempSelectedStaff, setTempSelectedStaff] = useState(selectedStaff);
  // 병원 직원 데이터 상태 추가
  const [hospitalStaff, setHospitalStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Firebase에서 직원 데이터 가져오기
  useEffect(() => {
    const fetchHospitalStaff = async () => {
      try {
        setIsLoading(true);
        // 모든 사용자 가져오기
        const usersQuery = query(collection(db, "users"));
        const querySnapshot = await getDocs(usersQuery);

        const staffData = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();

          // 퇴직자가 아닌 경우만 추가 (status가 없거나 "퇴직"이 아닌 모든 경우)
          if (!userData.status || userData.status !== "퇴직") {
            // role 값을 확인하여 팀장인지 확인
            const isLeader =
              userData.role &&
              (userData.role.includes("팀장") ||
                userData.role.includes("과장") ||
                userData.role.includes("대표") ||
                userData.role.includes("원장"));

            staffData.push({
              id: doc.id,
              name: userData.name || "",
              department: userData.department || "",
              departmentLeader: userData.departmentLeader || isLeader, // role이 팀장이면 departmentLeader를 true로 설정
              role: userData.role || "",
            });
          }
        });

        setHospitalStaff(staffData);
      } catch (error) {
        console.error("직원 데이터를 가져오는 중 오류 발생:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHospitalStaff();
  }, []);

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
  const handleStaffToggle = (staffId, staffName) => {
    // 이미 선택된 경우 제거
    if (tempSelectedStaff.includes(staffId)) {
      setTempSelectedStaff((prev) => prev.filter((id) => id !== staffId));
    } else {
      // 선택되지 않은 경우 추가 (중복 방지를 위해 Set 사용)
      setTempSelectedStaff((prev) => {
        const newSelection = [...prev, staffId];
        const uniqueSelection = [...new Set(newSelection)];

        // 중복이 있었다면 로그 출력
        if (uniqueSelection.length !== newSelection.length) {
          console.log("중복된 직원 ID가 제거됨", {
            원본: newSelection,
            중복제거: uniqueSelection,
          });
        }

        return uniqueSelection;
      });
    }

    // 단일 선택 모드일 때 직원 선택 후 바로 처리
    if (onSelect) {
      onSelect({ id: staffId, name: staffName });
    }
  };

  // 리더 역할인지 확인하는 함수 추가
  const isLeaderRole = (role) => {
    if (!role) return false;

    // 직책명에 '팀장', '과장', '대표', '원장'이 포함되어 있는지 확인
    return (
      role.includes("팀장") ||
      role.includes("과장") ||
      role.includes("대표") ||
      role.includes("원장")
    );
  };

  // 확인 버튼 클릭 핸들러 수정
  const handleConfirm = () => {
    if (setSelectedStaff) {
      // 중복 제거
      const uniqueSelection = [...new Set(tempSelectedStaff)];
      setSelectedStaff(uniqueSelection);
    }
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

  if (isLoading) {
    return (
      <div className="w-[800px] p-4 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 부서 순서 정의 (진료 -> 간호 -> 물리치료 -> 원무 -> 영상의학 -> 경영지원 순)
  const departmentOrder = {
    진료팀: 1,
    원장팀: 1, // 진료팀과 동일 우선순위 (둘 다 진료 관련 팀으로 간주)
    간호팀: 2,
    물리치료팀: 3,
    원무팀: 4,
    영상의학팀: 5,
    경영지원팀: 6,
  };

  // Object.entries(groupedStaff)를 부서 순서에 따라 정렬
  const sortedDepartments = Object.entries(groupedStaff).sort((a, b) => {
    const orderA = departmentOrder[a[0]] || 999; // 순서가 정의되지 않은 부서는 맨 뒤로
    const orderB = departmentOrder[b[0]] || 999;
    return orderA - orderB;
  });

  return (
    <div className="w-[800px] p-4">
      {sortedDepartments.map(([department, staffList]) => {
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
                <div
                  key={staff.id}
                  className="flex items-center gap-x-2 cursor-pointer"
                  onClick={() => handleStaffToggle(staff.id, staff.name)}
                >
                  <NameCoin
                    item={staff}
                    isLeader={
                      isLeaderRole(staff.role) || staff.departmentLeader
                    }
                  />
                  <span>{staff.name}</span>
                  <input
                    type="checkbox"
                    checked={tempSelectedStaff.includes(staff.id)}
                    onChange={() => handleStaffToggle(staff.id, staff.name)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {/* 확인 버튼 영역 - 단일 선택 모드일 때는 표시하지 않음 */}
      {!onSelect && (
        <div className="flex justify-end mt-4">
          <OnceOnOffButton
            text="확인"
            on={true}
            onClick={handleConfirm}
            className="w-[120px]"
          />
        </div>
      )}
    </div>
  );
};

export default HospitalStaffSelector;
