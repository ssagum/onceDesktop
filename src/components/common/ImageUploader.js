import React, { useState } from "react";

const ImageUploader = ({ value, onChange }) => {
  const [preview, setPreview] = useState(value || null); // 이미지 상태
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태

  // 파일 업로드 핸들러
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result); // 미리보기 업데이트
      onChange(file); // 부모 컴포넌트에 전달
    };
    reader.readAsDataURL(file);
  };

  // 삭제 핸들러
  const handleDelete = () => {
    setPreview(null);
    onChange(null);
    setIsModalOpen(false);
  };

  return (
    <div>
      {/* 이미지가 없을 때: 클릭하면 파일 업로드 */}
      {!preview ? (
        <label className="flex flex-col items-center cursor-pointer">
          <div className="w-[80px] h-[80px] flex items-center justify-center border border-gray-300 rounded-md bg-gray-100">
            <span className="text-gray-500">+</span>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <span className="text-sm text-gray-500 mt-2">사진 추가</span>
        </label>
      ) : (
        // 이미지가 있을 때: 클릭하면 모달 오픈
        <div
          onClick={() => setIsModalOpen(true)}
          className="w-[80px] h-[80px] border border-gray-300 rounded-md bg-gray-100 flex items-center justify-center cursor-pointer"
        >
          <span className="text-gray-500 text-sm">사진 보기</span>
        </div>
      )}

      {/* 모달 (이미지가 있을 때만 표시) */}
      {isModalOpen && preview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-4 rounded-md shadow-lg">
            <img
              src={preview}
              alt="Uploaded Preview"
              className="max-w-[400px] max-h-[400px]"
            />
            <div className="flex justify-between mt-4">
              {/* 파일 변경 버튼 */}
              <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md">
                변경
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {/* 삭제 버튼 */}
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-md"
              >
                삭제
              </button>
              {/* 닫기 버튼 */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md"
              >
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
