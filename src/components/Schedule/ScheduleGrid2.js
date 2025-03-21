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
`;

const HeaderContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #fff;
  width: 100%;
`;

const GridContent = styled.div`
  display: grid;
  grid-template-columns: ${(props) => {
    // 시간 열을 위한 커스텀 템플릿
    let template = "";

    for (let i = 0; i < props.dates.length; i++) {
      // 각 날짜마다 첫 번째 열(시간 열)은 50px, 나머지 열은 150px 이상
      template += " 50px"; // 시간 열 (42px에서 50px로 변경)
      for (let j = 0; j < props.staff.length; j++) {
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

    for (let i = 0; i < props.dates.length; i++) {
      // 각 날짜마다 첫 번째 열(시간 열)은 50px, 나머지 열은 150px 이상
      template += " 50px"; // 시간 열 (42px에서 50px로 변경)
      for (let j = 0; j < props.staff.length; j++) {
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
  }

  .patient-name {
    font-size: 0.85em;
    margin-top: 2px;
  }

  .time {
    font-size: 0.8em;
    margin-top: auto;
    opacity: 0.9;
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

const ScheduleGrid = ({
  dates,
  timeSlots,
  staff,
  initialAppointments = [],
  onAppointmentCreate,
  onAppointmentUpdate,
  onAppointmentDelete,
}) => {
  const gridRef = useRef(null);

  // 기본 상태 변수들
  const [appointments, setAppointments] = useState(initialAppointments);

  // 그리드 행 확장 (12개 추가)
  const extendedTimeSlots = useMemo(() => {
    // 마지막 시간 슬롯 가져오기
    const lastSlot = timeSlots[timeSlots.length - 1];
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

  const [showForm, setShowForm] = useState(false);
  const [formPosition, setFormPosition] = useState({ left: 0, top: 0 });
  const [formData, setFormData] = useState({
    title: "",
    patientName: "",
    patientNumber: "",
    notes: "",
    type: "예약",
  });
  const [editingAppointment, setEditingAppointment] = useState(null);

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

  // 드래그 처리 함수 개선
  const handleDragStart = (e, dateIndex, staffIndex, timeIndex) => {
    e.preventDefault();
    setSelectedArea(null);
    setDragArea({
      dateIndex,
      staffIndex,
      startTimeIndex: timeIndex,
      endTimeIndex: timeIndex,
    });
    setIsDragging(true);
  };

  const handleDragMove = (e, dateIndex, staffIndex, timeIndex) => {
    if (!isDragging) return;

    // 같은 날짜와 같은 담당자 내에서만 드래그 허용
    if (
      dragArea.dateIndex === dateIndex &&
      dragArea.staffIndex === staffIndex &&
      dragArea.startTimeIndex <= timeIndex
    ) {
      setDragArea({
        ...dragArea,
        endTimeIndex: timeIndex,
      });
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;

    // 선택된 영역 저장
    setSelectedArea({
      ...dragArea,
      date: dates[dragArea.dateIndex],
      staffId: staff[dragArea.staffIndex].id,
      startTime: effectiveTimeSlots[dragArea.startTimeIndex],
      endTime: getEndTime(effectiveTimeSlots[dragArea.endTimeIndex]),
    });

    // 폼 데이터 초기화
    setFormData({
      title: "",
      patientName: "",
      patientNumber: "",
      notes: "",
      type: "예약",
    });

    // 폼 위치 계산 수정
    const rect = gridRef.current.getBoundingClientRect();

    // 셀 위치 계산 - 시간 열을 포함한 새 계산 방식
    const startCol = dragArea.dateIndex * (staff.length + 1) + 1;
    const colIndex = startCol + dragArea.staffIndex + 1; // 시간 열 다음부터 직원 열 시작

    const cellSelector = `[data-cell-key="cell-${dragArea.dateIndex}-${dragArea.staffIndex}-${dragArea.startTimeIndex}"]`;
    const cellElement = gridRef.current.querySelector(cellSelector);

    if (cellElement) {
      const cellRect = cellElement.getBoundingClientRect();
      setFormPosition({
        left: cellRect.left - rect.left + cellRect.width + 10,
        top: cellRect.top - rect.top + 10,
      });
    } else {
      // 대략적인 위치 계산
      setFormPosition({
        left: 250 + colIndex * minColumnWidth,
        top: (dragArea.startTimeIndex + 3) * 40 + 5,
      });
    }

    setIsDragging(false);
    setShowForm(true);
    setEditingAppointment(null);
  };

  // 유틸리티 함수 추가
  const getEndTime = (time) => {
    const [hour, minute] = time.split(":").map(Number);
    let newHour = hour;
    let newMinute = minute + 30;

    if (newMinute >= 60) {
      newHour += 1;
      newMinute = 0;
    }

    return `${newHour.toString().padStart(2, "0")}:${newMinute
      .toString()
      .padStart(2, "0")}`;
  };

  // 저장 함수 개선
  const handleSaveAppointment = () => {
    if (!selectedArea) return;

    const newAppointment = {
      id: Date.now().toString(),
      dateIndex: selectedArea.dateIndex,
      date: format(selectedArea.date, "yyyy-MM-dd"),
      staffId: selectedArea.staffId,
      staffName: staff.find((s) => s.id === selectedArea.staffId)?.name || "",
      startTime: selectedArea.startTime,
      endTime: selectedArea.endTime,
      title: formData.title,
      patientName: formData.patientName,
      patientNumber: formData.patientNumber,
      notes: formData.notes,
      type: formData.type,
    };

    // 이전 상태 저장 (실행 취소 기능용)
    setPreviousActions([
      ...previousActions,
      {
        type: "create",
        oldData: null,
        newData: newAppointment,
      },
    ]);

    onAppointmentCreate(newAppointment);
    setAppointments([...appointments, newAppointment]);
    setShowForm(false);
    setSelectedArea(null);
  };

  // 일정 수정 핸들러
  const handleEditAppointment = () => {
    if (!editingAppointment) return;

    const updatedAppointment = {
      ...editingAppointment,
      title: formData.title,
      patientName: formData.patientName,
      patientNumber: formData.patientNumber,
      notes: formData.notes,
      type: formData.type,
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
      patientName: appointment.patientName || "",
      patientNumber: appointment.patientNumber || "",
      notes: appointment.notes || "",
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

  // 폼 외부 클릭 핸들러
  const handleOutsideClick = (e) => {
    // 폼 외부 클릭 시 폼 닫기
    if (showForm && !e.target.closest(".appointment-form")) {
      setShowForm(false);
      setSelectedArea(null);
      setEditingAppointment(null);
      setFormData({
        title: "",
        patientName: "",
        patientNumber: "",
        notes: "",
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

  // 키보드 이벤트 리스너 등록
  useEffect(() => {
    document.addEventListener("keydown", handleUndo);
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("keydown", handleUndo);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [previousActions]);

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

  // 변수명 변경하여 중복 방지
  const activeDragArea = getDragArea();

  // 시간 그리드 셀 렌더링 함수 수정 - 시간 열 너비 50px로 변경
  const renderTimeGridCells = (timeIndex) => {
    let cells = [];
    const time = effectiveTimeSlots[timeIndex];

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

      // 요일별 표시 시간 제한
      let shouldShowTime = true;

      if (
        dayOfWeekNumber === 1 ||
        dayOfWeekNumber === 3 ||
        dayOfWeekNumber === 5
      ) {
        // 월수금: 19시 30분까지
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

      // 영업 시간 외인지 확인
      const isOutOfBusinessHours = !shouldShowTime || dayOfWeekNumber === 0;

      // 휴게시간 로직 변경 - 행 인덱스로 판단
      const isBreakTimeForDay =
        (timeIndex === 9 || timeIndex === 10) && // 10번째와 11번째 행 (0-based index)
        dayOfWeekNumber !== 0 &&
        dayOfWeekNumber !== 6; // 일요일과 토요일 제외

      // 특정 행에 대한 시간 표시 조정
      let displayTime = time;
      if (timeIndex === 8) {
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

      // 각 날짜별 시간 열 추가 - 너비 50px로 변경
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
            minWidth: "50px", // 42px에서 50px로 변경
            maxWidth: "50px", // 42px에서 50px로 변경
            width: "50px", // 42px에서 50px로 변경
            height: "40px",
            overflow: "hidden",
          }}
        >
          {shouldShowTime ? displayTime : ""}
        </Cell>
      );

      // 직원 셀 추가
      staff.forEach((person, staffIndex) => {
        const colIndex = startCol + staffIndex + 1;
        const cellKey = `cell-${dateIndex}-${staffIndex}-${timeIndex}`;

        cells.push(
          <Cell
            key={cellKey}
            data-cell-key={cellKey}
            isHalfHour={isHalfHour(time)}
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
              minWidth: minColumnWidth,
              height: "40px",
            }}
            onMouseDown={(e) =>
              !isOutOfBusinessHours &&
              !isBreakTimeForDay &&
              handleDragStart(e, dateIndex, staffIndex, timeIndex)
            }
            onMouseMove={(e) =>
              !isOutOfBusinessHours &&
              !isBreakTimeForDay &&
              handleDragMove(e, dateIndex, staffIndex, timeIndex)
            }
            onMouseUp={
              !isOutOfBusinessHours && !isBreakTimeForDay
                ? handleDragEnd
                : undefined
            }
          />
        );
      });
    });

    return cells;
  };

  // 일정 렌더링 함수 수정 - 컬럼 인덱스 조정
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
          <div className="appointment-content">
            <strong>{appointment.title}</strong>
            {appointment.patientName && (
              <div className="patient-name">{appointment.patientName}</div>
            )}
            <div className="time">
              {formatTime(appointment.startTime)} -{" "}
              {formatTime(appointment.endTime)}
            </div>
          </div>
        </AppointmentBlock>
      );
    });
  };

  // 드래그 선택 영역 렌더링 함수 수정 - 컬럼 인덱스 조정
  const renderSelectionArea = () => {
    if (!selectedArea) return null;

    const { dateIndex, staffIndex, startTimeIndex, endTimeIndex } =
      selectedArea;

    // 컬럼 인덱스 계산 수정 - 각 날짜마다 시간 열 고려
    const startCol = dateIndex * (staff.length + 1) + 1; // 각 날짜 시작 컬럼
    const colIndex = startCol + staffIndex + 1; // 시간 열 다음부터 직원 열 시작

    const rowSpan = endTimeIndex - startTimeIndex + 1;

    return (
      <SelectionArea
        style={{
          gridColumn: colIndex,
          gridRow: `${startTimeIndex + 1} / span ${rowSpan}`,
        }}
      />
    );
  };

  // 추가 스타일 컴포넌트 정의
  const SelectionArea = styled.div`
    background-color: rgba(66, 139, 202, 0.2);
    border: 2px dashed rgba(66, 139, 202, 0.6);
    border-radius: 4px;
    margin: 2px;
    z-index: 4;
  `;

  // 날짜 헤더 셀 렌더링 함수 수정 - 시간 열 너비 50px로 변경
  const renderDateHeaderCells = () => {
    const cells = [];

    dates.forEach((date, dateIndex) => {
      const formattedDate = formatDate(date, "M/D");
      const dayOfWeek = formatDate(date, "ddd");
      const isToday =
        format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
      const dayOfWeekNumber = date.getDay();

      // 열 인덱스 계산 (각 날짜별 시간 열 포함)
      const startCol = dateIndex * (staff.length + 1) + 1; // 각 날짜 시작 컬럼
      const endCol = startCol + staff.length; // 직원 열 포함

      cells.push(
        <HeaderCell
          key={`date-${dateIndex}`}
          className="date-header"
          style={{
            gridColumn: `${startCol} / ${endCol + 1}`, // 시간 열 + 직원 열
            gridRow: "1",
            borderLeft: dateIndex > 0 ? "1px solid #ccc" : "none",
            backgroundColor: isToday ? "#e6f7ff" : "#f9f9f9",
            minWidth: `${minColumnWidth * staff.length + 50}px`, // 42px에서 50px로 변경
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

    return cells;
  };

  // 시간 열과 담당자 헤더 함수 수정 - 시간 헤더 너비 50px로 변경
  const renderSecondRowHeaders = () => {
    let cells = [];

    dates.forEach((date, dateIndex) => {
      const isToday =
        format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
      const startCol = dateIndex * (staff.length + 1) + 1;

      // 각 날짜마다 시간 헤더 추가 - 너비 50px로 변경
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
            minWidth: "50px", // 42px에서 50px로 변경
            maxWidth: "50px", // 42px에서 50px로 변경
            width: "50px", // 42px에서 50px로 변경
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
              borderLeft: "1px solid #eee",
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
      {/* 헤더 부분 - 별도 컨테이너로 분리 */}
      <HeaderContainer>
        <HeaderRow columns={totalColumns} dates={dates} staff={staff}>
          {renderDateHeaderCells()}
        </HeaderRow>
        <HeaderRow columns={totalColumns} dates={dates} staff={staff}>
          {renderSecondRowHeaders()}
        </HeaderRow>
      </HeaderContainer>

      {/* 그리드 본문 부분 - 새 컨테이너로 감싸기 */}
      <GridContent columns={totalColumns} dates={dates} staff={staff}>
        {/* 시간대별 행 */}
        {effectiveTimeSlots.map((time, timeIndex) => {
          const isBreakTime = time >= "13:00" && time < "14:00";

          return (
            <React.Fragment key={`row-${timeIndex}`}>
              {renderTimeGridCells(timeIndex)}
            </React.Fragment>
          );
        })}

        {/* 일정 렌더링 */}
        {renderAppointments()}

        {/* 드래그 선택 영역 */}
        {isDragging && renderSelectionArea()}
      </GridContent>

      {/* 일정 입력 폼 */}
      {showForm && (
        <AppointmentForm
          style={{
            position: "absolute",
            left: `${formPosition.left}px`,
            top: `${formPosition.top}px`,
            zIndex: 100,
          }}
          className="appointment-form"
        >
          <h3>{editingAppointment ? "일정 수정" : "새 일정 등록"}</h3>

          {/* 일정 유형 버튼 */}
          <FormField>
            <label>일정 유형</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <TypeButton
                type="button"
                isActive={formData.type === "예약"}
                activeColor="#4299e1"
                onClick={() => setFormData({ ...formData, type: "예약" })}
              >
                예약
              </TypeButton>
              <TypeButton
                type="button"
                isActive={formData.type === "일반"}
                activeColor="#48bb78"
                onClick={() => setFormData({ ...formData, type: "일반" })}
              >
                일반
              </TypeButton>
              <TypeButton
                type="button"
                isActive={formData.type === "휴가"}
                activeColor="#ed8936"
                onClick={() => setFormData({ ...formData, type: "휴가" })}
              >
                휴가
              </TypeButton>
            </div>
          </FormField>

          {/* 제목 입력 */}
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

          {/* 환자 이름 */}
          <FormField>
            <label>환자 이름</label>
            <Input
              type="text"
              value={formData.patientName}
              onChange={(e) =>
                setFormData({ ...formData, patientName: e.target.value })
              }
              placeholder="환자 이름"
            />
          </FormField>

          {/* 환자 번호 */}
          <FormField>
            <label>환자 번호</label>
            <Input
              type="text"
              value={formData.patientNumber}
              onChange={(e) =>
                setFormData({ ...formData, patientNumber: e.target.value })
              }
              placeholder="환자 번호"
            />
          </FormField>

          {/* 메모 */}
          <FormField>
            <label>메모</label>
            <TextArea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="추가 메모..."
            />
          </FormField>

          {/* 버튼 영역 */}
          <FormActions>
            <Button
              type="button"
              className="secondary"
              onClick={() => {
                setShowForm(false);
                setSelectedArea(null);
                setEditingAppointment(null);
              }}
            >
              취소
            </Button>

            {editingAppointment ? (
              <>
                <Button
                  type="button"
                  className="danger"
                  onClick={handleDeleteAppointment}
                >
                  삭제
                </Button>
                <Button
                  type="button"
                  className="primary"
                  onClick={handleEditAppointment}
                >
                  수정
                </Button>
              </>
            ) : (
              <Button
                type="button"
                className="primary"
                onClick={handleSaveAppointment}
              >
                저장
              </Button>
            )}
          </FormActions>

          {/* 예약 세부 옵션 (12줄 추가) */}
          <div
            style={{
              marginTop: "12px",
              borderTop: "1px solid #edf2f7",
              paddingTop: "12px",
            }}
          >
            <h4 style={{ fontSize: "14px", margin: "0 0 8px 0" }}>추가 옵션</h4>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <input
                type="checkbox"
                id="send-notification"
                style={{ marginRight: "8px" }}
              />
              <label htmlFor="send-notification" style={{ fontSize: "13px" }}>
                예약 확인 메시지 발송
              </label>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <input
                type="checkbox"
                id="recurring"
                style={{ marginRight: "8px" }}
              />
              <label htmlFor="recurring" style={{ fontSize: "13px" }}>
                정기 예약으로 설정
              </label>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <input
                type="checkbox"
                id="reminder"
                style={{ marginRight: "8px" }}
              />
              <label htmlFor="reminder" style={{ fontSize: "13px" }}>
                예약 하루 전 알림 설정
              </label>
            </div>
          </div>
        </AppointmentForm>
      )}
    </GridContainer>
  );
};

export default ScheduleGrid;
