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
      className={`grid grid-cols-7 gap-4 py-3 cursor-pointer hover:bg-gray-200`}
      onClick={onClick}
    >
      <div className="text-center text-black">{category}</div>
      <div className="text-center text-black">{department}</div>
      <div className="text-center text-black">{itemName}</div>
      <div className="flex justify-center">
        <ChipText text={state} />
      </div>
      <div className="text-center text-black">{quantity}</div>
      <div className="text-center text-black">{measure}</div>
      <div className="text-center text-black">{location}</div>
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
