import React, { useState, useEffect } from "react";
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
import DragGoalFolder from "./DragGoalFolder";
import ModalTemplate from "../common/ModalTemplate";
import { cancel } from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import { JcyCalendar } from "../common/JcyCalendar";
import NameCoin from "../common/NameCoin";
import TaskAddModal from "./TaskAddModal";
import TaskRecordModal from "./TaskRecordModal";
import { format } from "date-fns";
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
import ToDo from "../common/ToDo";
import { db } from "../../firebase";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import JcyTable from "../common/JcyTable";

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

const ToggleOption = styled.div`
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

const ToggleSlider = styled.div`
  position: absolute;
  top: 4px;
  left: ${(props) => (props.position === "left" ? "4px" : "50%")};
  width: calc(50% - 8px);
  height: calc(100% - 8px);
  border-radius: 25px;
  background-color: #2196f3;
  transition: left 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ToggleIcon = styled.span`
  margin-right: 10px;
  font-size: 22px;
`;

// ★ 폴더 컨테이너: 폴더 느낌의 디자인과 드래그 시 애니메이션 효과 적용 ★
const FolderContainer = styled.div`
  width: 300px;
  background: ${(props) => (props.isOver ? "#e0f7fa" : "#f7f7f7")};
  border: 2px solid ${(props) => (props.isOver ? "#26a69a" : "#ccc")};
  border-radius: 8px;
  padding: 1rem;
  transition: transform 0.3s ease, background 0.3s ease, border-color 0.3s ease,
    box-shadow 0.3s ease;
  transform: ${(props) => (props.isOver ? "scale(1.05)" : "scale(1)")};
  box-shadow: ${(props) =>
    props.isOver ? "0 8px 16px rgba(0,0,0,0.2)" : "none"};
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

// 초기 할 일 데이터
const initialTasks = {
  "task-1": { id: "task-1", content: "할 일 1" },
  "task-2": { id: "task-2", content: "할 일 2" },
  "task-3": { id: "task-3", content: "할 일 3" },
  "task-4": { id: "task-4", content: "할 일 4" },
  "task-5": { id: "task-5", content: "할 일 5" },
  "task-6": { id: "task-6", content: "할 일 6" },
  "task-7": { id: "task-7", content: "할 일 7" },
  "task-8": { id: "task-8", content: "할 일 8" },
  "task-9": { id: "task-9", content: "할 일 9" },
};

// 초기 컬럼 데이터 - 부서와 역할명만 유지
const initialColumns = {
  unassigned: {
    id: "unassigned",
    title: "할 일 목록",
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

// 화면에 보여줄 컬럼 순서
const columnOrder = [
  "unassigned",
  "경영지원팀장",
  "원무과장",
  "간호팀장",
  "물리치료팀장",
  "방사선팀장",
  "경영지원팀",
  "원무팀",
  "간호팀",
  "물리치료팀",
  "방사선팀",
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
      className="cursor-grab flex items-center justify-center"
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
}) {
  const totalSlots = 9; // 고정 셀 개수 (3×3)

  // 현재 페이지와 페이지당 항목 수 추출
  const pageData = column.pageData || { currentPage: 1, itemsPerPage: 9 };
  const startIndex = (pageData.currentPage - 1) * pageData.itemsPerPage;
  const endIndex = startIndex + pageData.itemsPerPage;

  // 할당되지 않은 작업만 필터링
  const unassignedTasks = Array.isArray(tasks)
    ? tasks.filter((task) => !task.assignee || task.assignee === "unassigned")
    : [];

  // 현재 페이지에 표시할 작업 ID들
  const taskIdsToUse = Array.isArray(tasks)
    ? unassignedTasks.slice(startIndex, endIndex).map((task) => task.id)
    : column.taskIds.slice(startIndex, endIndex);

  // 고정된 9개 슬롯에 작업 ID 배치
  const fixedSlots = Array.from({ length: totalSlots }, (_, index) =>
    taskIdsToUse[index] ? taskIdsToUse[index] : `empty-${index}`
  );

  const { setNodeRef } = useDroppable({
    id: column.id,
    data: { type: "container", containerId: column.id },
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

    // tasks가 배열인 경우 (새로운 구현)
    if (Array.isArray(tasks)) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) return task;
    }

    // tasks가 객체인 경우 (기존 구현)
    if (tasks && typeof tasks === "object" && tasks[taskId]) {
      return tasks[taskId];
    }

    // 태스크가 없으면 최소한의 내용으로 객체 생성
    return { id: taskId, content: `업무 ${taskId}` };
  };

  return (
    <div
      ref={setNodeRef}
      className="relative bg-gray-50 p-4 rounded shadow h-[280px] w-full"
    >
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
  );
}

/* ==============================================
   3) PersonFolder: 인원별 할 일 배정 폴더 영역
   - droppable 영역으로 설정하고,
   - 드래그가 폴더 위에 있을 때 isOver 값을 활용해 폴더가 커지거나 열리는 애니메이션 적용
   - 내부에서는 할 일 배정 개수를 "+"로 표시
============================================== */
function PersonFolder({ column, tasks }) {
  // useDroppable 훅에서 isOver를 받아 드래그 오버 상태를 감지합니다.
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "container", containerId: column.id },
  });

  return (
    <FolderContainer ref={setNodeRef} isOver={isOver}>
      <h3 className="text-xl font-semibold mb-2 text-center">{column.title}</h3>
      <div className="flex flex-wrap gap-2 justify-center">
        {column.taskIds.map((taskId, index) => (
          <div
            key={taskId}
            className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"
          >
            {`+${index + 1}`}
          </div>
        ))}
      </div>
    </FolderContainer>
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
function TaskBoardView({ tasks, onViewHistory, onTaskClick }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // 페이지당 10개 항목
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // 필터 관련 상태 추가
  const [isFilterModalOn, setIsFilterModalOn] = useState(false);
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState([]);
  const [selectedPriorityFilters, setSelectedPriorityFilters] = useState([]);
  const [selectedAssigneeFilters, setSelectedAssigneeFilters] = useState([]);

  // 모든 필터를 하나로 합친 배열
  const combinedFilters = [
    ...selectedCategoryFilters,
    ...selectedPriorityFilters,
    ...selectedAssigneeFilters,
  ];

  // 데이터 필터링 및 정렬
  const getFilteredData = () => {
    let filteredTasks = [...tasks];

    // 검색어 필터링
    if (searchTerm) {
      const cleanedSearchTerm = searchTerm.replace(/\s+/g, "").toLowerCase();
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title?.toLowerCase().includes(cleanedSearchTerm) ||
          task.content?.toLowerCase().includes(cleanedSearchTerm)
      );
    }

    // 카테고리 필터링
    if (selectedCategoryFilters.length > 0) {
      filteredTasks = filteredTasks.filter((task) =>
        selectedCategoryFilters.includes(task.category)
      );
    }

    // 우선순위 필터링
    if (selectedPriorityFilters.length > 0) {
      filteredTasks = filteredTasks.filter((task) =>
        selectedPriorityFilters.includes(task.priority)
      );
    }

    // 담당자 필터링
    if (selectedAssigneeFilters.length > 0) {
      filteredTasks = filteredTasks.filter((task) =>
        selectedAssigneeFilters.includes(task.assignee)
      );
    }

    // 정렬
    if (sortConfig.key) {
      filteredTasks.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredTasks;
  };

  const filteredData = getFilteredData();

  // 필터 토글 함수
  const toggleFilter = (filterValue, type) => {
    if (type === "category") {
      setSelectedCategoryFilters((prev) =>
        prev.includes(filterValue)
          ? prev.filter((f) => f !== filterValue)
          : [...prev, filterValue]
      );
    } else if (type === "priority") {
      setSelectedPriorityFilters((prev) =>
        prev.includes(filterValue)
          ? prev.filter((f) => f !== filterValue)
          : [...prev, filterValue]
      );
    } else if (type === "assignee") {
      setSelectedAssigneeFilters((prev) =>
        prev.includes(filterValue)
          ? prev.filter((f) => f !== filterValue)
          : [...prev, filterValue]
      );
    }
  };

  // 필터 제거 핸들러
  const handleRemoveFilter = (filter) => {
    if (selectedCategoryFilters.includes(filter)) {
      setSelectedCategoryFilters(
        selectedCategoryFilters.filter((f) => f !== filter)
      );
    }
    if (selectedPriorityFilters.includes(filter)) {
      setSelectedPriorityFilters(
        selectedPriorityFilters.filter((f) => f !== filter)
      );
    }
    if (selectedAssigneeFilters.includes(filter)) {
      setSelectedAssigneeFilters(
        selectedAssigneeFilters.filter((f) => f !== filter)
      );
    }
  };

  // 모든 필터 초기화
  const handleResetFilters = () => {
    setSelectedCategoryFilters([]);
    setSelectedPriorityFilters([]);
    setSelectedAssigneeFilters([]);
  };

  // 정렬 핸들러
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

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
      {/* 상단 검색 및 필터 영역 */}
      <div className="w-full flex justify-between mb-6">
        <div className="flex items-center">
          <input
            type="text"
            className="border border-gray-300 rounded-md px-3 py-2 mr-2 w-64"
            placeholder="검색어를 입력하세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={() => setIsFilterModalOn(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            필터
          </button>

          {/* 필터 칩 표시 */}
          {combinedFilters.length > 0 && (
            <div className="flex ml-2 flex-wrap">
              {combinedFilters.map((filter, index) => (
                <div
                  key={index}
                  className="flex items-center bg-gray-200 rounded-full px-3 py-1 mr-2 mb-1"
                >
                  <span>{filter}</span>
                  <button
                    className="ml-2 text-gray-600 hover:text-gray-900"
                    onClick={() => handleRemoveFilter(filter)}
                  >
                    ×
                  </button>
                </div>
              ))}
              {combinedFilters.length > 0 && (
                <button
                  className="text-blue-500 hover:text-blue-700 ml-2"
                  onClick={handleResetFilters}
                >
                  모두 지우기
                </button>
              )}
            </div>
          )}
        </div>
      </div>

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
          onSort={handleSort}
          sortConfig={sortConfig}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          showPagination={true}
          centerAlignHeaders={true}
        />
      </div>

      {/* 필터 모달 */}
      {isFilterModalOn && (
        <ModalTemplate
          width="600px"
          height="500px"
          isVisible={isFilterModalOn}
          setIsVisible={setIsFilterModalOn}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">필터 설정</h2>
              <button onClick={() => setIsFilterModalOn(false)}>
                <img src={cancel} alt="닫기" />
              </button>
            </div>

            {/* 카테고리 필터 */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">카테고리</h3>
              <div className="flex flex-wrap gap-2">
                {["1회성", "반복성"].map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleFilter(category, "category")}
                    className={`px-3 py-1 rounded-full border ${
                      selectedCategoryFilters.includes(category)
                        ? "bg-blue-500 text-white border-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* 우선순위 필터 */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">우선순위</h3>
              <div className="flex flex-wrap gap-2">
                {["상", "중", "하"].map((priority) => (
                  <button
                    key={priority}
                    onClick={() => toggleFilter(priority, "priority")}
                    className={`px-3 py-1 rounded-full border ${
                      selectedPriorityFilters.includes(priority)
                        ? "bg-blue-500 text-white border-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {/* 담당자 필터 */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">담당자</h3>
              <div className="flex flex-wrap gap-2">
                {Object.keys(initialColumns)
                  .filter((key) => key !== "unassigned")
                  .map((assignee) => (
                    <button
                      key={assignee}
                      onClick={() => toggleFilter(assignee, "assignee")}
                      className={`px-3 py-1 rounded-full border ${
                        selectedAssigneeFilters.includes(assignee)
                          ? "bg-blue-500 text-white border-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {assignee}
                    </button>
                  ))}
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end mt-6">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md mr-2"
                onClick={handleResetFilters}
              >
                초기화
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
                onClick={() => setIsFilterModalOn(false)}
              >
                적용
              </button>
            </div>
          </div>
        </ModalTemplate>
      )}
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
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState(initialColumns);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // 페이지당 9개 항목
  const [currentDate, setCurrentDate] = useState(new Date());
  const [taskAddModalOn, setTaskAddModalOn] = useState(false);
  const [taskHistoryModalOn, setTaskHistoryModalOn] = useState(false);
  const [taskHistory, setTaskHistory] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false); // 편집 모드 상태 추가

  // 추가: 뷰 모드 (dnd: 드래그 앤 드롭 모드, board: 게시판 모드)
  const [viewMode, setViewMode] = useState("dnd");

  // 전체 페이지 계산 - 실제 할당되지 않은 작업 개수에 기반함
  const unassignedTasks = tasks.filter(
    (task) => !task.assignee || task.assignee === "unassigned"
  );
  const totalPages = Math.max(
    1,
    Math.ceil(unassignedTasks.length / itemsPerPage)
  );
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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
  }, [currentDate]);

  // 컬럼별로 업무 분류하는 함수
  const updateColumns = (taskList) => {
    // 모든 컬럼 초기화
    const updatedColumns = { ...initialColumns };
    Object.keys(updatedColumns).forEach((key) => {
      updatedColumns[key].taskIds = [];
    });

    // 담당자별로 업무 분류
    taskList.forEach((task) => {
      const assignee = task.assignee || "unassigned";
      if (updatedColumns[assignee]) {
        updatedColumns[assignee].taskIds.push(task.id);
      } else {
        updatedColumns.unassigned.taskIds.push(task.id);
      }
    });

    setColumns(updatedColumns);
  };

  // 업무 추가 핸들러
  const handleTaskAdd = async (newTask) => {
    try {
      // Firebase에 업무 추가
      const addedTask = await addTask(newTask);

      // 업무 목록과 컬럼 업데이트
      setTasks((prev) => [...prev, addedTask]);

      // unassigned 컬럼에 새 업무 추가
      setColumns((prev) => ({
        ...prev,
        unassigned: {
          ...prev.unassigned,
          taskIds: [...prev.unassigned.taskIds, addedTask.id],
        },
      }));
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  // 업무 편집 핸들러 추가
  const handleTaskEdit = async (updatedTask) => {
    try {
      // Firebase에서 업무 정보 업데이트
      await updateTask(updatedTask);

      // 로컬 상태 업데이트
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === updatedTask.id ? updatedTask : task
        )
      );

      console.log("작업 편집 완료:", updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // 업무 담당자 변경 핸들러
  const updateTaskAssignee = async (taskId, assignee) => {
    try {
      // Firebase에서 업무 담당자 변경 및 이력 추가
      await assignTask(taskId, assignee, "업무분장 페이지");

      // 현재 업무 목록 새로고침
      const updatedTasks = await getTasksByDate(currentDate);
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Error updating task assignee:", error);
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
    setActiveTaskId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) {
      setActiveTaskId(null);
      return;
    }

    // 드래그된 아이템이 task이고, 드랍 컨테이너가 담당자 폴더인 경우
    if (
      active.data.current?.type === "task" &&
      over.data.current?.type === "container"
    ) {
      const taskId = active.id;
      const containerId = over.id;

      // 담당자 정보 업데이트 (containerId가 담당자 정보)
      await updateTaskAssignee(taskId, containerId);

      // 기존 컬럼에서 제거하고 새 컬럼에 추가
      const activeContainer = active.data.current.sortable?.containerId;
      if (activeContainer && activeContainer !== containerId) {
        const sourceColumn = columns[activeContainer];
        const destinationColumn = columns[containerId];

        if (sourceColumn && destinationColumn) {
          const newSourceTaskIds = sourceColumn.taskIds.filter(
            (id) => id !== taskId
          );
          const newDestinationTaskIds = [...destinationColumn.taskIds, taskId];

          setColumns({
            ...columns,
            [activeContainer]: {
              ...sourceColumn,
              taskIds: newSourceTaskIds,
            },
            [containerId]: {
              ...destinationColumn,
              taskIds: newDestinationTaskIds,
            },
          });
        }
      }

      setActiveTaskId(null);
      return;
    }

    // 같은 컨테이너 내에서 순서 변경 (기존 코드)
    const activeContainer = active.data.current?.sortable?.containerId;
    const overContainer = over.data.current?.sortable?.containerId || over.id;
    if (!activeContainer || !overContainer) {
      setActiveTaskId(null);
      return;
    }
    if (activeContainer === overContainer) {
      const column = columns[activeContainer];
      const oldIndex = column.taskIds.indexOf(active.id);
      const newIndex = column.taskIds.indexOf(over.id);
      if (oldIndex !== newIndex) {
        const newTaskIds = arrayMove(column.taskIds, oldIndex, newIndex);
        setColumns({
          ...columns,
          [activeContainer]: { ...column, taskIds: newTaskIds },
        });
      }
    } else {
      const sourceColumn = columns[activeContainer];
      const destinationColumn = columns[overContainer];
      const newSourceTaskIds = sourceColumn.taskIds.filter(
        (id) => id !== active.id
      );
      const newDestinationTaskIds = [...destinationColumn.taskIds];
      const overIndex = newDestinationTaskIds.indexOf(over.id);
      newDestinationTaskIds.splice(overIndex, 0, active.id);
      setColumns({
        ...columns,
        [activeContainer]: { ...sourceColumn, taskIds: newSourceTaskIds },
        [overContainer]: {
          ...destinationColumn,
          taskIds: newDestinationTaskIds,
        },
      });

      // 담당자 업데이트 (unassigned가 아닌 다른 컬럼으로 이동한 경우)
      if (overContainer !== "unassigned") {
        await updateTaskAssignee(active.id, overContainer);
      } else {
        await updateTaskAssignee(active.id, null);
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

    console.log("작업 클릭됨:", task);
    setSelectedTask(task);
    setIsEditMode(false); // 처음에는 뷰 모드로 열기
    setTaskAddModalOn(true);
  };

  // TaskAddModal 모드 전환 핸들러
  const handleSwitchToEditMode = () => {
    setIsEditMode(true);
  };

  return (
    <div className="w-full flex flex-col h-full bg-white min-w-[1100px] min-h-[900px] rounded-xl px-[40px] py-[30px]">
      <TitleZone className="w-full mb-[50px] flex flex-row justify-between items-center">
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
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* 드래그 앤 드롭 모드 내용 */}
          <>
            {/* 상단 할 일 목록 (9칸 고정 그리드) */}
            <ToDoDragComponent
              column={{
                ...columns.unassigned,
                pageData: { currentPage, itemsPerPage },
              }}
              tasks={tasks}
              onViewHistory={handleViewTaskHistory}
              onTaskClick={handleTaskClick}
            />

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
            <div className="flex flex-row gap-x-[20px]">
              <div className="flex-1 flex flex-col items-center gap-y-[10px]">
                <DragGoalFolder column={columns.원장} tasks={tasks} />
              </div>
              <div className="flex-1 flex flex-col items-center gap-y-[10px]">
                <DragGoalFolder column={columns.원무과장} tasks={tasks} />
                <DragGoalFolder column={columns.간호팀장} tasks={tasks} />
                <DragGoalFolder column={columns.물리치료팀장} tasks={tasks} />
                <DragGoalFolder column={columns.방사선팀장} tasks={tasks} />
              </div>
              <div className="flex-1 flex flex-col items-center gap-y-[10px]">
                <DragGoalFolder column={columns.간호팀} tasks={tasks} />
                <DragGoalFolder column={columns.원무팀} tasks={tasks} />
                <DragGoalFolder column={columns.물리치료팀} tasks={tasks} />
                <DragGoalFolder column={columns.방사선팀} tasks={tasks} />
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
        /* 게시판 모드 컴포넌트 */
        <TaskBoardView
          tasks={tasks}
          onViewHistory={handleViewTaskHistory}
          onTaskClick={handleTaskClick}
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
