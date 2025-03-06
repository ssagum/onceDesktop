import React, { useState } from "react";

export default function JcyTable({
  columns,
  columnWidths = "grid-cols-7",
  data,
  rowClassName,
  renderRow,
  itemsPerPage = 8,
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

  return (
    <div className="flex flex-col w-full mb-10 border border-gray-300 rounded-md">
      {/* 헤더 */}
      <div
        className={`grid ${columnWidths} gap-4 border-b border-gray-300 h-12 items-center font-semibold bg-gray-50`}
      >
        {columns.map(({ label, key }) => (
          <div
            key={key}
            className="text-center text-gray-700 cursor-pointer"
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
      <div className="min-h-[200px]">
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
                <div className={`items-center`}>{renderRow(row, index)}</div>
              ) : (
                <div className="text-center">renderRow prop이 필요합니다.</div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-4">데이터가 없습니다.</div>
        )}
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
                ? "bg-blue-700 text-white"
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
