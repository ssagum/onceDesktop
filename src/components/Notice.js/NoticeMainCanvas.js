import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  where,
  getDocs,
  writeBatch,
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
import LoginPCModal from "../common/LoginPCModal";

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
  const { userLevelData, isLoggedIn } = useUserLevel();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    // 모든 게시글을 먼저 가져옵니다
    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const noticeList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt || "",
      }));

      // 클라이언트 측에서 isHidden이 true인 게시글 필터링
      const filteredNotices = noticeList.filter((notice) => {
        // isHidden이 true면 제외, isHidden이 없거나 false면 포함
        return notice.isHidden !== true;
      });

      setNotices(filteredNotices);
    });

    return () => unsubscribe();
  }, []);

  // 게시글 삭제 함수 (소프트 삭제 방식으로 변경)
  const handleDeleteNotice = async (noticeId) => {
    try {
      console.log("[Delete Handler] 게시글 숨김 처리 시작:", noticeId); // 디버깅용 로그
      const noticeRef = doc(db, "notices", noticeId);

      // 문서가 존재하는지 먼저 확인 (디버깅)
      console.log("[Delete Handler] 문서 참조 생성:", noticeRef.path);

      // 실제 삭제 대신 isHidden 필드를 true로 설정
      await updateDoc(noticeRef, {
        isHidden: true,
        updatedAt: Date.now(),
      });

      console.log(
        "[Delete Handler] 게시글 숨김 처리 완료 - isHidden=true로 설정됨"
      ); // 디버깅용 로그

      // 댓글은 유지 (필요시 댓글도 숨김 처리 가능)

      showToast("게시글이 삭제되었습니다.", "success");
      return true;
    } catch (error) {
      console.error("[Delete Handler] Error hiding notice:", error);
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

        // isHidden 값 보존 (없으면 false로 설정)
        const isHidden = editingNotice.isHidden || false;

        await updateDoc(noticeRef, {
          ...postData,
          isHidden, // 기존 isHidden 값 유지
          updatedAt: Date.now(),
        });

        showToast("게시글이 수정되었습니다.", "success");
      }
    } catch (error) {
      console.error("Error updating notice:", error);
      showToast("게시글 수정에 실패했습니다.", "error");
    }
  };

  // 모든 게시글의 isHidden 필드를 false로 설정하는 마이그레이션 함수 (관리자용)
  const migrateNoticesWithIsHidden = async () => {
    // 관리자 권한이 없으면 함수 실행 중지
    if (!userLevelData || !isLeaderOrHigher(userLevelData)) {
      showToast("관리자 권한이 필요합니다.", "error");
      return;
    }

    try {
      showToast("마이그레이션을 시작합니다...", "info");

      // isHidden 필드가 없는 모든 게시글 쿼리
      const noticesRef = collection(db, "notices");
      const noticesSnapshot = await getDocs(noticesRef);

      // Firestore 일괄 업데이트 준비
      const batch = writeBatch(db);
      let updatedCount = 0;

      noticesSnapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        // isHidden 필드가 없거나 undefined인 경우에만 업데이트
        if (data.isHidden === undefined) {
          const docRef = doc(db, "notices", docSnapshot.id);
          batch.update(docRef, { isHidden: false });
          updatedCount++;
        }
      });

      // 일괄 업데이트 실행
      if (updatedCount > 0) {
        await batch.commit();
        showToast(
          `${updatedCount}개의 게시글이 업데이트되었습니다.`,
          "success"
        );
      } else {
        showToast("업데이트할 게시글이 없습니다.", "info");
      }
    } catch (error) {
      console.error("마이그레이션 오류:", error);
      showToast("마이그레이션에 실패했습니다.", "error");
    }
  };

  // 개발 환경에서만 콘솔에 마이그레이션 함수 노출 (관리자용)
  useEffect(() => {
    if (
      process.env.NODE_ENV === "development" &&
      userLevelData &&
      isLeaderOrHigher(userLevelData)
    ) {
      console.log("관리자 도구: window.migrateNotices 함수가 설정되었습니다.");
      window.migrateNotices = migrateNoticesWithIsHidden;
    }

    return () => {
      delete window.migrateNotices;
    };
  }, [userLevelData]);

  // 로그인 모달 관련 함수들
  const openLoginModal = () => {
    setLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setLoginModalOpen(false);
  };

  const handleLoginSuccess = () => {
    closeLoginModal();
    // 로그인 성공 후 게시글 작성 모달 표시
    if (onCreatePost) {
      onCreatePost();
    }
  };

  const handlePCAllocationSubmit = (pcData) => {
    closeLoginModal();
    showToast("PC 정보가 설정되었습니다.", "success");
  };

  // 게시글 작성 함수 수정 - 로그인 체크 제거
  const handleCreatePost = () => {
    // 로그인 체크 제거 - 바로 게시글 작성 모달 열기
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
    <>
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

      {/* 로그인/PC할당 통합 모달 */}
      <LoginPCModal
        isOpen={loginModalOpen}
        onClose={closeLoginModal}
        onLoginSuccess={handleLoginSuccess}
        onPCAllocationSubmit={handlePCAllocationSubmit}
        defaultDepartment={userLevelData?.department || ""}
      />
    </>
  );
}

export default NoticeMainCanvas;
