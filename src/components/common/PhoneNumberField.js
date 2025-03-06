import React from "react";

const PhoneNumberField = ({
  placeholder = "전화번호 입력",
  className = "h-[40px] w-[280px]",
  isEditing = true,
  value = "",
  setValue = () => {},
  readOnly = false,
}) => {
  // 전화번호 포맷팅 함수
  // 입력된 숫자 문자열을 받아서 3-4-4 패턴으로 포맷팅합니다.
  const formatPhoneNumber = (input) => {
    // 모든 숫자가 아닌 문자 제거
    const cleaned = input.replace(/[^\d]/g, "");

    if (cleaned.length < 4) {
      // 3자리 이하: 그냥 숫자만 표시
      return cleaned;
    } else if (cleaned.length < 8) {
      // 4~7자리: 3자리 뒤에 '-'를 붙임
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else {
      // 8자리 이상: 3-4-4 패턴으로 포맷팅
      // 만약 숫자가 11자 이상이면 처음 11자리만 포맷팅하고, 그 이후의 숫자는 그대로 붙입니다.
      const formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(
        3,
        7
      )}-${cleaned.slice(7, 11)}`;
      const extra = cleaned.slice(11);
      return extra ? formatted + extra : formatted;
    }
  };

  // input 변경 시 처리 함수
  const handleChange = (e) => {
    // 사용자가 입력한 값
    const input = e.target.value;
    // 숫자만 남김
    const digits = input.replace(/[^\d]/g, "");
    // 자동 포맷팅 처리
    const formatted = formatPhoneNumber(digits);
    // 포맷팅된 값을 부모 컴포넌트에 전달
    setValue(formatted);
  };

  return (
    <div className={`${className}`}>
      {isEditing ? (
        <input
          type="tel"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          readOnly={readOnly}
          className={`${
            readOnly ? "bg-gray-100 cursor-default" : "bg-textBackground"
          } border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 ${className}`}
        />
      ) : (
        <p
          className={`border border-gray-300 rounded-md bg-textBackground p-2 ${className}`}
        >
          {value === "" ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            value
          )}
        </p>
      )}
    </div>
  );
};

export default PhoneNumberField;
