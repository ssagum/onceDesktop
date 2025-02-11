import React, { useState } from "react";

const EditableField2 = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("안녕하세요");

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        readOnly={!isEditing} // isEditing이 false이면 읽기 전용
        className={`w-full p-2 border rounded transition-colors duration-200 
          ${
            isEditing
              ? "border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              : "border-gray-300 bg-gray-100 cursor-not-allowed"
          }`}
      />

      <button
        onClick={toggleEditing}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
      >
        {isEditing ? "저장" : "수정"}
      </button>
    </div>
  );
};

export default EditableField2;
