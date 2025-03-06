import React from "react";

export default function ItemRegistrationButton({
  mode = "신규",
  formData,
  requiredFields,
  onClick,
  showToast,
}) {
  const getMissingFields = () => {
    return requiredFields.filter((field) => {
      if (field === "writer") {
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
        quantity: "현재재고",
        writer: "작성자",
        department: "부서",
        location: "위치",
      };

      const missingFieldsString = missingFields
        .map((field) => fieldNames[field] || field)
        .join(", ");

      if (showToast) {
        showToast(
          `필수 입력 필드를 모두 입력해주세요: ${missingFieldsString}`,
          "error"
        );
      }
      turn;
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
      }`}>
      {mode === "신규" ? "등록하기" : "수정하기"}
    </button>
  );
}
