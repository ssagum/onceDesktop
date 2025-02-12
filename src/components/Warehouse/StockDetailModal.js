import React, { useState } from "react";
import styled from "styled-components";
import { cancel } from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import WhoSelector from "../common/WhoSelector";
import ModalTemplate from "../common/ModalTemplate";
import CurrencyInput from "../common/CurrencyInput";

const ModalHeaderZone = styled.div``;
const WhoZone = styled.div``;
const TitleZone = styled.div``;
const ContentZone = styled.div``;
const ButtonZone = styled.div``;
const TopZone = styled.div``;
const TopLeftZone = styled.div``;
const TopRightZone = styled.div``;
const Zone = styled.div``;
const PlusPurchaseModal = styled.div``;

export default function StockDetailModal({ isVisible, setIsVisible }) {
  const [isPlusPurchaseModalOn, setIsPlusPurchaseModalOn] = useState(true);

  return (
    <ModalTemplate
      isVisible={isVisible}
      setIsVisible={setIsVisible}
      showCancel={false}
      modalClassName="rounded-xl"
    >
      <div className="flex flex-col items-center w-onceBigModal h-onceBigModalH bg-white px-[40px] py-[30px]">
        <ModalHeaderZone className="flex flex-row w-full justify-between h-[50px] items-center">
          <div></div>
          <img
            onClick={() => setIsVisible(false)}
            className="w-[30px]"
            src={cancel}
            alt="닫기"
            style={{ cursor: "pointer" }}
          />
        </ModalHeaderZone>
        <TopZone className="flex flex-row w-full">
          <TopLeftZone className="flex-[3] flex flex-col">
            <WhoZone className="flex flex-row items-center w-full px-[20px] my-[20px]">
              <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px]">
                작성자:
              </label>
              <WhoSelector who={"작성자"} />
              <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px] ml-[20px]">
                대상:
              </label>
              <WhoSelector who={"부서명"} />
              <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px] ml-[20px]">
                부서:
              </label>
              <OnceOnOffButton
                text={"진료"}
                className="w-[120px] h-[40px] rounded-lg"
              />
            </WhoZone>
            <Zone className="flex flex-row items-center w-full px-[20px] mb-[20px]">
              <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px]">
                품명:
              </label>
              <input
                type="text"
                placeholder="품명"
                className="w-[490px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
              />
            </Zone>
            <Zone className="flex flex-row items-center w-full px-[20px] mb-[20px]">
              <div className="flex-[1] flex-row flex">
                <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px]">
                  분류:
                </label>
                <OnceOnOffButton
                  text={"의료용 소모품"}
                  className="w-[120px] h-[40px] rounded-lg"
                />
              </div>
              <div className="flex-[1] flex-row flex">
                <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px]">
                  단위:
                </label>
                <input
                  type="text"
                  placeholder="품명"
                  className="w-[200px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
                />
              </div>
            </Zone>
            <Zone className="flex flex-row items-center w-full px-[20px] mb-[20px]">
              <div className="flex-[1] flex-row flex">
                <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px]">
                  단가:
                </label>
                <CurrencyInput value={"4000"} />
              </div>
              <div className="flex-[1] flex-row flex">
                <div className="flex items-center space-x-2 ml-[30px]">
                  <label className="font-semibold text-gray-600">
                    VAT 포함
                  </label>
                  <input
                    type="checkbox"
                    checked={true} // VAT 포함 상태이면 체크됨
                    className="w-5 h-5"
                  />
                </div>
              </div>
            </Zone>
            <Zone className="flex flex-row items-center w-full px-[20px] mb-[20px]">
              <div className="flex-[1] flex-row flex">
                <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px]">
                  기초재고:
                </label>
                <input
                  type="number"
                  placeholder="기초재고 수량"
                  className="w-[200px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
                />
              </div>
              <div className="flex-[1] flex-row flex">
                <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px]">
                  안전재고:
                </label>
                <input
                  type="number"
                  placeholder="안전재고 수량"
                  className="w-[200px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
                />
              </div>
            </Zone>
          </TopLeftZone>
          <TopRightZone className="flex-[2] flex flex-col pr-[30px] py-[20px]">
            <div className="flex relative w-full h-full bg-blue-400">
              <div className="absolute w-full flex h-[40px] bottom-0 items-center justify-center opacity-50 bg-black">
                <span className="text-white text-once18 text-center">
                  2-CARM
                </span>
              </div>
            </div>
          </TopRightZone>
        </TopZone>
        <ContentZone className="flex flex-col w-full px-[20px] my-[20px] h-full">
          <textarea
            placeholder="공지를 작성해주세요"
            className="border border-gray-400 rounded-md h-full p-4 w-full bg-textBackground"
          />
        </ContentZone>
        <ButtonZone className="flex flex-row w-full justify-center px-[20px]">
          {/* <div className="flex flex-row gap-x-[20px] w-full">
            <OnceOnOffButton text={"수정"} />
            <OnceOnOffButton text={"삭제"} />
            <OnceOnOffButton text={"확인"} />
          </div> */}
          {/* <div className="flex flex-row gap-x-[20px] w-full">
            <OnceOnOffButton text={"확인"} />
          </div> */}
          <div className="flex flex-row gap-x-[20px] w-full">
            <OnceOnOffButton text={"품목 삭제"} />
            <OnceOnOffButton text={"품목정보 수정"} />
            <OnceOnOffButton
              on={true}
              text={"추가 주문"}
              onClick={() => {
                setIsPlusPurchaseModalOn(true);
              }}
            />
            <OnceOnOffButton text={"QR 인쇄"} />
          </div>
        </ButtonZone>
      </div>
      <ModalTemplate
        isVisible={isPlusPurchaseModalOn}
        setIsVisible={setIsPlusPurchaseModalOn}
        showCancel={false}
        modalClassName="rounded-xl"
      >
        <PlusPurchaseModal className="flex flex-col items-center w-[700px] h-[800px] bg-white px-[40px] py-[30px]">
          <ModalHeaderZone className="flex flex-row w-full justify-between h-[50px] items-center">
            <span className="text-[34px] font-bold">추가주문</span>
            <img
              onClick={() => setIsPlusPurchaseModalOn(false)}
              className="w-[30px]"
              src={cancel}
              alt="닫기"
              style={{ cursor: "pointer" }}
            />
          </ModalHeaderZone>
          <WhoZone className="flex flex-row items-center w-full px-[20px] my-[20px]">
            <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px]">
              작성자:
            </label>
            <WhoSelector who={"작성자"} />
            <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px] ml-[20px]">
              대상:
            </label>
            <WhoSelector who={"부서명"} />
            <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px] ml-[20px]">
              부서:
            </label>
            <OnceOnOffButton
              text={"진료"}
              className="w-[120px] h-[40px] rounded-lg"
            />
          </WhoZone>
          <Zone className="flex flex-row items-center w-full px-[20px] mb-[20px]">
            <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px]">
              품명:
            </label>
            <input
              type="text"
              placeholder="품명"
              className="w-[490px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
            />
          </Zone>
          <Zone className="flex flex-row items-center w-full px-[20px] mb-[20px]">
            <div className="flex-[1] flex-row flex">
              <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px]">
                분류:
              </label>
              <OnceOnOffButton
                text={"의료용 소모품"}
                className="w-[120px] h-[40px] rounded-lg"
              />
            </div>
            <div className="flex-[1] flex-row flex">
              <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px]">
                단위:
              </label>
              <input
                type="text"
                placeholder="품명"
                className="w-[200px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
              />
            </div>
          </Zone>
          <Zone className="flex flex-row items-center w-full px-[20px] mb-[20px]">
            <div className="flex-[1] flex-row flex">
              <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px]">
                단가:
              </label>
              <CurrencyInput value={"4000"} />
            </div>
            <div className="flex-[1] flex-row flex">
              <div className="flex items-center space-x-2 ml-[30px]">
                <label className="font-semibold text-gray-600">VAT 포함</label>
                <input
                  type="checkbox"
                  checked={true} // VAT 포함 상태이면 체크됨
                  className="w-5 h-5"
                />
              </div>
            </div>
          </Zone>
          <Zone className="flex flex-row items-center w-full px-[20px] mb-[20px]">
            <div className="flex-[1] flex-row flex">
              <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px]">
                기초재고:
              </label>
              <input
                readOnly
                type="number"
                placeholder="기초재고 수량"
                className="w-[200px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
              />
            </div>
            <div className="flex-[1] flex-row flex">
              <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px]">
                안전재고:
              </label>
              <input
                type="number"
                placeholder="안전재고 수량"
                className="w-[200px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
              />
            </div>
          </Zone>
        </PlusPurchaseModal>
      </ModalTemplate>
    </ModalTemplate>
  );
}
