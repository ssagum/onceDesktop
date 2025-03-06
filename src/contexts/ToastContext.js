import React, { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/common/Toast";
import styled from "styled-components";

const ToastContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

// Toast 컨텍스트 생성
const ToastContext = createContext({
  showToast: () => {},
});

// Toast provider 생성
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // 새로운 토스트 추가
  const showToast = useCallback(
    (message, type = "success", duration = 3000) => {
      const id = Date.now(); // 유니크 ID 생성

      // 새 토스트 추가
      setToasts((prevToasts) => [...prevToasts, { id, message, type }]);

      // 지정된 시간 후 토스트 제거
      setTimeout(() => {
        setToasts((prevToasts) =>
          prevToasts.filter((toast) => toast.id !== id)
        );
      }, duration);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer>
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

// Toast 사용을 위한 커스텀 훅
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default ToastContext;
