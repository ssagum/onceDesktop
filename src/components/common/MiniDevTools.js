import React, { useState } from "react";
import { initSeedData } from "../../utils/SeedData";

function MiniDevTools() {
  const [showTools, setShowTools] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // 개발 환경에서만 동작하도록 설정
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const handleInitTestData = async () => {
    setLoading(true);
    try {
      const result = await initSeedData();
      setResult(result);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center mt-1 mb-2">
      <button
        onClick={() => setShowTools(!showTools)}
        className="text-xs text-gray-500 hover:text-gray-700"
      >
        {showTools ? "개발도구 닫기" : "개발도구"}
      </button>

      {showTools && (
        <div className="mt-1">
          <button
            onClick={handleInitTestData}
            disabled={loading}
            className="text-xs bg-gray-200 px-2 py-1 rounded disabled:bg-gray-100"
          >
            {loading ? "처리 중..." : "테스트 계정 생성"}
          </button>

          {result && (
            <div className="mt-1 text-[9px]">
              <p className={result.success ? "text-green-600" : "text-red-600"}>
                {result.success ? "성공" : "실패"}
              </p>
              {result.success &&
                result.users &&
                result.users.added.length > 0 && (
                  <p className="text-gray-600">
                    계정 {result.users.added.length}개 생성됨
                  </p>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MiniDevTools;
