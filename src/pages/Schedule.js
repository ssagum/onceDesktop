import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import SideBar from "../components/SideBar";
import ScheduleGrid from "../components/Schedule/ScheduleGrid";
import { useUserLevel } from "../utils/UserLevelContext";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useToast } from "../contexts/ToastContext";
import {
  format,
  addDays,
  startOfWeek,
  nextMonday,
  previousMonday,
  getMonth,
  getYear,
  setMonth,
  setYear,
  getWeeksInMonth,
  getDaysInMonth,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { ko } from "date-fns/locale";
import {
  IoChevronBack,
  IoChevronForward,
  IoCalendarOutline,
  IoChevronDown,
} from "react-icons/io5";
import NaverReservationViewer from "../components/Reservation/NaverReservationViewer";

const MainZone = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  overflow: hidden;
`;

const HeaderContainer = styled.div`
  padding: 20px 24px;
  background-color: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #2d3748;
  display: flex;
  align-items: center;

  svg {
    margin-right: 8px;
    color: #4299e1;
  }
`;

const DateNavigation = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background-color: #edf2f7;
  color: #4a5568;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #e2e8f0;
    color: #2d3748;
  }

  &:active {
    transform: translateY(1px);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const TodayButton = styled.button`
  padding: 0 16px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background-color: #4299e1;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin: 0 10px;
  transition: all 0.2s ease;

  &:hover {
    background-color: #3182ce;
  }

  &:active {
    transform: translateY(1px);
  }
`;

const DateRange = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin-left: 12px;
`;

const GridContainer = styled.div`
  flex: 1;
  overflow: auto;
  padding: 16px 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

// 모드 토글 스위치 컴포넌트 - 스타일드 컴포넌트로 정의
const ToggleContainer = styled.div`
  display: flex;
  position: relative;
  width: 260px;
  height: 50px;
  margin-bottom: 20px;
  border-radius: 25px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  background-color: #f5f5f5;
`;

const ToggleOption = styled.div.attrs((props) => ({
  // active 속성은 styled-components 내부에서만 사용하고 HTML로 전달하지 않도록 함
  "data-active": props.active ? "true" : "false",
}))`
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50%;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.3s ease;
  color: ${(props) => (props.active ? "#fff" : "#555")};
  font-size: 14px;
`;

const ToggleSlider = styled.div.attrs((props) => ({
  // position 속성을 HTML로 전달하지 않도록 함
  "data-position": props.position || "left",
}))`
  position: absolute;
  top: 3px;
  left: ${(props) => (props.position === "left" ? "3px" : "50%")};
  width: calc(50% - 6px);
  height: calc(100% - 6px);
  background-color: #007bff;
  border-radius: 16px;
  transition: left 0.3s ease;
`;

const ToggleIcon = styled.span`
  margin-right: 6px;
  font-size: 18px;
`;

const DateControlContainer = styled.div`
  margin-bottom: 16px;
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: white;
  padding-bottom: 8px;
`;

// 새로 추가된 스타일 컴포넌트
const SheetSelectorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: 24px;
  white-space: nowrap;
  flex-wrap: nowrap;
`;

const MonthSelector = styled.button`
  min-width: 70px;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #e0f2fe;
  border: 2px solid ${(props) => (props.isOpen ? "#0369a1" : "#0ea5e9")};
  border-radius: 8px;
  color: #0c4a6e;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  position: relative;
  margin-right: 10px;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background-color: #bae6fd;
  }

  &:focus-visible {
    outline: 3px solid #38bdf8;
    outline-offset: 2px;
  }

  svg {
    margin-left: 4px;
    transition: transform 0.2s ease;
    transform: ${(props) => (props.isOpen ? "rotate(180deg)" : "rotate(0)")};
    color: #0284c7;
  }
`;

const MonthDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background-color: white;
  border-radius: 8px;
  width: 120px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 100;
  max-height: 320px;
  overflow-y: auto;
  padding: 8px 0;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
`;

/* 키프레임 애니메이션도 제거
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
*/

const MonthOption = styled.button`
  width: 100%;
  text-align: left;
  padding: 10px 16px;
  cursor: pointer;
  border: none;
  background-color: transparent;
  transition: all 0.15s;
  font-size: 15px;

  &:hover {
    background-color: #f0f9ff;
  }

  &.selected {
    background-color: #e0f2fe;
    font-weight: 600;
    color: #0c4a6e;
    border-left: 3px solid #0ea5e9;
  }
`;

const WeekTabsContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  justify-content: space-between;
`;

const WeekTab = styled.button`
  padding: 8px;
  background-color: ${(props) => (props.isActive ? "#e0f2fe" : "transparent")};
  border-radius: 8px;
  color: ${(props) => (props.isActive ? "#0c4a6e" : "#475569")};
  font-weight: ${(props) => (props.isActive ? "600" : "500")};
  font-size: 13px;
  cursor: pointer;
  text-align: center;
  box-shadow: ${(props) =>
    props.isActive ? "0 1px 2px rgba(0, 0, 0, 0.05)" : "none"};
  transition: all 0.2s ease;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border: 2px solid ${(props) => (props.isActive ? "#0ea5e9" : "#e2e8f0")};
  flex: 1;
  margin: 0 3px;
  min-width: 0;
  position: relative;
  z-index: 1;

  &:hover {
    background-color: ${(props) => (props.isActive ? "#bae6fd" : "#f1f5f9")};
    border-color: ${(props) => (props.isActive ? "#0ea5e9" : "#cbd5e1")};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 3px solid #38bdf8;
    outline-offset: 2px;
  }

  &:first-child {
    margin-left: 0;
  }

  &:last-child {
    margin-right: 0;
  }

  .week-number {
    margin-right: 4px;
    font-weight: ${(props) => (props.isActive ? "700" : "600")};
  }

  .date-range {
    font-size: 12px;
    opacity: 0.9;
  }
`;

// 30분 간격의 시간대 생성 (9:00 ~ 19:00)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour < 19; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    slots.push(`${hour.toString().padStart(2, "0")}:30`);
  }
  slots.push("19:00");
  return slots;
};

const Schedule = () => {
  const { pathname } = useLocation();
  const { department } = useUserLevel();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // 초기값을 true로 설정
  const [displayDates, setDisplayDates] = useState([]);
  const { showToast } = useToast();

  // 새로 추가된 상태 변수들
  const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()));
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()));
  const [activeWeek, setActiveWeek] = useState(0);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [viewMode, setViewMode] = useState(
    department === "물리치료팀" ? "물리치료" : "진료"
  ); // 부서가 물리치료팀이면 물리치료 모드로 시작
  const [staffData, setStaffData] = useState({ 진료: [], 물리치료: [] }); // 의료진 데이터 상태 추가
  // 네이버 예약 모달 상태 추가
  const [naverReservationVisible, setNaverReservationVisible] = useState(false);

  const timeSlots = generateTimeSlots();

  // Firebase에서 의료진 데이터 가져오기
  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        const settingDocRef = doc(db, "setting", "providers");
        const settingDoc = await getDoc(settingDocRef);

        if (settingDoc.exists()) {
          const data = settingDoc.data();
          console.log("의료진 데이터:", data);

          // 색상 배열 (의료진 수에 맞게 순환해서 사용)
          const doctorColors = [
            "#4F46E5",
            "#10B981",
            "#D946EF",
            "#EC4899",
            "#3B82F6",
            "#14B8A6",
            "#8B5CF6",
            // "#4F46E5", // 인디고/파란색 계열
            // "#3B82F6",
            // "#0EA5E9",
            // "#06B6D4",
            // "#0891B2",
            // "#0284C7",
            // "#1E40AF",
          ];
          const therapistColors = [
            "#4F46E5",
            "#10B981",
            "#D946EF",
            "#EC4899",
            "#3B82F6",
            "#14B8A6",
            "#8B5CF6",
            // "#10B981", // 초록/보라 계열
            // "#059669",
            // "#047857",
            // "#D946EF",
            // "#8B5CF6",
            // "#A855F7",
            // "#6366F1",
          ];

          // 진료 담당자와 물리치료 담당자 목록 가져오기
          const 진료목록 = data.진료 || [];
          const 물리치료목록 = data.물리치료 || [];

          console.log("진료목록:", 진료목록);

          // 각 담당자 이름을 객체 형식으로 변환 (id, name, color 속성 포함)
          const 진료담당자 = 진료목록.map((name, index) => ({
            id: `doctor_${index}`,
            name: name,
            color: doctorColors[index % doctorColors.length],
          }));

          const 물리치료담당자 = 물리치료목록.map((name, index) => ({
            id: `therapist_${index}`,
            name: name,
            color: therapistColors[index % therapistColors.length],
          }));

          // 빈 배열 확인 및 기본값 설정
          if (진료담당자.length === 0) {
            console.warn("진료 담당자 목록이 비어있습니다. 기본값 설정");
            진료담당자.push({
              id: "doctor_default",
              name: "기본 의사",
              color: doctorColors[0],
            });
          }

          if (물리치료담당자.length === 0) {
            console.warn("물리치료 담당자 목록이 비어있습니다. 기본값 설정");
            물리치료담당자.push({
              id: "therapist_default",
              name: "기본 치료사",
              color: therapistColors[0],
            });
          }

          // 진료 및 물리치료 담당자 데이터 설정
          setStaffData({
            진료: 진료담당자,
            물리치료: 물리치료담당자,
          });
        } else {
          console.error("Providers 문서가 존재하지 않습니다. 기본값 설정");

          // 문서가 없는 경우 기본값 설정
          const defaultStaffData = {
            진료: [
              { id: "doctor_0", name: "네트워크 에러", color: doctorColors[0] },
              { id: "doctor_1", name: "네트워크 에러", color: doctorColors[1] },
            ],
            물리치료: [
              {
                id: "therapist_0",
                name: "네트워크 에러",
                color: therapistColors[0],
              },
              {
                id: "therapist_1",
                name: "네트워크 에러",
                color: therapistColors[1],
              },
            ],
          };

          setStaffData(defaultStaffData);
        }
      } catch (error) {
        console.error("담당자 정보를 가져오는 중 오류 발생:", error);

        // 오류 발생 시 기본값 설정
        const defaultStaffData = {
          진료: [
            { id: "doctor_0", name: "네트워크 에러", color: doctorColors[0] },
            { id: "doctor_1", name: "네트워크 에러", color: doctorColors[1] },
          ],
          물리치료: [
            {
              id: "therapist_0",
              name: "네트워크 에러",
              color: therapistColors[0],
            },
            {
              id: "therapist_1",
              name: "네트워크 에러",
              color: therapistColors[1],
            },
          ],
        };

        setStaffData(defaultStaffData);
      }
    };

    fetchStaffData();
  }, [showToast]);

  // 부서 정보가 변경될 때 viewMode 업데이트
  useEffect(() => {
    if (department === "물리치료팀") {
      setViewMode("물리치료");
    } else if (department && department !== "물리치료팀") {
      setViewMode("진료");
    }
  }, [department]);

  // 선택된 월의 주 수 계산
  const getWeeksForMonth = () => {
    const weeks = [];
    const firstDay = startOfMonth(new Date(selectedYear, selectedMonth, 1));
    const lastDay = endOfMonth(new Date(selectedYear, selectedMonth, 1));

    // 첫째 주 시작일이 월요일이 아니면 이전 월의 날짜 포함
    let startOfFirstWeek = startOfWeek(firstDay, { weekStartsOn: 1 }); // 월요일부터 시작

    let currentDate = startOfFirstWeek;
    let weekNumber = 0;

    while (currentDate <= lastDay) {
      const weekEnd = addDays(currentDate, 6);

      weeks.push({
        weekNumber: weekNumber,
        start: new Date(currentDate),
        end: new Date(weekEnd),
        label: `${weekNumber + 1}주`,
        dateRange: `${format(currentDate, "M/d")}-${format(weekEnd, "M/d")}`,
      });

      currentDate = addDays(currentDate, 7);
      weekNumber++;
    }

    return weeks;
  };

  const weeks = getWeeksForMonth();

  // 표시할 월~토 날짜 계산 (초기 렌더링용)
  useEffect(() => {
    // 컴포넌트 마운트 시 오늘 날짜 기준으로 주차를 선택하고 날짜 계산
    const today = new Date();

    // 오늘 날짜가 속한 주차 찾기
    const foundWeekIndex = weeks.findIndex(
      (week) => today >= week.start && today <= week.end
    );

    const weekIndex = foundWeekIndex !== -1 ? foundWeekIndex : 0;
    const weekStartDate = weeks[weekIndex].start;

    // 해당 주차의 날짜 계산 (월~토)
    const initialDates = [];
    for (let i = 0; i < 6; i++) {
      initialDates.push(addDays(weekStartDate, i));
    }

    // 상태 업데이트
    setActiveWeek(weekIndex);
    setCurrentDate(weekStartDate);
    setDisplayDates(initialDates);

    console.log("컴포넌트 초기화: 오늘 날짜 기준 주차 설정 완료");

    // 이제 초기 주차 설정이 완료되었으므로 fetchAppointments가 처리됨
  }, []); // 마운트 시 한 번만 실행

  // displayDates가 변경될 때 일정 데이터 가져오기
  useEffect(() => {
    if (displayDates.length > 0) {
      console.log("displayDates 변경으로 fetchAppointments 호출됨");
      fetchAppointments();
    }
  }, [displayDates, staffData, viewMode]); // 필요한 의존성만 포함

  // 일정 데이터 가져오기 (Firebase에서 가져오기) - 컴포넌트 레벨에서 선언
  const fetchAppointments = async () => {
    setIsLoading(true);
    console.log("fetchAppointments 함수 호출됨");

    try {
      // 표시할 날짜 범위의 시작과 끝 계산
      const startDateStr = format(displayDates[0] || new Date(), "yyyy-MM-dd");
      const endDateStr = format(
        displayDates[displayDates.length - 1] || new Date(),
        "yyyy-MM-dd"
      );

      console.log(
        `예약 조회 기간: ${startDateStr} ~ ${endDateStr}, 현재 모드: ${viewMode}`
      );
      console.log(
        "displayDates:",
        displayDates.map((d) => format(d, "yyyy-MM-dd"))
      );

      // Firestore에서 데이터 가져오기 - 날짜 범위만 필터링
      const appointmentsRef = collection(db, "reservations");
      const q = query(
        appointmentsRef,
        where("date", ">=", startDateStr),
        where("date", "<=", endDateStr)
      );

      const querySnapshot = await getDocs(q);

      // 중복 방지를 위한 Map 사용
      const appointmentsMap = new Map();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // id 필드와 함께 데이터 저장, isHidden이 true가 아닌 것만 저장
        if (data.isHidden !== true) {
          // date가 문자열인지 확인하고 필요시 변환
          const dateStr =
            typeof data.date === "string"
              ? data.date
              : format(data.date.toDate(), "yyyy-MM-dd");

          // dateIndex 계산 - 현재 표시 중인 날짜 중 어디에 위치하는지
          const dateIndex = displayDates.findIndex(
            (d) => format(d, "yyyy-MM-dd") === dateStr
          );

          // 담당자 정보 처리 - 색상 일관성 유지
          let staffColor = data.staffColor || "#999";

          // 기존 색상이 없거나 담당자가 변경된 경우에만 새 색상 할당
          if (!staffColor || staffColor === "#999") {
            const currentStaff =
              data.type === "물리치료" ? staffData.물리치료 : staffData.진료;

            const staffMember = currentStaff.find((s) => s.id === data.staffId);
            if (staffMember) {
              staffColor = staffMember.color;
            }
          }

          // 일정 생성 및 로드 시 데이터 포맷 일관성 유지
          const appointmentWithDateIndex = {
            ...data,
            id: doc.id,
            dateIndex: dateIndex >= 0 ? dateIndex : 0,
            date: dateStr,
            staffColor: staffColor,
            // type 필드가 없으면 기본값으로 설정
            type: data.type || "예약",
          };

          // Map에 저장 (ID를 키로 사용해 중복 방지)
          appointmentsMap.set(doc.id, appointmentWithDateIndex);
        }
      });

      // Map에서 배열로 변환하여 상태 업데이트
      const appointmentsArray = Array.from(appointmentsMap.values());
      console.log(`조회된 일정 수: ${appointmentsArray.length}`);
      setAppointments(appointmentsArray);
    } catch (error) {
      console.error("일정 데이터 가져오기 오류:", error);
      showToast("일정 데이터를 불러오는 중 오류가 발생했습니다.", "error");
    } finally {
      // 항상 로딩 완료 처리
      setIsLoading(false);
    }
  };

  // 이전 주로 이동
  const handlePrevDays = () => {
    setCurrentDate((prevDate) => addDays(prevDate, -7));
    // 이전 주차로 변경
    if (activeWeek > 0) {
      setActiveWeek(activeWeek - 1);
    } else {
      // 이전 달의 마지막 주차로 변경
      const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
      const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
      setSelectedMonth(prevMonth);
      setSelectedYear(prevYear);

      // 임시로 이전 달의 주차 계산
      const tempDate = new Date(prevYear, prevMonth, 1);
      const weeksInPrevMonth = getWeeksForMonth(tempDate);
      setActiveWeek(weeksInPrevMonth.length - 1);
    }
  };

  // 다음 주로 이동
  const handleNextDays = () => {
    setCurrentDate((prevDate) => addDays(prevDate, 7));
    // 다음 주차로 변경
    if (activeWeek < weeks.length - 1) {
      setActiveWeek(activeWeek + 1);
    } else {
      // 다음 달의 첫 주차로 변경
      const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
      const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
      setSelectedMonth(nextMonth);
      setSelectedYear(nextYear);
      setActiveWeek(0);
    }
  };

  // 오늘로 이동
  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedMonth(getMonth(today));
    setSelectedYear(getYear(today));

    // 오늘이 속한 주차 찾기
    const todayWeeks = getWeeksForMonth();
    const foundWeek = todayWeeks.findIndex(
      (week) => today >= week.start && today <= week.end
    );

    setActiveWeek(foundWeek !== -1 ? foundWeek : 0);
  };

  // 월 변경 핸들러
  const handleMonthChange = (month, year) => {
    // 로딩 상태 표시 시작
    setIsLoading(true);

    setSelectedMonth(month);
    setSelectedYear(year);

    // 이 월의 주차 계산
    const newWeeks = [];
    const firstDay = startOfMonth(new Date(year, month, 1));
    const lastDay = endOfMonth(new Date(year, month, 1));

    // 첫째 주 시작일이 월요일이 아니면 이전 월의 날짜 포함
    let startOfFirstWeek = startOfWeek(firstDay, { weekStartsOn: 1 }); // 월요일부터 시작

    let currentDate = startOfFirstWeek;
    let weekNumber = 0;

    while (currentDate <= lastDay) {
      const weekEnd = addDays(currentDate, 6);

      newWeeks.push({
        weekNumber: weekNumber,
        start: new Date(currentDate),
        end: new Date(weekEnd),
        label: `${weekNumber + 1}주`,
        dateRange: `${format(currentDate, "M/d")}-${format(weekEnd, "M/d")}`,
      });

      currentDate = addDays(currentDate, 7);
      weekNumber++;
    }

    // 첫 주차 선택 (인덱스 0)
    setActiveWeek(0);

    // 첫 주차의 날짜 계산 (월~토)
    if (newWeeks.length > 0) {
      const firstWeekStart = newWeeks[0].start;
      console.log(
        "첫 주차의 시작 날짜로 변경:",
        format(firstWeekStart, "yyyy-MM-dd")
      );

      // 해당 주차의 날짜 계산 (월~토)
      const newDates = [];
      for (let i = 0; i < 6; i++) {
        newDates.push(addDays(firstWeekStart, i)); // 월요일부터 토요일까지
      }

      // 상태 업데이트
      setCurrentDate(firstWeekStart);
      setDisplayDates(newDates); // 직접 displayDates 설정
    }

    setShowMonthDropdown(false);
  };

  // 주차 변경 핸들러
  const handleWeekChange = (weekIndex) => {
    // 로딩 상태 표시 시작
    setIsLoading(true);

    console.log(`주차 변경 시도: ${activeWeek + 1}주차 → ${weekIndex + 1}주차`);

    // 선택한 주차의 시작 날짜
    if (weeks.length > weekIndex) {
      // 선택한 주차의 시작일
      const weekStartDate = weeks[weekIndex].start;

      console.log(
        `주차 변경: ${weekIndex + 1}주차 선택, 시작일:`,
        format(weekStartDate, "yyyy-MM-dd")
      );

      // 해당 주차의 날짜 계산 (월~토)
      const newDates = [];
      for (let i = 0; i < 6; i++) {
        newDates.push(addDays(weekStartDate, i)); // 월요일부터 토요일까지
      }

      // 상태 업데이트
      setActiveWeek(weekIndex);
      setCurrentDate(weekStartDate); // currentDate 업데이트
      setDisplayDates(newDates); // 직접 displayDates 설정

      console.log(
        `새 날짜 범위: ${format(newDates[0], "yyyy-MM-dd")} ~ ${format(
          newDates[newDates.length - 1],
          "yyyy-MM-dd"
        )}`
      );

      // 예약 데이터는 displayDates 변경 감지 useEffect에서 자동으로 로드됨
    }
  };

  // 월 드롭다운 토글
  const toggleMonthDropdown = () => {
    setShowMonthDropdown(!showMonthDropdown);
  };

  // 일정 생성 핸들러
  const handleAppointmentCreate = async (newAppointment) => {
    try {
      console.log("일정 생성 시작:", newAppointment);

      // staffId와 실제 이름 모두 저장
      const currentStaff =
        viewMode === "진료" ? staffData.진료 : staffData.물리치료;
      const staffMember = currentStaff.find(
        (s) => s.id === newAppointment.staffId
      );

      // 필수 필드 확인
      if (
        !newAppointment.date ||
        !newAppointment.startTime ||
        !newAppointment.endTime
      ) {
        showToast("일정 정보가 부족합니다.", "error");
        return null;
      }

      // 모든 필드를 명시적으로 설정하여 일관된 데이터 구조 유지
      const appointmentData = {
        title: newAppointment.title || "",
        date:
          typeof newAppointment.date === "string"
            ? newAppointment.date
            : format(newAppointment.date, "yyyy-MM-dd"),
        startTime: newAppointment.startTime,
        endTime: newAppointment.endTime,
        staffId: newAppointment.staffId,
        staffName: staffMember ? staffMember.name : "알 수 없음",
        notes: newAppointment.notes || "",
        // 명시적으로 viewMode 값을 설정 - 물리치료 모드이면 "물리치료"로 설정, 아니면 "진료"로 설정
        type: viewMode === "물리치료" ? "물리치료" : "진료",
        isHidden: false,
        createdAt: new Date().toISOString(),
      };

      console.log("새 일정 데이터:", appointmentData);

      // Firestore에 저장
      const docRef = await addDoc(
        collection(db, "reservations"),
        appointmentData
      );
      console.log(`일정 추가됨, ID: ${docRef.id}`);

      // ID를 포함한 최종 객체
      const appointmentWithId = {
        ...appointmentData,
        id: docRef.id,
        dateIndex:
          newAppointment.dateIndex !== undefined ? newAppointment.dateIndex : 0,
        staffColor: staffMember ? staffMember.color : "#999",
      };

      console.log("생성된 일정:", appointmentWithId);

      // 데이터 새로고침
      await fetchAppointments();

      // 성공 메시지
      showToast("일정이 추가되었습니다.", "success");

      // 생성된 객체 반환
      return appointmentWithId;
    } catch (error) {
      console.error("일정 생성 오류:", error);
      showToast("일정 추가 중 오류가 발생했습니다.", "error");
      return null;
    }
  };

  // 일정 수정 핸들러
  const handleAppointmentUpdate = async (updatedAppointment) => {
    try {
      // staffId와 실제 이름 모두 업데이트
      const currentStaff =
        viewMode === "진료" ? staffData.진료 : staffData.물리치료;
      const staffMember = currentStaff.find(
        (s) => s.id === updatedAppointment.staffId
      );

      const appointmentData = {
        ...updatedAppointment,
        staffName: staffMember ? staffMember.name : "알 수 없음",
        // 색상 정보 유지 또는 업데이트
        staffColor:
          updatedAppointment.staffColor ||
          (staffMember ? staffMember.color : "#999"),
        updatedAt: new Date(),
      };

      // Firestore 업데이트
      const appointmentRef = doc(db, "reservations", updatedAppointment.id);
      await updateDoc(appointmentRef, appointmentData);

      // 상태 업데이트
      const updatedAppointments = appointments.map((app) =>
        app.id === updatedAppointment.id ? appointmentData : app
      );

      setAppointments(updatedAppointments);

      // 데이터 새로고침
      await fetchAppointments();

      showToast("일정이 수정되었습니다.", "success");

      return appointmentData;
    } catch (error) {
      console.error("일정 수정 중 오류 발생:", error);
      showToast("일정 수정에 실패했습니다.", "error");
      return null;
    }
  };

  // 일정 삭제 핸들러
  const handleAppointmentDelete = async (appointmentId) => {
    try {
      // Firestore 문서 업데이트 (isHidden 처리)
      const appointmentRef = doc(db, "reservations", appointmentId);
      await updateDoc(appointmentRef, {
        isHidden: true,
        hiddenAt: new Date(),
        updatedAt: new Date(),
      });

      // 로컬 상태 업데이트
      setAppointments((prevAppointments) =>
        prevAppointments.filter((app) => app.id !== appointmentId)
      );

      // 데이터 갱신
      await fetchAppointments();
    } catch (error) {
      console.error("일정 삭제 중 오류 발생:", error);
      showToast("일정 삭제 중 오류가 발생했습니다.", "error");
    }
  };

  // 월 드롭다운 렌더링
  const renderMonthDropdown = () => {
    // 월 이름 배열
    const monthNames = [
      "1월",
      "2월",
      "3월",
      "4월",
      "5월",
      "6월",
      "7월",
      "8월",
      "9월",
      "10월",
      "11월",
      "12월",
    ];

    return (
      <MonthDropdown role="listbox" aria-label="월 선택">
        {monthNames.map((name, index) => (
          <MonthOption
            key={`${selectedYear}-${index}`}
            className={index === selectedMonth ? "selected" : ""}
            onClick={() => handleMonthChange(index, selectedYear)}
            role="option"
            aria-selected={index === selectedMonth}
          >
            {name}
          </MonthOption>
        ))}
      </MonthDropdown>
    );
  };

  // 네이버 예약 데이터 처리 핸들러
  const handleExtractedData = (data) => {
    // 추출된 데이터를 기반으로 새 예약 생성
    if (!data) return;

    try {
      const newAppointment = {
        title: `${data.customerName} - ${data.service}`,
        date: data.appointmentDate,
        startTime: data.appointmentTime,
        // 30분 후 종료 시간 설정
        endTime: data.appointmentTime.replace(/(\d+):(\d+)/, (_, h, m) => {
          const hour = parseInt(h);
          const minute = parseInt(m) + 30;
          if (minute >= 60) {
            return `${(hour + 1).toString().padStart(2, "0")}:${(minute - 60)
              .toString()
              .padStart(2, "0")}`;
          }
          return `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}`;
        }),
        staffId:
          staffData[viewMode].length > 0 ? staffData[viewMode][0].id : "",
        notes: data.notes || "",
        // dateIndex는 선택된 날짜에 맞게 설정
        dateIndex: displayDates.findIndex(
          (date) => format(date, "yyyy-MM-dd") === data.appointmentDate
        ),
      };

      // 날짜가 현재 표시 범위에 없으면 알림
      if (newAppointment.dateIndex === -1) {
        showToast(
          "추출된 예약 날짜가 현재 표시 범위에 없습니다. 날짜를 조정해주세요.",
          "warning"
        );
        return;
      }

      // 예약 생성 처리
      handleAppointmentCreate(newAppointment);

      showToast("네이버 예약이 성공적으로 등록되었습니다.", "success");
    } catch (error) {
      console.error("네이버 예약 데이터 처리 중 오류:", error);
      showToast("예약 데이터 처리 중 오류가 발생했습니다.", "error");
    }
  };

  return (
    <div className="flex flex-row w-full h-screen bg-onceBackground items-center">
      <div className="w-[250px] h-full flex flex-col">
        <SideBar />
      </div>
      <MainZone className="w-full flex flex-col justify-evenly items-center bg-onceBackground p-[20px] h-screen">
        <section className="flex flex-col items-center w-full justify-between h-full bg-white rounded-2xl px-[40px] py-[30px]">
          <GridContainer>
            <ToggleContainer>
              <ToggleSlider position={viewMode === "진료" ? "left" : "right"} />
              <ToggleOption
                active={viewMode === "진료"}
                onClick={() => setViewMode("진료")}
              >
                <ToggleIcon>👨‍⚕️</ToggleIcon>
                진료 예약
              </ToggleOption>
              <ToggleOption
                active={viewMode === "물리치료"}
                onClick={() => setViewMode("물리치료")}
              >
                <ToggleIcon>💪</ToggleIcon>
                물리치료 예약
              </ToggleOption>
            </ToggleContainer>

            {/* 네이버 예약 연동 버튼 추가 
            <div className="w-full flex justify-end mb-4">
              <button
                onClick={() => setNaverReservationVisible(true)}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l3.69 3.69a.75.75 0 11-1.06 1.06l-3.69-3.69A8.25 8.25 0 012.25 10.5z" />
                </svg>
                네이버 예약 확인
              </button>
            </div>
            */}
            <div className="w-full p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-[15px]">
                {viewMode === "진료" ? (
                  <span>
                    각 원장님은 진료실에 개인 PC가 마련되어 있으므로, 예약 관련
                    알림은 원장님의 개별 PC로 발송됩니다.
                  </span>
                ) : (
                  <span>
                    물리치료사 선생님들은 업무상 이동이 잦으시므로, 어디서든
                    예약 변동 사항을 바로 확인하실 수 있게 물리치료팀 모든
                    PC에서 알림이 울립니다.
                  </span>
                )}
              </p>
            </div>
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-gray-500 flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3"></div>
                  <p>일정을 불러오는 중...</p>
                </div>
              </div>
            ) : (
              <>
                <SheetSelectorContainer
                  aria-label="월 및 주차 선택"
                  className="mb-4"
                >
                  <MonthSelector
                    onClick={toggleMonthDropdown}
                    isOpen={showMonthDropdown}
                    aria-haspopup="listbox"
                    aria-expanded={showMonthDropdown}
                    aria-label={`${selectedMonth + 1}월 선택됨`}
                  >
                    <span>{selectedMonth + 1}월</span>
                    <IoChevronDown size={14} aria-hidden="true" />
                    {showMonthDropdown && renderMonthDropdown()}
                  </MonthSelector>

                  <WeekTabsContainer role="tablist" aria-label="주차 선택">
                    {weeks.map((week, index) => (
                      <WeekTab
                        key={`week-${index}`}
                        isActive={index === activeWeek}
                        onClick={(e) => {
                          e.preventDefault(); // 이벤트 기본 동작 방지
                          e.stopPropagation(); // 이벤트 버블링 방지
                          console.log(
                            `주차 탭 클릭: ${index + 1}주차 (${week.dateRange})`
                          );
                          handleWeekChange(index);
                        }}
                        role="tab"
                        aria-selected={index === activeWeek}
                        id={`week-tab-${index}`}
                        aria-controls={`week-panel-${index}`}
                        title={week.dateRange}
                        style={{ pointerEvents: "auto", cursor: "pointer" }}
                      >
                        <span className="week-number">{week.label}</span>
                        <span className="date-range">{week.dateRange}</span>
                      </WeekTab>
                    ))}
                  </WeekTabsContainer>
                </SheetSelectorContainer>

                {viewMode === "진료" ? (
                  // 진료 예약 모드
                  <ScheduleGrid
                    dates={displayDates}
                    timeSlots={timeSlots}
                    staff={staffData.진료 || []}
                    appointments={appointments}
                    onAppointmentCreate={handleAppointmentCreate}
                    onAppointmentUpdate={handleAppointmentUpdate}
                    onAppointmentDelete={handleAppointmentDelete}
                    viewMode={viewMode}
                    showToast={showToast}
                  />
                ) : (
                  // 물리치료 예약 모드
                  <ScheduleGrid
                    dates={displayDates}
                    timeSlots={timeSlots}
                    staff={staffData.물리치료 || []}
                    appointments={appointments}
                    onAppointmentCreate={handleAppointmentCreate}
                    onAppointmentUpdate={handleAppointmentUpdate}
                    onAppointmentDelete={handleAppointmentDelete}
                    viewMode={viewMode}
                    showToast={showToast}
                  />
                )}
              </>
            )}
          </GridContainer>
        </section>
      </MainZone>

      {/* 네이버 예약 모달 */}
      <NaverReservationViewer
        isVisible={naverReservationVisible}
        setIsVisible={setNaverReservationVisible}
        onDataExtract={handleExtractedData}
      />
    </div>
  );
};

export default Schedule;
