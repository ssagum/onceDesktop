import React, { useState } from "react";
import { loginUser, getCurrentUser, logoutUser } from "../../utils/UserAuth";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageType, setMessageType] = useState(""); // 'success' 또는 'error'
  const [showLoginForm, setShowLoginForm] = useState(false);

  // 현재 로그인한 사용자 정보
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage("이메일과 비밀번호를 입력해주세요.");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const result = await loginUser(email, password);

      if (result.success) {
        setMessage(`${result.user.name}님 환영합니다!`);
        setMessageType("success");
        setCurrentUser(result.user);
        setShowLoginForm(false);
        setEmail("");
        setPassword("");
      } else {
        setMessage(result.message);
        setMessageType("error");
      }
    } catch (error) {
      setMessage("로그인 중 오류가 발생했습니다.");
      setMessageType("error");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setMessage("로그아웃 되었습니다.");
    setMessageType("success");
    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  const toggleLoginForm = () => {
    setShowLoginForm(!showLoginForm);
    setMessage("");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4">
      <div className="max-w-md mx-auto">
        {currentUser ? (
          // 로그인된 상태
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium">{currentUser.name}</span>님 사용 중
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
              로그아웃
            </button>
          </div>
        ) : (
          // 로그인되지 않은 상태
          <div>
            {showLoginForm ? (
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일"
                    className="flex-1 border rounded px-3 py-2"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호"
                    className="flex-1 border rounded px-3 py-2"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-onceBlue text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                  >
                    {isLoading ? "로그인 중..." : "로그인"}
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={toggleLoginForm}
                    className="text-gray-500 text-sm hover:text-gray-700"
                  >
                    취소
                  </button>
                </div>
                {message && (
                  <div
                    className={`text-sm ${
                      messageType === "success"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {message}
                  </div>
                )}
              </form>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">
                  현재 PC를 사용하려면 로그인하세요
                </span>
                <button
                  onClick={toggleLoginForm}
                  className="bg-onceBlue text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  로그인
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginForm;
