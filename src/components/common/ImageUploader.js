import React, { useState, useEffect } from "react";

const ImageUploader = ({ value, onChange }) => {
  const [preview, setPreview] = useState(value || null); // 이미지 상태
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태

  // value prop 변경 추적
  useEffect(() => {
    console.log("ImageUploader value changed:", value);
    if (value instanceof File) {
      // value가 File 객체인 경우 URL 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(value);
    } else {
      // value가 URL이나 data URL인 경우
      setPreview(value);
    }
  }, [value]);

  // 파일 업로드 핸들러
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log("File selected:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = reader.result;
      console.log("FileReader loaded image successfully");
      console.log("Image data type:", typeof imageData);
      setPreview(imageData); // 미리보기용 data URL 설정
      onChange(file); // 부모 컴포넌트에는 File 객체 전달
    };
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
    };
    reader.readAsDataURL(file);
  };

  // 이미지 로드 확인을 위한 useEffect
  useEffect(() => {
    if (preview) {
      console.log("Preview updated:", {
        type: typeof preview,
        valueStart:
          typeof preview === "string"
            ? preview.substring(0, 30)
            : "not a string",
        isDataURL:
          typeof preview === "string" && preview.startsWith("data:image/"),
      });
    }
  }, [preview]);

  // 삭제 핸들러
  const handleDelete = () => {
    console.log("Image deleted");
    setPreview(null);
    onChange(null); // 부모 컴포넌트에 null 전달
    setIsModalOpen(false);
  };

  // preview 값의 타입을 확인하고 적절히 로깅
  console.log("Current preview:", {
    type: typeof preview,
    value: preview,
    isString: typeof preview === "string",
  });

  return (
    <div>
      {/* 이미지가 없을 때: 클릭하면 파일 업로드 */}
      {!preview ? (
        <label className="flex flex-col items-center justify-center h-[42px] w-[120px] cursor-pointer border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-sm text-gray-500">사진 추가</span>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      ) : (
        // 이미지가 있을 때: 클릭하면 모달 오픈
        <div
          onClick={() => setIsModalOpen(true)}
          className="relative h-[42px] w-[120px] border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden group">
          <img
            src={preview}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              console.error("이미지 로드 오류:", e);
              // 이미지 로드 실패 시 기본 이미지나 처리 방법 추가
              e.target.src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='none' d='M0 0h24v24H0z'/%3E%3Cpath fill='%23ccc' d='M5 11.1l2-2 5.5 5.5 3.5-3.5 3 3V5H5v6.1zM4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm11.5 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z'/%3E%3C/svg%3E";
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
            <span className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">
              사진 보기
            </span>
          </div>
        </div>
      )}

      {/* 모달 개선 */}
      {isModalOpen && preview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-[90vw] max-h-[90vh]">
            <div className="relative">
              <img
                src={preview}
                alt="Uploaded Preview"
                className="max-w-[600px] max-h-[600px] object-contain"
                onError={(e) => {
                  console.error("모달 이미지 로드 오류:", e);
                  e.target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='none' d='M0 0h24v24H0z'/%3E%3Cpath fill='%23ccc' d='M5 11.1l2-2 5.5 5.5 3.5-3.5 3 3V5H5v6.1zM4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm11.5 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z'/%3E%3C/svg%3E";
                }}
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <label className="cursor-pointer px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-700">변경</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-md border border-red-500 text-red-500 hover:bg-red-50 transition-colors text-sm">
                삭제
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-colors text-sm">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
