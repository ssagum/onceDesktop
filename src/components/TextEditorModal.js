import React, { useRef, useCallback, useState, useEffect } from "react";
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaListOl,
  FaListUl,
  FaImage,
  FaFileUpload,
  FaPalette,
  FaTimes,
  FaTextHeight,
} from "react-icons/fa";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import UserChipText from "./common/UserChipText";
import { useUserLevel } from "../utils/UserLevelContext";
import { useToast } from "../contexts/ToastContext";
import { isLeaderOrHigher } from "../utils/permissionUtils";
import LoginPCModal from "./common/LoginPCModal";

const COLORS = [
  { label: "검정", value: "#000000" },
  { label: "빨강", value: "#FF0000" },
  { label: "초록", value: "#008000" },
  { label: "파랑", value: "#0000FF" },
  { label: "노랑", value: "#FFD700" },
  { label: "보라", value: "#800080" },
  { label: "회색", value: "#808080" },
  { label: "분홍", value: "#FF69B4" },
  { label: "주황", value: "#FFA500" },
  { label: "하늘", value: "#00BFFF" },
  { label: "갈색", value: "#A52A2A" },
  { label: "연두", value: "#9ACD32" },
];

const SIZES = [
  { label: "24", value: "24" },
  { label: "22", value: "22" },
  { label: "20", value: "20" },
  { label: "18", value: "18" },
  { label: "16", value: "16" },
  { label: "14", value: "14" },
  { label: "12", value: "12" },
  { label: "10", value: "10" },
  { label: "8", value: "8" },
];

// 허용되는 파일 타입 정의
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const DEPARTMENTS = [
  { label: "전체", value: "전체" },
  { label: "원장", value: "원장" },
  { label: "간호", value: "간호" },
  { label: "물리치료", value: "물리치료" },
  { label: "원무", value: "원무" },
  { label: "영상의학", value: "영상의학" },
  { label: "경영지원", value: "경영지원" },
];

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

const TextEditorModal = ({
  show,
  handleClose,
  content,
  setContent,
  handleSave,
  classification = "전체",
  noticeType = "regular",
  isEditing = false, // 수정 모드인지 여부
  editingPost = null, // 수정 중인 게시글 정보
}) => {
  const { userLevelData, isLoggedIn } = useUserLevel();
  const editorRef = useRef(null);
  const composingRef = useRef(false);
  const [title, setTitle] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState(
    DEPARTMENTS[0].value
  );
  const [isPinned, setIsPinned] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [currentFontSize, setCurrentFontSize] = useState("16px");
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const [departmentUsers, setDepartmentUsers] = useState([]);

  // useToast 훅 사용
  const { showToast } = useToast();

  // 모든 사용자 목록 가져오기
  const getAllUsers = async () => {
    try {
      // users 컬렉션에서 모든 사용자 가져오기
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);

      if (snapshot.empty) {
        // 테스트용 더미 데이터 반환
        return [
          {
            id: "dummy1",
            name: "테스트 사용자 1",
            role: "의사",
            department: "원무과",
          },
          {
            id: "dummy2",
            name: "테스트 사용자 2",
            role: "간호사",
            department: "내과",
          },
          {
            id: "dummy3",
            name: "테스트 사용자 3",
            role: "원장",
            department: "경영팀",
          },
        ];
      }

      const users = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || data.displayName || "사용자",
          role: data.role || "",
          department: data.department || "",
        };
      });

      return users;
    } catch (error) {
      console.error("사용자 목록 가져오기 오류:", error);

      // 오류 발생 시 테스트용 더미 데이터 반환
      return [
        {
          id: "error1",
          name: "에러 테스트 1",
          role: "테스트",
          department: "오류",
        },
        {
          id: "error2",
          name: "에러 테스트 2",
          role: "테스트",
          department: "오류",
        },
      ];
    }
  };

  // 사용자 목록 초기 로드
  useEffect(() => {
    if (show) {
      const loadUsers = async () => {
        try {
          const users = await getAllUsers();
          if (users.length > 0) {
            setDepartmentUsers(users);
          }
        } catch (error) {
          console.error("사용자 목록 로드 실패:", error);
        }
      };

      loadUsers();
    }
  }, [show]);

  // 작성자 드롭다운 토글
  const toggleAuthorDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 사용자 목록 새로 로드
    getAllUsers()
      .then((users) => {
        if (users.length > 0) {
          setDepartmentUsers(users);
        }
        setShowAuthorDropdown(!showAuthorDropdown);
      })
      .catch((error) => {
        console.error("사용자 목록 로드 실패:", error);
        setShowAuthorDropdown(!showAuthorDropdown);
      });
  };

  // 작성자 선택
  const handleSelectAuthor = (e, user) => {
    e.stopPropagation();
    setSelectedAuthor(user);
    setShowAuthorDropdown(false);
  };

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e) => {
      const selector = document.querySelector(".author-selector");
      if (selector && !selector.contains(e.target) && showAuthorDropdown) {
        setShowAuthorDropdown(false);
      }
    };

    if (showAuthorDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showAuthorDropdown]);

  // 초기 제목과 내용 설정
  useEffect(() => {
    if (show) {
      // 수정 모드인 경우 기존 데이터로 초기화
      if (isEditing && editingPost) {
        setTitle(editingPost.title || "");
        setIsPinned(editingPost.pinned || false);
        setSelectedDepartment(
          editingPost.classification || DEPARTMENTS[0].value
        );
        setContent(editingPost.content || "");
        setUploadedFiles(editingPost.attachedFiles || []);
        setUploadedImages(editingPost.attachedImages || []);

        // 작성자 정보가 있는 경우 설정
        if (editingPost.authorId) {
          const authorData = {
            id: editingPost.authorId,
            name: editingPost.author || "",
            department: editingPost.department || "",
            role: "",
          };
          setSelectedAuthor(authorData);
        } else {
          setSelectedAuthor(null);
        }

        // 다음 렌더링 사이클에서 에디터 내용 초기화
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.innerHTML = editingPost.content || "";
          }
        }, 0);
      } else {
        // 새 게시글 작성 모드
        setTitle("");
        setIsPinned(false);
        setSelectedDepartment(DEPARTMENTS[0].value);
        setContent("");
        setUploadedFiles([]);
        setUploadedImages([]);
        setSelectedAuthor(null);

        // 다음 렌더링 사이클에서 에디터 내용 초기화
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.innerHTML = "";
          }
        }, 0);
      }
    }
  }, [show, setContent, isEditing, editingPost]);

  const execCommand = useCallback((command, value = null) => {
    if (command === "fontSize") {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        try {
          // 현재 선택된 내용이 있는 경우
          if (!range.collapsed) {
            const span = document.createElement("span");
            span.style.fontSize = `${value}px`;

            try {
              range.surroundContents(span);
            } catch (e) {
              // surroundContents가 실패할 경우 (여러 노드에 걸쳐 있는 경우)
              // 텍스트 노드를 추출하여 처리
              const fragment = range.extractContents();
              span.appendChild(fragment);
              range.insertNode(span);
            }
          } else {
            // 커서만 있는 경우 현재 위치에 span 추가
            const span = document.createElement("span");
            span.style.fontSize = `${value}px`;

            // 눈에 보이지 않는 문자를 포함하여 span 추가
            const textNode = document.createTextNode("\u200B"); // 너비 없는 공백
            span.appendChild(textNode);
            range.insertNode(span);

            // 커서를 추가한 span 내부로 이동
            const newRange = document.createRange();
            newRange.setStart(textNode, 1);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        } catch (e) {
          console.error("글자 크기 변경 중 오류 발생:", e);
          // 기본 execCommand 방식으로 폴백
          document.execCommand(command, false, value);
        }
      }
    } else if (command === "foreColor") {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        try {
          // 일반적인 execCommand 방식 시도
          document.execCommand(command, false, value);
          setShowColorPicker(false);
        } catch (e) {
          console.error("글자 색상 변경 중 오류 발생:", e);

          // 대체 방법: 선택된 텍스트에 span 요소 추가
          try {
            if (!range.collapsed) {
              try {
                const span = document.createElement("span");
                span.style.color = value;
                range.surroundContents(span);
              } catch (e) {
                // 여러 노드에 걸친 선택인 경우
                const fragment = range.extractContents();
                const span = document.createElement("span");
                span.style.color = value;
                span.appendChild(fragment);
                range.insertNode(span);
              }
            } else {
              // 커서만 있는 경우
              const span = document.createElement("span");
              span.style.color = value;
              const textNode = document.createTextNode("\u200B");
              span.appendChild(textNode);
              range.insertNode(span);

              // 커서 위치 조정
              const newRange = document.createRange();
              newRange.setStart(textNode, 1);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          } catch (spanError) {
            console.error("대체 방식 색상 변경 실패:", spanError);
          }
        }
      }
    } else {
      document.execCommand(command, false, value);
    }

    // 에디터에 포커스 유지
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  // 문서 클릭 이벤트 처리를 위한 useEffect
  useEffect(() => {
    const handleDocumentClick = (e) => {
      // 색상 선택기와 글자 크기 선택기 영역 외부를 클릭하면 닫기
      const colorPicker = document.querySelector(".color-picker-container");
      const fontSizePicker = document.querySelector(
        ".fontsize-picker-container"
      );

      if (colorPicker && !colorPicker.contains(e.target)) {
        setShowColorPicker(false);
      }

      if (fontSizePicker && !fontSizePicker.contains(e.target)) {
        setShowFontSizePicker(false);
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener("mousedown", handleDocumentClick);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

  // 현재 선택된 텍스트의 폰트 크기를 조회하는 함수
  const getCurrentFontSize = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.startContainer;

      // 텍스트 노드인 경우 부모 요소 확인
      if (container.nodeType === Node.TEXT_NODE && container.parentNode) {
        const style = window.getComputedStyle(container.parentNode);
        return style.fontSize;
      }

      // 요소 노드인 경우 직접 확인
      if (container.nodeType === Node.ELEMENT_NODE) {
        const style = window.getComputedStyle(container);
        return style.fontSize;
      }

      // 인접한 부모 요소 확인
      let parentElement = container.parentNode;
      while (parentElement && parentElement !== editorRef.current) {
        const style = window.getComputedStyle(parentElement);
        if (style.fontSize) {
          return style.fontSize;
        }
        parentElement = parentElement.parentNode;
      }
    }

    // 기본값
    return "16px";
  };

  if (!show) return null;

  const handleChange = (e) => {
    if (editorRef.current && !composingRef.current) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const text = editorRef.current.innerHTML;

      // URL 패턴 (http, https로 시작하는 URL)
      const urlPattern = /(https?:\/\/[^\s<]+)/g;

      // 현재 커서 위치와 노드 저장
      const cursorNode = range.startContainer;
      const cursorOffset = range.startOffset;

      // URL을 하이퍼링크로 변환 (태그나 속성 내 URL은 변환하지 않도록 필터링)
      const convertedText = text.replace(urlPattern, (url, index, fullText) => {
        // URL 앞의 문자를 확인하여 따옴표나 등호 뒤에 있으면 변환하지 않음
        const prevChar = index > 0 ? fullText[index - 1] : "";
        if (prevChar === '"' || prevChar === "'" || prevChar === "=") {
          return url;
        }
        return `<a href="${url}" target="_blank" style="color: #007bff; text-decoration: none;">${url}</a>`;
      });

      // 내용이 변경되었거나 일반 텍스트 입력인 경우
      if (text !== convertedText) {
        editorRef.current.innerHTML = convertedText;
      }

      // 커서 위치 복원 시도
      setTimeout(() => {
        try {
          // 에디터 내의 모든 텍스트 노드를 찾아서 적절한 위치를 찾음
          const walker = document.createTreeWalker(
            editorRef.current,
            NodeFilter.SHOW_TEXT,
            null,
            false
          );

          let node = walker.nextNode();
          let found = false;

          while (node && !found) {
            if (node === cursorNode) {
              const newRange = document.createRange();
              const safeOffset = Math.min(cursorOffset, node.length);
              newRange.setStart(node, safeOffset);
              newRange.collapse(true);

              // 선택 영역을 안전하게 설정
              try {
                selection.removeAllRanges();
                selection.addRange(newRange);
                found = true;
              } catch (err) {
                console.log("선택 영역 설정 오류:", err);
              }
            }
            node = walker.nextNode();
          }

          if (!found) {
            // 원래 노드를 찾지 못한 경우, 안전하게 마지막 위치로 이동
            try {
              // 마지막 텍스트 노드 또는 요소 노드 찾기
              const lastChild = editorRef.current.lastChild;

              if (lastChild) {
                // 텍스트 노드인 경우
                if (lastChild.nodeType === Node.TEXT_NODE) {
                  const newRange = document.createRange();
                  newRange.setStart(lastChild, lastChild.length);
                  newRange.collapse(true);
                  selection.removeAllRanges();
                  selection.addRange(newRange);
                }
                // 요소 노드인 경우
                else if (lastChild.nodeType === Node.ELEMENT_NODE) {
                  const newRange = document.createRange();
                  newRange.selectNodeContents(lastChild);
                  newRange.collapse(false);
                  selection.removeAllRanges();
                  selection.addRange(newRange);
                }
              } else {
                // 자식 노드가 없는 경우, 에디터 자체에 포커스
                editorRef.current.focus();
              }
            } catch (err) {
              console.log("커서 복구 실패, 에디터에 포커스만 설정:", err);
              editorRef.current.focus();
            }
          }
        } catch (error) {
          console.log("커서 위치 복원 실패:", error);
          // 실패 시 안전하게 에디터에 포커스만 설정
          editorRef.current.focus();
        }

        // 내용 업데이트
        try {
          if (editorRef.current) {
            setContent(editorRef.current.innerHTML);
          }
        } catch (err) {
          console.error("내용 업데이트 실패:", err);
        }
      }, 0);
    }
  };

  const handleCompositionStart = () => {
    composingRef.current = true;
  };

  const handleCompositionEnd = (e) => {
    composingRef.current = false;
    requestAnimationFrame(() => {
      setContent(editorRef.current.innerHTML);
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        img.style.display = "inline-block";

        // Insert the image into the editor
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(img);
          range.collapse(false); // Move the cursor after the inserted image
          selection.removeAllRanges();
          selection.addRange(range);
        }

        requestAnimationFrame(() => {
          setContent(editorRef.current.innerHTML);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      // 10MB
      showToast("파일 크기는 10MB를 초과할 수 없습니다.", "error");
      return;
    }

    try {
      const fileRef = ref(storage, `files/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);

      const newFile = {
        id: Date.now(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: downloadURL,
      };

      setUploadedFiles((prevFiles) => [...prevFiles, newFile]);
      showToast("파일이 업로드되었습니다.", "success");
    } catch (error) {
      console.error("File upload error:", error);
      showToast("파일 업로드에 실패했습니다.", "error");
    }
  };

  const removeFile = (id) => {
    setUploadedFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
  };

  const handleImageClick = (e) => {
    const target = e.target;
    if (target.tagName === "IMG") {
      // 기존 리사이즈 핸들 제거
      document
        .querySelectorAll(".resize-handle")
        .forEach((handle) => handle.remove());

      try {
        const handle = document.createElement("div");
        handle.className = "resize-handle";
        handle.style.cssText = `
          position: absolute;
          right: -5px;
          bottom: -5px;
          width: 10px;
          height: 10px;
          background-color: #007bff;
          cursor: se-resize;
          z-index: 1000;
        `;

        const container = document.createElement("span");
        container.style.cssText = "position: relative; display: inline-block;";

        // DOM 조작 전에 부모 노드 확인
        if (target.parentNode) {
          target.parentNode.insertBefore(container, target);
          container.appendChild(target);
          container.appendChild(handle);

          let isResizing = false;
          let startX, startY, startWidth, startHeight;

          const startResize = (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = target.width || target.clientWidth;
            startHeight = target.height || target.clientHeight;

            e.preventDefault();
            e.stopPropagation();
          };

          const doResize = (e) => {
            if (!isResizing) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            const newWidth = startWidth + deltaX;
            const newHeight = startHeight + deltaY;

            if (newWidth >= 50 && newHeight >= 50) {
              target.style.width = `${newWidth}px`;
              target.style.height = `${newHeight}px`;
            }

            e.preventDefault();
          };

          const stopResize = () => {
            if (isResizing) {
              isResizing = false;
              // 내용 변경 저장
              setTimeout(() => {
                if (editorRef.current) {
                  setContent(editorRef.current.innerHTML);
                }
              }, 0);
            }
          };

          handle.addEventListener("mousedown", startResize);
          document.addEventListener("mousemove", doResize);
          document.addEventListener("mouseup", stopResize);
        }
      } catch (error) {
        console.error("이미지 리사이즈 핸들 생성 실패:", error);
      }
    }
  };

  const handleEditorClick = (e) => {
    if (e.target.tagName !== "IMG") {
      document.querySelectorAll(".resize-handle").forEach((handle) => {
        const container = handle.parentNode;
        const img = container.querySelector("img");
        if (img) {
          container.parentNode.insertBefore(img, container);
          container.remove();
        }
      });
    } else {
      // If an image is clicked, allow resizing
      handleImageClick(e);
    }
  };

  // 로그인 모달 관련 함수들
  const openLoginModal = () => {
    setLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setLoginModalOpen(false);
  };

  const handleLoginSuccess = () => {
    closeLoginModal();
    // 로그인 성공 후 게시글 저장 시도
    handleSaveContent();
  };

  const handlePCAllocationSubmit = (pcData) => {
    closeLoginModal();
    showToast("PC 정보가 설정되었습니다.", "success");
  };

  const handleSaveContent = async () => {
    if (!title.trim()) {
      showToast("제목을 입력해주세요", "error");
      return;
    }

    if (
      !editorRef.current.textContent.trim() &&
      uploadedFiles.length === 0 &&
      uploadedImages.length === 0
    ) {
      showToast("내용을 입력하거나 파일을 첨부해주세요", "error");
      return;
    }

    if (!selectedAuthor) {
      showToast("작성자를 선택해주세요", "error");
      return;
    }

    try {
      // 기본 게시글 데이터 생성
      const postData = {
        title,
        content: editorRef.current.innerHTML,
        createdAt: Date.now(),
        author: selectedAuthor.name || "익명",
        classification: selectedDepartment,
        pinned: isPinned,
        noticeType: isPinned ? "notice" : "regular",
        attachedFiles: uploadedFiles,
        attachedImages: uploadedImages.map((img) => ({
          id: img.id,
          name: img.name,
          src: img.src,
        })),
        isHidden: false,
        authorId: selectedAuthor.id,
        department: selectedAuthor.department || "",
      };

      if (handleSave) {
        await handleSave(postData);
        handleClose();
      } else {
        console.error("handleSave 함수가 전달되지 않았습니다.");
        showToast("게시글 저장에 실패했습니다", "error");
      }
    } catch (error) {
      console.error("게시글 저장 실패:", error);
      showToast("게시글 저장에 실패했습니다", "error");
    }
  };

  // 파일 크기 형식화
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleKeyDown = (e) => {
    // 특수 키 처리를 위한 간단한 함수
    // (불렛포인트 관련 코드는 제거)
  };

  // 폰트 크기와 색상 버튼 클릭 이벤트를 별도 함수로 분리
  const handleFontSizeClick = (size) => {
    // 현재 선택 영역 저장
    const selection = window.getSelection();
    if (!selection.rangeCount) {
      // 선택된 영역이 없으면 에디터에 포커스만 설정
      editorRef.current.focus();
      return;
    }

    // 에디터 자체에 포커스 설정
    editorRef.current.focus();

    // 크기 변경 명령 실행
    execCommand("fontSize", size);

    // 색상 선택기 닫기
    setShowFontSizePicker(false);
  };

  const handleColorClick = (color) => {
    // 에디터에 포커스 설정
    editorRef.current.focus();

    // 색상 변경 명령 실행
    execCommand("foreColor", color);

    // 색상 선택기 닫기
    setShowColorPicker(false);
  };

  return (
    <>
      <div className="modal-overlay" style={overlayStyle}>
        <div className="modal-content" style={modalStyle}>
          <div className="modal-header" style={headerStyle}>
            <h2 style={titleStyle}>게시글 작성</h2>
            <button onClick={handleClose} style={closeButtonStyle}>
              ×
            </button>
          </div>
          <div className="modal-body" style={bodyStyle}>
            <div style={titleInputContainerStyle}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                style={titleInputStyle}
              />
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <div
                style={{
                  position: "relative",
                  minWidth: "120px",
                  zIndex: 10,
                  marginRight: "12px",
                }}
              >
                <div
                  onClick={toggleAuthorDropdown}
                  style={{
                    position: "relative",
                    minWidth: "120px",
                    border: "1px solid #e6e6e6",
                    borderRadius: "4px",
                    padding: "8px 10px",
                    backgroundColor: "#f5f5f5",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    color: "#333",
                    transition: "all 0.2s",
                    height: "42px",
                  }}
                  className="author-selector"
                >
                  {selectedAuthor ? (
                    <>
                      <span style={{ marginLeft: "5px", flex: 1 }}>
                        {selectedAuthor.name}
                      </span>
                      <span style={{ fontSize: "10px", marginLeft: "4px" }}>
                        ▼
                      </span>
                    </>
                  ) : (
                    <>
                      <span>작성자 선택</span>
                      <span style={{ fontSize: "10px", marginLeft: "4px" }}>
                        ▼
                      </span>
                    </>
                  )}

                  {showAuthorDropdown && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        width: "240px",
                        maxHeight:
                          Math.min(300, departmentUsers.length * 50 + 60) +
                          "px",
                        backgroundColor: "#fff",
                        border: "1px solid #e6e6e6",
                        borderRadius: "4px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                        zIndex: 1000,
                        padding: "10px 0",
                        marginTop: "5px",
                        display: "block",
                        overflow: "visible",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          padding: "0 15px 10px",
                          fontWeight: "600",
                          color: "#333",
                          fontSize: "16px",
                          borderBottom: "1px solid #e6e6e6",
                        }}
                      >
                        작성자 선택 ({departmentUsers.length}명)
                      </div>
                      <div
                        style={{
                          maxHeight: "250px",
                          overflow: "auto",
                        }}
                      >
                        {departmentUsers.length > 0 ? (
                          departmentUsers.map((user) => (
                            <div
                              key={user.id}
                              onClick={(e) => handleSelectAuthor(e, user)}
                              style={{
                                padding: "8px 15px",
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer",
                                transition: "background-color 0.2s",
                                backgroundColor:
                                  selectedAuthor?.id === user.id
                                    ? "#f0f8ff"
                                    : "transparent",
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: "16px",
                                    fontWeight: "500",
                                  }}
                                >
                                  {user.name || "이름없음"}
                                </div>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    color: "#666",
                                  }}
                                >
                                  {user.department ? `${user.department} ` : ""}
                                  {user.role || "사용자"}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div
                            style={{
                              padding: "10px 15px",
                              color: "#999",
                              textAlign: "center",
                            }}
                          >
                            로딩 중...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                style={selectStyle}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>

              <div className="flex items-center ml-4">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={isPinned}
                  onChange={(e) => {
                    setIsPinned(e.target.checked);
                  }}
                  className="h-4 w-4 mr-2"
                />
                <label htmlFor="isPinned" className="text-sm font-medium">
                  공지사항으로 등록 (상단에 고정됩니다)
                </label>
              </div>
            </div>
            <div className="editor-toolbar" style={toolbarStyle}>
              <div style={toolGroupStyle}>
                {/* 글자 크기 선택 - 좌측 끝으로 이동 */}
                <div
                  className="fontsize-picker-container"
                  style={colorPickerContainerStyle}
                >
                  <button
                    onClick={() => {
                      setShowFontSizePicker(!showFontSizePicker);
                      setShowColorPicker(false); // 다른 선택기는 닫기
                    }}
                    style={{
                      ...buttonStyle,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    title="글자 크기"
                  >
                    {/* 더 명확한 아이콘으로 변경 */}
                    <FaTextHeight />
                    <span style={{ fontSize: "12px", marginLeft: "2px" }}>
                      {getCurrentFontSize().replace("px", "")}
                    </span>
                  </button>
                  {showFontSizePicker && (
                    <div style={fontSizeDropdownStyle}>
                      {SIZES.map((size) => (
                        <button
                          key={size.value}
                          onClick={() => handleFontSizeClick(size.value)}
                          style={{
                            padding: "8px 12px",
                            border: "none",
                            borderBottom: "1px solid #eee",
                            backgroundColor: "white",
                            width: "100%",
                            textAlign: "left",
                            fontSize: `${size.value}px`,
                            cursor: "pointer",
                          }}
                        >
                          {size.label}px
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 글자 색상 선택 - 좌측으로 이동 */}
                <div
                  className="color-picker-container"
                  style={colorPickerContainerStyle}
                >
                  <button
                    onClick={() => {
                      setShowColorPicker(!showColorPicker);
                      setShowFontSizePicker(false); // 다른 선택기는 닫기
                    }}
                    style={buttonStyle}
                    title="글자 색상"
                  >
                    <FaPalette />
                  </button>
                  {showColorPicker && (
                    <div style={colorPaletteStyle}>
                      {COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => handleColorClick(color.value)}
                          title={color.label}
                          style={{
                            width: "28px",
                            height: "28px",
                            backgroundColor: color.value,
                            border: "1px solid #ddd",
                            borderRadius: "3px",
                            cursor: "pointer",
                            margin: "2px",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => execCommand("bold")}
                  style={buttonStyle}
                  title="굵게"
                >
                  <FaBold />
                </button>
                <button
                  onClick={() => execCommand("italic")}
                  style={buttonStyle}
                  title="기울임"
                >
                  <FaItalic />
                </button>
                <button
                  onClick={() => execCommand("underline")}
                  style={buttonStyle}
                  title="밑줄"
                >
                  <FaUnderline />
                </button>
                <button
                  onClick={() => execCommand("strikeThrough")}
                  style={buttonStyle}
                  title="취소선"
                >
                  <FaStrikethrough />
                </button>
              </div>
              <div style={toolGroupStyle}>
                <button
                  onClick={() => execCommand("justifyLeft")}
                  style={buttonStyle}
                  title="왼쪽 정렬"
                >
                  <FaAlignLeft />
                </button>
                <button
                  onClick={() => execCommand("justifyCenter")}
                  style={buttonStyle}
                  title="가운데 정렬"
                >
                  <FaAlignCenter />
                </button>
                <button
                  onClick={() => execCommand("justifyRight")}
                  style={buttonStyle}
                  title="오른쪽 정렬"
                >
                  <FaAlignRight />
                </button>
              </div>
              <div style={toolGroupStyle}>
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                />
                <button
                  onClick={() => document.getElementById("imageUpload").click()}
                  style={buttonStyle}
                  title="이미지 삽입"
                >
                  <FaImage />
                </button>
              </div>
            </div>
            <div style={editorContainerStyle}>
              <div
                ref={editorRef}
                contentEditable
                onInput={handleChange}
                onKeyDown={handleKeyDown}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onClick={(e) => {
                  handleEditorClick(e);
                  // 다른 툴바 드롭다운 닫기
                  setShowColorPicker(false);
                  setShowFontSizePicker(false);
                }}
                onMouseDown={handleImageClick}
                suppressContentEditableWarning
                style={editorStyle}
              />
            </div>

            {/* 첨부파일 섹션 - 일반 파일만 표시 */}
            <div style={attachmentSectionStyle}>
              <div style={{ marginBottom: "15px" }}>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    marginBottom: "10px",
                  }}
                >
                  첨부파일
                </h3>
                <div style={fileButtonsContainerStyle}>
                  <div style={fileButtonStyle}>
                    <input
                      type="file"
                      id="fileUpload"
                      style={{ display: "none" }}
                      onChange={handleFileUpload}
                    />
                    <button
                      onClick={() =>
                        document.getElementById("fileUpload").click()
                      }
                      style={fileUploadButtonStyle}
                    >
                      <FaFileUpload style={{ marginRight: "5px" }} /> 파일 첨부
                    </button>
                  </div>
                </div>
              </div>

              {/* 일반 첨부 파일 목록 */}
              {uploadedFiles.length > 0 && (
                <div>
                  <h4
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      marginBottom: "10px",
                    }}
                  >
                    첨부 파일 ({uploadedFiles.length})
                  </h4>
                  <div style={fileListStyle}>
                    {uploadedFiles.map((file) => (
                      <div key={file.id} style={fileItemStyle}>
                        <div style={fileInfoStyle}>
                          <span style={{ fontWeight: "bold" }}>
                            {file.name}
                          </span>
                          <span style={{ color: "#888", fontSize: "12px" }}>
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(file.id)}
                          style={fileRemoveButtonStyle}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer" style={footerStyle}>
            <button onClick={handleClose} style={cancelButtonStyle}>
              취소
            </button>
            <button onClick={handleSaveContent} style={saveButtonStyle}>
              저장
            </button>
          </div>
        </div>
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
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
};

const toolbarStyle = {
  marginBottom: "10px",
  padding: "5px",
  borderBottom: "1px solid #ddd",
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "5px",
};

const buttonStyle = {
  margin: "0 2px",
  padding: "5px 10px",
  border: "1px solid #ddd",
  background: "white",
  borderRadius: "3px",
  cursor: "pointer",
  minWidth: "30px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  ":hover": {
    backgroundColor: "#f0f0f0",
  },
};

const editorContainerStyle = {
  flex: 1,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const editorStyle = {
  flex: 1,
  minHeight: "300px",
  border: "1px solid #ddd",
  padding: "10px",
  borderRadius: "4px",
  overflowY: "auto",
  position: "relative",
  lineHeight: "1.5",
};

const footerStyle = {
  padding: "15px 20px",
  borderTop: "1px solid #eee",
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
};

const baseButtonStyle = {
  padding: "8px 16px",
  borderRadius: "4px",
  cursor: "pointer",
  border: "none",
  fontSize: "14px",
};

const cancelButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: "#e0e0e0",
  color: "#333",
};

const saveButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: "#007bff",
  color: "white",
};

const toolGroupStyle = {
  display: "flex",
  borderRight: "1px solid #ddd",
  padding: "0 5px",
};

const selectStyle = {
  padding: "5px",
  margin: "0 5px",
  border: "1px solid #ddd",
  borderRadius: "3px",
  background: "white",
  cursor: "pointer",
};

const colorGroupStyle = {
  display: "flex",
  gap: "4px",
  padding: "0 5px",
};

const colorPickerContainerStyle = {
  position: "relative",
  display: "inline-block",
};

const fontSizeDropdownStyle = {
  position: "absolute",
  top: "100%",
  left: "0",
  backgroundColor: "white",
  border: "1px solid #ddd",
  borderRadius: "4px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  zIndex: 1000,
  width: "100px",
  maxHeight: "200px",
  overflowY: "auto",
};

const colorPaletteStyle = {
  position: "absolute",
  top: "100%",
  left: "0",
  backgroundColor: "white",
  border: "1px solid #ddd",
  borderRadius: "4px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  zIndex: 1000,
  padding: "10px",
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)", // 한 줄에 4개씩 표시
  gap: "5px",
  width: "160px", // 더 정확한 너비 계산: (28px * 4) + (10px * 2) + 갭
};

const titleInputContainerStyle = {
  marginBottom: "15px",
  width: "100%",
};

const titleInputStyle = {
  width: "100%",
  padding: "10px",
  fontSize: "16px",
  border: "1px solid #ddd",
  borderRadius: "4px",
  outline: "none",
};

// 첨부파일 관련 스타일
const attachmentSectionStyle = {
  marginTop: "20px",
  borderTop: "1px solid #eee",
  paddingTop: "15px",
};

const fileButtonsContainerStyle = {
  display: "flex",
  gap: "10px",
};

const fileButtonStyle = {
  flex: 1,
};

const fileUploadButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  padding: "8px 10px",
  backgroundColor: "#f5f5f5",
  border: "1px dashed #ccc",
  borderRadius: "4px",
  cursor: "pointer",
  transition: "all 0.2s",
  ":hover": {
    backgroundColor: "#e8e8e8",
  },
};

const imagePreviewContainerStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
};

const imagePreviewStyle = {
  position: "relative",
  width: "100px",
  height: "100px",
  borderRadius: "4px",
  overflow: "hidden",
  border: "1px solid #ddd",
};

const imagePreviewImgStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  cursor: "pointer",
};

const imagePreviewOverlayStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  opacity: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  transition: "opacity 0.2s",
  ":hover": {
    opacity: 1,
  },
};

const imageRemoveButtonStyle = {
  position: "absolute",
  top: "5px",
  right: "5px",
  padding: "2px",
  backgroundColor: "rgba(255,255,255,0.8)",
  color: "#ff4d4f",
  border: "none",
  borderRadius: "50%",
  cursor: "pointer",
  fontSize: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const imageInsertButtonStyle = {
  backgroundColor: "rgba(255,255,255,0.8)",
  color: "#333",
  border: "none",
  borderRadius: "4px",
  padding: "4px 8px",
  fontSize: "12px",
  cursor: "pointer",
};

const fileListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const fileItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px",
  backgroundColor: "#f9f9f9",
  borderRadius: "4px",
  border: "1px solid #eee",
};

const fileInfoStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
};

const fileRemoveButtonStyle = {
  backgroundColor: "transparent",
  color: "#ff4d4f",
  border: "none",
  cursor: "pointer",
  fontSize: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default TextEditorModal;
