import React, { useState } from "react";
import { logoLong } from "../assets";
import { useUserLevel } from "../utils/UserLevelContext";
import { FaCog } from "react-icons/fa";
import { MdSettings } from "react-icons/md";
import { IoIosSettings } from "react-icons/io";
import { FiSettings } from "react-icons/fi";
import ChipText from "./common/ChipText";

function PCAllocation() {
  const { userLevelData, updateUserLevelData } = useUserLevel();
  const [modalOpen, setModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [department, setDepartment] = useState(
    userLevelData?.department || "진료"
  );
  const [role, setRole] = useState(userLevelData?.role || "의사");
  const [departmentLeader, setDepartmentLeader] = useState(
    userLevelData?.departmentLeader !== undefined
      ? userLevelData.departmentLeader
      : true
  );
  const [message, setMessage] = useState("");

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
    const newData = { department, role, departmentLeader };
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

  return (
    <div>
      <div className="LoginZone flex flex-col w-full items-center h-[240px] justify-center">
        <div className="flex-1 flex w-full items-center justify-center">
          <img src={logoLong} alt="logo" className="w-[200px] h-auto" />
        </div>
        <div className="flex-1 flex w-full items-center justify-center">
          {userLevelData ? (
            // PC 할당 완료 후, 부서와 역할 표시 + 톱니바퀴 버튼
            <div className="flex flex-row items-center w-full px-[20px]">
              <div className="flex flex-col w-full gap-y-[10px] items-center">
                <ChipText text={userLevelData.department} />
                <ChipText text={userLevelData.role} />
              </div>
              <FiSettings
                onClick={() => {
                  setModalOpen(true);
                }}
                className="text-onceBlue text-[30px]"
              />
            </div>
          ) : (
            // 아직 PC 할당되지 않은 경우
            <button
              onClick={openModal}
              className="bg-onceBlue w-[160px] h-[60px]"
            >
              <span className="text-white">PC 할당</span>
            </button>
          )}
        </div>
      </div>

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
              <div>
                <label className="block text-sm">부서:</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm">역할:</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div className="flex items-center">
                <label className="text-sm mr-2">부서 리더:</label>
                <input
                  type="checkbox"
                  checked={departmentLeader}
                  onChange={(e) => setDepartmentLeader(e.target.checked)}
                />
              </div>
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
