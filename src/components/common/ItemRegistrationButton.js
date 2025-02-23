import React from "react";

export default function ItemRegistrationButton({
  mode = "신규",
  formData,
  requiredFields,
  onClick,
}) {
  const getMissingFields = () => {
    return requiredFields.filter((field) => {
      if (field === "writer" || field === "requester") {
        return !formData[field] || formData[field].length === 0;
      }
      return !formData[field];
    });
  };

  const handleClick = () => {
    const missingFields = getMissingFields();
    if (missingFields.length > 0) {
      const fieldNames = {
        itemName: "품명",
        category: "분류",
        price: "단가",
        stock: "현재재고",
        writer: "작성자",
        requester: "요청자",
        department: "부서",
      };

      alert(
        `다음 필수 항목을 입력하세요: ${missingFields
          .map((f) => fieldNames[f])
          .join(", ")}`
      );
      return;
    }
    onClick();
  };

  const isValid = getMissingFields().length === 0;

  return (
    <button
      onClick={handleClick}
      className={`w-full rounded-md h-[50px] border-2 ${
        isValid
          ? "bg-onceBlue text-white border-onceBlue"
          : "bg-onceWhite text-onceBlue border-onceBlue"
      }`}
    >
      {mode === "신규" ? "등록하기" : "수정하기"}
    </button>
  );
}
