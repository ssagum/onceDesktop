import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.js";
import { HashRouter } from "react-router-dom";

console.log("✅ React 시작됨!");

// DOM이 모두 로드된 후 실행합니다.
document.addEventListener("DOMContentLoaded", () => {
  // HTML 내에 id가 "root"인 요소를 찾습니다.
  const container = document.getElementById("root");

  // 만약 container가 없다면, document.body를 fallback으로 사용하거나 오류를 표시할 수 있습니다.
  if (!container) {
    console.error(
      "ERROR: 'root' 컨테이너가 존재하지 않습니다. HTML 파일에 <div id='root'></div>를 추가하세요."
    );
    return;
  }

  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );

  console.log("✅ React 렌더링 완료!");
});
