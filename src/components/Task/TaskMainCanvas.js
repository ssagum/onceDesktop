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

  // 날짜에 일(day)를 더하거나 빼는 헬퍼 함수입니다.
  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  // 날짜를 원하는 형식으로 포맷합니다. (예: YYYY-MM-DD)
  const formatDate = (date) => {
    return date.toLocaleDateString();
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full flex flex-col h-full bg-white min-w-[1100px] min-h-[900px] rounded-xl px-[40px] py-[30px]">
        <TitleZone className="w-full mb-[50px] flex flex-row justify-between items-center">
          <span className="text-[34px] font-semibold">업무분장</span>
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
      </div>

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
    </DndContext>
  );
}

export default TaskMainCanvas;
