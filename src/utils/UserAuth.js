import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  setDoc,
  doc,
  Timestamp,
  getDoc,
} from "firebase/firestore";

// 로그인 상태 관리를 위한 키
const LOGIN_STATUS_KEY = "loginStatus";

// 로그인 함수
export const loginUser = async (email, password) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: "이메일을 찾을 수 없습니다." };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    if (userData.password !== password) {
      return { success: false, message: "비밀번호가 일치하지 않습니다." };
    }

    // 현재 PC의 department와 location 정보 가져오기
    let existingPCData = { department: "", location: "" };
    try {
      const storedData = localStorage.getItem("userLevelData");
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        existingPCData.department = parsedData.department || "";
        existingPCData.location = parsedData.location || "";
      }
    } catch (e) {
      console.error("로컬 스토리지에서 PC 정보 읽기 실패", e);
    }

    // 사용자 권한 정보 준비 (PC 정보 유지)
    const userRoleInfo = {
      // PC 정보 보존
      department: existingPCData.department || userData.department || "",
      location: existingPCData.location || userData.location || "",
      // 사용자 정보 갱신
      role: userData.role || "",
      departmentLeader: userData.departmentLeader || false,
    };

    // 로컬 스토리지에 사용자 권한 정보 저장
    localStorage.setItem("userLevelData", JSON.stringify(userRoleInfo));

    // 로그인 성공 시 사용자 정보를 로컬 스토리지에 저장
    const userInfo = {
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
      department: userData.department || "",
      role: userData.role || "",
      departmentLeader: userData.departmentLeader || false,
      location: userData.location || "",
      createdAt: userData.createdAt,
    };

    // 로컬 스토리지에 사용자 정보 저장
    localStorage.setItem("currentUser", JSON.stringify(userInfo));

    // 로그인 상태 설정
    localStorage.setItem(LOGIN_STATUS_KEY, "true");

    return { success: true, user: userInfo };
  } catch (error) {
    console.error("로그인 오류:", error);
    return { success: false, message: "로그인 중 오류가 발생했습니다." };
  }
};

// 로그아웃 함수
export const logoutUser = (keepLoginStatus = false) => {
  // 로컬 스토리지에서 사용자 정보 제거
  localStorage.removeItem("currentUser");

  // 자동 로그인 설정이 꺼져 있으면 로그인 상태도 제거
  if (!keepLoginStatus) {
    localStorage.removeItem(LOGIN_STATUS_KEY);
  }

  // PC 관련 정보(department, location)는 유지됨
  // UserLevelContext에서 resetUserRoleData 함수를 통해 사용자 권한 정보만 초기화
};

// 현재 로그인한 사용자 정보 가져오기
export const getCurrentUser = () => {
  // 로컬 스토리지에서 현재 사용자 정보 가져오기
  const userJson = localStorage.getItem("currentUser");
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch (error) {
    console.error("사용자 정보 파싱 오류:", error);
    return null;
  }
};

// 사용자 권한 정보 가져오기 (Firebase에서)
export const getUserRoleData = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        department: userData.department || "",
        role: userData.role || "",
        departmentLeader: userData.departmentLeader || false,
        location: userData.location || "",
      };
    }

    return null;
  } catch (error) {
    console.error("사용자 권한 정보 가져오기 오류:", error);
    return null;
  }
};

// 회원가입 함수
export const registerUser = async (
  email,
  password,
  name,
  hireDate = null,
  resignationDate = null,
  additionalData = {}
) => {
  try {
    // 이메일 중복 확인
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return { success: false, message: "이미 등록된 이메일입니다." };
    }

    // 새 사용자 데이터 준비
    const newUser = {
      email,
      password, // 실제 구현시 이 부분은 암호화 처리 필요
      name,
      hireDate: hireDate ? Timestamp.fromDate(new Date(hireDate)) : null,
      resignationDate: resignationDate
        ? Timestamp.fromDate(new Date(resignationDate))
        : null,
      ...additionalData,
      createdAt: Timestamp.now(),
    };

    let docId = "";

    // userId가 있으면 해당 ID로 문서 생성, 없으면 자동 생성된 ID 사용
    if (additionalData.userId) {
      // userId로 문서 ID 설정
      const userDocRef = doc(db, "users", additionalData.userId);

      // userId가 이미 사용 중인지 확인
      const existingDoc = await getDocs(
        query(usersRef, where("userId", "==", additionalData.userId))
      );
      if (!existingDoc.empty) {
        return { success: false, message: "이미 사용 중인 사용자 ID입니다." };
      }

      await setDoc(userDocRef, newUser);
      docId = additionalData.userId;
    } else {
      // 자동 ID 생성
      const docRef = await addDoc(collection(db, "users"), newUser);
      docId = docRef.id;
    }

    return {
      success: true,
      user: {
        id: docId,
        email,
        name,
        hireDate: newUser.hireDate,
        resignationDate: newUser.resignationDate,
        ...additionalData,
        createdAt: newUser.createdAt,
      },
    };
  } catch (error) {
    console.error("회원가입 오류:", error);
    return { success: false, message: "회원가입 중 오류가 발생했습니다." };
  }
};
