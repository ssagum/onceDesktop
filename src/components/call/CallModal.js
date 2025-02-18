import React, { useState } from "react";
import ModalTemplate from "../common/ModalTemplate";
import styled from "styled-components";
import { cancel } from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import WhoSelector from "../common/WhoSelector";
import { useUserLevel } from "../../utils/UserLevelContext";
import UserChipText from "../common/UserChipText";
import ModeToggle from "../ModeToggle";

const ModalHeaderZone = styled.div``;
const WhoZone = styled.div``;
const TitleZone = styled.div``;
const ContentZone = styled.div``;
const ButtonZone = styled.div``;

export default function CallModal({ isVisible, setIsVisible }) {
  const { userLevelData, updateUserLevelData } = useUserLevel();
  const [simpleMode, setSimpleMode] = useState(true);

  return (
    <ModalTemplate
      isVisible={isVisible}
      setIsVisible={setIsVisible}
      showCancel={false}
      modalClassName="rounded-xl"
    >
      <div className="flex flex-col items-center w-onceBigModal h-onceBigModalH bg-white px-[40px] py-[30px]">
        <ModalHeaderZone className="flex flex-row w-full justify-between h-[50px] items-center">
          <span className="text-[34px] font-bold">호출</span>
          <div className="flex flex-row items-center">
            <ModeToggle />
            <img
              onClick={() => setIsVisible(false)}
              className="w-[30px]"
              src={cancel}
              alt="닫기"
              style={{ cursor: "pointer" }}
            />
          </div>
        </ModalHeaderZone>
        <WhoZone className="flex flex-row items-center w-full px-[20px] my-[20px]">
          <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[60px]">
            발신:
          </label>
          <div className="w-[160px]">
            <UserChipText text={userLevelData?.location} yellowMode={true} />
          </div>
          <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[80px] ml-[40px]">
            수신:
          </label>
          <WhoSelector who={"부서명"} />
        </WhoZone>
        {/* <TitleZone className="flex flex-row items-center w-full px-[20px]">
          <input
            type="text"
            placeholder="공지제목"
            className="border border-gray-400 rounded-md h-[40px] px-4 w-full bg-textBackground"
          />
        </TitleZone> */}
        <ContentZone className="flex flex-col w-full px-[20px] mb-[20px] h-full">
          <textarea
            placeholder="단순 호출 시에는 내용을 작성하지 않으시고 비워 두시는 것이 권장됩니다."
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
            <OnceOnOffButton text={"호출하기"} />
          </div>
        </ButtonZone>
      </div>
    </ModalTemplate>
  );
}
