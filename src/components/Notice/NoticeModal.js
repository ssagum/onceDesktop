import React from "react";
import ModalTemplate from "../common/ModalTemplate";
import styled from "styled-components";
import { cancel } from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import WhoSelector from "../common/WhoSelector";

const ModalHeaderZone = styled.div``;
const WhoZone = styled.div``;
const TitleZone = styled.div``;
const ContentZone = styled.div``;
const ButtonZone = styled.div``;

export default function NoticeModal({ isVisible, setIsVisible }) {
  return (
    <ModalTemplate
      isVisible={isVisible}
      setIsVisible={setIsVisible}
      showCancel={false}
      modalClassName="rounded-xl"
    >
      <div className="flex flex-col items-center w-onceBigModal h-onceBigModalH bg-white px-[40px] py-[30px]">
        <ModalHeaderZone className="flex flex-row w-full justify-between h-[50px] items-center">
          <span className="text-[34px] font-bold">공지</span>
          <img
            onClick={() => setIsVisible(false)}
            className="w-[30px]"
            src={cancel}
            alt="닫기"
            style={{ cursor: "pointer" }}
          />
        </ModalHeaderZone>
        <WhoZone className="flex flex-row items-center w-full px-[20px] my-[20px]">
          <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[80px]">
            작성자:
          </label>
          <WhoSelector who={"작성자"} />
          <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[80px] ml-[40px]">
            대상:
          </label>
          <WhoSelector who={"부서명"} />
        </WhoZone>
        <TitleZone className="flex flex-row items-center w-full px-[20px]">
          <input
            type="text"
            placeholder="공지제목"
            className="border border-gray-400 rounded-md h-[40px] px-4 w-full bg-textBackground"
          />
        </TitleZone>
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
            <OnceOnOffButton text={"취소"} />
            <OnceOnOffButton text={"등록"} />
          </div>
        </ButtonZone>
      </div>
    </ModalTemplate>
  );
}
