// notification.mp3 파일 가져오기
import notificationFile from "./notification.mp3";

// 기본 내보내기 (이 방식이 이전에 잘 작동했음)
export const notification = notificationFile;

// 대체용 Base64 인코딩 데이터 (파일 로드 실패 시 사용)
export const NOTIFICATION_BASE64 = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADkAD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwBK8AAAAAAAAAABSAJAJAQgAAgAAAA5C5lNQxAAAAAAAAAAAAAAAAAAAA//sQxAADGAV+0AEZIAAAPQAAAALIAP//LxlQYAAAAAFsj38n8J/4z///////////////////////////////8ud9dlvJMj8kX/////////////////////////2MwZcUKDcG4KFQ09sb0YF4n//sQxA8DwD19ugmngwVULbyQxjBgchkTsXGRV//////////////9Cf4J/QAAAAAAAAAAO45c8IViigjIx4Rho6E+JeUwYlMCYEwAKlAA";

// 추가 경로 (호환성을 위해 유지)
export const NOTIFICATION_PATH = "/notification.mp3"; 