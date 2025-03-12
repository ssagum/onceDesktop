import React, { useState } from "react";
import { useUserLevel } from "../../utils/UserLevelContext";
import SignupModal from "./SignupModal";

function MiniLoginForm({ onLoginSuccess }) {
  const { login, logout, isLoggedIn, currentUser } = useUserLevel();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSignupModal, setShowSignupModal] = useState(false);

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

  // 이미 로그인되어 있는 경우 로그아웃 버튼만 보여줌
  if (isLoggedIn && currentUser) {
    return (
      <div className="w-full flex flex-col items-center px-2 py-3">
        <div className="text-center mb-3">
          <p className="text-sm font-medium">{currentUser.name}님 로그인됨</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded transition-colors"
        >
          로그아웃
        </button>
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
            <div className="flex justify-center">
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
    </>
  );
}

export default MiniLoginForm;
