import React, { useState } from "react";
import ChipText from "../common/ChipText";
import StockDetailModal from "./StockDetailModal";
import PropTypes from "prop-types";

const StockRow = ({ index, item, onClick }) => {
  const [isDetailModalOn, setIsDetailModalOn] = useState(false);

  // item이 없는 경우 빈 컴포넌트 반환
  if (!item) {
    return null;
  }

  const { category, department, itemName, state, quantity, measure, location } =
    item;

  // index가 2의 배수이면 'bg-gray-100', 아니면 'bg-white' 적용
  const rowBgClass =
    index % 2 === 0 ? "bg-onceTextBackground" : "bg-onceBackground";

  return (
    <div
      className={`grid grid-cols-7 h-[80px] cursor-pointer hover:bg-gray-200 items-center`}
      style={{
        gridTemplateColumns: "1.3fr 1fr 1.9fr 1fr 0.7fr 0.7fr 1.3fr",
        gap: "1rem",
      }}
      onClick={onClick}
    >
      <div className="flex items-center justify-center text-black">
        {category}
      </div>
      <div className="flex items-center justify-center text-black">
        {department}
      </div>
      <div className="flex items-center justify-center text-black overflow-hidden">
        <div className="text-center w-full px-2 line-clamp-2">{itemName}</div>
      </div>
      <div className="flex justify-center items-center">
        <ChipText text={state} />
      </div>
      <div className="flex items-center justify-center text-black">
        {quantity}
      </div>
      <div className="flex items-center justify-center text-black">
        {measure}
      </div>
      <div className="flex items-center justify-center text-black">
        {location}
      </div>
      <StockDetailModal
        isVisible={isDetailModalOn}
        setIsVisible={setIsDetailModalOn}
        item={item}
      />
    </div>
  );
};

StockRow.propTypes = {
  index: PropTypes.number.isRequired,
  item: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default StockRow;
