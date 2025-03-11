import React, { useState } from "react";
import { logoLong } from "../assets";
import { useUserLevel } from "../utils/UserLevelContext";
import { FiSettings } from "react-icons/fi";
import UserChipText from "./common/UserChipText";
import { departmentArray, locationOptions, roleOptions } from "../datas/users";
import { Link } from "react-router-dom";
import { getCurrentUser, logoutUser } from "../utils/UserAuth";
import MiniLoginForm from "./common/MiniLoginForm";
import MiniDevTools from "./common/MiniDevTools";

function PCAllocation() {
  const { userLevelData, updateUserLevelData } = useUserLevel();
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  // userLevelData의 부서가 유효한지 검사 후 기본값 설정
  const validDepartment =
    userLevelData?.department &&
    departmentArray.includes(userLevelData.department)
      ? userLevelData.department
      : "간호팀";
  const defaultDepartment = validDepartment;
  const defaultRole = userLevelData?.role || roleOptions[defaultDepartment][0];
  const defaultLocation =
    userLevelData?.location || locationOptions[defaultDepartment][0];

  // 초기 departmentLeader는 defaultRole에 "장"이 포함되어 있는지 여부로 설정
  const [departmentLeader, setDepartmentLeader] = useState(
    defaultRole.includes("장")
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [department, setDepartment] = useState(defaultDepartment);
  const [role, setRole] = useState(defaultRole);
  const [location, setLocation] = useState(defaultLocation);
  const [message, setMessage] = useState("");

  // PC 할당이 필요한 상태인지 확인하는 함수
  const needsSetup =
    !userLevelData.department && !userLevelData.role && !userLevelData.location;

  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setMessage("");
    setAdminPasswordInput("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // departmentLeader는 이미 자동 업데이트 되었으므로 그대로 전송
    const newData = { department, role, location, departmentLeader };
    const success = updateUserLevelData(newData, adminPasswordInput);
    if (success) {
      setMessage("PC 할당 완료");
      // 모달을 잠시 보여준 후 닫기
      setTimeout(() => {
        closeModal();
      }, 1000);
    } else {
      setMessage("패스워드가 틀렸습니다");
    }
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  // 로그인 성공 후 사용자 정보 업데이트
  const updateCurrentUser = () => {
    setCurrentUser(getCurrentUser());
  };

  return (
    <div className="flex flex-col items-center py-4 px-2">
      {/* 로고 영역 */}
      <div className="flex w-full items-center justify-center mb-3">
        <Link to="/">
          <img src={logoLong} alt="logo" className="w-[180px] h-auto" />
        </Link>
      </div>

      {/* PC 할당 정보 영역 */}
      <div className="w-full mb-3">
        {!needsSetup ? (
          <div className="flex flex-col items-center">
            <div className="flex flex-col w-full gap-y-[6px] items-center">
              <UserChipText
                options={[
                  {
                    label: userLevelData.department,
                    value: userLevelData.department,
                  },
                ]}
                selected={userLevelData.department}
                onChange={() => {}}
              />
              <UserChipText
                options={[
                  { label: userLevelData.role, value: userLevelData.role },
                ]}
                selected={userLevelData.role}
                onChange={() => {}}
              />
              <UserChipText
                options={[
                  {
                    label: userLevelData.location,
                    value: userLevelData.location,
                  },
                ]}
                selected={userLevelData.location}
                onChange={() => {}}
                green={true}
              />
            </div>
            <div className="mt-1">
              <FiSettings
                onClick={openModal}
                className="text-onceBlue text-[20px] cursor-pointer"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="text-gray-500 text-center text-sm">
              설정되지 않은 PC
            </div>
            <button
              onClick={openModal}
              className="bg-onceBlue text-white px-3 py-1 rounded text-sm"
            >
              PC 할당
            </button>
          </div>
        )}
      </div>

      {/* 사용자 로그인 정보 영역 */}
      <div className="w-full border-t border-gray-200 pt-3 mb-2">
        {currentUser ? (
          <div className="flex flex-col items-center text-sm">
            <span className="font-medium text-onceBlue">
              {currentUser.name}
            </span>
            <span className="text-xs text-gray-500 mb-1">님 사용 중</span>
            <button
              onClick={handleLogout}
              className="text-red-500 text-xs hover:underline"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <MiniLoginForm onLoginSuccess={updateCurrentUser} />
        )}
      </div>

      {/* 개발 도구 */}
      <MiniDevTools />

      {/* 모달: 관리자 패스워드 입력 및 정보 수정 */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md w-[320px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">PC 할당 정보 수정</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                X
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* 부서 선택 */}
              <div className="flex flex-row items-center">
                <label className="block text-sm w-[50px]">부서:</label>
                <select
                  value={department}
                  onChange={(e) => {
                    const newDept = e.target.value;
                    setDepartment(newDept);
                    // 부서 변경 시 역할과 위치의 기본값을 업데이트하고,
                    // 역할에 "장" 문자가 포함되어 있는지에 따라 부서 리더 값을 자동 설정
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

              {/* 역할 선택 */}
              <div className="flex flex-row items-center">
                <label className="block text-sm w-[50px]">역할:</label>
                <select
                  value={role}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setRole(newRole);
                    // 역할 변경 시 "장" 문자가 포함되어 있으면 자동 체크
                    setDepartmentLeader(newRole.includes("장"));
                  }}
                  className="w-full border rounded px-2 py-1"
                >
                  {(roleOptions[department] || []).map((r) => (
                    <option key={r} value={r}>
                      {r}
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

              <button
                type="submit"
                className="w-full bg-onceBlue text-white py-2 rounded"
              >
                저장
              </button>
            </form>
            {message && <p className="mt-2 text-center text-sm">{message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default PCAllocation;
