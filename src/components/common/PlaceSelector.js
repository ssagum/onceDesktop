import React, { useState } from "react";
import { locationOptions } from "../../datas/users";

const PlaceSelector = ({ onSelect, onClose, selectedPlace }) => {
  // 부서별로 위치 정보를 그룹화
  const groupedLocations = Object.entries(locationOptions).reduce(
    (acc, [department, locations]) => {
      acc[department] = locations;
      return acc;
    },
    {}
  );

  const handleSelect = (place) => {
    onSelect(place);
    onClose();
  };

  return (
    <div className="w-[400px] max-h-[500px] overflow-y-auto p-4 bg-white">
      {Object.entries(groupedLocations).map(([department, placeList]) => (
        <div key={department} className="mb-4">
          <div className="font-bold text-gray-700 mb-2">{department}</div>
          <div className="pl-4">
            {placeList.map((place) => (
              <div
                key={place}
                className={`py-2 px-4 cursor-pointer rounded-md transition-all duration-200 ${
                  selectedPlace === place
                    ? "bg-indigo-100 text-indigo-700 font-semibold border border-indigo-500"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => handleSelect(place)}
              >
                {place}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlaceSelector;
