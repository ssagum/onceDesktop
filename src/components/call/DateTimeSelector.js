import React from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 100%;
`;

const DateInput = styled.input`
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 12px;
  flex: 1;
  background-color: #f9fafb;
  height: 40px;
  min-width: 120px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
  }

  &:disabled {
    background-color: #e5e7eb;
    cursor: not-allowed;
  }
`;

const TimeInput = styled.input`
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 12px;
  flex: 1;
  background-color: #f9fafb;
  height: 40px;
  min-width: 100px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
  }

  &:disabled {
    background-color: #e5e7eb;
    cursor: not-allowed;
  }
`;

/**
 * 날짜와 시간을 함께 선택할 수 있는 컴포넌트
 * @param {string} dateValue - yyyy-MM-dd 형식의 날짜
 * @param {string} timeValue - HH:mm 형식의 시간
 * @param {function} onDateChange - 날짜 변경 핸들러
 * @param {function} onTimeChange - 시간 변경 핸들러
 * @param {string} timeName - time input의 name 속성
 * @param {boolean} disabled - 비활성화 여부
 */
const DateTimeSelector = ({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  timeName,
  disabled = false,
}) => {
  // 날짜 변경 핸들러
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  const handleTimeChange = (e) => {
    if (onTimeChange) {
      onTimeChange({
        target: {
          name: timeName,
          value: e.target.value,
        },
      });
    }
  };

  return (
    <Container>
      <DateInput
        type="date"
        value={dateValue}
        onChange={handleDateChange}
        disabled={disabled}
      />
      <TimeInput
        type="time"
        name={timeName}
        value={timeValue}
        onChange={handleTimeChange}
        disabled={disabled}
      />
    </Container>
  );
};

export default DateTimeSelector;
