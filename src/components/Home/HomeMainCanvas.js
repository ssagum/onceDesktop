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
import RequestModal from "./RequestModal";
import { format } from "date-fns";
import { addDays } from "date-fns";

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
    <div className="w-[110px] h-[110px] flex flex-col justify-center items-center bg-white rounded-xl pt-[8px] cursor-pointer">
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
  const [selectedTask, setSelectedTask] = useState(null);
  const [notices, setNotices] = useState([]);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [requestModalOn, setRequestModalOn] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userTasks, setUserTasks] = useState([]);

  // 로컬 스토리지에서 업무 목록 불러오기
  useEffect(() => {
    const loadTasks = () => {
      const savedTasks = localStorage.getItem("tasks");
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        // 현재 사용자 관련 업무만 필터링
        filterUserTasks(parsedTasks);
      }
    };

    loadTasks();

    // 로컬 스토리지 변경 감지를 위한 이벤트 리스너
    const handleStorageChange = () => {
      loadTasks();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [userLevelData]);

  // 날짜 변경 시 업무 필터링 갱신
  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
      filterUserTasks(JSON.parse(savedTasks));
    }
  }, [currentDate]);

  // 현재 사용자와 날짜에 맞는 업무 필터링
  const filterUserTasks = (tasks) => {
    if (!userLevelData) return;

    const filteredTasks = tasks.filter((task) => {
      // 담당자 필터링 (현재 사용자의 부서/역할과 일치하는지)
      const isUserAssigned =
        task.assignee === userLevelData.department ||
        task.assignee === userLevelData.role;

      if (!isUserAssigned) return false;

      // 날짜 필터링
      const taskStartDate = new Date(task.startDate);
      const taskEndDate = new Date(task.endDate);
      const currentDateOnly = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      );

      // 현재 날짜가 업무 시작일과 종료일 사이에 있는지 확인
      return taskStartDate <= currentDateOnly && currentDateOnly <= taskEndDate;
    });

    // 날짜순으로 정렬 (시작일 기준)
    filteredTasks.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    setUserTasks(filteredTasks);
  };

  // 날짜 이동 함수
  const handlePrevDay = () => {
    setCurrentDate((prevDate) => addDays(prevDate, -1));
  };

  const handleNextDay = () => {
    setCurrentDate((prevDate) => addDays(prevDate, 1));
  };

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

  // 업무 추가 핸들러
  const handleTaskAdd = (newTask) => {
    // 로컬 스토리지에서 현재 업무 목록 가져오기
    const savedTasks = localStorage.getItem("tasks") || "[]";
    const currentTasks = JSON.parse(savedTasks);

    // 새 업무 추가
    const updatedTasks = [...currentTasks, newTask];

    // 로컬 스토리지 업데이트
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));

    // 현재 사용자 관련 업무 필터링 갱신
    filterUserTasks(updatedTasks);
  };

  // 업무 완료 처리 핸들러
  const handleTaskComplete = (taskId, staffId) => {
    // 로컬 스토리지에서 현재 업무 목록 가져오기
    const savedTasks = localStorage.getItem("tasks") || "[]";
    const currentTasks = JSON.parse(savedTasks);

    // 해당 업무 업데이트
    const updatedTasks = currentTasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          completed: true,
          completedBy: staffId,
          completedAt: new Date().toISOString(),
        };
      }
      return task;
    });

    // 로컬 스토리지 업데이트
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));

    // 현재 사용자 관련 업무 필터링 갱신
    filterUserTasks(updatedTasks);
  };

  // 업무 클릭 핸들러
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setTaskAddModalOn(true);
  };

  // 업무 수정 핸들러
  const handleTaskEdit = (editedTask) => {
    const savedTasks = localStorage.getItem("tasks") || "[]";
    const currentTasks = JSON.parse(savedTasks);

    const updatedTasks = currentTasks.map((task) =>
      task.id === editedTask.id ? editedTask : task
    );

    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    filterUserTasks(updatedTasks);
    setTaskAddModalOn(false);
    setSelectedTask(null);
  };

  // 업무 삭제 핸들러
  const handleTaskDelete = (taskId) => {
    const savedTasks = localStorage.getItem("tasks") || "[]";
    const currentTasks = JSON.parse(savedTasks);

    const updatedTasks = currentTasks.filter((task) => task.id !== taskId);

    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    filterUserTasks(updatedTasks);
    setTaskAddModalOn(false);
    setSelectedTask(null);
  };

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

          {/* pinned 상태인 공지사항만 표시 (최대 4개) */}
          {notices
            .filter((notice) => notice.pinned)
            .slice(0, 4)
            .map((notice) => (
              <RenderTitlePart key={notice.id} row={notice} isHomeMode={true} />
            ))}

          {/* pinned 상태인 공지가 없을 경우 안내 메시지 표시 */}
          {notices.filter((notice) => notice.pinned).length === 0 && (
            <div className="w-full h-[200px] flex justify-center items-center text-gray-500">
              등록된 공지사항이 없습니다.
            </div>
          )}
        </div>
      </TopZone>
      {/* 아래 영역 */}
      <BottomZone className="flex-[2] w-full p-[20px] flex flex-row gap-[20px]">
        {/* 왼쪽 영역 */}
        <LeftZone className="flex-[2] bg-white rounded-xl p-[30px] flex flex-col h-full">
          <div className="flex flex-row justify-between items-center">
            <div className="flex flex-row items-center">
              <div className="w-[40px] h-[40px] flex justify-center items-center">
                <img src={task} alt="logo" className="w-[34px] h-auto" />
              </div>
              <div className="ml-[20px] text-once20 font-semibold">
                {userLevelData?.department}
              </div>
            </div>
            <DayChanger
              currentDate={currentDate}
              onPrevDay={handlePrevDay}
              onNextDay={handleNextDay}
            />
          </div>
          <ToDoZone className="flex-1 mt-[20px] overflow-auto">
            <ToDo
              tasks={userTasks}
              showCompleter={true}
              onTaskComplete={handleTaskComplete}
              onTaskClick={handleTaskClick}
            />
          </ToDoZone>
          <div className="mt-[20px]">
            <OnceOnOffButton
              text={"업무 추가하기 +"}
              onClick={() => setTaskAddModalOn(true)}
            />
          </div>
        </LeftZone>
        {/* 오른쪽 영역 */}
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
                  <div onClick={() => setRequestModalOn(true)}>
                    <Square title={"요청하기"} />
                  </div>
                </div>
              </div>
              <CallModal
                isVisible={callIsVisible}
                setIsVisible={setCallIsVisible}
              />
            </RightBottomZone>
          </div>
        </RightZone>
      </BottomZone>
      <TimerModal isVisible={timerModalOn} setIsVisible={setTimerModalOn} />
      <TaskAddModal
        isVisible={taskAddModalOn}
        setIsVisible={setTaskAddModalOn}
        onTaskAdd={handleTaskAdd}
        onTaskEdit={handleTaskEdit}
        onTaskDelete={handleTaskDelete}
        initialTask={selectedTask}
      />
      <ChatHistoryModal
        isVisible={showChatHistory}
        setIsVisible={setShowChatHistory}
        recentCalls={[]} // 실제 데이터를 여기에 전달
      />
      <RequestModal
        isVisible={requestModalOn}
        setIsVisible={setRequestModalOn}
      />
    </div>
  );
}
