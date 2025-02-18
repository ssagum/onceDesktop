import React, { useState, useEffect } from "react";
import styled from "styled-components";
import ModalTemplate from "../common/ModalTemplate";
import OnceOnOffButton from "../common/OnceOnOffButton";
import hospitalStocks from "../../datas/stocks";
import StockRow from "./StockRow";
import { FilterButton, FilterChips } from "../common/FilterButton";
import JcyTable from "../common/JcyTable";
import { cancel } from "../../assets";

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
  // 검색어 상태
  const [searchTerm, setSearchTerm] = useState("");

  // 각 필터별 상태 (필요에 따라 기본값을 지정할 수 있음)
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState([]);
  const [selectedDepartmentFilters, setSelectedDepartmentFilters] = useState(
    []
  );
  const [selectedStatusFilters, setSelectedStatusFilters] = useState([]);

  // 기존에 사용하던 selectedFilters 대신 세 필터를 합쳐서 보여줌
  const combinedFilters = [
    ...selectedCategoryFilters,
    ...selectedDepartmentFilters,
    ...selectedStatusFilters,
  ];

  const [sortedData, setSortedData] = useState(hospitalStocks);

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

  // FilterChips 에서 개별 필터 제거 시 처리
  const handleRemoveFilter = (filter) => {
    if (selectedCategoryFilters.includes(filter)) {
      setSelectedCategoryFilters(
        selectedCategoryFilters.filter((f) => f !== filter)
      );
    }
    if (selectedDepartmentFilters.includes(filter)) {
      setSelectedDepartmentFilters(
        selectedDepartmentFilters.filter((f) => f !== filter)
      );
    }
    if (selectedStatusFilters.includes(filter)) {
      setSelectedStatusFilters(
        selectedStatusFilters.filter((f) => f !== filter)
      );
    }
  };

  // 모든 필터 초기화
  const handleResetFilters = () => {
    setSelectedCategoryFilters([]);
    setSelectedDepartmentFilters([]);
    setSelectedStatusFilters([]);
  };

  // 버튼 클릭 시 해당 필터 토글 함수
  const toggleFilter = (filterValue, type) => {
    if (type === "category") {
      if (selectedCategoryFilters.includes(filterValue)) {
        setSelectedCategoryFilters(
          selectedCategoryFilters.filter((f) => f !== filterValue)
        );
      } else {
        setSelectedCategoryFilters([...selectedCategoryFilters, filterValue]);
      }
    } else if (type === "department") {
      if (selectedDepartmentFilters.includes(filterValue)) {
        setSelectedDepartmentFilters(
          selectedDepartmentFilters.filter((f) => f !== filterValue)
        );
      } else {
        setSelectedDepartmentFilters([
          ...selectedDepartmentFilters,
          filterValue,
        ]);
      }
    } else if (type === "state") {
      if (selectedStatusFilters.includes(filterValue)) {
        setSelectedStatusFilters(
          selectedStatusFilters.filter((f) => f !== filterValue)
        );
      } else {
        setSelectedStatusFilters([...selectedStatusFilters, filterValue]);
      }
    }
  };

  // 정렬 함수는 그대로 유지 (필요시 sortedData에 반영 가능)
  const handleSort = (key, direction) => {
    const sorted = [...hospitalStocks].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setSortedData(sorted);
  };

  const columns = [
    { label: "분류", key: "category" },
    { label: "부서", key: "department" },
    { label: "품명", key: "itemName" },
    { label: "상태", key: "state" },
    { label: "재고", key: "quantity" },
    { label: "단위", key: "measure" },
    { label: "위치", key: "position" },
  ];

  useEffect(() => {
    let filtered = hospitalStocks;

    // 검색어 필터: 공백을 제거한 문자열로 비교
    if (searchTerm) {
      const cleanedSearchTerm = searchTerm.replace(/\s+/g, "").toLowerCase();
      filtered = filtered.filter((item) =>
        item.itemName
          .replace(/\s+/g, "")
          .toLowerCase()
          .includes(cleanedSearchTerm)
      );
    }

    // 분류 필터
    if (selectedCategoryFilters.length > 0) {
      filtered = filtered.filter((item) =>
        selectedCategoryFilters.includes(item.category)
      );
    }

    // 부서 필터
    if (selectedDepartmentFilters.length > 0) {
      filtered = filtered.filter((item) =>
        selectedDepartmentFilters.includes(item.department)
      );
    }

    // 상태 필터
    if (selectedStatusFilters.length > 0) {
      filtered = filtered.filter((item) =>
        selectedStatusFilters.includes(item.state)
      );
    }

    setSortedData(filtered);
  }, [
    searchTerm,
    selectedCategoryFilters,
    selectedDepartmentFilters,
    selectedStatusFilters,
  ]);

  return (
    <div className="flex flex-col w-full bg-white h-full">
      <SearchZone className="flex flex-row w-full items-center justify-between">
        <div className="relative w-[400px]">
          <input
            type="text"
            placeholder="품목명을 입력해주세요."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
            selectedFilters={combinedFilters}
            removeFilter={handleRemoveFilter}
          />
        </div>
        <FilterButton
          selectedFilters={combinedFilters}
          onClick={handleFilterClick}
          onReset={handleResetFilters}
        />
      </div>
      <JcyTable
        columns={columns}
        columnWidths="grid-cols-7"
        data={sortedData}
        rowClassName={(index) => (index % 2 === 0 ? "bg-gray-100" : "bg-white")}
        renderRow={(row, index) => (
          <StockRow
            key={index}
            index={index}
            item={row}
            category={row.category}
            itemName={row.itemName}
            department={row.department}
            state={row.state}
            quantity={row.quantity}
            measure={row.measure}
            position={row.position}
          />
        )}
      />
      <ModalTemplate
        isVisible={isFilterModalOn}
        setIsVisible={setIsFilterModalOn}
        showCancel={false}
      >
        <div className="flex flex-col w-[700px] h-[600px] items-center py-[40px] justify-between">
          {/* 분류 선택 */}
          <SectionZone className="flex flex-col">
            <div className="flex flex-row items-center w-full justify-between">
              <label className="flex font-semibold text-black mb-2 w-[80px] h-[40px]">
                <span className="text-once20">분류</span>
              </label>
              <img
                onClick={() => setIsFilterModalOn(false)}
                className="w-[30px] mb-[20px]"
                src={cancel}
                alt="닫기"
                style={{ cursor: "pointer" }}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex flex-row mb-[20px]">
                <button
                  onClick={() => toggleFilter("사무용 소모품", "category")}
                  className={`w-[110px] rounded-md h-[40px] mr-[20px] border ${
                    selectedCategoryFilters.includes("사무용 소모품")
                      ? "bg-blue-200 border-blue-500"
                      : "border-gray-400"
                  }`}
                >
                  사무용 소모품
                </button>
                <button
                  onClick={() => toggleFilter("사무용품", "category")}
                  className={`w-[110px] rounded-md h-[40px] mr-[20px] border ${
                    selectedCategoryFilters.includes("사무용품")
                      ? "bg-blue-200 border-blue-500"
                      : "border-gray-400"
                  }`}
                >
                  사무용품
                </button>
                <button
                  onClick={() => toggleFilter("의료용 소모품", "category")}
                  className={`w-[110px] rounded-md h-[40px] mr-[20px] border ${
                    selectedCategoryFilters.includes("의료용 소모품")
                      ? "bg-blue-200 border-blue-500"
                      : "border-gray-400"
                  }`}
                >
                  의료용 소모품
                </button>
                <button
                  onClick={() => toggleFilter("의료용품", "category")}
                  className={`w-[110px] rounded-md h-[40px] mr-[20px] border ${
                    selectedCategoryFilters.includes("의료용품")
                      ? "bg-blue-200 border-blue-500"
                      : "border-gray-400"
                  }`}
                >
                  의료용품
                </button>
                <button
                  onClick={() => toggleFilter("마케탕용품", "category")}
                  className={`w-[110px] rounded-md h-[40px] border ${
                    selectedCategoryFilters.includes("마케탕용품")
                      ? "bg-blue-200 border-blue-500"
                      : "border-gray-400"
                  }`}
                >
                  마케탕용품
                </button>
              </div>
              <div className="flex flex-row mb-[20px]">
                <button
                  onClick={() => toggleFilter("마케팅 소모품", "category")}
                  className={`w-[110px] rounded-md h-[40px] mr-[20px] border ${
                    selectedCategoryFilters.includes("마케팅 소모품")
                      ? "bg-blue-200 border-blue-500"
                      : "border-gray-400"
                  }`}
                >
                  마케팅 소모품
                </button>
                <button
                  onClick={() => toggleFilter("기타용품", "category")}
                  className={`w-[110px] rounded-md h-[40px] mr-[20px] border ${
                    selectedCategoryFilters.includes("기타용품")
                      ? "bg-blue-200 border-blue-500"
                      : "border-gray-400"
                  }`}
                >
                  기타용품
                </button>
                <button
                  onClick={() => toggleFilter("기타 소모품", "category")}
                  className={`w-[110px] rounded-md h-[40px] border ${
                    selectedCategoryFilters.includes("기타 소모품")
                      ? "bg-blue-200 border-blue-500"
                      : "border-gray-400"
                  }`}
                >
                  기타 소모품
                </button>
              </div>
            </div>
          </SectionZone>

          {/* 부서 선택 */}
          <SectionZone className="flex flex-col">
            <label className="flex font-semibold text-black mb-2 w-[80px] h-[40px]">
              <span className="text-once20">부서</span>
            </label>
            <div className="flex flex-col">
              <div className="flex flex-row mb-[20px]">
                <button
                  onClick={() => toggleFilter("진료", "department")}
                  className={`w-[110px] rounded-md h-[40px] mr-[20px] border ${
                    selectedDepartmentFilters.includes("진료")
                      ? "bg-blue-200 border-blue-500"
                      : "border-gray-400"
                  }`}
                >
                  진료
                </button>
                <button
                  onClick={() => toggleFilter("물리치료", "department")}
                  className={`w-[110px] rounded-md h-[40px] mr-[20px] border ${
                    selectedDepartmentFilters.includes("물리치료")
                      ? "bg-blue-200 border-blue-500"
                      : "border-gray-400"
                  }`}
                >
                  물리치료
                </button>
                <button
                  onClick={() => toggleFilter("원장님", "department")}
                  className={`w-[110px] rounded-md h-[40px] mr-[20px] border ${
                    selectedDepartmentFilters.includes("원장님")
                      ? "bg-blue-200 border-blue-500"
                      : "border-gray-400"
                  }`}
                >
                  원장님
                </button>
                <button
                  onClick={() => toggleFilter("간호", "department")}
                  className={`w-[110px] rounded-md h-[40px] mr-[20px] border ${
                    selectedDepartmentFilters.includes("간호")
                      ? "bg-blue-200 border-blue-500"
                      : "border-gray-400"
                  }`}
                >
                  간호
                </button>
                <button
                  onClick={() => toggleFilter("방사선", "department")}
                  className={`w-[110px] rounded-md h-[40px] border ${
                    selectedDepartmentFilters.includes("방사선")
                      ? "bg-blue-200 border-blue-500"
                      : "border-gray-400"
                  }`}
                >
                  방사선
                </button>
              </div>
            </div>
          </SectionZone>

          {/* 상태 선택 */}
          <SectionZone className="flex flex-col">
            <label className="flex font-semibold text-black mb-2 w-[80px] h-[40px]">
              <span className="text-once20">상태</span>
            </label>
            <div className="flex flex-col">
              <div className="flex flex-row mb-[20px]">
                <button
                  onClick={() => toggleFilter("주문 필요", "state")}
                  className={`w-[110px] rounded-md h-[40px] mr-[20px] border ${
                    selectedStatusFilters.includes("주문 필요")
                      ? "bg-blue-200 border-blue-500"
                      : "border-gray-400"
                  }`}
                >
                  주문 필요
                </button>
                <button
                  onClick={() => toggleFilter("승인", "state")}
                  className={`w-[110px] rounded-md h-[40px] mr-[20px] border ${
                    selectedStatusFilters.includes("승인")
                      ? "bg-blue-200 border-blue-500"
                      : "border-gray-400"
                  }`}
                >
                  승인
                </button>
                <button
                  onClick={() => toggleFilter("주문 완료", "state")}
                  className={`w-[110px] rounded-md h-[40px] mr-[20px] border ${
                    selectedStatusFilters.includes("주문 완료")
                      ? "bg-blue-200 border-blue-500"
                      : "border-gray-400"
                  }`}
                >
                  주문 완료
                </button>
                <button
                  onClick={() => toggleFilter("입고 중", "state")}
                  className={`w-[110px] rounded-md h-[40px] mr-[20px] border ${
                    selectedStatusFilters.includes("입고 중")
                      ? "bg-blue-200 border-blue-500"
                      : "border-gray-400"
                  }`}
                >
                  입고 중
                </button>
                <button
                  onClick={() => toggleFilter("입고 완료", "state")}
                  className={`w-[110px] rounded-md h-[40px] border ${
                    selectedStatusFilters.includes("입고 완료")
                      ? "bg-blue-200 border-blue-500"
                      : "border-gray-400"
                  }`}
                >
                  입고 완료
                </button>
              </div>
            </div>
          </SectionZone>
        </div>
      </ModalTemplate>
    </div>
  );
};

export default InventoryStatusZone;
