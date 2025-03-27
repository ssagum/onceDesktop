import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import RenderTitlePart from "../common/RenderTitlePart";
import ToDo from "../common/ToDo";
import InsideHeader from "../common/InsideHeader";
import {
  bell,
  board,
  bulb,
  chatting,
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
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import ReceivedCallList from "../call/ReceivedCallList";
import ChatHistoryModal from "../common/ChatHistoryModal";
import RequestModal from "./RequestModal";
import { format } from "date-fns";
import { addDays } from "date-fns";
import {
  getTasksByAssignee,
  getTasksByDate,
  addTask,
  completeTask,
  updateTask,
  deleteTask,
  getTaskHistory,
  debugShowAllTasks,
  getUserTasks,
  getAllTasks,
} from "../Task/TaskService";
import TaskRecordModal from "../Task/TaskRecordModal";
import { useToast } from "../../contexts/ToastContext";
import VacationModal from "../call/VacationModal";
import StockRequestModal from "../Warehouse/StockRequestModal";
import { getUnreadMessageCount } from "../Chat/ChatService";
import RequestStatusModal from "../Requests/RequestStatusModal";
import { isHospitalOwner } from "../../utils/permissionUtils";
import ManagementModal from "../Management/ManagementModal";

const TopZone = styled.div``;
const BottomZone = styled.div``;
const LeftZone = styled.div``;
const RightZone = styled.div``;
const RightTopZone = styled.div``;
const RightBottomZone = styled.div``;
const InsideHeaderZone = styled.div``;
const ToDoZone = styled.div``;

const Square = ({ title, unreadCount = 0 }) => {
  return (
    <div className="w-[110px] h-[110px] flex flex-col justify-center items-center bg-white rounded-xl pt-[8px] cursor-pointer relative">
      {unreadCount > 0 && (
        <div className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
          {unreadCount > 9 ? "9+" : unreadCount}
        </div>
      )}
      <div className="w-[40px] h-[50px]">
        {title === "공지등록" && (
          <img src={plus} alt="Logo" className="w-[40px]" />
        )}
        {title === "업무추가" && (
          <img src={task} alt="Logo" className="w-[34px]" />
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
          <img src={board} alt="Logo" className="w-[36px]" />
        )}
        {title === "채 팅" && (
          <img src={chatting} alt="Logo" className="w-[40px]" />
        )}
      </div>
      <span className="text-once18">{title}</span>
    </div>
  );
};

const openTimerWindow = () => {
  window.electron.openTimerWindow();
};

const openChatWindow = () => {
  window.electron.openChatWindow();
};

export default function HomeMainCanvas() {
  const { userLevelData, updateUserLevelData } = useUserLevel();
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showTaskHistory, setShowTaskHistory] = useState(false);
  const [allUserTasks, setAllUserTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [taskRecords, setTaskRecords] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showTaskAdd, setShowTaskAdd] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [notices, setNotices] = useState([]);
  const [callIsVisible, setCallIsVisible] = useState(false);
  const [requestModalOn, setRequestModalOn] = useState(false);
  const [vacationModalOn, setVacationModalOn] = useState(false);
  const [timerModalOn, setTimerModalOn] = useState(false);
  const { showToast } = useToast();
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [stockRequestModalOn, setStockRequestModalOn] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const navigate = useNavigate();
  const [requestStatusModalVisible, setRequestStatusModalVisible] =
    useState(false);
  const [requestStatusModalTab, setRequestStatusModalTab] =
    useState("vacation");
  const [managementModalVisible, setManagementModalVisible] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const userTasksResult = await getUserTasks({
          department: userLevelData?.department,
          date: currentDate,
          ignoreSchedule: false,
        });

        console.log(
          `사용자 업무 조회 결과: ${userTasksResult.length}개`,
          userTasksResult
        );
        setAllUserTasks(userTasksResult);
        setFilteredTasks(userTasksResult);
      } catch (error) {
        console.error("사용자 업무 가져오기 오류:", error);
      }
    };

    if (userLevelData?.department) {
      fetchTasks();
    }
  }, [userLevelData?.department, currentDate]);

  useEffect(() => {
    // 읽지 않은 메시지 수 가져오기
    const fetchUnreadMessages = async () => {
      if (userLevelData?.uid) {
        const count = await getUnreadMessageCount(
          userLevelData.uid,
          userLevelData.department,
          userLevelData.role
        );
        setUnreadChatCount(count);
      }
    };

    fetchUnreadMessages();

    // 1분마다 갱신
    const interval = setInterval(fetchUnreadMessages, 60000);
    return () => clearInterval(interval);
  }, [userLevelData?.uid, userLevelData?.department, userLevelData?.role]);

  const filterUserTasks = (tasks) => {
    if (!tasks || tasks.length === 0) {
      setFilteredTasks([]);
      console.log("필터링할 업무가 없습니다.");
      return;
    }

    console.log("필터링 전 모든 업무:", tasks);

    const currentDateOnly = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );

    console.log("현재 선택된 날짜:", currentDateOnly);

    let filteredByDate = tasks.filter((task) => {
      let taskStartDate, taskEndDate;

      try {
        if (task.startDate && task.startDate.seconds) {
          taskStartDate = new Date(task.startDate.seconds * 1000);
        } else {
          taskStartDate = new Date(task.startDate);
        }

        if (task.endDate && task.endDate.seconds) {
          taskEndDate = new Date(task.endDate.seconds * 1000);
        } else {
          taskEndDate = new Date(task.endDate);
        }

        taskStartDate = new Date(
          taskStartDate.getFullYear(),
          taskStartDate.getMonth(),
          taskStartDate.getDate()
        );

        taskEndDate = new Date(
          taskEndDate.getFullYear(),
          taskEndDate.getMonth(),
          taskEndDate.getDate()
        );

        const isInDateRange =
          taskStartDate <= currentDateOnly && currentDateOnly <= taskEndDate;
        console.log(
          `업무 [${task.title}]: ${taskStartDate} ~ ${taskEndDate}, 현재: ${currentDateOnly}, 포함여부: ${isInDateRange}`
        );

        return isInDateRange;
      } catch (error) {
        console.error(
          `업무 [${task.title || task.id}] 날짜 처리 중 오류:`,
          error
        );
        console.log("문제의 업무 데이터:", task);
        return false;
      }
    });

    console.log(
      `총 ${tasks.length}개 업무 중 ${filteredByDate.length}개가 날짜 필터 통과`
    );

    const dayOfWeek = currentDateOnly.getDay();
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const todayName = dayNames[dayOfWeek];

    const finalFiltered = filteredByDate.filter((task) => {
      // 디버깅: 요일/주기 필터링 상세 로그
      console.log(`업무 [${task.title}] 주기 필터링 체크:`, {
        cycle: task.cycle,
        days: task.days,
        todayName,
        포함여부: task.days?.includes(todayName),
      });

      // 매일 실행되는 업무
      if (task.cycle === "daily" || task.cycle === "매일") {
        console.log(`업무 [${task.title}]: 매일 수행 업무로 통과`);
        return true;
      }

      // 주간 또는 격주 업무 - 요일만 체크하고 격주 패턴은 일단 무시
      // 실제로는 격주 패턴 계산이 필요하지만, 우선 요일만으로 필터링
      if (
        (task.cycle === "weekly" ||
          task.cycle === "매주" ||
          task.cycle === "biweekly" ||
          task.cycle === "격주") &&
        task.days &&
        Array.isArray(task.days)
      ) {
        const dayMatches = task.days.includes(todayName);
        console.log(
          `업무 [${task.title}]: ${task.cycle} 업무, 요일 일치: ${dayMatches}`
        );

        // 주간 업무는 요일만 확인
        if (task.cycle === "weekly" || task.cycle === "매주") {
          return dayMatches;
        }

        // 격주 업무는 주차 계산 필요
        if (
          (task.cycle === "biweekly" || task.cycle === "격주") &&
          dayMatches
        ) {
          try {
            // 시작일 가져오기
            let startDate;
            if (task.startDate instanceof Date) {
              startDate = new Date(task.startDate.getTime());
            } else if (task.startDate?.seconds) {
              startDate = new Date(task.startDate.seconds * 1000);
            } else {
              startDate = new Date(task.startDate);
            }

            // 날짜를 00:00:00으로 설정하여 계산 정확도 높임
            startDate.setHours(0, 0, 0, 0);
            const currentDateCopy = new Date(currentDateOnly.getTime());
            currentDateCopy.setHours(0, 0, 0, 0);

            // 두 날짜 사이의 일수 계산
            const timeDiff = Math.abs(
              currentDateCopy.getTime() - startDate.getTime()
            );
            const diffDays = Math.floor(timeDiff / (1000 * 3600 * 24));

            // 주차 계산 (0부터 시작)
            const weeksFromStart = Math.floor(diffDays / 7);

            // 짝수 주차(0, 2, 4...)인지 홀수 주차(1, 3, 5...)인지 확인
            const isEvenWeek = weeksFromStart % 2 === 0;
            console.log(
              `업무 [${task.title}]: 격주 업무, 시작일로부터 ${diffDays}일, ${weeksFromStart}주차, 표시여부: ${isEvenWeek}`
            );

            // 0, 2, 4... 주차에 업무 표시 (첫 주 포함, 다음 주 제외, 다다음 주 포함...)
            return isEvenWeek;
          } catch (error) {
            console.error(`업무 [${task.title}]: 격주 계산 중 오류:`, error);
            // 오류 발생 시 안전하게 처리
            return dayMatches;
          }
        }

        return dayMatches;
      }

      // 월간 업무
      if (task.cycle === "monthly" || task.cycle === "매월") {
        console.log(`업무 [${task.title}]: 월간 업무로 통과`);
        return true;
      }

      // 기타 주기 유형
      console.log(`업무 [${task.title}]: 기타 업무 유형으로 통과`);
      return true;
    });

    console.log(`요일/주기 필터링 후 최종 업무: ${finalFiltered.length}개`);

    finalFiltered.sort((a, b) => {
      const dateA = a.startDate?.seconds
        ? new Date(a.startDate.seconds * 1000)
        : new Date(a.startDate);
      const dateB = b.startDate?.seconds
        ? new Date(b.startDate.seconds * 1000)
        : new Date(b.startDate);
      return dateA - dateB;
    });

    setFilteredTasks(finalFiltered);
  };

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

  const handleTaskAdd = async (newTask) => {
    try {
      await addTask(newTask);

      const userTasksResult = await getUserTasks({
        department: userLevelData?.department,
        date: currentDate,
        ignoreSchedule: false,
      });

      setAllUserTasks(userTasksResult);
      setFilteredTasks(userTasksResult);
    } catch (error) {
      console.error("업무 추가 중 오류:", error);
    }
  };

  const handleTaskClick = (task) => {
    if (!task) {
      console.error("업무 정보가 없습니다.");
      return;
    }

    try {
      console.log("원본 task 객체:", task);

      const formatSafeDate = (dateValue) => {
        try {
          if (!dateValue) return format(new Date(), "yyyy/MM/dd");

          let dateObj;

          if (dateValue instanceof Date) {
            dateObj = dateValue;
          } else if (typeof dateValue === "object" && dateValue.seconds) {
            dateObj = new Date(dateValue.seconds * 1000);
          } else if (typeof dateValue === "string") {
            if (dateValue.includes("년") && dateValue.includes("월")) {
              dateObj = new Date();
            } else {
              dateObj = new Date(dateValue);
            }
          } else {
            dateObj = new Date();
          }

          if (isNaN(dateObj.getTime())) {
            console.log(
              `유효하지 않은 날짜 값: ${dateValue}, 현재 날짜로 대체`
            );
            dateObj = new Date();
          }

          return format(dateObj, "yyyy/MM/dd");
        } catch (error) {
          console.error("날짜 처리 중 오류:", error, dateValue);
          return format(new Date(), "yyyy/MM/dd");
        }
      };

      let safeStartDate = formatSafeDate(task.startDate);
      let safeEndDate = formatSafeDate(task.endDate);

      console.log("변환된 날짜:", {
        원본시작일: task.startDate,
        안전시작일: safeStartDate,
        원본종료일: task.endDate,
        안전종료일: safeEndDate,
      });

      const safeTask = {
        ...task,
        startDate: safeStartDate,
        endDate: safeEndDate,
        title: task.title || "",
        writer: task.writer || "",
        assignee: task.assignee || "",
        category: task.category || "1회성",
        priority: task.priority || "중",
        content: task.content || "",
        id: task.id || Date.now().toString(),
        createdAt: task.createdAt || new Date().toISOString(),
        updatedAt: task.updatedAt || new Date().toISOString(),
        days: task.days || [],
        cycle: task.cycle || "매일",
      };

      setSelectedTask(safeTask);
      setShowTaskAdd(true);
    } catch (error) {
      console.error("업무 클릭 처리 중 오류 발생:", error);
    }
  };

  const handleTaskEdit = async (editedTask) => {
    try {
      await updateTask(editedTask);

      const userTasksResult = await getUserTasks({
        department: userLevelData?.department,
        date: currentDate,
        ignoreSchedule: false,
      });

      setAllUserTasks(userTasksResult);
      setFilteredTasks(userTasksResult);
      setShowTaskAdd(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("업무 수정 중 오류:", error);
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      await deleteTask(taskId);

      const userTasksResult = await getUserTasks({
        department: userLevelData?.department,
        date: currentDate,
        ignoreSchedule: false,
      });

      setAllUserTasks(userTasksResult);
      setFilteredTasks(userTasksResult);
      setShowTaskAdd(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("업무 삭제 중 오류:", error);
    }
  };

  const handleViewTaskHistory = async (task) => {
    if (!task) {
      console.error("업무 정보가 없습니다.");
      return;
    }

    try {
      const safeTask = {
        ...task,
        id: task.id || Date.now().toString(),
        title: task.title || "",
      };

      setSelectedTask(safeTask);
      setShowTaskHistory(true);
    } catch (error) {
      console.error("업무 이력 조회 중 오류 발생:", error);
    }
  };

  useEffect(() => {
    const checkFirestoreTasks = async () => {
      try {
        console.log("Firestore 업무 데이터 확인 중...");
        await debugShowAllTasks();
      } catch (error) {
        console.error("Firestore 데이터 확인 오류:", error);
      }
    };

    checkFirestoreTasks();
  }, []);

  const toggleMiniMode = () => {
    setIsMiniMode((prev) => !prev);
  };

  // 신청 현황 모달 열기 함수
  const openRequestStatusModal = (tabType) => {
    setRequestStatusModalTab(tabType);
    setRequestStatusModalVisible(true);
  };

  return (
    <div className="w-full flex flex-col h-full bg-onceBackground min-w-[1100px] min-h-[900px]">
      <TopZone className="flex-[1] w-full pt-[20px] px-[20px]">
        <div className="w-full bg-white h-full flex-col px-[30px] rounded-xl">
          <InsideHeaderZone className="py-[20px] flex flex-row justify-between items-center">
            <InsideHeader title={"원내공지"} />
            <Link to="/notice">
              <button className="text-gray-600 underline">더보기</button>
            </Link>
          </InsideHeaderZone>

          {notices
            .filter((notice) => notice.pinned)
            .slice(0, 4)
            .map((notice) => (
              <RenderTitlePart key={notice.id} row={notice} isHomeMode={true} />
            ))}

          {notices.filter((notice) => notice.pinned).length === 0 && (
            <div className="w-full h-[200px] flex justify-center items-center text-gray-500">
              <span className="mb-[40px]">등록된 공지사항이 없습니다.</span>
            </div>
          )}
        </div>
      </TopZone>
      <BottomZone className="flex-[2] w-full p-[20px] flex flex-row gap-[30px]">
        <LeftZone className="flex-[0.95] bg-white rounded-xl p-[30px] flex flex-col h-full">
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
              tasks={filteredTasks}
              showCompleter={true}
              onTaskClick={handleTaskClick}
              onViewHistory={handleViewTaskHistory}
              currentDate={currentDate}
            />
          </ToDoZone>
          <div className="mt-[20px]">
            <OnceOnOffButton
              text={"업무 추가하기 +"}
              onClick={() => setShowTaskAdd(true)}
            />
          </div>
        </LeftZone>
        <RightZone className="flex-[1.05] h-full">
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
              <div className="w-[240px] h-[240px] flex-col flex justify-between mr-[20px] gap-y-[20px]">
                <button
                  onClick={() => setCallIsVisible(true)}
                  className="w-full flex flex-col bg-white h-full rounded-xl justify-center items-center"
                >
                  <img src={bell} alt="Logo" className="w-[46px] mb-[10px]" />
                  <span className="text-once18">호 출</span>
                </button>
                <button
                  onClick={openChatWindow}
                  className="w-full flex flex-col bg-white h-full rounded-xl justify-center items-center relative"
                >
                  {unreadChatCount > 0 && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white rounded-full px-1.5 min-w-[20px] h-5 flex items-center justify-center text-xs">
                      {unreadChatCount > 99
                        ? "99+"
                        : unreadChatCount > 9
                        ? `${unreadChatCount}+`
                        : unreadChatCount}
                    </div>
                  )}
                  <img
                    src={chatting}
                    alt="Logo"
                    className="w-[44px] mb-[10px]"
                  />
                  <span className="text-once18">채 팅</span>
                </button>
              </div>
              <div className="w-[240px] h-[240px] flex-col flex justify-between">
                {isHospitalOwner(userLevelData) ? (
                  <div className="w-[240px] flex flex-row justify-between">
                    <Square title={"공지등록"} />
                    <Square title={"업무추가"} />
                  </div>
                ) : (
                  <div className="w-[240px] flex flex-row justify-between">
                    <div onClick={() => openRequestStatusModal("stock")}>
                      <Square title={"비품신청"} />
                    </div>
                    <div onClick={() => openRequestStatusModal("vacation")}>
                      <Square title={"휴가신청"} />
                    </div>
                  </div>
                )}
                <div className="w-[240px] flex flex-row justify-between">
                  <div onClick={openTimerWindow}>
                    <Square title={"타이머"} />
                  </div>
                  {isHospitalOwner(userLevelData) ? (
                    <div onClick={() => setManagementModalVisible(true)}>
                      <Square title={"병원현황"} />
                    </div>
                  ) : (
                    <div onClick={() => openRequestStatusModal("request")}>
                      <Square title={"요청하기"} />
                    </div>
                  )}
                </div>
              </div>
              <CallModal
                isVisible={callIsVisible}
                setIsVisible={setCallIsVisible}
              />
              <VacationModal
                isVisible={vacationModalOn}
                setIsVisible={setVacationModalOn}
              />
            </RightBottomZone>
          </div>
        </RightZone>
      </BottomZone>
      <TimerModal isVisible={timerModalOn} setIsVisible={setTimerModalOn} />
      <TaskAddModal
        isVisible={showTaskAdd}
        setIsVisible={setShowTaskAdd}
        onTaskAdd={handleTaskAdd}
        onTaskEdit={handleTaskEdit}
        onTaskDelete={handleTaskDelete}
        task={selectedTask}
        isEdit={false}
      />
      <ChatHistoryModal
        isVisible={showChatHistory}
        setIsVisible={setShowChatHistory}
        recentCalls={[]}
      />
      <TaskRecordModal
        isVisible={showTaskHistory}
        setIsVisible={setShowTaskHistory}
        task={selectedTask}
      />

      {/* 신청 현황 모달 */}
      <RequestStatusModal
        isVisible={requestStatusModalVisible}
        setIsVisible={setRequestStatusModalVisible}
        initialTab={requestStatusModalTab}
      />

      {/* 병원 현황 모달 */}
      <ManagementModal
        isVisible={managementModalVisible}
        setIsVisible={setManagementModalVisible}
      />
    </div>
  );
}
