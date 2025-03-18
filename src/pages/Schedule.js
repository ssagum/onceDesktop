import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import SideBar from "../components/SideBar";
import ScheduleGrid from "../components/Schedule/ScheduleGrid";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useToast } from "../contexts/ToastContext";
import {
  format,
  addDays,
  startOfWeek,
  nextMonday,
  previousMonday,
} from "date-fns";
import { ko } from "date-fns/locale";
import {
  IoChevronBack,
  IoChevronForward,
  IoCalendarOutline,
} from "react-icons/io5";

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

const DateControlContainer = styled.div`
  margin-bottom: 16px;
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: white;
  padding-bottom: 8px;
`;

// 의료진/직원 데이터 - 나중에 파이어베이스에서 가져오도록 변경 가능
const staffData = [
  { id: "member1", name: "이기현", color: "#F59E0B" },
  { id: "member2", name: "이진용", color: "#4F46E5" },
  { id: "member3", name: "정현", color: "#10B981" },
  { id: "member10", name: "박상현", color: "#D946EF" },
];

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [displayDates, setDisplayDates] = useState([]);
  const { showToast } = useToast();

  const timeSlots = generateTimeSlots();

  // 표시할 월~토 날짜 계산
  useEffect(() => {
    const dates = [];
    // 현재 날짜가 일요일이면 다음주 월요일부터, 아니면 이번주 월요일부터 시작
    const dayOfWeek = currentDate.getDay();
    let weekStart;

    if (dayOfWeek === 0) {
      // 일요일이면 다음 월요일(내일)부터 시작
      weekStart = addDays(currentDate, 1);
    } else {
      // 월~토요일이면 이번주 월요일부터 시작
      weekStart =
        dayOfWeek === 1
          ? currentDate // 월요일이면 현재 날짜가 시작일
          : addDays(currentDate, -(dayOfWeek - 1)); // 그 외에는 이번주 월요일로 조정
    }

    // 월요일부터 토요일까지 6일 추가
    for (let i = 0; i < 6; i++) {
      dates.push(addDays(weekStart, i));
    }
    setDisplayDates(dates);
  }, [currentDate]);

  // 일정 데이터 가져오기 (더미 데이터)
  useEffect(() => {
    const fetchAppointments = async () => {
      setIsLoading(true);

      try {
        // 실제 구현에서는 Firebase에서 데이터 가져오기
        // 여기서는 더미 데이터 사용
        const dummyData = [
          {
            id: 1,
            dateIndex: 0,
            date: displayDates[0],
            staffId: "member1",
            staffName: "이기현",
            startTime: "09:30",
            endTime: "10:30",
            title: "회의",
            type: "일반",
            notes: "주간 회의",
          },
          {
            id: 2,
            dateIndex: 0,
            date: displayDates[0],
            staffId: "member2",
            staffName: "이진용",
            startTime: "10:00",
            endTime: "11:00",
            title: "환자 상담",
            patientName: "홍길동",
            patientNumber: "2014",
            type: "예약",
          },
          {
            id: 3,
            dateIndex: 1,
            date: displayDates[1],
            staffId: "member1",
            staffName: "이기현",
            startTime: "14:00",
            endTime: "15:30",
            title: "교육",
            type: "일반",
            notes: "신규 직원 교육",
          },
          {
            id: 4,
            dateIndex: 2,
            date: displayDates[2],
            staffId: "member3",
            staffName: "정현",
            startTime: "11:00",
            endTime: "12:00",
            title: "휴가",
            type: "휴가",
          },
        ];

        setAppointments(dummyData);
      } catch (error) {
        console.error("일정을 가져오는 중 오류 발생:", error);
        showToast("일정을 가져오는 데 실패했습니다.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    if (displayDates.length > 0) {
      fetchAppointments();
    }
  }, [displayDates]);

  // 이전 주로 이동
  const handlePrevDays = () => {
    setCurrentDate((prevDate) => addDays(prevDate, -7));
  };

  // 다음 주로 이동
  const handleNextDays = () => {
    setCurrentDate((prevDate) => addDays(prevDate, 7));
  };

  // 오늘로 이동
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // 일정 생성 핸들러
  const handleAppointmentCreate = (newAppointment) => {
    // 실제 구현에서는 Firebase에 저장
    setAppointments([...appointments, newAppointment]);
    showToast("일정이 추가되었습니다.", "success");
  };

  // 일정 수정 핸들러
  const handleAppointmentUpdate = (updatedAppointment) => {
    // 실제 구현에서는 Firebase에서 업데이트
    const updatedAppointments = appointments.map((app) =>
      app.id === updatedAppointment.id ? updatedAppointment : app
    );
    setAppointments(updatedAppointments);
    showToast("일정이 수정되었습니다.", "success");
  };

  // 일정 삭제 핸들러
  const handleAppointmentDelete = (appointmentId) => {
    // 실제 구현에서는 Firebase에서 삭제
    const filteredAppointments = appointments.filter(
      (app) => app.id !== appointmentId
    );
    setAppointments(filteredAppointments);
    showToast("일정이 삭제되었습니다.", "success");
  };

  return (
    <div className="flex flex-row w-full h-screen bg-onceBackground items-center">
      <div className="w-[250px] h-full flex flex-col">
        <SideBar />
      </div>
      <MainZone className="w-full flex flex-col justify-evenly items-center bg-onceBackground p-[20px] h-screen">
        <section className="flex flex-col items-center w-full justify-between h-full bg-white rounded-2xl px-[40px] py-[30px]">
          <GridContainer>
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-gray-500 flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3"></div>
                  <p>일정을 불러오는 중...</p>
                </div>
              </div>
            ) : (
              <>
                <DateControlContainer>
                  <DateNavigation>
                    <NavButton onClick={handlePrevDays}>
                      <IoChevronBack />
                    </NavButton>
                    <TodayButton onClick={handleToday}>오늘</TodayButton>
                    <NavButton onClick={handleNextDays}>
                      <IoChevronForward />
                    </NavButton>
                    {displayDates.length > 0 && (
                      <DateRange>
                        {format(displayDates[0], "yyyy.MM.dd (EEE)", {
                          locale: ko,
                        })}{" "}
                        -{" "}
                        {format(displayDates[5], "yyyy.MM.dd (EEE)", {
                          locale: ko,
                        })}
                      </DateRange>
                    )}
                  </DateNavigation>
                </DateControlContainer>
                <div style={{ overflow: "auto", width: "100%" }}>
                  <ScheduleGrid
                    dates={displayDates}
                    timeSlots={timeSlots}
                    staff={staffData}
                    appointments={appointments}
                    onAppointmentCreate={handleAppointmentCreate}
                    onAppointmentUpdate={handleAppointmentUpdate}
                    onAppointmentDelete={handleAppointmentDelete}
                  />
                </div>
              </>
            )}
          </GridContainer>
        </section>
      </MainZone>
    </div>
  );
};

export default Schedule;
