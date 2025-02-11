import React, { useState } from "react";

const CurrencyInput = ({ value, onChange, className = "" }) => {
  // 천 단위마다 , 추가하는 함수
  const formatCurrency = (val) => {
    if (!val) return "";
    return val.replace(/\B(?=(\d{3})+(?!\d))/g, ","); // 3자리마다 , 추가
  };

  // 입력 값 처리
  const handleChange = (e) => {
    let rawValue = e.target.value.replace(/,/g, ""); // 입력 시 기존 , 제거
    if (!/^\d*$/.test(rawValue)) return; // 숫자만 허용
    onChange(rawValue);
  };

  return (
    <input
      type="text"
      value={formatCurrency(value)}
      placeholder="단가"
      onChange={handleChange}
      className={`border border-gray-400 rounded-md h-[40px] px-4 w-[280px] bg-textBackground ${className}`}
    />
  );
};

export default CurrencyInput;
