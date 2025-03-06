import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import SideBar from "../components/SideBar";
import TextEditorModal from "../components/TextEditorModal";
import HomeMainCanvas from "../components/Home/HomeMainCanvas";
import HomeTimerCanvas from "../components/Home/HomeTimerCanvas";
import NoticeMainCanvas from "../components/Notice.js/NoticeMainCanvas";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useToast } from "../contexts/ToastContext";

const MainZone = styled.div``;

const Notice = () => {
  const { pathname } = useLocation();
  const [showEditor, setShowEditor] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [noticeType, setNoticeType] = useState("regular");
  const [classification, setClassification] = useState("전체");
  const { showToast } = useToast();

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditorContent("");
  };

  const handleSaveContent = async (postData) => {
    try {
      // Firestore에 게시글 저장
      await addDoc(collection(db, "notices"), postData);
      showToast("게시글이 성공적으로 저장되었습니다", "success");
      setShowEditor(false);
      setEditorContent("");
    } catch (error) {
      console.error("게시글 저장 실패:", error);
      showToast("게시글 저장에 실패했습니다", "error");
    }
  };

  return (
    // h-screen 을 넘어가는 페이지는 h-screen 당연히 쓰면 안 됨
    <div className="flex flex-row w-full h-screen bg-onceBackground items-center">
      <div className="w-[250px] h-full flex flex-col justify-center">
        <SideBar />
      </div>
      <MainZone className="w-full flex flex-col justify-evenly items-center bg-onceBackground p-[20px] h-screen">
        <section className="flex flex-col items-center w-full justify-between h-full bg-white rounded-2xl px-[40px] py-[30px]">
          <NoticeMainCanvas onCreatePost={() => setShowEditor(true)} />
          <TextEditorModal
            show={showEditor}
            handleClose={handleCloseEditor}
            content={editorContent}
            setContent={setEditorContent}
            handleSave={handleSaveContent}
            classification={classification}
            noticeType={noticeType}
          />
        </section>
      </MainZone>
    </div>
  );
};

export default Notice;
