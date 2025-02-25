import React, { useState, useEffect } from "react";
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
import TimerModal from "../Timer/TimerModal";
import TaskAddModal from "../Task/TaskAddModal";
import { tasks } from "../../datas/tasks";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import ReceivedCallList from "../call/ReceivedCallList";
import ChatHistoryModal from "../common/ChatHistoryModal";

const TopZone = styled.div``;
const BottomZone = styled.div``;
const LeftZone = styled.div``;
const RightZone = styled.div``;
const RightTopZone = styled.div``;
const RightBottomZone = styled.div``;
const InsideHeaderZone = styled.div``;
const ToDoZone = styled.div``;

const Square = ({ title }) => {
  const handleClick = () => {
    if (["비품신청", "휴가신청", "요청하기"].includes(title)) {
      alert("현재 제한된 기능입니다.");
    }
  };

  return (
    <div
      className="w-[110px] h-[110px] flex flex-col justify-center items-center bg-white rounded-xl pt-[8px] cursor-pointer"
      onClick={handleClick}
    >
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

const openTimerWindow = () => {
  window.electron.openTimerWindow();
};

export default function HomeMainCanvas() {
  const [isVisible, setIsVisible] = useState(true);
  const [callIsVisible, setCallIsVisible] = useState(false);
  const { userLevelData, updateUserLevelData } = useUserLevel();
  const [taskListModalOn, setTaskListModalOn] = useState(false);
  const [timerModalOn, setTimerModalOn] = useState(false);
  const [taskAddModalOn, setTaskAddModalOn] = useState(false);
  const [notices, setNotices] = useState([]);
  const [showChatHistory, setShowChatHistory] = useState(false);

  console.log(userLevelData);

  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const noticeList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt || "",
      }));
      setNotices(noticeList);
    });

    return () => unsubscribe();
  }, []);

  // 오늘 날짜의 업무만 필터링
  const todayTasks = tasks.filter((task) => {
    // 부서 및 위치 필터링
    const isDepartmentMatch =
      task.department === userLevelData?.department ||
      task.department === "전체";
    const isLocationMatch =
      !task.location ||
      task.location === userLevelData?.location ||
      task.department === "전체";

    // 역할 기반 필터링
    const isRoleMatch =
      !task.assignee ||
      task.assignee === userLevelData?.role ||
      task.assignee === "전체" ||
      (userLevelData?.role.includes("장") &&
        task.department === userLevelData?.department);

    // 날짜 필터링
    const today = new Date();
    const taskDate = new Date(task.startDate);
    const isSameDay =
      today.getFullYear() === taskDate.getFullYear() &&
      today.getMonth() === taskDate.getMonth() &&
      today.getDate() === taskDate.getDate();

    // 주기에 따른 필터링
    let isInCycle = false;
    switch (task.cycle) {
      case "매일":
        isInCycle = true;
        break;
      case "매주":
        isInCycle = today.getDay() === taskDate.getDay();
        break;
      case "격주":
        const weekDiff = Math.floor(
          (today - taskDate) / (7 * 24 * 60 * 60 * 1000)
        );
        isInCycle = weekDiff % 2 === 0 && today.getDay() === taskDate.getDay();
        break;
      case "일회성":
        isInCycle = isSameDay;
        break;
      default:
        isInCycle = false;
    }

    return (
      isDepartmentMatch &&
      isLocationMatch &&
      isRoleMatch &&
      (isSameDay || isInCycle)
    );
  });

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

          {/* 상위 4개의 공지사항만 표시 */}
          {notices.slice(0, 4).map((notice) => (
            <RenderTitlePart key={notice.id} row={notice} />
          ))}
        </div>
      </TopZone>
      {/* 아래 영역 */}
      <BottomZone className="flex-[2] w-full pb-[20px] px-[20px]">
        <div className="h-full flex-row flex">
          {/* 왼쪽 영역 */}
          <LeftZone className="flex-[3] h-full bg-white rounded-xl">
            <div className="flex-col h-full flex w-full p-[30px]">
              <InsideHeaderZone className="pb-[30px] w-full flex flex-row justify-between">
                <div className="flex flex-row items-center">
                  <div className="w-[40px] h-[40px] flex justify-center items-center">
                    <img src={task} alt="logo" className="w-[34px] h-auto" />
                  </div>
                  <div className="ml-[20px] text-once20 font-semibold">
                    {userLevelData?.department}
                  </div>
                </div>
                <TaskListModal
                  isVisible={taskListModalOn}
                  setIsVisible={setTaskListModalOn}
                />
                <DayChanger />
              </InsideHeaderZone>
              {/* <ToDoZone className="flex-col h-full">
                {todayTasks.map((task) => (
                  <ToDo key={task.id} task={task} />
                ))}
              </ToDoZone> */}
              <div className="flex-col h-full">
                <div className="flex items-center justify-center h-full text-center px-4">
                  <div className="bg-gray-50 rounded-lg p-6 max-w-lg">
                    <p className="text-gray-600 text-lg mb-3">
                      모바일 앱과 PC용 프로그램을 동시에 개발하여 연결하는
                      과정에서 일시적으로 일부 기능이 제한되었습니다.
                    </p>
                    <p className="text-gray-500">
                      공지사항에 희망하시는 기능이나 불편한 부분을 댓글로
                      남겨주시면, 빠른 시일 내에 개선하여 찾아뵙도록 하겠습니다.
                    </p>
                  </div>
                </div>
              </div>
              <OnceOnOffButton
                text={"업무 추가하기 +"}
                onClick={() => {
                  alert("현재 제한된 기능입니다.");
                  // setTaskAddModalOn(true); // 기존 기능 주석 처리
                }}
              />
            </div>
          </LeftZone>
          {/* 오른쪽 영역 */}
          <div className="w-[20px]" />
          <RightZone className="flex-[4] h-full">
            <div className="flex-col h-full flex w-full gap-y-[20px]">
              <RightTopZone className="flex-[1] w-full bg-white rounded-xl">
                <InsideHeaderZone className="p-[30px] flex flex-row w-full justify-between">
                  <InsideHeader title={"알림"} />
                  <button
                    className="text-gray-600 underline"
                    onClick={() => setShowChatHistory(true)}
                  >
                    더보기
                  </button>
                </InsideHeaderZone>
                <div className="w-full h-[200px] overflow-y-auto px-[20px]">
                  <ReceivedCallList />
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
                    <div onClick={openTimerWindow}>
                      <Square title={"타이머"} />
                    </div>
                    <Square title={"요청하기"} />
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
      <TimerModal isVisible={timerModalOn} setIsVisible={setTimerModalOn} />
      <TaskAddModal
        isVisible={taskAddModalOn}
        setIsVisible={setTaskAddModalOn}
      />
      <ChatHistoryModal
        isVisible={showChatHistory}
        setIsVisible={setShowChatHistory}
        recentCalls={[]} // 실제 데이터를 여기에 전달
      />
    </div>
  );
}
