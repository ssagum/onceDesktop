import React, { useState } from "react";
import { format } from "date-fns";
import ToDo from "../common/ToDo";

function DateViewModal({ isVisible, onClose, column, tasks }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 날짜 이동 핸들러
  const handlePrevDate = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      // 일요일인 경우 하루 더 이전으로
      if (newDate.getDay() === 0) {
        newDate.setDate(newDate.getDate() - 1);
      }
      return newDate;
    });
  };

  const handleNextDate = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      // 일요일인 경우 하루 더 다음으로
      if (newDate.getDay() === 0) {
        newDate.setDate(newDate.getDate() + 1);
      }
      return newDate;
    });
  };

  // 날짜 포맷팅
  const formatDate = (date) => {
    return format(date, "yyyy.MM.dd");
  };

  // 요일 구하기
  const getDayOfWeek = (date) => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return days[date.getDay()];
  };

  // 3일치 날짜 계산 (어제, 오늘, 내일)
  const getDates = () => {
    const dates = [];
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);

    // 어제가 일요일이면 토요일로 조정
    if (yesterday.getDay() === 0) {
      yesterday.setDate(yesterday.getDate() - 1);
    }

    const tomorrow = new Date(currentDate);
    tomorrow.setDate(currentDate.getDate() + 1);

    // 내일이 일요일이면 월요일로 조정
    if (tomorrow.getDay() === 0) {
      tomorrow.setDate(tomorrow.getDate() + 1);
    }

    dates.push(yesterday, currentDate, tomorrow);
    return dates;
  };

  // 해당 날짜의 작업 필터링
  const getTasksByDate = (date) => {
    return tasks.filter((task) => {
      const taskStartDate = new Date(task.startDate);
      const taskEndDate = new Date(task.endDate);
      const targetDate = new Date(date);

      // 시간 부분을 제거하고 날짜만 비교
      taskStartDate.setHours(0, 0, 0, 0);
      taskEndDate.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);

      return targetDate >= taskStartDate && targetDate <= taskEndDate;
    });
  };

  if (!isVisible) return null;

  const dates = getDates();

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* 모달 배경 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-40"
        onClick={onClose}
      ></div>

      {/* 모달 컨테이너 */}
      <div className="bg-white rounded-md shadow-xl w-[90%] max-w-[1200px] max-h-[80vh] overflow-hidden z-10 relative">
        {/* 모달 헤더 */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-bold">{column.title} 업무</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 모달 컨텐츠 */}
        <div className="p-6 flex items-stretch gap-2 h-[600px]">
          {/* 이전 버튼 */}
          <button
            onClick={handlePrevDate}
            className="self-center text-3xl text-gray-400 hover:text-gray-700 px-2"
          >
            &lt;
          </button>

          {/* 날짜별 업무 목록 */}
          <div className="flex-1 flex gap-4">
            {dates.map((date, index) => (
              <div
                key={date.toISOString()}
                className="flex-1 border rounded-md overflow-hidden"
              >
                {/* 날짜 헤더 */}
                <div className="bg-onceBlue text-white text-center py-3 font-medium">
                  <div>
                    {formatDate(date)} ({getDayOfWeek(date)})
                  </div>
                </div>

                {/* 날짜별 업무 목록 */}
                <div className="p-2 h-[calc(100%-60px)] overflow-y-auto">
                  {getTasksByDate(date).map((task) => (
                    <ToDo key={task.id} task={task} className="mb-2" />
                  ))}
                  {getTasksByDate(date).length === 0 && (
                    <div className="text-center text-gray-500 mt-4">
                      해당 날짜에 등록된 업무가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 다음 버튼 */}
          <button
            onClick={handleNextDate}
            className="self-center text-3xl text-gray-400 hover:text-gray-700 px-2"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}

export default DateViewModal;
