import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import styled from "styled-components";
import JcyTable from "../common/JcyTable";
import RenderTitlePart from "../common/RenderTitlePart";
import NoticeShowModal from "./NoticeShowModal";

// === styled-components 영역 ===

// 제목 영역
const TitleZone = styled.div`
  /* 필요에 따라 스타일 추가 */
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
        createdAt: doc.data().createdAt || "",
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

  // JcyTable에 필요한 데이터 포맷
  const columns = [
    { label: "분류", key: "classification" },
    { label: "제목", key: "title" },
    { label: "작성자", key: "author" },
    { label: "작성일", key: "createdAt" },
  ];

  const renderRow = (row) => <RenderTitlePart row={row} />;

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

      {/* JcyTable 사용 */}
      <JcyTable
        columns={columns}
        columnWidths="grid-cols-[1fr,6fr,1fr,1fr]"
        data={sortedNotices}
        renderRow={renderRow}
        rowClassName={(index) => (index % 2 === 0 ? "bg-gray-100" : "bg-white")}
      />

      <NoticeShowModal
        show={showNoticeModal}
        handleClose={() => setShowNoticeModal(false)}
        notice={selectedNotice}
      />
    </div>
  );
}

export default NoticeMainCanvas;
