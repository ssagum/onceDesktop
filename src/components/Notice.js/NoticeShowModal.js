import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useUserLevel } from "../../utils/UserLevelContext";

const NoticeShowModal = ({ show, handleClose, notice }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const { userLevelData, checkUserPermission } = useUserLevel();

  useEffect(() => {
    if (!notice?.id) return;

    const q = query(
      collection(db, "comments"),
      where("noticeId", "==", notice.id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toLocaleDateString() || "",
      }));
      setComments(commentList);
    });

    return () => unsubscribe();
  }, [notice?.id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await addDoc(collection(db, "comments"), {
        noticeId: notice.id,
        content: newComment.trim(),
        author: userLevelData.role,
        department: userLevelData.department,
        role: userLevelData.role,
        createdAt: serverTimestamp(),
      });
      setNewComment("");
    } catch (error) {
      console.error("댓글 작성 실패:", error);
      alert("댓글 작성에 실패했습니다.");
    }
  };

  if (!show) return null;

  const formatRelativeTime = (timestamp) => {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return `${seconds}초 전`;
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  const relativeCreatedAt = formatRelativeTime(notice?.createdAt);

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-content" style={modalStyle}>
        <div className="modal-header" style={headerStyle}>
          <h2 style={titleStyle}>공지사항</h2>
          <button onClick={handleClose} style={closeButtonStyle}>
            ×
          </button>
        </div>
        <div className="modal-body" style={bodyStyle}>
          <div style={titleContainerStyle}>
            <h3 style={noticeTitleStyle}>{notice?.title}</h3>
            <div style={metaInfoStyle}>
              <span>분류: {notice?.classification}</span>
              <span>작성자: {notice?.author}</span>
              <span>작성일: {relativeCreatedAt}</span>
            </div>
          </div>
          <div
            style={contentStyle}
            dangerouslySetInnerHTML={{ __html: notice?.content }}
          />

          <div style={commentSectionStyle}>
            <h4 style={commentTitleStyle}>댓글</h4>

            <div style={commentListStyle}>
              {comments.map((comment) => (
                <div key={comment.id} style={commentItemStyle}>
                  <div style={commentHeaderStyle}>
                    <span style={commentAuthorStyle}>{comment.author}</span>
                    <span style={commentDateStyle}>{comment.createdAt}</span>
                  </div>
                  <p style={commentContentStyle}>{comment.content}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} style={commentFormStyle}>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요"
                style={commentInputStyle}
              />
              <button type="submit" style={commentButtonStyle}>
                작성
              </button>
            </form>
          </div>
        </div>
        <div className="modal-footer" style={footerStyle}></div>
      </div>
    </div>
  );
};

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  backgroundColor: "white",
  borderRadius: "8px",
  width: "90%",
  maxWidth: "800px",
  height: "90vh",
  display: "flex",
  flexDirection: "column",
};

const headerStyle = {
  padding: "15px 20px",
  borderBottom: "1px solid #eee",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const titleStyle = {
  margin: 0,
  fontSize: "1.25rem",
  fontWeight: "600",
};

const closeButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "1.5rem",
  cursor: "pointer",
  padding: "0 5px",
};

const bodyStyle = {
  padding: "20px",
  flex: 1,
  overflow: "auto",
};

const titleContainerStyle = {
  marginBottom: "20px",
  paddingBottom: "20px",
  borderBottom: "1px solid #eee",
};

const noticeTitleStyle = {
  fontSize: "1.5rem",
  marginBottom: "10px",
  fontWeight: "600",
};

const metaInfoStyle = {
  display: "flex",
  gap: "20px",
  color: "#666",
  fontSize: "0.9rem",
};

const contentStyle = {
  lineHeight: "1.6",
  fontSize: "1rem",
};

const footerStyle = {
  padding: "15px 20px",
  borderTop: "1px solid #eee",
  display: "flex",
  justifyContent: "flex-end",
};

const commentSectionStyle = {
  marginTop: "30px",
  borderTop: "1px solid #eee",
  padding: "20px 0",
};

const commentTitleStyle = {
  fontSize: "1.2rem",
  fontWeight: "600",
  marginBottom: "15px",
};

const commentListStyle = {
  marginBottom: "20px",
};

const commentItemStyle = {
  padding: "10px 0",
  borderBottom: "1px solid #eee",
};

const commentHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "5px",
};

const commentAuthorStyle = {
  fontWeight: "600",
};

const commentDateStyle = {
  color: "#666",
  fontSize: "0.9rem",
};

const commentContentStyle = {
  margin: 0,
  color: "#333",
};

const commentFormStyle = {
  display: "flex",
  gap: "10px",
};

const commentInputStyle = {
  flex: 1,
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: "4px",
  outline: "none",
};

const commentButtonStyle = {
  padding: "8px 16px",
  backgroundColor: "#002D5D",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

export default NoticeShowModal;
