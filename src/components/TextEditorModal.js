import React, { useRef, useCallback, useState } from "react";
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
} from "react-icons/fa";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const COLORS = [
  { label: "검정", value: "#000000" },
  { label: "빨강", value: "#FF0000" },
  { label: "초록", value: "#008000" },
  { label: "파랑", value: "#0000FF" },
  { label: "노랑", value: "#FFD700" },
  { label: "보라", value: "#800080" },
  { label: "회색", value: "#808080" },
];

const SIZES = [
  { label: "본문", value: "16" },
  { label: "큰 제목", value: "24" },
  { label: "중간 제목", value: "20" },
  { label: "작은 제목", value: "18" },
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

const TextEditorModal = ({
  show,
  handleClose,
  content,
  setContent,
  handleSave,
  classification = "전체",
  noticeType = "regular",
}) => {
  const editorRef = useRef(null);
  const composingRef = useRef(false);
  const [title, setTitle] = useState("");

  const execCommand = useCallback((command, value = null) => {
    if (command === "fontSize") {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement("span");
        span.style.fontSize = `${value}px`;

        if (!range.collapsed) {
          range.surroundContents(span);
        } else {
          const textNode = document.createTextNode("\u200B");
          span.appendChild(textNode);
          range.insertNode(span);
        }

        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else if (
      command === "insertOrderedList" ||
      command === "insertUnorderedList"
    ) {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);

      document.execCommand(command, false, value);

      const listElements = editorRef.current.querySelectorAll("ul, ol");
      listElements.forEach((list) => {
        list.style.paddingLeft = "2em";
        list.style.margin = "0.5em 0";
        list.style.listStylePosition = "outside";
      });
    } else {
      document.execCommand(command, false, value);
    }
    editorRef.current.focus();
  }, []);

  if (!show) return null;

  const handleChange = (e) => {
    if (editorRef.current && !composingRef.current) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const text = editorRef.current.innerHTML;

      // URL 패턴 (http, https로 시작하는 URL)
      const urlPattern = /(?<!["'=])(https?:\/\/[^\s<]+)/g;

      // 현재 커서 위치와 노드 저장
      const cursorNode = range.startContainer;
      const cursorOffset = range.startOffset;

      // URL을 하이퍼링크로 변환
      const convertedText = text.replace(urlPattern, (url) => {
        return `<a href="${url}" target="_blank" style="color: #007bff; text-decoration: none;">${url}</a>`;
      });

      // 내용이 변경되었거나 일반 텍스트 입력인 경우
      if (text !== convertedText) {
        editorRef.current.innerHTML = convertedText;
      }

      // 커서 위치 복원 시도
      requestAnimationFrame(() => {
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
              newRange.setStart(node, Math.min(cursorOffset, node.length));
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
              found = true;
            }
            node = walker.nextNode();
          }

          if (!found) {
            // 원래 노드를 찾지 못한 경우, 마지막 텍스트 노드의 끝으로 이동
            const lastTextNode = editorRef.current.lastChild;
            if (lastTextNode) {
              const newRange = document.createRange();
              newRange.selectNodeContents(lastTextNode);
              newRange.collapse(false);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          }
        } catch (error) {
          console.log("커서 위치 복원 실패", error);
        }

        setContent(editorRef.current.innerHTML);
      });
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

        document.execCommand("insertHTML", false, img.outerHTML);

        requestAnimationFrame(() => {
          setContent(editorRef.current.innerHTML);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB 제한
        alert("파일 크기는 10MB를 초과할 수 없습니다.");
        return;
      }

      try {
        const fileRef = ref(storage, `files/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(fileRef);

        // 파일 링크 생성
        const fileElement = document.createElement("div");
        fileElement.style.cssText = `
          display: flex;
          align-items: center;
          padding: 10px;
          margin: 5px 0;
          background-color: #f8f9fa;
          border-radius: 4px;
          border: 1px solid #dee2e6;
        `;

        const fileIcon = document.createElement("span");
        fileIcon.innerHTML = "📎";
        fileIcon.style.marginRight = "8px";

        const fileLink = document.createElement("a");
        fileLink.href = downloadURL;
        fileLink.textContent = file.name;
        fileLink.target = "_blank";
        fileLink.style.color = "#007bff";
        fileLink.style.textDecoration = "none";

        fileElement.appendChild(fileIcon);
        fileElement.appendChild(fileLink);

        document.execCommand("insertHTML", false, fileElement.outerHTML);

        requestAnimationFrame(() => {
          setContent(editorRef.current.innerHTML);
        });
      } catch (error) {
        console.error("파일 업로드 실패:", error);
        alert("파일 업로드에 실패했습니다.");
      }
    }
  };

  const handleImageClick = (e) => {
    const target = e.target;
    if (target.tagName === "IMG") {
      document
        .querySelectorAll(".resize-handle")
        .forEach((handle) => handle.remove());

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
      target.parentNode.insertBefore(container, target);
      container.appendChild(target);
      container.appendChild(handle);

      let isResizing = false;
      let startX, startY, startWidth, startHeight;

      handle.addEventListener("mousedown", (e) => {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = target.width;
        startHeight = target.height;

        e.preventDefault();
        e.stopPropagation();
      });

      document.addEventListener("mousemove", (e) => {
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
      });

      document.addEventListener("mouseup", () => {
        if (isResizing) {
          isResizing = false;
          requestAnimationFrame(() => {
            setContent(editorRef.current.innerHTML);
          });
        }
      });
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
    }
  };

  const handleSaveContent = async () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    try {
      const noticeData = {
        title: title.trim(),
        content: content,
        classification: classification,
        noticeType: noticeType,
        author: "관리자",
        createdAt: serverTimestamp(),
        pinned: noticeType === "pinned",
      };

      await addDoc(collection(db, "notices"), noticeData);
      setTitle("");
      handleSave();
    } catch (error) {
      console.error("공지사항 저장 실패:", error);
      alert("공지사항 저장에 실패했습니다.");
    }
  };

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-content" style={modalStyle}>
        <div className="modal-header" style={headerStyle}>
          <h2 style={titleStyle}>공지사항 작성</h2>
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
          <div className="editor-toolbar" style={toolbarStyle}>
            <div style={toolGroupStyle}>
              <select
                onChange={(e) => execCommand("fontSize", e.target.value)}
                style={selectStyle}
              >
                {SIZES.map((size) => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>
              <div style={colorGroupStyle}>
                <div style={colorPickerContainerStyle}>
                  <button
                    onClick={(e) => {
                      e.currentTarget.nextElementSibling.style.display =
                        e.currentTarget.nextElementSibling.style.display ===
                        "none"
                          ? "flex"
                          : "none";
                    }}
                    style={buttonStyle}
                    title="글자 색상"
                  >
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        backgroundColor: "#000000",
                        border: "1px solid #ddd",
                        borderRadius: "2px",
                      }}
                    />
                  </button>
                  <div style={colorDropdownStyle}>
                    {COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={(e) => {
                          execCommand("foreColor", color.value);
                          e.currentTarget.parentElement.style.display = "none";
                        }}
                        style={{
                          ...colorOptionStyle,
                          backgroundColor: color.value,
                        }}
                        title={color.label}
                      >
                        <span
                          style={{
                            ...colorLabelStyle,
                            color: ["#000000", "#808080"].includes(color.value)
                              ? "white"
                              : "black",
                          }}
                        >
                          {color.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div style={toolGroupStyle}>
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
              <button
                onClick={() => execCommand("insertOrderedList")}
                style={buttonStyle}
                title="번호 목록"
              >
                <FaListOl />
              </button>
              <button
                onClick={() => execCommand("insertUnorderedList")}
                style={buttonStyle}
                title="글머리 기호"
              >
                <FaListUl />
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
              <input
                type="file"
                id="fileUpload"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
              <button
                onClick={() => document.getElementById("imageUpload").click()}
                style={buttonStyle}
                title="이미지 삽입"
              >
                <FaImage />
              </button>
              <button
                onClick={() => document.getElementById("fileUpload").click()}
                style={buttonStyle}
                title="파일 첨부"
              >
                <FaFileUpload />
              </button>
            </div>
          </div>
          <div style={editorContainerStyle}>
            <div
              ref={editorRef}
              contentEditable
              onInput={handleChange}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              onClick={handleEditorClick}
              onMouseDown={handleImageClick}
              suppressContentEditableWarning
              style={editorStyle}
            />
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
};

const colorDropdownStyle = {
  position: "absolute",
  top: "100%",
  left: 0,
  display: "none",
  flexDirection: "column",
  backgroundColor: "white",
  border: "1px solid #ddd",
  borderRadius: "4px",
  padding: "4px",
  zIndex: 1000,
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  minWidth: "100px",
};

const colorOptionStyle = {
  display: "flex",
  alignItems: "center",
  padding: "6px 8px",
  border: "none",
  cursor: "pointer",
  width: "100%",
  textAlign: "left",
  borderRadius: "2px",
};

const colorLabelStyle = {
  marginLeft: "8px",
  fontSize: "12px",
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

export default TextEditorModal;
