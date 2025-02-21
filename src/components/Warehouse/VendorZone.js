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
import VendorModal from "./VendorModal";

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
  const [isNewVendorModalOpen, setIsNewVendorModalOpen] = useState(false);

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
        <div className="relative w-[400px]">
          <input
            type="text"
            placeholder="거래처를 입력해주세요."
            className="w-full border border-[#9D9D9C] bg-[#FCFAFA] rounded px-4 py-2"
          />
          <svg
            className="absolute right-3 top-3 w-5 h-5 text-[#9D9D9C]"
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
          onClick={() => setIsNewVendorModalOpen(true)}
          className="w-[100px] rounded-full"
        />
      </SearchZone>
      <JcyTable
        columns={vendorColumns}
        columnWidths="grid-cols-6"
        data={vendors}
        renderRow={(row, index) => <VendorRow partner={row} index={index} />}
      />
      <VendorModal
        isVisible={isNewVendorModalOpen}
        setIsVisible={setIsNewVendorModalOpen}
      />
    </div>
  );
};

export default VendorZone;
