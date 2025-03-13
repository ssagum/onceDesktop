import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useUserLevel } from "../../utils/UserLevelContext";
import { useToast } from "../../contexts/ToastContext";
import {
  FaPencilAlt,
  FaTrash,
  FaDownload,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaFile,
  FaSpinner,
} from "react-icons/fa";
import {
  isHospitalOwner,
  isSameUser,
  isLeaderOrHigher,
} from "../../utils/permissionUtils";

// window.require 대신 contextBridge로 노출된 API 사용
const electronAPI = window.electron;

const NoticeShowModal = ({ show, handleClose, notice, onEdit, onDelete }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const { userLevelData, checkUserPermission } = useUserLevel();
  const { showToast } = useToast();
  const [downloadingFiles, setDownloadingFiles] = useState({});

  // 권한 확인 로직 수정
  const canEdit =
    userLevelData &&
    notice &&
    (isSameUser(userLevelData, notice.authorId) ||
      (notice.author === userLevelData.name && !notice.authorId)); // authorId가 없고 author가 일치하는 경우도 허용

  const canDelete =
    userLevelData &&
    notice &&
    (isSameUser(userLevelData, notice.authorId) ||
      (notice.author === userLevelData.name && !notice.authorId) || // authorId가 없고 author가 일치하는 경우도 허용
      isHospitalOwner(userLevelData));

  const canComment = !!userLevelData; // 로그인한 사용자만 댓글 작성 가능

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

    // 다운로드 이벤트 리스너 등록
    let removeProgressListener = null;
    let removeCompleteListener = null;

    if (electronAPI) {
      // 다운로드 진행률 리스너
      removeProgressListener = electronAPI.onDownloadProgress((progress) => {
        console.log("다운로드 진행률:", progress);
      });

      // 다운로드 완료 리스너
      removeCompleteListener = electronAPI.onDownloadComplete((result) => {
        const { success, filePath, error } = result;
        if (success) {
          showToast(
            `파일이 성공적으로 다운로드되었습니다: ${filePath}`,
            "success"
          );
          // 다운로드 상태 업데이트
          setDownloadingFiles((prev) => {
            const newState = { ...prev };
            // filePath의 파일명만 추출
            const fileName = filePath.split("/").pop().split("\\").pop();
            delete newState[fileName];
            return newState;
          });
        } else {
          // 취소된 경우 별도 메시지 표시하지 않음
          if (error !== "canceled") {
            showToast(`파일 다운로드 실패: ${error}`, "error");
          }
          setDownloadingFiles((prev) => {
            const newState = { ...prev };
            // 모든 다운로드 상태 초기화
            Object.keys(newState).forEach((key) => {
              delete newState[key];
            });
            return newState;
          });
        }
      });
    }

    return () => {
      unsubscribe();
      if (removeProgressListener) removeProgressListener();
      if (removeCompleteListener) removeCompleteListener();
    };
  }, [notice?.id, showToast]);

  // Electron 환경에서 파일 다운로드 처리
  const handleFileDownload = (fileUrl, fileName) => {
    if (electronAPI) {
      // 다운로드 상태 설정
      setDownloadingFiles((prev) => ({ ...prev, [fileName]: true }));

      // 파일명 정규화 및 인코딩
      const normalizedFileName = fileName.normalize("NFC");
      const encodedFileName = encodeURIComponent(normalizedFileName);

      // Electron 환경인 경우 contextBridge API를 통해 다운로드 요청
      electronAPI.downloadFile(fileUrl, encodedFileName);
      showToast("파일 다운로드가 시작되었습니다.", "info");
    } else {
      // 웹 환경인 경우 기존 방식으로 다운로드
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!canComment) {
      showToast("댓글을 작성하려면 로그인이 필요합니다.", "error");
      return;
    }

    if (newComment.trim() === "") {
      showToast("댓글 내용을 입력해주세요.", "error");
      return;
    }

    try {
      await addDoc(collection(db, "comments"), {
        noticeId: notice.id,
        content: newComment.trim(),
        author: userLevelData.name || userLevelData.role,
        department: userLevelData.department,
        role: userLevelData.role,
        createdAt: serverTimestamp(),
      });
      setNewComment("");
      showToast("댓글이 작성되었습니다.", "success");
    } catch (error) {
      console.error("Error adding comment:", error);
      showToast("댓글 작성에 실패했습니다.", "error");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;

    try {
      await deleteDoc(doc(db, "comments", commentId));
      showToast("댓글이 삭제되었습니다.", "success");
    } catch (error) {
      console.error("Error deleting comment:", error);
      showToast("댓글 삭제에 실패했습니다.", "error");
    }
  };

  const handleEdit = () => {
    if (!canEdit) {
      showToast("게시글 수정 권한이 없습니다.", "error");
      return;
    }

    if (onEdit && notice) {
      onEdit(notice);
      handleClose();
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      showToast("게시글 삭제 권한이 없습니다.", "error");
      return;
    }

    if (showConfirmDelete) {
      try {
        if (onDelete && notice) {
          await onDelete(notice.id);
          showToast("게시글이 삭제되었습니다.", "success");
          handleClose();
        }
      } catch (error) {
        console.error("Error deleting notice:", error);
        showToast("게시글 삭제에 실패했습니다.", "error");
      }
      setShowConfirmDelete(false);
    } else {
      setShowConfirmDelete(true);
    }
  };

  // 파일 아이콘 결정 함수
  const getFileIcon = (fileType) => {
    if (!fileType) return <FaFile />;

    if (fileType.includes("pdf")) return <FaFilePdf />;
    if (fileType.includes("word") || fileType.includes("document"))
      return <FaFileWord />;
    if (fileType.includes("excel") || fileType.includes("sheet"))
      return <FaFileExcel />;
    if (fileType.includes("image")) return <FaFileImage />;

    return <FaFile />;
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

  const relativeCreatedAt = notice?.createdAt
    ? formatRelativeTime(notice.createdAt)
    : "";

  // 첨부파일이 있는지 확인
  const hasAttachments =
    notice?.attachedFiles?.length > 0 || notice?.attachedImages?.length > 0;

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-content" style={modalStyle}>
        <div className="modal-header" style={headerStyle}>
          <h2 style={titleStyle}>공지사항</h2>
          <div style={headerButtonsStyle}>
            {canEdit && (
              <button
                onClick={handleEdit}
                style={editButtonStyle}
                title="게시글 수정"
              >
                <FaPencilAlt /> 수정
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                style={
                  showConfirmDelete
                    ? confirmDeleteButtonStyle
                    : deleteButtonStyle
                }
                title="게시글 삭제"
              >
                <FaTrash /> {showConfirmDelete ? "삭제 확인" : "삭제"}
              </button>
            )}
            <button onClick={handleClose} style={closeButtonStyle}>
              ×
            </button>
          </div>
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

          {/* 게시글 내용 */}
          <div
            style={contentStyle}
            dangerouslySetInnerHTML={{ __html: notice?.content }}
          />

          {/* 첨부파일 섹션 */}
          {hasAttachments && (
            <div style={attachmentSectionStyle}>
              <h4 style={attachmentTitleStyle}>첨부파일</h4>

              {/* 이미지 첨부파일 */}
              {notice?.attachedImages?.length > 0 && (
                <div style={imagesContainerStyle}>
                  {notice.attachedImages.map((image, index) => (
                    <div key={`img-${index}`} style={imagePreviewStyle}>
                      <img
                        src={image.src}
                        alt={image.name || `첨부 이미지 ${index + 1}`}
                        style={imagePreviewImgStyle}
                      />
                      <button
                        onClick={() =>
                          handleFileDownload(
                            image.src,
                            image.name || `image_${index + 1}.jpg`
                          )
                        }
                        style={imageDownloadButtonStyle}
                        title="이미지 다운로드"
                        disabled={
                          downloadingFiles[
                            image.name || `image_${index + 1}.jpg`
                          ]
                        }
                      >
                        {downloadingFiles[
                          image.name || `image_${index + 1}.jpg`
                        ] ? (
                          <FaSpinner
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                        ) : (
                          <FaDownload />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 일반 첨부파일 */}
              {notice?.attachedFiles?.length > 0 && (
                <div style={filesListStyle}>
                  {notice.attachedFiles.map((file, index) => (
                    <div key={`file-${index}`} style={fileItemStyle}>
                      <div style={fileIconStyle}>{getFileIcon(file.type)}</div>
                      <div style={fileInfoStyle}>
                        <span style={fileNameStyle}>{file.name}</span>
                        {file.size && (
                          <span style={fileSizeStyle}>
                            {formatFileSize(file.size)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleFileDownload(file.url, file.name)}
                        style={fileDownloadButtonStyle}
                        title="파일 다운로드"
                        disabled={downloadingFiles[file.name]}
                      >
                        {downloadingFiles[file.name] ? (
                          <FaSpinner
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                        ) : (
                          <FaDownload />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 댓글 섹션 */}
          <div style={commentSectionStyle}>
            <h4 style={commentTitleStyle}>댓글</h4>

            <div style={commentListStyle}>
              {comments.length === 0 ? (
                <div style={emptyCommentStyle}>
                  첫 번째 댓글을 작성해보세요.
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} style={commentItemStyle}>
                    <div style={commentHeaderStyle}>
                      <span style={commentAuthorStyle}>{comment.author}</span>
                      <div style={commentActionsStyle}>
                        <span style={commentDateStyle}>
                          {comment.createdAt}
                        </span>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          style={deleteCommentButtonStyle}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    <p style={commentContentStyle}>{comment.content}</p>
                  </div>
                ))
              )}
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

const headerButtonsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const closeButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "1.5rem",
  cursor: "pointer",
  padding: "0 5px",
};

const editButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  padding: "6px 12px",
  backgroundColor: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "0.85rem",
  cursor: "pointer",
};

const deleteButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  padding: "6px 12px",
  backgroundColor: "#f44336",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "0.85rem",
  cursor: "pointer",
};

const confirmDeleteButtonStyle = {
  ...deleteButtonStyle,
  backgroundColor: "#d32f2f",
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
  marginBottom: "30px",
};

// 첨부파일 관련 스타일
const attachmentSectionStyle = {
  marginBottom: "30px",
  paddingTop: "20px",
  paddingBottom: "20px",
  borderTop: "1px solid #eee",
  borderBottom: "1px solid #eee",
};

const attachmentTitleStyle = {
  fontSize: "1.1rem",
  fontWeight: "600",
  marginBottom: "15px",
};

const imagesContainerStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "15px",
  marginBottom: "20px",
};

const imagePreviewStyle = {
  position: "relative",
  width: "120px",
  height: "120px",
  borderRadius: "4px",
  overflow: "hidden",
  border: "1px solid #ddd",
};

const imagePreviewImgStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const imageDownloadButtonStyle = {
  position: "absolute",
  bottom: "5px",
  right: "5px",
  backgroundColor: "rgba(0,0,0,0.6)",
  color: "white",
  width: "30px",
  height: "30px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  textDecoration: "none",
};

const filesListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const fileItemStyle = {
  display: "flex",
  alignItems: "center",
  padding: "10px 15px",
  backgroundColor: "#f8f9fa",
  borderRadius: "4px",
  border: "1px solid #eee",
};

const fileIconStyle = {
  marginRight: "15px",
  fontSize: "1.2rem",
  color: "#666",
};

const fileInfoStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
};

const fileNameStyle = {
  fontWeight: "500",
  marginBottom: "2px",
};

const fileSizeStyle = {
  fontSize: "0.85rem",
  color: "#777",
};

const fileDownloadButtonStyle = {
  marginLeft: "10px",
  color: "#0066cc",
  cursor: "pointer",
  fontSize: "1.1rem",
  textDecoration: "none",
};

// 댓글 관련 스타일
const commentSectionStyle = {
  marginTop: "10px",
};

const commentTitleStyle = {
  fontSize: "1.1rem",
  fontWeight: "600",
  marginBottom: "15px",
};

const commentListStyle = {
  marginBottom: "20px",
};

const emptyCommentStyle = {
  padding: "15px 10px",
  backgroundColor: "#f8f9fa",
  borderRadius: "4px",
  textAlign: "center",
  color: "#777",
  fontSize: "0.9rem",
};

const commentItemStyle = {
  padding: "15px",
  borderBottom: "1px solid #eee",
  backgroundColor: "#f9f9f9",
  marginBottom: "10px",
  borderRadius: "4px",
};

const commentHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "10px",
};

const commentAuthorStyle = {
  fontWeight: "600",
  color: "#333",
};

const commentActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const commentDateStyle = {
  color: "#666",
  fontSize: "0.85rem",
};

const deleteCommentButtonStyle = {
  background: "none",
  border: "none",
  color: "#f44336",
  fontSize: "0.85rem",
  cursor: "pointer",
  padding: "0",
};

const commentContentStyle = {
  margin: 0,
  color: "#333",
  lineHeight: "1.5",
};

const commentFormStyle = {
  display: "flex",
  gap: "10px",
  marginTop: "20px",
};

const commentInputStyle = {
  flex: 1,
  padding: "12px 15px",
  border: "1px solid #ddd",
  borderRadius: "4px",
  outline: "none",
  fontSize: "0.95rem",
};

const commentButtonStyle = {
  padding: "8px 16px",
  backgroundColor: "#002D5D",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "500",
};

// 파일 크기 형식화 함수
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

// 스핀 애니메이션 정의
const spinAnimation = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// 스타일 요소 생성 및 문서에 추가
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = spinAnimation;
  document.head.appendChild(styleElement);
}

export default NoticeShowModal;
