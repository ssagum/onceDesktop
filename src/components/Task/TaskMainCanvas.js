import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
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
  원장님: {
    id: "원장님",
    title: "원장님",
    taskIds: [],
  },
  부장님: {
    id: "부장님",
    title: "부장님",
    taskIds: [],
  },
};

// 화면에 보여줄 컬럼 순서
const columnOrder = ["unassigned", "원장님", "부장님"];

/* ==============================================
   내부 ToDoItem 컴포넌트 (기존 UI)
============================================== */
function ToDoItem({ content }) {
  const [whoModalOpen, setWhoModalOpen] = useState(false);
  return (
    <div className="h-[56px] flex flex-row w-[300px] items-center bg-onceBackground mb-[4px]">
      <ColorZone className="w-[20px] h-full bg-red-400" />
      <TextZone className="flex-1 px-[20px]">
        <span>{content}</span>
      </TextZone>
    </div>
  );
}

/* ==============================================
   1) SortableTask: 드래그 가능한 실제 아이템 컴포넌트
============================================== */
function SortableTask({ id, content, containerId }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id,
      data: { sortable: { containerId } },
    });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: "transform 250ms ease, left 250ms ease, top 250ms ease",
    width: "100%",
    height: "100%",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab flex items-center justify-center"
    >
      <ToDoItem content={content} />
    </div>
  );
}

/* ==============================================
   2) ToDoDragComponent: 상단 unassigned 영역 (9칸 고정 그리드)
============================================== */
export function ToDoDragComponent({ column, tasks }) {
  const totalSlots = 9; // 고정 셀 개수 (3×3)
  const fixedSlots = Array.from({ length: totalSlots }, (_, index) =>
    column.taskIds[index] ? column.taskIds[index] : `empty-${index}`
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

  return (
    <div
      ref={setNodeRef}
      className="relative bg-gray-50 p-4 rounded shadow h-[280px] w-full"
    >
      <SortableContext items={fixedSlots}>
        {fixedSlots.map((id, index) => {
          const pos = gridPositions[index];
          const isEmpty = id.toString().startsWith("empty-");
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
                  content={tasks[id].content}
                  containerId={column.id}
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
   - 내부에서는 할 일 배정 개수를 “+1”, “+2” 등으로 표시
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
  const [tasks, setTasks] = useState(initialTasks);
  const [columns, setColumns] = useState(initialColumns);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [totalPages] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);
  const [aboutTaskModalOn, setAboutTaskModalOn] = useState(false);
  const [aboutTaskInfoModalOn, setAboutTaskInfoModalOn] = useState(false);
  const [aboutTaskRecordModalOn, setAboutTaskRecordModalOn] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event) => {
    setActiveTaskId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) {
      setActiveTaskId(null);
      return;
    }
    const activeContainer = active.data.current.sortable.containerId;
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
        (taskId) => taskId !== active.id
      );
      const newDestinationTaskIds = [...destinationColumn.taskIds, active.id];

      // 인원 폴더로 이동하면 tasks 객체에 who 속성을 추가
      if (overContainer !== "unassigned") {
        setTasks((prev) => ({
          ...prev,
          [active.id]: { ...prev[active.id], who: overContainer },
        }));
      } else {
        setTasks((prev) => {
          const updatedTask = { ...prev[active.id] };
          delete updatedTask.who;
          return { ...prev, [active.id]: updatedTask };
        });
      }

      setColumns({
        ...columns,
        [activeContainer]: {
          ...sourceColumn,
          taskIds: newSourceTaskIds,
        },
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
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full flex flex-col h-full bg-white min-w-[1100px] min-h-[900px] rounded-xl px-[40px] py-[30px]">
        <TitleZone className="w-full mb-[50px] flex flex-row justify-between items-center">
          <span className="text-[34px] font-semibold">업무분장</span>
          <div className="flex flex-row gap-x-[20px]"></div>
        </TitleZone>
        {/* 상단 할 일 목록 (9칸 고정 그리드) */}
        <ToDoDragComponent column={columns.unassigned} tasks={tasks} />
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
              column={initialColumns.원장님}
              tasks={initialTasks}
            />
          </div>
          <div className="flex-1 flex flex-col items-center gap-y-[10px]">
            {/* <DragGoalFolder who="경영지원 팀장님" />
            <DragGoalFolder />
            <DragGoalFolder /> */}
          </div>
          <div className="flex-1 flex flex-col items-center gap-y-[10px]">
            {/* <DragGoalFolder />
            <DragGoalFolder />
            <DragGoalFolder /> */}
          </div>
        </div>
        <DragOverlay>
          {activeTaskId ? (
            <div className="p-2 bg-white rounded shadow">
              {tasks[activeTaskId].content}
            </div>
          ) : null}
        </DragOverlay>
      </div>
      <ModalTemplate
        isVisible={aboutTaskModalOn}
        setIsVisible={setAboutTaskModalOn}
        showCancel={false}
      >
        <div className="flex flex-col items-center w-onceBigModal h-onceBigModalH bg-white px-[40px] py-[30px]">
          <ModalHeaderZone className="flex flex-row w-full bg-white justify-between h-[50px] items-center">
            <span className="text-[34px] font-bold">원장님 업무</span>
            <img
              onClick={() => setAboutTaskModalOn(false)}
              className="w-[30px]"
              src={cancel}
              alt="닫기"
              style={{ cursor: "pointer" }}
            />
          </ModalHeaderZone>
          <ModalContentZone className="flex flex-row h-full py-[50px] w-full">
            <button
              className="px-3 py-1 rounded text-[30px]"
              onClick={handlePrevDay}
            >
              &lt;
            </button>
            <div className="flex flex-row w-full items-center justify-center gap-x-[20px] h-full">
              {/* 이전 근무일 버튼 */}
              <DayCol className="flex flex-col w-full items-center bg-onceBlue text-white rounded h-full border-onceBlue border">
                <div className="bg-onceBlue py-2">
                  {formatDate(previousDate)}
                </div>
                <div className="w-full h-full flex-col flex bg-textBackground"></div>
              </DayCol>
              {/* 오늘 날짜 표시 */}
              <DayCol className="flex flex-col w-full items-center bg-onceBlue text-white rounded h-full border-onceBlue border">
                <div className="bg-onceBlue py-2">
                  {formatDate(currentDate)}
                </div>
                <div className="w-full h-full flex-col flex bg-textBackground"></div>
              </DayCol>
              {/* 이후 근무일 버튼 */}
              <DayCol className="flex flex-col w-full items-center bg-onceBlue text-white rounded h-full border-onceBlue border">
                <div className="bg-onceBlue py-2">{formatDate(nextDate)}</div>
                <div className="w-full h-full flex-col flex bg-textBackground"></div>
              </DayCol>
            </div>
            <button
              className="px-3 py-1 rounded text-[30px]"
              onClick={handleNextDay}
            >
              &gt;
            </button>
          </ModalContentZone>
        </div>
      </ModalTemplate>
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
    </DndContext>
  );
}

export default TaskMainCanvas;
