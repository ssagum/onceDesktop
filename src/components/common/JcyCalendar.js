import React, { useState, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  parse,
} from "date-fns";
import { chevronBackward, chevronForward } from "../../assets";
const RenderHeader = ({ currentMonth, prevMonth, nextMonth }) => {
  return (
    <section className="flex flex-col">
      <section className="flex flex-row items-center">
        <p className="text-[16px]">{format(currentMonth, "MMMM")}</p>
        <p className="text-[16px] ml-[6px]">{format(currentMonth, "yyyy")}</p>
        <div className="flex flex-row ml-[14px]">
          <img
            onClick={prevMonth}
            src={chevronBackward}
            alt="chevronBackward"
            className="w-[6px] h-[12px]"
            style={{
              cursor: "pointer",
            }}
          />
          <div className="w-[10px]" />
          <img
            onClick={nextMonth}
            src={chevronForward}
            alt="chevronForward"
            className="w-[6px] h-[12px]"
            style={{
              cursor: "pointer",
            }}
          />
        </div>
      </section>
    </section>
  );
};

const RenderDays = ({ standardWidth }) => {
  const days = [];
  const date = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 0; i < 7; i++) {
    days.push(
      <div
        className="flex flex-row"
        style={{
          alignItems: "center",
        }}
        key={i}
      >
        <p className="text-[12px]">{date[i]}</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-row"
      style={{ justifyContent: "space-between", width: standardWidth }}
    >
      {days}
    </div>
  );
};

const RenderCells = ({
  currentMonth,
  selectedDate,
  onDateClick,
  standardWidth,
  startDate,
  endDate,
  lockDates,
}) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDateMonth = startOfWeek(monthStart);
  const endDateMonth = endOfWeek(monthEnd);

  const rows = [];
  let days = [];
  let day = startDateMonth;
  let formattedDate = "";

  while (day <= endDateMonth) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, "d");
      const cloneDay = new Date(day);
      const isInRange =
        startDate &&
        endDate &&
        day >= new Date(startDate) &&
        day <= new Date(endDate);
      const isStart = isSameDay(day, new Date(startDate));
      const isEnd = isSameDay(day, new Date(endDate));
      days.push(
        <section className="h-[40px]" key={cloneDay}>
          <div
            className={`col cell ${
              !isSameMonth(day, monthStart)
                ? isInRange
                  ? "range " // 이전달이나 다음달의 날짜 범위 내
                  : "disabled text-gray-400" // 이전달이나 다음달의 날짜
                : isSameDay(day, selectedDate)
                ? "selected" // 선택된 날짜
                : isInRange
                ? "range bg-yellow-200 rounded-full" // 여행기간 날짜
                : "valid" // 현재달의 날짜
            }`}
            onClick={() => !lockDates && onDateClick(cloneDay)}
            // lockDates가 true일 때 날짜 클릭 불가능
          >
            <div
              className={`flex items-center justify-center text-[12px] text-center ${
                isStart || isEnd
                  ? "bg-[#FBAB3A] rounded-full"
                  : isInRange
                  ? "bg-yellow-200 rounded-full"
                  : ""
              } ${
                isInRange && !isStart && !isEnd
                  ? "bg-yellow-200 rounded-full"
                  : ""
              }`}
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "100%",
              }}
            >
              <p>{formattedDate}</p>
            </div>
          </div>
        </section>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="flex flex-row justify-between" key={day}>
        {days}
      </div>
    );
    days = [];
  }
  return (
    <div className="flex flex-col" style={{ width: standardWidth }}>
      {rows}
    </div>
  );
};

export const JcyCalendar = ({
  standardWidth = 300,
  lockDates = false,
  preStartDay = "",
  setTargetStartDay = () => {},
  preEndDay = "",
  setTargetEndDay = () => {},
  isEdit = true, // 수정 모드 여부
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isSelectingStart, setIsSelectingStart] = useState(true);

  const parseCustomDate = (dateStr) => {
    // yyyy/MM/dd 형식으로 변경
    const parsedDate = parse(dateStr, "yyyy/MM/dd", new Date());

    if (isNaN(parsedDate.getTime())) {
      console.error(`Invalid date format: ${dateStr}`);
      return null;
    }
    return parsedDate;
  };

  useEffect(() => {
    if (preStartDay && preEndDay) {
      const parsedStartDate = parseCustomDate(preStartDay);
      const parsedEndDate = parseCustomDate(preEndDay);

      if (parsedStartDate && parsedEndDate) {
        setSelectedDate(parsedStartDate);
        setStartDate(parsedStartDate);
        setEndDate(parsedEndDate);
        setCurrentMonth(parsedStartDate);
        // yyyy/MM/dd 형식으로 변경
        setTargetStartDay(format(parsedStartDate, "yyyy/MM/dd"));
        setTargetEndDay(format(parsedEndDate, "yyyy/MM/dd"));
      }
    }
  }, [preStartDay, preEndDay, setTargetStartDay, setTargetEndDay]);

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const onDateClick = (day) => {
    if (!isEdit || lockDates) return;

    setSelectedDate(day);
    if (isSelectingStart) {
      setStartDate(day);
      // yyyy/MM/dd 형식으로 변경
      setTargetStartDay(format(day, "yyyy/MM/dd"));
      setIsSelectingStart(false);
    } else {
      if (day < startDate) {
        setStartDate(day);
        setEndDate(startDate);
        // yyyy/MM/dd 형식으로 변경
        setTargetStartDay(format(day, "yyyy/MM/dd"));
        setTargetEndDay(format(startDate, "yyyy/MM/dd"));
      } else {
        setEndDate(day);
        // yyyy/MM/dd 형식으로 변경
        setTargetEndDay(format(day, "yyyy/MM/dd"));
      }
      setIsSelectingStart(true);
    }
  };

  return (
    <div className="flex flex-col border border-gray-300 rounded-lg px-[20px] pt-[20px] h-[400px]">
      <RenderHeader
        currentMonth={currentMonth}
        prevMonth={prevMonth}
        nextMonth={nextMonth}
        standardWidth={standardWidth}
      />
      <div className="mt-[24px]" />
      <RenderDays standardWidth={standardWidth} />
      <div
        className="h-[2px] bg-onceBlue my-[24px]"
        style={{ width: standardWidth }}
      />
      <RenderCells
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        onDateClick={onDateClick}
        standardWidth={standardWidth}
        startDate={startDate}
        endDate={endDate}
        lockDates={lockDates}
      />
    </div>
  );
};
