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
  const [allUserTasks, setAllUserTasks] = useState([]);
  const [userTasks, setUserTasks] = useState([]);
  const [taskHistoryModalOn, setTaskHistoryModalOn] = useState(false);
  const [taskHistory, setTaskHistory] = useState([]);
  const { showToast } = useToast();

  // 날짜 변경 시 업무 필터링 갱신
  useEffect(() => {
    if (allUserTasks.length > 0) {
      filterUserTasks(allUserTasks);
    }
  }, [currentDate]);

  // Firebase에서 업무 목록 불러오기
  useEffect(() => {
    if (!userLevelData) return;

    // 현재 사용자의 부서와 역할에 대한 업무 데이터 실시간 리스너 설정
    const departmentQuery = query(
      collection(db, "tasks"),
      where("assignee", "==", userLevelData.department)
    );

    const roleQuery = query(
      collection(db, "tasks"),
      where("assignee", "==", userLevelData.role)
    );

    // 부서 업무 리스너
    const departmentUnsubscribe = onSnapshot(
      departmentQuery,
      (snapshot) => {
        const departmentTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 역할 업무와 통합하여 필터링
        fetchRoleTasks(departmentTasks);
      },
      (error) => {
        console.error("Error fetching department tasks:", error);
      }
    );

    // 역할 업무를 가져오고 부서 업무와 통합하는 함수
    const fetchRoleTasks = (departmentTasks) => {
      onSnapshot(
        roleQuery,
        (snapshot) => {
          const roleTasks = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // 중복 제거 후 배열 합치기
          const allTasks = [...departmentTasks];
          roleTasks.forEach((task) => {
            if (!allTasks.some((t) => t.id === task.id)) {
              allTasks.push(task);
            }
          });

          // 모든 사용자 업무 상태 업데이트
          setAllUserTasks(allTasks);

          // 날짜 필터링 적용
          filterUserTasks(allTasks);
        },
        (error) => {
          console.error("Error fetching role tasks:", error);
        }
      );
    };

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      departmentUnsubscribe();
    };
  }, [userLevelData]);

  // 현재 사용자와 날짜에 맞는 업무 필터링
  const filterUserTasks = (tasks) => {
    if (!tasks || tasks.length === 0) {
      setUserTasks([]);
      console.log("필터링할 업무가 없습니다.");
      return;
    }

    // 디버깅을 위해 모든 업무 로깅
    console.log("필터링 전 모든 업무:", tasks);

    const currentDateOnly = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );

    console.log("현재 선택된 날짜:", currentDateOnly);

    const filteredTasks = tasks.filter((task) => {
      // Firebase 타임스탬프 또는 Date 객체 처리
      let taskStartDate, taskEndDate;

      try {
        // 타임스탬프인 경우 (seconds, nanoseconds 속성이 있음)
        if (task.startDate && task.startDate.seconds) {
          taskStartDate = new Date(task.startDate.seconds * 1000);
        } else {
          // 문자열이나 Date 객체인 경우
          taskStartDate = new Date(task.startDate);
        }

        if (task.endDate && task.endDate.seconds) {
          taskEndDate = new Date(task.endDate.seconds * 1000);
        } else {
          taskEndDate = new Date(task.endDate);
        }

        // 날짜만 비교를 위해 시간 부분 제거
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

        // 디버깅: 각 업무의 날짜 범위와 현재 날짜 비교 결과 로깅
        const isInDateRange =
          taskStartDate <= currentDateOnly && currentDateOnly <= taskEndDate;
        console.log(
          `업무 [${task.title}]: ${taskStartDate} ~ ${taskEndDate}, 현재: ${currentDateOnly}, 포함여부: ${isInDateRange}`
        );

        // 현재 날짜가 업무 시작일과 종료일 사이에 있는지 확인
        return isInDateRange;
      } catch (error) {
        console.error(
          `업무 [${task.title || task.id}] 날짜 처리 중 오류:`,
          error
        );
        console.log("문제의 업무 데이터:", task);
        return false; // 오류가 있는 경우 필터링에서 제외
      }
    });

    console.log(
      `총 ${tasks.length}개 업무 중 ${filteredTasks.length}개가 날짜 필터 통과`
    );

    // 날짜순으로 정렬 (시작일 기준)
    filteredTasks.sort((a, b) => {
      const dateA = a.startDate?.seconds
        ? new Date(a.startDate.seconds * 1000)
        : new Date(a.startDate);
      const dateB = b.startDate?.seconds
        ? new Date(b.startDate.seconds * 1000)
        : new Date(b.startDate);
      return dateA - dateB;
    });

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
  const handleTaskAdd = async (newTask) => {
    try {
      // Firebase에 업무 추가
      await addTask(newTask);

      // 현재 사용자의 업무 목록 새로고침
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

  // 업무 클릭 핸들러
  const handleTaskClick = (task) => {
    // task가 null이거나 undefined인 경우 처리
    if (!task) {
      console.error("업무 정보가 없습니다.");
      return;
    }

    try {
      console.log("원본 task 객체:", task);

      // 날짜 안전하게 처리하는 함수
      const formatSafeDate = (dateValue) => {
        try {
          if (!dateValue) return format(new Date(), "yyyy/MM/dd");

          let dateObj;

          // 다양한 형식 처리
          if (dateValue instanceof Date) {
            dateObj = dateValue;
          } else if (typeof dateValue === "object" && dateValue.seconds) {
            // Firestore 타임스탬프 처리
            dateObj = new Date(dateValue.seconds * 1000);
          } else if (typeof dateValue === "string") {
            if (dateValue.includes("년") && dateValue.includes("월")) {
              // 한글 날짜 형식 파싱 로직 구현 필요
              dateObj = new Date(); // 임시로 현재 날짜 사용
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

      // 시작일과 종료일 안전하게 처리
      let safeStartDate = formatSafeDate(task.startDate);
      let safeEndDate = formatSafeDate(task.endDate);

      console.log("변환된 날짜:", {
        원본시작일: task.startDate,
        안전시작일: safeStartDate,
        원본종료일: task.endDate,
        안전종료일: safeEndDate,
      });

      // 필수 필드 존재 확인
      const safeTask = {
        ...task,
        // 날짜 필드 안전하게 설정
        startDate: safeStartDate,
        endDate: safeEndDate,
        // 기타 필수 필드 체크
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
      setTaskAddModalOn(true);
    } catch (error) {
      console.error("업무 클릭 처리 중 오류 발생:", error);
    }
  };

  // 업무 수정 핸들러
  const handleTaskEdit = async (editedTask) => {
    try {
      // Firebase에서 업무 업데이트
      await updateTask(editedTask.id, editedTask);

      // 현재 사용자의 업무 목록 새로고침
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

      setTaskAddModalOn(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("Error editing task:", error);
    }
  };

  // 업무 삭제 핸들러
  const handleTaskDelete = async (taskId) => {
    try {
      // Firebase에서 업무 삭제
      await deleteTask(taskId);

      // 현재 사용자의 업무 목록 새로고침
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

      setTaskAddModalOn(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // 업무 이력 보기 핸들러
  const handleViewTaskHistory = async (task) => {
    if (!task) {
      console.error("업무 정보가 없습니다.");
      return;
    }

    try {
      // 안전한 task 객체 생성
      const safeTask = {
        ...task,
        // 필수 필드 확인
        id: task.id || Date.now().toString(),
        title: task.title || "",
      };

      setSelectedTask(safeTask);
      setTaskHistoryModalOn(true);
    } catch (error) {
      console.error("업무 이력 조회 중 오류 발생:", error);
    }
  };

  // 컴포넌트 마운트 시 디버깅을 위해 모든 업무 데이터 확인
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
        // 데이터베이스 초기화 제거

        // 기존 코드 유지
        console.log("HomeMainCanvas: 업무 목록을 가져오는 중...");
        const userTasksResult = await getUserTasks();
        setAllUserTasks(userTasksResult);
        // ... existing code ...
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();
  }, []);

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
              onTaskClick={handleTaskClick}
              onViewHistory={handleViewTaskHistory}
              currentDate={currentDate}
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
        task={selectedTask}
        isEdit={false}
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
      <TaskRecordModal
        isVisible={taskHistoryModalOn}
        setIsVisible={setTaskHistoryModalOn}
        task={selectedTask}
      />
    </div>
  );
}
