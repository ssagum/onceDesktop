import React, { useState } from "react";
import styled from "styled-components";
import NaverReservationViewer from "./NaverReservationViewer";

const NaverButton = styled.button`
  display: flex;
  align-items: center;
  gap: 2px;
  background-color: #03c75a; /* 네이버 녹색 */
  hover:background-color: #02a54b;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #02a54b;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

/**
 * 네이버 예약 모달을 열 수 있는 버튼 컴포넌트
 * @param {Object} props
 * @param {Function} props.onDataExtract - 예약 데이터 추출 시 호출될 콜백 함수
 * @param {string} props.buttonText - 버튼 텍스트 (기본값: "네이버 예약 확인")
 * @param {Object} props.buttonStyle - 버튼 스타일 객체
 * @param {React.ReactNode} props.icon - 버튼에 표시할 아이콘
 * @returns {React.ReactElement}
 */
const NaverReservationTrigger = ({
  onDataExtract,
  buttonText = "네이버 예약 확인",
  buttonStyle = {},
  icon = (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l3.69 3.69a.75.75 0 11-1.06 1.06l-3.69-3.69A8.25 8.25 0 012.25 10.5z" />
    </svg>
  ),
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <>
      <NaverButton onClick={() => setIsModalVisible(true)} style={buttonStyle}>
        {icon}
        {buttonText}
      </NaverButton>

      <NaverReservationViewer
        isVisible={isModalVisible}
        setIsVisible={setIsModalVisible}
        onDataExtract={onDataExtract}
      />
    </>
  );
};

export default NaverReservationTrigger;
