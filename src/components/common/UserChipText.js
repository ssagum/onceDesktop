import React from "react";

const UserChipText = ({ options = [], selected, onChange }) => {
  return (
    <div className="flex flex-wrap">
      {options.map((option) => (
        <div
          key={option.value}
          className={`flex w-[160px] h-[36px] items-center justify-center rounded-full cursor-pointer 
                      ${
                        selected === option.value
                          ? "bg-onceChipBlue text-onceBlue"
                          : "bg-gray-200 text-gray-700"
                      }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </div>
      ))}
    </div>
  );
};

export default UserChipText;
