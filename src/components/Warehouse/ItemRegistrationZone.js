import React, { useState } from "react";
import styled from "styled-components";
import { imageFile, search, task } from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import WhoSelector from "../common/WhoSelector";
import FormLabel from "../common/FormLabel";
import SelectableButton from "../common/SelectableButton";
import CurrencyInput from "../common/CurrencyInput";
import CustomSelect from "../common/CustomSelect";
import ImageUploader from "../common/ImageUploader";

const TopZone = styled.div``;
const SortZone = styled.div``;
const TeamZone = styled.div``;

const ItemRegistrationZone = () => {
  const [formData, setFormData] = useState({
    id: "",
    category: "",
    itemName: "",
    department: "",
    price: "",
    vat: true,
    stock: "",
    safeStock: "",
    vendor: "",
    location: "",
    writer: "",
  });

  const requiredFields = ["itemName", "category", "price", "stock", "writer"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };
  const handleRegister = () => {
    const missingFields = requiredFields.filter((field) => !formData[field]);
    if (missingFields.length > 0) {
      alert(`다음 필수 항목을 입력하세요: ${missingFields.join(", ")}`);
      return;
    }

    console.log("📌 등록 데이터:", formData);
    alert("등록 완료!");
  };

  const locations = ["창고 A", "창고 B", "사무실", "물류센터"]; // 예제 옵션

  return (
    <div className="w-full flex flex-col relative h-full">
      <TopZone className="w-full flex flex-row justify-between">
        <div className="flex space-x-4 mb-6">
          <button className="w-[89px] h-[38px] border border-gray-400 rounded-md">
            신규
          </button>
          <button className="w-[89px] h-[38px] border border-gray-400 rounded-md">
            정정
          </button>
        </div>
        <div className="flex justify-between mb-8">
          <div className="flex items-center space-x-4">
            <label className="text-black font-semibold">작성자:</label>
            <WhoSelector who={"작성자"} />
          </div>
          <div className="flex items-center space-x-4 ml-[20px]">
            <label className="text-black font-semibold">요청자:</label>
            <WhoSelector who={"요청자"} />
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
              <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                진료
              </button>
              <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                물리치료
              </button>
              <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                원장님
              </button>
              <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                간호
              </button>
              <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                방사선
              </button>
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
            placeholder="단위"
            className="border border-gray-400 rounded-md h-[40px] px-4 w-[280px] bg-textBackground mr-[40px]"
          />
          <FormLabel
            label={"단가"}
            required={true}
            className="h-[40px] flex items-center font-semibold text-black w-[80px]"
          />
          <CurrencyInput
            value={formData.price}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                price: value, // 👈 input에서 받은 값을 업데이트
              }))
            }
          />

          <div className="flex items-center space-x-2 ml-[30px]">
            <label className="font-semibold text-gray-600">VAT 포함</label>
            <input
              type="checkbox"
              checked={formData.vat} // VAT 포함 상태이면 체크됨
              onChange={() =>
                setFormData((prev) => ({
                  ...prev,
                  vat: !prev.vat,
                }))
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
            placeholder="현재재고 수량"
            className="w-[280px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground  mr-[40px]"
          />
          <FormLabel
            label={"안전재고"}
            required={false}
            className="h-[40px] flex items-center font-semibold text-black mb-2 w-[80px]"
          />
          <input
            type="text"
            placeholder="안전재고 수량"
            className="w-[280px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
          />
        </div>

        {/* 알림 문구 */}
        <p className="text-red-500 text-sm mt-4">
          * 안전재고 이하로 수량이 떨어지면 알림이 갑니다. 소모품의 경우에만
          입력해주세요.
        </p>

        {/* 거래처 */}
        <div className="flex flex-row items-center">
          <label className="h-[40px] flex items-center font-semibold text-black w-[80px]">
            거래처:
          </label>
          <input
            type="text"
            placeholder="URL을 입력해주세요"
            className="w-[600px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
          />
          <div className="w-[80px] flex justify-center h-[40px]">
            <div className="flex w-[40px] h-[40px] justify-center items-center bg-slate-400 rounded-md">
              <img src={search} alt="Logo" className="w-[30px] h-[30px]" />
            </div>
          </div>
          <span>기존 거래처의 경우 검색하세요</span>
        </div>

        {/* 위치 */}
        <div className="flex flex-row items-center">
          <label className="h-[40px] flex items-center font-semibold text-black w-[80px]">
            위치:
          </label>
          <CustomSelect
            value={formData.location}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, location: e.target.value }))
            }
            options={locations}
            placeholder="위치를 선택해주세요"
          />
          {/* <div className="w-[80px] flex justify-center">
            <img src={imageFile} alt="Logo" className="w-[30px] h-[30px]" />
          </div>
          <span>재고위치 사진을 추가해주세요 +</span> */}
          <div className="ml-[20px]">
            <ImageUploader
              value={formData.locationImage}
              onChange={(file) =>
                setFormData((prev) => ({ ...prev, locationImage: file }))
              }
            />
          </div>
        </div>
      </div>

      {/* 등록 버튼 */}
      <div className="absolute bottom-0 w-full">
        <OnceOnOffButton text={"등록하기"} />
      </div>
    </div>
  );
};

export default ItemRegistrationZone;
