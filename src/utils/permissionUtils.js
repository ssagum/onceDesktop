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
  대표원장: 110, // 대표원장은 원장보다 더 높은 권한
  과장: 80,
  원무과장: 85, // 원무과장은 특별 권한
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
  .filter((role) => {
    // 명시적으로 포함 조건 정의
    return (
      role.includes("팀장") ||
      role.includes("과장") ||
      role.includes("원장") ||
      role === "과장" ||
      role === "대표원장" ||
      role === "원장"
    );
  });

// 디버깅을 위해 leader 목록 로그
console.log("팀장급 역할 목록:", leaderRoles);

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
 * @param {Object} currentUser - 현재 로그인한 사용자 객체 (선택적)
 * @returns {Boolean} 대표원장 여부
 */
export const isHospitalOwner = (userLevelData, currentUser) => {
  if (!userLevelData && !currentUser) {
    console.log("isHospitalOwner: 사용자 정보 없음");
    return false;
  }

  // Firebase에서 가져온 role을 우선 사용
  const role = currentUser?.role || userLevelData?.role || "";

  // 대표원장 여부 확인
  const isOwner = role === "대표원장";

  console.log(`isHospitalOwner 확인: 
    사용자=${userLevelData?.name || currentUser?.name || "알 수 없음"}, 
    role=${role}, 
    대표원장=${isOwner}`);

  return isOwner;
};

/**
 * 원무과장 확인 함수
 * @param {Object} userLevelData - 사용자 권한 데이터
 * @param {Object} currentUser - 현재 로그인한 사용자 객체 (선택적)
 * @returns {Boolean} 원무과장 여부
 */
export const isAdministrativeManager = (userLevelData, currentUser) => {
  if (!userLevelData && !currentUser) return false;

  // Firebase에서 가져온 정보 우선 사용
  const role = currentUser?.role || userLevelData?.role || "";
  const department = currentUser?.department || userLevelData?.department || "";

  // 팀 명칭 여부에 관계없이 부서명 비교
  const isDeptMatch = (dept) => {
    if (!dept) return false;
    return dept === "원무" || dept === "원무팀";
  };

  // 원무과장 여부 확인
  const isAdminMgr =
    role === "원무과장" ||
    (role === "과장" && isDeptMatch(department)) ||
    (role.includes("과장") && isDeptMatch(department));

  console.log(`isAdministrativeManager 확인:
    역할=${role},
    부서=${department},
    원무과장=${isAdminMgr}`);

  return isAdminMgr;
};

/**
 * 팀장급 이상 권한 확인 함수
 * @param {Object} userLevelData - 사용자 권한 데이터
 * @param {Object} currentUser - 현재 로그인한 사용자 객체 (선택적)
 * @returns {Boolean} 팀장급 이상 여부
 */
export const isLeaderOrHigher = (userLevelData, currentUser) => {
  if (!userLevelData && !currentUser) {
    console.log("isLeaderOrHigher: 사용자 정보 없음");
    return false;
  }

  // Firebase에서 가져온 정보 우선 사용
  const role = currentUser?.role || userLevelData?.role || "";
  const department = currentUser?.department || userLevelData?.department || "";
  const departmentLeader =
    currentUser?.departmentLeader || userLevelData?.departmentLeader || false;

  console.log(
    "팀장급 이상 권한 확인 - 전체 데이터:",
    JSON.stringify(userLevelData, null, 2)
  );
  console.log("팀장급 이상 권한 확인 - 역할:", role);
  console.log("팀장급 이상 권한 확인 - 부서:", department);
  console.log("팀장급 이상 권한 확인 - 팀장여부:", departmentLeader);

  // 대표원장이나 원장은 무조건 true
  if (role === "원장" || role === "대표원장") {
    console.log("원장급 권한 확인됨");
    return true;
  }

  // departmentLeader가 true이면 팀장급으로 간주
  if (departmentLeader === true) {
    console.log("팀장 여부 직접 확인됨");
    return true;
  }

  // 과장이 포함된 역할명은 모두 리더로 처리
  if (role === "과장" || role.includes("과장")) {
    console.log("과장급 권한 확인됨");
    return true;
  }

  // 역할에 팀장이 포함된 경우
  if (role.includes("팀장")) {
    console.log("팀장 포함된 역할명 확인됨");
    return true;
  }

  // 역할 레벨 기반 체크 (숫자 비교 방식)
  const roleLevel = USER_ROLE_LEVEL[role] || 0;

  if (roleLevel >= USER_ROLE_LEVEL.팀장) {
    console.log("레벨 기반 팀장급 권한 확인됨");
    return true;
  }

  // leaderRoles에 포함되어 있는지 체크 (기존 방식)
  const isLeader = leaderRoles.includes(role);
  console.log("팀장급 확인 결과:", isLeader);
  return isLeader;
};

/**
 * 휴가 신청 권한 관련 함수
 */

// 휴가 신청 승인/반려 권한 확인
export const canApproveVacation = (userLevelData, currentUser) => {
  // 대표원장만 휴가 신청 승인/반려 가능
  return isHospitalOwner(userLevelData, currentUser);
};

// 휴가 신청 조회 권한 확인 (부서별)
export const canViewDepartmentVacations = (
  userLevelData,
  currentUser,
  departmentName
) => {
  if (!userLevelData && !currentUser) return false;

  // 대표원장은 모든 부서 휴가 신청 조회 가능
  if (isHospitalOwner(userLevelData, currentUser)) return true;

  // 다른 사용자는 자신의 부서 휴가 신청만 조회 가능
  const userDepartment =
    userLevelData?.department || currentUser?.department || "";
  return userDepartment === departmentName;
};

/**
 * 비품 신청 권한 관련 함수
 */

// 비품 신청 승인/반려 권한 확인
export const canApproveStockRequest = (userLevelData, currentUser) => {
  // 대표원장만 비품 신청 승인/반려 가능
  return isHospitalOwner(userLevelData, currentUser);
};

// 승인된 비품 주문 처리 권한 확인
export const canOrderStock = (userLevelData, currentUser) => {
  // 대표원장 또는 원무과장만 승인된 비품 주문 처리 가능
  return (
    isHospitalOwner(userLevelData, currentUser) ||
    isAdministrativeManager(userLevelData, currentUser)
  );
};

// 비품 신청 조회 권한 확인
export const canViewStockRequests = (
  userLevelData,
  currentUser,
  departmentName
) => {
  if (!userLevelData && !currentUser) return false;

  // 대표원장은 모든 부서 비품 신청 조회 가능
  if (isHospitalOwner(userLevelData, currentUser)) return true;

  // 원무과장은 모든 부서 비품 신청 조회 가능
  if (isAdministrativeManager(userLevelData, currentUser)) return true;

  // 다른 사용자는 자신의 부서 비품 신청만 조회 가능
  const userDepartment =
    userLevelData?.department || currentUser?.department || "";
  return userDepartment === departmentName;
};

// 장바구니 조회 권한 확인
export const canViewStockCart = (
  userLevelData,
  currentUser,
  departmentName
) => {
  if (!userLevelData && !currentUser) return false;

  // 모든 사용자는 자신의 부서 장바구니만 조회 가능
  const userDepartment =
    userLevelData?.department || currentUser?.department || "";
  return userDepartment === departmentName;
};

/**
 * 요청 관리 권한 관련 함수
 */

// 요청 승인/반려 권한 확인
export const canManageRequest = (userLevelData, currentUser) => {
  // 팀장급 이상만 요청 승인/반려 가능
  return isLeaderOrHigher(userLevelData, currentUser);
};

/**
 * 업무분장 페이지 접근 권한 확인 함수
 * @param {Object} userLevelData - 사용자 권한 데이터
 * @param {Object} currentUser - 현재 로그인한 사용자 객체 (선택적)
 * @returns {Boolean} 업무분장 페이지 접근 가능 여부
 */
export const canAccessTaskManagement = (userLevelData, currentUser) => {
  if (!userLevelData && !currentUser) return false;
  return isLeaderOrHigher(userLevelData, currentUser);
};

/**
 * 사용자 역할에 따라 볼 수 있는 폴더 목록 반환 함수
 * @param {Object} userLevelData - 사용자 권한 데이터
 * @param {Object} currentUser - 현재 로그인한 사용자 객체 (선택적)
 * @returns {Array} 볼 수 있는 폴더 ID 목록
 */
export const getVisibleFolders = (userLevelData, currentUser) => {
  if (!userLevelData && !currentUser) {
    console.error("사용자 정보가 없음 (undefined/null)");
    return [];
  }

  // Firebase에서 가져온 정보 우선 사용
  const role = currentUser?.role || userLevelData?.role || "";
  const department = currentUser?.department || userLevelData?.department || "";
  const departmentLeader =
    currentUser?.departmentLeader || userLevelData?.departmentLeader || false;

  console.log(
    "권한 체크 - 사용자 정보 전체:",
    JSON.stringify(userLevelData, null, 2)
  );
  console.log("권한 체크 - 역할:", role);
  console.log("권한 체크 - 부서:", department);
  console.log("권한 체크 - 팀장여부:", departmentLeader);

  // 팀장급 권한 여부 확인
  const isLeader = isLeaderOrHigher(userLevelData, currentUser);
  console.log("팀장급 이상 권한 여부:", isLeader);

  // 팀장급이 아닌 경우 (일반 팀원인 경우)
  if (!isLeader) {
    console.log("일반 팀원 권한 - 업무분장 폴더 접근 제한");
    return [];
  }

  // 대표원장은 모든 폴더를 볼 수 있음
  if (role === "대표원장" || role === "원장") {
    console.log("대표원장/원장 권한 확인됨 - 모든 폴더 접근 허용");
    return [
      "미배정",
      "대표원장",
      "진료팀",
      "경영지원팀",
      "간호팀장",
      "물리치료팀장",
      "원무과장",
      "영상의학팀장",
      "간호팀",
      "물리치료팀",
      "원무팀",
      "영상의학팀",
    ];
  }

  // 기본적으로 모든 팀장은 미배정 폴더를 볼 수 있음
  const folders = ["미배정"];

  console.log("역할명 확인:", role);
  console.log("부서명 확인:", department);

  // 원무과장 특별 처리 - 원무과장은 영상의학 관련 폴더도 봐야 함
  if (
    role === "원무과장" ||
    (role.includes("과장") && department.includes("원무"))
  ) {
    console.log("원무과장 권한 확인 - 원무 및 영상의학 폴더 접근 허용");
    folders.push("원무과장", "원무팀", "영상의학팀장", "영상의학팀");
    return folders;
  }

  // 역할 또는 부서 기반으로 권한 설정
  const checkDepartment = (keyword) => {
    return role.includes(keyword) || department.includes(keyword);
  };

  // 간호 관련
  if (checkDepartment("간호")) {
    console.log("간호 관련 권한 확인");
    folders.push("간호팀장", "간호팀");
  }

  // 물리치료 관련
  if (checkDepartment("물리치료")) {
    console.log("물리치료 관련 권한 확인");
    folders.push("물리치료팀장", "물리치료팀");
  }

  // 영상의학 관련
  if (checkDepartment("영상의학")) {
    console.log("영상의학 관련 권한 확인");
    folders.push("영상의학팀장", "영상의학팀");
  }

  // 원무 관련 (과장 제외)
  if (
    checkDepartment("원무") &&
    role !== "원무과장" &&
    !role.includes("과장")
  ) {
    console.log("원무 관련 권한 확인 (과장 제외)");
    folders.push("원무과장", "원무팀");
  }

  // 경영지원 관련
  if (checkDepartment("경영지원")) {
    console.log("경영지원 관련 권한 확인");
    folders.push("경영지원팀", "경영지원팀장");
  }

  console.log("접근 가능한 폴더 목록:", folders);
  return folders;
};
