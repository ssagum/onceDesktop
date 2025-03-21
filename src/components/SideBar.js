import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import styled from "styled-components";
import Modal from "react-modal";
import { logoLong } from "../assets";
import { notification } from "../assets/sound";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import PCAllocation from "./PCAllocation";
import packageJson from "../../package.json";
import { useContext } from "react";
import { useUserLevel } from "../utils/UserLevelContext";
import { isHospitalOwner } from "../utils/permissionUtils";

const TopZone = styled.div``;
const LoginZone = styled.div``;
const BottomZone = styled.div``;
const IndexZone = styled.div``;

const RenderIndex = ({ indexValue, nowURL }) => {
  return (
    <div className="mb-[50px] w-full">
      <p
        className="text-[16px] color-[#162D66] font-semibold"
        style={{ color: indexValue === nowURL ? "#162D66" : "#888888" }}
      >
        {indexValue}
      </p>
    </div>
  );
};

const customModalStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    padding: "20px",
    borderRadius: "10px",
  },
};

export default function SideBar() {
  const location = useLocation();
  const nowURL = location.pathname;
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const correctCode = "240550"; // 이곳에 실제 인증번호를 설정하세요
  const { userLevelData, currentUser } = useUserLevel();

  const handleCodeInputChange = (e) => {
    setVerificationCode(e.target.value);
  };

  const handleDataSiloClick = (e) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full justify-center bg-onceBackground w-[250px] min-h-[900px] py-[20px]">
      <TopZone className="bg-white rounded-tr-2xl rounded-br-2xl h-full relative">
        {false && (
          <LoginZone className="flex flex-col w-full items-center h-[240px] justify-center">
            <button className="w-[200px] h-[70px] bg-[#162D66] rounded-md">
              <p className="text-white text-[30px]">Login</p>
            </button>
            <p className="text-[#939393] text-[18px] mt-3">
              Don't have an account?
            </p>
          </LoginZone>
        )}
        {/* {true && (
          <LoginZone className="flex flex-col w-full items-center h-[240px] justify-center">
            <div className="flex-1 flex w-full items-center justify-center">
              <img src={logoLong} alt="logo" className="w-[200px] h-auto" />
            </div>
            <div className="flex-1 flex w-full items-center justify-center">
              <button
                onClick={() => {
                  checkSound();
                }}
                className="bg-onceBlue w-[160px] h-[60px]"
              >
                <span className="text-white">PC 할당</span>
              </button>
            </div>
          </LoginZone>
        )} */}
        <PCAllocation />
        <IndexZone className="flex flex-col px-[10px] items-center">
          <div className="w-full bg-[#162D66] h-[3px] rounded-2xl mb-[50px]" />
          <Link to="/">
            <RenderIndex
              indexValue="홈"
              nowURL={nowURL === "/" ? "홈" : nowURL}
            />
          </Link>
          <Link to="/notice">
            <RenderIndex
              indexValue="게시판"
              nowURL={nowURL === "/notice" ? "게시판" : nowURL}
            />
          </Link>
          {/* <Link to="/education">
            <RenderIndex
              indexValue="교육자료"
              nowURL={nowURL === "/education" ? "교육자료" : nowURL}
            />
          </Link> */}
          <Link to="/warehouse">
            <RenderIndex
              indexValue="비품현황"
              nowURL={nowURL === "/warehouse" ? "비품현황" : nowURL}
            />
          </Link>
          {/* <Link to="/write">
            <RenderIndex
              indexValue="보고서"
              nowURL={nowURL === "/write" ? "보고서" : nowURL}
            />
          </Link> */}
          {/* <Link to="/call">
            <RenderIndex
              indexValue="호출"
              nowURL={nowURL === "/call" ? "호출" : nowURL}
            />
          </Link> */}
          {/* <Link to="/contact">
            <RenderIndex
              indexValue="원내 연락망"
              nowURL={nowURL === "/contact" ? "CONTACT" : nowURL}
            />
          </Link> */}
          <Link to="/task">
            <RenderIndex
              indexValue="업무분장"
              nowURL={nowURL === "/task" ? "업무분장" : nowURL}
            />
          </Link>
          <Link to="/schedule">
            <RenderIndex
              indexValue="예약관리"
              nowURL={nowURL === "/schedule" ? "예약관리" : nowURL}
            />
          </Link>
          <Link to="/parking">
            <RenderIndex
              indexValue="주차등록"
              nowURL={nowURL === "/parking" ? "주차등록" : nowURL}
            />
          </Link>
          {isHospitalOwner(userLevelData) && (
            <Link to="/management">
              <RenderIndex
                indexValue="병원현황"
                nowURL={nowURL === "/management" ? "병원현황" : nowURL}
              />
            </Link>
          )}
        </IndexZone>
        <div className="w-full h-[50px] absolute bottom-0 justify-center flex">
          <span className="text-onceGray text-once18">
            V.{packageJson.version}
          </span>
        </div>
      </TopZone>
      {/* Modal for Verification Code */}
    </div>
  );
}
