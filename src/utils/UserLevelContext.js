// UserLevelContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { isHospitalOwner, isLeaderOrHigher } from "./permissionUtils";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
} from "./UserAuth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

// 단 한 번만 선언
const adminPassword = "skylover";
const adminPasswordKorean = "ㄴㅏㅛㅣㅐㅍㄷㄱ";

// 자동 로그인 설정 관리를 위한 키
const AUTO_LOGIN_KEY = "autoLoginEnabled";
// 로그인 상태 관리를 위한 키
const LOGIN_STATUS_KEY = "loginStatus";

// 기본 상태값 정의
const defaultUserLevelState = {
  uid: null,
  email: null,
  displayName: "사용자",
  department: "미분류",
  level: 0,
};

// 컨텍스트 생성 - 단 한 번만 선언
const UserLevelContext = createContext();

// 컨텍스트 사용을 위한 훅
export const useUserLevel = () => useContext(UserLevelContext);

const getInitialUserLevelData = () => {
  try {
    const stored = localStorage.getItem("userLevelData");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("로컬 저장소에서 userLevelData 읽기 실패", e);
  }
  return {
    department: "",
    location: "",
  };
};

// 자동 로그인 설정 가져오기
const getAutoLoginSetting = () => {
  try {
    return localStorage.getItem(AUTO_LOGIN_KEY) === "true";
  } catch (e) {
    console.error("자동 로그인 설정 가져오기 실패", e);
    return false;
  }
};

// 로그인 상태 가져오기
const getLoginStatus = () => {
  try {
    return localStorage.getItem(LOGIN_STATUS_KEY) === "true";
  } catch (e) {
    console.error("로그인 상태 가져오기 실패", e);
    return false;
  }
};

// 로그인 상태 설정하기
const setLoginStatus = (isLoggedIn) => {
  try {
    localStorage.setItem(LOGIN_STATUS_KEY, String(isLoggedIn));
  } catch (e) {
    console.error("로그인 상태 저장 실패", e);
  }
};

export function UserLevelProvider({ children }) {
  const [userLevelData, setUserLevelData] = useState(
    getInitialUserLevelData() || defaultUserLevelState
  );
  const [currentUser, setCurrentUser] = useState(null);
  const [isAutoLoginEnabled, setIsAutoLoginEnabled] = useState(
    getAutoLoginSetting()
  );
  const [isLoading, setIsLoading] = useState(true);

  // 로그아웃 처리 (내부 함수)
  const handleLogout = (keepLoginStatus = false) => {
    logoutUser(keepLoginStatus); // 로컬 스토리지에서 현재 사용자 정보 제거
    setCurrentUser(null);

    if (!keepLoginStatus) {
      // 자동 로그인이 비활성화된 경우 로그인 상태도 초기화
      setLoginStatus(false);
    }

    // 사용자 권한 정보 초기화 (PC 정보는 유지)
    resetUserRoleData();
  };

  // 초기화 시 현재 로그인된 사용자 확인
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      // 자동 로그인이 활성화되어 있거나 현재 로그인 상태가 유지되는 경우
      const autoLoginEnabled = getAutoLoginSetting();
      const isLoggedInStatus = getLoginStatus();

      if (autoLoginEnabled || isLoggedInStatus) {
        const user = getCurrentUser();
        console.log("초기화 시 현재 로그인된 사용자 확인", user);
        if (user) {
          setCurrentUser(user);

          // 사용자 정보를 userLevelData에도 반영
          setUserLevelData((prevData) => ({
            ...prevData,
            id: user.id,
            uid: user.uid,
            email: user.email,
            name: user.name,
            displayName: user.displayName || user.name,
            role: user.role || "",
            departmentLeader: user.departmentLeader || false,
          }));
        } else {
          // 사용자 정보가 없으면 로그아웃 처리
          handleLogout(autoLoginEnabled);
        }
      } else {
        // 자동 로그인이 비활성화되어 있으면 로그아웃
        handleLogout(autoLoginEnabled);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // PC 정보 초기화 (department, location 관련 정보만 초기화)
  const resetPCData = () => {
    const emptyData = {
      department: "",
      location: "",
    };
    setUserLevelData(emptyData);
    localStorage.removeItem("userLevelData");
  };

  // 사용자 권한 정보만 초기화 (department, location은 유지)
  const resetUserRoleData = () => {
    // 기존 department와 location은 유지
    const { department, location } = userLevelData;

    const updatedData = {
      department,
      location,
      // 사용자 권한 관련 정보는 초기화
      role: "",
      departmentLeader: false,
    };

    setUserLevelData(updatedData);
    localStorage.setItem("userLevelData", JSON.stringify(updatedData));
  };

  // 임시 함수 추가 (이후 다른 파일로 이동하거나 보다 안전한 방식으로 변경)
  const validateAdminPassword = (password) => {
    return password === adminPassword || password === adminPasswordKorean;
  };

  const updateUserLevelData = (data, adminPassword) => {
    // 패스워드 검증이 필요한 경우 (adminPassword가 제공된 경우)
    if (adminPassword) {
      if (!validateAdminPassword(adminPassword)) {
        return false; // 패스워드가 일치하지 않으면 false 반환
      }
    }

    setUserLevelData((prevData) => ({
      ...prevData,
      ...data,
    }));

    return true; // 업데이트 성공 시 true 반환
  };

  const checkUserPermission = (requiredPermission) => {
    // 로그인 여부 먼저 확인
    if (!currentUser) {
      return false;
    }

    // 권한에 따라 다른 체크 로직을 적용
    switch (requiredPermission) {
      case "HOSPITAL_OWNER":
        return isHospitalOwner(userLevelData, currentUser);
      case "LEADER_OR_HIGHER":
        return isLeaderOrHigher(userLevelData, currentUser);
      default:
        // 기본적으로는 로그인한 사용자 모두 접근 가능
        return true;
    }
  };

  // 회원가입 기능
  const register = async (email, password, name, additionalData = {}) => {
    const result = await registerUser(email, password, name, additionalData);
    return result;
  };

  // 비밀번호 초기화 기능
  const resetUserPassword = async (email) => {
    const result = await resetPassword(email);
    return result;
  };

  // 로그인 기능
  const login = async (email, password, rememberMe = false) => {
    const result = await loginUser(email, password);

    if (result.success) {
      // Firebase에서 가져온 사용자 정보 설정
      setCurrentUser(result.user);
      setIsAutoLoginEnabled(rememberMe);

      // 자동 로그인 설정 저장
      localStorage.setItem(AUTO_LOGIN_KEY, rememberMe.toString());

      // 로그인 상태 저장 (항상 true로 설정)
      setLoginStatus(true);

      // PC 정보 보존하면서 사용자 정보 업데이트
      const updatedUserLevelData = {
        // PC의 위치 정보는 유지
        department: userLevelData.department || "",
        location: userLevelData.location || "",

        // 사용자 식별 정보 업데이트 (Firebase에서 가져옴)
        id: result.user.id,
        uid: result.user.uid || "",
        email: result.user.email,
        name: result.user.name,
        displayName: result.user.displayName || result.user.name,

        // 역할 정보 업데이트 (Firebase에서 가져옴)
        role: result.user.role || "",
        departmentLeader: result.user.departmentLeader || false,
      };

      // userLevelData 상태 업데이트 및 로컬 스토리지에 저장
      setUserLevelData(updatedUserLevelData);
      localStorage.setItem(
        "userLevelData",
        JSON.stringify(updatedUserLevelData)
      );
    }

    return result;
  };

  // 로그아웃 기능
  const logout = () => {
    handleLogout(false); // 로그인 상태 초기화
  };

  // 사용자 권한 레벨 가져오기 (원장, 팀장/과장, 팀원)
  const getUserRoleLevel = () => {
    if (!currentUser) return "guest"; // 로그인하지 않은 경우

    // Firebase에서 가져온 role 정보를 우선적으로 사용
    const role = currentUser.role || userLevelData.role || "";

    if (role.includes("원장")) {
      return "director";
    } else if (role.includes("장") || role.includes("과장")) {
      return "manager";
    } else {
      return "member";
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem("userLevelData", JSON.stringify(userLevelData));
    } catch (e) {
      console.error("로컬 스토리지에 userLevelData 저장 실패", e);
    }
  }, [userLevelData]);

  // currentUser 상태가 변경될 때마다 로그인 상태 업데이트
  useEffect(() => {
    const isLoggedIn = !!currentUser;
    setLoginStatus(isLoggedIn);
  }, [currentUser]);

  return (
    <UserLevelContext.Provider
      value={{
        // PC 환경 정보
        department: userLevelData.department,
        location: userLevelData.location,

        // 역할 정보 (Firebase 우선)
        role: currentUser?.role || userLevelData.role || "",
        departmentLeader:
          currentUser?.departmentLeader ||
          userLevelData.departmentLeader ||
          false,

        // 상태 데이터
        userLevelData,
        isLoggedIn: !!currentUser,
        currentUser,
        isAutoLoginEnabled,
        isLoading,

        // 함수들
        login,
        logout,
        register,
        resetUserPassword,
        updateUserLevelData,
        resetPCData,
        canAccess: checkUserPermission,
        getUserRoleLevel,
      }}
    >
      {children}
    </UserLevelContext.Provider>
  );
}
