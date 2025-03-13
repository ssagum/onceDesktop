import { roleOptions } from "../datas/users";

// 권한 레벨 상수 정의
export const PERMISSION_LEVEL = {
  원장: "원장",
  팀장: "팀장급",
  팀원: "일반팀원",
  게스트: "비로그인",
};

// 사용자 권한 레벨 매핑 (숫자가 클수록 높은 권한)
export const USER_ROLE_LEVEL = {
  원장: 100,
  과장: 80,
  팀장: 70,
  간호사: 50,
  간호조무사: 40,
  사원: 30,
  일반: 20,
  게스트: 0,
};

// 팀장급 역할 목록 생성
const leaderRoles = Object.values(roleOptions)
  .flat()
  .filter(
    (role) => role.includes("팀장") || role.includes("과장") || role === "원장"
  );

/**
 * 본인 확인 함수
 * @param {Object} currentUser - 현재 로그인한 사용자
 * @param {String} userId - 확인할 사용자 ID
 * @returns {Boolean} 본인 여부
 */
export const isSameUser = (currentUser, userId) => {
  if (!currentUser) return false;
  return currentUser.id === userId;
};

/**
 * 대표원장 확인 함수
 * @param {Object} userLevelData - 사용자 권한 데이터
 * @returns {Boolean} 대표원장 여부
 */
export const isHospitalOwner = (userLevelData) => {
  return userLevelData?.role === "원장";
};

/**
 * 팀장급 이상 권한 확인 함수
 * @param {Object} userLevelData - 사용자 권한 데이터
 * @returns {Boolean} 팀장급 이상 여부
 */
export const isLeaderOrHigher = (userLevelData) => {
  if (!userLevelData) return false;
  if (userLevelData.role === "원장") return true;
  return leaderRoles.includes(userLevelData.role);
};
