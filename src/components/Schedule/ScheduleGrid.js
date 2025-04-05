import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import styled, { keyframes } from "styled-components";
import { format, parseISO, isToday, isEqual } from "date-fns";
import { ko } from "date-fns/locale";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  getDoc,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase";

// 요일 상수 추가
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 애니메이션 정의
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideDown = keyframes`
  from { 
    opacity: 0;
    transform: translateY(-10px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
`;

const GridContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  overflow-y: auto;
  overflow-x: auto;
  height: calc(100vh - 200px);
  min-height: 600px;
  box-sizing: border-box;
  width: 100%;

  /* 세로 스크롤바만 숨기고 가로 스크롤바는 유지 */
  &::-webkit-scrollbar:vertical {
    display: none; /* Chrome, Safari, Edge */
  }
  /* Firefox - 가로 스크롤만 표시 */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
  /* Firefox에서 세로 스크롤바만 숨기는 것은 불가능하므로 전체적으로 얇게 표시 */

  /* IE와 Edge는 세로 스크롤바만 숨기는 방법이 없어 전체 스타일 적용 */
  -ms-overflow-style: -ms-autohiding-scrollbar;
`;

const HeaderContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #fff;
  width: 100%;
  display: grid;
  grid-template-columns: ${(props) => {
    let template = "";
    for (let i = 0; i < props.$dates.length; i++) {
      template += " 50px"; // 시간 열
      for (let j = 0; j < props.$staff.length; j++) {
        template += " minmax(150px, 1fr)"; // 직원 열
      }
    }
    return template;
  }};
  grid-template-rows: 40px 40px; // 날짜 헤더와 직원 헤더를 위한 두 행
`;

const GridContent = styled.div`
  display: grid;
  grid-template-columns: ${(props) => {
    // 시간 열을 위한 커스텀 템플릿
    let template = "";

    for (let i = 0; i < props.$dates.length; i++) {
      // 각 날짜마다 첫 번째 열(시간 열)은 50px, 나머지 열은 150px 이상
      template += " 50px"; // 시간 열 (42px에서 50px로 변경)
      for (let j = 0; j < props.$staff.length; j++) {
        template += " minmax(150px, 1fr)"; // 직원 열
      }
    }

    return template;
  }};
  grid-auto-rows: 40px;
  width: 100%;
`;

const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: ${(props) => {
    // 시간 열을 위한 커스텀 템플릿
    let template = "";

    for (let i = 0; i < props.$dates.length; i++) {
      // 각 날짜마다 첫 번째 열(시간 열)은 50px, 나머지 열은 150px 이상
      template += " 50px"; // 시간 열 (42px에서 50px로 변경)
      for (let j = 0; j < props.$staff.length; j++) {
        template += " minmax(150px, 1fr)"; // 직원 열
      }
    }

    return template;
  }};
  width: 100%;
`;

const HeaderCell = styled.div`
  background-color: #f9f9f9;
  font-weight: bold;
  text-align: center;
  border-bottom: 1px solid #ddd;
  z-index: 5;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  height: 100%;
  padding: 8px;
  position: relative;

  &.date-header {
    height: 40px;
    border-bottom: 2px solid #ccc;
    z-index: 6;
  }

  &.staff-header {
    height: 40px;
    font-weight: normal;
    font-size: 0.9em;
    z-index: 6;
    border-bottom: 2px solid #ccc;
    border-right: 1px solid #eee;
    background-color: white;
  }

  .date-header-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .date {
    font-size: 1.1em;
    margin-bottom: 6px;
  }

  .business-hours {
    font-size: 0.8em;
    color: #333;
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 100%;
  }

  .hours {
    font-weight: bold;
    color: #1a56db;
  }

  .break-time {
    color: #666;
  }

  .last-reception {
    color: #d97706;
    font-weight: 500;
  }

  .closed {
    color: #ef4444;
    font-weight: 500;
  }

  .day {
    color: #666;
    font-size: 0.9em;
  }
`;

const TimeCell = styled.div`
  padding: 5px;
  background-color: ${(props) => (props.isBreakTime ? "#fff8e1" : "#f5f5f5")};
  border-right: 1px solid #ddd;
  border-bottom: ${(props) =>
    props.isHalfHour ? "1px dashed #ddd" : "1px solid #ddd"};
  text-align: center;
  font-size: 0.8em;
  position: sticky;
  left: 0;
  z-index: 1;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .break-time-label {
    font-size: 0.7em;
    color: #d97706;
    margin-top: 2px;
    font-weight: 500;
  }
`;

const Cell = styled.div`
  border-right: 1px solid #eee;
  border-bottom: ${(props) =>
    props.isHalfHour ? "1px dashed #eee" : "1px solid #ddd"};
  background-color: ${(props) => (props.isHalfHour ? "#fafafa" : "white")};
  position: relative;
  box-sizing: border-box;
`;

const StaffRow = styled.div`
  display: grid;
  grid-template-columns: ${(props) => createGridTemplate(props.columns)};
  width: 100%;
  border-bottom: 1px solid #e0e0e0;
`;

const DateHeaderCell = styled(HeaderCell)`
  background-color: #eef2f7;
`;

const GridRow = styled.div`
  display: grid;
  grid-template-columns: ${(props) => createGridTemplate(props.columns)};
  height: 40px;
  width: 100%;
  border-bottom: 1px solid #e0e0e0;

  &:nth-child(odd) {
    background-color: #fafbfc;
  }
`;

const StaffNameCell = styled.div`
  padding: 8px 5px;
  font-weight: 600;
  text-align: center;
  background-color: #f1f5f9;
  color: #2c3e50;
  border-right: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 150px;
`;

const DragSelectArea = styled.div`
  position: absolute;
  background-color: rgba(49, 130, 206, 0.15);
  border: 1.5px dashed #3182ce;
  border-radius: 3px;
  animation: ${fadeIn} 0.2s ease-out;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
`;

const AppointmentBlock = styled.div`
  position: relative;
  border-radius: 4px;
  padding: 6px 8px;
  color: #fff;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition: all 0.2s ease;
  margin: 2px;
  z-index: 5;

  &:hover {
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16);
    transform: translateY(-1px);
  }

  .appointment-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .title {
    font-weight: 600;
    font-size: 1em;
  }

  .time {
    font-size: 0.8em;
    margin-top: 4px;
    opacity: 0.9;
  }

  /* 참고사항 표시용 삼각형 */
  .notes-indicator {
    position: absolute;
    top: 0;
    right: 0;
    width: 0;
    height: 0;
    background-color: #f4a809;
  }
`;

const AppointmentForm = styled.div`
  position: absolute;
  z-index: 100;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 16px;
  width: 640px; /* 가로로 더 넓게 변경 */
  animation: ${slideDown} 0.2s ease-out;
  display: flex;
  flex-direction: column;

  h3 {
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 600;
    color: #2d3748;
    padding-bottom: 8px;
    border-bottom: 1px solid #edf2f7;
  }
`;

const FormContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const FormColumn = styled.div`
  flex: 1;
  min-width: 280px;
`;

const FormField = styled.div`
  margin-bottom: 12px;

  label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #4a5568;
    margin-bottom: 4px;
  }
`;

// 시간 입력 필드 스타일 추가
const TimeFieldContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 12px;

  .time-input-container {
    flex: 1;
    position: relative;

    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #4a5568;
      margin-bottom: 4px;
    }
  }
`;

const TimeInputWrapper = styled.div`
  position: relative;
  width: 100%;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  background-color: #f8fafc;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
    outline: none;
  }

  &::placeholder {
    color: #a0aec0;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  min-height: 70px;
  background-color: #f8fafc;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;

  &:focus {
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
    outline: none;
  }

  &::placeholder {
    color: #a0aec0;
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
`;

const Button = styled.button`
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;

  &.primary {
    background-color: #3182ce;
    color: white;

    &:hover {
      background-color: #2b6cb0;
    }

    &:active {
      transform: translateY(1px);
    }
  }

  &.secondary {
    background-color: #edf2f7;
    color: #2d3748;

    &:hover {
      background-color: #e2e8f0;
    }

    &:active {
      transform: translateY(1px);
    }
  }

  &.danger {
    background-color: #f56565;
    color: white;

    &:hover {
      background-color: #e53e3e;
    }

    &:active {
      transform: translateY(1px);
    }
  }
`;

const TypeButton = styled(Button)`
  flex: 1;
  background-color: ${(props) =>
    props.isActive ? props.activeColor : "#edf2f7"};
  color: ${(props) => (props.isActive ? "white" : "#2d3748")};

  &:hover {
    background-color: ${(props) =>
      props.isActive ? props.activeColor : "#e2e8f0"};
    opacity: ${(props) => (props.isActive ? 0.9 : 1)};
  }
`;

// 각 날짜/담당자 조합에 대한 고유 키 생성 함수
const getCellKey = (dateIndex, staffIndex, timeIndex) => {
  return `cell-${dateIndex}-${staffIndex}-${timeIndex}`;
};

// 요일별 영업시간 정보 추가
const businessHours = {
  0: {
    // 일요일
    hours: "정기휴무",
    breakTime: "",
    lastReception: "",
  },
  1: {
    // 월요일
    hours: "09:00 - 19:00",
    breakTime: "13:00 - 14:00",
    lastReception: "18:30 접수마감",
  },
  2: {
    // 화요일
    hours: "09:00 - 20:00",
    breakTime: "13:00 - 14:00",
    lastReception: "19:30 접수마감",
  },
  3: {
    // 수요일
    hours: "09:00 - 19:00",
    breakTime: "13:00 - 14:00",
    lastReception: "18:30 접수마감",
  },
  4: {
    // 목요일
    hours: "09:00 - 20:00",
    breakTime: "13:00 - 14:00",
    lastReception: "19:30 접수마감",
  },
  5: {
    // 금요일
    hours: "09:00 - 19:00",
    breakTime: "13:00 - 14:00",
    lastReception: "18:30 접수마감",
  },
  6: {
    // 토요일
    hours: "09:00 - 14:00",
    breakTime: "",
    lastReception: "13:30 접수마감",
  },
};

// 그리드 템플릿 문자열 생성 함수 수정
const createGridTemplate = (columns) => {
  if (!columns) return "1fr";
  return `repeat(${columns}, minmax(150px, 1fr))`;
};

// 선택 영역 스타일 컴포넌트 추가
const SelectionArea = styled.div`
  background-color: rgba(66, 153, 225, 0.15);
  border: 2px solid #4299e1;
  pointer-events: none;
  z-index: 4;
  border-radius: 4px;
  position: relative;
  margin: 2px;
`;

const SelectedCell = styled.div`
  position: absolute;
  background-color: rgba(66, 153, 235, 0.15);
  border: 2px solid #4299e1;
  pointer-events: none;
  z-index: 4;
  transition: all 0.1s ease;
  width: calc(100% - 4px);
  height: calc(100% - 4px);
  top: 2px;
  left: 2px;
  box-sizing: border-box;
  border-radius: 4px;
`;

// 메모 관련 스타일 컴포넌트 수정 - 기울기 제거
const MemoOverlay = styled.div`
  position: relative;
  background-color: #fff9c4;
  box-shadow: 2px 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  width: 100%;
  height: 100%;
  padding: 10px;
  margin: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #f9a825;
  // transform: rotate(1deg); - 주석 처리 대신 완전히 제거
`;

const MemoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid #f9a825;
`;

const MemoTitle = styled.div`
  font-weight: 600;
  font-size: 0.95rem;
  color: #5d4037;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const MemoCount = styled.span`
  background-color: #f9a825;
  color: #5d4037;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const MemoContent = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 50px;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #f9a825;
    border-radius: 4px;
  }
`;

const MemoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px dashed rgba(249, 168, 37, 0.3);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.5);
  }
`;

const MemoText = styled.div`
  flex: 1;
  font-size: 0.9rem;
  color: #5d4037;
  word-break: break-word;
  line-height: 1.4;
`;

// DeleteButton 스타일 수정 - 노란색으로 복원
const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #f9a825;
  font-size: 1rem;
  cursor: pointer;
  padding: 0 4px;
  margin-left: 8px;
  opacity: 0.6;
  transition: all 0.2s ease;

  &:hover {
    opacity: 1;
    color: #d84315;
  }
`;

const MemoInput = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

// 시간 문자열을 분으로 변환하는 유틸리티 함수 추가
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

// 종료 시간을 슬롯에 맞게 조정하는 함수
const getEndTime = (timeStr) => {
  // 원래 시간이 정시(00분)이 아니면 30분 또는 정시로 올림
  const [hours, minutes] = timeStr.split(":").map(Number);

  // 이미 정시면 그대로 반환
  if (minutes === 0) {
    return timeStr;
  }

  // 30분이면 다음 정시로 올림
  if (minutes === 30) {
    return `${hours + 1}:00`;
  }

  // 그 외 시간은 가장 가까운 30분 단위로 올림
  if (minutes < 30) {
    return `${hours}:30`;
  } else {
    return `${hours + 1}:00`;
  }
};

// 일정 관련 알림을 보내는 함수 추가
const sendScheduleNotification = async (action, appointmentData) => {
  try {
    // 일정 유형에 따라 수신자 결정
    const type = appointmentData.type || viewMode;
    const receiverId = type === "물리치료" ? "물리치료팀" : "진료팀";

    // 액션에 따른 메시지 생성
    let message = "";
    const staffName = appointmentData.staffName || "담당자";
    const time = `${appointmentData.startTime}-${appointmentData.endTime}`;
    const date = appointmentData.date;

    switch (action) {
      case "create":
        message = `[예약 생성] ${date} ${time} | ${staffName} | ${
          appointmentData.title || "새 예약"
        }`;
        break;
      case "update":
        message = `[예약 수정] ${date} ${time} | ${staffName} | ${
          appointmentData.title || "예약 수정"
        }`;
        break;
      case "delete":
        message = `[예약 취소] ${date} ${time} | ${staffName} | ${
          appointmentData.title || "예약 취소"
        }`;
        break;
      default:
        message = `[예약 변경] ${date} ${time} | ${staffName}`;
    }

    // 현재 시간 포맷팅
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const formattedTime = `${hours}:${minutes}`;

    // 발신자 정보 - 현재는 "일정" 고정
    const senderId = "일정";

    // call 데이터 생성
    const callData = {
      message,
      receiverId,
      senderId,
      formattedTime,
      createdAt: Date.now(),
      createdAt2: serverTimestamp(),
      type: "예약",
      [receiverId]: true,
      [senderId]: true,
    };

    // Firebase에 call 저장
    await addDoc(collection(db, "calls"), callData);
    console.log(`${receiverId}에게 ${action} 알림 전송 완료`);
  } catch (error) {
    console.error("예약 알림 전송 오류:", error);
  }
};

// 메모 관련 알림을 보내는 함수 추가
const sendMemoNotification = async (action, memoData, content) => {
  try {
    // 메모 유형에 따라 수신자 결정
    const receiverId = memoData.type === "물리치료" ? "물리치료팀" : "진료팀";

    // 액션에 따른 메시지 생성
    let message = "";
    const date = memoData.date;
    const shortContent =
      content && content.length > 20
        ? content.substring(0, 20) + "..."
        : content || "내용 없음";

    switch (action) {
      case "create":
        message = `[메모 추가] ${date} | ${memoData.type} | ${shortContent}`;
        break;
      case "delete":
        message = `[메모 삭제] ${date} | ${memoData.type} | ${shortContent}`;
        break;
      default:
        message = `[메모 변경] ${date} | ${memoData.type}`;
    }

    // 현재 시간 포맷팅
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const formattedTime = `${hours}:${minutes}`;

    // 발신자 정보 - "메모" 고정
    const senderId = "메모";

    // call 데이터 생성
    const callData = {
      message,
      receiverId,
      senderId,
      formattedTime,
      createdAt: Date.now(),
      createdAt2: serverTimestamp(),
      type: "예약",
      [receiverId]: true,
      [senderId]: true,
    };

    // Firebase에 call 저장
    await addDoc(collection(db, "calls"), callData);
    console.log(`${receiverId}에게 메모 ${action} 알림 전송 완료`);
  } catch (error) {
    console.error("메모 알림 전송 오류:", error);
  }
};

// processAppointmentSubmit 함수 수정 - 일정 생성/수정 시 알림 전송 추가
const processAppointmentSubmit = async (formData) => {
  // FormData 객체를 일반 JavaScript 객체로 변환
  const formDataObj = {};
  if (formData instanceof FormData) {
    for (let [key, value] of formData.entries()) {
      formDataObj[key] = value;
    }
  } else {
    // 이미 객체인 경우 그대로 사용
    Object.assign(formDataObj, formData);
  }

  // 필수 필드 검사
  if (!formDataObj.date || !formDataObj.startTime || !formDataObj.endTime) {
    showToast("필수 정보를 모두 입력해주세요.", "error");
    return;
  }

  // 담당자 이름 설정: staffId가 있으면 해당 staff의 이름을 찾아서 설정
  if (formDataObj.staffId && !formDataObj.staffName) {
    const selectedStaff = staff.find((s) => s.id === formDataObj.staffId);
    if (selectedStaff) {
      formDataObj.staffName = selectedStaff.name;
    }
  }

  let result = null;

  if (isEditing && selectedAppointment) {
    // 기존 일정 수정
    const updatedAppointment = {
      ...selectedAppointment,
      ...formDataObj,
      dateIndex: selectedAppointment.dateIndex,
      updatedAt: new Date().toISOString(),
    };

    console.log("업데이트할 일정 데이터:", updatedAppointment);

    // 상위 컴포넌트의 update 함수 호출
    try {
      result = await onAppointmentUpdate(updatedAppointment);

      // 일정 수정 알림 전송
      await sendScheduleNotification("update", updatedAppointment);
    } catch (error) {
      console.error("일정 업데이트 중 오류:", error);
      showToast("일정 수정 중 오류가 발생했습니다.", "error");
      return;
    }
  } else {
    // 새 일정 생성
    const newAppointment = {
      ...formDataObj,
      dateIndex: dates.findIndex(
        (date) => format(date, "yyyy-MM-dd") === formDataObj.date
      ),
      createdAt: new Date().toISOString(),
    };

    // 상위 컴포넌트의 create 함수 호출
    try {
      result = await onAppointmentCreate(newAppointment);
      showToast("일정이 추가되었습니다.", "success");

      // 일정 생성 알림 전송
      await sendScheduleNotification("create", newAppointment);
    } catch (error) {
      console.error("일정 추가 중 오류:", error);
      showToast("일정 추가 중 오류가 발생했습니다.", "error");
      return;
    }
  }

  // 폼 초기화 및 상태 리셋
  setFormData({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    staffId: "",
    staffName: "",
    notes: "",
    type: viewMode,
  });
  setShowForm(false);
  setIsEditing(false);
  setSelectedAppointment(null);

  console.log("일정 작업 완료, 결과:", result);
};

// confirmDeleteAppointment 함수 수정 - 삭제 시 알림 전송 추가
const confirmDeleteAppointment = async () => {
  try {
    if (!selectedAppointment) return;

    // 상위 컴포넌트의 delete 함수 호출
    if (onAppointmentDelete) {
      await onAppointmentDelete(selectedAppointment.id);

      // 일정 삭제 알림 전송
      await sendScheduleNotification("delete", selectedAppointment);

      showToast("일정이 삭제되었습니다.", "success");
    }

    // 모달 닫기 및 상태 초기화
    setShowDeleteModal(false);
    setShowForm(false);
    setSelectedAppointment(null);
    setIsEditing(false);
  } catch (error) {
    console.error("일정 삭제 중 오류 발생:", error);
    showToast("일정 삭제 중 오류가 발생했습니다.", "error");
  }
};

const ScheduleGrid = ({
  dates,
  timeSlots = [],
  staff = [],
  appointments: initialAppointments = [],
  vacations: initialVacations = [], // 휴가 정보 추가
  onAppointmentCreate,
  onAppointmentUpdate,
  onAppointmentDelete,
  viewMode = "진료",
  showToast,
}) => {
  const gridRef = useRef(null);
  // 초기 appointments 저장
  const [localAppointments, setLocalAppointments] = useState([]);
  const [vacations, setVacations] = useState(initialVacations); // vacations 상태 변수 추가
  const [showForm, setShowForm] = useState(false);
  const [formPosition, setFormPosition] = useState({ left: 0, top: 0 });
  const [formData, setFormData] = useState({
    title: "",
    notes: "",
    duration: "30",
    type: "예약",
    staffId: "", // 담당자 ID 추가
    staffName: "", // 담당자 이름 추가
  });
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showSelectionForm, setShowSelectionForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 담당자의 Off day 여부 확인 함수
  const isOffDay = (dateIndex, staffIndex) => {
    if (!staff[staffIndex] || !staff[staffIndex].offDays || !dates[dateIndex]) {
      return false;
    }

    const date = dates[dateIndex];
    const dayOfWeek = WEEKDAYS[date.getDay()]; // 요일 구하기 (0: 일요일, 1: 월요일, ...)

    return staff[staffIndex].offDays.includes(dayOfWeek);
  };

  // 휴가 상세 정보 모달 관련 상태 추가
  const [selectedVacation, setSelectedVacation] = useState(null);
  const [showVacationDetail, setShowVacationDetail] = useState(false);

  // 확인 모달 관련 상태 추가
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showVacationConflictModal, setShowVacationConflictModal] =
    useState(false);
  const [vacationConflictData, setVacationConflictData] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  // 메모 관련 상태 추가 - 구조 변경
  const [memos, setMemos] = useState({});
  const [newMemoItem, setNewMemoItem] = useState("");
  const [activeMemoDateIndex, setActiveMemoDateIndex] = useState(0);

  // 메모 유형 관련 상태 확인 및 사용
  const memoType = useMemo(() => {
    console.log("현재 viewMode:", viewMode);
    return viewMode === "물리치료" ? "물리치료" : "진료";
  }, [viewMode]);

  const memoTypes = ["진료", "물리치료"];

  // 선택 관련 상태
  const [selection, setSelection] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startCell, setStartCell] = useState(null);
  const [currentCell, setCurrentCell] = useState(null);

  // 그리드 행 확장 (12개 추가)
  const extendedTimeSlots = useMemo(() => {
    if (!timeSlots || timeSlots.length === 0) return [];

    // 마지막 시간 슬롯 가져오기
    const lastSlot = timeSlots[timeSlots.length - 1];
    if (!lastSlot) return timeSlots;

    const [lastHour, lastMinute] = lastSlot.split(":").map(Number);

    // 추가할 12개 슬롯 생성
    const additionalSlots = [];
    let currentHour = lastHour;
    let currentMinute = lastMinute;

    for (let i = 0; i < 12; i++) {
      // 30분 추가
      currentMinute += 30;

      // 시간 조정
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }

      // 시간 포맷팅 (00:00 형식)
      const formattedTime = `${currentHour
        .toString()
        .padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;
      additionalSlots.push(formattedTime);
    }

    return [...timeSlots, ...additionalSlots];
  }, [timeSlots]);

  // 원래 timeSlots 대신 extendedTimeSlots 사용
  const effectiveTimeSlots = extendedTimeSlots;

  // 드래그 관련 상태 변수들
  const [dragArea, setDragArea] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);

  // 일정 유형별 색상
  const appointmentTypeColors = {
    예약: "#4299e1",
    일반: "#48bb78",
    휴가: "#ed8936",
    물리치료: "#9F7AEA",
  };

  // 각 날짜 열의 최소 너비 (픽셀)
  const minColumnWidth = 150;

  // 그리드에 필요한 열 수 계산 - 각 날짜별로 시간 열 1개 + 직원 열
  const totalColumns = dates.length * (staff.length + 1);

  // 시간 변환 유틸리티 함수들
  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  // 종료 시간 계산 함수 추가
  const getEndTime = (time) => {
    const minutes = timeToMinutes(time);
    return minutesToTime(minutes + 30);
  };

  // 날짜 포맷 함수 수정 - 기존 특수 형식은 유지
  const formatDate = (date, formatStr) => {
    if (!date) return "";

    if (formatStr === "M/D") {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    } else if (formatStr === "ddd") {
      return ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
    } else {
      try {
        return format(date, formatStr || "yyyy-MM-dd");
      } catch (error) {
        console.error("날짜 형식 변환 오류:", error);
        return "";
      }
    }
  };

  // 시간 포맷 함수
  const formatTime = (time) => {
    return time;
  };

  // 30분 단위 체크
  const isHalfHour = (time) => {
    return time.endsWith(":30");
  };

  const [previousActions, setPreviousActions] = useState([]);

  // 셀 높이 상수 정의 (헤더 높이 수정)
  const cellHeight = 40;
  const headerHeight = 40 + 40; // 날짜 헤더(85px) + 직원 헤더(40px)

  // 그리드 셀 관련 상수 명시적으로 추가
  const CELL_HEIGHT = 40; // 셀 높이 픽셀 단위
  const CELL_WIDTH = 150; // 셀 너비 픽셀 단위

  // 마우스 상태 관련 변수 추가
  const [mouseDown, setMouseDown] = useState(false);
  const [clickedCell, setClickedCell] = useState(null);
  const dragTimeoutRef = useRef(null);
  const lastMoveRef = useRef({ dateIndex: -1, staffIndex: -1, timeIndex: -1 });

  // 드래그 처리 함수 개선 - 클릭과 드래그 분리
  const handleMouseDown = (e, dateIndex, staffIndex, timeIndex) => {
    e.preventDefault();
    const cell = { dateIndex, staffIndex, timeIndex };

    setStartCell(cell);
    setCurrentCell(cell);
    setIsSelecting(true);
    setSelection(null);
  };

  const handleMouseMove = (e, dateIndex, staffIndex, timeIndex) => {
    if (!isSelecting || !startCell) return;

    // 같은 날짜와 같은 직원에 대해서만 선택 가능하도록 제한
    if (
      startCell.dateIndex === dateIndex &&
      startCell.staffIndex === staffIndex
    ) {
      const minTimeIndex = Math.min(startCell.timeIndex, timeIndex);
      const maxTimeIndex = Math.max(startCell.timeIndex, timeIndex);

      // 선택 영역 업데이트
      setSelection({
        startDateIndex: dateIndex,
        endDateIndex: dateIndex,
        startStaffIndex: staffIndex,
        endStaffIndex: staffIndex,
        startTimeIndex: minTimeIndex,
        endTimeIndex: maxTimeIndex,
      });

      // 현재 셀 업데이트
      setCurrentCell({ dateIndex, staffIndex, timeIndex });
    }
  };

  // 드래그 종료를 위한 전역 mouseup 이벤트 리스너 추가
  useEffect(() => {
    const handleGlobalMouseUp = (e) => {
      if (isSelecting) {
        // 셀 내부에서 발생한 mouseup 이벤트가 아닌 경우만 처리
        // schedule-cell 클래스를 가진 요소나 그 하위 요소에서 이벤트가 발생했는지 확인
        const isInsideCell = e.target.closest(".schedule-cell");

        if (!isInsideCell) {
          // 그리드 외부에서 마우스를 놓은 경우 선택 프로세스만 종료
          setIsSelecting(false);
          setCurrentCell(null);

          // 선택된 영역이 있으면 폼 표시
          if (selection) {
            displaySelectionForm(e);
          }
        }
      }
    };

    // 문서 전체에 mouseup 이벤트 리스너 추가
    document.addEventListener("mouseup", handleGlobalMouseUp);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isSelecting, selection]); // isSelecting과 selection 상태가 변경될 때마다 이펙트 재실행

  // 선택 영역에 대한 폼을 표시하는 함수 추출
  const displaySelectionForm = (e) => {
    if (!selection) return;

    // 폼 데이터 설정
    setFormData({
      title: "",
      notes: "",
      duration: (
        (selection.endTimeIndex - selection.startTimeIndex + 1) *
        30
      ).toString(),
      type: "예약",
    });

    // 폼 위치 계산
    let left, top;

    if (e && e.clientX && e.clientY) {
      // 마우스 이벤트 좌표가 있는 경우
      left = e.clientX + 10;
      top = e.clientY;

      // 화면 경계를 벗어나지 않도록 조정
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const formWidth = 640; // 300에서 640으로 변경
      const formHeight = 350; // 400에서 350으로 변경

      if (left + formWidth > viewportWidth) {
        left = Math.max(10, left - formWidth - 20);
      }

      if (top + formHeight > viewportHeight) {
        top = Math.max(10, viewportHeight - formHeight - 10);
      }
    } else {
      // 이벤트 좌표가 없는 경우, 선택된 영역 기준으로 계산
      const { startDateIndex, startStaffIndex, startTimeIndex } = selection;
      const targetCell = document.querySelector(
        `[data-cell-key="cell-${startDateIndex}-${startStaffIndex}-${startTimeIndex}"]`
      );

      if (targetCell) {
        const rect = targetCell.getBoundingClientRect();

        // 화면 크기 가져오기
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // 오른쪽에 충분한 공간이 있는지 확인, 없으면 왼쪽에 배치
        const formWidth = 640; // 300에서 640으로 변경
        left =
          rect.right + 10 + formWidth > viewportWidth
            ? rect.left - formWidth - 10
            : rect.right + 10;

        // 화면 아래에 충분한 공간이 있는지 확인, 없으면 위에 배치
        const formHeight = 350; // 400에서 350으로 변경
        top =
          rect.top + formHeight > viewportHeight
            ? Math.max(10, rect.top - formHeight + rect.height)
            : rect.top;
      } else {
        // 기본 위치
        left = 100;
        top = 100;
      }
    }

    setFormPosition({ left, top });
    setShowForm(true);
    setCurrentCell(null); // 현재 셀 초기화
  };

  // handleMouseUp 함수 수정 - 레이블과 실제 시간 간의 매핑 처리
  const handleMouseUp = (e, dateIndex, staffIndex, timeIndex) => {
    // 선택 상태 종료
    setIsSelecting(false);

    // 단일 셀 선택으로 설정
    setSelection({
      startDateIndex: dateIndex,
      endDateIndex: dateIndex,
      startStaffIndex: staffIndex,
      endStaffIndex: staffIndex,
      startTimeIndex: timeIndex,
      endTimeIndex: timeIndex,
    });

    // 마우스 클릭 위치에 폼 표시
    let left = e.clientX + 10;
    let top = e.clientY;

    // 화면 경계를 벗어나지 않도록 조정
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const formWidth = 640; // 300에서 640으로 변경
    const formHeight = 350; // 400에서 350으로 변경

    if (left + formWidth > viewportWidth) {
      left = Math.max(10, left - formWidth - 20);
    }

    if (top + formHeight > viewportHeight) {
      top = Math.max(10, viewportHeight - formHeight - 10);
    }

    // 선택된 담당자 정보 가져오기
    const selectedStaff = staff[staffIndex];
    const staffName = selectedStaff ? selectedStaff.name : "";

    // 폼 위치 설정
    setFormPosition({ left, top });

    // 요일 확인 (평일 여부)
    const dayOfWeek = dates[dateIndex].getDay();
    const isWeekday = dayOfWeek > 0 && dayOfWeek < 6; // 월~금요일인지 확인
    const isSaturday = dayOfWeek === 6; // 토요일인지 확인

    // 표시 레이블과 실제 시간 간의 매핑 처리
    // 평일에만 적용, 토요일은 원래 시간대로 표시
    let actualStartTime;

    if (isWeekday && !isSaturday) {
      if (timeIndex === 11) {
        // 화면에 "14:00"으로 표시된 셀 (실제로는 14:30)
        actualStartTime = "14:00";
      } else if (timeIndex === 12) {
        // 화면에 "14:30"으로 표시된 셀 (실제로는 15:00)
        actualStartTime = "14:30";
      } else {
        // 다른 셀들은 실제 시간 슬롯 사용
        actualStartTime = effectiveTimeSlots[timeIndex];
      }
    } else {
      // 토요일 또는 다른 경우 실제 시간 슬롯 사용
      actualStartTime = effectiveTimeSlots[timeIndex];
    }

    // 빈 폼 데이터로 초기화 - 담당자 정보는 설정하지만 제목에는 포함하지 않음
    setFormData({
      title: "", // 제목은 빈 문자열로 설정
      notes: "",
      duration: "30",
      type: "예약",
      startTime: actualStartTime, // 매핑된 시간 사용
      endTime: getEndTime(actualStartTime), // 매핑된 시간으로 종료 시간 계산
      date: format(dates[dateIndex], "yyyy-MM-dd"),
      staffId: selectedStaff ? selectedStaff.id : "",
      staffName: staffName,
    });

    // 폼 표시
    setShowForm(true);
    setCurrentCell(null); // 현재 셀 초기화
  };

  // 일정 수정 핸들러 수정
  const handleEditAppointment = async () => {
    try {
      if (!selectedAppointment) return;

      // 선택된 일정 데이터로 폼 데이터 설정
      setFormData({
        title: selectedAppointment.title || "",
        date: selectedAppointment.date,
        startTime: selectedAppointment.startTime,
        endTime: selectedAppointment.endTime,
        staffId: selectedAppointment.staffId,
        staffName: selectedAppointment.staffName,
        notes: selectedAppointment.notes || "",
        type: selectedAppointment.type || viewMode,
      });

      // 수정 모드로 전환
      setIsEditing(true);

      // 이미 폼이 표시되어 있으므로 상태 유지
      // setShowForm은 이미 true 상태
    } catch (error) {
      console.error("일정 수정 중 오류 발생:", error);
      showToast("일정 수정 중 오류가 발생했습니다.", "error");
    }
  };

  // handleAppointmentSubmit 함수 수정
  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();

    try {
      // 수정 모드일 경우 별도 처리
      if (isEditing && selectedAppointment) {
        console.log("수정 모드에서 저장 버튼 클릭됨");

        // 폼 데이터 추출 (직접 폼 요소 또는 상태에서 추출)
        const formDataObj = {
          title: formData.title || selectedAppointment.title || "",
          date: formData.date || selectedAppointment.date,
          startTime: formData.startTime || selectedAppointment.startTime,
          endTime: formData.endTime || selectedAppointment.endTime,
          staffId: formData.staffId || selectedAppointment.staffId,
          notes: formData.notes || selectedAppointment.notes || "",
          type: formData.type || selectedAppointment.type || viewMode,
        };

        // 수정된 일정 처리
        await processAppointmentSubmit(formDataObj);
        return;
      }

      // 새 일정 생성의 경우에만 selectedCell 검사
      if (!selectedCell) {
        console.error("선택된 셀이 없습니다.");
        showToast("일정을 생성할 위치를 선택해주세요.", "error");
        return;
      }

      const { dateIndex, staffIndex, startTimeIndex, endTimeIndex } =
        selectedCell;

      // 휴가 충돌 검사 추가 - 결과만 받아옴
      const conflictResult = checkVacationConflict(
        dateIndex,
        staffIndex,
        startTimeIndex,
        endTimeIndex
      );

      // 휴가 충돌 시 확인 모달 표시
      if (conflictResult.hasConflict) {
        const vacation = conflictResult.vacation;
        const vacationType = vacation?.vacationType || "휴가";

        // 기존 window.confirm 대신 모달 표시를 위한 데이터 설정
        setVacationConflictData({
          vacation,
          vacationType,
          formDataFromForm: new FormData(e.target),
          dateIndex,
          staffIndex,
          startTimeIndex,
          endTimeIndex,
        });

        // 모달 표시
        setShowVacationConflictModal(true);
        return; // 여기서 함수 종료, 모달에서 선택 후 처리 진행
      }

      // 충돌 없는 경우 정상적으로 처리 (기존 로직)
      const formDataFromEvent = new FormData(e.target);
      await processAppointmentSubmit(formDataFromEvent);
    } catch (error) {
      console.error("일정 저장 중 오류 발생:", error);
      showToast("일정 저장 중 오류가 발생했습니다.", "error");
    }
  };

  // 약속 제출 처리를 위한 분리된 함수
  const processAppointmentSubmit = async (formData) => {
    // FormData 객체를 일반 JavaScript 객체로 변환
    const formDataObj = {};
    if (formData instanceof FormData) {
      for (let [key, value] of formData.entries()) {
        formDataObj[key] = value;
      }
    } else {
      // 이미 객체인 경우 그대로 사용
      Object.assign(formDataObj, formData);
    }

    // 필수 필드 검사
    if (!formDataObj.date || !formDataObj.startTime || !formDataObj.endTime) {
      showToast("필수 정보를 모두 입력해주세요.", "error");
      return;
    }

    // 담당자 이름 설정: staffId가 있으면 해당 staff의 이름을 찾아서 설정
    if (formDataObj.staffId && !formDataObj.staffName) {
      const selectedStaff = staff.find((s) => s.id === formDataObj.staffId);
      if (selectedStaff) {
        formDataObj.staffName = selectedStaff.name;
      }
    }

    let result = null;

    if (isEditing && selectedAppointment) {
      // 기존 일정 수정
      const updatedAppointment = {
        ...selectedAppointment,
        ...formDataObj,
        dateIndex: selectedAppointment.dateIndex,
        updatedAt: new Date().toISOString(),
      };

      console.log("업데이트할 일정 데이터:", updatedAppointment);

      // 상위 컴포넌트의 update 함수 호출
      try {
        result = await onAppointmentUpdate(updatedAppointment);

        // 일정 수정 알림 전송
        await sendScheduleNotification("update", updatedAppointment);
      } catch (error) {
        console.error("일정 업데이트 중 오류:", error);
        showToast("일정 수정 중 오류가 발생했습니다.", "error");
        return;
      }
    } else {
      // 새 일정 생성
      const newAppointment = {
        ...formDataObj,
        dateIndex: dates.findIndex(
          (date) => format(date, "yyyy-MM-dd") === formDataObj.date
        ),
        createdAt: new Date().toISOString(),
      };

      // 상위 컴포넌트의 create 함수 호출
      try {
        result = await onAppointmentCreate(newAppointment);
        showToast("일정이 추가되었습니다.", "success");

        // 일정 생성 알림 전송
        await sendScheduleNotification("create", newAppointment);
      } catch (error) {
        console.error("일정 추가 중 오류:", error);
        showToast("일정 추가 중 오류가 발생했습니다.", "error");
        return;
      }
    }

    // 폼 초기화 및 상태 리셋
    setFormData({
      title: "",
      date: "",
      startTime: "",
      endTime: "",
      staffId: "",
      staffName: "",
      notes: "",
      type: viewMode,
    });
    setShowForm(false);
    setIsEditing(false);
    setSelectedAppointment(null);

    console.log("일정 작업 완료, 결과:", result);
  };

  // 휴가 충돌 확인 모달 결과 처리 함수
  const confirmVacationConflict = async () => {
    if (!vacationConflictData) return;

    // 모달 닫기
    setShowVacationConflictModal(false);

    // 경고 토스트 표시
    if (showToast) {
      showToast(
        "의사가 휴가 중인 시간에 예약이 추가되었습니다. 조기 복귀 여부를 확인해주세요.",
        "warning"
      );
    }

    // 일정 제출 처리 계속 진행
    await processAppointmentSubmit(vacationConflictData.formDataFromForm);

    // 데이터 초기화
    setVacationConflictData(null);
  };

  // 휴가 충돌 취소 함수
  const cancelVacationConflict = () => {
    setShowVacationConflictModal(false);
    setVacationConflictData(null);
  };

  const handleDeleteAppointment = async () => {
    try {
      if (!selectedAppointment) return;

      // window.confirm 대신 모달 표시
      setShowDeleteModal(true);
    } catch (error) {
      console.error("일정 삭제 중 오류 발생:", error);
      showToast("일정 삭제 중 오류가 발생했습니다.", "error");
    }
  };

  // 일정 삭제 확인 처리 함수 추가
  const confirmDeleteAppointment = async () => {
    try {
      if (!selectedAppointment) return;

      // 상위 컴포넌트의 delete 함수 호출
      if (onAppointmentDelete) {
        await onAppointmentDelete(selectedAppointment.id);

        // 일정 삭제 알림 전송
        await sendScheduleNotification("delete", selectedAppointment);

        showToast("일정이 삭제되었습니다.", "success");
      }

      // 모달 닫기 및 상태 초기화
      setShowDeleteModal(false);
      setShowForm(false);
      setSelectedAppointment(null);
      setIsEditing(false);
    } catch (error) {
      console.error("일정 삭제 중 오류 발생:", error);
      showToast("일정 삭제 중 오류가 발생했습니다.", "error");
    }
  };

  // 일정 삭제 취소 함수 추가
  const cancelDeleteAppointment = () => {
    setShowDeleteModal(false);
  };

  // 일정 클릭 핸들러도 비슷하게 수정
  const handleAppointmentClick = (appointment, e) => {
    e.stopPropagation();

    // 폼 위치 계산
    let left = e.clientX + 10;
    let top = e.clientY;

    // 화면 경계를 벗어나지 않도록 조정
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const formWidth = 640; // 300에서 640으로 변경
    const formHeight = 350; // 400에서 350으로 변경

    if (left + formWidth > viewportWidth) {
      left = Math.max(10, left - formWidth - 20);
    }

    if (top + formHeight > viewportHeight) {
      top = Math.max(10, viewportHeight - formHeight - 10);
    }

    // 폼 위치 설정
    setFormPosition({ left, top });

    // 선택된 일정 및 상태 설정
    setSelectedAppointment(appointment);
    setShowForm(true); // 폼 표시를 활성화
    setShowSelectionForm(true);
    setShowAppointmentForm(false);
    setIsEditing(false);
  };

  // 폼 외부 클릭 핸들러 수정
  const handleOutsideClick = (e) => {
    // 폼이 표시되어 있고, 클릭한 요소가 폼 내부가 아닌 경우에만 처리
    if (showForm && !e.target.closest(".appointment-form")) {
      setShowForm(false);
      setEditingAppointment(null);
      setFormData({
        title: "",
        notes: "",
        duration: "30",
        type: "예약",
        staffId: "",
        staffName: "",
      });
      setSelection(null); // 선택 영역 초기화
      setCurrentCell(null); // 선택된 셀 초기화
      setSelectedAppointment(null); // 선택된 일정 초기화
      setIsEditing(false); // 편집 모드 비활성화

      // 화면 갱신을 위해 강제로 상태 업데이트
      setLocalAppointments((prev) => [...prev]);
    }

    // 휴가 상세 정보 모달이 표시되어 있고, 클릭한 요소가 폼 내부가 아닌 경우에만 처리
    if (showVacationDetail && !e.target.closest(".appointment-form")) {
      setShowVacationDetail(false);
      setSelectedVacation(null);

      // 화면 갱신을 위해 강제로 상태 업데이트
      setVacations((prev) => [...prev]);
    }
  };

  // 전역 클릭 이벤트 리스너 추가
  useEffect(() => {
    // 문서 전체에 클릭 이벤트 리스너 추가
    document.addEventListener("mousedown", handleOutsideClick);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showForm, showVacationDetail]); // showForm과 showVacationDetail 상태가 변경될 때마다 이펙트 재실행

  // 일정 생성 함수 수정 - staffId 외에 staffName도 추가
  const createAppointment = async (data) => {
    try {
      // Off day 체크
      const selectedDate =
        typeof data.date === "string" ? new Date(data.date) : data.date;
      const dayOfWeek = WEEKDAYS[selectedDate.getDay()];
      const staffIndex = staff.findIndex((s) => s.id === data.staffId);

      if (
        staffIndex !== -1 &&
        staff[staffIndex].offDays &&
        staff[staffIndex].offDays.includes(dayOfWeek)
      ) {
        if (showToast) {
          showToast(
            `${staff[staffIndex].name}의 ${dayOfWeek}요일은 Off day입니다.`,
            "error"
          );
        }
        return;
      }

      // 필요한 예약 데이터 정리
      const appointment = {
        title: data.title || "새 예약",
        date:
          typeof data.date === "string"
            ? data.date
            : format(data.date, "yyyy-MM-dd"),
        startTime: data.startTime,
        endTime: data.endTime,
        staffId: data.staffId,
        staffName: data.staffName, // 담당자 이름 추가
        notes: data.notes || "",
        type: data.type || viewMode,
        status: "예약완료",
        createdAt: new Date(),
      };

      // closeForm() 호출 대신 직접 폼 닫기 및 상태 초기화
      setShowForm(false);
      setFormData({
        title: "",
        notes: "",
        duration: "30",
        type: "예약",
        staffId: "",
        staffName: "",
      });
      setSelection(null);
      setCurrentCell(null);

      // 부모 컴포넌트의 콜백 호출
      if (onAppointmentCreate) {
        const newAppointment = await onAppointmentCreate(appointment);

        // 예약 생성 알림 전송 - 여기에 추가
        await sendScheduleNotification("create", newAppointment || appointment);
      }
    } catch (error) {
      console.error("예약 생성 중 오류 발생:", error);
      if (showToast) {
        showToast("예약 생성 중 오류가 발생했습니다.", "error");
      }
    }
  };

  // 드래그 영역 계산
  const getDragArea = () => {
    if (!isDragging || !dragArea) return null;

    const startTimeIndex = Math.min(
      dragArea.startTimeIndex,
      dragArea.endTimeIndex
    );
    const endTimeIndex = Math.max(
      dragArea.startTimeIndex,
      dragArea.endTimeIndex
    );

    return {
      dateIndex: dragArea.dateIndex,
      staffIndex: dragArea.staffIndex,
      startTimeIndex,
      endTimeIndex,
    };
  };

  // 드래그 중인 영역 렌더링
  const renderDragArea = () => {
    if (!isDragging || !dragArea) return null;

    const area = {
      startTimeIndex: Math.min(dragArea.startTimeIndex, dragArea.endTimeIndex),
      endTimeIndex: Math.max(dragArea.startTimeIndex, dragArea.endTimeIndex),
      dateIndex: dragArea.dateIndex,
      staffIndex: dragArea.staffIndex,
    };

    const { dateIndex, staffIndex, startTimeIndex, endTimeIndex } = area;

    // 시간 표시 계산 - 여기서 불필요한 계산 제거
    const startTime = effectiveTimeSlots[startTimeIndex];
    const endTime = getEndTime(effectiveTimeSlots[endTimeIndex]);
    const timeDisplay = `${startTime} - ${endTime}`;

    const style = getSelectedCellStyle(
      dateIndex,
      staffIndex,
      startTimeIndex,
      endTimeIndex
    );

    return (
      <div
        style={{
          ...style,
          backgroundColor: "rgba(66, 139, 202, 0.2)",
          border: "2px dashed rgba(66, 139, 202, 0.6)",
          borderRadius: "4px",
          margin: "2px",
          zIndex: 4,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          fontSize: "14px",
          color: "#2d3748",
          fontWeight: 600,
        }}
      >
        {"새 일정"}
        <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "3px" }}>
          {timeDisplay}
        </div>
      </div>
    );
  };

  // 변수명 변경하여 중복 방지
  const activeDragArea = getDragArea();

  // 셀 렌더링 함수 수정 - "메모"를 "21:30"으로 변경
  const renderTimeGridCells = () => {
    let cells = [];

    // 21:00 시간대 인덱스 찾기
    const timeIndex21 = effectiveTimeSlots.findIndex(
      (time) => time === "21:00"
    );

    effectiveTimeSlots.forEach((time, timeIndex) => {
      // 특정 시간대 여부 확인
      const is2130 = timeIndex21 !== -1 && timeIndex === timeIndex21 + 1;

      dates.forEach((date, dateIndex) => {
        const isToday =
          format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
        const dayOfWeekNumber = date.getDay();
        const businessHour = businessHours[dayOfWeekNumber];
        const startCol = dateIndex * (staff.length + 1) + 1;

        // 시간 표시 제한 로직 추가
        const timeHour = parseInt(time.split(":")[0], 10);
        const timeMinute = parseInt(time.split(":")[1], 10);
        const timeInMinutes = timeHour * 60 + timeMinute;

        // 요일별 표시 시간 제한 (시간 표시만 제한하고 드래그는 가능하도록)
        let shouldShowTime = true;

        if (
          dayOfWeekNumber === 1 ||
          dayOfWeekNumber === 3 ||
          dayOfWeekNumber === 5
        ) {
          // 월수금: 19시까지
          shouldShowTime = timeInMinutes <= 19 * 60;
        } else if (dayOfWeekNumber === 2 || dayOfWeekNumber === 4) {
          // 화목: 20시까지
          shouldShowTime = timeInMinutes <= 20 * 60;
        } else if (dayOfWeekNumber === 6) {
          // 토요일: 14시까지
          shouldShowTime = timeInMinutes <= 14 * 60;
        } else if (dayOfWeekNumber === 0) {
          // 일요일: 정기휴무 - 시간 표시 안함
          shouldShowTime = false;
        }

        // 영업 시간 외인지 확인 (UI 표시 용도로만 사용)
        const isOutOfBusinessHours = !shouldShowTime || dayOfWeekNumber === 0;

        // 휴게시간 로직 변경 - 행 인덱스로 판단
        const isBreakTimeForDay =
          (timeIndex === 9 || timeIndex === 10) && // 10번째와 11번째 행 (0-based index)
          dayOfWeekNumber !== 0 &&
          dayOfWeekNumber !== 6; // 일요일과 토요일 제외

        // 표시 레이블 설정 - 실제 시간값은 유지
        let displayTime = time;

        // 요일에 따라 다르게 표시 (토요일은 실제 시간 그대로, 평일은 특수 표시 가능)
        if (dayOfWeekNumber === 6) {
          // 토요일은 실제 시간 그대로 표시
          displayTime = time;
        } else if (dayOfWeekNumber !== 0) {
          // 평일에 특정 시간은 특별히 표시
          if (is2130) {
            displayTime = "21:30";
          } else if (timeIndex === 8) {
            // 13:00
            displayTime = "13:00";
          } else if (timeIndex === 9) {
            // 13:30
            displayTime = "점심";
          } else if (timeIndex === 10) {
            // 14:00 - 레이블만 "시간"으로 표시하고 실제 시간값은 14:00 유지
            displayTime = "시간";
          } else if (timeIndex === 11) {
            // 14:30 - 레이블만 "14:00"으로 표시하고 실제 시간값은 14:30 유지
            displayTime = "14:00";
          } else if (timeIndex === 12) {
            // 15:00 - 레이블만 "14:30"으로 표시하고 실제 시간값은 15:00 유지
            displayTime = "14:30";
          }
        }

        // 영업 시간 내인지 확인 (근무시간 배경색 표시 용도)
        const isWithinBusinessHours = shouldShowTime && dayOfWeekNumber !== 0;

        // 각 날짜별 시간 열 추가 - 너비 50px로 변경
        cells.push(
          <Cell
            key={`time-col-${dateIndex}-${timeIndex}`}
            style={{
              gridColumn: startCol,
              gridRow: timeIndex + 1,
              backgroundColor: isBreakTimeForDay
                ? "#fff8e1"
                : isWithinBusinessHours
                ? "#fff8e1" // 영업 시간 내인 경우 노란색
                : "#f5f5f5",
              opacity: isOutOfBusinessHours ? 0.6 : 1,
              borderRight: "1px solid #ddd",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "0.8em",
              color: "#333",
              minWidth: "50px",
              maxWidth: "50px",
              width: "50px",
              height: "40px",
              overflow: "hidden",
            }}
          >
            {/* 요일과 시간에 따라 다른 텍스트 표시 */}
            {shouldShowTime ? displayTime : displayTime}
          </Cell>
        );

        // 직원 셀 추가 - 인원별 메모 제거
        staff.forEach((person, staffIndex) => {
          const colIndex = startCol + staffIndex + 1;
          const cellKey = `cell-${dateIndex}-${staffIndex}-${timeIndex}`;

          // 영업 시간 외여도 드래그는 가능하도록 변경, 휴게시간은 예외
          const isStaffOffDay = isOffDay(dateIndex, staffIndex);
          const canInteract = !isBreakTimeForDay && !isStaffOffDay;

          cells.push(
            <Cell
              key={cellKey}
              data-cell-key={cellKey}
              isHalfHour={time.endsWith(":30")}
              data-date-index={dateIndex}
              data-staff-index={staffIndex}
              data-time-index={timeIndex}
              style={{
                gridColumn: colIndex,
                gridRow: timeIndex + 1,
                backgroundColor: isStaffOffDay
                  ? "#ffe6e6" // Off day 배경색을 연한 빨강으로 변경
                  : isOutOfBusinessHours
                  ? "#f9f9f9"
                  : isBreakTimeForDay
                  ? "#fff8e1"
                  : isToday
                  ? "#fafeff"
                  : undefined,
                cursor:
                  isStaffOffDay || isBreakTimeForDay
                    ? "not-allowed"
                    : "pointer",
                opacity: isOutOfBusinessHours ? 0.5 : 1,
                minWidth: "150px",
                height: "40px",
                pointerEvents: canInteract ? "auto" : "none",
              }}
              className="schedule-cell"
              onMouseDown={(e) =>
                canInteract &&
                handleMouseDown(e, dateIndex, staffIndex, timeIndex)
              }
              onMouseMove={(e) =>
                canInteract &&
                handleMouseMove(e, dateIndex, staffIndex, timeIndex)
              }
              onMouseUp={(e) =>
                canInteract &&
                handleMouseUp(e, dateIndex, staffIndex, timeIndex)
              }
              title={isStaffOffDay ? `${person.name}의 Off day입니다` : ""}
            />
          );
        });
      });
    });

    return cells;
  };

  // 메모 변경 핸들러
  const handleMemoChange = (memoKey, value) => {
    setMemos((prevMemos) => ({
      ...prevMemos,
      [memoKey]: value,
    }));
  };

  // 메모 저장 함수
  const saveMemo = async (memoKey) => {
    if (!memos[memoKey] || memos[memoKey].trim() === "") return;

    try {
      // 메모 키에서 날짜와 직원 ID 추출
      const [, date, staffId] = memoKey.split("-");

      // Firestore에 저장
      const memoRef = doc(db, "memos", memoKey);
      await setDoc(memoRef, {
        date,
        staffId,
        content: memos[memoKey],
        updatedAt: new Date(),
      });

      console.log(`메모 저장됨: ${memoKey}`, memos[memoKey]);
    } catch (error) {
      console.error("메모 저장 오류:", error);
    }
  };

  // 메모 항목 추가 함수
  const handleAddMemoItem = async (memoKey, content) => {
    if (!content || content.trim() === "") return;

    try {
      // 기존 메모 항목 가져오기
      let currentItems = memos[memoKey] || [];

      // 문자열이면 배열로 변환
      if (typeof currentItems === "string") {
        currentItems = [currentItems];
      } else if (!Array.isArray(currentItems)) {
        currentItems = [];
      }

      // 새 항목 추가 (고유 ID 부여)
      const newItem = {
        id: `memo-${Date.now()}-${Math.floor(Math.random() * 10000)}`, // 타임스탬프와 랜덤값 조합으로 고유 ID 생성
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      // 기존 항목들에 ID가 없는 경우 ID 추가
      const updatedItems = currentItems.map((item) => {
        if (typeof item === "string") {
          return {
            id: `memo-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            content: item,
            createdAt: new Date().toISOString(),
          };
        } else if (typeof item === "object" && !item.id) {
          return {
            ...item,
            id: `memo-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          };
        }
        return item;
      });

      // 새 항목 추가
      const finalItems = [...updatedItems, newItem];

      // 상태 업데이트
      setMemos((prevMemos) => ({
        ...prevMemos,
        [memoKey]: finalItems,
      }));

      // Firestore에 저장
      const [, date, type] = memoKey.split("-");
      const memoRef = doc(db, "memos", memoKey);
      await setDoc(memoRef, {
        date,
        content: finalItems,
        updatedAt: new Date(),
      });

      // 메모 추가 알림 전송
      await sendMemoNotification("create", { date, type }, content.trim());

      console.log(`메모 항목 추가됨: ${memoKey}`, content);
    } catch (error) {
      console.error("메모 항목 추가 오류:", error);
    }
  };

  // 메모 항목 삭제 함수
  const handleDeleteMemoItem = async (memoKey, itemIndex) => {
    try {
      // 기존 메모 항목 가져오기
      let currentItems = memos[memoKey] || [];

      // 문자열이면 배열로 변환
      if (typeof currentItems === "string") {
        currentItems = [currentItems];
      } else if (!Array.isArray(currentItems)) {
        currentItems = [];
      }

      // 삭제할 항목 정보 저장
      const deletedItem = currentItems[itemIndex];
      const deletedContent =
        typeof deletedItem === "string"
          ? deletedItem
          : deletedItem?.content || "";

      // 항목 삭제 (인덱스로 삭제)
      const updatedItems = currentItems.filter(
        (_, index) => index !== itemIndex
      );

      // 상태 업데이트
      setMemos((prevMemos) => ({
        ...prevMemos,
        [memoKey]: updatedItems,
      }));

      // Firestore에 저장
      const [, date, type] = memoKey.split("-");
      const memoRef = doc(db, "memos", memoKey);

      if (updatedItems.length === 0) {
        // 항목이 없으면 문서 삭제
        await deleteDoc(memoRef);
        console.log(`메모 문서 삭제됨: ${memoKey}`);
      } else {
        // 항목이 남아있으면 업데이트
        await setDoc(memoRef, {
          date,
          content: updatedItems,
          updatedAt: new Date(),
        });
        console.log(`메모 항목 삭제됨: ${memoKey}`, itemIndex);
      }

      // 메모 삭제 알림 전송
      await sendMemoNotification("delete", { date, type }, deletedContent);
    } catch (error) {
      console.error("메모 항목 삭제 오류:", error);
    }
  };

  // 초기 메모 로드 함수 수정
  useEffect(() => {
    const loadMemos = async () => {
      try {
        // 각 날짜와 메모 유형에 대해 메모 로드
        let loadedMemos = {};
        const currentMemoType = memoType; // 현재 viewMode에 따른 메모 타입
        console.log("메모 로드 중, 현재 메모 타입:", currentMemoType);

        for (const date of dates) {
          const formattedDate = format(date, "yyyy-MM-dd");

          // 현재 뷰 모드에 해당하는 메모만 로드
          const memoKey = `memo-${formattedDate}-${currentMemoType}`;
          console.log("로드할 메모 키:", memoKey);

          // Firestore에서 메모 데이터 조회
          const memoRef = doc(db, "memos", memoKey);
          const memoDoc = await getDoc(memoRef);

          if (memoDoc.exists()) {
            const memoData = memoDoc.data();

            // 내용이 있는 경우만 처리
            if (memoData.content) {
              let processedContent;

              if (Array.isArray(memoData.content)) {
                // ID가 없는 항목에 ID 추가
                processedContent = memoData.content.map((item, index) => {
                  if (typeof item === "string") {
                    return {
                      id: `memo-${Date.now()}-${index}-${Math.floor(
                        Math.random() * 10000
                      )}`,
                      content: item,
                      createdAt: new Date().toISOString(),
                    };
                  } else if (typeof item === "object" && !item.id) {
                    return {
                      ...item,
                      id: `memo-${Date.now()}-${index}-${Math.floor(
                        Math.random() * 10000
                      )}`,
                    };
                  }
                  return item;
                });
              } else if (typeof memoData.content === "string") {
                // 문자열인 경우 객체 배열로 변환
                processedContent = [
                  {
                    id: `memo-${Date.now()}-${Math.floor(
                      Math.random() * 10000
                    )}`,
                    content: memoData.content,
                    createdAt: new Date().toISOString(),
                  },
                ];
              } else {
                // 기타 경우는 빈 배열로 설정
                processedContent = [];
              }

              loadedMemos[memoKey] = processedContent;
              console.log("메모 로드됨 (변환 후):", memoKey, processedContent);
            }
          }
        }

        setMemos(loadedMemos);
      } catch (error) {
        console.error("메모 로드 오류:", error);
      }
    };

    if (dates.length > 0) {
      loadMemos();
    }
  }, [dates, memoType]);

  // 일정 렌더링 함수 수정 - 시간에 비례하여 표시하며 점심시간 고려하고 시간 매핑 적용
  const renderAppointments = () => {
    // 필터링 전 로그 출력
    console.log(
      `총 일정 개수(필터링 전): ${localAppointments.length}, 현재 모드: ${viewMode}`
    );

    // 타입별 개수 계산
    const typeCount = localAppointments.reduce((acc, app) => {
      const type = app.type || "없음";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    console.log("일정 타입별 개수:", typeCount);

    const filteredAppointments = localAppointments.filter((appointment) => {
      // 필수 필드 확인
      if (!appointment || !appointment.id) {
        console.log("유효하지 않은 일정:", appointment);
        return false;
      }

      // 로그 출력으로 문제 확인
      console.log(
        `일정 필터링: id=${appointment.id}, 제목=${
          appointment.title || "없음"
        }, type=${appointment.type}, viewMode=${viewMode}, isHidden=${
          appointment.isHidden
        }`
      );

      // isHidden이 true면 무조건 제외
      if (appointment.isHidden === true) return false;

      // 물리치료 모드인 경우
      if (viewMode === "물리치료") {
        return appointment.type === "물리치료";
      }
      // 진료 모드인 경우
      else {
        return appointment.type !== "물리치료";
      }
    });

    console.log(`필터링 후 표시될 일정: ${filteredAppointments.length}개`);

    return filteredAppointments.map((appointment) => {
      const dateIndex =
        appointment.dateIndex !== undefined
          ? appointment.dateIndex
          : dates.findIndex(
              (date) => format(date, "yyyy-MM-dd") === appointment.date
            );

      if (dateIndex < 0) return null; // 날짜를 찾을 수 없는 경우

      const staffIndex = staff.findIndex((s) => s.id === appointment.staffId);
      if (staffIndex < 0) return null; // 직원을 찾을 수 없는 경우

      // 날짜의 요일 확인 - 평일 여부 체크를 위해
      const date = dates[dateIndex];
      const dayOfWeek = date.getDay(); // 0: 일요일, 6: 토요일
      const isWeekday = dayOfWeek > 0 && dayOfWeek < 6; // 월~금요일인지 확인
      const isSaturday = dayOfWeek === 6; // 토요일인지 확인

      // 시작 시간과 종료 시간을 분으로 변환하여 정확한 시간 차 계산
      const startMinutes = timeToMinutes(appointment.startTime);
      const endMinutes = timeToMinutes(appointment.endTime);
      const durationMinutes = endMinutes - startMinutes;

      // 평일에 특정 시간대의 매핑 적용
      const findTimeSlotIndex = (timeStr, isWeekday) => {
        // 평일에 14:00과 14:30은 특별 매핑 적용
        if (isWeekday && !isSaturday) {
          if (timeStr === "14:00") {
            // 14:00은 인덱스 11 (화면에 "14:00"으로 표시)에 매핑
            return effectiveTimeSlots.findIndex((slot) => slot === "14:30");
          } else if (timeStr === "14:30") {
            // 14:30은 인덱스 12 (화면에 "14:30"으로 표시)에 매핑
            return effectiveTimeSlots.findIndex((slot) => slot === "15:00");
          }
        }

        // 그 외 케이스는 정상적으로 인덱스 찾기
        return effectiveTimeSlots.findIndex((slot) => slot === timeStr);
      };

      // 시작 시간에 가장 가까운 슬롯 찾기 - 매핑 적용
      let startTimeIndex = 0;
      let startTimeOffset = 0;

      // 정확히 일치하는 시간이 있는지 먼저 확인 (매핑 적용)
      const exactStartTimeIndex = findTimeSlotIndex(
        appointment.startTime,
        isWeekday
      );

      if (exactStartTimeIndex !== -1) {
        // 정확히 일치하는 슬롯 있음
        startTimeIndex = exactStartTimeIndex;
        startTimeOffset = 0;
      } else {
        // 정확히 일치하는 슬롯 없음 - 가장 가까운 이전 슬롯 찾기
        for (let i = 0; i < effectiveTimeSlots.length; i++) {
          const slotMinutes = timeToMinutes(effectiveTimeSlots[i]);
          if (slotMinutes > startMinutes) {
            startTimeIndex = Math.max(0, i - 1);
            const prevSlotMinutes = timeToMinutes(
              effectiveTimeSlots[startTimeIndex]
            );
            startTimeOffset = (startMinutes - prevSlotMinutes) / 30; // 30분을 1로 정규화
            break;
          } else if (i === effectiveTimeSlots.length - 1) {
            // 마지막 슬롯보다 시작 시간이 나중이면
            startTimeIndex = i;
            startTimeOffset = (startMinutes - slotMinutes) / 30;
          }
        }
      }

      // 종료 시간에 가장 가까운 슬롯 찾기 - 매핑 적용
      let endTimeIndex = 0;
      let endTimeOffset = 0;

      // 정확히 일치하는 시간이 있는지 먼저 확인 (매핑 적용)
      const exactEndTimeIndex = findTimeSlotIndex(
        appointment.endTime,
        isWeekday
      );

      if (exactEndTimeIndex !== -1) {
        // 정확히 일치하는 슬롯 있음
        endTimeIndex = exactEndTimeIndex;
        endTimeOffset = 0;
      } else {
        // 정확히 일치하는 슬롯 없음 - 가장 가까운 슬롯 찾기
        for (let i = 0; i < effectiveTimeSlots.length; i++) {
          const slotMinutes = timeToMinutes(effectiveTimeSlots[i]);
          if (slotMinutes >= endMinutes) {
            endTimeIndex = i;
            const prevSlotMinutes =
              i > 0 ? timeToMinutes(effectiveTimeSlots[i - 1]) : 0;
            endTimeOffset =
              (endMinutes - prevSlotMinutes) / (slotMinutes - prevSlotMinutes);
            break;
          } else if (i === effectiveTimeSlots.length - 1) {
            // 마지막 슬롯보다 종료 시간이 나중이면
            endTimeIndex = i;
            const nextSlotMinutes = timeToMinutes(
              getEndTime(effectiveTimeSlots[i])
            );
            endTimeOffset = Math.min(
              1,
              (endMinutes - slotMinutes) / (nextSlotMinutes - slotMinutes)
            );
          }
        }
      }

      // 점심 시간 보정 (평일에만 적용)
      // 점심 시간 슬롯 인덱스는 9, 10 (timeIndex === 9, 10)
      // 14:00(인덱스 11) 이후 시간에는 2개 슬롯만큼 조정 필요
      const lunchTimeAdjustment = 2; // 점심시간 2칸 (13:00-14:00)

      // 컬럼 인덱스 계산 - 변수 이름 변경
      const appointmentColStart = dateIndex * (staff.length + 1) + 1; // 각 날짜 시작 컬럼
      const colIndex = appointmentColStart + staffIndex + 1; // 시간 열 다음부터 직원 열 시작

      // 참고사항이 있는지 확인
      const hasNotes = appointment.notes && appointment.notes.trim().length > 0;

      // 위치 계산을 위한 정보 수집
      const startCellKey = `cell-${dateIndex}-${staffIndex}-${startTimeIndex}`;
      const startCellEl = gridRef.current?.querySelector(
        `[data-cell-key="${startCellKey}"]`
      );

      if (!startCellEl) return null; // 셀이 없으면 렌더링 불가

      const cellHeight = startCellEl.getBoundingClientRect().height;
      const gridRect = gridRef.current.getBoundingClientRect();

      // 정확한 시작 위치와 높이 계산 (시간에 비례하여 조정)
      const top = startTimeIndex * cellHeight + startTimeOffset * cellHeight;

      // 높이 계산 개선 - 분 단위 비율로 더 정밀하게 계산
      // 실제 시간 간격에 정확히 비례하는 높이 계산
      const minutesPerCell = 30; // 각 셀은 30분 간격
      const pixelsPerMinute = cellHeight / minutesPerCell;
      const height = Math.max(15, durationMinutes * pixelsPerMinute);

      // 담당자 색상 가져오기 (있으면 사용, 없으면 기본 타입 색상)
      const appointmentColor =
        appointment.staffColor ||
        appointmentTypeColors[appointment.type] ||
        "#64B5F6";

      // 일정이 1칸만 차지하는지 확인 - 시작과 끝 시간의 차이가 30분 이하인 경우
      const isSingleCell =
        timeToMinutes(appointment.endTime) -
          timeToMinutes(appointment.startTime) <=
        30;

      return (
        <AppointmentBlock
          key={`appointment-${appointment.id}`}
          data-appointment-id={appointment.id}
          style={{
            gridColumn: colIndex,
            gridRow: `${startTimeIndex + 1} / ${endTimeIndex + 2}`, // span으로 변경, 종료 슬롯까지 포함
            backgroundColor: appointmentColor,
            zIndex: 5,
            marginTop: `${startTimeOffset * cellHeight}px`,
            height: `${height}px`, // 실제 시간 간격에 비례하는 높이 적용
            maxHeight: `${
              (endTimeIndex - startTimeIndex + 1) * cellHeight - 4
            }px`, // 여백 고려
            position: "relative", // absolute에서 relative로 변경하여 그리드 내에 위치하도록 수정
          }}
          onClick={(e) => handleAppointmentClick(appointment, e)}
        >
          {/* 참고사항 표시기 */}
          {hasNotes && (
            <div
              className="notes-indicator bg-onceYellow border-onceYellow"
              title="참고사항 있음"
              style={{
                opacity: 0.9,
                borderWidth: "6px 6px 6px 6px",
              }}
            />
          )}

          <div className="appointment-content">
            <div className="title">{appointment.title}</div>
            {!isSingleCell && (
              <div className="time">
                {formatTime(appointment.startTime)} -{" "}
                {formatTime(appointment.endTime)}
              </div>
            )}
          </div>
        </AppointmentBlock>
      );
    });
  };

  // 드래그 선택 영역 렌더링 함수를 그리드 내 위치 기반으로 완전히 재작성
  const renderSelectionArea = () => {
    if (!selection) return null;

    const { startDateIndex, startStaffIndex, startTimeIndex, endTimeIndex } =
      selection;

    // 컬럼 인덱스 계산 - 날짜와 직원 정보 기반
    const startCol = startDateIndex * (staff.length + 1) + 1;
    const colIndex = startCol + startStaffIndex + 1;

    // 그리드 행/열 위치 스타일 계산
    const style = {
      gridColumn: colIndex,
      gridRow: `${startTimeIndex + 1} / span ${
        endTimeIndex - startTimeIndex + 1
      }`,
      backgroundColor: "rgba(66, 153, 225, 0.15)",
      border: "2px solid #4299e1",
      borderRadius: "4px",
      height: "calc(100% - 4px)",
      width: "calc(100% - 4px)",
      margin: "2px",
      zIndex: 4,
    };

    return <div style={style} />;
  };

  // 단일 셀 선택 표시 함수도 같은 방식으로 수정
  const renderSelectedCell = () => {
    // showForm이 true이면 선택된 셀을 표시하지 않음
    // isSelecting이 true이면 선택 중이므로 선택된 셀을 표시하지 않음
    if (!currentCell || isSelecting || showForm) return null;

    const { dateIndex, staffIndex, timeIndex } = currentCell;

    // 컬럼 인덱스 계산 - 날짜와 직원 정보 기반
    const startCol = dateIndex * (staff.length + 1) + 1;
    const colIndex = startCol + staffIndex + 1;

    // 그리드 행/열 위치 스타일 계산
    const style = {
      gridColumn: colIndex,
      gridRow: timeIndex + 1,
      backgroundColor: "rgba(66, 153, 225, 0.15)",
      border: "2px solid #4299e1",
      borderRadius: "4px",
      height: "calc(100% - 4px)",
      width: "calc(100% - 4px)",
      margin: "2px",
      zIndex: 4,
    };

    return <div style={style} />;
  };

  // 드래그 시 스타일 직접 조작하는 함수 추가
  const getSelectedCellStyle = (
    dateIndex,
    staffIndex,
    startTimeIndex,
    endTimeIndex
  ) => {
    // 컬럼 인덱스 계산
    const startCol = dateIndex * (staff.length + 1) + 1;
    const colIndex = startCol + staffIndex + 1;

    return {
      gridColumn: colIndex,
      gridRow: `${startTimeIndex + 1} / span ${
        endTimeIndex - startTimeIndex + 1
      }`,
    };
  };

  // 날짜 헤더 셀 렌더링 함수 수정 - 시간 열 너비 50px로 변경
  const renderDateHeaderCells = () => {
    const cells = [];

    // 날짜 헤더
    dates.forEach((date, dateIndex) => {
      const formattedDate = formatDate(date, "M/D");
      const dayOfWeek = formatDate(date, "ddd");
      const isToday =
        format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
      const dayOfWeekNumber = date.getDay();

      // 열 인덱스 계산 (각 날짜별 시간 열 포함)
      const startCol = dateIndex * (staff.length + 1) + 1;
      const endCol = startCol + staff.length;

      cells.push(
        <HeaderCell
          key={`date-${dateIndex}`}
          className="date-header"
          style={{
            gridColumn: `${startCol} / ${endCol + 1}`,
            gridRow: "1",
            borderLeft: dateIndex > 0 ? "1px solid #ccc" : "none",
            backgroundColor: isToday ? "#e6f7ff" : "#f9f9f9",
          }}
        >
          <div className="date-header-content">
            <div className="date">
              {formattedDate} ({dayOfWeek})
            </div>
          </div>
        </HeaderCell>
      );
    });

    // 직원 헤더
    dates.forEach((date, dateIndex) => {
      staff.forEach((person, staffIndex) => {
        const colIndex = dateIndex * (staff.length + 1) + staffIndex + 2;
        cells.push(
          <HeaderCell
            key={`staff-${dateIndex}-${staffIndex}`}
            className="staff-header"
            style={{
              gridColumn: colIndex,
              gridRow: "2",
              backgroundColor: "white",
              borderRight: "1px solid #eee",
              borderBottom: "1px solid #ddd",
            }}
          >
            {person.name}
          </HeaderCell>
        );
      });
    });

    return cells;
  };

  const renderSecondRowHeaders = () => {
    let cells = [];

    dates.forEach((date, dateIndex) => {
      const isToday =
        format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
      const startCol = dateIndex * (staff.length + 1) + 1;
      const dayOfWeek = WEEKDAYS[date.getDay()]; // 요일 표시 추가

      // 각 날짜마다 시간 헤더 추가
      cells.push(
        <HeaderCell
          key={`time-header-${dateIndex}`}
          className="staff-header"
          style={{
            gridColumn: startCol,
            gridRow: "2",
            backgroundColor: isToday ? "#e6f7ff" : "#f5f5f5",
            borderRight: "1px solid #ddd",
            fontSize: "0.85em",
            fontWeight: "500",
            minWidth: "50px",
            maxWidth: "50px",
            width: "50px",
            overflow: "hidden",
          }}
        >
          <div className="flex items-center justify-center">
            <span>시간</span>
          </div>
        </HeaderCell>
      );

      // 담당자 헤더들 추가
      staff.forEach((person, staffIndex) => {
        const colIndex = startCol + staffIndex + 1;
        const isStaffOffDay = isOffDay(dateIndex, staffIndex);

        cells.push(
          <HeaderCell
            key={`staff-${dateIndex}-${staffIndex}`}
            className="staff-header"
            style={{
              gridColumn: colIndex,
              gridRow: "2",
              backgroundColor: isStaffOffDay
                ? "#ffe6e6" // Off day 배경색을 연한 빨강으로 변경
                : isToday
                ? "#e6f7ff"
                : "#f9f9f9",
              borderRight: "1px solid #eee",
              borderBottom: "1px solid #ddd",
              minWidth: minColumnWidth,
              position: "relative",
            }}
          >
            <div className="flex flex-col items-center">
              <span>{person.name}</span>
              {isStaffOffDay && (
                <span className="text-xs text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded">
                  Off day
                </span>
              )}
            </div>
          </HeaderCell>
        );
      });
    });

    return cells;
  };

  // 시간 변경 핸들러 수정 - 더 세밀한 시간 단위 지원
  const handleTimeChange = (field, value) => {
    console.log(`시간 변경: ${field} = ${value}`);

    // formData 업데이트 - 항상 업데이트
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // 선택 영역이 있고 편집 모드가 아닐 때만 selection 업데이트
    if (selection && !isEditing) {
      if (field === "startTime") {
        // 시작 시간 처리
        let bestTimeIndex = 0;
        let minDiff = Number.MAX_SAFE_INTEGER;

        // 모든 시간 슬롯에 대해 분 단위로 차이를 계산하여 가장 가까운 인덱스 찾기
        effectiveTimeSlots.forEach((timeSlot, index) => {
          const slotMinutes = timeToMinutes(timeSlot);
          const diff = Math.abs(slotMinutes - timeToMinutes(value));

          if (diff < minDiff) {
            minDiff = diff;
            bestTimeIndex = index;
          }
        });

        // 선택 영역을 업데이트하되, endTimeIndex가 startTimeIndex보다 작으면 조정
        const newStartTimeIndex = bestTimeIndex;
        const newEndTimeIndex = Math.max(
          selection.endTimeIndex,
          newStartTimeIndex
        );

        setSelection({
          ...selection,
          startTimeIndex: newStartTimeIndex,
          endTimeIndex: newEndTimeIndex,
        });
      } else if (field === "endTime") {
        // 종료 시간 처리
        // 여기서는 endTime이 startTime보다 커야 함
        const startMinutes = timeToMinutes(
          formData.startTime || effectiveTimeSlots[selection.startTimeIndex]
        );
        const valueMinutes = timeToMinutes(value);

        if (valueMinutes <= startMinutes) {
          // 종료 시간이 시작 시간보다 작거나 같으면 경고
          showToast
            ? showToast("종료 시간은 시작 시간보다 커야 합니다.", "error")
            : alert("종료 시간은 시작 시간보다 커야 합니다.");
          return;
        }

        // 가장 가까운 timeIndex 찾기
        let bestEndIndex = selection.endTimeIndex;

        effectiveTimeSlots.forEach((timeSlot, index) => {
          if (index <= selection.startTimeIndex) return; // 시작 시간보다 작은 인덱스는 무시

          const slotMinutes = timeToMinutes(timeSlot);
          if (slotMinutes <= valueMinutes) {
            bestEndIndex = index;
          }
        });

        setSelection({
          ...selection,
          endTimeIndex: bestEndIndex,
        });
      }
    }
  };

  // 시간 선택기를 직접 여는 함수
  const openTimePicker = (inputRef) => {
    if (inputRef.current) {
      inputRef.current.focus();
      // showPicker 메서드 지원 확인 후 호출
      if (typeof inputRef.current.showPicker === "function") {
        try {
          inputRef.current.showPicker();
        } catch (error) {
          console.log("시간 선택기를 열 수 없습니다:", error);
          // 일부 브라우저에서 showPicker가 지원되지 않을 때는 다른 방법으로 처리
          // 예: 포커스를 주고 클릭 이벤트 시뮬레이션
          inputRef.current.click();
        }
      } else {
        // showPicker 메서드가 없는 경우 직접 클릭 이벤트 발생
        inputRef.current.click();
      }
    }
  };

  // 시간 입력 필드 ref 생성
  const startTimeInputRef = useRef(null);
  const endTimeInputRef = useRef(null);

  // 메모 영역 렌더링 함수 수정 - 시간 열 침범 문제 해결
  const renderMemoOverlays = () => {
    if (dates.length === 0) return null;

    // 22:00 시간대 인덱스 찾기
    const timeIndex22 = effectiveTimeSlots.findIndex(
      (time) => time === "22:00"
    );
    if (timeIndex22 === -1) return null;

    return dates.map((date, dateIndex) => {
      const formattedDate = format(date, "yyyy-MM-dd");
      // 현재 뷰 모드에 맞는 메모 키 생성
      const memoKey = `memo-${formattedDate}-${memoType}`;
      console.log("렌더링할 메모 키:", memoKey, "현재 memoType:", memoType);

      // 현재 모드에 해당하는 메모 항목만 표시
      const memoData = memos[memoKey];
      let memoItems = [];

      if (memoData) {
        if (Array.isArray(memoData)) {
          memoItems = memoData;
        } else if (typeof memoData === "string") {
          memoItems = [memoData];
        }
      }

      // 각 날짜의 시작 열 계산
      const startCol = dateIndex * (staff.length + 1) + 1;

      return (
        <Cell
          key={`memo-cell-${dateIndex}`}
          style={{
            gridColumn: `${startCol + 1} / span ${staff.length}`, // 시간 열 다음부터 모든 staff 열 차지
            gridRow: timeIndex22 + 1, // 22:00 행에 정확히 배치
            border: "none",
            padding: "0",
            position: "relative",
            height: "240px", // 탭 UI 제거로 높이 다시 감소
            overflow: "visible",
            zIndex: 10,
          }}
        >
          <MemoOverlay>
            <MemoHeader>
              <MemoTitle>
                {format(date, "M/d")} (
                {["일", "월", "화", "수", "목", "금", "토"][date.getDay()]})
                {viewMode === "물리치료"
                  ? " 물리치료 시트 공유 메모"
                  : " 진료 시트 공유 메모"}
              </MemoTitle>
              <MemoCount>{memoItems.length}개 항목</MemoCount>
            </MemoHeader>

            <MemoContent>
              {memoItems.length === 0 ? (
                <div
                  style={{
                    padding: "10px 0",
                    textAlign: "center",
                    color: "#5D4037",
                    fontSize: "0.9rem",
                    opacity: 0.7,
                  }}
                >
                  메모가 없습니다. 새 메모를 추가하세요.
                </div>
              ) : (
                memoItems.map((item, idx) => {
                  // 문자열과 객체 모두 처리
                  const itemContent =
                    typeof item === "string" ? item : item.content;
                  const itemId =
                    typeof item === "object" && item.id
                      ? item.id
                      : `memo-item-${dateIndex}-${idx}-${Date.now()}`;

                  return (
                    <MemoItem key={itemId}>
                      <MemoText>{itemContent}</MemoText>
                      <DeleteButton
                        onClick={() => handleDeleteMemoItem(memoKey, idx)}
                        title="삭제"
                      >
                        ✕
                      </DeleteButton>
                    </MemoItem>
                  );
                })
              )}
            </MemoContent>

            <MemoInput>
              <input
                type="text"
                placeholder="새 메모 항목 추가..."
                value={dateIndex === activeMemoDateIndex ? newMemoItem : ""}
                onChange={(e) => {
                  setActiveMemoDateIndex(dateIndex);
                  setNewMemoItem(e.target.value);
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && newMemoItem.trim()) {
                    handleAddMemoItem(memoKey, newMemoItem);
                    setNewMemoItem("");
                  }
                }}
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  border: "1px solid #F9A825",
                  borderRadius: "4px",
                  fontSize: "0.85rem",
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                }}
              />
              <button
                onClick={() => {
                  if (newMemoItem.trim()) {
                    handleAddMemoItem(memoKey, newMemoItem);
                    setNewMemoItem("");
                  }
                }}
                style={{
                  padding: "6px 10px",
                  backgroundColor: "#F9A825",
                  color: "#5D4037",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                }}
              >
                추가
              </button>
            </MemoInput>
          </MemoOverlay>
        </Cell>
      );
    });
  };

  // 초기 설정 및 상태 관리
  useEffect(() => {
    console.log("ScheduleGrid가 마운트되었습니다.");
  }, []);

  // viewMode 변경 시 일정 필터링 재적용
  useEffect(() => {
    console.log("viewMode 변경됨:", viewMode);
    // 초기 렌더링 시에는 무시
    if (localAppointments.length === 0) return;

    // 변경된 viewMode에 맞게 일정을 다시 필터링하여 렌더링 유도
    setLocalAppointments((prev) => {
      console.log(`viewMode 변경으로 일정 재필터링: ${prev.length}개`);
      return [...prev];
    });
  }, [viewMode]);

  // props로 전달된 appointments가 변경될 때마다 로컬 상태 업데이트
  useEffect(() => {
    console.log("appointments props 변경됨:", initialAppointments.length);

    // 변경된 appointments를 로컬 상태에 병합 (중복 ID 처리)
    setLocalAppointments((prevAppointments) => {
      // ID를 기준으로 Map 생성 (기존 데이터)
      const appointmentsMap = new Map();

      // 기존 로컬 상태의 일정 추가
      prevAppointments.forEach((app) => {
        if (!app.id) return; // ID가 없는 일정은 무시
        appointmentsMap.set(app.id, app);
      });

      // 새로 전달받은 일정 추가 (같은 ID가 있으면 덮어씀)
      initialAppointments.forEach((app) => {
        if (!app.id) return; // ID가 없는 일정은 무시
        appointmentsMap.set(app.id, app);
      });

      // Map에서 배열로 변환
      return Array.from(appointmentsMap.values());
    });
  }, [initialAppointments]);

  // 컴포넌트 마운트 시 초기 appointments 설정
  useEffect(() => {
    console.log("초기 일정 데이터 설정:", initialAppointments.length);
    setLocalAppointments(initialAppointments || []);
  }, [initialAppointments]);

  // 시간 유틸 함수

  // 더미 휴가 데이터 생성 (실제로는 Firebase에서 가져옴)
  useEffect(() => {
    // 언마운트 시 호출될 구독 해제 함수
    let unsubscribeFn = null;

    // 실제 Firestore에서 휴가 정보 가져오기
    if (dates.length > 0 && staff.length > 0) {
      try {
        // 날짜 범위로 필터링할 시작일과 종료일 계산
        const startDateStr = format(dates[0], "yyyy-MM-dd");
        const endDateStr = format(dates[dates.length - 1], "yyyy-MM-dd");

        console.log("휴가 조회 날짜 범위:", startDateStr, "~", endDateStr);

        // 승인된 휴가만 조회하는 쿼리
        const vacationsQuery = query(
          collection(db, "vacations"),
          where("status", "==", "승인됨"),
          orderBy("startDate", "asc")
        );

        // onSnapshot을 사용하여 실시간 업데이트 설정
        unsubscribeFn = onSnapshot(vacationsQuery, (snapshot) => {
          const fetchedVacations = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
              backgroundColor: "#FF8A65", // 휴가 표시 색상 (주황색)
            }))
            .filter((vacation) => {
              // 날짜 범위에 포함되는 휴가만 필터링
              // 날짜 형식에 맞게 변환 (모든 날짜는 yyyy-MM-dd 형식으로 통일)
              const vacationStart =
                typeof vacation.startDate === "string"
                  ? vacation.startDate
                  : format(
                      vacation.startDate instanceof Date
                        ? vacation.startDate
                        : new Date(
                            vacation.startDate?.seconds
                              ? vacation.startDate.seconds * 1000
                              : vacation.startDate
                          ),
                      "yyyy-MM-dd"
                    );

              const vacationEnd =
                typeof vacation.endDate === "string"
                  ? vacation.endDate
                  : format(
                      vacation.endDate instanceof Date
                        ? vacation.endDate
                        : new Date(
                            vacation.endDate?.seconds
                              ? vacation.endDate.seconds * 1000
                              : vacation.endDate
                          ),
                      "yyyy-MM-dd"
                    );

              // 일자 범위에서 dayTypes 객체 키 확인 (yyyy/MM/dd 형식이 있을 수 있음)
              if (vacation.dayTypes) {
                const oldFormatKeys = Object.keys(vacation.dayTypes).filter(
                  (key) => key.includes("/")
                );

                // yyyy/MM/dd 형식의 키가 있으면 콘솔에 로깅
                if (oldFormatKeys.length > 0) {
                  console.warn(
                    "휴가 데이터에 yyyy/MM/dd 형식의 날짜 키가 포함되어 있습니다:",
                    oldFormatKeys
                  );
                  console.log("vacation data:", vacation);
                }
              }

              // 일정표 날짜 범위와 겹치는 휴가만 표시
              const isInRange =
                (vacationStart >= startDateStr &&
                  vacationStart <= endDateStr) ||
                (vacationEnd >= startDateStr && vacationEnd <= endDateStr) ||
                (vacationStart <= startDateStr && vacationEnd >= endDateStr);

              console.log(
                `휴가 [${vacation.id}] 범위 확인:`,
                vacationStart,
                vacationEnd,
                "일정표 범위:",
                startDateStr,
                endDateStr,
                "포함 여부:",
                isInRange
              );

              return isInRange;
            });

          console.log(
            `총 ${snapshot.docs.length}개 휴가 중 ${fetchedVacations.length}개가 현재 표시 범위에 포함됨`
          );
          setVacations(fetchedVacations);
        });
      } catch (error) {
        console.error("휴가 정보 조회 오류:", error);
        if (showToast) {
          showToast("휴가 정보를 불러오는 중 오류가 발생했습니다.", "error");
        }
      }
    }

    // 항상 정상적인 클린업 함수만 반환
    return () => {
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, [dates, staff, showToast]);

  // 휴가 표시 렌더링 함수 개선
  const renderVacations = () => {
    if (!vacations || vacations.length === 0) {
      console.log("휴가 데이터가 없거나 비어 있습니다.");
      return null;
    }

    console.log(
      `renderVacations 함수 호출됨 - ${vacations.length}개 휴가 데이터`
    );

    // 휴가 데이터의 userId 또는 staffId를 출력
    vacations.forEach((vacation) => {
      const staffId = vacation.staffId || vacation.userId;
      console.log(
        `휴가(${vacation.id || "알 수 없음"}): 담당자 ID=${staffId}, 이름=${
          vacation.userName || "알 수 없음"
        }`
      );
    });

    console.log("휴가 데이터 렌더링 시작:", vacations);

    // 모든 휴가를 날짜별로 분리하여 처리할 배열
    const allVacationElements = [];

    vacations.forEach((vacation) => {
      if (vacation.status !== "승인됨") {
        console.log(`[${vacation.id}] 휴가 건너뜀: 승인되지 않음`);
        return;
      }

      // 휴가 날짜 범위를 yyyy-MM-dd 형식으로 통일
      const vacationStartDate =
        typeof vacation.startDate === "string"
          ? vacation.startDate
          : format(
              vacation.startDate instanceof Date
                ? vacation.startDate
                : new Date(
                    vacation.startDate?.seconds
                      ? vacation.startDate.seconds * 1000
                      : vacation.startDate
                  ),
              "yyyy-MM-dd"
            );

      const vacationEndDate =
        typeof vacation.endDate === "string"
          ? vacation.endDate
          : format(
              vacation.endDate instanceof Date
                ? vacation.endDate
                : new Date(
                    vacation.endDate?.seconds
                      ? vacation.endDate.seconds * 1000
                      : vacation.endDate
                  ),
              "yyyy-MM-dd"
            );

      console.log(
        `[${vacation.id}] 휴가 기간:`,
        vacationStartDate,
        "~",
        vacationEndDate
      );

      // 직원 매칭 로직 개선
      let staffIndex = -1;
      let staffMatchMethod = "";

      // 1. staffId로 직접 매칭
      if (vacation.staffId) {
        staffIndex = staff.findIndex((s) => s.id === vacation.staffId);
        if (staffIndex !== -1) staffMatchMethod = "staffId 직접 매칭";
      }

      // 2. userId로 매칭 시도
      if (staffIndex === -1 && vacation.userId) {
        staffIndex = staff.findIndex((s) => s.id === vacation.userId);
        if (staffIndex !== -1) staffMatchMethod = "userId 직접 매칭";
      }

      // 3. userName과 staff.name 비교
      if (staffIndex === -1 && vacation.userName) {
        // 완전 일치 먼저 시도
        staffIndex = staff.findIndex((s) => s.name === vacation.userName);
        if (staffIndex !== -1) {
          staffMatchMethod = "userName과 staff.name 완전 일치";
        } else {
          // 부분 일치 시도
          staffIndex = staff.findIndex(
            (s) =>
              vacation.userName.includes(s.name) ||
              s.name.includes(vacation.userName)
          );
          if (staffIndex !== -1)
            staffMatchMethod = "userName과 staff.name 부분 일치";
        }
      }

      // 4. 테스트용: staff의 첫 번째 항목 사용
      if (staffIndex === -1 && staff.length > 0) {
        staffIndex = 0;
        staffMatchMethod = "매칭 실패, 첫 번째 staff 사용 (테스트용)";
      }

      if (staffIndex === -1) {
        console.log(`[${vacation.id}] 휴가 건너뜀: 직원 매칭 실패`);
        console.log(
          "현재 staff 목록:",
          staff.map((s) => `${s.id} (${s.name})`)
        );
        return;
      }

      console.log(
        `[${vacation.id}] 직원 매칭 결과: ${staffMatchMethod}, 인덱스=${staffIndex}`
      );

      const staffMember = staff[staffIndex];

      // 날짜 범위 계산
      const startDateObj = new Date(vacationStartDate);
      const endDateObj = new Date(vacationEndDate);

      // 날짜 표시 범위에 있는 날짜만 처리
      for (let d = 0; d < dates.length; d++) {
        const currentDateStr = format(dates[d], "yyyy-MM-dd");

        // 현재 그리드의 날짜가 휴가 기간에 포함되는지 확인
        const isInVacationRange =
          currentDateStr >= vacationStartDate &&
          currentDateStr <= vacationEndDate;

        if (!isInVacationRange) continue;

        console.log(
          `[${vacation.id}] 그리드 날짜 ${currentDateStr}에 휴가 표시`
        );

        // 해당 날짜에 맞는 시작/종료 시간 가져오기
        let startTime, endTime;

        // dayTypes에서 해당 날짜 정보 찾기
        const dayInfo = vacation.dayTypes && vacation.dayTypes[currentDateStr];

        if (dayInfo) {
          // dayTypes에 정보가 있으면 사용
          startTime = dayInfo.startTime;
          endTime = dayInfo.endTime;
        } else {
          // 없으면 기본값 사용
          startTime =
            currentDateStr === vacationStartDate ? vacation.startTime : "09:00";
          endTime =
            currentDateStr === vacationEndDate ? vacation.endTime : "18:00";
        }

        console.log(
          `[${vacation.id}] 날짜 ${currentDateStr}의 시간: ${startTime}-${endTime}`
        );

        // 시간 인덱스 확인
        const startTimeIndex = timeSlots.findIndex(
          (slot) => slot === startTime
        );
        if (startTimeIndex === -1) {
          console.log(
            `[${vacation.id}] 시작 시간(${startTime})에 해당하는 슬롯 없음`
          );
          continue;
        }

        // 종료 시간 처리 - 정확히 일치하는 슬롯이 없으면 가장 가까운 슬롯 찾기
        let endTimeIndex = timeSlots.findIndex((slot) => slot === endTime);
        if (endTimeIndex === -1) {
          // getEndTime 사용하여 다시 시도
          const adjustedEndTime = getEndTime(endTime);
          endTimeIndex = timeSlots.findIndex(
            (slot) => slot === adjustedEndTime
          );

          // 여전히 찾지 못하면 가장 가까운 시간 슬롯 찾기
          if (endTimeIndex === -1) {
            const endMinutes = timeToMinutes(endTime);
            // 시간 슬롯을 순회하며 가장 가까운 슬롯 찾기
            let closestDiff = Number.MAX_SAFE_INTEGER;
            let closestIndex = -1;

            timeSlots.forEach((slot, idx) => {
              const slotMinutes = timeToMinutes(slot);
              const diff = Math.abs(slotMinutes - endMinutes);
              if (diff < closestDiff) {
                closestDiff = diff;
                closestIndex = idx;
              }
            });

            endTimeIndex = closestIndex;
            console.log(
              `[${vacation.id}] 종료 시간(${endTime})과 가장 가까운 슬롯 인덱스: ${endTimeIndex}`
            );
          }
        }

        if (endTimeIndex === -1) {
          console.log(
            `[${vacation.id}] 종료 시간(${endTime})에 해당하는 슬롯 없음`
          );
          continue;
        }

        // 컬럼 인덱스 계산
        const startCol = d * (staff.length + 1) + 1; // 각 날짜 시작 컬럼
        const colIndex = startCol + staffIndex + 1; // 시간 열 다음부터 직원 열 시작

        // 휴가 타입별 아이콘 설정
        let vacationIcon;
        if (vacation.vacationType === "반차") {
          vacationIcon = "🕒"; // 반차 - 시계 아이콘
        } else if (vacation.vacationType === "경조사") {
          vacationIcon = "💐"; // 경조사 - 꽃 아이콘
        } else {
          vacationIcon = "🏖️"; // 일반 휴가 - 해변 아이콘
        }

        // 시간 범위 지정 - 시작이 종료보다 크면 교체
        const finalStartTimeIndex = Math.min(startTimeIndex, endTimeIndex);
        const finalEndTimeIndex = Math.max(startTimeIndex, endTimeIndex);

        // 휴가가 1칸만 차지하는지 확인 - 시작과 끝 시간의 차이가 30분 이하인 경우
        const isSingleCell =
          timeToMinutes(endTime) - timeToMinutes(startTime) <= 30;

        allVacationElements.push(
          <AppointmentBlock
            key={`vacation-${vacation.id}-${currentDateStr}`}
            style={{
              gridColumn: colIndex,
              gridRow: `${finalStartTimeIndex + 1} / ${finalEndTimeIndex + 1}`, // span 대신 직접 종료 셀 지정
              backgroundColor: "#E5E7EB", // 회색으로 변경
              zIndex: 8, // 예약(10)보다 낮고 기본 셀(1)보다 높게
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              border: "1px solid #D1D5DB",
            }}
            title={`${vacation.vacationType}: ${vacation.reason || "휴가"}`}
            onClick={(e) => handleVacationClick(vacation, staffMember, e)}
          >
            <div className="appointment-content">
              <div className="title flex items-center">
                <span className="mr-1">{vacationIcon}</span>
                <span className="font-medium text-gray-800 truncate">
                  {vacation.vacationType}
                </span>
              </div>
              {!isSingleCell && (
                <div className="time text-gray-600">
                  {startTime} - {endTime}
                </div>
              )}
              {!isSingleCell && (
                <div
                  className="staff-name text-sm mt-1 font-medium text-gray-700"
                  style={{ fontSize: "0.8em", marginTop: "2px" }}
                >
                  {staffMember?.name || vacation.userName || "의료진"} 휴가중
                </div>
              )}
            </div>
          </AppointmentBlock>
        );
      }
    });

    console.log(`${allVacationElements.length}개 휴가 요소 생성 완료`);
    return allVacationElements;
  };

  // 휴가 클릭 핸들러 추가
  const handleVacationClick = (vacation, staffMember, e) => {
    e.stopPropagation();

    // 폼 위치 계산
    let left = e.clientX + 10;
    let top = e.clientY;

    // 화면 경계를 벗어나지 않도록 조정
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const formWidth = 640; // 300에서 640으로 변경
    const formHeight = 350; // 400에서 350으로 변경

    if (left + formWidth > viewportWidth) {
      left = Math.max(10, left - formWidth - 20);
    }

    if (top + formHeight > viewportHeight) {
      top = Math.max(10, viewportHeight - formHeight - 10);
    }

    // 폼 위치 설정
    setFormPosition({ left, top });

    // 선택된 휴가 및 상태 설정
    setSelectedVacation({ ...vacation, staffName: staffMember.name });
    setShowVacationDetail(true);
  };

  // 휴가 충돌 검사 함수 수정 - 차단하지 않고 확인만 하도록 변경
  // 휴가 충돌 검사 함수 수정 - 차단하지 않고 확인만 하도록 변경
  const checkVacationConflict = (
    dateIndex,
    staffIndex,
    startTimeIndex,
    endTimeIndex
  ) => {
    // 휴가 정보가 없으면 충돌 없음
    if (!vacations || vacations.length === 0) return { hasConflict: false };

    const targetDate = dates[dateIndex];
    const targetStaffId = staff[staffIndex]?.id;

    // 휴가 중인 의사 및 시간대 확인
    const conflictingVacation = vacations.find((vacation) => {
      if (vacation.status !== "승인됨") return false;
      if (vacation.staffId !== targetStaffId) return false;

      const vacationDateMatches = isEqual(
        new Date(vacation.startDate),
        new Date(targetDate)
      );

      if (!vacationDateMatches) return false;

      const vacationStartTimeIndex = timeSlots.findIndex(
        (slot) => slot === vacation.startTime
      );

      const vacationEndTimeIndex = timeSlots.findIndex(
        (slot) => slot === getEndTime(vacation.endTime)
      );

      // 시간대 겹치는지 확인
      const timeOverlaps =
        startTimeIndex <= vacationEndTimeIndex &&
        endTimeIndex >= vacationStartTimeIndex;

      return timeOverlaps;
    });

    return {
      hasConflict: !!conflictingVacation,
      vacation: conflictingVacation,
    };
  };

  // 확인 모달 스타일
  const confirmOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1100,
  };

  const confirmModalStyle = {
    backgroundColor: "white",
    borderRadius: "8px",
    width: "400px",
    padding: "20px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
  };

  const confirmHeaderStyle = {
    display: "flex",
    alignItems: "center",
    marginBottom: "15px",
  };

  const confirmTitleStyle = {
    margin: 0,
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#333",
  };

  const confirmContentStyle = {
    marginBottom: "20px",
  };

  const confirmButtonsStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  };

  const confirmCancelButtonStyle = {
    padding: "8px 16px",
    backgroundColor: "#f5f5f5",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "500",
  };

  const confirmDeleteButtonStyle = {
    padding: "8px 16px",
    backgroundColor: "#f44336",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "500",
  };

  // 렌더링 부분 끝에 모달 컴포넌트 추가
  return (
    <GridContainer ref={gridRef}>
      <HeaderContainer $dates={dates} $staff={staff}>
        {renderDateHeaderCells()}
        {renderSecondRowHeaders()}
      </HeaderContainer>
      <GridContent $dates={dates} $staff={staff} className="grid-content">
        {renderTimeGridCells()}
        {renderAppointments()}
        {renderVacations()} {/* 휴가 정보 렌더링 */}
        {renderDragArea()}
        {renderSelectionArea()}
        {renderSelectedCell()}
        {renderMemoOverlays()}
      </GridContent>
      {showForm && (
        <AppointmentForm
          className="appointment-form"
          style={{
            left: formPosition.left,
            top: formPosition.top,
            position: "fixed", // 고정 위치로 변경하여 스크롤과 무관하게 표시
            maxHeight: "80vh",
            overflowY: "auto", // 높이가 화면 크기를 초과할 경우 스크롤 가능하도록 설정
          }}
        >
          {/* 선택된 일정이 있거나 편집 중이면 제목 변경 */}
          <h3>{selectedAppointment ? "일정 상세 정보" : "새 일정 생성"}</h3>

          <FormContent>
            <FormColumn>
              <FormField>
                <label>제목</label>
                <Input
                  type="text"
                  value={
                    isEditing
                      ? formData.title
                      : selectedAppointment
                      ? selectedAppointment.title
                      : formData.title
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="일정 제목을 입력하세요"
                  disabled={!isEditing && selectedAppointment}
                />
              </FormField>

              {/* 담당자 선택 드롭다운 추가 */}
              <FormField>
                <label>담당자</label>
                <select
                  value={
                    isEditing
                      ? formData.staffId
                      : selectedAppointment
                      ? selectedAppointment.staffId
                      : formData.staffId
                  }
                  onChange={(e) => {
                    const selectedStaffId = e.target.value;
                    const selectedStaffMember = staff.find(
                      (s) => s.id === selectedStaffId
                    );
                    setFormData({
                      ...formData,
                      staffId: selectedStaffId,
                      staffName: selectedStaffMember
                        ? selectedStaffMember.name
                        : "",
                    });
                  }}
                  disabled={!isEditing && selectedAppointment}
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  <option value="">담당자를 선택하세요</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <TimeFieldContainer>
                <div className="time-input-container">
                  <label>시작 시간</label>
                  <TimeInputWrapper
                    onClick={() => openTimePicker(startTimeInputRef)}
                  >
                    <Input
                      ref={startTimeInputRef}
                      type="time"
                      step="900" // 15분 간격으로 조정 (기존 60 → 900초)
                      value={
                        isEditing
                          ? formData.startTime
                          : selectedAppointment
                          ? selectedAppointment.startTime
                          : formData.startTime ||
                            (selection
                              ? effectiveTimeSlots[selection.startTimeIndex]
                              : "")
                      }
                      onChange={(e) => {
                        handleTimeChange("startTime", e.target.value);
                      }}
                      onClick={(e) => {
                        // 이벤트 전파 중지하여 두 번 호출되지 않도록 함
                        e.stopPropagation();
                      }}
                      disabled={!isEditing && selectedAppointment}
                    />
                  </TimeInputWrapper>
                </div>
                <div className="time-input-container">
                  <label>종료 시간</label>
                  <TimeInputWrapper
                    onClick={() => openTimePicker(endTimeInputRef)}
                  >
                    <Input
                      ref={endTimeInputRef}
                      type="time"
                      step="900" // 15분 간격으로 조정 (기존 60 → 900초)
                      value={
                        isEditing
                          ? formData.endTime
                          : selectedAppointment
                          ? selectedAppointment.endTime
                          : formData.endTime ||
                            (selection
                              ? getEndTime(
                                  effectiveTimeSlots[selection.endTimeIndex]
                                )
                              : "")
                      }
                      onChange={(e) => {
                        handleTimeChange("endTime", e.target.value);
                      }}
                      onClick={(e) => {
                        // 이벤트 전파 중지하여 두 번 호출되지 않도록 함
                        e.stopPropagation();
                      }}
                      disabled={!isEditing && selectedAppointment}
                    />
                  </TimeInputWrapper>
                </div>
              </TimeFieldContainer>
            </FormColumn>

            <FormColumn>
              <FormField>
                <label>참고사항</label>
                <TextArea
                  value={
                    isEditing
                      ? formData.notes
                      : selectedAppointment
                      ? selectedAppointment.notes
                      : formData.notes
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="참고사항을 입력하세요"
                  disabled={!isEditing && selectedAppointment}
                  style={{ height: "120px" }}
                />
              </FormField>
              <FormActions>
                <Button
                  className="secondary"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      title: "",
                      notes: "",
                      duration: "30",
                      type: "예약",
                      staffId: "",
                      staffName: "",
                    });
                    setSelection(null); // 선택 영역 초기화
                    setCurrentCell(null); // 선택된 셀 초기화
                    setSelectedAppointment(null); // 선택된 일정 초기화
                    setIsEditing(false); // 편집 모드 비활성화

                    // 화면 갱신을 위해 강제로 상태 업데이트
                    setLocalAppointments((prev) => [...prev]);
                  }}
                >
                  취소
                </Button>

                {selectedAppointment && !isEditing ? (
                  // 선택된 일정이 있고 편집 모드가 아닐 때
                  <Button className="primary" onClick={handleEditAppointment}>
                    수정
                  </Button>
                ) : (
                  // 새 일정 생성 또는 일정 편집 중
                  <Button
                    className="primary"
                    onClick={() => {
                      if (isEditing && selectedAppointment) {
                        // 일정 편집 처리
                        handleAppointmentSubmit(new Event("submit"));
                      } else if (selection) {
                        // 새 일정 생성
                        const startTimeIndex = selection.startTimeIndex;
                        const endTimeIndex = selection.endTimeIndex;
                        const dateIndex = selection.startDateIndex;
                        const staffIndex = selection.startStaffIndex;

                        // 폼 데이터에서 변경된 시간 값을 우선으로 사용
                        const startTime =
                          formData.startTime ||
                          effectiveTimeSlots[startTimeIndex];
                        const endTime =
                          formData.endTime ||
                          getEndTime(effectiveTimeSlots[endTimeIndex]);

                        const appointmentData = {
                          title: formData.title,
                          notes: formData.notes,
                          type: formData.type,
                          dateIndex: dateIndex,
                          staffId: formData.staffId || staff[staffIndex].id,
                          staffName:
                            formData.staffName || staff[staffIndex].name,
                          date: dates[dateIndex],
                          startTime: startTime,
                          endTime: endTime,
                        };

                        createAppointment(appointmentData);
                      }
                    }}
                  >
                    {isEditing ? "저장" : "생성"}
                  </Button>
                )}

                {selectedAppointment && (
                  <Button className="danger" onClick={handleDeleteAppointment}>
                    삭제
                  </Button>
                )}
              </FormActions>
            </FormColumn>
          </FormContent>
        </AppointmentForm>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="confirm-modal-overlay" style={confirmOverlayStyle}>
          <div className="confirm-modal" style={confirmModalStyle}>
            <div style={confirmHeaderStyle}>
              <div style={{ color: "#f44336", marginRight: "10px" }}>⚠️</div>
              <h3 style={confirmTitleStyle}>일정 삭제 확인</h3>
            </div>
            <div style={confirmContentStyle}>
              <p>정말로 이 일정을 삭제하시겠습니까?</p>
            </div>
            <div style={confirmButtonsStyle}>
              <button
                onClick={cancelDeleteAppointment}
                style={confirmCancelButtonStyle}
              >
                취소
              </button>
              <button
                onClick={confirmDeleteAppointment}
                style={confirmDeleteButtonStyle}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 휴가 충돌 확인 모달 */}
      {showVacationConflictModal && vacationConflictData && (
        <div className="confirm-modal-overlay" style={confirmOverlayStyle}>
          <div className="confirm-modal" style={confirmModalStyle}>
            <div style={confirmHeaderStyle}>
              <div style={{ color: "#f44336", marginRight: "10px" }}>⚠️</div>
              <h3 style={confirmTitleStyle}>일정 충돌 확인</h3>
            </div>
            <div style={confirmContentStyle}>
              <p>
                선택한 시간에 의사가 {vacationConflictData.vacationType}{" "}
                중입니다. 그래도 예약을 진행하시겠습니까?
              </p>
            </div>
            <div style={confirmButtonsStyle}>
              <button
                onClick={cancelVacationConflict}
                style={confirmCancelButtonStyle}
              >
                취소
              </button>
              <button
                onClick={confirmVacationConflict}
                style={confirmDeleteButtonStyle}
              >
                진행
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 휴가 상세 정보 모달 */}
      {showVacationDetail && selectedVacation && (
        <AppointmentForm
          className="appointment-form"
          style={{
            left: formPosition.left,
            top: formPosition.top,
            position: "fixed",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <h3>휴가 상세 정보</h3>

          <FormContent>
            <FormColumn>
              <TimeFieldContainer>
                <div className="time-input-container">
                  <label>유형</label>
                  <Input
                    type="text"
                    value={selectedVacation.vacationType || "휴가"}
                    disabled={true}
                  />
                </div>
                <div className="time-input-container">
                  <label>휴가자</label>
                  <Input
                    type="text"
                    value={selectedVacation.staffName || "의료진"}
                    disabled={true}
                  />
                </div>
              </TimeFieldContainer>

              <TimeFieldContainer>
                <div className="time-input-container">
                  <label>날짜</label>
                  <Input
                    type="text"
                    value={format(
                      new Date(selectedVacation.startDate),
                      "yyyy-MM-dd"
                    )}
                    disabled={true}
                  />
                </div>
              </TimeFieldContainer>

              <TimeFieldContainer>
                <div className="time-input-container">
                  <label>시작 시간</label>
                  <Input
                    type="text"
                    value={selectedVacation.startTime || ""}
                    disabled={true}
                  />
                </div>
                <div className="time-input-container">
                  <label>종료 시간</label>
                  <Input
                    type="text"
                    value={selectedVacation.endTime || ""}
                    disabled={true}
                  />
                </div>
              </TimeFieldContainer>
            </FormColumn>

            <FormColumn>
              <FormField>
                <label>사유</label>
                <TextArea
                  value="개인정보 보호를 위해 표시되지 않습니다"
                  disabled={true}
                  style={{ color: "#777", height: "120px" }}
                />
              </FormField>
            </FormColumn>
          </FormContent>

          <FormActions>
            <Button
              className="secondary"
              onClick={() => {
                setShowVacationDetail(false);
                setSelectedVacation(null);
              }}
            >
              닫기
            </Button>
            <Button
              className="danger"
              onClick={() => {
                // 휴가 숨김 처리 로직
                setShowVacationDetail(false);
                setSelectedVacation(null);
                // 추가: 위와 같은 기능의 숨김 처리
                showToast("휴가가 목록에서 숨김 처리되었습니다.", "success");
              }}
            >
              숨김
            </Button>
          </FormActions>
        </AppointmentForm>
      )}
    </GridContainer>
  );
};

export default ScheduleGrid;
