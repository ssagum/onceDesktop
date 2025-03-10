import { format, isValid, parse, parseISO } from "date-fns";

/**
 * 다양한 형식의 날짜 값을 안전하게 처리하는 함수
 * @param {any} dateValue - 처리할 날짜 값
 * @param {string} formatString - 반환할 날짜 형식 (기본값: "yyyy/MM/dd")
 * @returns {string} - 포맷팅된 날짜 문자열
 */
export const formatSafeDate = (dateValue, formatString = "yyyy/MM/dd") => {
  try {
    // null, undefined 체크
    if (!dateValue) {
      return format(new Date(), formatString);
    }

    let dateObj;

    // 다양한 날짜 형식 처리
    if (dateValue instanceof Date) {
      // 이미 Date 객체인 경우
      dateObj = dateValue;
    } else if (typeof dateValue === "object" && dateValue.seconds) {
      // Firestore 타임스탬프 처리
      dateObj = new Date(dateValue.seconds * 1000);
    } else if (typeof dateValue === "number") {
      // 타임스탬프(밀리초) 처리
      dateObj = new Date(dateValue);
    } else if (typeof dateValue === "string") {
      // 문자열 날짜 처리
      // ISO 형식 시도 (YYYY-MM-DD...)
      try {
        dateObj = parseISO(dateValue);
        if (!isValid(dateObj)) throw new Error("Invalid ISO date");
      } catch {
        // 일반 날짜 문자열 처리
        dateObj = new Date(dateValue);
      }
    } else {
      // 기타 케이스는 현재 날짜 사용
      return format(new Date(), formatString);
    }

    // 생성된 Date 객체 유효성 검사
    if (!isValid(dateObj)) {
      return format(new Date(), formatString);
    }

    // 유효한 날짜를 원하는 형식으로 포맷팅
    return format(dateObj, formatString);
  } catch (error) {
    console.error("날짜 포맷팅 중 오류:", error, "원본 값:", dateValue);
    return format(new Date(), formatString);
  }
};

/**
 * 문자열 날짜를 Date 객체로 안전하게 변환
 * @param {string} dateString - 날짜 문자열 (yyyy/MM/dd 형식)
 * @returns {Date} - 변환된 Date 객체 (시간은 00:00:00으로 설정)
 */
export const parseToDateWithoutTime = (dateString) => {
  try {
    if (!dateString) return new Date();

    // Date 객체가 직접 전달된 경우 처리
    if (dateString instanceof Date) {
      return new Date(
        dateString.getFullYear(),
        dateString.getMonth(),
        dateString.getDate(),
        0,
        0,
        0
      );
    }

    // Timestamp 객체인 경우 처리 (Firebase)
    if (typeof dateString === "object" && dateString.seconds) {
      const date = new Date(dateString.seconds * 1000);
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0,
        0,
        0
      );
    }

    // 문자열이 아닌 경우 문자열로 변환 시도
    if (typeof dateString !== "string") {
      console.warn("문자열이 아닌 값이 전달됨:", dateString);
      dateString = String(dateString);
    }

    // 날짜 파싱 시도
    const parsedDate = parse(dateString, "yyyy/MM/dd", new Date());

    if (!isValid(parsedDate)) {
      return new Date();
    }

    // 시간 부분을 00:00:00으로 설정 (시간 정보 제거)
    return new Date(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate(),
      0,
      0,
      0
    );
  } catch (error) {
    console.error("날짜 파싱 중 오류:", error, dateString);
    return new Date();
  }
};

/**
 * Date 객체를 Firestore 저장용 Date 객체로 변환 (시간 정보 제거)
 * @param {string} dateString - yyyy/MM/dd 형식의 날짜 문자열
 * @returns {Date} - Firestore 저장용 Date 객체
 */
export const convertToFirestoreDate = (dateString) => {
  return parseToDateWithoutTime(dateString);
};

/**
 * 한글 날짜 형식을 파싱하는 함수
 * @param {string} koreanDateString - 한글 날짜 문자열 (예: 2023년 5월 1일)
 * @returns {Date|null} - 파싱된 Date 객체 또는 null
 */
export const parseKoreanDate = (koreanDateString) => {
  try {
    if (!koreanDateString || typeof koreanDateString !== "string") return null;

    const yearMatch = koreanDateString.match(/(\d+)년/);
    const monthMatch = koreanDateString.match(/(\d+)월/);
    const dayMatch = koreanDateString.match(/(\d+)일/);

    if (!yearMatch || !monthMatch) return null;

    const year = parseInt(yearMatch[1]);
    const month = parseInt(monthMatch[1]) - 1; // JavaScript의 월은 0부터 시작
    const day = dayMatch ? parseInt(dayMatch[1]) : 1;

    const dateObj = new Date(year, month, day);
    return isValid(dateObj) ? dateObj : null;
  } catch (error) {
    console.error("한글 날짜 파싱 오류:", error, koreanDateString);
    return null;
  }
};
