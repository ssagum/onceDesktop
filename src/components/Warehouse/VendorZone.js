import React, { useState, useEffect } from "react";
import styled from "styled-components";
import ModalTemplate from "../common/ModalTemplate";
import OnceOnOffButton from "../common/OnceOnOffButton";
import ChipText from "../common/ChipText";
import EditableField from "../common/EditableField";
import PhoneNumberField from "../common/PhoneNumberField";
import { vendors } from "../../datas/vendors";
import JcyTable from "../common/JcyTable";
import VendorRow from "./VendorRow";

const SearchZone = styled.div``;
const BoxZone = styled.div``;
const PaginationZone = styled.div``;
const SectionZone = styled.div``;
const IndexPart = styled.div``;
const OneLine = styled.div``;
const Half = styled.div``;

// 거래처 테이블용 컬럼 정의
const vendorColumns = [
  { label: "거래처명", key: "clientName" },
  { label: "담당자", key: "manager" },
  { label: "업종", key: "industry" },
  { label: "연락처", key: "contact" },
  { label: "이메일", key: "email" },
  { label: "관련 문서", key: "documents" },
];

const VendorZone = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(7);
  const [isFilterModalOn, setIsFilterModalOn] = useState(true);
  const [phoneN, setPhoneN] = useState("");

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1); // [1, 2, 3, 4, 5, 6, 7]

  // 이전 페이지로 이동하는 함수
  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 다음 페이지로 이동하는 함수
  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="flex flex-col w-full bg-white h-full">
      <SearchZone className="flex flex-row w-full items-center justify-between mb-[40px]">
        <div class="relative w-[400px]">
          <input
            type="text"
            placeholder="거래처를 입력해주세요."
            class="w-full border border-[#9D9D9C] bg-[#FCFAFA] rounded px-4 py-2"
          />
          <svg
            class="absolute right-3 top-3 w-5 h-5 text-[#9D9D9C]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </div>
        <OnceOnOffButton
          text={"추가 +"}
          onClick={() => setIsFilterModalOn(true)}
          className="w-[100px] rounded-full"
        />
      </SearchZone>
      <JcyTable
        columns={vendorColumns}
        columnWidths="grid-cols-6"
        data={vendors}
        renderRow={(row, index) => <VendorRow partner={row} index={index} />}
      />
      <ModalTemplate
        isVisible={isFilterModalOn}
        setIsVisible={setIsFilterModalOn}
        showCancel={false}
      >
        <div className="flex flex-col w-[700px] h-[600px] items-center py-[40px] justify-between">
          <SectionZone className="flex flex-col w-full px-[30px]">
            <label className="flex font-semibold text-black mb-2 w-[100px] h-[40px]">
              <span className="text-once20">거래처 상세</span>
            </label>
            <OneLine className="flex flex-row w-full gap-x-[20px] mt-[20px]">
              <Half className="w-1/2 flex flex-row items-center">
                <label className="flex font-semibold text-black w-[100px] h-[40px] items-center">
                  <span className="text-once16">거래처명</span>
                </label>
                <EditableField className="text-center w-[200px]" />
              </Half>
              <Half className="w-1/2 flex flex-row items-center">
                <label className="flex font-semibold text-black w-[100px] h-[40px] items-center">
                  <span className="text-once16">담당자</span>
                </label>
                <EditableField className="text-center w-[200px]" />
              </Half>
            </OneLine>
            <OneLine className="flex flex-row w-full items-center mt-[30px]">
              <label className="flex font-semibold text-black w-[120px] h-[40px] items-center">
                <span className="text-once16">업종</span>
              </label>
              <div className="flex flex-row gap-x-[14px] w-full items-center">
                <OnceOnOffButton
                  text={"의료용품"}
                  className="h-[30px] w-full rounded-lg"
                />
                <OnceOnOffButton
                  text={"사무용품"}
                  className="h-[30px] w-full rounded-lg"
                />
                <OnceOnOffButton
                  text={"마케팅"}
                  className="h-[30px] w-full rounded-lg"
                />
                <OnceOnOffButton
                  text={"인테리어"}
                  className="h-[30px] w-full rounded-lg"
                />
                <OnceOnOffButton
                  text={"외부간판"}
                  className="h-[30px] w-full rounded-lg"
                />
                <OnceOnOffButton
                  text={"기타"}
                  className="h-[30px] w-full rounded-lg"
                />
              </div>
            </OneLine>
            <OneLine className="flex flex-row w-full items-center mt-[30px]">
              <label className="flex font-semibold text-black w-[120px] bg-red h-[40px] items-center">
                <span className="text-once16">연락처</span>
              </label>
              <PhoneNumberField
                value={phoneN}
                setValue={setPhoneN}
                className="h-[40px] w-full text-center"
                placeholder="031-372-3300"
              />
            </OneLine>
            <OneLine className="flex flex-row w-full items-center mt-[30px]">
              <label className="flex font-semibold text-black w-[120px] bg-red h-[40px] items-center">
                <span className="text-once16">이메일</span>
              </label>
              <EditableField
                className="text-center w-full"
                placeholder="once@once.com"
              />
            </OneLine>
            {/* <OneLine className="flex flex-row w-full items-center mt-[30px]">
              <label className="flex font-semibold text-black w-[120px] bg-red h-[40px] items-center">
                <span className="text-once16">관련문서</span>
              </label>
              <div className="flex flex-row gap-x-[14px] w-full items-center">
                <OnceOnOffButton
                  text={"의료용품"}
                  className="h-[30px] w-full rounded-lg"
                />
                <OnceOnOffButton
                  text={"사무용품"}
                  className="h-[30px] w-full rounded-lg"
                />
              </div>
            </OneLine> */}
          </SectionZone>
          <div className="w-full px-[30px] flex flex-row justify-between gap-x-[20px]">
            <OnceOnOffButton text={"수정"} />
            <OnceOnOffButton text={"삭제"} />
            <OnceOnOffButton text={"확인"} />
          </div>
        </div>
      </ModalTemplate>
    </div>
  );
};

export default VendorZone;
