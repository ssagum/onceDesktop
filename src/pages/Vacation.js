import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import SideBar from "../components/SideBar";
import { useToast } from "../contexts/ToastContext";

const MainZone = styled.div``;

const Vacation = () => {
  const { pathname } = useLocation();
  const [vacationType, setVacationType] = useState("연차");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");

  // useToast 훅 사용
  const { showToast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("휴가 신청:", { vacationType, fromDate, toDate, reason });
    // 여기에 데이터 저장 로직 추가 예정
    showToast("휴가 신청이 완료되었습니다.", "success");
  };

  return (
    <div className="flex flex-row w-full h-screen items-center">
      <div className="w-[250px] h-full flex flex-col justify-center">
        <SideBar />
      </div>
      <MainZone className="w-full flex flex-col justify-evenly items-center bg-onceBackground h-screen p-6">
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">휴가신청</h2>
          <p className="text-green-500 mb-4">
            *일요일은 제외되도록 꼭 체크하세요.
          </p>

          <div className="flex gap-4 mb-6">
            <button
              className={`py-3 px-8 rounded-sm ${
                vacationType === "진료 휴일" ? "bg-gray-200" : "bg-white"
              }`}
              onClick={() => setVacationType("진료 휴일")}>
              진료 휴일
            </button>
            <button
              className={`py-3 px-8 rounded-sm ${
                vacationType === "사용 N일" ? "bg-gray-200" : "bg-white"
              }`}
              onClick={() => setVacationType("사용 N일")}>
              사용 N일
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="border-b pb-2 flex justify-between items-center">
                <span className="text-lg">2025.01.25</span>
                <span className="text-lg">연차</span>
                <button className="text-gray-500">x</button>
              </div>
              <div className="border-b pb-2 flex justify-between items-center">
                <span className="text-lg">2025.01.25</span>
                <span className="text-lg">반차</span>
                <div className="flex">
                  <span className="mr-4">시</span>
                  <span className="mr-4">분</span>
                  <span className="mr-4">부터</span>
                  <span>N시간</span>
                </div>
                <button className="text-gray-500">x</button>
              </div>
              <div className="border-b pb-2 flex justify-between items-center">
                <span className="text-lg">2025.01.25</span>
                <span className="text-lg">경조사</span>
                <button className="text-gray-500">x</button>
              </div>
            </div>

            <div className="flex gap-4">
              <input
                type="date"
                className="border p-2 rounded"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                required
              />
              <select className="border p-2 rounded">
                <option>연차</option>
                <option>반차</option>
                <option>경조사</option>
              </select>
            </div>

            <div>
              <textarea
                className="w-full border p-3 rounded h-32 resize-none"
                placeholder="도수치료,"
                value={reason}
                onChange={(e) => setReason(e.target.value)}></textarea>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-gray-200 py-3 px-20 rounded-md text-xl font-medium">
                신청하기
              </button>
            </div>
          </form>
        </div>
      </MainZone>
    </div>
  );
};

export default Vacation;
