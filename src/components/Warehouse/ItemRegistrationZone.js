import React from "react";
import styled from "styled-components";
import { imageFile, search, task } from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import WhoSelector from "../common/WhoSelector";

const TopZone = styled.div``;
const SortZone = styled.div``;
const TeamZone = styled.div``;

const ItemRegistrationZone = () => {
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
          <label className="w-[80px] block font-semibold text-black">
            품명:
          </label>
          <input
            type="text"
            placeholder="품명"
            className="w-[630px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
          />
        </div>
        {/* 분류 */}
        <SortZone className="flex flex-row w-[730px]">
          <label className="flex font-semibold text-black mb-2 w-[80px] h-[40px] items-center">
            분류:
          </label>
          <div className="flex flex-col">
            <div className="flex flex-row mb-[20px]">
              <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                사무용 소모품
              </button>
              <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                사무용품
              </button>
              <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                의료용 소모품
              </button>
              <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                의료용품
              </button>
              <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                마케팅용품
              </button>
            </div>
            <div className="flex flex-row mb-[20px]">
              <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                마케팅 소모품
              </button>
              <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                기타용품
              </button>
              <button className="w-[110px] border border-gray-400 rounded-md h-[40px] mr-[20px]">
                기타 소모품
              </button>
            </div>
          </div>
        </SortZone>
        {/* 분류 */}
        <TeamZone className="flex flex-row w-[730px]">
          <label className="flex font-semibold text-black mb-2 w-[80px] h-[40px] items-center">
            분류:
          </label>
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
          <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[80px]">
            단가:
          </label>
          <input
            type="text"
            placeholder="단가"
            className="border border-gray-400 rounded-md h-[40px] px-4 w-[280px] bg-textBackground"
          />
          <div className="flex items-center space-x-2 ml-[30px]">
            <label className="font-semibold text-gray-600">VAT 미포함</label>
            <input type="checkbox" className="w-5 h-5" />
          </div>
        </div>

        {/* 기초재고 & 안전재고 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-row">
            <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[80px]">
              기초재고:
            </label>
            <input
              type="text"
              placeholder="현재재고 수량"
              className="w-[280px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
            />
          </div>
          <div className="flex flex-row">
            <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[80px]">
              안전재고:
            </label>
            <input
              type="text"
              placeholder="안전재고 수량"
              className="w-[280px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
            />
          </div>
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
          <input
            type="text"
            placeholder="위치를 입력해주세요"
            className="w-[600px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
          />
          <div className="w-[80px] flex justify-center">
            <img src={imageFile} alt="Logo" className="w-[30px] h-[30px]" />
          </div>
          <span>재고위치 사진을 추가해주세요 +</span>
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
