import React, { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  rectSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styled from "styled-components";
import { format } from "date-fns";
import { collection, query, onSnapshot, where } from "firebase/firestore";

// 커스텀 컴포넌트
import DragGoalFolder from "./DragGoalFolder";
import DroppableFolder from "./DroppableFolder";
import ModalTemplate from "../common/ModalTemplate";
import { cancel } from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import { JcyCalendar } from "../common/JcyCalendar";
import NameCoin from "../common/NameCoin";
import TaskAddModal from "./TaskAddModal";
import TaskRecordModal from "./TaskRecordModal";
import ToDo from "../common/ToDo";
import JcyTable from "../common/JcyTable";
import DateViewModal from "./DateViewModal";

// 서비스 및 컨텍스트
import {
  getAllTasks,
  getTasksByDate,
  addTask,
  assignTask,
  completeTask,
  getTaskHistory,
  deleteTask,
  updateTask,
} from "./TaskService";
import { db } from "../../firebase";
import { useToast } from "../../contexts/ToastContext";

// styled-components 영역
const TitleZone = styled.div``;
const PaginationZone = styled.div``;
const ColorZone = styled.div``;
const TextZone = styled.div``;
const ManagingZone = styled.div``;
const ModalHeaderZone = styled.div``;
const ModalContentZone = styled.div``;
const DayCol = styled.div``;
const ThreeButton = styled.div``;
const InforationZone = styled.div``;
const InfoRow = styled.div``;

// 모드 토글 스위치 컴포넌트 - 스타일드 컴포넌트로 정의
const ToggleContainer = styled.div`
  display: flex;
  position: relative;
  width: 340px;
  height: 50px;
  margin-left: 25px;
  border-radius: 30px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  background-color: #f5f5f5;
`;

const ToggleOption = styled.div.attrs((props) => ({
  // active 속성은 styled-components 내부에서만 사용하고 HTML로 전달하지 않도록 함
  "data-active": props.active ? "true" : "false",
}))`
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50%;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.3s ease;
  color: ${(props) => (props.active ? "#fff" : "#555")};
  font-size: 16px;
`;

const ToggleSlider = styled.div.attrs((props) => ({
  // position 속성을 HTML로 전달하지 않도록 함
  "data-position": props.position || "left",
}))`
  position: absolute;
  top: 4px;
  left: ${(props) => (props.position === "left" ? "4px" : "50%")};
  width: calc(50% - 8px);
  height: calc(100% - 8px);
  background-color: #007bff;
  border-radius: 16px;
  transition: left 0.3s ease;
`;

const ToggleIcon = styled.span`
  margin-right: 10px;
  font-size: 22px;
`;

// ★ 폴더 컨테이너: 폴더 느낌의 디자인과 드래그 시 애니메이션 효과 적용 ★
const FolderContainer = styled.div.attrs((props) => ({
  // isOver 속성을 HTML로 전달하지 않도록 함
  "data-is-over": props.isOver ? "true" : "false",
}))`
  width: 300px;
  background: ${(props) => (props.isOver ? "#e0f7fa" : "#f7f7f7")};
  border-radius: 12px;
  padding: 15px;
  box-shadow: ${(props) =>
    props.isOver
      ? "0 5px 15px rgba(0, 0, 0, 0.2)"
      : "0 2px 5px rgba(0, 0, 0, 0.1)"};
  transition: transform 0.3s ease, background 0.3s ease, border-color 0.3s ease,
    box-shadow 0.3s ease;
  transform: ${(props) => (props.isOver ? "scale(1.05)" : "scale(1)")};
  cursor: pointer;
  margin-bottom: 20px;
`;

// 상태에 따른 배지 컬러 정의
const statusColors = {
  "현재 업무": "bg-green-100 text-green-800 border-green-200",
  "지난 업무": "bg-gray-100 text-gray-600 border-gray-200",
  "예정 업무": "bg-blue-100 text-blue-800 border-blue-200",
};

// 우선순위에 따른 색상 정의 (팬시한 스타일)
const priorityBadgeColors = {
  상: "bg-red-100 text-red-800 border-red-200",
  중: "bg-yellow-100 text-yellow-800 border-yellow-200",
  하: "bg-green-100 text-green-800 border-green-200",
};

// 초기 컬럼 데이터 - 부서와 역할명만 유지
const initialColumns = {
  미배정: {
    id: "미배정",
    title: "미배정",
    taskIds: [],
  },
  원장: {
    id: "원장",
    title: "원장",
    taskIds: [],
  },
  경영지원팀장: {
    id: "경영지원팀장",
    title: "경영지원팀장",
    taskIds: [],
  },
  원무과장: {
    id: "원무과장",
    title: "원무과장",
    taskIds: [],
  },
  간호팀장: {
    id: "간호팀장",
    title: "간호팀장",
    taskIds: [],
  },
  물리치료팀장: {
    id: "물리치료팀장",
    title: "물리치료팀장",
    taskIds: [],
  },
  방사선팀장: {
    id: "방사선팀장",
    title: "방사선팀장",
    taskIds: [],
  },
  경영지원팀: {
    id: "경영지원팀",
    title: "경영지원팀",
    taskIds: [],
  },
  원무팀: {
    id: "원무팀",
    title: "원무팀",
    taskIds: [],
  },
  간호팀: {
    id: "간호팀",
    title: "간호팀",
    taskIds: [],
  },
  물리치료팀: {
    id: "물리치료팀",
    title: "물리치료팀",
    taskIds: [],
  },
  방사선팀: {
    id: "방사선팀",
    title: "방사선팀",
    taskIds: [],
  },
};

// 폴더 그룹 배열 정의 - 컴포넌트 외부로 호이스팅
const folderGroups = [
  ["미배정", "원장"],
  ["원무과장", "간호팀장", "물리치료팀장", "방사선팀장"],
  ["간호팀", "원무팀", "물리치료팀", "방사선팀", "경영지원팀"],
];

/* ==============================================
   내부 ToDoItem 컴포넌트 (기존 UI)
============================================== */
// 중요도에 따른 색상 매핑
const priorityColors = {
  상: "bg-red-400",
  중: "bg-yellow-400",
  하: "bg-green-400",
};

function ToDoItem({ task, onViewHistory, onClick }) {
  const [whoModalOpen, setWhoModalOpen] = useState(false);

  // 중요도 기본값 설정
  const priority = task?.priority || "중";

  // 업무 이력 보기 핸들러
  const handleViewHistory = (e) => {
    e.stopPropagation();
    if (onViewHistory) {
      onViewHistory(task);
    }
  };

  // 클릭 핸들러 추가
  const handleClick = () => {
    if (onClick && task) {
      onClick(task);
    }
  };

  return (
    <div
      className="h-[56px] flex flex-row w-[300px] items-center bg-onceBackground mb-[4px] cursor-pointer"
      onClick={handleClick}
    >
      <ColorZone className={`w-[20px] h-full ${priorityColors[priority]}`} />
      <TextZone className="flex-1 px-[20px]">
        <span>{task?.title || task?.content || "제목 없음"}</span>
      </TextZone>

      {/* 완료된 경우 이력 버튼 표시 */}
      {task?.completed && onViewHistory && (
        <button
          className="text-blue-500 hover:text-blue-700 mr-2"
          onClick={handleViewHistory}
        >
          이력
        </button>
      )}
    </div>
  );
}

/* ==============================================
   1) SortableTask: 드래그 가능한 실제 아이템 컴포넌트
============================================== */
function SortableTask({ id, task, containerId, onViewHistory, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id,
      data: {
        type: "item",
        task,
        containerId,
        realContainerId: task?.assignee || containerId, // 실제 담당자/폴더 ID
        isTaskItem: true, // 이것이 Task 아이템임을 명시
      },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab flex items-center justify-center w-full h-full"
    >
      <ToDoItem task={task} onViewHistory={onViewHistory} onClick={onClick} />
    </div>
  );
}

/* ==============================================
   2) ToDoDragComponent: 상단 unassigned 영역 (9칸 고정 그리드)
============================================== */
export function ToDoDragComponent({
  column,
  tasks,
  onViewHistory,
  onTaskClick,
  selectedFolderId,
}) {
  const totalSlots = 9; // 고정 셀 개수 (3×3)

  // 현재 페이지와 페이지당 항목 수 추출
  const pageData = column.pageData || { currentPage: 1, itemsPerPage: 9 };
  const startIndex = (pageData.currentPage - 1) * pageData.itemsPerPage;
  const endIndex = startIndex + pageData.itemsPerPage;

  // 반드시 배열이 되도록 보장하여 에러 방지
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // 날짜별 보기 모달 상태 관리
  const [showDateModal, setShowDateModal] = useState(false);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);

  // 현재 날짜 기준으로 3일치 날짜 생성 (오늘, 내일, 모레)
  const dateList = useMemo(() => {
    const today = new Date();
    return [0, 1, 2].map((offset) => {
      const date = new Date(today);
      date.setDate(date.getDate() + offset);
      return date;
    });
  }, []);

  // 날짜 포맷팅 함수
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  };

  // 이전 날짜로 이동
  const handlePrevDate = () => {
    if (currentDateIndex > 0) {
      setCurrentDateIndex((prev) => prev - 1);
    }
  };

  // 다음 날짜로 이동
  const handleNextDate = () => {
    if (currentDateIndex < dateList.length - 1) {
      setCurrentDateIndex((prev) => prev + 1);
    }
  };

  // 날짜별 보기 모달 열기
  const handleOpenDateModal = () => {
    console.log("날짜별 보기 모달 열기");
    setShowDateModal(true);
  };

  // 날짜별 보기 모달 닫기
  const handleCloseDateModal = () => {
    console.log("날짜별 보기 모달 닫기");
    setShowDateModal(false);
  };

  // 현재 페이지에 표시할 작업 ID들
  const taskIdsToUse = safeTasks
    .slice(startIndex, endIndex)
    .map((task) => task.id);

  // 고정된 9개 슬롯에 작업 ID 배치
  const fixedSlots = Array.from({ length: totalSlots }, (_, index) =>
    taskIdsToUse[index] ? taskIdsToUse[index] : `empty-${index}-${column.id}`
  );

  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: "container",
      containerId: column.id,
      assignee: column.title, // assignee 정보 추가
    },
  });

  const cellStyle = {
    width: "33.33%",
    height: "33.33%",
    padding: "4px",
    boxSizing: "border-box",
  };

  const gridPositions = [
    { left: "0%", top: "0%" },
    { left: "33.33%", top: "0%" },
    { left: "66.66%", top: "0%" },
    { left: "0%", top: "33.33%" },
    { left: "33.33%", top: "33.33%" },
    { left: "66.66%", top: "33.33%" },
    { left: "0%", top: "66.66%" },
    { left: "33.33%", top: "66.66%" },
    { left: "66.66%", top: "66.66%" },
  ];

  // 태스크 데이터 가져오기 (배열 또는 객체 형태 모두 지원)
  const getTaskData = (taskId) => {
    if (!taskId || taskId.toString().startsWith("empty-")) return null;

    // tasks가 배열인 경우
    if (Array.isArray(safeTasks)) {
      const task = safeTasks.find((t) => t.id === taskId);
      return task || null;
    }

    // tasks가 객체인 경우 (이전 버전 호환성)
    return safeTasks[taskId] || null;
  };

  return (
    <div className="mb-[2] relative">
      {/* DragGoalFolder와 같은 꼭지 부분 추가 */}
      <div className="relative inline-block bottom-[-5px]">
        <svg
          className="w-[198px] h-[33px]"
          viewBox="0 0 198 33"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon
            points="0,0 154,0 198,33 0,33"
            className="fill-white stroke-gray-50 stroke-[8]"
          />
          <foreignObject x="0" y="0" width="143" height="33">
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              className="flex items-center justify-center w-full h-full text-black border-l-[8px] border-gray-50"
            >
              {column.title}
            </div>
          </foreignObject>
        </svg>
      </div>

      {/* 기존 그리드 영역 */}
      <div className="relative">
        <div
          ref={setNodeRef}
          className="relative bg-gray-50 p-4 rounded shadow h-[280px] w-full"
        >
          {/* 우상단 포스트잇 스타일의 날짜별 보기 탭 - 그리드와 딱 맞닿게 배치 */}
          <div className="absolute right-4 -top-[60px] z-10">
            {/* 단일 파란색 탭 */}
            <div
              className="relative w-24 h-[60px] cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
              onClick={handleOpenDateModal} // 모달 열기 함수 연결
              title="날짜별 보기"
            >
              {/* 상단 색상 부분 */}
              <div className="h-6 bg-onceBlue rounded-t-md shadow-sm border-t border-l border-r border-gray-200 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>

              {/* 반투명 중간 부분 */}
              <div className="h-[36px] bg-onceChipBlue bg-opacity-90 rounded-b-none border-l border-r border-gray-200 shadow-sm flex items-center justify-center">
                <span className="text-onceBlue text-sm font-medium">
                  날짜별 보기
                </span>
              </div>
            </div>
          </div>

          <SortableContext items={fixedSlots}>
            {fixedSlots.map((id, index) => {
              const pos = gridPositions[index];
              const isEmpty = id.toString().startsWith("empty-");
              const taskData = getTaskData(id);

              return (
                <div
                  key={id}
                  style={{
                    ...cellStyle,
                    position: "absolute",
                    left: pos.left,
                    top: pos.top,
                  }}
                >
                  {isEmpty ? (
                    <div className="w-full h-full rounded border border-dashed"></div>
                  ) : (
                    <SortableTask
                      id={id}
                      task={taskData}
                      containerId={column.id}
                      onViewHistory={onViewHistory}
                      onClick={onTaskClick}
                    />
                  )}
                </div>
              );
            })}
          </SortableContext>
        </div>
      </div>

      {/* 날짜별 보기 모달 - isVisible 속성 직접 전달 */}
      <DateViewModal
        isVisible={showDateModal}
        onClose={handleCloseDateModal}
        column={column}
        tasks={tasks}
        selectedFolderId={selectedFolderId}
      />
    </div>
  );
}

/* ==============================================
   TaskRow: 개별 업무 행을 렌더링하는 컴포넌트
============================================== */
function TaskRow({ task, onClick }) {
  // 현재 날짜 구하기
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 시간 부분 제거하여 날짜만 비교

  // 시작일과 종료일 파싱 - 더 안전하게 수정
  const parseTaskDate = (dateValue) => {
    if (!dateValue) return null;

    try {
      // Timestamp 객체인 경우 (Firebase)
      if (typeof dateValue === "object" && dateValue.seconds) {
        return new Date(dateValue.seconds * 1000);
      }

      // Date 객체인 경우
      if (dateValue instanceof Date) {
        return new Date(dateValue); // 새 객체로 복사
      }

      // 문자열인 경우
      if (typeof dateValue === "string") {
        // 유효한 날짜 문자열인지 확인
        const parsedDate = new Date(dateValue);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
        return null;
      }

      // 숫자인 경우 (타임스탬프)
      if (typeof dateValue === "number") {
        return new Date(dateValue);
      }

      return null;
    } catch (error) {
      console.error("날짜 파싱 에러:", error, dateValue);
      return null;
    }
  };

  // 날짜 포맷팅 - 더 안전하게 수정
  const formatDateField = (dateValue) => {
    const date = parseTaskDate(dateValue);
    if (!date) return "-";

    try {
      return format(date, "yyyy/MM/dd");
    } catch (error) {
      console.error("날짜 포맷 에러:", error, dateValue);
      return "-";
    }
  };

  // 요일 구하기 함수 추가
  const getDayOfWeek = (dateValue) => {
    const date = parseTaskDate(dateValue);
    if (!date) return "";

    try {
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      return days[date.getDay()];
    } catch (error) {
      console.error("요일 계산 에러:", error, dateValue);
      return "";
    }
  };

  // 상태 결정 함수 - 더 안전하게 수정
  const getTaskStatus = () => {
    const startDate = parseTaskDate(task.startDate);
    const endDate = parseTaskDate(task.endDate);

    if (!startDate || !endDate) return "현재 업무"; // 날짜 정보가 없는 경우 기본값

    try {
      if (today >= startDate && today <= endDate) {
        return "현재 업무";
      } else if (today > endDate) {
        return "지난 업무";
      } else if (today < startDate) {
        return "예정 업무";
      }
    } catch (error) {
      console.error("상태 결정 중 에러:", error, { startDate, endDate, today });
      return "현재 업무"; // 에러 발생 시 기본값
    }

    return "현재 업무"; // 기본값
  };

  const taskStatus = getTaskStatus();

  // 툴크 텍스트 생성
  const tooltipText = `시작일: ${formatDateField(
    task.startDate
  )} (${getDayOfWeek(task.startDate)})
종료일: ${formatDateField(task.endDate)} (${getDayOfWeek(task.endDate)})`;

  // JcyTable에서 사용하기 위한 이벤트 핸들러
  const handleClick = () => {
    if (onClick) {
      onClick(task);
    }
  };

  return {
    onClick: handleClick,
    priority: (
      <div className="flex items-center justify-center">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            priorityBadgeColors[task.priority] ||
            "bg-gray-100 text-gray-800 border-gray-200"
          }`}
        >
          {task.priority || "중"}
        </span>
      </div>
    ),
    title: (
      <div className="font-medium text-gray-900 truncate">{task.title}</div>
    ),
    assignee: (
      <div className="flex items-center justify-center">
        <div className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-sm truncate">
          {task.assignee || "미배정"}
        </div>
      </div>
    ),
    category: (
      <div className="flex items-center justify-center">
        <div className="text-gray-600 text-sm truncate">
          {task.category || "1회성"}
        </div>
      </div>
    ),
    status: (
      <div className="flex items-center justify-center">
        <div
          className={`inline-flex items-center px-2.5 py-1.5 rounded text-sm font-medium ${statusColors[taskStatus]}`}
          title={tooltipText}
        >
          {taskStatus}
        </div>
      </div>
    ),
    writer: (
      <div className="flex items-center justify-center">
        <div className="text-gray-600 text-sm truncate">
          {task.writer || "-"}
        </div>
      </div>
    ),
  };
}

/* ==============================================
   TaskBoardView: 게시판 형태로 보여주는 컴포넌트 
============================================== */
function TaskBoardView({
  tasks,
  onViewHistory,
  onTaskClick,
  selectedFolderId,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // 페이지당 10개 항목
  const [filters, setFilters] = useState({
    categories: [],
    priorities: [],
    statuses: [],
    sortBy: "endDate", // 기본 정렬 기준
    sortDir: "asc", // 오름차순
  });

  // 필터링 및 정렬된 데이터 가져오기
  const getFilteredData = () => {
    let filteredTasks = [...tasks];

    // 카테고리 필터
    if (filters.categories.length > 0) {
      filteredTasks = filteredTasks.filter((task) =>
        filters.categories.includes(task.category)
      );
    }

    // 우선순위 필터
    if (filters.priorities.length > 0) {
      filteredTasks = filteredTasks.filter((task) =>
        filters.priorities.includes(task.priority)
      );
    }

    // 정렬
    if (filters.sortBy) {
      filteredTasks.sort((a, b) => {
        const aValue = a[filters.sortBy];
        const bValue = b[filters.sortBy];
        if (aValue < bValue) {
          return filters.sortDir === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return filters.sortDir === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredTasks;
  };

  const filteredData = getFilteredData();

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 테이블 컬럼 정의 - 시작일과 종료일을 "현황"으로 변경
  const columns = [
    { label: "우선순위", key: "priority" },
    { label: "제목", key: "title" },
    { label: "담당자", key: "assignee" },
    { label: "카테고리", key: "category" },
    { label: "현황", key: "status" },
    { label: "작성자", key: "writer" },
  ];

  // JcyTable에 맞게 renderRow 함수를 다시 추가
  const renderRow = (task) => {
    const rowData = TaskRow({ task, onClick: onTaskClick });
    return (
      <div
        className="grid grid-cols-[0.8fr_2.5fr_1fr_0.8fr_1fr_0.8fr] border-b border-gray-200 hover:bg-gray-50 py-3"
        onClick={rowData.onClick}
      >
        <div className="px-3">{rowData.priority}</div>
        <div className="px-3">{rowData.title}</div>
        <div className="px-3">{rowData.assignee}</div>
        <div className="px-3">{rowData.category}</div>
        <div className="px-3">{rowData.status}</div>
        <div className="px-3">{rowData.writer}</div>
      </div>
    );
  };

  // 빈 데이터 표시 커스텀 메시지 - 높이 조정
  const emptyMessage = (
    <div
      style={{ height: "calc(60px * 6 - 2px)" }}
      className="w-full flex items-center justify-center border-b border-gray-200"
    >
      <p className="text-gray-500 text-lg">데이터가 없습니다</p>
    </div>
  );

  return (
    <div className="w-full flex flex-col h-full">
      {/* JcyTable 컴포넌트 사용 - 커스텀 그리드 비율 적용 */}
      <div className="flex-grow flex flex-col" style={{ minHeight: "600px" }}>
        <JcyTable
          columns={columns}
          data={filteredData}
          columnWidths="grid-cols-[0.8fr_2.5fr_1fr_0.8fr_1fr_0.8fr]" // 제목 컬럼 넓게, 나머지 좁게
          itemsPerPage={6}
          renderRow={renderRow}
          emptyRowHeight="60px"
          emptyMessage={emptyMessage}
          onSort={() => {}}
          sortConfig={{ key: filters.sortBy, direction: filters.sortDir }}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          showPagination={true}
          centerAlignHeaders={true}
        />
      </div>
    </div>
  );
}

// 날짜 처리 유틸 함수를 컴포넌트 외부로 분리하여 재사용성 높이기
export const safeParseDate = (dateValue) => {
  if (!dateValue) return null;

  try {
    // Timestamp 객체인 경우 (Firebase)
    if (typeof dateValue === "object" && dateValue.seconds) {
      return new Date(dateValue.seconds * 1000);
    }

    // Date 객체인 경우
    if (dateValue instanceof Date) {
      return new Date(dateValue); // 새 객체로 복사
    }

    // 문자열인 경우
    if (typeof dateValue === "string") {
      // 유효한 날짜 문자열인지 확인
      const parsedDate = new Date(dateValue);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
      return null;
    }

    // 숫자인 경우 (타임스탬프)
    if (typeof dateValue === "number") {
      return new Date(dateValue);
    }

    return null;
  } catch (error) {
    console.error("날짜 파싱 에러:", error, dateValue);
    return null;
  }
};

export const safeFormatDate = (dateValue, formatStr = "yyyy/MM/dd") => {
  const date = safeParseDate(dateValue);
  if (!date) return "-";

  try {
    return format(date, formatStr);
  } catch (error) {
    console.error("날짜 포맷 에러:", error, dateValue);
    return "-";
  }
};

/* ==============================================
   4) TaskMainCanvas: 메인 컴포넌트
   - DndContext 내에서 상단 unassigned 영역과 하단 인원별 폴더 영역을 렌더링
   - onDragStart, onDragEnd 이벤트에서 항목 이동 및 재정렬 처리
============================================== */
function TaskMainCanvas() {
  // 핵심 상태 관리
  const [tasks, setTasks] = useState([]); // 모든 작업 목록
  const [columns, setColumns] = useState(initialColumns); // 컬럼별 작업 ID 매핑
  const [activeTaskId, setActiveTaskId] = useState(null); // 드래그 중인 작업 ID
  const [selectedTask, setSelectedTask] = useState(null); // 선택된 작업 (상세보기/편집용)
  const [currentPage, setCurrentPage] = useState(1); // 페이지네이션 현재 페이지
  const [itemsPerPage] = useState(9); // 페이지당 항목 수
  const [currentDate, setCurrentDate] = useState(new Date()); // 현재 선택된 날짜
  const [taskAddModalOn, setTaskAddModalOn] = useState(false); // 작업 추가 모달 표시 여부
  const [taskHistoryModalOn, setTaskHistoryModalOn] = useState(false); // 작업 이력 모달 표시 여부
  const [isEditMode, setIsEditMode] = useState(false); // 편집 모드 여부
  const [selectedFolderId, setSelectedFolderId] = useState("미배정"); // 선택된 폴더 ID
  const [viewMode, setViewMode] = useState("dnd"); // 뷰 모드 (dnd: 드래그 앤 드롭 모드, board: 게시판 모드)
  const [filteredTasks, setFilteredTasks] = useState([]); // 필터링된 작업 목록

  // 파생 상태 대신 useEffect 사용하여 tasks나 selectedFolderId가 변경될 때마다 필터링
  useEffect(() => {
    if (!tasks || !Array.isArray(tasks)) {
      setFilteredTasks([]);
      return;
    }

    // selectedFolderId에 따라 작업 필터링
    if (selectedFolderId === "미배정") {
      const unassignedTasks = tasks.filter(
        (task) => !task.assignee || task.assignee === "미배정"
      );
      setFilteredTasks(unassignedTasks);
      console.log("미배정 작업 필터링:", unassignedTasks.length);
    } else if (selectedFolderId) {
      const filtered = tasks.filter((task) => {
        const taskAssignee = (task.assignee || "").trim();
        const folderId = selectedFolderId.trim();
        return taskAssignee.toLowerCase() === folderId.toLowerCase();
      });

      console.log(`[${selectedFolderId}] 폴더 작업 필터링:`, {
        총작업수: tasks.length,
        필터링결과: filtered.length,
      });

      setFilteredTasks(filtered);
    } else {
      // 선택된 폴더가 없으면 전체 작업 표시
      setFilteredTasks(tasks);
      console.log("전체 작업 표시:", tasks.length);
    }
  }, [tasks, selectedFolderId]);

  // Toast 메시지를 사용하기 위한 훅
  const { showToast } = useToast();

  // ID로 작업 찾기
  const getTaskById = (taskId) => {
    if (!taskId || !tasks || !Array.isArray(tasks)) return null;
    return tasks.find((task) => task.id === taskId) || null;
  };

  // 전체 페이지 계산 - 필터링된 작업 개수에 기반함
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTasks.length / itemsPerPage)
  );
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 15 },
    })
  );

  // 폴더 선택 처리 함수 - 간소화됨
  const handleFolderSelect = (folderId) => {
    // 이미 선택된 폴더를 다시 클릭하면 선택 해제
    if (selectedFolderId === folderId) {
      setSelectedFolderId("미배정");
      console.log("폴더 선택 해제, 미배정으로 전환");

      // 미배정 폴더로 전환 시 해당 작업 목록을 즉시 필터링
      // if (tasks && Array.isArray(tasks)) {
      //   const unassignedTasks = tasks.filter(
      //     (task) => !task.assignee || task.assignee === "미배정"
      //   );
      //   setFilteredTasks(unassignedTasks);
      // }
    } else {
      // 새 폴더 선택
      setSelectedFolderId(folderId);
      // 새 폴더 선택 시 해당 작업 목록을 즉시 필터링
      // if (tasks && Array.isArray(tasks)) {
      //   const newFilteredTasks = tasks.filter((task) => {
      //     const taskAssignee = (task.assignee || "").trim();
      //     const newFolderId = folderId.trim();
      //     return taskAssignee.toLowerCase() === newFolderId.toLowerCase();
      //   });
      //   // 필터링된 결과를 설정 (업무가 없어도 빈 배열을 설정)
      //   setFilteredTasks(newFilteredTasks);
      // }
    }

    // 페이지 초기화
    // setCurrentPage(1);
  };

  // Firebase에서 모든 업무 실시간 감지
  useEffect(() => {
    // Firestore 쿼리 생성 - 현재 날짜 범위에 해당하는 업무 조회
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const tasksQuery = query(
      collection(db, "tasks"),
      where("startDate", "<=", endOfDay),
      where("endDate", ">=", startOfDay)
    );

    // 실시간 리스너 설정
    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const fetchedTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 업무 목록 업데이트
        setTasks(fetchedTasks);

        // 컬럼별로 업무 분류
        updateColumns(fetchedTasks);
      },
      (error) => {
        console.error("Error fetching tasks:", error);
      }
    );

    // 컴포넌트 언마운트 시 리스너 제거
    return () => unsubscribe();
  }, [currentDate]); // selectedFolderId는 필요하지 않음 - 제거

  // 컬럼별로 업무 분류하는 함수 - 개선됨
  const updateColumns = (taskList) => {
    // 모든 컬럼 초기화
    const updatedColumns = { ...initialColumns };
    Object.keys(updatedColumns).forEach((key) => {
      updatedColumns[key].taskIds = [];
    });

    // 담당자별로 업무 분류
    taskList.forEach((task) => {
      // null, undefined 체크 추가
      if (!task) return;

      const assignee = task.assignee || "미배정";

      // 해당 assignee에 맞는 컬럼이 있는지 확인
      if (updatedColumns[assignee]) {
        updatedColumns[assignee].taskIds.push(task.id);
      } else {
        // 일치하는 컬럼이 없으면 미배정으로 처리
        updatedColumns.미배정.taskIds.push(task.id);
      }
    });

    // 각 컬럼별 taskIds 개수 확인
    const taskCounts = {};
    Object.keys(updatedColumns).forEach((key) => {
      taskCounts[key] = updatedColumns[key].taskIds.length;
    });
    setColumns(updatedColumns);

    /* 자동 전환 기능 비활성화 - 사용자가 직접 선택한 폴더는 유지
    // 현재 선택된 폴더의 작업 수가 0이고, 다른 폴더에 작업이 있으면 자동으로 미배정으로 전환
    if (
      selectedFolderId !== "미배정" &&
      updatedColumns[selectedFolderId]?.taskIds.length === 0 &&
      Object.values(taskCounts).some((count) => count > 0)
    ) {
      setSelectedFolderId("미배정");
    }
    */
  };

  // 업무 담당자 변경 핸들러 - 개선됨
  const updateTaskAssignee = async (
    taskId,
    assignee,
    autoSelectFolder = false
  ) => {
    try {
      // Firebase에서 업무 담당자 변경 및 이력 추가
      await assignTask(taskId, assignee, "업무분장 페이지");

      // 현재 업무 목록 새로고침
      const updatedTasks = await getTasksByDate(currentDate);

      // 업데이트된 업무가 올바른 assignee를 가지고 있는지 확인
      const updatedTask = updatedTasks.find((task) => task.id === taskId);
      // 전체 작업 목록 업데이트 - 이것이 filteredTasks를 자동으로 업데이트함
      setTasks(updatedTasks);

      // 담당자가 변경된 경우, 필요시 해당 폴더로 자동 전환
      if (autoSelectFolder) {
        setSelectedFolderId(assignee);
      }

      // 컬럼별로 업무 분류 다시 실행 - 기존 컬럼에 덮어쓰지 않고 업데이트
      const updatedColumns = { ...columns };

      // 업데이트된 업무 목록에 맞게 taskIds 업데이트
      updatedTasks.forEach((task) => {
        const taskAssignee = task.assignee || "미배정";

        // 해당 assignee 컬럼이 있는지 확인
        if (updatedColumns[taskAssignee]) {
          // 이미 이 taskId가 있는지 확인
          if (!updatedColumns[taskAssignee].taskIds.includes(task.id)) {
            updatedColumns[taskAssignee].taskIds.push(task.id);
          }
        } else {
          // 일치하는 컬럼이 없으면 미배정으로 처리
          if (!updatedColumns.미배정.taskIds.includes(task.id)) {
            updatedColumns.미배정.taskIds.push(task.id);
          }
        }
      });

      // 존재하지 않는 업무 ID는 제거
      const validTaskIds = updatedTasks.map((task) => task.id);
      Object.keys(updatedColumns).forEach((key) => {
        updatedColumns[key].taskIds = updatedColumns[key].taskIds.filter((id) =>
          validTaskIds.includes(id)
        );
      });

      // 컬럼 상태 업데이트
      setColumns(updatedColumns);
    } catch (error) {
      console.error("Error updating task assignee:", error);
    }
  };

  // 업무 추가 핸들러
  const handleTaskAdd = async (newTask) => {
    try {
      // Firebase에 업무 추가
      const addedTask = await addTask(newTask);

      // 현재 업무 목록 새로고침 - 이렇게 하면 filteredTasks도 자동으로 업데이트됨
      const updatedTasks = await getTasksByDate(currentDate);
      setTasks(updatedTasks);

      // 컬럼별로 업무 분류 다시 실행
      updateColumns(updatedTasks);

      // 성공 메시지 표시
      showToast("업무가 성공적으로 추가되었습니다.", "success");
    } catch (error) {
      console.error("Error adding task:", error);
      showToast("업무 추가 중 오류가 발생했습니다.", "error");
    }
  };

  // 업무 편집 핸들러
  const handleTaskEdit = async (updatedTask) => {
    try {
      // Firebase에서 업무 정보 업데이트
      await updateTask(updatedTask);

      // 현재 업무 목록 새로고침 - 이렇게 하면 filteredTasks도 자동으로 업데이트됨
      const updatedTasks = await getTasksByDate(currentDate);
      setTasks(updatedTasks);

      // 컬럼별로 업무 분류 다시 실행
      updateColumns(updatedTasks);

      showToast("업무가 성공적으로 수정되었습니다.", "success");
    } catch (error) {
      console.error("Error updating task:", error);
      showToast("업무 수정 중 오류가 발생했습니다.", "error");
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
        // 필요한 경우 다른 필드도 확인
      };

      setSelectedTask(safeTask);
      setTaskHistoryModalOn(true);
    } catch (error) {
      console.error("Error fetching task history:", error);
    }
  };

  // 업무 삭제 핸들러
  const handleTaskDelete = async (taskId) => {
    try {
      // Firebase에서 업무 삭제
      await deleteTask(taskId);

      // 업무 목록에서 삭제된 업무 제거
      setTasks((prev) => prev.filter((task) => task.id !== taskId));

      // 모든 컬럼에서 삭제된 업무 ID 제거
      setColumns((prev) => {
        const updatedColumns = { ...prev };
        Object.keys(updatedColumns).forEach((columnId) => {
          updatedColumns[columnId] = {
            ...updatedColumns[columnId],
            taskIds: updatedColumns[columnId].taskIds.filter(
              (id) => id !== taskId
            ),
          };
        });
        return updatedColumns;
      });

      // 모달 닫기 및 선택된 업무 초기화
      setTaskAddModalOn(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleDragStart = (event) => {
    try {
      const taskId = event.active.id;
      const taskData = getTaskById(taskId);

      // 드래그 시작 정보 로깅
      console.log("🔄 드래그 시작:", {
        taskId,
        taskTitle: taskData?.title,
        containerId:
          event.active.data.current?.containerId ||
          event.active.data.current?.sortable?.containerId,
        currentAssignee: taskData?.assignee || "미배정",
      });

      setActiveTaskId(event.active.id);
    } catch (error) {
      console.error("드래그 시작 중 오류:", error);
    }
  };

  // 폴더의 ID를 명시적으로 확인하는 함수
  const isFolder = (id) => {
    return Object.keys(initialColumns).includes(id);
  };

  // Sortable 컨테이너인지 확인하는 함수
  const isSortableContainer = (id) => {
    return id && typeof id === "string" && id.startsWith("Sortable-");
  };

  // 컬럼 상태 업데이트 함수 - 일관된 방식으로 컬럼 상태를 업데이트
  const updateColumnTaskIds = (updates) => {
    setColumns((prevColumns) => {
      const newColumns = { ...prevColumns };

      // 각 업데이트 적용
      Object.entries(updates).forEach(([columnId, taskIds]) => {
        if (newColumns[columnId]) {
          newColumns[columnId] = {
            ...newColumns[columnId],
            taskIds,
          };
        }
      });

      return newColumns;
    });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    // 드롭 대상이 없는 경우 종료
    if (!over) {
      setActiveTaskId(null);
      return;
    }

    const taskId = active.id;

    // containerId 추출 로직 개선
    // 1. data.current.sortable.containerId (SortableContext에서 올 때)
    // 2. data.current.containerId (일반 드래그 아이템일 때)
    const activeContainer =
      active.data.current?.sortable?.containerId ||
      active.data.current?.containerId;
    const overContainer =
      over.data.current?.sortable?.containerId ||
      over.data.current?.containerId ||
      over.id;

    // 실제 담당자(assignee) 결정을 위한 ID 추출
    // Sortable- 접두사가 있는 경우 해당 컨테이너의 data.current.containerId 또는 data.current.assignee 사용
    const getActualAssignee = (container, dataObj) => {
      // 폴더 타입 먼저 확인 (더 명시적인 정보)
      if (dataObj?.folderType === "DragGoalFolder" || dataObj?.isRealFolder) {
        console.log(
          "📂 실제 폴더 감지:",
          dataObj.assignee || dataObj.containerId || container
        );
        return dataObj.assignee || dataObj.containerId || container;
      }

      // Sortable- 접두사가 있는 경우
      if (
        container &&
        typeof container === "string" &&
        container.startsWith("Sortable-")
      ) {
        // 데이터 객체에서 직접 containerId나 task.assignee 확인
        const containerId = dataObj?.containerId;
        const taskAssignee = dataObj?.task?.assignee;
        const realContainerId = dataObj?.realContainerId;

        // 우선순위: realContainerId > containerId > taskAssignee
        if (realContainerId && typeof realContainerId === "string") {
          return realContainerId;
        }

        // 그 다음 컨테이너 ID가 있으면 그것을 사용
        if (
          containerId &&
          typeof containerId === "string" &&
          !containerId.startsWith("Sortable-")
        ) {
          return containerId;
        }

        // 작업의 assignee가 있으면 그것을 사용
        if (taskAssignee) {
          return taskAssignee;
        }

        // 그 외의 경우 폴더 title 또는 원래 ID 반환
        return dataObj?.assignee || columns[container]?.title || container;
      }

      // 기본 컨테이너 - 그대로 반환
      return container;
    };

    // 향상된 폴더 ID 확인 함수
    const isActualFolder = (id, dataObj) => {
      // 1. 직접적으로 폴더임을 표시하는 데이터가 있는 경우
      if (dataObj?.folderType === "DragGoalFolder" || dataObj?.isRealFolder) {
        console.log("✅ 폴더 확인 성공 (명시적 데이터):", dataObj);
        return true;
      }

      // 2. 컨테이너의 type이 "container"인 경우
      if (dataObj?.type === "container") {
        console.log("✅ 폴더 확인 성공 (container 타입):", id);
        return true;
      }

      // 3. ID로 폴더 확인 (initialColumns에 있는 경우)
      const isFolderById = isFolder(id);
      if (isFolderById) {
        console.log("✅ 폴더 확인 성공 (ID 기반):", id);
      }

      return isFolderById;
    };

    // 새 담당자 결정
    const newAssignee = getActualAssignee(overContainer, over.data.current);

    console.log("드래그 앤 드롭 정보:", {
      taskId,
      activeContainerId: activeContainer,
      overContainerId: overContainer,
      actualAssignee: newAssignee,
      activeType: active.data.current?.type,
      overType: over.data.current?.type,
      isOverFolder: isActualFolder(overContainer, over.data.current),
      isSortable: isSortableContainer(overContainer),
    });

    // 드래그된 아이템이 task이고, 드랍 컨테이너가 담당자 폴더인 경우
    if (
      (active.data.current?.type === "task" ||
        active.data.current?.type === "item") &&
      (over.data.current?.type === "container" ||
        isActualFolder(overContainer, over.data.current))
    ) {
      // 오버 컨테이너 재설정 - 실제 폴더 ID 사용
      const actualOverContainer = getActualAssignee(
        overContainer,
        over.data.current
      );

      // 컬럼 유효성 검사
      if (!columns[actualOverContainer]) {
        console.error(
          `컬럼을 찾을 수 없습니다: ${actualOverContainer} (원래 ID: ${overContainer})`
        );
        setActiveTaskId(null);
        return;
      }

      try {
        // 담당자 정보 업데이트 - 같은 폴더에 드롭해도 처리하도록 함
        await updateTaskAssignee(taskId, newAssignee, false);
        showToast(`업무 담당이 ${newAssignee}으로 변경되었습니다.`, "success");

        // 현재 작업의 담당자 확인
        const taskData = getTaskById(taskId);
        const currentAssignee = taskData?.assignee || "미배정";

        console.log(`🔄 업무 담당 변경: ${currentAssignee} -> ${newAssignee}`);

        // 업무가 같은 컨테이너로 이동된 경우 UI 업데이트만 하고 종료
        if (currentAssignee === newAssignee) {
          setActiveTaskId(null);
          return;
        }

        // 컬럼 상태 업데이트를 위한 변경 사항 준비
        const updates = {};

        // 출발 컨테이너(기존 담당자)에서 작업 제거
        if (currentAssignee && columns[currentAssignee]) {
          const sourceTaskIds = columns[currentAssignee].taskIds.filter(
            (id) => id !== taskId
          );
          updates[currentAssignee] = sourceTaskIds;
          console.log(`🗑️ 기존 담당자(${currentAssignee})에서 업무 제거`);
        }

        // 도착 컨테이너(새 담당자)에 작업 추가
        if (columns[newAssignee]) {
          // 이미 이 taskId가 새 담당자에 있지 않은 경우에만 추가
          if (!columns[newAssignee].taskIds.includes(taskId)) {
            const destTaskIds = [...columns[newAssignee].taskIds, taskId];
            updates[newAssignee] = destTaskIds;
            console.log(`➕ 새 담당자(${newAssignee})에 업무 추가`);
          } else {
            // 이미 있는 경우 기존 배열 유지
            updates[newAssignee] = [...columns[newAssignee].taskIds];
          }
        }

        // 한 번의 호출로 모든 컬럼 상태 업데이트
        updateColumnTaskIds(updates);
      } catch (error) {
        console.error("업무 할당 중 오류 발생:", error);
        showToast("업무 배치 중 오류가 발생했습니다.", "error");
      }

      setActiveTaskId(null);
      return;
    }

    // 목적지가 폴더인 경우를 처리
    if (isActualFolder(overContainer, over.data.current)) {
      try {
        // 담당자 업데이트
        await updateTaskAssignee(taskId, newAssignee, false);
        showToast(`업무 담당이 ${newAssignee}으로 변경되었습니다.`, "success");

        // 같은 폴더로 이동한 경우 작업은 이미 완료됨 (updateTaskAssignee에서 처리됨)
        if (activeContainer === overContainer) {
          setActiveTaskId(null);
          return;
        }

        // 컬럼 상태 업데이트를 위한 변경 사항 준비
        const updates = {};

        // 출발 컨테이너에서 작업 제거
        if (columns[activeContainer]) {
          updates[activeContainer] = columns[activeContainer].taskIds.filter(
            (id) => id !== taskId
          );
        } else if (isSortableContainer(activeContainer)) {
          // Sortable 컨테이너인 경우, 작업의 이전 담당자 찾기
          const taskData = getTaskById(taskId);
          if (taskData && taskData.assignee && columns[taskData.assignee]) {
            const prevAssignee = taskData.assignee;
            const sourceTaskIds = columns[prevAssignee].taskIds.filter(
              (id) => id !== taskId
            );
            updates[prevAssignee] = sourceTaskIds;
          }
        }

        // 도착 컨테이너에 작업 추가
        if (columns[overContainer]) {
          // 이미 이 taskId가 overContainer에 있지 않은 경우에만 추가
          if (!columns[overContainer].taskIds.includes(taskId)) {
            const destTaskIds = [...columns[overContainer].taskIds, taskId];
            updates[overContainer] = destTaskIds;
          } else {
            // 이미 있는 경우 기존 배열 유지
            updates[overContainer] = [...columns[overContainer].taskIds];
          }
        }

        // 한 번의 호출로 모든 컬럼 상태 업데이트
        updateColumnTaskIds(updates);
      } catch (error) {
        console.error("업무 할당 중 오류 발생 (컨테이너 간 이동):", error);
        showToast("업무 배치 중 오류가 발생했습니다.", "error");
      }

      setActiveTaskId(null);
      return;
    }

    // 같은 컨테이너 내에서의 순서 변경
    if (activeContainer === overContainer) {
      const column = columns[activeContainer];
      if (!column) {
        setActiveTaskId(null);
        return;
      }

      const oldIndex = column.taskIds.indexOf(taskId);
      const newIndex = column.taskIds.indexOf(over.id);

      if (oldIndex !== newIndex) {
        const newTaskIds = arrayMove(column.taskIds, oldIndex, newIndex);
        updateColumnTaskIds({ [activeContainer]: newTaskIds });
        showToast("업무 순서가 변경되었습니다.", "success");
      }
    }
    // Sortable 컨테이너 간 이동
    else if (
      isSortableContainer(activeContainer) &&
      isSortableContainer(overContainer)
    ) {
      // Sortable 컨테이너 간 이동은 처리하지 않음
    }
    // 다른 컨테이너로 이동하는 경우
    else {
      const sourceColumn = columns[activeContainer];
      const destinationColumn = columns[overContainer];

      if (!sourceColumn || !destinationColumn) {
        console.error("소스 또는 대상 컬럼을 찾을 수 없습니다");
        setActiveTaskId(null);
        return;
      }

      try {
        // 담당자 업데이트
        await updateTaskAssignee(taskId, newAssignee, false);
        showToast(`업무 담당이 ${newAssignee}으로 변경되었습니다.`, "success");

        // 출발 컨테이너에서 작업 제거
        const newSourceTaskIds = sourceColumn.taskIds.filter(
          (id) => id !== taskId
        );

        // 도착 컨테이너에 작업 추가 (특정 위치에 삽입)
        const newDestinationTaskIds = [...destinationColumn.taskIds];
        const overIndex = newDestinationTaskIds.indexOf(over.id);

        if (overIndex >= 0) {
          newDestinationTaskIds.splice(overIndex, 0, taskId);
        } else {
          newDestinationTaskIds.push(taskId);
        }

        // 한 번의 호출로 컬럼 상태 업데이트
        updateColumnTaskIds({
          [activeContainer]: newSourceTaskIds,
          [overContainer]: newDestinationTaskIds,
        });
      } catch (error) {
        console.error("업무 할당 중 오류 발생 (컨테이너 간 이동):", error);
        showToast("업무 배치 중 오류가 발생했습니다.", "error");
      }
    }

    setActiveTaskId(null);
  };

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // 날짜에 일(day)를 더하거나 빼는 헬퍼 함수 업데이트
  const addDays = (date, days) => {
    try {
      const parsedDate = safeParseDate(date);
      if (!parsedDate) return new Date(); // 유효하지 않은 경우 오늘 날짜 반환

      const result = new Date(parsedDate);
      result.setDate(result.getDate() + days);
      return result;
    } catch (error) {
      console.error("날짜 계산 중 에러:", error, { date, days });
      return new Date(); // 에러 발생 시 오늘 날짜 반환
    }
  };

  // 날짜를 원하는 형식으로 포맷하는 함수 업데이트
  const formatDate = (date) => {
    return safeFormatDate(date);
  };

  // 왼쪽 버튼 클릭 시: 이전 근무일 (하루 전)
  const handlePrevDay = () => {
    setCurrentDate((prevDate) => addDays(prevDate, -1));
  };

  // 오른쪽 버튼 클릭 시: 이후 근무일 (하루 후)
  const handleNextDay = () => {
    setCurrentDate((prevDate) => addDays(prevDate, 1));
  };

  // 작업 클릭 핸들러 추가
  const handleTaskClick = (task) => {
    if (!task) return;

    setSelectedTask(task);
    setIsEditMode(false); // 처음에는 뷰 모드로 열기
    setTaskAddModalOn(true);
  };

  // TaskAddModal 모드 전환 핸들러
  const handleSwitchToEditMode = () => {
    setIsEditMode(true);
  };

  return (
    <div className="w-full flex flex-col h-full bg-white min-h-[900px] rounded-xl px-[40px] py-[30px]">
      <TitleZone className="w-full mb-[34px] flex flex-row justify-between items-center">
        <div className="flex items-center">
          <span className="text-[34px] font-semibold">업무분장</span>

          {/* 모드 전환 토글 개선 */}
          <ToggleContainer>
            <ToggleSlider position={viewMode === "dnd" ? "left" : "right"} />
            <ToggleOption
              active={viewMode === "dnd"}
              onClick={() => setViewMode("dnd")}
            >
              <ToggleIcon>🗂️</ToggleIcon>
              드래그 모드
            </ToggleOption>
            <ToggleOption
              active={viewMode === "board"}
              onClick={() => setViewMode("board")}
            >
              <ToggleIcon>📋</ToggleIcon>
              게시판 모드
            </ToggleOption>
          </ToggleContainer>
        </div>
        <div className="w-[160px]">
          <OnceOnOffButton
            text={"업무 추가하기 +"}
            on={true}
            onClick={() => {
              setSelectedTask(null); // 새 작업 생성 모드
              setTaskAddModalOn(true);
            }}
          />
        </div>
      </TitleZone>
      {/* 뷰 모드에 따라 다른 컴포넌트 렌더링 */}
      {viewMode === "dnd" ? (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* 드래그 앤 드롭 모드 내용 */}
          <>
            {/* 상단 할 일 목록 (9칸 고정 그리드) - 선택된 폴더가 있으면 해당 폴더의 작업만 표시 */}
            {(() => {
              // 현재 선택된 폴더에 맞게 컬럼 데이터 생성 (key prop 추가)
              const columnData = {
                pageData: { currentPage, itemsPerPage },
                title: selectedFolderId || "미배정",
                id: selectedFolderId || "미배정",
                key: selectedFolderId || "미배정", // 리렌더링을 위한 key 추가
              };

              return (
                <ToDoDragComponent
                  key={`todo-drag-${selectedFolderId}`} // 고유 키 추가
                  column={columnData}
                  tasks={filteredTasks} // 이미 필터링된 작업 목록을 전달
                  onViewHistory={handleViewTaskHistory}
                  onTaskClick={handleTaskClick}
                  selectedFolderId={selectedFolderId}
                />
              );
            })()}

            {/* 페이지네이션 영역 */}
            <PaginationZone className="flex justify-center items-center space-x-2 my-[30px]">
              {totalPages > 1 && (
                <>
                  <button
                    className="px-3 py-1 border border-gray-300 rounded"
                    onClick={handlePrevious}
                  >
                    &lt;
                  </button>
                  {pages.map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded ${
                        page === currentPage
                          ? "bg-[#002D5D] text-white"
                          : "border border-gray-300"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="px-3 py-1 border border-gray-300 rounded"
                    onClick={handleNext}
                  >
                    &gt;
                  </button>
                </>
              )}
            </PaginationZone>

            {/* 폴더 구조 */}
            {/* 폴더 구조 */}
            <div className="flex flex-row gap-x-[20px]">
              <div className="flex-1 flex flex-col items-center gap-y-[10px]">
                <DroppableFolder
                  id="미배정"
                  column={columns.미배정}
                  isSelected={selectedFolderId === "미배정"}
                  onClick={handleFolderSelect}
                >
                  {({ isOver }) => (
                    <>
                      <svg
                        className="w-[198px] h-[33px]"
                        viewBox="0 0 198 33"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polygon
                          points="0,0 154,0 198,33 0,33"
                          className={`fill-white stroke-onceHover stroke-[8] ${
                            isOver ? "fill-blue-50" : ""
                          } ${
                            selectedFolderId === "미배정" ? "fill-blue-100" : ""
                          } ${
                            isOver && selectedFolderId === "미배정"
                              ? "fill-blue-200"
                              : ""
                          }`}
                        />
                        <foreignObject x="0" y="0" width="143" height="33">
                          <div
                            xmlns="http://www.w3.org/1999/xhtml"
                            className={`flex items-center justify-center w-full h-full text-black border-l-[8px] ${
                              isOver ? "border-blue-400" : "border-onceHover"
                            } ${
                              selectedFolderId === "미배정"
                                ? "font-bold border-blue-500"
                                : ""
                            } ${
                              isOver && selectedFolderId === "미배정"
                                ? "border-blue-600"
                                : ""
                            }`}
                          >
                            미배정
                          </div>
                        </foreignObject>
                      </svg>
                      <div
                        className={`w-[240px] h-[50px] bg-onceHover flex flex-wrap gap-2 justify-center items-center ${
                          selectedFolderId === "미배정" && !isOver
                            ? "bg-blue-100"
                            : ""
                        } ${
                          isOver && selectedFolderId !== "미배정"
                            ? "bg-blue-50"
                            : ""
                        } ${
                          isOver && selectedFolderId === "미배정"
                            ? "bg-blue-200"
                            : ""
                        }`}
                      >
                        {columns.미배정.taskIds?.length > 0 && (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              selectedFolderId === "미배정" && !isOver
                                ? "bg-blue-200"
                                : "bg-gray-200"
                            } ${
                              isOver && selectedFolderId !== "미배정"
                                ? "bg-blue-100"
                                : ""
                            } ${
                              isOver && selectedFolderId === "미배정"
                                ? "bg-blue-300"
                                : ""
                            }`}
                          >
                            {`+${columns.미배정.taskIds.length}`}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </DroppableFolder>
                <DroppableFolder
                  id="원장"
                  column={columns.원장}
                  isSelected={selectedFolderId === "원장"}
                  onClick={handleFolderSelect}
                >
                  {({ isOver }) => (
                    <>
                      <svg
                        className="w-[198px] h-[33px]"
                        viewBox="0 0 198 33"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polygon
                          points="0,0 154,0 198,33 0,33"
                          className={`fill-white stroke-onceHover stroke-[8] ${
                            isOver ? "fill-blue-50" : ""
                          } ${
                            selectedFolderId === "원장" ? "fill-blue-100" : ""
                          } ${
                            isOver && selectedFolderId === "원장"
                              ? "fill-blue-200"
                              : ""
                          }`}
                        />
                        <foreignObject x="0" y="0" width="143" height="33">
                          <div
                            xmlns="http://www.w3.org/1999/xhtml"
                            className={`flex items-center justify-center w-full h-full text-black border-l-[8px] ${
                              isOver ? "border-blue-400" : "border-onceHover"
                            } ${
                              selectedFolderId === "원장"
                                ? "font-bold border-blue-500"
                                : ""
                            } ${
                              isOver && selectedFolderId === "원장"
                                ? "border-blue-600"
                                : ""
                            }`}
                          >
                            원장
                          </div>
                        </foreignObject>
                      </svg>
                      <div
                        className={`w-[240px] h-[50px] bg-onceHover flex flex-wrap gap-2 justify-center items-center ${
                          selectedFolderId === "원장" && !isOver
                            ? "bg-blue-100"
                            : ""
                        } ${
                          isOver && selectedFolderId !== "원장"
                            ? "bg-blue-50"
                            : ""
                        } ${
                          isOver && selectedFolderId === "원장"
                            ? "bg-blue-200"
                            : ""
                        }`}
                      >
                        {columns.원장.taskIds?.length > 0 && (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              selectedFolderId === "원장" && !isOver
                                ? "bg-blue-200"
                                : "bg-gray-200"
                            } ${
                              isOver && selectedFolderId !== "원장"
                                ? "bg-blue-100"
                                : ""
                            } ${
                              isOver && selectedFolderId === "원장"
                                ? "bg-blue-300"
                                : ""
                            }`}
                          >
                            {`+${columns.원장.taskIds.length}`}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </DroppableFolder>
              </div>
              <div className="flex-1 flex flex-col items-center gap-y-[10px]">
                <DroppableFolder
                  id="원무과장"
                  column={columns.원무과장}
                  isSelected={selectedFolderId === "원무과장"}
                  onClick={handleFolderSelect}
                >
                  {({ isOver }) => (
                    <>
                      <svg
                        className="w-[198px] h-[33px]"
                        viewBox="0 0 198 33"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polygon
                          points="0,0 154,0 198,33 0,33"
                          className={`fill-white stroke-onceHover stroke-[8] ${
                            isOver ? "fill-blue-50" : ""
                          } ${
                            selectedFolderId === "원무과장"
                              ? "fill-blue-100"
                              : ""
                          } ${
                            isOver && selectedFolderId === "원무과장"
                              ? "fill-blue-200"
                              : ""
                          }`}
                        />
                        <foreignObject x="0" y="0" width="143" height="33">
                          <div
                            xmlns="http://www.w3.org/1999/xhtml"
                            className={`flex items-center justify-center w-full h-full text-black border-l-[8px] ${
                              isOver ? "border-blue-400" : "border-onceHover"
                            } ${
                              selectedFolderId === "원무과장"
                                ? "font-bold border-blue-500"
                                : ""
                            } ${
                              isOver && selectedFolderId === "원무과장"
                                ? "border-blue-600"
                                : ""
                            }`}
                          >
                            원무과장
                          </div>
                        </foreignObject>
                      </svg>
                      <div
                        className={`w-[240px] h-[50px] bg-onceHover flex flex-wrap gap-2 justify-center items-center ${
                          selectedFolderId === "원무과장" && !isOver
                            ? "bg-blue-100"
                            : ""
                        } ${
                          isOver && selectedFolderId !== "원무과장"
                            ? "bg-blue-50"
                            : ""
                        } ${
                          isOver && selectedFolderId === "원무과장"
                            ? "bg-blue-200"
                            : ""
                        }`}
                      >
                        {columns.원무과장.taskIds?.length > 0 && (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              selectedFolderId === "원무과장" && !isOver
                                ? "bg-blue-200"
                                : "bg-gray-200"
                            } ${
                              isOver && selectedFolderId !== "원무과장"
                                ? "bg-blue-100"
                                : ""
                            } ${
                              isOver && selectedFolderId === "원무과장"
                                ? "bg-blue-300"
                                : ""
                            }`}
                          >
                            {`+${columns.원무과장.taskIds.length}`}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </DroppableFolder>
                <DroppableFolder
                  id="간호팀장"
                  column={columns.간호팀장}
                  isSelected={selectedFolderId === "간호팀장"}
                  onClick={handleFolderSelect}
                >
                  {({ isOver }) => (
                    <>
                      <svg
                        className="w-[198px] h-[33px]"
                        viewBox="0 0 198 33"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polygon
                          points="0,0 154,0 198,33 0,33"
                          className={`fill-white stroke-onceHover stroke-[8] ${
                            isOver ? "fill-blue-50" : ""
                          } ${
                            selectedFolderId === "간호팀장"
                              ? "fill-blue-100"
                              : ""
                          } ${
                            isOver && selectedFolderId === "간호팀장"
                              ? "fill-blue-200"
                              : ""
                          }`}
                        />
                        <foreignObject x="0" y="0" width="143" height="33">
                          <div
                            xmlns="http://www.w3.org/1999/xhtml"
                            className={`flex items-center justify-center w-full h-full text-black border-l-[8px] ${
                              isOver ? "border-blue-400" : "border-onceHover"
                            } ${
                              selectedFolderId === "간호팀장"
                                ? "font-bold border-blue-500"
                                : ""
                            } ${
                              isOver && selectedFolderId === "간호팀장"
                                ? "border-blue-600"
                                : ""
                            }`}
                          >
                            간호팀장
                          </div>
                        </foreignObject>
                      </svg>
                      <div
                        className={`w-[240px] h-[50px] bg-onceHover flex flex-wrap gap-2 justify-center items-center ${
                          selectedFolderId === "간호팀장" && !isOver
                            ? "bg-blue-100"
                            : ""
                        } ${
                          isOver && selectedFolderId !== "간호팀장"
                            ? "bg-blue-50"
                            : ""
                        } ${
                          isOver && selectedFolderId === "간호팀장"
                            ? "bg-blue-200"
                            : ""
                        }`}
                      >
                        {columns.간호팀장.taskIds?.length > 0 && (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              selectedFolderId === "간호팀장" && !isOver
                                ? "bg-blue-200"
                                : "bg-gray-200"
                            } ${
                              isOver && selectedFolderId !== "간호팀장"
                                ? "bg-blue-100"
                                : ""
                            } ${
                              isOver && selectedFolderId === "간호팀장"
                                ? "bg-blue-300"
                                : ""
                            }`}
                          >
                            {`+${columns.간호팀장.taskIds.length}`}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </DroppableFolder>
                <DroppableFolder
                  id="물리치료팀장"
                  column={columns.물리치료팀장}
                  isSelected={selectedFolderId === "물리치료팀장"}
                  onClick={handleFolderSelect}
                >
                  {({ isOver }) => (
                    <>
                      <svg
                        className="w-[198px] h-[33px]"
                        viewBox="0 0 198 33"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polygon
                          points="0,0 154,0 198,33 0,33"
                          className={`fill-white stroke-onceHover stroke-[8] ${
                            isOver ? "fill-blue-50" : ""
                          } ${
                            selectedFolderId === "물리치료팀장"
                              ? "fill-blue-100"
                              : ""
                          } ${
                            isOver && selectedFolderId === "물리치료팀장"
                              ? "fill-blue-200"
                              : ""
                          }`}
                        />
                        <foreignObject x="0" y="0" width="143" height="33">
                          <div
                            xmlns="http://www.w3.org/1999/xhtml"
                            className={`flex items-center justify-center w-full h-full text-black border-l-[8px] ${
                              isOver ? "border-blue-400" : "border-onceHover"
                            } ${
                              selectedFolderId === "물리치료팀장"
                                ? "font-bold border-blue-500"
                                : ""
                            } ${
                              isOver && selectedFolderId === "물리치료팀장"
                                ? "border-blue-600"
                                : ""
                            }`}
                          >
                            물리치료팀장
                          </div>
                        </foreignObject>
                      </svg>
                      <div
                        className={`w-[240px] h-[50px] bg-onceHover flex flex-wrap gap-2 justify-center items-center ${
                          selectedFolderId === "물리치료팀장" && !isOver
                            ? "bg-blue-100"
                            : ""
                        } ${
                          isOver && selectedFolderId !== "물리치료팀장"
                            ? "bg-blue-50"
                            : ""
                        } ${
                          isOver && selectedFolderId === "물리치료팀장"
                            ? "bg-blue-200"
                            : ""
                        }`}
                      >
                        {columns.물리치료팀장.taskIds?.length > 0 && (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              selectedFolderId === "물리치료팀장" && !isOver
                                ? "bg-blue-200"
                                : "bg-gray-200"
                            } ${
                              isOver && selectedFolderId !== "물리치료팀장"
                                ? "bg-blue-100"
                                : ""
                            } ${
                              isOver && selectedFolderId === "물리치료팀장"
                                ? "bg-blue-300"
                                : ""
                            }`}
                          >
                            {`+${columns.물리치료팀장.taskIds.length}`}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </DroppableFolder>
                <DroppableFolder
                  id="방사선팀장"
                  column={columns.방사선팀장}
                  isSelected={selectedFolderId === "방사선팀장"}
                  onClick={handleFolderSelect}
                >
                  {({ isOver }) => (
                    <>
                      <svg
                        className="w-[198px] h-[33px]"
                        viewBox="0 0 198 33"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polygon
                          points="0,0 154,0 198,33 0,33"
                          className={`fill-white stroke-onceHover stroke-[8] ${
                            isOver ? "fill-blue-50" : ""
                          } ${
                            selectedFolderId === "방사선팀장"
                              ? "fill-blue-100"
                              : ""
                          } ${
                            isOver && selectedFolderId === "방사선팀장"
                              ? "fill-blue-200"
                              : ""
                          }`}
                        />
                        <foreignObject x="0" y="0" width="143" height="33">
                          <div
                            xmlns="http://www.w3.org/1999/xhtml"
                            className={`flex items-center justify-center w-full h-full text-black border-l-[8px] ${
                              isOver ? "border-blue-400" : "border-onceHover"
                            } ${
                              selectedFolderId === "방사선팀장"
                                ? "font-bold border-blue-500"
                                : ""
                            } ${
                              isOver && selectedFolderId === "방사선팀장"
                                ? "border-blue-600"
                                : ""
                            }`}
                          >
                            방사선팀장
                          </div>
                        </foreignObject>
                      </svg>
                      <div
                        className={`w-[240px] h-[50px] bg-onceHover flex flex-wrap gap-2 justify-center items-center ${
                          selectedFolderId === "방사선팀장" && !isOver
                            ? "bg-blue-100"
                            : ""
                        } ${
                          isOver && selectedFolderId !== "방사선팀장"
                            ? "bg-blue-50"
                            : ""
                        } ${
                          isOver && selectedFolderId === "방사선팀장"
                            ? "bg-blue-200"
                            : ""
                        }`}
                      >
                        {columns.방사선팀장.taskIds?.length > 0 && (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              selectedFolderId === "방사선팀장" && !isOver
                                ? "bg-blue-200"
                                : "bg-gray-200"
                            } ${
                              isOver && selectedFolderId !== "방사선팀장"
                                ? "bg-blue-100"
                                : ""
                            } ${
                              isOver && selectedFolderId === "방사선팀장"
                                ? "bg-blue-300"
                                : ""
                            }`}
                          >
                            {`+${columns.방사선팀장.taskIds.length}`}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </DroppableFolder>
              </div>
              <div className="flex-1 flex flex-col items-center gap-y-[10px]">
                <DroppableFolder
                  id="간호팀"
                  column={columns.간호팀}
                  isSelected={selectedFolderId === "간호팀"}
                  onClick={handleFolderSelect}
                >
                  {({ isOver }) => (
                    <>
                      <svg
                        className="w-[198px] h-[33px]"
                        viewBox="0 0 198 33"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polygon
                          points="0,0 154,0 198,33 0,33"
                          className={`fill-white stroke-onceHover stroke-[8] ${
                            isOver ? "fill-blue-50" : ""
                          } ${
                            selectedFolderId === "간호팀" ? "fill-blue-100" : ""
                          } ${
                            isOver && selectedFolderId === "간호팀"
                              ? "fill-blue-200"
                              : ""
                          }`}
                        />
                        <foreignObject x="0" y="0" width="143" height="33">
                          <div
                            xmlns="http://www.w3.org/1999/xhtml"
                            className={`flex items-center justify-center w-full h-full text-black border-l-[8px] ${
                              isOver ? "border-blue-400" : "border-onceHover"
                            } ${
                              selectedFolderId === "간호팀"
                                ? "font-bold border-blue-500"
                                : ""
                            } ${
                              isOver && selectedFolderId === "간호팀"
                                ? "border-blue-600"
                                : ""
                            }`}
                          >
                            간호팀
                          </div>
                        </foreignObject>
                      </svg>
                      <div
                        className={`w-[240px] h-[50px] bg-onceHover flex flex-wrap gap-2 justify-center items-center ${
                          selectedFolderId === "간호팀" && !isOver
                            ? "bg-blue-100"
                            : ""
                        } ${
                          isOver && selectedFolderId !== "간호팀"
                            ? "bg-blue-50"
                            : ""
                        } ${
                          isOver && selectedFolderId === "간호팀"
                            ? "bg-blue-200"
                            : ""
                        }`}
                      >
                        {columns.간호팀.taskIds?.length > 0 && (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              selectedFolderId === "간호팀" && !isOver
                                ? "bg-blue-200"
                                : "bg-gray-200"
                            } ${
                              isOver && selectedFolderId !== "간호팀"
                                ? "bg-blue-100"
                                : ""
                            } ${
                              isOver && selectedFolderId === "간호팀"
                                ? "bg-blue-300"
                                : ""
                            }`}
                          >
                            {`+${columns.간호팀.taskIds.length}`}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </DroppableFolder>
                <DroppableFolder
                  id="원무팀"
                  column={columns.원무팀}
                  isSelected={selectedFolderId === "원무팀"}
                  onClick={handleFolderSelect}
                >
                  {({ isOver }) => (
                    <>
                      <svg
                        className="w-[198px] h-[33px]"
                        viewBox="0 0 198 33"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polygon
                          points="0,0 154,0 198,33 0,33"
                          className={`fill-white stroke-onceHover stroke-[8] ${
                            isOver ? "fill-blue-50" : ""
                          } ${
                            selectedFolderId === "원무팀" ? "fill-blue-100" : ""
                          } ${
                            isOver && selectedFolderId === "원무팀"
                              ? "fill-blue-200"
                              : ""
                          }`}
                        />
                        <foreignObject x="0" y="0" width="143" height="33">
                          <div
                            xmlns="http://www.w3.org/1999/xhtml"
                            className={`flex items-center justify-center w-full h-full text-black border-l-[8px] ${
                              isOver ? "border-blue-400" : "border-onceHover"
                            } ${
                              selectedFolderId === "원무팀"
                                ? "font-bold border-blue-500"
                                : ""
                            } ${
                              isOver && selectedFolderId === "원무팀"
                                ? "border-blue-600"
                                : ""
                            }`}
                          >
                            원무팀
                          </div>
                        </foreignObject>
                      </svg>
                      <div
                        className={`w-[240px] h-[50px] bg-onceHover flex flex-wrap gap-2 justify-center items-center ${
                          selectedFolderId === "원무팀" && !isOver
                            ? "bg-blue-100"
                            : ""
                        } ${
                          isOver && selectedFolderId !== "원무팀"
                            ? "bg-blue-50"
                            : ""
                        } ${
                          isOver && selectedFolderId === "원무팀"
                            ? "bg-blue-200"
                            : ""
                        }`}
                      >
                        {columns.원무팀.taskIds?.length > 0 && (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              selectedFolderId === "원무팀" && !isOver
                                ? "bg-blue-200"
                                : "bg-gray-200"
                            } ${
                              isOver && selectedFolderId !== "원무팀"
                                ? "bg-blue-100"
                                : ""
                            } ${
                              isOver && selectedFolderId === "원무팀"
                                ? "bg-blue-300"
                                : ""
                            }`}
                          >
                            {`+${columns.원무팀.taskIds.length}`}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </DroppableFolder>
                <DroppableFolder
                  id="물리치료팀"
                  column={columns.물리치료팀}
                  isSelected={selectedFolderId === "물리치료팀"}
                  onClick={handleFolderSelect}
                >
                  {({ isOver }) => (
                    <>
                      <svg
                        className="w-[198px] h-[33px]"
                        viewBox="0 0 198 33"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polygon
                          points="0,0 154,0 198,33 0,33"
                          className={`fill-white stroke-onceHover stroke-[8] ${
                            isOver ? "fill-blue-50" : ""
                          } ${
                            selectedFolderId === "물리치료팀"
                              ? "fill-blue-100"
                              : ""
                          } ${
                            isOver && selectedFolderId === "물리치료팀"
                              ? "fill-blue-200"
                              : ""
                          }`}
                        />
                        <foreignObject x="0" y="0" width="143" height="33">
                          <div
                            xmlns="http://www.w3.org/1999/xhtml"
                            className={`flex items-center justify-center w-full h-full text-black border-l-[8px] ${
                              isOver ? "border-blue-400" : "border-onceHover"
                            } ${
                              selectedFolderId === "물리치료팀"
                                ? "font-bold border-blue-500"
                                : ""
                            } ${
                              isOver && selectedFolderId === "물리치료팀"
                                ? "border-blue-600"
                                : ""
                            }`}
                          >
                            물리치료팀
                          </div>
                        </foreignObject>
                      </svg>
                      <div
                        className={`w-[240px] h-[50px] bg-onceHover flex flex-wrap gap-2 justify-center items-center ${
                          selectedFolderId === "물리치료팀" && !isOver
                            ? "bg-blue-100"
                            : ""
                        } ${
                          isOver && selectedFolderId !== "물리치료팀"
                            ? "bg-blue-50"
                            : ""
                        } ${
                          isOver && selectedFolderId === "물리치료팀"
                            ? "bg-blue-200"
                            : ""
                        }`}
                      >
                        {columns.물리치료팀.taskIds?.length > 0 && (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              selectedFolderId === "물리치료팀" && !isOver
                                ? "bg-blue-200"
                                : "bg-gray-200"
                            } ${
                              isOver && selectedFolderId !== "물리치료팀"
                                ? "bg-blue-100"
                                : ""
                            } ${
                              isOver && selectedFolderId === "물리치료팀"
                                ? "bg-blue-300"
                                : ""
                            }`}
                          >
                            {`+${columns.물리치료팀.taskIds.length}`}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </DroppableFolder>
                <DroppableFolder
                  id="방사선팀"
                  column={columns.방사선팀}
                  isSelected={selectedFolderId === "방사선팀"}
                  onClick={handleFolderSelect}
                >
                  {({ isOver }) => (
                    <>
                      <svg
                        className="w-[198px] h-[33px]"
                        viewBox="0 0 198 33"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polygon
                          points="0,0 154,0 198,33 0,33"
                          className={`fill-white stroke-onceHover stroke-[8] ${
                            isOver ? "fill-blue-50" : ""
                          } ${
                            selectedFolderId === "방사선팀"
                              ? "fill-blue-100"
                              : ""
                          } ${
                            isOver && selectedFolderId === "방사선팀"
                              ? "fill-blue-200"
                              : ""
                          }`}
                        />
                        <foreignObject x="0" y="0" width="143" height="33">
                          <div
                            xmlns="http://www.w3.org/1999/xhtml"
                            className={`flex items-center justify-center w-full h-full text-black border-l-[8px] ${
                              isOver ? "border-blue-400" : "border-onceHover"
                            } ${
                              selectedFolderId === "방사선팀"
                                ? "font-bold border-blue-500"
                                : ""
                            } ${
                              isOver && selectedFolderId === "방사선팀"
                                ? "border-blue-600"
                                : ""
                            }`}
                          >
                            방사선팀
                          </div>
                        </foreignObject>
                      </svg>
                      <div
                        className={`w-[240px] h-[50px] bg-onceHover flex flex-wrap gap-2 justify-center items-center ${
                          selectedFolderId === "방사선팀" && !isOver
                            ? "bg-blue-100"
                            : ""
                        } ${
                          isOver && selectedFolderId !== "방사선팀"
                            ? "bg-blue-50"
                            : ""
                        } ${
                          isOver && selectedFolderId === "방사선팀"
                            ? "bg-blue-200"
                            : ""
                        }`}
                      >
                        {columns.방사선팀.taskIds?.length > 0 && (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              selectedFolderId === "방사선팀" && !isOver
                                ? "bg-blue-200"
                                : "bg-gray-200"
                            } ${
                              isOver && selectedFolderId !== "방사선팀"
                                ? "bg-blue-100"
                                : ""
                            } ${
                              isOver && selectedFolderId === "방사선팀"
                                ? "bg-blue-300"
                                : ""
                            }`}
                          >
                            {`+${columns.방사선팀.taskIds.length}`}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </DroppableFolder>
              </div>
            </div>
            <DragOverlay>
              {activeTaskId && (
                <div className="p-2 bg-white rounded shadow">
                  {(() => {
                    const activeTask = tasks.find(
                      (task) => task.id === activeTaskId
                    );
                    return (
                      activeTask?.title ||
                      activeTask?.content ||
                      `업무 ${activeTaskId}`
                    );
                  })()}
                </div>
              )}
            </DragOverlay>
          </>
        </DndContext>
      ) : (
        /* 게시판 모드 컴포넌트 - 모든 tasks를 전달하도록 수정 */
        <TaskBoardView
          tasks={tasks} // 필터링된 목록이 아닌 전체 tasks를 전달
          onViewHistory={handleViewTaskHistory}
          onTaskClick={handleTaskClick}
          selectedFolderId={selectedFolderId}
        />
      )}

      {/* 모달들 */}
      <TaskAddModal
        isVisible={taskAddModalOn}
        setIsVisible={setTaskAddModalOn}
        task={selectedTask}
        isEdit={isEditMode}
        onTaskAdd={handleTaskAdd}
        onTaskEdit={handleTaskEdit}
        onTaskDelete={handleTaskDelete}
        onSwitchToEditMode={handleSwitchToEditMode}
      />

      <TaskRecordModal
        isVisible={taskHistoryModalOn}
        setIsVisible={setTaskHistoryModalOn}
        task={selectedTask}
      />
    </div>
  );
}

export default TaskMainCanvas;
