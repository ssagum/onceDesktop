import React from "react";

const ScheduleCalendar = ({
  currentDate,
  setCurrentDate,
  appointments = [],
}) => {
  // 월 변경 함수
  const handlePrevMonth = () => {
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentDate(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentDate(nextMonth);
  };

  // 달력 데이터 생성
  const generateCalendarData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 해당 월의 첫날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 첫날의 요일 (0: 일요일, 1: 월요일, ...)
    const firstDayOfWeek = firstDay.getDay();

    // 달력에 표시할 날짜 배열
    const days = [];

    // 이전 달의 날짜 채우기
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevMonthDate = new Date(year, month, -i);
      days.unshift({
        date: prevMonthDate.getDate(),
        month: "prev",
        fullDate: new Date(year, month - 1, prevMonthDate.getDate()),
      });
    }

    // 현재 달의 날짜 채우기
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: i,
        month: "current",
        fullDate: new Date(year, month, i),
      });
    }

    // 다음 달의 날짜 채우기 (42개 칸 채우기)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        month: "next",
        fullDate: new Date(year, month + 1, i),
      });
    }

    return days;
  };

  const calendarDays = generateCalendarData();
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // 날짜 선택 함수
  const handleDateClick = (day) => {
    setCurrentDate(day.fullDate);
  };

  // 현재 선택된 날짜와 같은지 확인
  const isSameDate = (date1, date2) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  // 특정 날짜에 일정이 있는지 확인
  const getAppointmentCount = (date) => {
    if (!appointments || appointments.length === 0) return 0;

    return appointments.filter(
      (app) =>
        app.date &&
        date.getDate() === app.date.getDate() &&
        date.getMonth() === app.date.getMonth() &&
        date.getFullYear() === app.date.getFullYear()
    ).length;
  };

  // 오늘 날짜 확인
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="calendar w-full">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1 h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-200"
        >
          &lt;
        </button>
        <h3 className="text-xl font-bold">
          {year}. {month < 10 ? `0${month}` : month}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-1 h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-200"
        >
          &gt;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekdays.map((day, index) => (
          <div
            key={index}
            className={`text-center py-2 font-medium ${
              index === 0 ? "text-red-500" : ""
            }`}
          >
            {day}
          </div>
        ))}

        {calendarDays.map((day, index) => {
          const isCurrentMonth = day.month === "current";
          const isSunday = day.fullDate.getDay() === 0;
          const isSaturday = day.fullDate.getDay() === 6;
          const isDayToday = isToday(day.fullDate);
          const isSelected =
            isCurrentMonth && isSameDate(day.fullDate, currentDate);
          const appointmentCount = getAppointmentCount(day.fullDate);

          return (
            <div
              key={index}
              onClick={() => isCurrentMonth && handleDateClick(day)}
              className={`
                relative h-12 py-1 px-1 flex flex-col items-center cursor-pointer border-t
                ${isCurrentMonth ? "" : "opacity-40"}
                ${isSelected ? "bg-blue-50 font-bold" : ""}
                ${isDayToday ? "border border-blue-400" : ""}
              `}
            >
              <span
                className={`
                  inline-flex items-center justify-center w-7 h-7 rounded-full
                  ${isSelected ? "bg-blue-500 text-white" : ""}
                  ${isSunday && !isSelected ? "text-red-500" : ""}
                  ${isSaturday && !isSelected ? "text-blue-500" : ""}
                `}
              >
                {day.date}
              </span>

              {isCurrentMonth && appointmentCount > 0 && (
                <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleCalendar;
