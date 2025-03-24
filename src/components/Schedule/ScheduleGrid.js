import React, { useState, useEffect, useRef, useMemo } from "react";
import styled, { keyframes } from "styled-components";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

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
    border-style: solid;
    border-width: 0 10px 10px 0;
    border-color: transparent #ffffff transparent transparent;
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
  position: absolute;
  background-color: rgba(66, 153, 225, 0.15);
  border: 2px solid #4299e1;
  pointer-events: none;
  z-index: 4;
  transition: all 0.1s ease;
  box-sizing: border-box;
  border-radius: 4px;
  width: calc(100% - 4px);
  height: calc(100% - 4px);
  top: 2px;
  left: 2px;
`;

const SelectedCell = styled.div`
  position: absolute;
  background-color: rgba(66, 153, 225, 0.15);
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

const ScheduleGrid = ({
  dates = [],
  timeSlots = [],
  staff = [],
  initialAppointments = [],
  onAppointmentCreate,
  onAppointmentUpdate,
  onAppointmentDelete,
}) => {
  const gridRef = useRef(null);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [showForm, setShowForm] = useState(false);
  const [formPosition, setFormPosition] = useState({ left: 0, top: 0 });
  const [formData, setFormData] = useState({
    title: "",
    notes: "",
    duration: "30",
    type: "예약",
  });
  const [editingAppointment, setEditingAppointment] = useState(null);

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

  const handleMouseUp = (e, dateIndex, staffIndex, timeIndex) => {
    if (!isSelecting) return;

    setIsSelecting(false);
    const cell = { dateIndex, staffIndex, timeIndex };

    // 선택 영역이 있는 경우
    if (selection) {
      const {
        startTimeIndex,
        endTimeIndex,
        startDateIndex,
        endDateIndex,
        startStaffIndex,
        endStaffIndex,
      } = selection;

      // 선택된 영역의 정보로 폼 표시
      const selectedArea = {
        dateIndex: startDateIndex,
        staffIndex: startStaffIndex,
        startTimeIndex,
        endTimeIndex,
        date: dates[startDateIndex],
        staffId: staff[startStaffIndex].id,
        startTime: effectiveTimeSlots[startTimeIndex],
        endTime: effectiveTimeSlots[endTimeIndex],
      };

      setFormData({
        title: "",
        notes: "",
        duration: ((endTimeIndex - startTimeIndex + 1) * 30).toString(),
        type: "예약",
      });

      // 폼 위치 계산 및 표시
      const cellElement = gridRef.current.querySelector(
        `[data-cell-key="cell-${startDateIndex}-${startStaffIndex}-${startTimeIndex}"]`
      );

      if (cellElement) {
        const rect = cellElement.getBoundingClientRect();
        const gridRect = gridRef.current.getBoundingClientRect();

        setFormPosition({
          left: rect.right - gridRect.left + 10,
          top: rect.top - gridRect.top + 10,
        });
      }

      setShowForm(true);
    } else {
      // 단일 셀 선택의 경우
      const selectedArea = {
        dateIndex,
        staffIndex,
        startTimeIndex: timeIndex,
        endTimeIndex: timeIndex,
        date: dates[dateIndex],
        staffId: staff[staffIndex].id,
        startTime: effectiveTimeSlots[timeIndex],
        endTime: effectiveTimeSlots[timeIndex],
      };

      setFormData({
        title: "",
        notes: "",
        duration: "30",
        type: "예약",
      });

      // 폼 위치 계산 및 표시
      const cellElement = gridRef.current.querySelector(
        `[data-cell-key="cell-${dateIndex}-${staffIndex}-${timeIndex}"]`
      );

      if (cellElement) {
        const rect = cellElement.getBoundingClientRect();
        const gridRect = gridRef.current.getBoundingClientRect();

        setFormPosition({
          left: rect.right - gridRect.left + 10,
          top: rect.top - gridRect.top + 10,
        });
      }

      setShowForm(true);
    }
  };

  // 일정 수정 핸들러 수정
  const handleEditAppointment = () => {
    if (!editingAppointment) return;

    // 소요시간에 따라 endTime 계산
    const startTime = editingAppointment.startTime;
    const durationMinutes = parseInt(formData.duration, 10);
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + durationMinutes;
    const endTime = minutesToTime(endMinutes);

    const updatedAppointment = {
      ...editingAppointment,
      title: formData.title,
      notes: formData.notes,
      type: formData.type,
      endTime: endTime,
    };

    // 이전 상태 저장 (실행 취소 기능용)
    setPreviousActions([
      ...previousActions,
      {
        type: "update",
        oldData: editingAppointment,
        newData: updatedAppointment,
      },
    ]);

    onAppointmentUpdate(updatedAppointment);
    setShowForm(false);
    setSelectedArea(null);
    setEditingAppointment(null);
  };

  // 일정 삭제 핸들러
  const handleDeleteAppointment = () => {
    if (editingAppointment) {
      // 이전 상태 저장 (실행 취소 기능용)
      setPreviousActions([
        ...previousActions,
        {
          type: "delete",
          oldData: editingAppointment,
          newData: null,
        },
      ]);

      onAppointmentDelete(editingAppointment.id);
      setShowForm(false);
      setSelectedArea(null);
      setEditingAppointment(null);
    }
  };

  // 일정 클릭 핸들러
  const handleAppointmentClick = (appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      title: appointment.title,
      notes: appointment.notes || "",
      duration: "30",
      type: appointment.type || "예약",
    });

    // 폼 위치 계산 수정
    const rect = gridRef.current.getBoundingClientRect();
    const dateIndex = appointment.dateIndex;
    const appointmentStartTimeIndex = effectiveTimeSlots.findIndex(
      (time) => time === appointment.startTime
    );

    // 담당자 인덱스 찾기
    const staffIndex = staff.findIndex((s) => s.id === appointment.staffId);

    // 셀의 위치를 찾기 위해 해당 셀 요소 찾기
    const cellSelector = `[data-cell-key="cell-${dateIndex}-${staffIndex}-${appointmentStartTimeIndex}"]`;
    const cellElement = gridRef.current.querySelector(cellSelector);

    let left = 100; // 기본값
    if (cellElement) {
      const cellRect = cellElement.getBoundingClientRect();
      left = cellRect.left - rect.left + cellRect.width + 10; // 셀 오른쪽에 폼 위치
    } else {
      // 요소를 찾지 못한 경우 근사치 계산
      const colIndex = dateIndex * staff.length + staffIndex + 1;
      const totalWidth = rect.width;
      const cellWidth = (totalWidth - 80) / totalColumns; // 시간 열(80px) 제외한 셀 너비
      left = 80 + colIndex * cellWidth + 10; // 대략적인 위치
    }

    setFormPosition({
      left: left,
      top: headerHeight + appointmentStartTimeIndex * cellHeight,
    });

    setShowForm(true);
  };

  // 폼 외부 클릭 핸들러 수정
  const handleOutsideClick = (e) => {
    // 폼 외부 클릭 시 폼만 닫기 (선택 영역은 유지)
    if (showForm && !e.target.closest(".appointment-form")) {
      setShowForm(false);
      setEditingAppointment(null);
      setFormData({
        title: "",
        notes: "",
        duration: "30",
        type: "예약",
      });
    }
  };

  // 실행 취소 (Ctrl+Z) 핸들러
  const handleUndo = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();

      if (previousActions.length > 0) {
        const lastAction = previousActions[previousActions.length - 1];

        // 마지막 작업에 따른 처리
        if (lastAction.type === "create") {
          // 생성 작업 취소 -> 삭제
          onAppointmentDelete(lastAction.newData.id);
        } else if (lastAction.type === "update") {
          // 수정 작업 취소 -> 이전 상태로 복원
          onAppointmentUpdate(lastAction.oldData);
        } else if (lastAction.type === "delete") {
          // 삭제 작업 취소 -> 복원
          onAppointmentCreate(lastAction.oldData);
        }

        // 작업 기록에서 제거
        setPreviousActions(previousActions.slice(0, -1));
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

  // 셀 렌더링 함수 수정
  const renderTimeGridCells = () => {
    let cells = [];

    effectiveTimeSlots.forEach((time, timeIndex) => {
      dates.forEach((date, dateIndex) => {
        const isToday =
          format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
        const dayOfWeekNumber = date.getDay();
        const startCol = dateIndex * (staff.length + 1) + 1;

        // 시간 표시 제한 로직
        const timeHour = parseInt(time.split(":")[0], 10);
        const timeMinute = parseInt(time.split(":")[1], 10);
        const timeInMinutes = timeHour * 60 + timeMinute;

        let shouldShowTime = true;
        if (
          dayOfWeekNumber === 1 ||
          dayOfWeekNumber === 3 ||
          dayOfWeekNumber === 5
        ) {
          shouldShowTime = timeInMinutes <= 19 * 60;
        } else if (dayOfWeekNumber === 2 || dayOfWeekNumber === 4) {
          shouldShowTime = timeInMinutes <= 20 * 60;
        } else if (dayOfWeekNumber === 6) {
          shouldShowTime = timeInMinutes <= 14 * 60;
        } else if (dayOfWeekNumber === 0) {
          shouldShowTime = false;
        }

        const isOutOfBusinessHours = !shouldShowTime || dayOfWeekNumber === 0;
        const isBreakTimeForDay =
          (timeIndex === 9 || timeIndex === 10) &&
          dayOfWeekNumber !== 0 &&
          dayOfWeekNumber !== 6;

        // 시간 열
        cells.push(
          <Cell
            key={`time-col-${dateIndex}-${timeIndex}`}
            style={{
              gridColumn: startCol,
              gridRow: timeIndex + 1,
              backgroundColor: isBreakTimeForDay ? "#fff8e1" : "#f5f5f5",
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
            {shouldShowTime ? time : ""}
          </Cell>
        );

        // 직원 셀
        staff.forEach((person, staffIndex) => {
          const colIndex = startCol + staffIndex + 1;
          const cellKey = `cell-${dateIndex}-${staffIndex}-${timeIndex}`;
          const canInteract = !isOutOfBusinessHours && !isBreakTimeForDay;

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
                cursor: isOutOfBusinessHours ? "not-allowed" : "pointer",
                opacity: isOutOfBusinessHours ? 0.5 : 1,
                minWidth: "150px",
                height: "40px",
                pointerEvents: canInteract ? "auto" : "none",
              }}
              className="schedule-cell"
              onMouseDown={(e) =>
                handleMouseDown(e, dateIndex, staffIndex, timeIndex)
              }
              onMouseMove={(e) =>
                handleMouseMove(e, dateIndex, staffIndex, timeIndex)
              }
              onMouseUp={(e) =>
                handleMouseUp(e, dateIndex, staffIndex, timeIndex)
              }
            />
          );
        });
      });
    });

    return cells;
  };

  // 일정 렌더링 함수 수정 - 참고사항 표시기 추가
  const renderAppointments = () => {
    return appointments.map((appointment) => {
      const dateIndex = appointment.dateIndex;
      const staffIndex = staff.findIndex((s) => s.id === appointment.staffId);
      const appointmentTimeIndex = effectiveTimeSlots.findIndex(
        (time) => time === appointment.startTime
      );

      if (appointmentTimeIndex < 0) return null; // 시작 시간이 없는 경우

      const startMinutes = timeToMinutes(appointment.startTime);
      const endMinutes = timeToMinutes(appointment.endTime);
      const durationCells = Math.ceil((endMinutes - startMinutes) / 30); // 30분 간격 기준

      // 컬럼 인덱스 계산 수정 - 각 날짜마다 시간 열 고려
      const startCol = dateIndex * (staff.length + 1) + 1; // 각 날짜 시작 컬럼
      const colIndex = startCol + staffIndex + 1; // 시간 열 다음부터 직원 열 시작

      // 참고사항이 있는지 확인
      const hasNotes = appointment.notes && appointment.notes.trim().length > 0;

      return (
        <AppointmentBlock
          key={`appointment-${appointment.id}`}
          style={{
            gridColumn: colIndex,
            gridRow: `${appointmentTimeIndex + 1} / span ${durationCells}`,
            backgroundColor:
              appointmentTypeColors[appointment.type] || "#64B5F6",
            zIndex: 5,
          }}
          onClick={() => handleAppointmentClick(appointment)}
        >
          {/* 참고사항 표시기 */}
          {hasNotes && (
            <div
              className="notes-indicator"
              title="참고사항 있음"
              style={{
                borderColor: `transparent ${
                  appointment.type === "예약"
                    ? "#ffffff"
                    : appointment.type === "일반"
                    ? "#ffffff"
                    : appointment.type === "휴가"
                    ? "#ffffff"
                    : "#ffffff"
                } transparent transparent`,
                opacity: 0.9,
                borderWidth: "0 12px 12px 0",
              }}
            />
          )}

          <div className="appointment-content">
            <div className="title">{appointment.title}</div>
            <div className="time">
              {formatTime(appointment.startTime)} -{" "}
              {formatTime(appointment.endTime)}
            </div>
          </div>
        </AppointmentBlock>
      );
    });
  };

  // 드래그 선택 영역 렌더링 함수 수정 - 텍스트 표시 추가
  const renderSelectionArea = () => {
    if (!selection) return null;

    const { startDateIndex, startStaffIndex, startTimeIndex, endTimeIndex } =
      selection;

    // 선택된 셀의 위치를 찾기
    const startCell = gridRef.current.querySelector(
      `[data-cell-key="cell-${startDateIndex}-${startStaffIndex}-${startTimeIndex}"]`
    );

    if (!startCell) return null;

    const startRect = startCell.getBoundingClientRect();
    const gridRect = gridRef.current.getBoundingClientRect();
    const height = (endTimeIndex - startTimeIndex + 1) * startRect.height;

    return (
      <SelectionArea
        style={{
          position: "absolute",
          left: startRect.left - gridRect.left,
          top: startRect.top - gridRect.top,
          width: startRect.width,
          height: height,
          pointerEvents: "none",
          border: "2px solid #4299e1",
          borderRadius: "4px",
        }}
      />
    );
  };

  // 선택된 셀 렌더링 함수 수정
  const renderSelectedCell = () => {
    if (!currentCell) return null;

    const { dateIndex, staffIndex, timeIndex } = currentCell;
    const startCol = dateIndex * (staff.length + 1) + 1;
    const colIndex = startCol + staffIndex + 1;

    // 선택된 셀의 위치를 찾기
    const cellElement = gridRef.current.querySelector(
      `[data-cell-key="cell-${dateIndex}-${staffIndex}-${timeIndex}"]`
    );

    if (!cellElement) return null;

    const cellRect = cellElement.getBoundingClientRect();
    const gridRect = gridRef.current.getBoundingClientRect();

    return (
      <SelectedCell
        style={{
          position: "absolute",
          left: cellRect.left - gridRect.left,
          top: cellRect.top - gridRect.top,
          width: cellRect.width,
          height: cellRect.height,
        }}
      />
    );
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

  return (
    <GridContainer ref={gridRef}>
      <HeaderContainer $dates={dates} $staff={staff}>
        {renderDateHeaderCells()}
        {renderSecondRowHeaders()}
      </HeaderContainer>
      <GridContent $dates={dates} $staff={staff}>
        {renderTimeGridCells()}
        {renderAppointments()}
        {renderSelectionArea()}
        {renderSelectedCell()}
      </GridContent>
      {showForm && (
        <AppointmentForm
          className="appointment-form"
          style={{
            left: formPosition.left,
            top: formPosition.top,
          }}
        >
          <FormField>
            <label>제목</label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="일정 제목을 입력하세요"
            />
          </FormField>
          <FormField>
            <label>소요시간</label>
            <Input
              type="number"
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: e.target.value })
              }
              min="30"
              step="30"
            />
          </FormField>
          <FormField>
            <label>참고사항</label>
            <TextArea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="참고사항을 입력하세요"
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
              }}
            >
              취소
            </Button>
            <Button
              className="primary"
              onClick={() => {
                if (editingAppointment) {
                  handleEditAppointment();
                } else {
                  onAppointmentCreate({
                    ...formData,
                    ...selectedArea,
                  });
                }
              }}
            >
              {editingAppointment ? "수정" : "생성"}
            </Button>
            {editingAppointment && (
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
