// src/components/Chat/data/initialData.js
// 채팅 초기화를 위한 데이터

// 병원 부서 목록
export const DEPARTMENTS = [
  "간호팀",
  "물리치료팀",
  "원무팀",
  "방사선팀",
  "진료팀",
  "경영지원팀",
];

// 초기 웰컴 메시지
export const WELCOME_MESSAGES = {
  global:
    "안녕하세요! 전체 채팅방입니다. 여기서 모든 부서와 대화할 수 있습니다.",
  team: (department) =>
    `${department} 채팅방입니다. ${department}에 오신 것을 환영합니다.`,
};

// 초기 채팅방 설정
export const INITIAL_CHAT_ROOMS = [
  {
    id: "global-chat",
    name: "전체 채팅",
    type: "global",
  },
  ...DEPARTMENTS.map((dept) => ({
    id: `team-chat-${dept}`,
    name: `${dept} 채팅`,
    type: "team",
    departmentName: dept,
  })),
];

// 시스템 사용자 정보
export const SYSTEM_USER = {
  id: "admin",
  name: "관리자",
  role: "system",
  department: "system",
};
