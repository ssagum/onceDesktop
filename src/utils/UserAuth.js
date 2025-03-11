import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
} from "firebase/firestore";

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

    // 로그인 성공 시 사용자 정보를 로컬 스토리지에 저장
    const userInfo = {
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
      department: userData.department || "",
      createdAt: userData.createdAt,
    };

    localStorage.setItem("currentUser", JSON.stringify(userInfo));

    return { success: true, user: userInfo };
  } catch (error) {
    console.error("로그인 오류:", error);
    return { success: false, message: "로그인 중 오류가 발생했습니다." };
  }
};

// 로그아웃 함수
export const logoutUser = () => {
  localStorage.removeItem("currentUser");
};

// 현재 로그인한 사용자 정보 가져오기
export const getCurrentUser = () => {
  const userJson = localStorage.getItem("currentUser");
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch (error) {
    console.error("사용자 정보 파싱 오류:", error);
    return null;
  }
};

// 회원가입 함수
export const registerUser = async (
  email,
  password,
  name,
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

    // 새 사용자 추가
    const newUser = {
      email,
      password, // 실제 구현시 이 부분은 암호화 처리 필요
      name,
      ...additionalData,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, "users"), newUser);

    return {
      success: true,
      user: {
        id: docRef.id,
        email,
        name,
        ...additionalData,
        createdAt: newUser.createdAt,
      },
    };
  } catch (error) {
    console.error("회원가입 오류:", error);
    return { success: false, message: "회원가입 중 오류가 발생했습니다." };
  }
};
