import React, { useState, useEffect } from "react";
import { logoLong } from "../assets";
import { useUserLevel } from "../utils/UserLevelContext";
import { FiSettings } from "react-icons/fi";
import UserChipText from "./common/UserChipText";
import { departmentArray, locationOptions, roleOptions } from "../datas/users";
import { Link } from "react-router-dom";
import LoginPCModal from "./common/LoginPCModal";

function PCAllocation() {
  const {
    userLevelData,
    updateUserLevelData,
    currentUser,
    isLoggedIn,
    getUserRoleLevel,
  } = useUserLevel();

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

  // 모달 상태 관리
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("login"); // 초기 탭 상태
  const [userRoleLevel, setUserRoleLevel] = useState("guest"); // 권한 레벨 정보

  // PC 할당이 필요한 상태인지 확인하는 함수
  const needsSetup =
    !userLevelData.department && !userLevelData.role && !userLevelData.location;

  useEffect(() => {
    if (isLoggedIn) {
      setUserRoleLevel(getUserRoleLevel());
    } else {
      setUserRoleLevel("guest");
    }
  }, [isLoggedIn, getUserRoleLevel]);

  // 모달 열기
  const openModal = (tab = "login") => {
    setModalOpen(true);
    setActiveTab(tab);
  };

  // 모달 닫기
  const closeModal = () => {
    setModalOpen(false);
  };

  // 로그인 성공 후 모달 닫기
  const handleLoginSuccess = () => {
    closeModal();
  };

  // PC 할당 제출 처리
  const handlePCAllocationSubmit = async (newData, adminPassword) => {
    return updateUserLevelData(newData, adminPassword);
  };

  return (
    <div className="flex flex-col items-center py-4 px-2">
      {/* 로고 영역 */}
      <div className="flex w-full items-center justify-between mt-[30px] px-4">
        <Link to="/" className="flex-1 flex justify-center">
          <img src={logoLong} alt="logo" className="w-[180px] h-auto" />
        </Link>
      </div>

      {/* PC 할당 정보 영역 */}
      <div className="w-full h-[110px] flex flex-col justify-center mt-[20px]">
        {!needsSetup ? (
          <div className="flex flex-row items-center">
            <div className="flex flex-col w-full gap-y-[6px] items-center">
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

              {/* 로그인한 유저 이름 표시 */}
              {isLoggedIn && currentUser && (
                <UserChipText
                  options={[
                    {
                      label: currentUser.name,
                      value: currentUser.name,
                    },
                  ]}
                  selected={currentUser.name}
                  onChange={() => {}}
                  green={false}
                />
              )}
            </div>
            <div className="mr-[10px]">
              <FiSettings
                onClick={() => openModal("login")}
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
              onClick={() => openModal("pc")}
              className="bg-onceBlue text-white px-3 py-1 rounded text-sm"
            >
              PC 할당
            </button>
          </div>
        )}
      </div>

      {/* 통합 로그인/PC할당 모달 */}
      <LoginPCModal
        isOpen={modalOpen}
        onClose={closeModal}
        onLoginSuccess={handleLoginSuccess}
        onPCAllocationSubmit={handlePCAllocationSubmit}
        defaultDepartment={defaultDepartment}
        defaultRole={defaultRole}
        defaultLocation={defaultLocation}
      />
    </div>
  );
}

export default PCAllocation;
