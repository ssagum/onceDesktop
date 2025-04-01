/**
 * 문자열을 기반으로 결정적인 해시값을 생성합니다.
 * @param {string} str 해시할 문자열
 * @returns {number} 해시 값
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // 32비트 정수로 변환
  }
  return hash;
}

/**
 * 문자열을 기반으로 랜덤하지만 일관된 색상을 생성합니다.
 * @param {string} seed 색상 생성을 위한 시드 문자열
 * @returns {string} 16진수 색상 코드
 */
export function getRandomColor(seed) {
  // 미리 정의된 색상 배열 (접근성 좋은 색상들)
  const colors = [
    "#f87171", // 빨강
    "#fb923c", // 주황
    "#facc15", // 노랑
    "#4ade80", // 초록
    "#22d3ee", // 청록
    "#60a5fa", // 파랑
    "#a78bfa", // 보라
    "#f472b6", // 분홍
    "#78716c", // 갈색
    "#3b82f6", // 남색
  ];
  
  // 해시값을 사용하여 색상 선택
  const hash = Math.abs(hashString(seed));
  return colors[hash % colors.length];
}

/**
 * 부서에 따라 고정된 색상을 반환합니다.
 * @param {string} department 부서명
 * @returns {string} 16진수 색상 코드
 */
export function getDepartmentColor(department) {
  if (!department) return "#6b7280"; // 기본 회색
  
  const departmentColors = {
    "진료팀": "#f87171", // 빨강
    "원장팀": "#f87171", // 빨강
    "간호팀": "#60a5fa", // 파랑
    "물리치료팀": "#4ade80", // 초록
    "원무팀": "#facc15", // 노랑
    "영상의학팀": "#a78bfa", // 보라
    "경영지원팀": "#fb923c", // 주황
  };
  
  // 부서명에서 '팀' 제거
  const deptName = department.endsWith('팀') 
    ? department 
    : department + '팀';
    
  return departmentColors[deptName] || "#6b7280"; // 매핑 없으면 회색 반환
} 