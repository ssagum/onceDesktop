import React, { useState } from "react";
import { useUserLevel } from "../../utils/UserLevelContext";
import SignupModal from "./SignupModal";
import { changePassword } from "../../utils/UserAuth";

function MiniLoginForm({ onLoginSuccess }) {
  const {
    login,
    logout,
    isLoggedIn,
    currentUser,
    resetUserPassword,
    userLevelData,
  } = useUserLevel();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  
  // 비밀번호 변경 관련 상태
  const [showPasswordChangeForm, setShowPasswordChangeForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changeMessage, setChangeMessage] = useState("");
  const [changeMessageType, setChangeMessageType] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await login(email, password, rememberMe);

      if (result.success) {
        setEmail("");
        setPassword("");
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("로그인 중 오류가 발생했습니다");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃 처리
  const handleLogout = () => {
    logout();
    if (onLoginSuccess) onLoginSuccess(); // 로그아웃 후 모달 닫기 등의 처리
  };

  // 회원가입 모달 열기
  const handleSignupClick = () => {
    setShowSignupModal(true);
  };

  // 회원가입 모달 닫기
  const closeSignupModal = () => {
    setShowSignupModal(false);
  };

  // 비밀번호 초기화 모달 열기
  const handleResetClick = () => {
    setShowResetModal(true);
  };

  // 비밀번호 초기화 모달 닫기
  const closeResetModal = () => {
    setShowResetModal(false);
    setResetEmail("");
    setResetSuccess(false);
    setResetMessage("");
  };

  // 비밀번호 초기화 처리
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetMessage("이메일을 입력해주세요");
      return;
    }

    setResetLoading(true);
    setResetMessage("");

    try {
      // 실제 Firebase에 비밀번호 초기화 요청
      const result = await resetUserPassword(resetEmail);

      if (result.success) {
        setResetSuccess(true);
        setResetMessage("");
      } else {
        setResetMessage(result.message);
      }
    } catch (error) {
      console.error("비밀번호 초기화 오류:", error);
      setResetMessage("비밀번호 초기화 중 오류가 발생했습니다");
    } finally {
      setResetLoading(false);
    }
  };
  
  // 비밀번호 변경 폼 토글
  const togglePasswordChangeForm = () => {
    setShowPasswordChangeForm(!showPasswordChangeForm);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setChangeMessage("");
  };
  
  // 비밀번호 변경 처리
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setChangeMessage("모든 필드를 입력해주세요.");
      setChangeMessageType("error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeMessage("새 비밀번호가 일치하지 않습니다.");
      setChangeMessageType("error");
      return;
    }

    setIsChangingPassword(true);
    setChangeMessage("");

    try {
      // 비밀번호 변경 API 호출
      const result = await changePassword(currentUser.email, currentPassword, newPassword);
      
      if (result.success) {
        setChangeMessage("비밀번호가 성공적으로 변경되었습니다.");
        setChangeMessageType("success");
        setShowPasswordChangeForm(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setChangeMessage(result.message || "비밀번호 변경 중 오류가 발생했습니다.");
        setChangeMessageType("error");
      }
    } catch (error) {
      setChangeMessage("비밀번호 변경 중 오류가 발생했습니다.");
      setChangeMessageType("error");
      console.error(error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 이미 로그인되어 있는 경우 로그아웃 버튼만 보여줌
  if (isLoggedIn && currentUser) {
    return (
      <div className="w-full flex flex-col items-center px-2 py-3">
        <div className="text-center mb-3">
          <p className="text-sm font-medium">{currentUser.name}님 로그인됨</p>
        </div>
        
        {showPasswordChangeForm ? (
          <div className="w-full mb-3">
            <form onSubmit={handlePasswordChange} className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">비밀번호 변경</h3>
                <button
                  type="button"
                  onClick={togglePasswordChangeForm}
                  className="text-gray-500 text-xs hover:text-gray-700"
                >
                  취소
                </button>
              </div>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호"
                className="w-full border rounded px-3 py-1 text-sm"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호"
                className="w-full border rounded px-3 py-1 text-sm"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호 확인"
                className="w-full border rounded px-3 py-1 text-sm"
              />
              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full bg-[#002855] text-white py-1 rounded text-sm disabled:bg-gray-400"
              >
                {isChangingPassword ? "변경 중..." : "비밀번호 변경"}
              </button>
              {changeMessage && (
                <div
                  className={`text-xs ${
                    changeMessageType === "success"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {changeMessage}
                </div>
              )}
            </form>
          </div>
        ) : (
          <>
            <button
              onClick={togglePasswordChangeForm}
              className="w-full bg-[#002855] text-white py-2 rounded mb-2 transition-colors"
            >
              비밀번호 변경
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded transition-colors"
            >
              로그아웃
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="w-full px-2">
        <form onSubmit={handleLogin} className="space-y-3">
          <div className="flex flex-col w-full gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full border rounded p-2 text-center bg-gray-50"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="P/W"
              className="w-full border rounded p-2 text-center bg-gray-50"
            />

            {/* 자동 로그인 체크박스 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-600">
                자동 로그인
              </label>
            </div>

            {error && (
              <p className="text-red-500 text-xs text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#002855] text-white py-2 rounded disabled:bg-gray-400"
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={handleResetClick}
                className="text-gray-600 text-xs hover:underline"
              >
                비밀번호 초기화
              </button>
              {/* <button
                type="button"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="text-gray-600 text-xs hover:underline"
              >
                로컬 데이터 초기화
              </button> */}
              <button
                type="button"
                onClick={handleSignupClick}
                className="text-gray-600 text-xs hover:underline"
              >
                회원가입
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 회원가입 모달 */}
      <SignupModal isOpen={showSignupModal} onClose={closeSignupModal} />

      {/* 비밀번호 초기화 모달 */}
      {showResetModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md w-[320px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">비밀번호 초기화</h3>
              <button
                onClick={closeResetModal}
                className="text-gray-500 hover:text-gray-700"
              >
                X
              </button>
            </div>

            {!resetSuccess ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">이메일 주소</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="가입한 이메일 주소 입력"
                    className="w-full border rounded p-2 bg-gray-50"
                    required
                  />
                </div>
                {resetMessage && (
                  <p className="text-red-500 text-sm">{resetMessage}</p>
                )}
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-[#002855] text-white py-2 rounded disabled:bg-gray-400"
                >
                  {resetLoading ? "처리 중..." : "비밀번호 초기화"}
                </button>
              </form>
            ) : (
              <div className="text-center py-4">
                <p className="mb-3">비밀번호가 초기화되었습니다.</p>
                <p className="font-medium mb-5">초기 비밀번호: 1111</p>
                <button
                  onClick={closeResetModal}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
                >
                  닫기
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default MiniLoginForm;
