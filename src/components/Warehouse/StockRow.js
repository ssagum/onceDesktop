import React from "react";
import ChipText from "../common/ChipText";

const StockRow = ({
  index, // 부모에서 넘겨받은 index
  category,
  itemName,
  department,
  state,
  quantity,
  measure,
  position, // 필요시 chip 스타일 커스터마이징
}) => {
  // index가 2의 배수이면 'bg-gray-100', 아니면 'bg-white' 적용
  const rowBgClass =
    index % 2 === 0 ? "bg-onceTextBackground" : "bg-onceBackground";

  return (
    <div
      className={`grid grid-cols-7 gap-4 py-2 h-boxH items-center ${rowBgClass}`}
    >
      <div className="text-center text-black">{category}</div>
      <div className="text-center text-black">{department}</div>
      <div className="text-center text-black">{itemName}</div>
      <div className="flex justify-center">
        <ChipText text={state} />
      </div>
      <div className="text-center text-black">{quantity}</div>
      <div className="text-center text-black">{measure}</div>
      <div className="text-center text-black">{position}</div>
    </div>
  );
};

export default StockRow;
