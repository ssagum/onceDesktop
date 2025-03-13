import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import styled from "styled-components";
import JcyTable from "../common/JcyTable";
import RenderTitlePart from "../common/RenderTitlePart";
import NoticeShowModal from "./NoticeShowModal";
import TextEditorModal from "../TextEditorModal";
import { useToast } from "../../contexts/ToastContext";
import { useUserLevel } from "../../utils/UserLevelContext";
import { isLeaderOrHigher } from "../../utils/permissionUtils";

// === styled-components 영역 ===

// 제목 영역
const TitleZone = styled.div`
  /* 필요에 따라 스타일 추가 */
`;

function NoticeMainCanvas({ onCreatePost, onEditPost }) {
  const [notices, setNotices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const { showToast } = useToast();
  const { userLevelData } = useUserLevel();

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

  // 게시글 삭제 함수
  const handleDeleteNotice = async (noticeId) => {
    try {
      const noticeRef = doc(db, "notices", noticeId);
      await deleteDoc(noticeRef);

      // 댓글도 함께 삭제하는 로직 추가 가능
      // 여기서는 생략 (클라우드 함수 또는 배치 작업으로 처리하는 것이 더 적합)

      showToast("게시글이 삭제되었습니다.", "success");
      return true;
    } catch (error) {
      console.error("Error deleting notice:", error);
      showToast("게시글 삭제에 실패했습니다.", "error");
      return false;
    }
  };

  // 게시글 수정 함수
  const handleEditNotice = (notice) => {
    setEditingNotice(notice);
    setShowEditorModal(true);
  };

  // 게시글 저장 함수 (수정)
  const handleSaveEditedNotice = async (postData) => {
    try {
      if (editingNotice && editingNotice.id) {
        // 기존 게시글 업데이트 로직 (Firebase 등)
        const noticeRef = doc(db, "notices", editingNotice.id);

        await updateDoc(noticeRef, {
          ...postData,
          updatedAt: Date.now(),
        });

        showToast("게시글이 수정되었습니다.", "success");
      }
    } catch (error) {
      console.error("Error updating notice:", error);
      showToast("게시글 수정에 실패했습니다.", "error");
    }
  };

  // 게시글 작성 함수 수정 - 로그인 체크 추가
  const handleCreatePost = () => {
    if (!userLevelData) {
      showToast("게시글 작성은 로그인이 필요합니다.", "error");
      return;
    }

    if (onCreatePost) {
      onCreatePost();
    }
  };

  // JcyTable에 필요한 데이터 포맷
  const columns = [
    { label: "번호", key: "number" },
    { label: "분류", key: "classification" },
    { label: "제목", key: "title" },
    { label: "작성자", key: "author" },
    { label: "작성일", key: "createdAt" },
  ];

  // pinned(중요공지) 항목은 상단에 정렬하고, 일반 게시글에는 번호 부여
  const sortedNotices = [...notices]
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      // 공지가 아닌 경우 createdAt 기준으로 내림차순 정렬 (최신글이 위로)
      return b.createdAt - a.createdAt;
    })
    .map((notice, index) => {
      // 공지사항인 경우 "공지"로 표시, 아닌 경우 일련번호 부여
      const number = notice.pinned
        ? "공지"
        : notices.filter((n) => n.pinned).length +
          index -
          notices.filter((n) => n.pinned).length +
          1;

      return {
        ...notice,
        number,
        noticeType: notice.pinned ? "notice" : "regular",
      };
    });

  const renderRow = (row) => (
    <RenderTitlePart row={row} onEditPost={handleEditNotice} />
  );

  const handleNoticeClick = (notice) => {
    setSelectedNotice(notice);
    setShowNoticeModal(true);
  };

  return (
    <div className="w-full flex flex-col h-full bg-white rounded-xl p-4">
      <TitleZone className="w-full mb-[20px] flex flex-row justify-between items-center">
        <span className="text-[34px] font-semibold">게시판</span>
        <button
          onClick={handleCreatePost}
          className="px-4 py-2 bg-[#002D5D] text-white rounded-lg"
        >
          게시글 작성
        </button>
      </TitleZone>
      {/* JcyTable 사용 */}
      <div className="flex flex-col w-full bg-white">
        <JcyTable
          columns={columns}
          columnWidths="grid-cols-[0.8fr,1.2fr,5fr,1fr,1fr]"
          data={sortedNotices}
          renderRow={renderRow}
          itemsPerPage={12}
          rowClassName={(index) =>
            index % 2 === 0 ? "bg-gray-100" : "bg-white"
          }
          emptyRowHeight="50px"
        />
      </div>
      <NoticeShowModal
        show={showNoticeModal}
        handleClose={() => setShowNoticeModal(false)}
        notice={selectedNotice}
        onEdit={handleEditNotice}
        onDelete={handleDeleteNotice}
      />
      {/* 수정용 텍스트 에디터 모달 */}
      <TextEditorModal
        show={showEditorModal}
        handleClose={() => setShowEditorModal(false)}
        content={editingNotice?.content || ""}
        setContent={() => {}}
        handleSave={handleSaveEditedNotice}
        isEditing={true}
        editingPost={editingNotice}
      />
    </div>
  );
}

export default NoticeMainCanvas;
