import React, { useState } from "react";
import { initSeedData } from "../../utils/SeedData";

function DevTools() {
  const [showTools, setShowTools] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

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

  // 개발 환경에서만 렌더링
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed top-0 right-0 m-4 z-50">
      <button
        onClick={() => setShowTools(!showTools)}
        className="bg-gray-800 text-white px-3 py-1 rounded text-sm"
      >
        {showTools ? "개발 도구 닫기" : "개발 도구"}
      </button>

      {showTools && (
        <div className="mt-2 bg-white border rounded shadow-lg p-4 w-[300px]">
          <h3 className="font-bold mb-2">개발 도구</h3>

          <div className="space-y-2">
            <button
              onClick={handleInitTestData}
              disabled={loading}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm w-full disabled:bg-gray-400"
            >
              {loading ? "처리 중..." : "테스트 사용자 데이터 초기화"}
            </button>

            {result && (
              <div className="mt-2 text-sm">
                <p
                  className={result.success ? "text-green-600" : "text-red-600"}
                >
                  {result.success ? "성공!" : "실패: " + result.error}
                </p>
                {result.success && result.users && (
                  <div className="mt-1">
                    <p>추가된 사용자: {result.users.added.length}명</p>
                    <p>
                      이미 존재하는 사용자: {result.users.existing.length}명
                    </p>

                    {result.users.added.length > 0 && (
                      <div className="mt-1 text-xs">
                        <p className="font-bold">테스트 계정:</p>
                        <ul className="list-disc pl-4">
                          <li>
                            이메일: nurse1@example.com / 비밀번호: password123
                          </li>
                          <li>
                            이메일: doctor1@example.com / 비밀번호: password123
                          </li>
                          <li>
                            이메일: admin@example.com / 비밀번호: admin123
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DevTools;
