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

  // 대표원장이나 원장은 무조건 true
  if (role === "원장" || role === "대표원장") {
    console.log("원장급 권한 확인됨");
    return true;
  }

  // 과장이 포함된 역할명은 모두 리더로 처리
  if (role === "과장" || role.includes("과장")) {
    console.log("과장급 권한 확인됨");
    return true;
  }

  // 원무과장 케이스 명시적으로 체크 (역할 이름에 "원무과장"이 포함되어 있지 않은 경우도 처리)
  if (isAdministrativeManager(userLevelData, currentUser)) {
    console.log("원무과장 권한 확인됨");
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

  // 팀장급 권한 여부 확인
  const isLeader = isLeaderOrHigher(userLevelData, currentUser);

  // 팀장급이 아닌 경우 (일반 팀원인 경우)
  if (!isLeader) {
    return [];
  }

  // 대표원장은 모든 폴더를 볼 수 있음
  if (role === "대표원장" || role === "원장") {
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

  // 원무과장 특별 처리 - 원무과장은 영상의학 관련 폴더도 봐야 함
  if (
    role === "원무과장" ||
    (role.includes("과장") && department.includes("원무"))
  ) {
    folders.push("원무과장", "원무팀", "영상의학팀장", "영상의학팀");
    return folders;
  }

  // 역할 또는 부서 기반으로 권한 설정
  const checkDepartment = (keyword) => {
    return role.includes(keyword) || department.includes(keyword);
  };

  // 간호 관련
  if (checkDepartment("간호")) {
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
    folders.push("원무과장", "원무팀");
  }

  // 경영지원 관련
  if (checkDepartment("경영지원")) {
    folders.push("경영지원팀", "경영지원팀장");
  }

  return folders;
};

// 역할과 부서를 결합하여 구체적인 직함을 생성하는 유틸리티 함수
export const getSpecificRoleTitle = (role, department) => {
  if (!role || !department) return role || "";

  // 부서에서 '팀' 접미사 정리
  const deptBase = department.endsWith("팀")
    ? department.slice(0, -1)
    : department;

  // 팀장인 경우
  if (role === "팀장") {
    return `${deptBase}팀장`;
  }

  // 과장인 경우
  if (role === "과장") {
    return `${deptBase}과장`;
  }

  // 대표원장 또는 원장인 경우
  if (role === "원장" || role === "대표원장") {
    return "대표원장";
  }

  // 기타 역할은 그대로 반환
  return role;
};

/**
 * 사용자 역할/부서 및 필드 타입('writer' 또는 'assignee')에 따라 허용된 Task 선택 옵션 목록을 반환합니다.
 * @param {Object} userLevelData - 사용자 권한 데이터.
 * @param {Object} currentUser - 현재 로그인한 사용자 객체 (선택적).
 * @param {String} fieldType - 'writer' 또는 'assignee'.
 * @returns {Array} 허용된 선택 문자열 목록.
 */
export const getAllowedTaskSelections = (
  userLevelData,
  currentUser,
  fieldType
) => {
  // 비로그인 상태 처리: 사용자 정보 없으면 빈 배열 반환
  if (!userLevelData && !currentUser) {
    console.log("getAllowedTaskSelections: 사용자 정보 없음 (비로그인 상태)");
    return [];
  }

  const role = currentUser?.role || userLevelData?.role || "";
  const department = currentUser?.department || userLevelData?.department || "";

  // 기존에 정의된 팀장급 역할 목록 사용
  const allLeaders = leaderRoles; // 대표원장, 팀장, 과장 등

  // 부서 이름으로 팀장 역할 이름 가져오는 헬퍼 함수
  const getLeaderRole = (dept) => {
    if (!dept) return null;

    // 부서명 정리 (앞뒤 공백 제거 및 소문자 변환)
    const cleanDept = dept.trim().toLowerCase();

    // 정확한 매핑
    const departmentMappings = {
      경영지원: "경영지원팀장",
      경영지원팀: "경영지원팀장",
      원무: "원무과장",
      원무팀: "원무과장",
      간호: "간호팀장",
      간호팀: "간호팀장",
      물리치료: "물리치료팀장",
      물리치료팀: "물리치료팀장",
      영상의학: "영상의학팀장",
      영상의학팀: "영상의학팀장",
      진료: "대표원장",
      진료팀: "대표원장",
    };

    // 정확한 매핑 먼저 시도
    if (departmentMappings[cleanDept]) {
      return departmentMappings[cleanDept];
    }

    // 포함 관계로 일치 시도
    if (cleanDept.includes("경영") || cleanDept.includes("지원"))
      return "경영지원팀장";
    if (cleanDept.includes("원무")) return "원무과장";
    if (cleanDept.includes("간호")) return "간호팀장";
    if (cleanDept.includes("물리") || cleanDept.includes("치료"))
      return "물리치료팀장";
    if (cleanDept.includes("영상") || cleanDept.includes("의학"))
      return "영상의학팀장";
    if (
      cleanDept.includes("진료") ||
      cleanDept.includes("의사") ||
      cleanDept.includes("원장")
    )
      return "대표원장";

    // 마지막 방어막: 부서명에 "팀"이 있는 경우 팀장 역할 추론
    if (cleanDept.includes("팀")) {
      const baseName = cleanDept.replace("팀", "").trim();
      if (baseName) {
        return `${baseName}팀장`;
      }
    }

    console.warn(`부서 "${dept}"에 해당하는 팀장 역할을 찾을 수 없습니다.`);
    return null;
  };

  let allowed = [];

  if (fieldType === "writer") {
    // --- 작성자 선택 로직 (요구사항 반영) ---
    const isOwner = isHospitalOwner(userLevelData, currentUser);
    const isLeader = isLeaderOrHigher(userLevelData, currentUser);
    const isAdminMgr = isAdministrativeManager(userLevelData, currentUser);

    if (isOwner) {
      // 대표원장: 자신의 부서와 "대표원장" 역할만 선택 가능
      allowed.push("대표원장");
      if (department) {
        const deptWithTeam = department.endsWith("팀")
          ? department
          : `${department}팀`;
        allowed.push(deptWithTeam);
      }
    } else if (isAdminMgr) {
      // 원무과장: 정확한 직함을 사용
      allowed.push("원무과장");
    } else if (isLeader) {
      // 팀장/과장: 부서와 연계된 구체적인 직함 사용
      const specificRole = getSpecificRoleTitle(role, department);
      allowed.push(specificRole);
    } else {
      // 일반 사용자: 자신의 부서만 선택 가능
      if (department) {
        const deptWithTeam = department.endsWith("팀")
          ? department
          : `${department}팀`;
        allowed.push(deptWithTeam);
      } else {
        // 부서 정보 없을 시 기본값
        allowed.push("대표원장");
      }
    }

    // 미배정은 항상 제외
    allowed = allowed.filter((option) => option !== "미배정");
  } else if (fieldType === "assignee") {
    // --- 담당자 선택 로직 ---
    allowed.push("미배정"); // 항상 미배정 포함

    if (isHospitalOwner(userLevelData, currentUser)) {
      // 대표원장: 모든 역할/팀 선택 가능 (+미배정)
      allowed.push(
        ...Object.values(roleOptions)
          .flat()
          .filter((opt) => opt !== "미배정")
      );
    } else if (isAdministrativeManager(userLevelData, currentUser)) {
      // 원무과장: 자신, 원무팀, 영상의학 관련, 미배정
      allowed.push("원무과장"); // 자신
      allowed.push("원무팀"); // 원무팀

      // 원무과장은 영상의학 관련 폴더 접근 권한 있음
      const radiologyTeam = "영상의학팀";
      const radiologyLeader = "영상의학팀장";
      allowed.push(radiologyTeam);
      allowed.push(radiologyLeader);
    } else if (isLeaderOrHigher(userLevelData, currentUser)) {
      // 팀장/과장: 부서와 연계된 구체적인 직함 사용
      const specificRole = getSpecificRoleTitle(role, department);
      allowed.push(specificRole); // 구체적인 직함

      // 자신의 팀 이름 생성
      if (department) {
        const teamName = department.endsWith("팀")
          ? department
          : `${department}팀`;
        allowed.push(teamName);
      }
    } else {
      // 팀원: 자신의 팀과 미배정만 선택 가능 (팀장 옵션 제거)
      // 자신의 팀 이름 생성
      if (department) {
        const teamName = department.endsWith("팀")
          ? department
          : `${department}팀`;
        allowed.push(teamName);
      }
      // 주의: 팀장 옵션은 더 이상 추가하지 않음
    }
  }

  // 최종 반환 전 중복 제거
  const uniqueAllowed = [...new Set(allowed)];

  // --- 최종 필터링을 위한 모든 유효한 옵션 목록 생성 ---
  const allValidOptionsForFiltering = [];
  Object.entries(roleOptions).forEach(([departmentKey, roles]) => {
    // 팀 이름 생성
    let teamName = null;
    if (roles.includes("팀원") && departmentKey !== "대표원장") {
      if (departmentKey.endsWith("팀")) teamName = departmentKey;
      else {
        const mappings = {
          원무: "원무팀",
          경영지원: "경영지원팀",
          진료: "진료팀",
          간호: "간호팀",
          물리치료: "물리치료팀",
          영상의학: "영상의학팀",
        };
        teamName = mappings[departmentKey] || `${departmentKey}팀`;
      }
      if (!allValidOptionsForFiltering.includes(teamName))
        allValidOptionsForFiltering.push(teamName);
    }
    // 역할 이름 추가
    roles.forEach((roleName) => {
      if (
        roleName !== "팀원" &&
        !allValidOptionsForFiltering.includes(roleName)
      ) {
        allValidOptionsForFiltering.push(roleName);
      }
    });
  });
  if (!allValidOptionsForFiltering.includes("미배정")) {
    allValidOptionsForFiltering.push("미배정");
  }
  // --- --- ---

  // 생성된 유효 옵션 목록(allValidOptionsForFiltering)을 기준으로 최종 필터링
  const finalAllowed = uniqueAllowed.filter((opt) =>
    allValidOptionsForFiltering.includes(opt)
  );

  console.log(
    `getAllowedTaskSelections 최종 반환 (${fieldType}):`,
    finalAllowed
  );
  return finalAllowed;
};
