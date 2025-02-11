import React, { useState } from "react";
import styled from "styled-components";

// === styled-components 영역 ===

// 제목 영역
const TitleZone = styled.div`
  /* 필요에 따라 스타일 추가 */
`;

// 보드 헤더 (컬럼명)
const BoardHeader = styled.div`
  display: grid;
  grid-template-columns: 60px 100px 100px 1fr 150px 150px;
  padding: 12px;
  border-bottom: 2px solid #ddd;
  font-weight: bold;
  background-color: #f7f7f7;
`;

// 보드 행 (각 공지 항목)
const BoardRow = styled.div`
  display: grid;
  grid-template-columns: 60px 100px 100px 1fr 150px 150px;
  padding: 12px;
  border-bottom: 1px solid #eee;
  align-items: center;
`;

// 페이지네이션 영역 (필요 시 스타일 추가)
const PaginationZone = styled.div`
  /* 추가 스타일 필요 시 여기서 정의 */
`;

function NoticeMainCanvas() {
  // 예시 공지 데이터 (작성자, 작성일, 분류(classification) 추가)
  const notices = [
    {
      id: 1,
      title: "시스템 점검 안내",
      content: "서버 점검이 예정되어 있습니다. (중요공지)",
      category: "all",
      noticeType: "pinned",
      pinned: true,
      author: "관리자",
      createdAt: "2025-02-07",
      classification: "전체",
    },
    {
      id: 2,
      title: "새로운 정책 공지",
      content: "새로운 회사 정책이 도입되었습니다.",
      category: "all",
      noticeType: "regular",
      pinned: false,
      author: "홍길동",
      createdAt: "2025-02-06",
      classification: "전체",
    },
    {
      id: 3,
      title: "부서 회의 일정",
      content: "이번 주 부서 회의 일정을 확인하세요. (기간공지)",
      category: "department",
      noticeType: "period",
      pinned: false,
      author: "김철수",
      createdAt: "2025-02-05",
      classification: "간호",
    },
    {
      id: 4,
      title: "프로젝트 업데이트",
      content: "부서별 프로젝트 업데이트 내용입니다.",
      category: "department",
      noticeType: "regular",
      pinned: false,
      author: "이영희",
      createdAt: "2025-02-04",
      classification: "간호",
    },
    // 페이지네이션 테스트를 위해 추가 항목
    {
      id: 5,
      title: "공지 5",
      content: "내용 5",
      category: "all",
      noticeType: "regular",
      pinned: false,
      author: "홍길동",
      createdAt: "2025-02-03",
      classification: "전체",
    },
    {
      id: 6,
      title: "공지 6",
      content: "내용 6",
      category: "all",
      noticeType: "regular",
      pinned: false,
      author: "김철수",
      createdAt: "2025-02-02",
      classification: "전체",
    },
    {
      id: 7,
      title: "공지 7",
      content: "내용 7",
      category: "department",
      noticeType: "regular",
      pinned: false,
      author: "이영희",
      createdAt: "2025-02-01",
      classification: "간호",
    },
    {
      id: 8,
      title: "공지 8",
      content: "내용 8",
      category: "all",
      noticeType: "regular",
      pinned: false,
      author: "관리자",
      createdAt: "2025-01-31",
      classification: "전체",
    },
    {
      id: 9,
      title: "공지 9",
      content: "내용 9",
      category: "department",
      noticeType: "period",
      pinned: false,
      author: "홍길동",
      createdAt: "2025-01-30",
      classification: "간호",
    },
    {
      id: 10,
      title: "공지 10",
      content: "내용 10",
      category: "all",
      noticeType: "regular",
      pinned: false,
      author: "김철수",
      createdAt: "2025-01-29",
      classification: "전체",
    },
    {
      id: 11,
      title: "공지 11",
      content: "내용 11",
      category: "all",
      noticeType: "regular",
      pinned: false,
      author: "이영희",
      createdAt: "2025-01-28",
      classification: "전체",
    },
  ];

  // pinned(중요공지) 항목은 상단에 정렬
  const sortedNotices = [...notices].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  // 페이지네이션 로직 (한 페이지당 10개 항목)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedNotices.length / itemsPerPage);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const indexOfLastNotice = currentPage * itemsPerPage;
  const indexOfFirstNotice = indexOfLastNotice - itemsPerPage;
  const currentNotices = sortedNotices.slice(
    indexOfFirstNotice,
    indexOfLastNotice
  );

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 헬퍼: 공지 유형 결정 (중요공지, 기간공지, 부서공지, 일반공지)
  const getNoticeTypeLabel = (notice) => {
    if (notice.pinned) return "중요공지";
    if (notice.noticeType === "period") return "기간공지";
    if (notice.category === "department") return "부서공지";
    return "일반공지";
  };

  return (
    <div className="w-full flex flex-col h-full bg-white rounded-xl p-4">
      {/* 제목 영역 */}
      <TitleZone className="w-full mb-[20px] flex flex-row justify-between items-center">
        <span className="text-[34px] font-semibold">공지사항</span>
      </TitleZone>

      {/* 보드 헤더 */}
      <BoardHeader>
        <div>번호</div>
        <div>분류</div>
        <div>유형</div>
        <div>제목</div>
        <div>작성자</div>
        <div>작성일</div>
      </BoardHeader>

      {/* 보드 행: 현재 페이지에 해당하는 공지 항목들 */}
      {currentNotices.map((notice, index) => (
        <BoardRow key={notice.id}>
          {/* 번호: 전체 목록에서의 순번 */}
          <div>{indexOfFirstNotice + index + 1}</div>
          <div>{notice.classification}</div>
          <div>{getNoticeTypeLabel(notice)}</div>
          <div>{notice.title}</div>
          <div>{notice.author}</div>
          <div>{notice.createdAt}</div>
        </BoardRow>
      ))}

      {/* Pagination 영역 */}
      <PaginationZone className="flex justify-center items-center space-x-2 my-[30px]">
        <button
          className="px-3 py-1 border border-gray-300 rounded"
          onClick={handlePrevious}
        >
          &lt;
        </button>
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded ${
              page === currentPage
                ? "bg-[#002D5D] text-white"
                : "border border-gray-300"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          className="px-3 py-1 border border-gray-300 rounded"
          onClick={handleNext}
        >
          &gt;
        </button>
      </PaginationZone>
    </div>
  );
}

export default NoticeMainCanvas;
