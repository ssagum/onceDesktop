import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  Timestamp,
  query,
  where,
} from "firebase/firestore";

// 테스트용 사용자 데이터
const testUsers = [
  {
    email: "nurse1@example.com",
    password: "password123",
    name: "김간호",
    createdAt: Timestamp.now(),
  },
  {
    email: "doctor1@example.com",
    password: "password123",
    name: "이의사",
    createdAt: Timestamp.now(),
  },
  {
    email: "admin@example.com",
    password: "admin123",
    name: "관리자",
    createdAt: Timestamp.now(),
  },
];

// 테스트 사용자 데이터 추가 함수
export const seedUsers = async () => {
  const usersRef = collection(db, "users");
  const results = { added: [], existing: [] };

  for (const user of testUsers) {
    try {
      // 이메일로 중복 체크
      const q = query(usersRef, where("email", "==", user.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // 사용자가 존재하지 않으면 추가
        const docRef = await addDoc(usersRef, user);
        results.added.push({ id: docRef.id, ...user });
      } else {
        // 이미 존재하는 사용자
        results.existing.push(user.email);
      }
    } catch (error) {
      console.error(`사용자 ${user.email} 추가 중 오류:`, error);
    }
  }

  return results;
};

// 관리자 콘솔에서 사용하기 위한 함수
export const initSeedData = async () => {
  console.log("테스트 데이터 초기화 중...");

  try {
    const userResults = await seedUsers();
    console.log("사용자 데이터 초기화 결과:", userResults);

    return {
      success: true,
      users: userResults,
    };
  } catch (error) {
    console.error("테스트 데이터 초기화 중 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
