import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import styled from "styled-components";
import NoticeShowModal from "./NoticeShowModal";

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

function NoticeMainCanvas({ onCreatePost }) {
  const [notices, setNotices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const noticeList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toLocaleDateString() || "",
      }));
      setNotices(noticeList);
    });

    return () => unsubscribe();
  }, []);

  // pinned(중요공지) 항목은 상단에 정렬
  const sortedNotices = [...notices].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  // 페이지네이션 로직 (한 페이지당 10개 항목)
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

  const handleNoticeClick = (notice) => {
    setSelectedNotice(notice);
    setShowNoticeModal(true);
  };

  return (
    <div className="w-full flex flex-col h-full bg-white rounded-xl p-4">
      <TitleZone className="w-full mb-[20px] flex flex-row justify-between items-center">
        <span className="text-[34px] font-semibold">공지사항</span>
        <button
          onClick={onCreatePost}
          className="px-4 py-2 bg-[#002D5D] text-white rounded-lg"
        >
          공지사항 작성
        </button>
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
        <BoardRow
          key={notice.id}
          onClick={() => handleNoticeClick(notice)}
          style={{ cursor: "pointer" }}
        >
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

      <NoticeShowModal
        show={showNoticeModal}
        handleClose={() => setShowNoticeModal(false)}
        notice={selectedNotice}
      />
    </div>
  );
}

export default NoticeMainCanvas;
