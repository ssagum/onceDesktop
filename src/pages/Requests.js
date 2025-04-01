import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import SideBar from "../components/SideBar";
import RequestsOverview from "../components/Requests/RequestsOverview";
import AdminRequestsManager from "../components/Requests/AdminRequestsManager";
import { useUserLevel } from "../utils/UserLevelContext";
import {
  isHospitalOwner,
  isAdministrativeManager,
  isLeaderOrHigher,
} from "../utils/permissionUtils";

const MainZone = styled.div``;

const Requests = () => {
  const location = useLocation();
  const { userLevelData } = useUserLevel();
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [activeTab, setActiveTab] = useState("vacation");

  useEffect(() => {
    // URL 쿼리 파라미터에서 탭 정보 가져오기
    const queryParams = new URLSearchParams(location.search);
    const tabParam = queryParams.get("tab");

    if (tabParam && ["vacation", "stock", "request"].includes(tabParam)) {
      setActiveTab(tabParam);
    }

    // 관리자 권한 확인 - 대표원장, 원무과장, 팀장급만 관리자 모드 접근 가능
    if (userLevelData) {
      const isOwner = isHospitalOwner(userLevelData);
      const isAdminManager = isAdministrativeManager(userLevelData);
      const isLeader = isLeaderOrHigher(userLevelData);

      setHasAdminAccess(isOwner || isAdminManager || isLeader);
    }
  }, [location.search, userLevelData]);

  return (
    <div className="flex flex-row w-full h-screen items-center">
      <div className="w-[250px] h-full flex flex-col justify-center">
        <SideBar />
      </div>
      <MainZone className="w-full flex flex-col justify-evenly items-center bg-onceBackground h-screen">
        <section className="flex flex-col items-center w-full h-full rounded-2xl p-4">
          {hasAdminAccess && (
            <div className="w-full flex justify-end mb-4">
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="px-4 py-2 bg-white rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {showAdminPanel ? "일반 모드 보기" : "관리자 모드 보기"}
              </button>
            </div>
          )}

          {showAdminPanel && hasAdminAccess ? (
            <AdminRequestsManager />
          ) : (
            <RequestsOverview initialTab={activeTab} />
          )}
        </section>
      </MainZone>
    </div>
  );
};

export default Requests;
