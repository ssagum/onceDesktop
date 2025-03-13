import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import {
  format,
  differenceInCalendarMonths,
  isBefore,
  parseISO,
} from "date-fns";

/**
 * 입사일부터 현재까지의 개월 수를 기준으로 발생한 휴가 일수를 계산합니다.
 * 매월 1일씩 휴가가 발생합니다.
 *
 * @param {string|Date} hireDate - 입사일 (yyyy-MM-dd 형식 문자열 또는 Date 객체)
 * @returns {number} - 발생한 휴가 일수
 */
export const calculateTotalAccumulatedDays = (hireDate) => {
  if (!hireDate) return 0;

  // 문자열을 Date 객체로 변환
  const hireDateObj =
    typeof hireDate === "string" ? parseISO(hireDate) : hireDate;

  const currentDate = new Date();

  // 입사일이 현재보다 미래인 경우
  if (isBefore(currentDate, hireDateObj)) return 0;

  // 입사 후 지난 월 수 계산
  const monthsSinceHire = differenceInCalendarMonths(currentDate, hireDateObj);

  // 매월 1일씩 발생하는 휴가일
  return Math.max(0, monthsSinceHire);
};

/**
 * 특정 사용자의 휴가 정보를 조회합니다.
 *
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} - 휴가 정보 객체 {hireDate, usedVacationDays, totalAccumulatedDays, remainingVacationDays}
 */
export const getUserVacationInfo = async (userId) => {
  if (!userId) return null;

  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();

      // 입사일 처리
      let hireDate = null;

      if (userData.hireDate) {
        // Timestamp 객체인 경우
        if (userData.hireDate instanceof Timestamp) {
          hireDate = format(userData.hireDate.toDate(), "yyyy-MM-dd");
        }
        // 문자열인 경우
        else if (typeof userData.hireDate === "string") {
          hireDate = userData.hireDate;
        }
      }

      // 입사일이 없으면 현재 날짜로 설정
      if (!hireDate) {
        hireDate = format(new Date(), "yyyy-MM-dd");
      }

      // 기사용 휴가 일수
      const usedVacationDays = userData.usedVacationDays || 0;

      // 입사일부터 지금까지 누적된 사용 가능 휴가 일수
      const totalAccumulatedDays = calculateTotalAccumulatedDays(hireDate);

      // 잔여 휴가 일수 = 누적 사용 가능 일수 - 기사용 일수
      const remainingVacationDays = Math.max(
        0,
        totalAccumulatedDays - usedVacationDays
      );

      return {
        hireDate,
        usedVacationDays, // 기사용 일수
        totalAccumulatedDays, // 누적 사용 가능 일수
        remainingVacationDays, // 잔여 휴가 일수
      };
    }

    // 사용자 문서가 없는 경우 기본값 반환
    return {
      hireDate: format(new Date(), "yyyy-MM-dd"),
      usedVacationDays: 0,
      totalAccumulatedDays: 0,
      remainingVacationDays: 0,
    };
  } catch (error) {
    console.error("휴가 정보 조회 오류:", error);
    throw error;
  }
};

/**
 * 사용자의 사용 휴가 일수를 업데이트합니다.
 *
 * @param {string} userId - 사용자 ID
 * @param {number} daysToAdd - 추가될 휴가 일수
 * @returns {Promise<boolean>} - 업데이트 성공 여부
 */
export const updateUserVacationDays = async (userId, daysToAdd) => {
  if (!userId) return false;

  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentUsedDays = userData.usedVacationDays || 0;

      // 사용 휴가 일수만 업데이트 (누적 일수는 계산으로 구함)
      await updateDoc(userDocRef, {
        usedVacationDays: currentUsedDays + daysToAdd,
      });

      return true;
    } else {
      // 사용자 문서가 없는 경우 새로 입력
      await updateDoc(userDocRef, {
        hireDate: format(new Date(), "yyyy-MM-dd"),
        usedVacationDays: daysToAdd,
      });

      return true;
    }
  } catch (error) {
    console.error("휴가 일수 업데이트 오류:", error);
    return false;
  }
};

/**
 * 사용자의 휴가 신청 기록을 조회합니다.
 *
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Array>} - 휴가 신청 기록 목록
 */
export const getUserVacationHistory = async (userId) => {
  if (!userId) return [];

  try {
    const vacationsRef = collection(db, "vacations");
    const q = query(
      vacationsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const vacations = [];

    querySnapshot.forEach((doc) => {
      vacations.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || null,
      });
    });

    return vacations;
  } catch (error) {
    console.error("휴가 기록 조회 오류:", error);
    return [];
  }
};
