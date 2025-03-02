// UserLevelContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { checkPermissions, hasPermission } from "./permissionUtils";

const UserLevelContext = createContext();

// 단 한 번만 선언
const adminPassword = "skylover";

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
    role: "",
    departmentLeader: false,
    location: "",
  };
};

export function UserLevelProvider({ children }) {
  const [userLevelData, setUserLevelData] = useState(getInitialUserLevelData());

  const resetUserLevelData = () => {
    const emptyData = {
      department: "",
      role: "",
      departmentLeader: false,
      location: "",
    };
    setUserLevelData(emptyData);
    localStorage.removeItem("userLevelData");
  };

  const updateUserLevelData = (newData, password) => {
    if (password === adminPassword) {
      setUserLevelData(newData);
      return true;
    }
    return false;
  };

  const checkUserPermission = (requiredPermission) => {
    return hasPermission(userLevelData, requiredPermission);
  };

  useEffect(() => {
    try {
      localStorage.setItem("userLevelData", JSON.stringify(userLevelData));
    } catch (e) {
      console.error("로컬 저장소에 userLevelData 저장 실패", e);
    }
  }, [userLevelData]);

  return (
    <UserLevelContext.Provider
      value={{
        userLevelData,
        updateUserLevelData,
        checkUserPermission,
        checkPermissions: (type) => checkPermissions[type](userLevelData),
        resetUserLevelData,
      }}
    >
      {children}
    </UserLevelContext.Provider>
  );
}

export function useUserLevel() {
  return useContext(UserLevelContext);
}
