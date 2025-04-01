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
  naver,
  planeNote,
  plus,
  sms,
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
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
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
import {
  isHospitalOwner,
  isAdministrativeManager,
  isLeaderOrHigher,
} from "../../utils/permissionUtils";
import ManagementModal from "../Management/ManagementModal";
import TextEditorModal from "../TextEditorModal";
import { filterHiddenDocuments } from "../../utils/filterUtils";
import NaverReservationViewer from "../Reservation/NaverReservationViewer";

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
        {title === "네이버 예약" && (
          <img src={naver} alt="Logo" className="w-[36px]" />
        )}
        {title === "문자 발송" && (
          <img src={sms} alt="Logo" className="w-[40px]" />
        )}
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
        {title === "채팅" && (
          <img src={chatting} alt="Logo" className="w-[40px]" />
        )}
        {title === "호출" && <img src={bell} alt="Logo" className="w-[40px]" />}
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

const StatusBar = ({ currentDate, onOpenRequestModal }) => {
  const [vacationCount, setVacationCount] = useState(0);
  const [approvalCount, setApprovalCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const { userLevelData, currentUser } = useUserLevel();
  const [userPermissions, setUserPermissions] = useState({
    isOwner: false,
    isAdminManager: false,
    isLeader: false,
  });

  // 각 대기중 상태별 항목 수를 관리하는 상태 변수 추가
  const [pendingVacations, setPendingVacations] = useState([]);
  const [pendingStocks, setPendingStocks] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  // 사용자 권한 설정
  useEffect(() => {
    if (userLevelData) {
      setUserPermissions({
        isOwner: isHospitalOwner(userLevelData, currentUser),
        isAdminManager: isAdministrativeManager(userLevelData, currentUser),
        isLeader: isLeaderOrHigher(userLevelData, currentUser),
      });
    }
  }, [userLevelData, currentUser]);

  // Firestore에서 실제 데이터를 가져오도록 수정
  useEffect(() => {
    // 구독 해제할 함수들 배열
    const unsubscribes = [];

    console.log("===== StatusBar 데이터 로딩 시작 =====");
    console.log("현재 사용자 권한:", userPermissions);
    console.log("현재 사용자 부서:", userLevelData?.department);

    // 오늘 날짜 범위 계산 (시작: 오늘 00:00:00, 종료: 오늘 23:59:59)
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).getTime();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).getTime();

    // 부서 정보 확인 - 시스템에서 사용하는 형식에 맞게 팀 이름 확인
    const userDepartment = userLevelData?.department || "";

    // 1. 휴가자 정보 가져오기 - 오늘 날짜에 해당하는 승인된 휴가
    const vacationsRef = collection(db, "vacations");

    // 모든 휴가 데이터 가져오기
    const vacationsQuery = query(vacationsRef);

    const vacationUnsubscribe = onSnapshot(vacationsQuery, (snapshot) => {
      // 모든 휴가 데이터 매핑
      const vacations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt?.toDate?.() || new Date(),
      }));

      console.log("StatusBar - 전체 휴가 데이터:", vacations.length, "건");

      // 오늘 날짜에 해당하는 승인된 휴가만 필터링
      const approvedVacations = vacations.filter((vacation) => {
        // 승인됨 상태가 아니면 제외
        if (vacation.status !== "승인됨") return false;

        let startDate, endDate;

        try {
          // 시작일, 종료일 변환
          if (typeof vacation.startDate === "string") {
            startDate = new Date(vacation.startDate);
          } else if (vacation.startDate?.seconds) {
            startDate = new Date(vacation.startDate.seconds * 1000);
          } else {
            startDate = new Date(vacation.startDate);
          }

          if (typeof vacation.endDate === "string") {
            endDate = new Date(vacation.endDate);
          } else if (vacation.endDate?.seconds) {
            endDate = new Date(vacation.endDate.seconds * 1000);
          } else {
            endDate = new Date(vacation.endDate);
          }

          // 오늘 날짜에 포함되는지 확인
          return startDate <= endOfDay && endDate >= startOfDay;
        } catch (error) {
          console.error("휴가 날짜 처리 중 오류:", error);
          return false;
        }
      });

      console.log(
        "StatusBar - 오늘 승인된 휴가:",
        approvedVacations.length,
        "건"
      );

      // 대기중인 휴가 항목도 찾아서 결제 대기 건수 계산에 사용
      const waitingVacations = vacations.filter((v) => v.status === "대기중");
      console.log("StatusBar - 대기중인 휴가:", waitingVacations.length, "건");

      // 디버깅: 대기중인 휴가 항목 상세 정보 출력
      console.log("휴가 대기중 필터링 조건:", "status === '대기중'");
      if (waitingVacations.length > 0) {
        console.log("대기중 휴가 첫 번째 항목 예시:", {
          id: waitingVacations[0].id,
          status: waitingVacations[0].status,
          writer: waitingVacations[0].writer,
          startDate: waitingVacations[0].startDate,
          endDate: waitingVacations[0].endDate,
        });
      }

      // 상태 업데이트
      setPendingVacations(waitingVacations);
      setVacationCount(approvedVacations.length);
    });
    unsubscribes.push(vacationUnsubscribe);

    // 2. 결제 필요 건수 가져오기 - 대기 중인 요청들
    const requestsRef = collection(db, "requests");

    // RequestStatusModal 방식과 같이 모든 요청 데이터를 가져오도록 수정
    // 쿼리 조건 없이 모든 요청 데이터를 가져옴
    const requestsQuery = query(requestsRef);

    const requestsUnsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      // 모든 요청 데이터 매핑
      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt || new Date().getTime(),
      }));

      console.log("StatusBar - 전체 요청 데이터:", requests.length, "건");

      // 대기중 상태인 요청만 필터링
      const waitingRequests = requests.filter((req) => req.status === "대기중");
      console.log("StatusBar - 대기중 요청:", waitingRequests.length, "건");

      // 디버깅: 대기중인 요청 항목 상세 정보 출력
      console.log("요청 대기중 필터링 조건:", "status === '대기중'");
      if (waitingRequests.length > 0) {
        console.log("대기중 요청 첫 번째 항목 예시:", {
          id: waitingRequests[0].id,
          status: waitingRequests[0].status,
          title: waitingRequests[0].title,
          requestedBy: waitingRequests[0].requestedBy,
          department: waitingRequests[0].department,
          createdAt: waitingRequests[0].createdAt,
        });
      }

      // 상태변수 업데이트
      setPendingRequests(waitingRequests);
    });
    unsubscribes.push(requestsUnsubscribe);

    // 3. 주문 필요 건수 가져오기 - 승인되었지만 아직 주문되지 않은 비품
    const stockRequestsRef = collection(db, "stockRequests");

    // 조건 없이 모든 비품 요청 데이터 가져오기
    const stockQuery = query(stockRequestsRef);

    const stockUnsubscribe = onSnapshot(stockQuery, (snapshot) => {
      // 모든 비품 요청 데이터 매핑
      const stocks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt || new Date().getTime(),
      }));

      console.log("StatusBar - 전체 비품 데이터:", stocks.length, "건");

      // 승인됨 상태인 비품만 필터링
      const approvedStocks = stocks.filter(
        (stock) => stock.status === "승인됨"
      );
      console.log("StatusBar - 승인됨 비품:", approvedStocks.length, "건");

      // 대기중인 비품 항목도 찾아서 결제 대기 건수 계산에 사용
      const waitingStocks = stocks.filter((s) => s.status === "대기중");
      console.log("StatusBar - 대기중인 비품:", waitingStocks.length, "건");

      // 디버깅: 대기중인 비품 항목 상세 정보 출력
      console.log("비품 대기중 필터링 조건:", "status === '대기중'");
      if (waitingStocks.length > 0) {
        console.log("대기중 비품 첫 번째 항목 예시:", {
          id: waitingStocks[0].id,
          status: waitingStocks[0].status,
          itemName: waitingStocks[0].itemName,
          requestedBy: waitingStocks[0].requestedBy,
          department: waitingStocks[0].department,
          quantity: waitingStocks[0].quantity,
          createdAt: waitingStocks[0].createdAt,
        });
      }

      // 상태변수 업데이트
      setPendingStocks(waitingStocks);

      setOrderCount(approvedStocks.length);
    });
    unsubscribes.push(stockUnsubscribe);

    // 컴포넌트 언마운트 시 모든 구독 해제
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [currentDate, userLevelData, userPermissions]);

  // 결제 대기 건수 업데이트를 위한 별도의 useEffect
  useEffect(() => {
    const totalPending =
      pendingVacations.length + pendingStocks.length + pendingRequests.length;

    // 상세 디버깅 로그 추가
    console.log("==== 결재 필요 건수 디버깅 정보 ====");
    console.log("휴가 대기중 항목:", pendingVacations);
    console.log("비품 대기중 항목:", pendingStocks);
    console.log("요청 대기중 항목:", pendingRequests);
    console.log("총 결재 필요 건수:", totalPending);
    console.log("휴가 대기중:", pendingVacations.length, "건");
    console.log("비품 대기중:", pendingStocks.length, "건");
    console.log("요청 대기중:", pendingRequests.length, "건");
    console.log("=================================");

    setApprovalCount(totalPending);
  }, [pendingVacations, pendingStocks, pendingRequests]);

  return (
    <div className="w-full mt-4">
      {userPermissions.isOwner || userPermissions.isAdminManager ? (
        <div className="flex justify-between items-center bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* 휴가자 */}
          <div
            className="flex-1 py-3 px-4 flex items-center border-r border-gray-200 cursor-pointer hover:bg-blue-50 transition-all"
            onClick={() => onOpenRequestModal("vacation")}
          >
            <div className="rounded-full bg-blue-100 p-2 mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">휴가자</p>
              <p className="text-base font-bold text-blue-600">
                {vacationCount > 0 ? `${vacationCount}명` : "없음"}
              </p>
            </div>
          </div>

          {/* 결제 필요 */}
          <div
            className="flex-1 py-3 px-4 flex items-center border-r border-gray-200 cursor-pointer hover:bg-yellow-50 transition-all"
            onClick={() => onOpenRequestModal("request")}
          >
            <div className="rounded-full bg-yellow-100 p-2 mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">결재 필요</p>
              <p className="text-base font-bold text-yellow-600">
                {approvalCount}건
              </p>
            </div>
          </div>

          {/* 주문 필요 */}
          <div
            className="flex-1 py-3 px-4 flex items-center cursor-pointer hover:bg-green-50 transition-all"
            onClick={() => onOpenRequestModal("stock")}
          >
            <div className="rounded-full bg-green-100 p-2 mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">주문 필요</p>
              <p className="text-base font-bold text-green-600">
                {orderCount}건
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default function HomeMainCanvas() {
  const { userLevelData, currentUser, updateUserLevelData } = useUserLevel();
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
  const [showNoticeEditor, setShowNoticeEditor] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

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
      setNotices(filterHiddenDocuments(noticeList));
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

  // 네이버 예약 데이터 처리 핸들러
  const handleExtractedData = (data) => {
    if (!data) return;

    try {
      // 데이터가 isMultiple 속성을 가진 배열 형태인지 확인
      if (data.isMultiple && Array.isArray(data.reservations)) {
        console.log(`${data.count}개의 네이버 예약 일괄 저장 시작`);

        // 모든 예약을 비동기로 저장
        const saveAllReservations = async () => {
          const reservationsRef = collection(db, "reservations");
          let successCount = 0;
          let failCount = 0;

          // 모든 예약에 대해 반복 처리
          for (const reservation of data.reservations) {
            try {
              // 이미 생성된 documentId를 사용합니다
              const documentId =
                reservation.documentId ||
                `${reservation.title.replace(/\s+/g, "_")}_${
                  reservation.bookingNumber || Date.now()
                }`.substring(0, 120); // ID 길이 제한

              // 특수문자만 제거하고 한글, 영문, 숫자는 그대로 유지
              const cleanId = documentId
                .replace(/[^\w\s가-힣]/g, "")
                .replace(/\s+/g, "_");
              const finalId =
                cleanId.length > 0 ? cleanId : `고객_${Date.now()}`;

              // 저장할 데이터 준비 (documentId 포함)
              const reservationData = {
                ...reservation,
                documentId: finalId,
                updatedAt: serverTimestamp(),
                createdAt: reservation.createdAt || new Date().toISOString(),
                isHidden: false,
              };

              // 저장 시도
              const docRef = doc(reservationsRef, finalId);
              await setDoc(docRef, reservationData, { merge: true });

              console.log(`예약 저장 성공: ${finalId}`);
              successCount++;
            } catch (error) {
              console.error(`예약 저장 실패: ${reservation.title}`, error);
              failCount++;

              // 실패한 경우 자동 ID 사용하여 재시도
              try {
                await addDoc(reservationsRef, {
                  ...reservation,
                  updatedAt: serverTimestamp(),
                  createdAt: reservation.createdAt || new Date().toISOString(),
                  isHidden: false,
                });
                console.log(
                  `대체 방식으로 예약 저장 성공: ${reservation.title}`
                );
                successCount++;
              } catch (retryError) {
                console.error(
                  `대체 저장 방식도 실패: ${reservation.title}`,
                  retryError
                );
              }
            }
          }

          // 결과 메시지 표시
          if (successCount > 0) {
            showToast(
              `${successCount}개의 예약이 저장되었습니다${
                failCount > 0 ? ` (${failCount}개 실패)` : ""
              }`,
              successCount > 0 ? "success" : "warning"
            );
          } else {
            showToast("예약 저장에 실패했습니다.", "error");
          }
        };

        // 실행
        saveAllReservations();
      } else {
        // 단일 예약 데이터 처리
        console.log("단일 네이버 예약 데이터 저장 시작:", data);

        // 비동기 함수 정의
        const saveSingleReservation = async () => {
          try {
            // 이미 생성된 documentId를 사용하거나 생성
            const documentId =
              data.documentId ||
              `${data.title.replace(/\s+/g, "_")}_${
                data.bookingNumber || Date.now()
              }`;

            // 특수문자만 제거하고 한글, 영문, 숫자는 그대로 유지
            const cleanId = documentId
              .replace(/[^\w\s가-힣]/g, "")
              .replace(/\s+/g, "_");
            const finalId = cleanId.length > 0 ? cleanId : `고객_${Date.now()}`;

            // 저장할 데이터 준비 (documentId 포함)
            const reservationData = {
              ...data,
              documentId: finalId,
              updatedAt: serverTimestamp(),
              createdAt: data.createdAt || new Date().toISOString(),
              isHidden: false,
            };

            // reservations 컬렉션 참조
            const reservationsRef = collection(db, "reservations");

            // 고유 ID로 문서 참조 생성
            const docRef = doc(reservationsRef, finalId);

            // 데이터 저장 (merge: true로 기존 데이터와 병합)
            await setDoc(docRef, reservationData, { merge: true });

            console.log(`예약이 성공적으로 저장됨 (ID: ${finalId})`);
            showToast(
              "네이버 예약이 데이터베이스에 저장되었습니다.",
              "success"
            );
          } catch (saveError) {
            console.error("예약 저장 중 오류:", saveError);

            // 첫 번째 방법 실패 시 두 번째 방법 시도: addDoc 사용
            try {
              const reservationsRef = collection(db, "reservations");
              const autoDocRef = await addDoc(reservationsRef, {
                ...data,
                updatedAt: serverTimestamp(),
                createdAt: data.createdAt || new Date().toISOString(),
                isHidden: false,
              });

              console.log(`예약이 자동 ID로 저장됨 (ID: ${autoDocRef.id})`);
              showToast(
                "네이버 예약이 데이터베이스에 저장되었습니다.",
                "success"
              );
            } catch (fallbackError) {
              console.error("대체 저장 방법도 실패:", fallbackError);
              showToast("예약 저장에 실패했습니다.", "error");
            }
          }
        };

        // 함수 실행
        saveSingleReservation();
      }
    } catch (error) {
      console.error("네이버 예약 데이터 처리 중 오류:", error);
      showToast("예약 데이터 처리 중 오류가 발생했습니다.", "error");
    }
  };

  const handleCreateNotice = async (postData) => {
    try {
      // Firebase에 공지사항 추가
      await addDoc(collection(db, "notices"), {
        ...postData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isHidden: false,
        author: userLevelData?.name || "관리자",
        writer: userLevelData?.uid || "",
      });

      showToast("공지사항이 등록되었습니다.", "success");
      setShowNoticeEditor(false);
    } catch (error) {
      console.error("Error creating notice:", error);
      showToast("공지사항 등록에 실패했습니다.", "error");
    }
  };

  // 부서명 비교 유틸리티 함수
  const isDepartmentMatch = (dept1, dept2) => {
    // null/undefined/빈 문자열 체크
    if (!dept1 || !dept2) return false;

    // 문자열로 변환
    const dept1Str = String(dept1).trim();
    const dept2Str = String(dept2).trim();

    // 정확히 일치하는 경우
    if (dept1Str === dept2Str) return true;

    // '팀' 명칭 제거 후 비교
    const dept1Base = dept1Str.endsWith("팀")
      ? dept1Str.slice(0, -1)
      : dept1Str;
    const dept2Base = dept2Str.endsWith("팀")
      ? dept2Str.slice(0, -1)
      : dept2Str;

    return dept1Base === dept2Base;
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

          {/* 부서명 비교 유틸리티 함수 */}
          {(() => {
            // 부서명 비교 함수 (팀 명칭 유무에 상관없이 비교)
            const isDepartmentMatch = (dept1, dept2) => {
              // null/undefined/빈 문자열 체크
              if (!dept1 || !dept2) return false;

              // 문자열로 변환
              const dept1Str = String(dept1).trim();
              const dept2Str = String(dept2).trim();

              // 정확히 일치하는 경우
              if (dept1Str === dept2Str) return true;

              // '팀' 명칭 제거 후 비교
              const dept1Base = dept1Str.endsWith("팀")
                ? dept1Str.slice(0, -1)
                : dept1Str;
              const dept2Base = dept2Str.endsWith("팀")
                ? dept2Str.slice(0, -1)
                : dept2Str;

              return dept1Base === dept2Base;
            };

            // 대표원장 확인
            const isOwner = isHospitalOwner(userLevelData, currentUser);

            // 필터링된 공지사항
            const filteredNotices = notices
              .filter((notice) => {
                // 숨겨진 공지는 표시하지 않음
                if (notice.isHidden) return false;

                // 고정된 공지만 표시
                if (!notice.pinned) return false;

                // 대표원장은 모든 공지 확인 가능
                if (isOwner) return true;

                // 부서 정보가 없는 공지는 전체 공개 공지로 간주
                if (!notice.department) return true;

                // '전체' 부서인 공지는 모든 사용자에게 보임
                if (notice.department === "전체") return true;

                // 사용자 부서와 공지 부서 일치 여부 확인
                return isDepartmentMatch(
                  userLevelData?.department,
                  notice.department
                );
              })
              .slice(0, 4);

            // 필터링된 공지사항 렌더링
            return filteredNotices.map((notice) => (
              <RenderTitlePart key={notice.id} row={notice} isHomeMode={true} />
            ));
          })()}

          {notices.filter(
            (notice) =>
              notice.pinned &&
              !notice.isHidden &&
              (isHospitalOwner(userLevelData, currentUser) ||
                !notice.department ||
                notice.department === "전체" ||
                isDepartmentMatch(userLevelData?.department, notice.department))
          ).length === 0 && (
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

          {/* StatusBar 컴포넌트를 조건부로 렌더링 */}
          {(() => {
            // 대표원장 또는 원무과장 여부 체크
            const isOwner = isHospitalOwner(userLevelData, currentUser);
            const isAdminManager = isAdministrativeManager(
              userLevelData,
              currentUser
            );

            if (isOwner || isAdminManager) {
              return (
                <StatusBar
                  currentDate={currentDate}
                  onOpenRequestModal={openRequestStatusModal}
                />
              );
            }
            return null;
          })()}

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
              <div className="w-full h-[200px] overflow-y-auto px-[20px] scrollbar-hide">
                <ReceivedCallList />
              </div>
            </RightTopZone>
            <RightBottomZone className="w-full flex-row flex">
              <div className="w-[240px] h-[240px] flex-col flex justify-between mr-[20px] gap-y-[20px]">
                <div className="w-[240px] flex flex-row justify-between">
                  <div onClick={() => setCallIsVisible(true)}>
                    <Square title={"호출"} />
                  </div>
                  <div onClick={() => setIsModalVisible(true)}>
                    <Square title={"네이버 예약"} />
                  </div>
                </div>
                <div className="w-[240px] flex flex-row justify-between">
                  <div onClick={openChatWindow}>
                    {unreadChatCount > 0 && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white rounded-full px-1.5 min-w-[20px] h-5 flex items-center justify-center text-xs">
                        {unreadChatCount > 99
                          ? "99+"
                          : unreadChatCount > 9
                          ? `${unreadChatCount}+`
                          : unreadChatCount}
                      </div>
                    )}
                    <Square title={"채팅"} />
                  </div>
                  <div
                    onClick={() =>
                      showToast("발신 번호 등록 절차 후 지원됩니다. 😊", "info")
                    }
                  >
                    <Square title={"문자 발송"} />
                  </div>
                </div>
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
                {isHospitalOwner(userLevelData, currentUser) ? (
                  <div className="w-[240px] flex flex-row justify-between">
                    <div onClick={() => setShowNoticeEditor(true)}>
                      <Square title={"공지등록"} />
                    </div>
                    <div onClick={() => setShowTaskAdd(true)}>
                      <Square title={"업무추가"} />
                    </div>
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
                  {isHospitalOwner(userLevelData, currentUser) ? (
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

      {/* 공지등록 에디터 모달 */}
      <TextEditorModal
        show={showNoticeEditor}
        handleClose={() => setShowNoticeEditor(false)}
        content=""
        setContent={() => {}}
        handleSave={handleCreateNotice}
        isEditing={false}
      />

      {/* 네이버 예약 모달 추가 */}
      <NaverReservationViewer
        isVisible={isModalVisible}
        setIsVisible={setIsModalVisible}
        onDataExtract={handleExtractedData}
      />
    </div>
  );
}
