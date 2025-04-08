import React, { useState, useEffect } from "react";
import MiniLoginForm from "./MiniLoginForm";
import {
  departmentArray,
  locationOptions,
  roleOptions,
} from "../../datas/users";
import OnceOnOffButton from "./OnceOnOffButton";
import { useUserLevel } from "../../utils/UserLevelContext";

/**
 * 로그인과 PC할당 기능을 하나의 모달로 통합한 컴포넌트
 * 탭 기능으로 로그인과 PC할당 사이를 전환할 수 있음
 */
const LoginPCModal = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onPCAllocationSubmit,
  defaultDepartment = "간호팀",
  defaultRole = "",
  defaultLocation = "",
}) => {
  // 사용자 레벨 컨텍스트에서 필요한 함수들 가져오기
  const { resetPCData, logout } = useUserLevel();

  // 내부 상태 관리
  const [activeTab, setActiveTab] = useState("login"); // 'login' 또는 'pc'
  const [department, setDepartment] = useState(defaultDepartment);
  const [role, setRole] = useState(
    defaultRole ||
      (roleOptions[defaultDepartment] ? roleOptions[defaultDepartment][0] : "")
  );
  const [location, setLocation] = useState(
    defaultLocation ||
      (locationOptions[defaultDepartment]
        ? locationOptions[defaultDepartment][0]
        : "")
  );
  const [departmentLeader, setDepartmentLeader] = useState(
    role?.includes("장") || false
  );
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [message, setMessage] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  // 초기 탭 설정
  const changeActiveTab = (tab) => {
    setActiveTab(tab);
    setMessage("");
  };

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen) {
      setDepartment(defaultDepartment);
      const initRole =
        defaultRole ||
        (roleOptions[defaultDepartment]
          ? roleOptions[defaultDepartment][0]
          : "");
      setRole(initRole);
      setDepartmentLeader(initRole?.includes("장") || false);
      setLocation(
        defaultLocation ||
          (locationOptions[defaultDepartment]
            ? locationOptions[defaultDepartment][0]
            : "")
      );
      setAdminPasswordInput("");
      setIsPasswordValid(false);
      setMessage("");
    }
  }, [isOpen, defaultDepartment, defaultRole, defaultLocation]);

  // 비밀번호 변경 처리
  useEffect(() => {
    setIsPasswordValid(adminPasswordInput.trim().length > 0);
  }, [adminPasswordInput]);

  // PC 할당 폼 제출 처리
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (!isPasswordValid) {
      setMessage("관리자 패스워드를 입력해주세요");
      return;
    }

    const newData = { department, role, location, departmentLeader };

    // 비동기 작업으로 처리하고 await 추가
    const success = await onPCAllocationSubmit(newData, adminPasswordInput);

    if (success) {
      setMessage("PC 할당 완료");
      // 즉시 모달 닫기
      onClose();
    } else {
      setMessage("패스워드가 틀렸습니다");
    }
  };

  // 모든 로컬 정보 삭제 처리
  const handleClearAllLocalData = () => {
    try {
      // 로컬 스토리지 초기화
      localStorage.clear();
      
      // UserLevelContext의 상태 초기화
      if (logout) {
        logout();  // 로그아웃 처리 (사용자 정보 초기화)
      }
      
      if (resetPCData) {
        resetPCData();  // PC 할당 데이터 초기화
      }
      
      // 현재 상태 초기화
      setDepartment(defaultDepartment);
      const initRole = roleOptions[defaultDepartment] ? roleOptions[defaultDepartment][0] : "";
      setRole(initRole);
      setDepartmentLeader(initRole?.includes("장") || false);
      setLocation(locationOptions[defaultDepartment] ? locationOptions[defaultDepartment][0] : "");
      
      // 완료 메시지
      setMessage("모든 로컬 데이터가 초기화되었습니다");
      
      // 로그인 탭으로 전환
      setActiveTab("login");
    } catch (e) {
      console.error("로컬 데이터 삭제 중 오류 발생", e);
      setMessage("데이터 삭제 중 오류가 발생했습니다");
    }
  };

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-md w-[320px]">
        <div className="flex justify-between items-center mb-2">
          <div></div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            X
          </button>
        </div>

        {/* 탭 선택 UI */}
        <div className="flex border-b mb-4">
          <button
            className={`py-2 px-4 ${
              activeTab === "login"
                ? "border-b-2 border-onceBlue text-onceBlue"
                : "text-gray-500"
            }`}
            onClick={() => changeActiveTab("login")}
          >
            로그인
          </button>
          <button
            className={`py-2 px-4 ${
              activeTab === "pc"
                ? "border-b-2 border-onceBlue text-onceBlue"
                : "text-gray-500"
            }`}
            onClick={() => changeActiveTab("pc")}
          >
            PC 할당
          </button>
        </div>

        {/* 컨텐츠 영역 */}
        {activeTab === "login" ? (
          <MiniLoginForm onLoginSuccess={onLoginSuccess} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* 부서 선택 */}
            <div className="flex flex-row items-center">
              <label className="block text-sm w-[50px]">부서:</label>
              <select
                value={department}
                onChange={(e) => {
                  const newDept = e.target.value;
                  setDepartment(newDept);
                  const newRole = roleOptions[newDept][0];
                  setRole(newRole);
                  setDepartmentLeader(newRole.includes("장"));
                  setLocation(locationOptions[newDept][0]);
                }}
                className="w-full border rounded px-2 py-1"
              >
                {departmentArray.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* 위치 선택 */}
            <div className="flex flex-row items-center">
              <label className="block text-sm w-[50px]">위치:</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border rounded px-2 py-1"
              >
                {(locationOptions[department] || []).map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* 관리자 패스워드 입력 */}
            <div>
              <label className="block text-sm">Admin Password:</label>
              <input
                type="password"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </div>

            {/* 모든 로컬 데이터 삭제 버튼 */}
            <div className="w-full">
              <button
                type="button"
                onClick={handleClearAllLocalData}
                className="w-full bg-red-700 text-white py-2 rounded-md hover:bg-red-800 transition-colors"
              >
                모든 로컬 데이터 초기화
              </button>
            </div>

            <div className="w-full">
              <OnceOnOffButton
                text="저장"
                on={isPasswordValid}
                onClick={handleSubmit}
                disabled={!isPasswordValid}
                toastMessage="관리자 패스워드를 입력해주세요"
              />
            </div>
          </form>
        )}
        {message && <p className="mt-2 text-center text-sm">{message}</p>}
      </div>
    </div>
  );
};

export default LoginPCModal;
