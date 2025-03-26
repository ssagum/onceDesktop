import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import styled, { keyframes } from "styled-components";
import { format, parseISO, isToday } from "date-fns";
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
} from "firebase/firestore";
import { db } from "../../firebase";

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
  width: 280px;
  animation: ${slideDown} 0.2s ease-out;

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
  margin-top: 12px;
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

const ScheduleGrid = ({
  dates,
  timeSlots = [],
  staff = [],
  appointments: initialAppointments = [],
  onAppointmentCreate,
  onAppointmentUpdate,
  onAppointmentDelete,
  viewMode = "진료",
  showToast,
}) => {
  const gridRef = useRef(null);
  // 초기 appointments 저장
  const [localAppointments, setLocalAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formPosition, setFormPosition] = useState({ left: 0, top: 0 });
  const [formData, setFormData] = useState({
    title: "",
    notes: "",
    duration: "30",
    type: "예약",
  });
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showSelectionForm, setShowSelectionForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  // 날짜 포맷 함수
  const formatDate = (date, formatStr) => {
    if (formatStr === "M/D") {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    } else if (formatStr === "ddd") {
      return ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
    } else {
      return format(date, formatStr);
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
      const formWidth = 300;
      const formHeight = 400;

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
        const formWidth = 300;
        left =
          rect.right + 10 + formWidth > viewportWidth
            ? rect.left - formWidth - 10
            : rect.right + 10;

        // 화면 아래에 충분한 공간이 있는지 확인, 없으면 위에 배치
        const formHeight = 400;
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
    const formWidth = 300;
    const formHeight = 400;

    if (left + formWidth > viewportWidth) {
      left = Math.max(10, left - formWidth - 20);
    }

    if (top + formHeight > viewportHeight) {
      top = Math.max(10, viewportHeight - formHeight - 10);
    }

    // 폼 위치 설정
    setFormPosition({ left, top });

    // 빈 폼 데이터로 초기화
    setFormData({
      title: "",
      notes: "",
      duration: "30",
      type: "예약",
      startTime: effectiveTimeSlots[timeIndex],
      endTime: getEndTime(effectiveTimeSlots[timeIndex]),
      date: format(dates[dateIndex], "yyyy-MM-dd"),
      staffId: staff[staffIndex].id,
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

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.date || !formData.startTime || !formData.endTime) {
        showToast("필수 정보를 모두 입력해주세요.", "error");
        return;
      }

      let result = null;

      if (isEditing && selectedAppointment) {
        // 기존 일정 수정
        const updatedAppointment = {
          ...selectedAppointment,
          ...formData,
          dateIndex: selectedAppointment.dateIndex,
          updatedAt: new Date().toISOString(),
        };

        // 상위 컴포넌트의 update 함수 호출
        result = await onAppointmentUpdate(updatedAppointment);
        showToast("일정이 수정되었습니다.", "success");
      } else {
        // 새 일정 생성
        const newAppointment = {
          ...formData,
          dateIndex: dates.findIndex(
            (date) => format(date, "yyyy-MM-dd") === formData.date
          ),
          createdAt: new Date().toISOString(),
        };

        // 상위 컴포넌트의 create 함수 호출
        result = await onAppointmentCreate(newAppointment);
        showToast("일정이 추가되었습니다.", "success");
      }

      // 폼 초기화 및 상태 리셋
      setFormData({
        title: "",
        date: "",
        startTime: "",
        endTime: "",
        staffId: "",
        notes: "",
        type: viewMode,
      });
      setShowForm(false);
      setIsEditing(false);
      setSelectedAppointment(null);

      console.log("일정 작업 완료, 결과:", result);
    } catch (error) {
      console.error("일정 저장 중 오류 발생:", error);
      showToast("일정 저장 중 오류가 발생했습니다.", "error");
    }
  };

  const handleDeleteAppointment = async () => {
    try {
      if (!selectedAppointment) return;

      if (window.confirm("정말로 이 일정을 삭제하시겠습니까?")) {
        await onAppointmentDelete(selectedAppointment.id);

        // 폼 닫기 및 상태 초기화
        setShowForm(false);
        setShowSelectionForm(false);
        setIsEditing(false);
        setSelectedAppointment(null);

        showToast("일정이 삭제되었습니다.", "success");
      }
    } catch (error) {
      console.error("일정 삭제 중 오류 발생:", error);
      showToast("일정 삭제 중 오류가 발생했습니다.", "error");
    }
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
    const formWidth = 300;
    const formHeight = 400;

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
      });
      setSelection(null); // 선택 영역 초기화
      setCurrentCell(null); // 선택된 셀 초기화
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
  }, [showForm]); // showForm 상태가 변경될 때마다 이펙트 재실행

  // 일정 생성 함수 수정 - 더 세밀한 시간 단위 지원
  const createAppointment = async (data) => {
    try {
      // 시간대 계산 로직
      const startTime =
        data.startTime ||
        (data.startTimeIndex ? effectiveTimeSlots[data.startTimeIndex] : null);
      const endTime =
        data.endTime ||
        (data.endTimeIndex
          ? getEndTime(effectiveTimeSlots[data.endTimeIndex])
          : null);

      if (!startTime || !endTime) {
        alert("시작 시간과 종료 시간을 설정해주세요.");
        return;
      }

      // 시간 검증 - 종료 시간이 시작 시간보다 나중인지
      if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
        alert("종료 시간은 시작 시간보다 나중이어야 합니다.");
        return;
      }

      // 담당자 정보 가져오기
      const selectedStaff = staff.find((s) => s.id === data.staffId);

      // 새 일정 데이터 생성
      const newAppointment = {
        title: data.title || "",
        staffId: data.staffId,
        staffName: selectedStaff ? selectedStaff.name : "알 수 없음",
        date: format(data.date, "yyyy-MM-dd"),
        startTime,
        endTime,
        notes: data.notes || "",
        // 명시적으로 viewMode에 따라 type 설정
        type: viewMode === "물리치료" ? "물리치료" : "진료",
        dateIndex: data.dateIndex,
        staffColor: selectedStaff ? selectedStaff.color : "#999",
      };

      console.log("ScheduleGrid - 새 일정 생성:", newAppointment);

      // 상위 컴포넌트 콜백 호출 - 여기서 Firebase 저장 처리
      let savedAppointment = null;
      if (onAppointmentCreate) {
        // 생성된 예약 정보 (id 포함) 받아오기
        savedAppointment = await onAppointmentCreate(newAppointment);

        // 로컬 상태 업데이트 - 반환된 객체가 있는 경우만
        if (savedAppointment && savedAppointment.id) {
          console.log("로컬 상태 업데이트:", savedAppointment);
          // 로컬 상태에 새 일정 추가
          setLocalAppointments((prevAppointments) => [
            ...prevAppointments,
            savedAppointment,
          ]);

          // Toast 메시지 표시 (props로 전달받은 경우)
          if (showToast) {
            showToast(
              `${savedAppointment.title || "새 일정"}이(가) 등록되었습니다.`,
              "success"
            );
          }
        }
      }

      // 폼 닫기 및 상태 초기화
      setShowForm(false);
      setSelection(null); // 선택 영역 초기화
      setCurrentCell(null); // 선택된 셀 초기화
    } catch (error) {
      console.error("일정 생성 오류:", error);
      alert("일정을 저장하는 중 오류가 발생했습니다.");
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

        // 특정 시간대 (21:30)인 경우 "메모" 대신 "21:30" 표시
        let displayTime = time;
        if (is2130) {
          displayTime = "21:30"; // "메모" 대신 "21:30"으로 변경
        } else if (timeIndex === 8) {
          // 9번째 행 (0-based index)
          displayTime = "13:00";
        } else if (timeIndex === 11) {
          // 12번째 행 (0-based index)
          displayTime = "14:00";
        } else if (
          (timeIndex === 9 || timeIndex === 10) &&
          dayOfWeekNumber !== 6 &&
          dayOfWeekNumber !== 0
        ) {
          // 휴게시간 행 (10, 11번째) - 토요일과 일요일 제외
          displayTime = timeIndex === 9 ? "점심" : "시간";
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
            {shouldShowTime ? displayTime : displayTime}
          </Cell>
        );

        // 직원 셀 추가 - 인원별 메모 제거
        staff.forEach((person, staffIndex) => {
          const colIndex = startCol + staffIndex + 1;
          const cellKey = `cell-${dateIndex}-${staffIndex}-${timeIndex}`;
          // 영업 시간 외여도 드래그는 가능하도록 변경, 휴게시간은 예외
          const canInteract = !isBreakTimeForDay;

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
                backgroundColor: isOutOfBusinessHours
                  ? "#f9f9f9"
                  : isBreakTimeForDay
                  ? "#fff8e1"
                  : isToday
                  ? "#fafeff"
                  : undefined,
                cursor: isBreakTimeForDay ? "not-allowed" : "pointer",
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
      }

      // 새 항목 추가
      const updatedItems = [...currentItems, content.trim()];

      // 상태 업데이트
      setMemos((prevMemos) => ({
        ...prevMemos,
        [memoKey]: updatedItems,
      }));

      // Firestore에 저장
      const [, date] = memoKey.split("-");
      const memoRef = doc(db, "memos", memoKey);
      await setDoc(memoRef, {
        date,
        content: updatedItems,
        updatedAt: new Date(),
      });

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
      }

      // 항목 삭제
      const updatedItems = currentItems.filter(
        (_, index) => index !== itemIndex
      );

      // 상태 업데이트
      setMemos((prevMemos) => ({
        ...prevMemos,
        [memoKey]: updatedItems,
      }));

      // Firestore에 저장
      const [, date] = memoKey.split("-");
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
            loadedMemos[memoKey] = memoData.content;
            console.log("메모 로드됨:", memoKey, memoData.content);
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

  // 일정 렌더링 함수 수정 - 시간에 비례하여 표시
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

      // 시작 시간에 가장 가까운 슬롯 찾기
      const startMinutes = timeToMinutes(appointment.startTime);
      let startTimeIndex = 0;
      let startTimeOffset = 0;

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

      // 종료 시간에 가장 가까운 슬롯 찾기
      const endMinutes = timeToMinutes(appointment.endTime);
      let endTimeIndex = 0;
      let endTimeOffset = 0;

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

      // 컬럼 인덱스 계산
      const startCol = dateIndex * (staff.length + 1) + 1; // 각 날짜 시작 컬럼
      const colIndex = startCol + staffIndex + 1; // 시간 열 다음부터 직원 열 시작

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

      // 정확한 시작 위치와 높이 계산
      const top = startTimeIndex * cellHeight + startTimeOffset * cellHeight;
      const bottom = endTimeIndex * cellHeight + endTimeOffset * cellHeight;
      const height = bottom - top;

      // 최소 높이 보장 (너무 작은 일정은 보이게)
      const minHeight = Math.max(15, height);

      // 담당자 색상 가져오기 (있으면 사용, 없으면 기본 타입 색상)
      const appointmentColor =
        appointment.staffColor ||
        appointmentTypeColors[appointment.type] ||
        "#64B5F6";

      return (
        <AppointmentBlock
          key={`appointment-${appointment.id}`}
          data-appointment-id={appointment.id}
          style={{
            gridColumn: colIndex,
            gridRow: `${startTimeIndex + 1} / span ${
              endTimeIndex - startTimeIndex + 1
            }`,
            backgroundColor: appointmentColor,
            zIndex: 5,
            marginTop: `${startTimeOffset * cellHeight}px`,
            height: `${minHeight}px`,
            maxHeight: `${
              (endTimeIndex - startTimeIndex + 1) * cellHeight - 4
            }px`, // 여백 고려
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
                borderWidth: "12px 12px 12px 12px",
              }}
            />
          )}

          <div className="appointment-content">
            <div className="title">{appointment.title}</div>
            <div className="time">
              {formatTime(appointment.startTime)} -{" "}
              {formatTime(appointment.endTime)}
            </div>
            {appointment.staffName && (
              <div
                className="staff-name"
                style={{ fontSize: "0.8em", marginTop: "3px", opacity: 0.9 }}
              >
                {appointment.staffName}
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
          시간
        </HeaderCell>
      );

      // 담당자 헤더들 추가
      staff.forEach((person, staffIndex) => {
        const colIndex = startCol + staffIndex + 1;

        cells.push(
          <HeaderCell
            key={`staff-${dateIndex}-${staffIndex}`}
            className="staff-header"
            style={{
              gridColumn: colIndex,
              gridRow: "2",
              backgroundColor: isToday ? "#e6f7ff" : "#f9f9f9",
              borderRight: "1px solid #eee",
              borderBottom: "1px solid #ddd",
              minWidth: minColumnWidth,
            }}
          >
            {person.name}
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
      const memoItems = memos[memoKey]
        ? typeof memos[memoKey] === "string"
          ? [memos[memoKey]]
          : memos[memoKey]
        : [];

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
            zIndex: 50,
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
                memoItems.map((item, idx) => (
                  <MemoItem key={`memo-item-${dateIndex}-${idx}`}>
                    <MemoText>{item}</MemoText>
                    <DeleteButton
                      onClick={() => handleDeleteMemoItem(memoKey, idx)}
                      title="삭제"
                    >
                      ✕
                    </DeleteButton>
                  </MemoItem>
                ))
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

  return (
    <GridContainer ref={gridRef}>
      <HeaderContainer $dates={dates} $staff={staff}>
        {renderDateHeaderCells()}
        {renderSecondRowHeaders()}
      </HeaderContainer>
      <GridContent $dates={dates} $staff={staff} className="grid-content">
        {renderTimeGridCells()}
        {renderAppointments()}
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
              <TimeInputWrapper onClick={() => openTimePicker(endTimeInputRef)}>
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
                });
                setSelection(null); // 선택 영역 초기화
                setCurrentCell(null); // 선택된 셀 초기화
                setSelectedAppointment(null); // 선택된 일정 초기화
                setIsEditing(false); // 편집 모드 비활성화
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
                      formData.startTime || effectiveTimeSlots[startTimeIndex];
                    const endTime =
                      formData.endTime ||
                      getEndTime(effectiveTimeSlots[endTimeIndex]);

                    const appointmentData = {
                      title: formData.title,
                      notes: formData.notes,
                      type: formData.type,
                      dateIndex: dateIndex,
                      staffId: staff[staffIndex].id,
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
        </AppointmentForm>
      )}
    </GridContainer>
  );
};

export default ScheduleGrid;
