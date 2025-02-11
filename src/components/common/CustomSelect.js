import React from "react";

const CustomSelect = ({
  value,
  onChange,
  options,
  placeholder,
  className = "",
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`w-[600px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground ${className}`}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option, index) => (
        <option key={index} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

export default CustomSelect;
