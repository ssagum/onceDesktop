import React, { useState } from "react";

const DayChanger = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 날짜를 "YYYY.MM.DD" 형식으로 변환하는 함수
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  };

  // 이전 날짜로 이동
  const handlePrevious = () => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  // 다음 날짜로 이동
  const handleNext = () => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={handlePrevious}
        className="text-2xl hover:text-blue-500 focus:outline-none mb-1"
      >
        &lt;
      </button>
      <div>
        <span className="text-xl font-bold">{formatDate(currentDate)}</span>
      </div>
      <button
        onClick={handleNext}
        className="text-2xl hover:text-blue-500 focus:outline-none mb-1"
      >
        &gt;
      </button>
    </div>
  );
};

export default DayChanger;
