import React, { useState, useEffect } from "react";
import styled from "styled-components";
import ModalTemplate from "../common/ModalTemplate";
import OnceOnOffButton from "../common/OnceOnOffButton";
import hospitalStocks from "../../datas/stocks";
import StockRow from "./StockRow";
import { FilterButton, FilterChips } from "../common/FilterButton";

const SearchZone = styled.div``;
const BoxZone = styled.div``;
const PaginationZone = styled.div``;
const SectionZone = styled.div``;
const IndexPart = styled.div``;
const RowPart = styled.div``;

const InventoryStatusZone = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(7);
  const [isFilterModalOn, setIsFilterModalOn] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(["기타 소모품"]);

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

  const handleFilterClick = () => {
    setIsFilterModalOn(true);
  };

  const handleResetFilters = () => {
    setSelectedFilters([]); // 모든 필터 초기화
  };

  const handleRemoveFilter = (filter) => {
    setSelectedFilters(selectedFilters.filter((f) => f !== filter));
  };

  return (
    <div className="flex flex-col w-full bg-white h-full">
      <SearchZone className="flex flex-row w-full items-center justify-between">
        <div className="relative w-[400px]">
          <input
            type="text"
            placeholder="품목명을 입력해주세요."
            className="w-full border border-[#9D9D9C] bg-[#FCFAFA] rounded px-4 py-2"
          />
          <svg
            className="absolute right-3 top-3 w-5 h-5 text-[#9D9D9C]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z"
              clipRule="evenodd"
            ></path>
          </svg>
        </div>
        <span className="text-once18 font-semibold">
          ✅ 기존 물품인지 확인 후, 신규 품목이면 상단의 '품목등록'을
          눌러주세요! 😊
        </span>
      </SearchZone>
      <div className="flex flex-row w-full justify-between my-[20px]">
        <div>
          <FilterChips
            selectedFilters={selectedFilters}
            removeFilter={handleRemoveFilter}
          />
        </div>
        <FilterButton
          selectedFilters={selectedFilters}
          onClick={handleFilterClick}
          onReset={handleResetFilters}
        />
      </div>
      <BoxZone
        className={`flex flex-col w-full mb-[40px] border-gray-300 border rounded-md`}
      >
        <IndexPart className="grid grid-cols-7 gap-4 border-b border-gray-300 h-boxH items-center">
          <div className="text-center text-[#9D9D9C]">분류</div>
          <div className="text-center text-[#9D9D9C]">품명</div>
          <div className="text-center text-[#9D9D9C]">부서</div>
          <div className="text-center text-[#9D9D9C]">상태</div>
          <div className="text-center text-[#9D9D9C]">재고</div>
          <div className="text-center text-[#9D9D9C]">단위</div>
          <div className="text-center text-[#9D9D9C]">위치</div>
        </IndexPart>
        {hospitalStocks.map((row, index) => (
          // index prop을 TableRow 컴포넌트에 전달합니다.
          <StockRow
            key={index}
            index={index}
            category={row?.category}
            department={row?.department}
            itemName={row?.itemName}
            state={row?.state}
            quantity={row?.quantity}
            measure={row?.measure}
            position={row?.position}
          />
        ))}
      </BoxZone>
      <PaginationZone className="flex justify-center items-center space-x-2">
        {/* 이전 페이지 버튼 */}
        <button
          className="px-3 py-1 border border-gray-300 rounded"
          onClick={handlePrevious}
        >
          &lt;
        </button>
        {/* 페이지 번호 버튼 */}
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded ${
              page === currentPage
                ? "bg-[#002D5D] text-white" // 현재 페이지인 경우 색상 반전
                : "border border-gray-300" // 나머지 버튼은 기본 스타일
            }`}
          >
            {page}
          </button>
        ))}

        {/* 다음 페이지 버튼 */}
        <button
          className="px-3 py-1 border border-gray-300 rounded"
          onClick={handleNext}
        >
          &gt;
        </button>
      </PaginationZone>
      <ModalTemplate
        isVisible={isFilterModalOn}
        setIsVisible={setIsFilterModalOn}
        showCancel={false}
      >
        <div className="flex flex-col w-[700px] h-[600px] items-center py-[40px] justify-between">
          <SectionZone className="flex flex-col">
            <label className="flex font-semibold text-black mb-2 w-[80px] h-[40px]">
              <span className="text-once20">분류</span>
            </label>
            <div className="flex flex-col">
              <div className="flex flex-row mb-[20px]">
                <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                  사무용 소모품
                </button>
                <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                  사무용품
                </button>
                <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                  의료용 소모품
                </button>
                <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                  의료용품
                </button>
                <button className="w-[110px] border border-gray-400 rounded-md h-[40px]">
                  마케탕용품
                </button>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex flex-row mb-[20px]">
                <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                  마케팅 소모품
                </button>
                <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                  기타용품
                </button>
                <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                  기타 소모품
                </button>
              </div>
            </div>
          </SectionZone>
          <SectionZone className="flex flex-col">
            <label className="flex font-semibold text-black mb-2 w-[80px] h-[40px]">
              <span className="text-once20">부서</span>
            </label>
            <div className="flex flex-col">
              <div className="flex flex-row mb-[20px]">
                <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                  진료
                </button>
                <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                  물리치료
                </button>
                <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                  원장님
                </button>
                <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                  간호
                </button>
                <button className="w-[110px] border border-gray-400 rounded-md h-[40px]">
                  방사선
                </button>
              </div>
            </div>
          </SectionZone>
          <SectionZone className="flex flex-col">
            <label className="flex font-semibold text-black mb-2 w-[80px] h-[40px]">
              <span className="text-once20">상태</span>
            </label>
            <div className="flex flex-col">
              <div className="flex flex-row mb-[20px]">
                <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                  주문 필요
                </button>
                <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                  승인
                </button>
                <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                  주문 완료
                </button>
                <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                  입고 중
                </button>
                <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                  입고 완료
                </button>
              </div>
            </div>
          </SectionZone>
          <div className="w-full px-[30px]">
            <OnceOnOffButton text={"검색"} />
          </div>
        </div>
      </ModalTemplate>
    </div>
  );
};

export default InventoryStatusZone;
