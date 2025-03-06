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
import ToDo from "../common/ToDo";

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

// 초기 컬럼 데이터
// - unassigned: 아직 배정되지 않은 할 일
// - 원장님, 부장님: 인원별 폴더 영역
const initialColumns = {
  unassigned: {
    id: "unassigned",
    title: "할 일 목록",
    taskIds: ["task-1", "task-2", "task-3", "task-4"],
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

function ToDoItem({ task }) {
  const [whoModalOpen, setWhoModalOpen] = useState(false);

  // 중요도 기본값 설정
  const priority = task?.priority || "중";

  return (
    <div className="h-[56px] flex flex-row w-[300px] items-center bg-onceBackground mb-[4px]">
      <ColorZone className={`w-[20px] h-full ${priorityColors[priority]}`} />
      <TextZone className="flex-1 px-[20px]">
        <span>{task?.title || task?.content || "제목 없음"}</span>
      </TextZone>
    </div>
  );
}

/* ==============================================
   1) SortableTask: 드래그 가능한 실제 아이템 컴포넌트
============================================== */
function SortableTask({ id, task, containerId }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id,
      data: {
        type: "task",
        sortable: { containerId },
      },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: "transform 250ms ease, left 250ms ease, top 250ms ease",
    width: "100%",
    height: "100%",
  };

  // task가 없는 경우 빈 컴포넌트 반환
  if (!task) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="cursor-grab flex items-center justify-center"
      >
        <div className="h-[56px] flex flex-row w-[300px] items-center bg-gray-100 mb-[4px]">
          <div className="flex-1 px-[20px] text-gray-400">
            <span>빈 항목</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab flex items-center justify-center"
    >
      <ToDoItem task={task} />
    </div>
  );
}

/* ==============================================
   2) ToDoDragComponent: 상단 unassigned 영역 (9칸 고정 그리드)
============================================== */
export function ToDoDragComponent({ column, tasks }) {
  const totalSlots = 9; // 고정 셀 개수 (3×3)

  // tasks가 배열 형태일 때 id를 찾아 매핑하여 사용
  const taskIdsToUse = Array.isArray(tasks)
    ? tasks.slice(0, totalSlots).map((task) => task.id)
    : column.taskIds;

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
                <SortableTask id={id} task={taskData} containerId={column.id} />
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
  const [totalPages] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);
  const [aboutTaskModalOn, setAboutTaskModalOn] = useState(true);
  const [aboutTaskInfoModalOn, setAboutTaskInfoModalOn] = useState(false);
  const [aboutTaskRecordModalOn, setAboutTaskRecordModalOn] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [taskAddModalOn, setTaskAddModalOn] = useState(false);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // 로컬 스토리지에서 업무 목록 불러오기
  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // 업무 목록 저장하기
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem("tasks", JSON.stringify(tasks));
    }
  }, [tasks]);

  // 업무 추가 핸들러
  const handleTaskAdd = (newTask) => {
    // 새 업무 추가
    setTasks((prevTasks) => [...prevTasks, newTask]);

    // unassigned 영역에 새 업무 ID 추가
    setColumns((prevColumns) => {
      const unassignedColumn = prevColumns.unassigned;
      return {
        ...prevColumns,
        unassigned: {
          ...unassignedColumn,
          taskIds: [...unassignedColumn.taskIds, newTask.id],
        },
      };
    });
  };

  // 업무 업데이트 핸들러 (드래그 앤 드롭 시 담당자 정보 업데이트)
  const updateTaskAssignee = (taskId, assignee) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, assignee, updatedAt: new Date().toISOString() }
          : task
      )
    );
  };

  // 담당자 없는 업무 필터링
  const unassignedTasks = tasks.filter((task) => !task.assignee);

  // 담당자별 업무 그룹화
  const tasksByAssignee = {};
  tasks.forEach((task) => {
    if (task.assignee) {
      if (!tasksByAssignee[task.assignee]) {
        tasksByAssignee[task.assignee] = [];
      }
      tasksByAssignee[task.assignee].push(task);
    }
  });

  const handleDragStart = (event) => {
    setActiveTaskId(event.active.id);
  };

  const handleDragEnd = (event) => {
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
      updateTaskAssignee(taskId, containerId);

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
    // 아래는 간단하게 toLocaleDateString()으로 표시하는 방법입니다.
    // 필요에 따라 원하는 포맷으로 변경할 수 있습니다.
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

  // 현재 날짜를 기준으로 이전, 다음 날짜 계산
  const previousDate = addDays(currentDate, -1);
  const nextDate = addDays(currentDate, 1);

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
              onClick={() => setTaskAddModalOn(true)}
            />
          </div>
        </TitleZone>
        {/* 상단 할 일 목록 (9칸 고정 그리드) */}
        <ToDoDragComponent
          column={columns.unassigned}
          tasks={unassignedTasks}
        />
        {/* 페이지네이션 영역 */}
        <PaginationZone className="flex justify-center items-center space-x-2 my-[30px]">
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
        </PaginationZone>
        <div className="flex flex-row gap-x-[20px]">
          <div className="flex-1 flex flex-col items-center gap-y-[10px]">
            <DragGoalFolder
              column={initialColumns.원장}
              tasks={tasksByAssignee["원장"] || []}
            />
          </div>
          <div className="flex-1 flex flex-col items-center gap-y-[10px]">
            <DragGoalFolder
              column={initialColumns.원무과장}
              tasks={tasksByAssignee["원무과장"] || []}
            />
            <DragGoalFolder
              column={initialColumns.간호팀장}
              tasks={tasksByAssignee["간호팀장"] || []}
            />
            <DragGoalFolder
              column={initialColumns.물리치료팀장}
              tasks={tasksByAssignee["물리치료팀장"] || []}
            />
            <DragGoalFolder
              column={initialColumns.방사선팀장}
              tasks={tasksByAssignee["방사선팀장"] || []}
            />
          </div>
          <div className="flex-1 flex flex-col items-center gap-y-[10px]">
            <DragGoalFolder
              column={initialColumns.간호팀}
              tasks={tasksByAssignee["간호팀"] || []}
            />
            <DragGoalFolder
              column={initialColumns.원무팀}
              tasks={tasksByAssignee["원무팀"] || []}
            />
            <DragGoalFolder
              column={initialColumns.물리치료팀}
              tasks={tasksByAssignee["물리치료팀"] || []}
            />
            <DragGoalFolder
              column={initialColumns.방사선팀}
              tasks={tasksByAssignee["방사선팀"] || []}
            />
          </div>
        </div>
        <DragOverlay>
          {activeTaskId ? (
            <div className="p-2 bg-white rounded shadow">
              {(() => {
                const activeTask = Array.isArray(tasks)
                  ? tasks.find((task) => task.id === activeTaskId)
                  : tasks[activeTaskId];

                return (
                  activeTask?.title ||
                  activeTask?.content ||
                  `업무 ${activeTaskId}`
                );
              })()}
            </div>
          ) : null}
        </DragOverlay>
      </div>
      {/* 업무 상세 */}
      <ModalTemplate
        isVisible={aboutTaskInfoModalOn}
        setIsVisible={setAboutTaskInfoModalOn}
        showCancel={false}
      >
        <div className="flex flex-col items-center w-onceBigModal h-onceBigModalH bg-white px-[40px] py-[30px]">
          <ModalHeaderZone className="flex flex-row w-full bg-white justify-between h-[50px] items-center">
            <span className="text-[34px] font-bold">&lt; 업무</span>
            <img
              onClick={() => setAboutTaskInfoModalOn(false)}
              className="w-[30px]"
              src={cancel}
              alt="닫기"
              style={{ cursor: "pointer" }}
            />
          </ModalHeaderZone>
          <ModalContentZone className="flex flex-col h-full py-[20px] w-full">
            <div className="flex-[5] flex flex-row w-full items-center justify-center h-full">
              <JcyCalendar />
              <InforationZone className="w-full flex flex-col px-[20px]">
                <input
                  type="text"
                  placeholder="로비 앞 정수기 관리"
                  className="w-[630px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground mb-[20px]"
                />
                <InfoRow className="grid grid-cols-2 gap-4 mb-[10px]">
                  <div className="flex flex-row">
                    <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                      작성자:
                    </label>
                    <input
                      type="text"
                      placeholder="작성자"
                      className="w-[200px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
                    />
                  </div>
                  <div className="flex flex-row">
                    <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                      담당자:
                    </label>
                    <input
                      type="text"
                      placeholder="담당자"
                      className="w-[200px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
                    />
                  </div>
                </InfoRow>
                <InfoRow className="flex flex-row mb-[10px]">
                  <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                    분류:
                  </label>
                  <div className="flex flex-row gap-x-[10px] w-full">
                    <OnceOnOffButton
                      className="h-[40px] w-full rounded-md"
                      text={"일반"}
                    />
                    <OnceOnOffButton
                      className="h-[40px] w-full rounded-md"
                      text={"이벤트"}
                    />
                    <OnceOnOffButton
                      className="h-[40px] w-full rounded-md"
                      text={"기타"}
                    />
                    <div className="w-full" />
                  </div>
                </InfoRow>
                <InfoRow className="flex flex-row mb-[10px]">
                  <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                    중요도:
                  </label>
                  <div className="flex flex-row gap-x-[30px]">
                    <NameCoin />
                    <NameCoin />
                    <NameCoin />
                  </div>
                </InfoRow>
                <InfoRow className="flex flex-row mb-[10px]">
                  <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                    날짜:
                  </label>
                  <div className="flex flex-row w-full ">
                    <input
                      type="text"
                      placeholder="작성자"
                      className="w-[200px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
                    />
                    <span>부터</span>
                    <input
                      type="text"
                      placeholder="작성자"
                      className="w-[200px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
                    />
                  </div>
                </InfoRow>
                <InfoRow className="flex flex-row mb-[10px]">
                  <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                    주기:
                  </label>
                  <div className="flex flex-row gap-x-[10px] w-full">
                    <OnceOnOffButton
                      className="h-[40px] w-full rounded-md"
                      text={"매일"}
                    />
                    <OnceOnOffButton
                      className="h-[40px] w-full rounded-md"
                      text={"매주"}
                    />
                    <OnceOnOffButton
                      className="h-[40px] w-full rounded-md"
                      text={"격주"}
                    />
                    <OnceOnOffButton
                      className="h-[40px] w-full rounded-md"
                      text={"매월"}
                    />
                  </div>
                </InfoRow>
                <InfoRow className="flex flex-row">
                  <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]"></label>
                  <div className="flex flex-row gap-x-[36px] w-full">
                    <NameCoin />
                    <NameCoin />
                    <NameCoin />
                    <NameCoin />
                    <NameCoin />
                    <NameCoin />
                    <NameCoin />
                  </div>
                </InfoRow>
              </InforationZone>
            </div>
            <div className="flex-[4] flex border my-[20px] bg-textBackground rounded-lg"></div>
            <ThreeButton className="flex flex-row w-full gap-x-[20px]">
              <OnceOnOffButton text={"업무삭제"} />
              <OnceOnOffButton text="수정하기" />
              <OnceOnOffButton text="업무일지" />
            </ThreeButton>
          </ModalContentZone>
        </div>
      </ModalTemplate>
      <TaskAddModal
        isVisible={taskAddModalOn}
        setIsVisible={setTaskAddModalOn}
        onTaskAdd={handleTaskAdd}
      />
    </DndContext>
  );
}

export default TaskMainCanvas;
