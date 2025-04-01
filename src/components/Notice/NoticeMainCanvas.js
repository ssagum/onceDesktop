import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";

const NoticeMainCanvas = () => {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [notices, setNotices] = useState([]);
  const [userLevelData, setUserLevelData] = useState(null);

  // 부서명 비교 함수 (팀 명칭 유무에 상관없이 비교)
  const isDepartmentMatch = (dept1, dept2) => {
    // null/undefined/빈 문자열 체크
    if (!dept1 || !dept2) return false;

    // 문자열로 변환
    const dept1Str = String(dept1).trim();
    const dept2Str = String(dept2).trim();

    // 정확히 일치하는 경우
    if (dept1Str === dept2Str) return true;

    // '팀' 명칭 제거 후 비교
    const dept1Base = dept1Str.endsWith("팀")
      ? dept1Str.slice(0, -1)
      : dept1Str;
    const dept2Base = dept2Str.endsWith("팀")
      ? dept2Str.slice(0, -1)
      : dept2Str;

    return dept1Base === dept2Base;
  };

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

  // 게시글 작성 함수 - 로그인 체크 제거
  const handleCreatePost = () => {
    // 바로 게시글 작성 모달 열기
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

  // 대표원장이 아닌 경우 부서 필터링 적용
  const isOwner = userLevelData?.role === "대표원장";

  // 필터링된 공지사항
  const filteredNotices = notices.filter((notice) => {
    // 대표원장은 모든 공지 확인 가능
    if (isOwner) return true;

    // 부서 정보가 없는 공지는 전체 공개 공지로 간주
    if (!notice.department) return true;

    // 사용자 부서와 공지 부서 일치 여부 확인
    return isDepartmentMatch(userLevelData?.department, notice.department);
  });

  // pinned(중요공지) 항목은 상단에 정렬하고, 일반 게시글에는 번호 부여
  const sortedNotices = [...filteredNotices]
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
        : filteredNotices.filter((n) => n.pinned).length +
          index -
          filteredNotices.filter((n) => n.pinned).length +
          1;

      return {
        ...notice,
        number,
        noticeType: notice.pinned ? "notice" : "regular",
      };
    });

  return <div>{/* Render your component content here */}</div>;
};

export default NoticeMainCanvas;
