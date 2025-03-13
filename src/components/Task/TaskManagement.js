import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import TaskFolder from "./TaskFolder";
import TaskItem from "./TaskItem";
import DepartmentFolder from "./DepartmentFolder";

// 스타일 컴포넌트 정의
const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 900px;
  background-color: white;
  padding: 30px 40px;
  border-radius: 12px;
  overflow: hidden;
`;

const TitleZone = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 34px;
`;

const ToggleContainer = styled.div`
  position: relative;
  display: flex;
  background-color: #f4f4f4;
  border-radius: 20px;
  margin-left: 16px;
  padding: 4px;
  width: 210px;
  height: 36px;
`;

const ToggleSlider = styled.div`
  position: absolute;
  width: 105px;
  height: 28px;
  background: white;
  border-radius: 16px;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transform: translateX(
    ${(props) => (props.position === "left" ? "0" : "105px")}
  );
`;

const ToggleOption = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 105px;
  height: 28px;
  font-size: 14px;
  font-weight: ${(props) => (props.active ? "600" : "400")};
  color: ${(props) => (props.active ? "#333" : "#888")};
  z-index: 1;
  cursor: pointer;
  transition: color 0.3s ease;
`;

const ToggleIcon = styled.span`
  margin-right: 4px;
`;

const TaskButton = styled.button`
  background-color: #1a73e8;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  width: 160px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1765cc;
  }
`;

const GridContainer = styled.div`
  position: relative;
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  height: 280px;
  width: 100%;
  margin-bottom: 20px;
`;

const GridCell = styled.div`
  position: absolute;
  width: 33.33%;
  height: 33.33%;
  padding: 4px;
  box-sizing: border-box;
  left: ${(props) => props.left};
  top: ${(props) => props.top};
`;

const EmptyCell = styled.div`
  width: 100%;
  height: 100%;
  border: 1px dashed #ccc;
  border-radius: 4px;
`;

const FolderHeaderContainer = styled.div`
  position: relative;
  display: inline-block;
  margin-bottom: -5px;
`;

const FolderHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 143px;
  height: 33px;
  border-left: 8px solid ${(props) => (props.selected ? "#3182ce" : "#e2e8f0")};
  font-weight: ${(props) => (props.selected ? "bold" : "normal")};
`;

const DepartmentsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
`;

const SubTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
`;

const Notification = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #2b8a3e;
  color: white;
  padding: 12px 16px;
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  opacity: ${(props) => (props.show ? 1 : 0)};
  transform: translateY(${(props) => (props.show ? 0 : "20px")});
  transition: all 0.3s ease;
`;

// 중요도에 따른 색상 매핑
const priorityColors = {
  높음: "bg-red-400",
  중간: "bg-yellow-400",
  낮음: "bg-green-400",
};

// ToDoItem 컴포넌트
function ToDoItem({ task, onClick }) {
  // 중요도 기본값 설정
  const priority = task?.priority || "중간";

  // 클릭 핸들러
  const handleClick = () => {
    if (onClick && task) {
      onClick(task);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "높음":
        return "bg-red-400";
      case "중간":
        return "bg-yellow-400";
      case "낮음":
        return "bg-green-400";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div
      className="h-[56px] flex flex-row w-full items-center bg-white mb-[4px] cursor-pointer shadow-sm rounded"
      onClick={handleClick}
    >
      <div
        className={`w-[6px] h-full rounded-l ${getPriorityColor(priority)}`}
      />
      <div className="flex-1 px-[12px]">
        <span className="text-sm font-medium">
          {task?.title || "제목 없음"}
        </span>
      </div>
    </div>
  );
}

// SortableTask 컴포넌트
function SortableTask({ id, task, containerId, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id,
      data: {
        type: "task",
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
      className="cursor-grab flex items-center justify-center w-full h-full"
    >
      <ToDoItem task={task} onClick={onClick} />
    </div>
  );
}

// 초기 부서 데이터
const initialDepartments = [
  { id: "dept-1", name: "개발팀" },
  { id: "dept-2", name: "디자인팀" },
  { id: "dept-3", name: "마케팅팀" },
  { id: "dept-4", name: "인사팀" },
  { id: "dept-5", name: "영업팀" },
];

// 초기 폴더 데이터
const initialFolders = [
  { id: "folder-1", title: "진행 예정", status: "todo" },
  { id: "folder-2", title: "진행 중", status: "in-progress" },
  { id: "folder-3", title: "완료", status: "completed" },
];

// 초기 태스크 데이터
const initialTasks = [
  {
    id: "task-1",
    title: "디자인 시안 제작",
    content: "메인 페이지 디자인 시안 제작하기",
    status: "todo",
    priority: "높음",
    department: "dept-2",
  },
  {
    id: "task-2",
    title: "회의록 작성",
    content: "주간 회의 내용 정리",
    status: "todo",
    priority: "중간",
    department: "dept-1",
  },
  {
    id: "task-3",
    title: "이메일 회신",
    content: "클라이언트 이메일 회신하기",
    status: "in-progress",
    priority: "높음",
    department: "dept-5",
  },
  {
    id: "task-4",
    title: "코드 리뷰",
    content: "팀원 PR 코드 리뷰하기",
    status: "in-progress",
    priority: "중간",
    department: "dept-1",
  },
  {
    id: "task-5",
    title: "버그 수정",
    content: "로그인 페이지 버그 수정",
    status: "completed",
    priority: "낮음",
    department: "dept-1",
  },
  {
    id: "task-6",
    title: "마케팅 전략 회의",
    content: "4분기 마케팅 전략 수립 회의",
    status: "todo",
    priority: "높음",
    department: "dept-3",
  },
  {
    id: "task-7",
    title: "인터뷰 일정 조율",
    content: "신입 개발자 면접 일정 잡기",
    status: "todo",
    priority: "중간",
    department: "dept-4",
  },
  {
    id: "task-8",
    title: "로고 디자인 검토",
    content: "새 로고 디자인 검토 및 피드백",
    status: "in-progress",
    priority: "높음",
    department: "dept-2",
  },
  {
    id: "task-9",
    title: "계약서 검토",
    content: "신규 고객사 계약서 검토",
    status: "in-progress",
    priority: "높음",
    department: "dept-5",
  },
  {
    id: "task-10",
    title: "채용 공고 작성",
    content: "프론트엔드 개발자 채용 공고 작성",
    status: "completed",
    priority: "중간",
    department: "dept-4",
  },
];

const TaskManagement = () => {
  // 태스크와 폴더 상태 관리
  const [folders, setFolders] = useState(initialFolders);
  const [tasks, setTasks] = useState(initialTasks);
  const [departments, setDepartments] = useState(initialDepartments);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
  });
  const [viewMode, setViewMode] = useState("dnd"); // dnd 또는 board 모드
  const [activeTaskId, setActiveTaskId] = useState(null); // 드래그 중인 태스크 ID
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);

  // dnd-kit 센서 설정
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // 부서별 태스크 필터링
  const getFilteredTasks = () => {
    if (!selectedDepartment) {
      return tasks; // 부서가 선택되지 않은 경우 모든 태스크 반환
    }
    return tasks.filter((task) => task.department === selectedDepartment.id);
  };

  // 부서 선택 핸들러
  const handleSelectDepartment = (department) => {
    setSelectedDepartment(department);
  };

  // 알림 표시 함수
  const showNotification = (message) => {
    setNotification({ show: true, message });

    // 3초 후 알림 숨기기
    setTimeout(() => {
      setNotification({ show: false, message: "" });
    }, 3000);
  };

  // 부서명 가져오기
  const getDepartmentName = (departmentId) => {
    const dept = departments.find((d) => d.id === departmentId);
    return dept ? dept.name : "미지정";
  };

  // 드래그 시작 핸들러
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveTaskId(active.id);
  };

  // 드래그 종료시 핸들러
  const handleDragEnd = (event) => {
    setActiveTaskId(null);
    const { active, over } = event;

    // 드래그 종료가 유효한 영역에서 발생하지 않았을 경우
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    const activeData = active.data.current;
    const overData = over.data.current;

    // 드래그한 항목이 태스크인지 확인
    if (activeData?.type === "task") {
      const task = tasks.find((t) => t.id === activeId);

      // 태스크를 부서 폴더에 드래그한 경우 (부서 변경)
      const targetDept = departments.find((d) => d.id === overId);
      if (task && targetDept && task.department !== targetDept.id) {
        const oldDeptName = getDepartmentName(task.department);

        setTasks((prev) =>
          prev.map((t) =>
            t.id === activeId ? { ...t, department: targetDept.id } : t
          )
        );
        showNotification(
          `'${task.title}' 태스크가 '${oldDeptName}'에서 '${targetDept.name}'로 이동되었습니다.`
        );

        // 현재 선택된 부서가 있고, 태스크가 다른 부서로 이동한 경우
        // 선택된 부서의 필터링된 목록에서 해당 태스크가 사라질 수 있음을 알림
        if (selectedDepartment && selectedDepartment.id !== targetDept.id) {
          setTimeout(() => {
            showNotification(
              `태스크가 '${targetDept.name}'로 이동되어 현재 목록에서 보이지 않을 수 있습니다.`
            );
          }, 3500);
        }
      }
    }
  };

  // 태스크 클릭 핸들러
  const handleTaskClick = (task) => {
    console.log("태스크 클릭:", task);
    // 여기에 태스크 상세보기나 편집 로직 추가 가능
  };

  const filteredTasks = getFilteredTasks();
  const taskIds = filteredTasks.map((task) => task.id);
  const departmentIds = departments.map((dept) => dept.id);

  // 현재 페이지에 표시할 작업 ID들
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  // 그리드 위치 계산
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

  // 9개 고정 슬롯 생성
  const fixedSlots = useMemo(() => {
    const totalSlots = 9;
    return Array.from({ length: totalSlots }, (_, index) =>
      paginatedTasks[index] ? paginatedTasks[index].id : `empty-${index}`
    );
  }, [paginatedTasks]);

  return (
    <Container>
      <TitleZone>
        <div className="flex items-center">
          <span className="text-[34px] font-semibold">작업 관리</span>

          {/* 모드 전환 토글 */}
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
        <TaskButton>업무 추가하기 +</TaskButton>
      </TitleZone>

      {viewMode === "dnd" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <>
            {/* 부서 폴더 섹션 - 위쪽으로 이동*/}
            <div>
              <SubTitle>부서별 분류 (태스크를 드래그하여 부서 변경)</SubTitle>
              <DepartmentsContainer>
                {departments.map((department) => (
                  <DepartmentFolder
                    key={department.id}
                    department={department}
                    taskCount={
                      tasks.filter((task) => task.department === department.id)
                        .length
                    }
                    isSelected={selectedDepartment?.id === department.id}
                    onSelect={() => handleSelectDepartment(department)}
                  />
                ))}
              </DepartmentsContainer>
            </div>

            {/* 폴더 라벨 */}
            <FolderHeaderContainer>
              <svg
                className="w-[198px] h-[33px]"
                viewBox="0 0 198 33"
                xmlns="http://www.w3.org/2000/svg"
              >
                <polygon
                  points="0,0 154,0 198,33 0,33"
                  className="fill-white stroke-gray-200 stroke-[1]"
                />
                <foreignObject x="0" y="0" width="143" height="33">
                  <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    className="flex items-center justify-center w-full h-full text-black border-l-[8px] border-gray-400"
                  >
                    {selectedDepartment
                      ? selectedDepartment.name
                      : "전체 태스크"}
                  </div>
                </foreignObject>
              </svg>
            </FolderHeaderContainer>

            {/* 태스크 그리드 */}
            <GridContainer>
              <SortableContext items={fixedSlots}>
                {fixedSlots.map((id, index) => {
                  const pos = gridPositions[index];
                  const isEmpty = id.toString().startsWith("empty-");
                  const taskData = isEmpty
                    ? null
                    : tasks.find((t) => t.id === id);

                  return (
                    <GridCell key={id} left={pos.left} top={pos.top}>
                      {isEmpty ? (
                        <EmptyCell />
                      ) : (
                        <SortableTask
                          id={id}
                          task={taskData}
                          containerId={selectedDepartment?.id || "all"}
                          onClick={handleTaskClick}
                        />
                      )}
                    </GridCell>
                  );
                })}
              </SortableContext>
            </GridContainer>

            {/* 페이지네이션 컨트롤 */}
            {filteredTasks.length > itemsPerPage && (
              <div className="flex justify-center mt-4 mb-6">
                <button
                  className="mx-1 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  이전
                </button>
                <span className="mx-2 py-1">
                  {currentPage} /{" "}
                  {Math.ceil(filteredTasks.length / itemsPerPage)}
                </span>
                <button
                  className="mx-1 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      prev < Math.ceil(filteredTasks.length / itemsPerPage)
                        ? prev + 1
                        : prev
                    )
                  }
                  disabled={
                    currentPage >=
                    Math.ceil(filteredTasks.length / itemsPerPage)
                  }
                >
                  다음
                </button>
              </div>
            )}

            {/* 드래그 오버레이 */}
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
                      `태스크 ${activeTaskId}`
                    );
                  })()}
                </div>
              )}
            </DragOverlay>
          </>
        </DndContext>
      ) : (
        // 게시판 모드 (미구현)
        <div className="p-4 text-center">
          <h3 className="text-lg font-medium">게시판 모드</h3>
          <p className="text-gray-500 mt-2">
            게시판 형태의 태스크 관리 뷰가 표시됩니다.
          </p>
          <div className="mt-4 grid gap-2">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 border rounded flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                onClick={() => handleTaskClick(task)}
              >
                <div className="flex items-center">
                  <div
                    className={`w-2 h-10 rounded-l mr-3 ${
                      task.priority === "높음"
                        ? "bg-red-400"
                        : task.priority === "중간"
                        ? "bg-yellow-400"
                        : "bg-green-400"
                    }`}
                  ></div>
                  <div>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-gray-500">{task.content}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      task.status === "todo"
                        ? "bg-gray-200"
                        : task.status === "in-progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {task.status === "todo"
                      ? "예정"
                      : task.status === "in-progress"
                      ? "진행 중"
                      : "완료"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getDepartmentName(task.department)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 알림 메시지 */}
      <Notification show={notification.show}>
        {notification.message}
      </Notification>
    </Container>
  );
};

export default TaskManagement;
