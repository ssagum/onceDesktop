import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import TaskFolder from "./TaskFolder";
import TaskItem from "./TaskItem";
import DepartmentFolder from "./DepartmentFolder";

// 스타일 컴포넌트 정의
const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const TasksContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
  max-height: 50%;
  overflow-y: auto;
`;

const DepartmentsContainer = styled.div`
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow-x: auto;
  border-top: 1px solid #e9ecef;
  padding-top: 24px;
  position: relative;
`;

const FoldersContainer = styled.div`
  display: flex;
  gap: 16px;
  padding: 16px;
  flex: 1;
  overflow-y: auto;
`;

const SectionTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
`;

const TasksList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
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

  // 드래그 종료시 핸들러
  const handleDragEnd = (event) => {
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

      // 1. 태스크를 상태 폴더에 드래그한 경우 (상태 변경)
      const targetFolder = folders.find((f) => f.id === overId);
      if (task && targetFolder && task.status !== targetFolder.status) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === activeId ? { ...t, status: targetFolder.status } : t
          )
        );
        showNotification(
          `'${task.title}' 태스크 상태가 '${targetFolder.title}'로 변경되었습니다.`
        );
      }

      // 2. 태스크를 부서 폴더에 드래그한 경우 (부서 변경)
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

  const filteredTasks = getFilteredTasks();
  const taskIds = filteredTasks.map((task) => task.id);
  const departmentIds = departments.map((dept) => dept.id);

  return (
    <Container>
      <h1 className="text-2xl font-bold mb-4 px-4 pt-4">작업 관리</h1>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        {/* 하단 부서 폴더 섹션 */}
        <div>
          <SectionTitle className="px-4">
            부서별 분류 (태스크를 드래그하여 부서 변경)
          </SectionTitle>
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

        {/* 폴더 섹션 - 선택적으로 사용할 수 있음 */}
        <FoldersContainer>
          <SectionTitle className="px-4 w-full">
            상태별 분류 (태스크를 드래그하여 상태 변경)
          </SectionTitle>
          <div className="flex gap-4 w-full">
            {folders.map((folder) => (
              <TaskFolder
                key={folder.id}
                id={folder.id}
                title={folder.title}
                tasks={filteredTasks.filter(
                  (task) => task.status === folder.status
                )}
              />
            ))}
          </div>
        </FoldersContainer>
      </DndContext>

      {/* 알림 메시지 */}
      <Notification show={notification.show}>
        {notification.message}
      </Notification>
    </Container>
  );
};

export default TaskManagement;
