import React, { useState, useEffect } from "react";
import ModalTemplate from "../common/ModalTemplate";
import OnceOnOffButton from "../common/OnceOnOffButton";
import EditableField from "../common/EditableField";
import PhoneNumberField from "../common/PhoneNumberField";
import ImageUploader from "../common/ImageUploader";
import styled from "styled-components";

const OneLine = styled.div``;
const Half = styled.div``;
const SectionZone = styled.div``;

const VendorModal = ({ isVisible, setIsVisible, vendor = null }) => {
  const [phoneN, setPhoneN] = useState(vendor?.contact || "");
  const [businessRegistration, setBusinessRegistration] = useState(
    vendor?.documents?.businessRegistration || null
  );
  const [businessCard, setBusinessCard] = useState(
    vendor?.documents?.businessCard || null
  );

  useEffect(() => {
    if (vendor) {
      setPhoneN(vendor.contact || "");
      setBusinessRegistration(vendor?.documents?.businessRegistration || null);
      setBusinessCard(vendor?.documents?.businessCard || null);
    }
  }, [vendor]);

  return (
    <ModalTemplate
      isVisible={isVisible}
      setIsVisible={setIsVisible}
      showCancel={false}
    >
      <div className="flex flex-col w-[700px] h-[580px] items-center py-[40px] justify-between">
        <SectionZone className="flex flex-col w-full px-[30px]">
          <label className="flex font-semibold text-black mb-2 w-[100px] h-[40px]">
            <span className="text-once20">거래처 상세</span>
          </label>
          <OneLine className="flex flex-row w-full gap-x-[20px] mt-[20px]">
            <Half className="w-1/2 flex flex-row items-center">
              <label className="flex font-semibold text-black w-[100px] h-[40px] items-center">
                <span className="text-once16">거래처명</span>
              </label>
              <EditableField
                className="text-center w-[200px]"
                value={vendor?.clientName || ""}
              />
            </Half>
            <Half className="w-1/2 flex flex-row items-center">
              <label className="flex font-semibold text-black w-[100px] h-[40px] items-center">
                <span className="text-once16">담당자</span>
              </label>
              <EditableField
                className="text-center w-[200px]"
                value={vendor?.manager || ""}
              />
            </Half>
          </OneLine>

          {/* 기존 업종 선택 부분 */}
          <OneLine className="flex flex-row w-full items-center mt-[30px]">
            <label className="flex font-semibold text-black w-[120px] h-[40px] items-center">
              <span className="text-once16">업종</span>
            </label>
            <div className="flex flex-row gap-x-[14px] w-full items-center">
              <OnceOnOffButton
                text={"의료용품"}
                className="h-[30px] w-full rounded-lg"
              />
              <OnceOnOffButton
                text={"사무용품"}
                className="h-[30px] w-full rounded-lg"
              />
              <OnceOnOffButton
                text={"마케팅"}
                className="h-[30px] w-full rounded-lg"
              />
              <OnceOnOffButton
                text={"인테리어"}
                className="h-[30px] w-full rounded-lg"
              />
              <OnceOnOffButton
                text={"외부간판"}
                className="h-[30px] w-full rounded-lg"
              />
              <OnceOnOffButton
                text={"기타"}
                className="h-[30px] w-full rounded-lg"
              />
            </div>
          </OneLine>

          <OneLine className="flex flex-row w-full items-center mt-[30px]">
            <label className="flex font-semibold text-black w-[120px] h-[40px] items-center">
              <span className="text-once16">연락처</span>
            </label>
            <PhoneNumberField
              value={phoneN}
              setValue={setPhoneN}
              className="h-[40px] w-full text-center"
              placeholder="031-372-3300"
            />
          </OneLine>

          <OneLine className="flex flex-row w-full items-center mt-[30px]">
            <label className="flex font-semibold text-black w-[120px] h-[40px] items-center">
              <span className="text-once16">이메일</span>
            </label>
            <EditableField
              className="text-center w-full"
              placeholder="once@once.com"
              value={vendor?.email || ""}
            />
          </OneLine>

          <OneLine className="flex flex-row w-full gap-x-[20px] mt-[30px]">
            <Half className="w-1/2 flex flex-row items-center">
              <label className="flex font-semibold text-black w-[100px] h-[40px] items-center">
                <span className="text-once16">사업자등록증</span>
              </label>
              <ImageUploader
                value={businessRegistration}
                onChange={setBusinessRegistration}
              />
            </Half>
            <Half className="w-1/2 flex flex-row items-center">
              <label className="flex font-semibold text-black w-[100px] h-[40px] items-center">
                <span className="text-once16">명함</span>
              </label>
              <ImageUploader value={businessCard} onChange={setBusinessCard} />
            </Half>
          </OneLine>
        </SectionZone>

        <div className="w-full px-[30px] flex flex-row justify-between gap-x-[20px]">
          <OnceOnOffButton text={"수정"} />
          <OnceOnOffButton text={"삭제"} />
          <OnceOnOffButton text={"확인"} />
        </div>
      </div>
    </ModalTemplate>
  );
};

export default VendorModal;
