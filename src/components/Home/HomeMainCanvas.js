import React, { useState } from "react";
import styled from "styled-components";
import RenderTitlePart from "../common/RenderTitlePart";
import ToDo from "../common/ToDo";
import InsideHeader from "../common/InsideHeader";
import {
  bell,
  board,
  bulb,
  form,
  planeNote,
  plus,
  task,
  timer,
} from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import { Link } from "react-router-dom";
import NoticeModal from "../Notice.js/NoticeModal";
import DayChanger from "../common/DayChanger";
import ChatHistory from "../common/ChatHistory";
import CallModal from "../call/CallModal";
import { useUserLevel } from "../../utils/UserLevelContext";
import TaskListModal from "../Task/TaskListModal";

const TopZone = styled.div``;
const BottomZone = styled.div``;
const LeftZone = styled.div``;
const RightZone = styled.div``;
const RightTopZone = styled.div``;
const RightBottomZone = styled.div``;
const InsideHeaderZone = styled.div``;
const ToDoZone = styled.div``;

const Square = ({ title }) => {
  return (
    <div className="w-[110px] h-[110px] flex flex-col justify-center items-center bg-white rounded-xl pt-[8px]">
      <div className="w-[40px] h-[50px]">
        {title === "공지등록" && (
          <img src={plus} alt="Logo" className="w-[40px]" />
        )}
        {title === "업무추가" && (
          <img src={task} alt="Logo" className="w-[40px]" />
        )}
        {title === "비품신청" && (
          <img src={form} alt="Logo" className="w-[40px]" />
        )}
        {title === "휴가신청" && (
          <img src={planeNote} alt="Logo" className="w-[40px]" />
        )}
        {title === "타이머" && (
          <img src={timer} alt="Logo" className="w-[40px]" />
        )}
        {title === "건의하기" && (
          <img src={bulb} alt="Logo" className="w-[40px]" />
        )}
        {title === "요청하기" && (
          <img src={bulb} alt="Logo" className="w-[40px]" />
        )}
        {title === "병원현황" && (
          <img src={board} alt="Logo" className="w-[40px]" />
        )}
      </div>
      <span className="text-once18">{title}</span>
    </div>
  );
};

export default function HomeMainCanvas() {
  const [isVisible, setIsVisible] = useState(true);
  const [callIsVisible, setCallIsVisible] = useState(false);
  const { userLevelData, updateUserLevelData } = useUserLevel();
  const [taskListModalOn, setTaskListModalOn] = useState(true);

  return (
    <div className="w-full flex flex-col h-full bg-onceBackground min-w-[1100px] min-h-[900px]">
      {/* 위 영역 */}
      <TopZone className="flex-[1] w-full p-[20px]">
        <div className="w-full bg-white h-full flex-col px-[30px] rounded-xl">
          <InsideHeaderZone className="py-[20px] flex flex-row justify-between items-center">
            <InsideHeader title={"원내공지"} />
            <Link to="/notice">
              <button className="text-gray-600 underline">더보기</button>
            </Link>
          </InsideHeaderZone>
          <RenderTitlePart
            item={[]}
            category={"전체"}
            title={"공지사항 기능은 다음 버전에 업데이트 됩니다"}
            owner={"경영지원팀"}
            time={""}
          />
        </div>
      </TopZone>
      {/* 아래 영역 */}
      <BottomZone className="flex-[2] w-full pb-[20px] px-[20px]">
        <div className="h-full flex-row flex">
          {/* 왼쪽 영역 */}
          <LeftZone className="flex-[3] h-full bg-white rounded-xl">
            <div className="flex-col h-full flex w-full p-[30px]">
              <InsideHeaderZone className="pb-[30px] w-full flex flex-row justify-between">
                <InsideHeader title={userLevelData?.department} />
                <TaskListModal
                  isVisible={taskListModalOn}
                  setIsVisible={setTaskListModalOn}
                />
                <DayChanger />
              </InsideHeaderZone>
              <ToDoZone className="flex-col h-full">
                <ToDo />
                <ToDo />
                <ToDo />
                <ToDo />
                <ToDo />
              </ToDoZone>
              <OnceOnOffButton text={"업무 추가하기 +"} />
            </div>
          </LeftZone>
          {/* 오른쪽 영역 */}
          <div className="w-[20px]" />
          <RightZone className="flex-[4] h-full">
            <div className="flex-col h-full flex w-full gap-y-[20px]">
              <RightTopZone className="flex-[1] w-full bg-white rounded-xl">
                <InsideHeaderZone className="p-[30px] flex flex-row w-full justify-between">
                  <InsideHeader title={"알림"} />
                  <button className="text-gray-600 underline">더보기</button>
                </InsideHeaderZone>
                <div className="w-full h-[200px] px-[20px] pb-[20px]">
                  <ChatHistory />
                </div>
              </RightTopZone>
              <RightBottomZone className="w-full flex-row flex">
                <button
                  onClick={() => setCallIsVisible(true)}
                  className="w-full flex flex-col bg-white mr-[20px] rounded-xl h-[240px] justify-center items-center"
                >
                  <img src={bell} alt="Logo" className="w-[80px] mb-[10px]" />
                  <span className="text-once18">호 출</span>
                </button>
                <div className="w-[240px] h-[240px] flex-col flex justify-between">
                  {/* <NoticeModal
                    isVisible={isVisible}
                    setIsVisible={setIsVisible}
                  /> */}
                  {false ? (
                    <div className="w-[240px] flex flex-row justify-between">
                      <Square title={"공지등록"} />
                      <Square title={"업무추가"} />
                    </div>
                  ) : (
                    <div className="w-[240px] flex flex-row justify-between">
                      <Square title={"비품신청"} />
                      <Square title={"휴가신청"} />
                    </div>
                  )}
                  <div className="w-[240px] flex flex-row justify-between">
                    <Square title={"타이머"} />
                    {false ? (
                      <Square title={"병원현황"} />
                    ) : (
                      <Square title={"요청하기"} />
                    )}
                  </div>
                </div>
                <CallModal
                  isVisible={callIsVisible}
                  setIsVisible={setCallIsVisible}
                />
              </RightBottomZone>
            </div>
          </RightZone>
        </div>
      </BottomZone>
    </div>
  );
}
