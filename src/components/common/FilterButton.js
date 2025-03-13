import React, { useState } from "react";
import { IoFilterOutline } from "react-icons/io5";
import { MdClose } from "react-icons/md";

const FilterButton = ({ selectedFilters, onReset, onClick }) => {
  const hasFilters = selectedFilters && selectedFilters.length > 0;

  return (
    <div className="relative flex items-center">
      {/* 필터 버튼 */}
      <button
        onClick={onClick}
        className={`flex flex-row items-center gap-x-2 px-4 py-2 rounded-md border transition-all ${
          hasFilters
            ? "bg-blue-500 text-white border-blue-500"
            : "bg-white text-[#002D5D] border-gray-400"
        }`}
      >
        <IoFilterOutline size={20} />
        <span>필터</span>
        {hasFilters && (
          <span className="bg-white text-blue-500 text-sm font-semibold px-2 rounded-full">
            {selectedFilters.length}
          </span>
        )}
      </button>

      {/* 필터 초기화 버튼 */}
      {hasFilters && onReset && (
        <button
          onClick={onReset}
          className="ml-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all"
        >
          <MdClose size={16} />
        </button>
      )}
    </div>
  );
};

const FilterChips = ({ selectedFilters = [], removeFilter }) => {
  if (!selectedFilters || selectedFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {selectedFilters.map((filter, index) => (
        <div
          key={index}
          className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
        >
          <span>{filter}</span>
          <button
            onClick={() => removeFilter(filter)}
            className="ml-2 text-blue-600 hover:text-blue-800"
          >
            <MdClose size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export { FilterButton, FilterChips };
