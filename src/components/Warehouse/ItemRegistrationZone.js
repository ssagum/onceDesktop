import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { imageFile, search, task } from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import WhoSelector from "../common/WhoSelector";
import FormLabel from "../common/FormLabel";
import SelectableButton from "../common/SelectableButton";
import CurrencyInput from "../common/CurrencyInput";
import CustomSelect from "../common/CustomSelect";
import ImageUploader from "../common/ImageUploader";
import ItemRegistrationButton from "../common/ItemRegistrationButton";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../../firebase";

const TopZone = styled.div``;
const SortZone = styled.div``;
const TeamZone = styled.div``;

const ItemRegistrationZone = ({ onRegister, item }) => {
  const [mode, setMode] = useState(item ? "정정" : "신규");
  const emptyFormData = {
    id: "",
    category: "",
    itemName: "",
    department: "",
    price: "",
    vat: true,
    quantity: "",
    safeStock: "",
    vendor: "",
    location: "",
    writer: [],
    requester: [],
    measure: "",
    state: "입고 완료",
  };

  const [formData, setFormData] = useState(
    item
      ? {
          ...item,
          quantity: item.quantity || "",
          location: item.location || "",
          writer: item.writer || [],
          requester: item.requester || [],
        }
      : emptyFormData
  );

  useEffect(() => {
    if (item) {
      setMode("정정");
      setFormData({
        ...item,
        quantity: item.quantity || "",
        location: item.location || "",
        writer: item.writer || [],
        requester: item.requester || [],
      });
    } else {
      setMode("신규");
      setFormData(emptyFormData);
    }
  }, [item]);

  useEffect(() => {
    console.log("ItemRegistrationZone - Current item:", item);
    console.log("ItemRegistrationZone - Current formData:", formData);
    console.log("ItemRegistrationZone - Current mode:", mode);
  }, [item, formData, mode]);

  const requiredFields = [
    "itemName",
    "category",
    "price",
    "quantity",
    "writer",
    "requester",
    "department",
    "location",
  ];

  const isFormValid = () => {
    return requiredFields.every((field) => !!formData[field]);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCategoryChange = (value) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleModeChange = (newMode) => {
    if (newMode === "정정" && !item) {
      alert("정정은 비품현황을 통해서만 가능합니다.");
      return;
    }

    if (newMode === "신규" && mode === "정정") {
      if (
        window.confirm(
          "정정 모드에서 신규 모드로 전환하시겠습니까?\n입력된 데이터가 초기화됩니다."
        )
      ) {
        setMode("신규");
        setFormData(emptyFormData);
      }
      return;
    }

    setMode(newMode);
  };

  // 재고 히스토리 생성을 위한 함수 추가
  const createStockHistory = async (params) => {
    const { itemId, type, quantity, previousStock, currentStock, reason } =
      params;

    const stockHistoryData = {
      itemId: itemId,
      type: type,
      quantity: Number(quantity) || 0,
      previousStock: Number(previousStock) || 0,
      currentStock: Number(currentStock) || 0,
      date: serverTimestamp(),
      writer: formData.writer || [],
      requester: formData.requester || [],
      reason: reason || "미지정",
      status: "완료",
    };

    // 모든 필드가 유효한지 확인
    Object.entries(stockHistoryData).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        throw new Error(`${key} 필드가 유효하지 않습니다.`);
      }
    });

    return addDoc(collection(db, "stockHistory"), stockHistoryData);
  };

  const handleRegister = async () => {
    console.log("1. ItemRegistrationZone handleRegister 시작");
    console.log("현재 mode:", mode);
    console.log("받은 item:", item);

    const generateItemId = () => {
      const baseParts = [formData.department, formData.itemName];
      if (formData.measure) {
        baseParts.push(formData.measure);
      }
      return `${baseParts.join("_")}`;
    };

    try {
      if (mode === "신규") {
        const generatedId = generateItemId();
        const newDocRef = doc(db, "stocks", generatedId);

        // 수량을 숫자로 변환하여 저장
        const quantity = Number(formData.quantity) || 0;

        const newItemData = {
          ...formData,
          id: generatedId,
          quantity: quantity,
          location: formData.location,
          lastUpdated: serverTimestamp(),
        };

        // stocks 컬렉션에 데이터 저장
        await setDoc(newDocRef, newItemData);
        console.log("2. 새 아이템 등록 완료");

        // stockHistory 생성 - 초기 입고 기록
        try {
          await createStockHistory({
            itemId: generatedId,
            type: "입고",
            quantity: quantity,
            previousStock: 0,
            currentStock: quantity,
            reason: "초기 등록",
          });
          console.log("3. 초기 재고 히스토리 생성 완료");
        } catch (historyError) {
          console.error("재고 히스토리 생성 중 오류:", historyError);
          throw historyError;
        }

        onRegister({ type: "create", data: newItemData });
      } else {
        console.log("3. 수정 모드 진입");
        console.log("item.id:", item.id);

        const itemRef = doc(db, "stocks", item.id);
        console.log("4. Firestore 문서 참조 생성:", itemRef);

        const updateData = {
          ...formData,
          id: item.id,
        };
        console.log("5. 업데이트할 데이터:", updateData);

        // updateDoc 대신 setDoc with merge 사용
        await setDoc(itemRef, updateData, { merge: true });
        console.log("6. Firestore 문서 업데이트 완료");

        // 재고 수량이 변경된 경우 히스토리 기록
        if (Number(item.quantity) !== Number(formData.quantity)) {
          console.log("7. 재고 수량 변경 감지");
          console.log("이전 수량:", item.quantity);
          console.log("새로운 수량:", formData.quantity);

          await createStockHistory({
            itemId: item.id,
            type:
              Number(formData.quantity) > Number(item.quantity)
                ? "입고"
                : "출고",
            quantity: Math.abs(
              Number(formData.quantity) - Number(item.quantity)
            ),
            previousStock: Number(item.quantity),
            currentStock: Number(formData.quantity),
            reason: "수량 정정",
          });
          console.log("8. 재고 히스토리 기록 완료");
        }

        const finalData = { ...formData, id: item.id };
        console.log("9. onRegister에 전달할 최종 데이터:", finalData);
        onRegister({ type: "update", data: finalData });
      }

      console.log("10. 수정 완료, 알림 표시");
      alert(mode === "신규" ? "등록 완료!" : "수정 완료!");

      // 폼 초기화
      setFormData({
        id: "",
        category: "",
        itemName: "",
        department: "",
        price: "",
        vat: true,
        quantity: "",
        safeStock: "",
        vendor: "",
        location: "",
        writer: [],
        requester: [],
        measure: "",
        state: "입고 완료",
      });
      console.log("11. 폼 초기화 완료");
    } catch (error) {
      console.error("Error in handleRegister:", error);
      alert("저장 중 오류가 발생했습니다: " + error.message);
    }
  };

  const locations = ["창고 A", "창고 B", "사무실", "물류센터"]; // 예제 옵션

  // 소모품 카테고리 목록
  const consumableCategories = [
    "사무용 소모품",
    "의료용 소모품",
    "마케팅 소모품",
    "기타 소모품",
  ];

  // 현재 선택된 카테고리가 소모품인지 확인하는 함수
  const isConsumableCategory = (category) => {
    return consumableCategories.includes(category);
  };

  const handleDepartmentChange = (value) => {
    setFormData((prev) => ({ ...prev, department: value }));
  };

  // WhoSelector 변경 핸들러 추가
  const handlePeopleChange = (type) => (selectedPeople) => {
    setFormData((prev) => ({
      ...prev,
      [type]: selectedPeople,
    }));
  };

  return (
    <div className="w-full flex flex-col relative h-full">
      <TopZone className="w-full flex flex-row justify-between">
        <div className="flex space-x-4 mb-6">
          <button
            className={`w-[89px] h-[38px] border rounded-md ${
              mode === "신규"
                ? "border-onceBlue bg-onceBlue text-white"
                : "border-gray-400 text-gray-600"
            }`}
            onClick={() => handleModeChange("신규")}
          >
            신규
          </button>
          <button
            className={`w-[89px] h-[38px] border rounded-md ${
              mode === "정정"
                ? "border-onceBlue bg-onceBlue text-white"
                : "border-gray-400 text-gray-600"
            }`}
            onClick={() => handleModeChange("정정")}
          >
            정정
          </button>
        </div>
        <div className="flex justify-between mb-8">
          <div className="flex items-center space-x-4">
            <label className="text-black font-semibold">
              작성자:<span className="text-red-500">*</span>
            </label>
            <WhoSelector
              who={"작성자"}
              selectedPeople={formData.writer}
              onPeopleChange={handlePeopleChange("writer")}
            />
          </div>
          <div className="flex items-center space-x-4 ml-[20px]">
            <label className="text-black font-semibold">
              요청자:<span className="text-red-500">*</span>
            </label>
            <WhoSelector
              who={"요청자"}
              selectedPeople={formData.requester}
              onPeopleChange={handlePeopleChange("requester")}
            />
          </div>
        </div>
      </TopZone>
      {/* Form */}
      <div className="space-y-6">
        {/* 품명 */}
        <div className="flex flex-row items-center">
          <FormLabel
            label={"품명"}
            required={true}
            className="w-[80px] block font-semibold text-black"
          />
          <input
            type="text"
            name="itemName"
            value={formData.itemName}
            onChange={handleChange}
            placeholder="품명"
            className="w-[630px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
          />
        </div>
        {/* 분류 */}
        <SortZone className="flex flex-row w-[730px]">
          <FormLabel
            label={"분류"}
            required={true}
            className="flex font-semibold text-black mb-2 w-[80px] h-[40px] items-center"
          />
          <div className="flex flex-col">
            <div className="flex flex-row mb-[20px]">
              <SelectableButton
                field={formData.category}
                value="사무용 소모품"
                onChange={handleCategoryChange}
              />
              <SelectableButton
                field={formData.category}
                value="사무용품"
                onChange={handleCategoryChange}
              />
              <SelectableButton
                field={formData.category}
                value="의료용 소모품"
                onChange={handleCategoryChange}
              />
              <SelectableButton
                field={formData.category}
                value="의료용품"
                onChange={handleCategoryChange}
              />
              <SelectableButton
                field={formData.category}
                value="마케팅용품"
                onChange={handleCategoryChange}
              />
            </div>
            <div className="flex flex-row mb-[20px]">
              <SelectableButton
                field={formData.category}
                value="마케팅 소모품"
                onChange={handleCategoryChange}
              />
              <SelectableButton
                field={formData.category}
                value="기타용품"
                onChange={handleCategoryChange}
              />
              <SelectableButton
                field={formData.category}
                value="기타 소모품"
                onChange={handleCategoryChange}
              />
            </div>
          </div>
        </SortZone>
        {/* 분류 */}
        <TeamZone className="flex flex-row w-[730px]">
          <FormLabel
            label={"부서"}
            required={true}
            className="flex font-semibold text-black mb-2 w-[80px] h-[40px] items-center"
          />
          <div className="flex flex-col">
            <div className="flex flex-row mb-[20px]">
              <SelectableButton
                field={formData.department}
                value="진료"
                onChange={handleDepartmentChange}
              />
              <SelectableButton
                field={formData.department}
                value="간호"
                onChange={handleDepartmentChange}
              />
              <SelectableButton
                field={formData.department}
                value="물리치료"
                onChange={handleDepartmentChange}
              />
              <SelectableButton
                field={formData.department}
                value="원무"
                onChange={handleDepartmentChange}
              />
              <SelectableButton
                field={formData.department}
                value="방사선"
                onChange={handleDepartmentChange}
              />
            </div>
          </div>
        </TeamZone>
        {/* 단가 */}
        <div className="flex flex-row items-center">
          <FormLabel
            label={"단위"}
            required={true}
            className="h-[40px] flex items-center font-semibold text-black w-[80px]"
          />
          <input
            type="text"
            name="measure"
            value={formData.measure}
            onChange={handleChange}
            placeholder="단위"
            className="border border-gray-400 rounded-md h-[40px] px-4 w-[280px] bg-textBackground mr-[40px]"
          />
          <FormLabel
            label={"단가"}
            required={true}
            className="h-[40px] flex items-center font-semibold text-black w-[80px]"
          />
          <CurrencyInput
            name="price"
            value={formData.price}
            onChange={(value) =>
              handleChange({ target: { name: "price", value } })
            }
          />

          <div className="flex items-center space-x-2 ml-[30px]">
            <label className="font-semibold text-gray-600">VAT 포함</label>
            <input
              type="checkbox"
              name="vat"
              checked={formData.vat}
              onChange={(e) =>
                handleChange({
                  target: { name: "vat", value: e.target.checked },
                })
              }
              className="w-5 h-5"
            />
          </div>
        </div>
        {/* 기초재고 & 안전재고 */}
        <div className="flex flex-row items-center">
          <FormLabel
            label={"현재재고"}
            required={true}
            className="h-[40px] flex items-center font-semibold text-black mb-2 w-[80px]"
          />
          <input
            type="text"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="현재재고 수량"
            className="w-[280px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground mr-[40px]"
          />
          {isConsumableCategory(formData.category) && (
            <>
              <FormLabel
                label={"안전재고"}
                required={false}
                className="h-[40px] flex items-center font-semibold text-black mb-2 w-[80px]"
              />
              <input
                type="text"
                name="safeStock"
                value={formData.safeStock}
                onChange={handleChange}
                placeholder="안전재고 수량"
                className="w-[280px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
              />
            </>
          )}
        </div>

        {/* 안전재고 알림 문구 - 소모품일 때만 표시 */}
        {isConsumableCategory(formData.category) && (
          <p className="text-red-500 text-sm mt-4">
            * 안전재고 이하로 수량이 떨어지면 알림이 갑니다.
          </p>
        )}

        {/* 거래처 */}
        <div className="flex flex-row items-center">
          <label className="h-[40px] flex items-center font-semibold text-black w-[80px]">
            거래처:
          </label>
          <input
            type="text"
            name="vendor"
            value={formData.vendor}
            onChange={handleChange}
            placeholder="URL을 입력해주세요"
            className="w-[600px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
          />
          <div className="w-[80px] flex justify-center h-[40px]">
            <div className="flex w-[40px] h-[40px] justify-center items-center bg-slate-400 rounded-md">
              <img src={search} alt="Logo" className="w-[30px] h-[30px]" />
            </div>
          </div>
          <span className="w-[220px]">기존 거래처의 경우 검색하세요</span>
        </div>

        {/* 위치 - 필수 표시 추가 */}
        <div className="flex flex-row items-center">
          <label className="h-[40px] flex items-center font-semibold text-black w-[80px]">
            위치:<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="위치를 입력해주세요"
            className="w-[600px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
          />
          <div className="ml-[20px]">
            <ImageUploader
              name="locationImage"
              value={formData.locationImage}
              onChange={(file) =>
                handleChange({ target: { name: "locationImage", value: file } })
              }
            />
          </div>
        </div>
      </div>

      {/* 등록/수정 버튼 */}
      <div className="absolute bottom-0 w-full">
        <ItemRegistrationButton
          mode={mode}
          formData={formData}
          requiredFields={requiredFields}
          onClick={handleRegister}
        />
      </div>
    </div>
  );
};

export default ItemRegistrationZone;
