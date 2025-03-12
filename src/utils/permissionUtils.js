import { roleOptions, locationOptions } from "../datas/users";

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

// 팀장급만 가능한 작업 정의
export const LEADER_ONLY_ACTIONS = [
  "공지사항_등록",
  "직원_평가",
  "근무일정_관리",
  "업무_승인",
  "보고서_제출",
];

// 로그인 필요 페이지/기능
export const LOGIN_REQUIRED_FEATURES = [
  "메시지_전송",
  "근무일정_조회",
  "환자정보_조회",
  "처방_입력",
  "차트_작성",
];

// 팀장급 역할 목록 생성
const leaderRoles = Object.values(roleOptions)
  .flat()
  .filter(
    (role) => role.includes("팀장") || role.includes("과장") || role === "원장"
  );

// 사용자 역할 레벨 계산
export const calculateRoleLevel = (role) => {
  if (!role) return USER_ROLE_LEVEL.게스트;

  // 정확한 역할 매칭
  if (USER_ROLE_LEVEL[role] !== undefined) return USER_ROLE_LEVEL[role];

  // 부분 매칭 (접미사 기반)
  for (const [roleKey, level] of Object.entries(USER_ROLE_LEVEL)) {
    if (role.includes(roleKey)) return level;
  }

  return USER_ROLE_LEVEL.일반;
};

// 기본 권한 체크 유틸리티 함수들
export const checkPermissions = {
  // 로그인 상태 체크
  isLoggedIn: (userLevelData, currentUser) => {
    return !!currentUser;
  },

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

  // 최소 역할 레벨 체크
  hasMinimumRoleLevel: (userLevelData, requiredLevel) => {
    if (!userLevelData || !userLevelData.role) return false;
    const userLevel = calculateRoleLevel(userLevelData.role);
    return userLevel >= requiredLevel;
  },
};

// 권한 조합 체크 함수
export const hasPermission = (
  userLevelData,
  requiredPermission,
  additionalData = {}
) => {
  // 권한 체크 전에 userLevelData가 있는지 확인
  if (!userLevelData) return false;

  // 원장님은 모든 권한 보유
  if (userLevelData?.role === "원장") return true;

  const { taskType, location, department, currentUser, requiredLevel } =
    additionalData;

  switch (requiredPermission) {
    case "LOGIN_REQUIRED":
      return !!currentUser;
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
    case "MINIMUM_ROLE_LEVEL":
      return checkPermissions.hasMinimumRoleLevel(userLevelData, requiredLevel);
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

/**
 * 사용자 접근 권한을 확인하는 함수
 * @param {Object} userLevelData - 사용자 레벨 데이터
 * @param {Object} currentUser - 현재 로그인한 사용자 정보
 * @param {Function} showToast - 토스트 메시지 표시 함수
 * @param {String} minLevel - 최소 필요 권한 레벨
 * @returns {Boolean} 접근 가능 여부
 */
export const checkAccessPermission = (
  userLevelData,
  currentUser,
  showToast,
  minLevel = "팀장"
) => {
  // 로그인 체크
  if (!currentUser) {
    showToast && showToast("로그인이 필요한 기능입니다.", "error");
    return false;
  }

  // 사용자 정보가 없는 경우
  if (!userLevelData) {
    showToast && showToast("사용자 정보가 없습니다.", "error");
    return false;
  }

  // 역할 레벨 확인
  const userRoleLevel = calculateRoleLevel(userLevelData.role);
  const requiredLevel = USER_ROLE_LEVEL[minLevel] || USER_ROLE_LEVEL.팀장;

  if (userRoleLevel < requiredLevel) {
    showToast &&
      showToast(`${minLevel}급 이상만 접근 가능한 기능입니다.`, "warning");
    return false;
  }

  return true;
};

/**
 * 컴포넌트 표시 여부 결정하는 함수
 * @param {Object} userLevelData - 사용자 레벨 데이터
 * @param {Object} currentUser - 현재 로그인한 사용자
 * @param {String} componentId - 컴포넌트 ID
 * @returns {Boolean} 표시 여부
 */
export const shouldShowComponent = (
  userLevelData,
  currentUser,
  componentId
) => {
  // 로그인 필요 컴포넌트 체크
  const loginRequiredComponents = {
    환자차트: true,
    처방전관리: true,
    메시지함: true,
    관리자설정: true,
  };

  if (loginRequiredComponents[componentId] && !currentUser) {
    return false;
  }

  // 부서별 컴포넌트 표시 규칙
  const departmentComponents = {
    간호팀: ["간호스테이션", "환자관리", "투약관리"],
    의사팀: ["진료실", "처방관리", "검사결과"],
    원무과: ["접수", "수납", "예약관리"],
    행정팀: ["인사관리", "재고관리", "구매발주"],
  };

  // 역할별 컴포넌트 표시 규칙 (최소 역할 레벨)
  const roleBasedComponents = {
    관리자설정: USER_ROLE_LEVEL.팀장,
    직원평가: USER_ROLE_LEVEL.팀장,
    통계분석: USER_ROLE_LEVEL.과장,
    시스템설정: USER_ROLE_LEVEL.원장,
  };

  // 부서 기반 체크
  if (userLevelData?.department) {
    const deptComponents = departmentComponents[userLevelData.department] || [];
    if (deptComponents.includes(componentId)) {
      return true;
    }
  }

  // 역할 레벨 기반 체크
  if (componentId in roleBasedComponents && userLevelData?.role) {
    const userLevel = calculateRoleLevel(userLevelData.role);
    return userLevel >= roleBasedComponents[componentId];
  }

  // 원장은 모든 컴포넌트 접근 가능
  if (userLevelData?.role === "원장") {
    return true;
  }

  // 기본 컴포넌트 (로그인 불필요)
  const defaultComponents = ["홈", "공지사항", "병원소개", "오시는길"];
  return defaultComponents.includes(componentId);
};

/**
 * 버튼/액션 활성화 여부 결정하는 함수
 * @param {Object} userLevelData - 사용자 레벨 데이터
 * @param {Object} currentUser - 현재 로그인한 사용자
 * @param {String} actionId - 액션 ID
 * @returns {Boolean} 활성화 여부
 */
export const isActionEnabled = (userLevelData, currentUser, actionId) => {
  // 로그인 필요한 액션
  if (!currentUser) {
    return false;
  }

  // 원장은 모든 액션 가능
  if (userLevelData?.role === "원장") {
    return true;
  }

  // 액션별 권한 규칙
  const actionRules = {
    공지사항등록: (user) => leaderRoles.includes(user.role),
    환자정보수정: (user) =>
      user.department === "간호팀" || user.department === "의사팀",
    처방전생성: (user) =>
      user.department === "의사팀" && user.role.includes("의사"),
    환자배정: (user) => leaderRoles.includes(user.role),
    업무승인: (user) => leaderRoles.includes(user.role),
    삭제권한: (user) => calculateRoleLevel(user.role) >= USER_ROLE_LEVEL.팀장,
  };

  return actionRules[actionId] ? actionRules[actionId](userLevelData) : false;
};
