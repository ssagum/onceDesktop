import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import SideBar from "../components/SideBar";
import TextEditorModal from "../components/TextEditorModal";
import HomeMainCanvas from "../components/Home/HomeMainCanvas";
import HomeTimerCanvas from "../components/Home/HomeTimerCanvas";
import NoticeMainCanvas from "../components/Notice/NoticeMainCanvas";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useToast } from "../contexts/ToastContext";

const MainZone = styled.div``;

const WebViewContainer = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 12px;
`;

const StatusBar = styled.div`
  background-color: #f0f0f0;
  padding: 5px 10px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-size: 14px;
`;

const Parking = () => {
  const { pathname } = useLocation();
  const [showEditor, setShowEditor] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [noticeType, setNoticeType] = useState("regular");
  const [classification, setClassification] = useState("전체");
  const { showToast } = useToast();
  const webviewRef = useRef(null);
  const [loadingStatus, setLoadingStatus] = useState("로딩 중...");

  // webview가 로드되면 실행될 이벤트 핸들러
  useEffect(() => {
    const handleWebViewLoad = () => {
      if (webviewRef.current) {
        console.log("웹뷰가 로드되었습니다.");
        setLoadingStatus("페이지 로드 완료");

        // 디버깅 정보 가져오기
        setTimeout(() => {
          try {
            webviewRef.current
              .executeJavaScript(
                `console.log('WebView 디버깅: 현재 URL', window.location.href);
               document.title;`
              )
              .then((title) => {
                console.log("페이지 제목:", title);
              })
              .catch((err) => {
                console.error("executeJavaScript 오류:", err);
              });
          } catch (error) {
            console.error("executeJavaScript 실행 오류:", error);
          }
        }, 1000);
      }
    };

    const handleLoadStart = () => {
      console.log("웹뷰 로딩 시작");
      setLoadingStatus("로딩 시작...");
    };

    const handleLoadFail = (error) => {
      console.error("웹뷰 로딩 실패:", error);
      setLoadingStatus(`로딩 실패: ${error.errorDescription}`);
    };

    const handleConsoleMessage = (event) => {
      console.log("WebView 콘솔:", event.message);
    };

    const webview = webviewRef.current;
    if (webview) {
      webview.addEventListener("dom-ready", handleWebViewLoad);
      webview.addEventListener("did-start-loading", handleLoadStart);
      webview.addEventListener("did-fail-load", handleLoadFail);
      webview.addEventListener("console-message", handleConsoleMessage);
    }

    return () => {
      if (webview) {
        webview.removeEventListener("dom-ready", handleWebViewLoad);
        webview.removeEventListener("did-start-loading", handleLoadStart);
        webview.removeEventListener("did-fail-load", handleLoadFail);
        webview.removeEventListener("console-message", handleConsoleMessage);
      }
    };
  }, []);

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
          <div className="w-full">
            <h2 className="text-2xl font-bold mb-4 self-start">주차등록</h2>
          </div>
          <WebViewContainer>
            <webview
              ref={webviewRef}
              src="http://members.iparking.co.kr/#!"
              style={{ width: "100%", height: "100%" }}
              allowpopups="true"
              partition="persist:iparking"
              webpreferences="nodeIntegration=no, contextIsolation=yes, javascript=yes, plugins=yes"
            />
          </WebViewContainer>
        </section>
      </MainZone>
    </div>
  );
};

export default Parking;
