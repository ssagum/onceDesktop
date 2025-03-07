import React, { useState, useEffect, useRef, memo, useCallback } from "react";
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
  // 월 이름을 한글로 변환
  const getKoreanMonth = (month) => {
    return `${month + 1}월`;
  };

  return (
    <section className="flex flex-col">
      <section className="flex flex-row items-center">
        <p className="text-[16px]">{getKoreanMonth(currentMonth.getMonth())}</p>
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
  const date = ["일", "월", "화", "수", "목", "금", "토"]; // 요일을 한글로 변경

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
  startDayOnlyMode,
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

      // 반복성 업무는 시작일부터 무기한으로 표시
      const isRepeatingTask =
        startDayOnlyMode && startDate && day >= new Date(startDate);

      // 일반적인 날짜 범위 (이벤트성 업무)
      const isNormalRange =
        !startDayOnlyMode &&
        startDate &&
        endDate &&
        day >= new Date(startDate) &&
        day <= new Date(endDate);

      // 범위에 속하는지 여부
      const isInRange = isRepeatingTask || isNormalRange;

      // 시작일과 종료일 표시
      const isStart = startDate && isSameDay(day, new Date(startDate));
      const isEnd =
        !startDayOnlyMode && endDate && isSameDay(day, new Date(endDate));

      days.push(
        <section className="h-[40px]" key={cloneDay}>
          <div
            className={`col cell ${
              !isSameMonth(day, monthStart)
                ? isInRange
                  ? "range" // 이전달이나 다음달의 날짜 범위 내
                  : "disabled text-gray-400" // 이전달이나 다음달의 날짜
                : isSameDay(day, selectedDate)
                ? "selected" // 선택된 날짜
                : isInRange
                ? "range" // 범위 내 날짜
                : "valid" // 현재달의 날짜
            }`}
            onClick={() => onDateClick(cloneDay)}
          >
            <div
              className={`flex items-center justify-center text-[12px] text-center ${
                isStart
                  ? "bg-[#FBAB3A] rounded-full" // 시작일
                  : isEnd
                  ? "bg-[#FBAB3A] rounded-full" // 종료일
                  : isRepeatingTask
                  ? "bg-yellow-100 rounded-full" // 반복성 업무 범위
                  : isNormalRange && !isStart && !isEnd
                  ? "bg-yellow-200 rounded-full" // 이벤트성 업무 범위
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

export const JcyCalendar = memo(
  ({
    standardWidth = 300,
    lockDates = false,
    preStartDay = "",
    setTargetStartDay = () => {},
    preEndDay = "",
    setTargetEndDay = () => {},
    isEdit = true, // 수정 모드 여부
    singleDateMode = false, // 날짜를 하나만 선택하는 모드 (1회성 업무용)
    startDayOnlyMode = false, // 시작일만 선택하는 모드 (반복성 업무용)
  }) => {
    // 초기 월 설정을 위해 preStartDay가 있으면 파싱해서 사용
    const getInitialMonth = () => {
      if (preStartDay) {
        try {
          // yyyy/MM/dd 형식 파싱
          const parsedDate = parse(preStartDay, "yyyy/MM/dd", new Date());
          if (!isNaN(parsedDate.getTime())) {
            console.log(`JcyCalendar: 시작일 ${preStartDay}로 달력 초기화`);
            return parsedDate;
          }
        } catch (error) {
          console.error("초기 월 설정 중 오류:", error);
        }
      }
      return new Date(); // 기본값은 현재 날짜
    };

    const [currentMonth, setCurrentMonth] = useState(getInitialMonth());
    const [selectedDate, setSelectedDate] = useState(null);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isSelectingStart, setIsSelectingStart] = useState(true);
    const [currentView, setCurrentView] = useState(currentMonth); // 현재 보고 있는 월 유지

    // 초기 렌더링 및 props 변경 추적을 위한 ref
    const initializedRef = useRef(false);
    const previousPropsRef = useRef({ preStartDay, preEndDay });

    const parseCustomDate = (dateStr) => {
      // yyyy/MM/dd 형식으로 변경
      const parsedDate = parse(dateStr, "yyyy/MM/dd", new Date());

      if (isNaN(parsedDate.getTime())) {
        console.error(`Invalid date format: ${dateStr}`);
        return null;
      }
      return parsedDate;
    };

    // preStartDay 변경 시 최초 1회는 항상 해당 월로 이동
    useEffect(() => {
      if (preStartDay) {
        try {
          const parsedStartDate = parseCustomDate(preStartDay);
          if (parsedStartDate) {
            // 첫 렌더링이거나 preStartDay가 변경된 경우에만 월 변경
            if (
              !initializedRef.current ||
              previousPropsRef.current.preStartDay !== preStartDay
            ) {
              console.log(
                `JcyCalendar: 시작일이 바뀌어 ${preStartDay} 월로 달력 업데이트`
              );
              setCurrentMonth(parsedStartDate);
              setCurrentView(parsedStartDate);
            }
          }
        } catch (error) {
          console.error("달력 월 업데이트 중 오류:", error);
        }
      }
      // props 변경 기록 업데이트
      previousPropsRef.current.preStartDay = preStartDay;
    }, [preStartDay]);

    // 날짜 변경 감지 및 설정
    useEffect(() => {
      // props가 변경되었고 유효한 값인 경우에만 실행
      if (!preStartDay || !preEndDay) return;

      // 이전 props와 동일하면 무시
      if (
        previousPropsRef.current.preStartDay === preStartDay &&
        previousPropsRef.current.preEndDay === preEndDay &&
        initializedRef.current
      ) {
        return;
      }

      // 현재 props를 기억
      previousPropsRef.current = { preStartDay, preEndDay };

      const parsedStartDate = parseCustomDate(preStartDay);
      const parsedEndDate = parseCustomDate(preEndDay);

      if (parsedStartDate && parsedEndDate) {
        setSelectedDate(parsedStartDate);
        setStartDate(parsedStartDate);
        setEndDate(parsedEndDate);

        // 처음 초기화될 때만 월 설정
        if (!initializedRef.current) {
          setCurrentMonth(parsedStartDate);
          setCurrentView(parsedStartDate);
          initializedRef.current = true;
        }
      }
    }, [preStartDay, preEndDay]);

    // 부모 컴포넌트 콜백 함수 (메모이제이션하여 불필요한 호출 방지)
    const updateTargetStartDay = useCallback(
      (value) => {
        if (value !== preStartDay) {
          setTargetStartDay(value);
        }
      },
      [preStartDay, setTargetStartDay]
    );

    const updateTargetEndDay = useCallback(
      (value) => {
        if (value !== preEndDay) {
          setTargetEndDay(value);
        }
      },
      [preEndDay, setTargetEndDay]
    );

    const prevMonth = () => {
      const newMonth = subMonths(currentMonth, 1);
      setCurrentMonth(newMonth);
      setCurrentView(newMonth);
    };

    const nextMonth = () => {
      const newMonth = addMonths(currentMonth, 1);
      setCurrentMonth(newMonth);
      setCurrentView(newMonth);
    };

    const onDateClick = useCallback(
      (day) => {
        if (!isEdit) return;

        setSelectedDate(day);

        // 단일 날짜 모드인 경우 (1회성 업무)
        if (singleDateMode) {
          setStartDate(day);
          setEndDate(day);
          const formattedDay = format(day, "yyyy/MM/dd");
          updateTargetStartDay(formattedDay);
          updateTargetEndDay(formattedDay);
          return;
        }

        // 시작일만 선택 모드 (반복성 업무) - 시작일만 변경, 종료일은 무기한으로 유지
        if (startDayOnlyMode) {
          setStartDate(day);
          const formattedDay = format(day, "yyyy/MM/dd");
          updateTargetStartDay(formattedDay);
          // 종료일 콜백을 호출하지 않음 - 종료일은 TaskAddModal에서 관리됨
          return;
        }

        // 이벤트성 업무 모드 - 시작일과 종료일 모두 선택 가능
        if (isSelectingStart) {
          setStartDate(day);
          // 시작일을 선택했는데 종료일보다 이후라면 종료일도 시작일로 설정
          if (endDate && day > endDate) {
            setEndDate(day);
            const formattedDay = format(day, "yyyy/MM/dd");
            updateTargetEndDay(formattedDay);
          }
          const formattedStartDay = format(day, "yyyy/MM/dd");
          updateTargetStartDay(formattedStartDay);
          setIsSelectingStart(false);
          setCurrentView(currentMonth); // 현재 보고 있는 월 저장
        } else {
          // 종료일을 선택했는데 시작일보다 이전이라면
          if (day < startDate) {
            setStartDate(day);
            setEndDate(startDate);
            const formattedStartDay = format(day, "yyyy/MM/dd");
            const formattedEndDay = format(startDate, "yyyy/MM/dd");
            updateTargetStartDay(formattedStartDay);
            updateTargetEndDay(formattedEndDay);
          } else {
            setEndDate(day);
            const formattedEndDay = format(day, "yyyy/MM/dd");
            updateTargetEndDay(formattedEndDay);
          }
          setIsSelectingStart(true);
          // 현재 보고 있는 월을 유지 (startDate가 있는 월로 돌아가지 않도록)
        }
      },
      [
        isEdit,
        singleDateMode,
        startDayOnlyMode,
        currentMonth,
        startDate,
        endDate,
        isSelectingStart,
        updateTargetStartDay,
        updateTargetEndDay,
      ]
    );

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
          startDayOnlyMode={startDayOnlyMode}
        />
      </div>
    );
  }
);
