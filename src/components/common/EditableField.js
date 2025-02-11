import React from "react";

const EditableField = ({
  placeholder = "미정",
  className = "h-[40px] w-[280px]",
  isEditing = false,
  value = "",
  setValue = () => {},
}) => {
  return (
    <div className={`${className}`}>
      {isEditing ? (
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`bg-textBackground border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 ${className}`}
        />
      ) : (
        <p
          className={`border border-gray-300 rounded-md bg-textBackground p-2 ${className}`}
        >
          {value === "" ? (
            // 값이 없으면 placeholder 텍스트를 보여주고, placeholder 스타일(예: 텍스트 색상)을 적용
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            value
          )}
        </p>
      )}
    </div>
  );
};

export default EditableField;
