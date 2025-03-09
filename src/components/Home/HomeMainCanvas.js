import React, { useState, useEffect, useRef } from "react";
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

  useEffect(() => {
    if (allUserTasks.length > 0) {
      filterUserTasks(allUserTasks);
    }
  }, [currentDate]);

  useEffect(() => {
    if (!userLevelData) return;

    const departmentQuery = query(
      collection(db, "tasks"),
      where("assignee", "==", userLevelData.department)
    );

    const roleQuery = query(
      collection(db, "tasks"),
      where("assignee", "==", userLevelData.role)
    );

    const departmentUnsubscribe = onSnapshot(
      departmentQuery,
      (snapshot) => {
        const departmentTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        fetchRoleTasks(departmentTasks);
      },
      (error) => {
        console.error("Error fetching department tasks:", error);
      }
    );

    const fetchRoleTasks = (departmentTasks) => {
      onSnapshot(
        roleQuery,
        (snapshot) => {
          const roleTasks = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const allTasks = [...departmentTasks];
          roleTasks.forEach((task) => {
            if (!allTasks.some((t) => t.id === task.id)) {
              allTasks.push(task);
            }
          });

          setAllUserTasks(allTasks);

          filterUserTasks(allTasks);
        },
        (error) => {
          console.error("Error fetching role tasks:", error);
        }
      );
    };

    return () => {
      departmentUnsubscribe();
    };
  }, [userLevelData]);

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

    const filteredTasks = tasks.filter((task) => {
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
      `총 ${tasks.length}개 업무 중 ${filteredTasks.length}개가 날짜 필터 통과`
    );

    filteredTasks.sort((a, b) => {
      const dateA = a.startDate?.seconds
        ? new Date(a.startDate.seconds * 1000)
        : new Date(a.startDate);
      const dateB = b.startDate?.seconds
        ? new Date(b.startDate.seconds * 1000)
        : new Date(b.startDate);
      return dateA - dateB;
    });

    setFilteredTasks(filteredTasks);
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

      if (userLevelData) {
        const departmentTasks = await getTasksByAssignee(
          userLevelData.department
        );
        const roleTasks = await getTasksByAssignee(userLevelData.role);

        const allTasks = [...departmentTasks];
        roleTasks.forEach((task) => {
          if (!allTasks.some((t) => t.id === task.id)) {
            allTasks.push(task);
          }
        });

        filterUserTasks(allTasks);
      }
    } catch (error) {
      console.error("Error adding task:", error);
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
      await updateTask(editedTask.id, editedTask);

      if (userLevelData) {
        const departmentTasks = await getTasksByAssignee(
          userLevelData.department
        );
        const roleTasks = await getTasksByAssignee(userLevelData.role);

        const allTasks = [...departmentTasks];
        roleTasks.forEach((task) => {
          if (!allTasks.some((t) => t.id === task.id)) {
            allTasks.push(task);
          }
        });

        filterUserTasks(allTasks);
      }

      setShowTaskAdd(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("Error editing task:", error);
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      await deleteTask(taskId);

      if (userLevelData) {
        const departmentTasks = await getTasksByAssignee(
          userLevelData.department
        );
        const roleTasks = await getTasksByAssignee(userLevelData.role);

        const allTasks = [...departmentTasks];
        roleTasks.forEach((task) => {
          if (!allTasks.some((t) => t.id === task.id)) {
            allTasks.push(task);
          }
        });

        filterUserTasks(allTasks);
      }

      setShowTaskAdd(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("Error deleting task:", error);
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

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        console.log("HomeMainCanvas: 업무 목록을 가져오는 중...");
        const userTasksResult = await getUserTasks();
        setAllUserTasks(userTasksResult);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();
  }, []);

  const toggleMiniMode = () => {
    setIsMiniMode((prev) => !prev);
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
      <BottomZone className="flex-[2] w-full p-[20px] flex flex-row gap-[20px]">
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
                    <div onClick={() => setVacationModalOn(true)}>
                      <Square title={"휴가신청"} />
                    </div>
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
      <RequestModal
        isVisible={requestModalOn}
        setIsVisible={setRequestModalOn}
      />
      <TaskRecordModal
        isVisible={showTaskHistory}
        setIsVisible={setShowTaskHistory}
        task={selectedTask}
      />
    </div>
  );
}
