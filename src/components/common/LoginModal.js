import React from "react";
import MiniLoginForm from "./MiniLoginForm";

/**
 * 로그인 모달 컴포넌트
 * 다양한 컴포넌트에서 재사용할 수 있는 로그인 모달
 */
const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-md w-[320px]">
        <div className="flex justify-between items-center mb-2">
          <div></div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            X
          </button>
        </div>
        <h2 className="text-xl font-semibold mb-4">로그인</h2>
        <MiniLoginForm onLoginSuccess={onLoginSuccess} />
      </div>
    </div>
  );
};

export default LoginModal;
