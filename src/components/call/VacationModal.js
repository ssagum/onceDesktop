import React, { useState, useEffect } from "react";
import ModalTemplate from "../common/ModalTemplate";
import styled from "styled-components";
import { cancel } from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import { db } from "../../firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { useToast } from "../../contexts/ToastContext";
import { useUserLevel } from "../../utils/UserLevelContext";
import { JcyCalendar } from "../common/JcyCalendar";
import {
  format,
  addDays,
  isEqual,
  parseISO,
  getDay,
  differenceInDays,
  differenceInMonths,
  differenceInCalendarMonths,
  isBefore,
  isAfter,
} from "date-fns";
import WhoSelector from "../common/WhoSelector";
import DateTimeSelector from "./DateTimeSelector";
import LoginPCModal from "../common/LoginPCModal";
import {
  getUserVacationInfo,
  updateUserVacationDays,
  getUserVacationHistory,
} from "../../utils/vacationUtils";

const ModalHeaderZone = styled.div``;
const TopSection = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-bottom: 20px;
`;
const BottomSection = styled.div`
  width: 100%;
`;
const LeftTopSection = styled.div`
  flex: 1;
  max-width: 50%;
`;
const RightTopSection = styled.div`
  flex: 1;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
`;
const FormSection = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  background-color: white;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const FormRow = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 0;
  gap: 16px;
  min-height: 50px;
`;

const FormLabel = styled.div`
  font-weight: 600;
  min-width: 80px;
  display: flex;
  align-items: center;

  ${(props) =>
    props.required &&
    `
    &::after {
      content: "*";
      color: #e53e3e;
      margin-left: 4px;
    }
  `}
`;

const FormValue = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
`;

// TypeButton을 일반 컴포넌트로 변경
const TypeButton = ({ active, onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className={`w-[120px] py-2 px-3 rounded-md font-medium text-base transition-all duration-200 cursor-pointer border-2 ${
        active
          ? "bg-onceBlue text-white border-onceBlue"
          : "bg-white text-onceBlue border-onceBlue"
      }`}
    >
      {children}
    </button>
  );
};

const InfoBox = styled.div`
  background-color: ${(props) => (props.highlight ? "#ebf5ff" : "#f9fafb")};
  border: 1px solid
    ${(props) => (props.highlight ? "var(--once-blue)" : "#e5e7eb")};
  border-radius: 6px;
  padding: 8px 12px;
  font-weight: ${(props) => (props.highlight ? "600" : "400")};
  color: ${(props) => (props.highlight ? "var(--once-blue)" : "inherit")};
  display: flex;
  align-items: center;
  height: 40px;
  min-width: 70px;
`;

const StyledTextarea = styled.textarea`
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  width: 100%;
  height: 80px;
  resize: none;
  background-color: #f9fafb;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--once-blue);
    box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
  }

  &::placeholder {
    color: #a0aec0;
  }
`;

const SubmitButton = styled.button`
  padding: 10px 20px;
  background-color: var(--once-blue);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
  min-width: 120px;

  &:hover {
    background-color: var(--once-blue);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
`;

// NumberInput 컴포넌트 수정
const NumberInput = styled.input`
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 12px;
  background-color: #f9fafb;
  height: 40px;
  min-width: 80px;
  font-size: 14px;
  text-align: center;

  &:focus {
    outline: none;
    border-color: var(--once-blue);
    box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
  }

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &::placeholder {
    color: #a0aec0;
  }
`;

// ValueBox 컴포넌트 수정 - 3분할
const ValueBox = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

// 두 항목이 반반 차지하는 레이아웃
const HalfRow = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  gap: 20px;
`;

// 설명 텍스트를 위한 스타일 수정
const InfoText = styled.div`
  font-size: 16px;
  color: #6b7280;
  width: 100%;
  margin-top: 2px;
  margin-bottom: 10px;
  line-height: 1.4;
`;

// 반차 타입 옵션
const HALF_DAY_TYPES = [
  { value: "오전반차", label: "오전반차" },
  { value: "오후반차", label: "오후반차" },
];

// 휴게시간 설정
const LUNCH_BREAK = {
  start: "13:00",
  end: "14:00",
};

// 순수 반차 기준 시간 (분 단위): 4.5시간 = 270분 (휴게시간 제외)
const PURE_HALF_DAY_MINUTES = 270;

// TimeInput 컴포넌트 추가
const TimeInput = styled.input`
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 12px;
  background-color: #f9fafb;
  height: 40px;
  min-width: 80px;
  font-size: 14px;
  text-align: center;

  &:focus {
    outline: none;
    border-color: var(--once-blue);
    box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
  }
`;

export default function VacationModal({ isVisible, setIsVisible }) {
  const { userLevelData, isLoggedIn, currentUser } = useUserLevel();
  const { showToast } = useToast();

  // 현재 날짜
  const today = new Date();
  const [startDate, setStartDate] = useState(format(today, "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(today, "yyyy-MM-dd"));

  // 사용자 휴가 정보
  const [userVacationInfo, setUserVacationInfo] = useState({
    hireDate: null,
    usedVacationDays: 0,
    totalAccumulatedDays: 0,
    remainingVacationDays: 0,
  });

  // 폼 데이터 상태
  const [vacationForm, setVacationForm] = useState({
    startTime: "09:00",
    endTime: "18:00",
    reason: "",
    vacationType: "휴가", // 기본값: 휴가
    holidayCount: null, // 초기값을 null로 설정
    halfDayType: "오전반차", // 반차 타입 (오전/오후)
  });

  // 신청자 및 대체자 상태
  const [selectedApplicant, setSelectedApplicant] = useState([]);
  const [selectedReplacement, setSelectedReplacement] = useState([]);

  // JcyCalendar 참조
  const [calendarKey, setCalendarKey] = useState(0);

  // 계산된 휴가 일수 (실제 사용 일수)
  const [calculatedDays, setCalculatedDays] = useState(0);

  // 반차 여부 자동 감지
  const [dayTypes, setDayTypes] = useState({});

  // 로그인 모달 관련 상태
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // 입사일 기준 사용 가능한 휴가 일수 계산
  const calculateTotalAccumulatedDays = (hireDate) => {
    if (!hireDate) return 0;

    const hireDateObj = new Date(hireDate);
    const currentDate = new Date();

    // 입사일이 현재보다 미래인 경우
    if (isBefore(currentDate, hireDateObj)) return 0;

    // 입사 후 지난 월 수 계산
    const monthsSinceHire = differenceInCalendarMonths(
      currentDate,
      hireDateObj
    );

    // 매월 1일씩 발생하는 휴가일
    return Math.max(0, monthsSinceHire);
  };

  // 사용자의 남은 휴가 일수 가져오기
  const fetchUserVacationInfo = async () => {
    if (!isLoggedIn || !currentUser || !currentUser.id) return;

    try {
      const vacationInfo = await getUserVacationInfo(currentUser.id);
      if (vacationInfo) {
        setUserVacationInfo(vacationInfo);
      }
    } catch (error) {
      console.error("휴가 정보 조회 오류:", error);
      showToast("휴가 정보를 불러오는 중 오류가 발생했습니다.", "error");
    }
  };

  // 사용자 정보 업데이트
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      // 로그인된 사용자 정보로 신청자 필드 업데이트
      setSelectedApplicant([currentUser.id]);
      // 사용자의 휴가 정보 조회
      fetchUserVacationInfo();
    } else {
      setSelectedApplicant([]);
    }
  }, [isLoggedIn, currentUser]);

  // 로그인 모달 관련 함수들
  const openLoginModal = () => {
    setLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setLoginModalOpen(false);
  };

  // 로그인 성공 처리
  const handleLoginSuccess = () => {
    closeLoginModal();
  };

  // PC 할당 처리 (더미 함수)
  const handlePCAllocationSubmit = () => {
    // VacationModal에서는 PC 할당 기능은 실제로 사용하지 않지만,
    // 인터페이스 일관성을 위해 더미 함수 제공
    return false;
  };

  // 날짜 범위 생성 함수 수정
  const generateDateRange = (start, end) => {
    if (!start || !end) return [];

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate > endDate) return [];

    const days = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // 일요일(0)은 제외
      if (getDay(currentDate) !== 0) {
        days.push(format(currentDate, "yyyy-MM-dd"));
      }
      currentDate = addDays(currentDate, 1);
    }

    return days;
  };

  // 병원 근무 시간 설정
  const getWorkHours = (dateStr) => {
    // 날짜 문자열을 그대로 사용하여 Date 객체 생성 (이미 yyyy-MM-dd 형식임)
    const date = new Date(dateStr);
    const dayOfWeek = getDay(date); // 0: 일요일, 1: 월요일, ... 6: 토요일

    // 요일별 근무 시간
    switch (dayOfWeek) {
      case 1: // 월요일
      case 3: // 수요일
      case 5: // 금요일
        return { start: "09:00", end: "19:00" };
      case 2: // 화요일
      case 4: // 목요일
        return { start: "09:00", end: "20:00" };
      case 6: // 토요일
        return { start: "09:00", end: "14:00" };
      default: // 일요일 및 기타
        return { start: "09:00", end: "18:00" };
    }
  };

  // 시간 문자열을 분으로 변환 (예: "09:30" -> 570)
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // 시작/종료 시간을 기반으로 반차 여부 자동 감지
  const detectHalfDay = (date, startTime, endTime) => {
    const workHours = getWorkHours(date);
    const workStartMinutes = timeToMinutes(workHours.start);
    const workEndMinutes = timeToMinutes(workHours.end);
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    // 휴게시간(13:00-14:00)
    const lunchStartMinutes = timeToMinutes(LUNCH_BREAK.start);
    const lunchEndMinutes = timeToMinutes(LUNCH_BREAK.end);
    const lunchDuration = lunchEndMinutes - lunchStartMinutes; // 휴게시간 길이

    // 실제 근무 시간 (분)
    let actualWorkMinutes = endMinutes - startMinutes;

    // 실제 근무가 휴게시간을 포함하는지 확인
    const includesLunch =
      startMinutes < lunchEndMinutes && endMinutes > lunchStartMinutes;

    // 실제 근무가 휴게시간을 포함하면 휴게시간 제외
    if (includesLunch) {
      actualWorkMinutes -=
        Math.min(endMinutes, lunchEndMinutes) -
        Math.max(startMinutes, lunchStartMinutes);
    }

    // 반차 기준: 4.5시간 이하면 반차
    // 휴게시간이 포함된 경우, 총 시간에서 제외하고 순수 근무시간으로 비교
    const isHalfDay = actualWorkMinutes <= PURE_HALF_DAY_MINUTES;

    // 오전/오후 구분
    let halfDayType = null;
    if (isHalfDay) {
      // 오전 반차: 시작 시간이 근무 시작과 같고, 종료 시간이 점심 시간 이전 또는 점심 시간 중
      if (startMinutes === workStartMinutes && endMinutes <= lunchEndMinutes) {
        halfDayType = "오전반차";
      }
      // 오후 반차: 시작 시간이 점심 시간 이후 또는 점심 시간 중이고, 종료 시간이 근무 종료와 같음
      else if (
        startMinutes >= lunchStartMinutes &&
        endMinutes === workEndMinutes
      ) {
        halfDayType = "오후반차";
      }
    }

    // 일 계산: 4.5시간 이하면 0.5일, 초과하면 1일
    const workRatio = actualWorkMinutes <= PURE_HALF_DAY_MINUTES ? 0.5 : 1.0;

    return {
      isHalfDay,
      halfDayType,
      workRatio,
      actualWorkMinutes,
      includesLunch,
    };
  };

  // 반차 시간 계산
  const calculateHalfDayTimes = (dateStr, halfDayType) => {
    const workHours = getWorkHours(dateStr);

    // 반차는 순수 4.5시간 근무를 기준으로 함 (휴게시간 제외)
    if (halfDayType === "오전반차") {
      // 오전 반차: 시작 시간부터 점심 시간 전까지 근무
      return {
        startTime: workHours.start,
        endTime: LUNCH_BREAK.start,
      };
    } else {
      // 오후반차
      // 오후 반차: 점심 시간 후부터 종료 시간까지 근무
      return {
        startTime: LUNCH_BREAK.end,
        endTime: workHours.end,
      };
    }
  };

  // 특정 시간 범위에 휴게시간이 포함되는지 확인
  const includesLunchBreak = (startTime, endTime) => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const lunchStartMinutes = timeToMinutes(LUNCH_BREAK.start);
    const lunchEndMinutes = timeToMinutes(LUNCH_BREAK.end);

    return startMinutes < lunchEndMinutes && endMinutes > lunchStartMinutes;
  };

  // 휴가 유형별 날짜 및 시간 처리를 위한 useEffect
  useEffect(() => {
    // 시작일 또는 종료일이 변경될 때마다 캘린더 갱신
    setCalendarKey((prev) => prev + 1);

    // 유형별 처리 및 dayTypes 설정
    if (
      vacationForm.vacationType === "휴가" ||
      vacationForm.vacationType === "경조사"
    ) {
      // 시작일/종료일 기준 날짜 범위 생성
      const dateList = generateDateRange(startDate, endDate);

      // 각 날짜별로 시작/종료 시간 설정 및 반차 여부 자동 감지
      const newDayTypes = {};

      dateList.forEach((date) => {
        // 날짜 형식 확인 (yyyy-MM-dd 형식으로 유지)
        let dayStartTime, dayEndTime;

        if (date === startDate && date === endDate) {
          // 시작일 = 종료일인 경우
          dayStartTime = vacationForm.startTime;
          dayEndTime = vacationForm.endTime;
        } else if (date === startDate) {
          // 시작일인 경우
          dayStartTime = vacationForm.startTime;
          dayEndTime = getWorkHours(date).end;
        } else if (date === endDate) {
          // 종료일인 경우
          dayStartTime = getWorkHours(date).start;
          dayEndTime = vacationForm.endTime;
        } else {
          // 중간 날짜인 경우
          const workHours = getWorkHours(date);
          dayStartTime = workHours.start;
          dayEndTime = workHours.end;
        }

        // 해당 날짜에 대한 반차 여부 감지
        const dayInfo = detectHalfDay(date, dayStartTime, dayEndTime);

        // 휴가 또는 경조사 모드 (날짜 키를 yyyy-MM-dd 형식으로 유지)
        newDayTypes[date] = {
          startTime: dayStartTime,
          endTime: dayEndTime,
          isHalfDay: dayInfo.isHalfDay,
          halfDayType: dayInfo.halfDayType,
          workRatio:
            vacationForm.vacationType === "경조사" ? 0 : dayInfo.workRatio,
          actualWorkMinutes: dayInfo.actualWorkMinutes,
          includesLunch: dayInfo.includesLunch,
        };
      });

      setDayTypes(newDayTypes);
    } else if (vacationForm.vacationType === "반차") {
      // 반차 모드에서는 해당 날짜만 설정
      const dayInfo = detectHalfDay(
        startDate,
        vacationForm.startTime,
        vacationForm.endTime
      );

      // 반차 모드에서는 시간에 따라 자동으로 반차 여부 감지 (날짜 키를 yyyy-MM-dd 형식으로 유지)
      setDayTypes({
        [startDate]: {
          startTime: vacationForm.startTime,
          endTime: vacationForm.endTime,
          isHalfDay: true,
          halfDayType: dayInfo.halfDayType,
          workRatio: 0.5,
          actualWorkMinutes: dayInfo.actualWorkMinutes,
          includesLunch: dayInfo.includesLunch,
        },
      });
    }
  }, [
    startDate,
    endDate,
    vacationForm.startTime,
    vacationForm.endTime,
    vacationForm.holidayCount,
    vacationForm.vacationType,
  ]);

  // 휴가 일수 계산 및 업데이트를 위한 별도 useEffect
  useEffect(() => {
    // 휴가 일수 재계산
    const days = calculateVacationDays();
    setCalculatedDays(days);
  }, [dayTypes, vacationForm.holidayCount, vacationForm.vacationType]);

  // 휴가 일수 계산 함수 수정
  const calculateVacationDays = () => {
    // 경조사인 경우 무조건 0일 반환
    if (vacationForm.vacationType === "경조사") {
      return 0;
    }

    let totalDays = 0;

    // 반차 모드일 때
    if (vacationForm.vacationType === "반차") {
      // 반차는 무조건 0.5일
      totalDays = 0.5;
    } else {
      // 일반 휴가 계산
      Object.keys(dayTypes).forEach((date) => {
        const dateInfo = dayTypes[date];
        totalDays += dateInfo.workRatio;
      });
    }

    // 공휴일 수 차감
    const holidayCount =
      vacationForm.holidayCount === null || vacationForm.holidayCount === ""
        ? 0
        : Number(vacationForm.holidayCount);
    totalDays = Math.max(0, totalDays - holidayCount);

    return Number(totalDays.toFixed(1));
  };

  // 폼 입력 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVacationForm({
      ...vacationForm,
      [name]: value,
    });
  };

  // 공휴일 수 변경 핸들러 수정
  const handleHolidayCountChange = (e) => {
    const value = e.target.value === "" ? null : parseInt(e.target.value, 10);
    setVacationForm({
      ...vacationForm,
      holidayCount: value,
    });
  };

  // 휴가 유형 변경 핸들러 개선
  const handleVacationTypeChange = (type) => {
    // 반차로 변경되는 경우, 날짜 하나만 선택하도록 설정
    if (type === "반차") {
      // 반차는 시작일과 종료일이 항상 동일하도록 설정
      setEndDate(startDate);
    }

    setVacationForm((prev) => ({
      ...prev,
      vacationType: type,
    }));

    // 경조사로 변경하면 dayTypes의 모든 workRatio를 0으로 설정
    if (type === "경조사") {
      setDayTypes((prevDayTypes) => {
        const updatedDayTypes = { ...prevDayTypes };
        Object.keys(updatedDayTypes).forEach((date) => {
          updatedDayTypes[date] = {
            ...updatedDayTypes[date],
            workRatio: 0,
          };
        });
        return updatedDayTypes;
      });
    }
  };

  // 시작일 변경 핸들러 개선
  const handleStartDateChange = (date) => {
    setStartDate(date);

    // 반차 모드에서는 종료일도 함께 변경
    if (vacationForm.vacationType === "반차") {
      setEndDate(date);
    }

    // 반차 모드에서도 일반 휴가와 동일하게 시작시간 설정
    const workHours = getWorkHours(date);
    setVacationForm((prev) => ({
      ...prev,
      startTime: workHours.start,
    }));
  };

  // 종료일 변경 핸들러 개선
  const handleEndDateChange = (date) => {
    // 반차 모드에서는 종료일 변경 불가
    if (vacationForm.vacationType === "반차") {
      return;
    }

    setEndDate(date);

    // 종료일이 변경되면 해당 날짜의 근무 종료 시간으로 설정
    const workHours = getWorkHours(date);
    setVacationForm((prev) => ({
      ...prev,
      endTime: workHours.end,
    }));
  };

  // 시간 입력 핸들러 개선
  const handleTimeChange = (e) => {
    const { name, value } = e.target;

    // 즉시 업데이트하여 계산에 반영되도록 함
    setVacationForm((prev) => {
      const updatedForm = {
        ...prev,
        [name]: value,
      };

      // 시간 변경 후 즉시 dayTypes 업데이트를 위한 재계산 트리거
      setTimeout(() => {
        // 현재 날짜 범위에 대해 다시 계산
        if (vacationForm.vacationType === "휴가") {
          const dateList = generateDateRange(startDate, endDate);
          const updatedDayTypes = { ...dayTypes };

          dateList.forEach((date) => {
            // 날짜가 yyyy-MM-dd 형식인지 확인
            const formattedDate =
              typeof date === "string" ? date : format(date, "yyyy-MM-dd");

            if (formattedDate in updatedDayTypes) {
              let dayStartTime = updatedDayTypes[formattedDate].startTime;
              let dayEndTime = updatedDayTypes[formattedDate].endTime;

              // 시작일/종료일인 경우 시간 업데이트
              if (formattedDate === startDate && name === "startTime") {
                dayStartTime = value;
              } else if (formattedDate === endDate && name === "endTime") {
                dayEndTime = value;
              }

              // 해당 날짜에 대한 반차 여부 다시 계산
              const dayInfo = detectHalfDay(
                formattedDate,
                dayStartTime,
                dayEndTime
              );
              updatedDayTypes[formattedDate] = {
                ...updatedDayTypes[formattedDate],
                startTime: dayStartTime,
                endTime: dayEndTime,
                isHalfDay: dayInfo.isHalfDay,
                halfDayType: dayInfo.halfDayType,
                workRatio: dayInfo.workRatio,
                actualWorkMinutes: dayInfo.actualWorkMinutes,
                includesLunch: dayInfo.includesLunch,
              };
            }
          });

          setDayTypes(updatedDayTypes);
        }
      }, 0);

      return updatedForm;
    });
  };

  // 신청자 변경 핸들러
  const handleApplicantChange = (selectedIds) => {
    setSelectedApplicant(selectedIds);
  };

  // 대체자 변경 핸들러
  const handleReplacementChange = (selectedIds) => {
    setSelectedReplacement(selectedIds);
  };

  // 잔여 휴가 일수 계산
  const getRemainingVacationDays = () => {
    return userVacationInfo.remainingVacationDays || 0;
  };

  // 필수 필드 검증 함수 추가
  const validateRequiredFields = () => {
    // 로그인 확인
    if (!isLoggedIn) {
      return false;
    }

    // 신청자 확인
    if (selectedApplicant.length === 0) {
      return false;
    }

    // 날짜 확인
    if (!startDate || !endDate) {
      return false;
    }

    // 사유 확인
    if (!vacationForm.reason) {
      return false;
    }

    // 휴가 일수가 0이면 경고 (경조사는 제외)
    if (calculatedDays <= 0 && vacationForm.vacationType !== "경조사") {
      return false;
    }

    return true;
  };

  // 휴가 신청 제출 핸들러
  const handleSubmit = async () => {
    try {
      // 로그인 확인
      if (!isLoggedIn) {
        showToast("로그인이 필요합니다.", "error");
        openLoginModal();
        return;
      }

      // 필수 입력 검증
      if (selectedApplicant.length === 0) {
        showToast("신청자를 선택해주세요.", "error");
        return;
      }

      if (!startDate || !endDate) {
        showToast("날짜를 선택해주세요.", "error");
        return;
      }

      if (!vacationForm.reason) {
        showToast("사유를 입력해주세요.", "error");
        return;
      }

      // 계산된 휴가 일수가 0이면 경고 (경조사는 제외)
      if (calculatedDays <= 0 && vacationForm.vacationType !== "경조사") {
        showToast(
          "휴가 일수가 0일입니다. 날짜 또는 시간을 확인해주세요.",
          "error"
        );
        return;
      }

      // 잔여 휴가 일수 확인 로직 수정 - 제외일수를 감안하여 실제 사용 일수만 비교
      if (vacationForm.vacationType !== "경조사") {
        const remainingDays = getRemainingVacationDays();
        const holidayCount = Number(vacationForm.holidayCount || 0);

        // 사용 예정 휴가일에서 제외일수(공휴일 등)를 뺀 실제 사용일
        const datesSelected = Object.keys(dayTypes).length; // 선택된 총 날짜 수
        const actualVacationDays = calculatedDays; // 이미 제외일수를 감안한 값

        console.log(
          `휴가 계산: 총 선택 날짜 ${datesSelected}일, 제외일수 ${holidayCount}일, 실제 사용일 ${actualVacationDays}일, 잔여 휴가일 ${remainingDays}일`
        );

        // 실제 사용 휴가일이 0이하이면 (즉, 모든 날짜가 제외일수로 지정됨) 허용
        // 그렇지 않으면 잔여 휴가일과 비교
        if (actualVacationDays > 0 && actualVacationDays > remainingDays) {
          showToast(
            `잔여 휴가일(${remainingDays}일)보다 많은 휴가를 신청할 수 없습니다.
현재 신청한 휴가는 총 ${datesSelected}일이며, 이 중 ${holidayCount}일은 제외일수(공휴일 등)로 지정되어 실제 사용 휴가일은 ${actualVacationDays}일입니다.`,
            "error"
          );
          return;
        }
      }

      // 날짜 형식 변환 - 이미 yyyy-MM-dd 형식이므로 변환 필요 없음
      const formattedStartDate = startDate;
      const formattedEndDate = endDate;

      // 파이어베이스에 휴가 신청 데이터 추가
      const vacationData = {
        userId: currentUser.id,
        userName: currentUser.name || "익명",
        email: currentUser.email || "",
        department: userLevelData.department || "",
        location: userLevelData.location || "",
        startDate: formattedStartDate,
        startTime: vacationForm.startTime,
        endDate: formattedEndDate,
        endTime: vacationForm.endTime,
        reason: vacationForm.reason,
        vacationType: vacationForm.vacationType,
        dayTypes: dayTypes, // 모든 유형에서 dayTypes 저장
        holidayCount: Number(vacationForm.holidayCount || 0),
        replacementId:
          selectedReplacement.length > 0 ? selectedReplacement[0] : null,
        status: "대기중", // 기본 상태: 대기중, 승인됨, 거부됨
        days: calculatedDays, // 계산된 휴가 일수 저장
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "vacations"), vacationData);
      console.log("휴가 신청 성공:", docRef.id);

      // 경조사가 아닌 경우에만 사용자 문서의 사용 휴가 일수 업데이트
      if (vacationForm.vacationType !== "경조사") {
        // 유틸리티 함수를 사용하여 휴가일 업데이트
        const updated = await updateUserVacationDays(
          currentUser.id,
          calculatedDays
        );

        if (updated) {
          // 성공적으로 업데이트된 경우 로컬 상태도 업데이트
          setUserVacationInfo((prev) => ({
            ...prev,
            usedVacationDays: prev.usedVacationDays + calculatedDays,
            remainingVacationDays: Math.max(
              0,
              prev.totalAccumulatedDays -
                (prev.usedVacationDays + calculatedDays)
            ),
          }));
        } else {
          console.warn("휴가 일수 업데이트가 실패했습니다.");
        }
      }

      showToast("휴가 신청이 완료되었습니다.", "success");
      setIsVisible(false);

      // 폼 초기화
      setStartDate(format(today, "yyyy-MM-dd"));
      setEndDate(format(today, "yyyy-MM-dd"));
      setVacationForm({
        startTime: "09:00",
        endTime: "18:00",
        reason: "",
        vacationType: "휴가",
        holidayCount: null,
        halfDayType: "오전반차",
      });
      setDayTypes({});

      // 신청자는 현재 사용자로 유지, 대체자는 초기화
      if (userLevelData && userLevelData.id) {
        setSelectedApplicant([userLevelData.id]);
      } else {
        setSelectedApplicant([]);
      }
      setSelectedReplacement([]);
    } catch (error) {
      console.error("휴가 신청 오류:", error);
      showToast("휴가 신청 중 오류가 발생했습니다.", "error");
    }
  };

  // 렌더링 시점에 계산할 휴가 일수 함수
  const renderCalculatedDays = () => {
    // 경조사인 경우 무조건 0일 반환
    if (vacationForm.vacationType === "경조사") {
      return 0;
    }

    let totalDays = 0;

    // 반차 모드일 때
    if (vacationForm.vacationType === "반차") {
      // 반차는 무조건 0.5일
      totalDays = 0.5;
    } else {
      // 일반 휴가 계산
      Object.keys(dayTypes).forEach((date) => {
        const dayInfo = dayTypes[date];
        totalDays += dayInfo.workRatio;
      });
    }

    // 공휴일 수 차감
    const holidayCount =
      vacationForm.holidayCount === null || vacationForm.holidayCount === ""
        ? 0
        : Number(vacationForm.holidayCount);
    totalDays = Math.max(0, totalDays - holidayCount);

    return Number(totalDays.toFixed(1));
  };

  return (
    <>
      <ModalTemplate
        isVisible={isVisible}
        setIsVisible={setIsVisible}
        showCancel={false}
        modalClassName="rounded-xl"
      >
        {!isLoggedIn ? (
          <div className="flex flex-col items-center w-onceBigModal h-[400px] bg-white px-[40px] py-[30px] justify-center">
            <ModalHeaderZone className="flex flex-row w-full justify-between h-[50px] items-center mb-[20px]">
              <span className="text-[34px] font-bold">휴가신청</span>
              <div className="flex flex-row items-center">
                <img
                  onClick={() => setIsVisible(false)}
                  className="w-[30px]"
                  src={cancel}
                  alt="닫기"
                  style={{ cursor: "pointer" }}
                />
              </div>
            </ModalHeaderZone>

            <h3 className="text-xl font-semibold mb-4">로그인이 필요합니다</h3>
            <p className="text-gray-600 mb-6 text-center">
              휴가 신청을 위해서는 로그인이 필요합니다.
            </p>

            <button
              onClick={openLoginModal}
              className="mt-4 px-6 py-3 bg-onceBlue text-white rounded-md font-medium hover:bg-onceBlue transition-colors"
            >
              로그인하기
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center w-onceBigModal h-onceBigModalH bg-white px-[40px] py-[30px]">
            <ModalHeaderZone className="flex flex-row w-full justify-between h-[50px] items-center mb-[20px]">
              <span className="text-[34px] font-bold">휴가신청</span>
              <div className="flex flex-row items-center">
                <img
                  onClick={() => setIsVisible(false)}
                  className="w-[30px]"
                  src={cancel}
                  alt="닫기"
                  style={{ cursor: "pointer" }}
                />
              </div>
            </ModalHeaderZone>

            {/* 상단 섹션 - 좌우 분할 */}
            <TopSection>
              {/* 좌상단 - 달력 */}
              <LeftTopSection>
                <JcyCalendar
                  key={calendarKey}
                  preStartDay={startDate}
                  preEndDay={endDate}
                  setTargetStartDay={handleStartDateChange}
                  setTargetEndDay={handleEndDateChange}
                  standardWidth="95%"
                  isEdit={true}
                  lockToday={false}
                  singleDateMode={vacationForm.vacationType === "반차"}
                  startDayOnlyMode={false}
                />
              </LeftTopSection>

              {/* 우상단 - 신청 정보 */}
              <RightTopSection>
                <FormSection>
                  {/* 신청자 및 대체자 정보 - 한 행에 배치 */}
                  <FormRow>
                    <FormLabel required>신청자</FormLabel>
                    <FormValue className="flex-1">
                      <InfoBox highlight>
                        {currentUser?.name || "사용자 정보 없음"}
                      </InfoBox>
                    </FormValue>
                    <FormLabel>대체자</FormLabel>
                    <FormValue className="flex-1">
                      <WhoSelector
                        who="대체자"
                        selectedPeople={selectedReplacement}
                        onPeopleChange={handleReplacementChange}
                        singleSelectMode={true}
                      />
                    </FormValue>
                  </FormRow>

                  {/* 잔여휴일과 사용휴일 - 모든 유형에서 표시 (계산된 실제 값 사용) */}
                  <FormRow>
                    <FormLabel>잔여휴일</FormLabel>
                    <FormValue className="flex-1">
                      <InfoBox highlight className="w-full">
                        {getRemainingVacationDays()}일
                      </InfoBox>
                    </FormValue>
                    <FormLabel>사용휴일</FormLabel>
                    <FormValue className="flex-1">
                      <InfoBox highlight className="w-full">
                        {renderCalculatedDays()}일
                      </InfoBox>
                    </FormValue>
                  </FormRow>

                  {/* 공휴일 입력 필드 - 모든 유형에서 표시 */}
                  <FormRow>
                    <FormLabel>제외일수</FormLabel>
                    <FormValue className="flex-1">
                      <NumberInput
                        type="number"
                        name="holidayCount"
                        placeholder="공휴일 수"
                        min="0"
                        step="1"
                        value={vacationForm.holidayCount}
                        onChange={handleHolidayCountChange}
                      />
                    </FormValue>
                  </FormRow>

                  {/* 입사일 정보 표시 */}
                  <FormRow>
                    <FormLabel>입사일</FormLabel>
                    <FormValue className="flex-1">
                      <InfoBox className="w-full">
                        {userVacationInfo.hireDate || "정보 없음"}
                      </InfoBox>
                    </FormValue>
                  </FormRow>

                  <div className="px-4 w-full">
                    <InfoText>
                      * 공휴일 및 회사 지정 휴무일 등 자동으로 제외되지 않는
                      날짜를 수동으로 입력할 수 있습니다. 일요일은 자동으로
                      제외됩니다.
                    </InfoText>
                  </div>

                  {/* 휴가 타입 */}
                  <FormRow>
                    <FormLabel>휴가종류</FormLabel>
                    <FormValue className="flex-1">
                      <div className="flex space-x-2">
                        <TypeButton
                          active={vacationForm.vacationType === "휴가"}
                          onClick={() => handleVacationTypeChange("휴가")}
                        >
                          휴가
                        </TypeButton>
                        <TypeButton
                          active={vacationForm.vacationType === "반차"}
                          onClick={() => handleVacationTypeChange("반차")}
                        >
                          반차
                        </TypeButton>
                        <TypeButton
                          active={vacationForm.vacationType === "경조사"}
                          onClick={() => handleVacationTypeChange("경조사")}
                        >
                          경조사
                        </TypeButton>
                      </div>
                    </FormValue>
                  </FormRow>

                  {/* 날짜 선택과 시간 선택을 합친 row로 수정 */}
                  <FormRow>
                    <FormLabel>시작일시</FormLabel>
                    <FormValue className="flex-1">
                      <DateTimeSelector
                        dateValue={startDate}
                        timeValue={vacationForm.startTime}
                        onDateChange={handleStartDateChange}
                        onTimeChange={handleTimeChange}
                        timeName="startTime"
                      />
                    </FormValue>
                  </FormRow>

                  <FormRow>
                    <FormLabel>
                      {vacationForm.vacationType === "반차"
                        ? "종료시간"
                        : "종료일시"}
                    </FormLabel>
                    <FormValue className="flex-1">
                      <DateTimeSelector
                        dateValue={endDate}
                        timeValue={vacationForm.endTime}
                        onDateChange={handleEndDateChange}
                        onTimeChange={handleTimeChange}
                        timeName="endTime"
                        disableDate={vacationForm.vacationType === "반차"}
                      />
                    </FormValue>
                  </FormRow>

                  {/* 사유 입력 - 단순화된 버전 */}
                  <FormRow>
                    <FormLabel required>사유</FormLabel>
                    <FormValue>
                      <StyledTextarea
                        name="reason"
                        value={vacationForm.reason}
                        onChange={handleInputChange}
                        placeholder="휴가 사유를 입력해주세요."
                      />
                    </FormValue>
                  </FormRow>
                </FormSection>
              </RightTopSection>
            </TopSection>

            {/* 하단 섹션 - RequestModal 스타일로 변경 */}
            <BottomSection>
              <div className="flex flex-row w-full justify-center px-[20px] mt-[50px]">
                <div className="flex flex-row gap-x-[20px] w-full">
                  <OnceOnOffButton
                    text={"휴가신청"}
                    onClick={handleSubmit}
                    on={validateRequiredFields()}
                    alertMessage="필수 항목을 모두 입력해주세요"
                  />
                </div>
              </div>
            </BottomSection>
          </div>
        )}
      </ModalTemplate>

      {/* 로그인/PC할당 통합 모달 - 별도의 모달로 렌더링 */}
      <LoginPCModal
        isOpen={loginModalOpen}
        onClose={closeLoginModal}
        onLoginSuccess={handleLoginSuccess}
        onPCAllocationSubmit={handlePCAllocationSubmit}
        defaultDepartment={userLevelData?.department || "간호팀"}
      />
    </>
  );
}
