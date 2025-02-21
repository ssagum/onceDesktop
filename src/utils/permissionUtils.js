import { roleOptions, locationOptions } from "../datas/users";

// 권한 레벨 상수 정의
export const PERMISSION_LEVEL = {
  원장: "원장",
  팀장: "팀장급",
  팀원: "일반팀원",
};

// 팀장급만 가능한 작업 정의
export const LEADER_ONLY_ACTIONS = [
  "공지사항_등록",
  "직원_평가",
  "근무일정_관리",
  "업무_승인",
  "보고서_제출",
];

// 팀장급 역할 목록 생성
const leaderRoles = Object.values(roleOptions)
  .flat()
  .filter(
    (role) => role.includes("팀장") || role.includes("과장") || role === "원장"
  );

// 기본 권한 체크 유틸리티 함수들
export const checkPermissions = {
  // 원장님 권한 체크
  isHospitalOwner: (userLevelData) => {
    return userLevelData.role === "원장";
  },

  // 팀장급 이상 권한 체크
  isLeaderOrHigher: (userLevelData) => {
    if (userLevelData.role === "원장") return true;
    return leaderRoles.includes(userLevelData.role);
  },

  // 특정 부서 소속 여부 체크
  isFromDepartment: (userLevelData, department) => {
    if (userLevelData.role === "원장") return true;
    return userLevelData.department === department;
  },

  // 특정 위치에서의 작업 권한 체크
  hasLocationAccess: (userLevelData, requiredLocation) => {
    if (userLevelData.role === "원장") return true;
    return userLevelData.location === requiredLocation;
  },

  // 수정 권한 체크 (같은 위치 또는 원장)
  canModifyContent: (userLevelData, contentLocation) => {
    if (userLevelData.role === "원장") return true;
    return userLevelData.location === contentLocation;
  },

  // 부서 업무 수행 권한 체크 추가
  canPerformDepartmentTask: (userLevelData, taskType) => {
    if (userLevelData.role === "원장") return true;
    // 팀장급은 모든 부서 업무 수행 가능
    if (leaderRoles.includes(userLevelData.role)) return true;
    // 일반 팀원은 LEADER_ONLY_ACTIONS에 포함된 작업은 수행 불가
    return !LEADER_ONLY_ACTIONS.includes(taskType);
  },

  // 팀장급 업무 수행 권한 체크 추가
  canPerformLeaderTask: (userLevelData, taskType) => {
    if (userLevelData.role === "원장") return true;
    return leaderRoles.includes(userLevelData.role);
  },
};

// 권한 조합 체크 함수
export const hasPermission = (
  userLevelData,
  requiredPermission,
  additionalData = {}
) => {
  // 원장님은 모든 권한 보유
  if (userLevelData?.role === "원장") return true;

  const { taskType, location, department } = additionalData;

  switch (requiredPermission) {
    case "DEPARTMENT_TASK":
      return checkPermissions.canPerformDepartmentTask(userLevelData, taskType);
    case "LEADER_TASK":
      return checkPermissions.canPerformLeaderTask(userLevelData, taskType);
    case "LOCATION_ACCESS":
      return checkPermissions.hasLocationAccess(userLevelData, location);
    case "MODIFY_CONTENT":
      return checkPermissions.canModifyContent(userLevelData, location);
    case "DEPARTMENT_ACCESS":
      return checkPermissions.isFromDepartment(userLevelData, department);
    default:
      return false;
  }
};

// 간단한 권한 체크 함수
export const isLeaderOnly = (userLevelData) => {
  if (!userLevelData) {
    alert("사용자 정보가 없습니다.");
    return false;
  }

  const hasPermission =
    userLevelData.role === "원장" || leaderRoles.includes(userLevelData.role);

  if (!hasPermission) {
    alert("팀장급 이상만 접근 가능한 기능입니다.");
  }

  return hasPermission;
};
