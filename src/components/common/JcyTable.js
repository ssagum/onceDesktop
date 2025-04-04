import React, { useState } from "react";

export default function JcyTable({
  columns,
  columnWidths = "grid-cols-7",
  data,
  rowClassName,
  renderRow,
  itemsPerPage = 6,
  // warehouse 테이블용 속성 추가
  isWarehouseTable = false,
  // 빈 행 높이 설정 (기본값: 80px)
  emptyRowHeight = "80px",
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);

  // state 정렬 우선순위 설정
  const stateOrder = ["주문 필요", "승인", "주문 완료", "입고 중", "입고 완료"];

  // 정렬 함수
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;

    // state 정렬 커스터마이즈
    if (sortConfig.key === "state") {
      const aIndex = stateOrder.indexOf(a.state);
      const bIndex = stateOrder.indexOf(b.state);
      return sortConfig.direction === "asc" ? aIndex - bIndex : bIndex - aIndex;
    }

    // 일반 정렬
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  // 페이지네이션을 위한 데이터 슬라이싱
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const currentData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 빈 행 계산
  const emptyRowCount = Math.max(0, itemsPerPage - currentData.length);
  const emptyRows = Array(emptyRowCount).fill(null);

  // 데이터가 없을 때 모든 행을 빈 행으로 처리
  const allEmptyRows =
    currentData.length === 0 ? Array(itemsPerPage).fill(null) : emptyRows;

  // 정렬 핸들러
  const handleSort = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 창고 테이블용 스타일
  const warehouseGridStyle = isWarehouseTable
    ? { gridTemplateColumns: "1.3fr 1fr 1.9fr 1fr 0.7fr 0.7fr 1.3fr" }
    : {};

  return (
    <div className="flex flex-col w-full mb-10 border border-gray-300 rounded-md">
      {/* 헤더 */}
      <div
        className={`grid ${columnWidths} gap-4 border-b border-gray-300 h-12 items-center font-semibold bg-gray-50`}
        style={isWarehouseTable ? warehouseGridStyle : {}}
      >
        {columns.map(({ label, key }) => (
          <div
            key={key}
            className={`flex items-center cursor-pointer text-gray-700 ${
              key === "title" ? "justify-start px-[20px]" : "justify-center"
            }`}
            onClick={() => handleSort(key)}
          >
            {label}{" "}
            {sortConfig.key === key
              ? sortConfig.direction === "asc"
                ? "▲"
                : "▼"
              : ""}
          </div>
        ))}
      </div>

      {/* 데이터 */}
      <div className="flex flex-col">
        {currentData.length > 0 ? (
          currentData.map((row, index) => (
            <div
              key={index}
              className={`w-full ${
                rowClassName?.(index) ||
                (index % 2 === 0 ? "bg-gray-100" : "bg-white")
              }`}
            >
              {renderRow ? (
                <div className="items-center">{renderRow(row, index)}</div>
              ) : (
                <div className="text-center">renderRow prop이 필요합니다.</div>
              )}
            </div>
          ))
        ) : (
          // 데이터가 없을 때 첫 번째 행에 메시지 표시
          <div
            style={{ height: emptyRowHeight }}
            className="w-full bg-white flex items-center justify-center"
          >
            <div className="text-center py-4">데이터가 없습니다.</div>
          </div>
        )}

        {/* 빈 행 추가 */}
        {currentData.length > 0
          ? // 데이터가 있을 때 남은 행을 빈 행으로 채움
            emptyRows.map((_, index) => (
              <div
                key={`empty-row-${index}`}
                style={{ height: emptyRowHeight }}
                className={`w-full ${
                  (currentData.length + index) % 2 === 0
                    ? "bg-gray-100"
                    : "bg-white"
                }`}
              />
            ))
          : // 데이터가 없을 때 첫 행 이후의 나머지 빈 행 추가
            allEmptyRows
              .slice(1)
              .map((_, index) => (
                <div
                  key={`empty-row-${index}`}
                  style={{ height: emptyRowHeight }}
                  className={`w-full ${
                    (index + 1) % 2 === 0 ? "bg-white" : "bg-gray-100"
                  }`}
                />
              ))}
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center items-center space-x-2 py-4">
        <button
          className="px-3 py-1 border rounded"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          &lt;
        </button>
        {[...Array(totalPages)].map((_, page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === page + 1
                ? "bg-onceBlue text-white"
                : "border border-gray-300"
            }`}
          >
            {page + 1}
          </button>
        ))}
        <button
          className="px-3 py-1 border rounded"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
