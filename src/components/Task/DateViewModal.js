import React, { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import ToDo from "../common/ToDo";
import { getTasksByDate, getUserTasks } from "./TaskService"; // getUserTasks 추가
import ModalTemplate from "../common/ModalTemplate";
import styled from "styled-components";
import TaskAddModal from "./TaskAddModal"; // TaskAddModal 추가
import { cancel } from "../../assets";

// styled-components
const DayCol = styled.div``;

function DateViewModal({
  isVisible,
  onClose,
  column,
  tasks,
  selectedFolderId,
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateTasksMap, setDateTasksMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null); // 선택된 작업 추가
  const [taskDetailModalOn, setTaskDetailModalOn] = useState(false); // 작업 상세 모달 표시 여부 추가

  // 날짜 계산 - 어제, 오늘, 내일
  const previousDate = addDays(currentDate, -1);
  const nextDate = addDays(currentDate, 1);
  const dates = [previousDate, currentDate, nextDate];

  // 폴더 이름 가져오기
  const getFolderName = () => {
    if (!selectedFolderId) return "전체";
    return selectedFolderId === "미배정" ? "미배정" : selectedFolderId;
  };

  // 날짜 변경 시 데이터 로드
  useEffect(() => {
    if (!isVisible) return;

    const loadAllDatesData = async () => {
      setIsLoading(true);
      try {
        // 세 개 날짜 모두 데이터 가져오기
        const loadPromises = dates.map(async (date) => {
          // getUserTasks 함수를 사용하여 요일과 주기까지 고려한 작업 목록을 가져옴
          const tasksForDate = await getUserTasks({
            date: date,
            department: selectedFolderId, // selectedFolderId를 department로 전달
            ignoreSchedule: false, // schedule(요일, 주기) 고려함
          });

          // isHidden이 true인 Task들은 필터링
          const visibleTasks = tasksForDate.filter((task) => !task.isHidden);

          return { date: date.toISOString(), tasks: visibleTasks };
        });

        const results = await Promise.all(loadPromises);

        // 결과를 날짜별로 맵핑
        const newTasksMap = {};
        results.forEach(({ date, tasks }) => {
          newTasksMap[date] = tasks;
        });

        setDateTasksMap(newTasksMap);
        console.log(
          "날짜별 업무 로드 완료:",
          Object.keys(newTasksMap).length,
          "개 날짜",
          "폴더:",
          selectedFolderId
        );
      } catch (error) {
        console.error("날짜별 업무 조회 중 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllDatesData();
  }, [currentDate, isVisible, selectedFolderId]); // selectedFolderId 추가

  // 날짜 포맷팅 함수
  const formatDate = (date) => {
    try {
      return format(date, "yyyy.MM.dd");
    } catch (error) {
      console.error("날짜 포맷팅 오류:", error);
      return "-";
    }
  };

  // 요일 구하기
  const getDayOfWeek = (date) => {
    try {
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      return days[date.getDay()];
    } catch (error) {
      console.error("요일 변환 오류:", error);
      return "";
    }
  };

  // 이전 날짜로 이동
  const handlePrevDay = () => {
    setCurrentDate((prevDate) => addDays(prevDate, -1));
  };

  // 다음 날짜로 이동
  const handleNextDay = () => {
    setCurrentDate((prevDate) => addDays(prevDate, 1));
  };

  // 특정 날짜의 작업 가져오기
  const getTasksForDate = (date) => {
    const dateKey = date.toISOString();
    return dateTasksMap[dateKey] || [];
  };

  // 작업 클릭 처리 함수
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setTaskDetailModalOn(true);
  };

  // 작업 상세 모달 닫기
  const handleCloseTaskDetailModal = () => {
    setTaskDetailModalOn(false);
    setSelectedTask(null);
  };

  // 편집 모드로 전환 핸들러 (필요하지만 사용하지 않을 예정)
  const handleSwitchToEditMode = () => {
    console.log("편집 모드로 전환 요청됨");
    // 이 모달에서는 편집 모드로 전환하지 않음 (읽기 전용)
  };

  // 더미 함수들 - TaskAddModal에 필요하지만 여기서는 실제로 동작하지 않음
  const handleTaskAdd = async () => {};
  const handleTaskEdit = async () => {};
  const handleTaskDelete = async () => {};

  // isVisible이 false이면 null 반환
  if (!isVisible) return null;

  // setIsVisible 함수 생성 - 이것이 ModalTemplate에서 기대하는 형태
  const setIsVisible = (value) => {
    if (!value) {
      onClose();
    }
  };

  return (
    <>
      <ModalTemplate
        isVisible={isVisible}
        setIsVisible={setIsVisible}
        showCancel={false}
        modalClassName="flex flex-col bg-white p-6 rounded-lg w-[1000px] max-h-[90vh] overflow-auto"
      >
        <div className="flex flex-col w-full">
          <div className="flex flex-row justify-between w-full">
            <h2 className="text-xl font-bold mb-4">{`${getFolderName()} 업무 보기`}</h2>
            <img
              onClick={() => setIsVisible(false)}
              className="w-[30px] mb-4"
              src={cancel}
              alt="닫기"
              style={{ cursor: "pointer" }}
            />
          </div>

          {/* 날짜별 업무 목록 - 3열 형태 */}
          <div className="flex items-stretch gap-4 h-[600px]">
            {/* 이전 버튼 */}
            <button
              onClick={handlePrevDay}
              className="self-center text-3xl text-gray-400 hover:text-gray-700 px-2"
            >
              &lt;
            </button>

            {/* 날짜별 업무 목록 컬럼 */}
            <div className="flex-1 flex gap-4">
              {dates.map((date, index) => (
                <DayCol
                  key={date.toISOString()}
                  className="flex-1 flex flex-col border rounded-md overflow-hidden"
                >
                  {/* 날짜 헤더 */}
                  <div className="bg-onceBlue text-white text-center py-3 font-medium">
                    <div>
                      {formatDate(date)} ({getDayOfWeek(date)})
                    </div>
                  </div>

                  {/* 날짜별 업무 목록 */}
                  <div className="p-2 flex-1 overflow-y-auto bg-gray-50">
                    {isLoading ? (
                      <div className="text-center text-gray-500 my-4"></div>
                    ) : getTasksForDate(date).length === 0 ? (
                      <div className="text-center text-gray-500 my-4">
                        해당 날짜에 등록된 업무가 없습니다
                      </div>
                    ) : (
                      getTasksForDate(date).map((task) => (
                        <ToDo
                          key={task.id}
                          task={task}
                          className="mb-2"
                          showCompleter={true}
                          onTaskClick={() => handleTaskClick(task)}
                          currentDate={date}
                        />
                      ))
                    )}
                  </div>
                </DayCol>
              ))}
            </div>

            {/* 다음 버튼 */}
            <button
              onClick={handleNextDay}
              className="self-center text-3xl text-gray-400 hover:text-gray-700 px-2"
            >
              &gt;
            </button>
          </div>
        </div>
      </ModalTemplate>

      <TaskAddModal
        isVisible={taskDetailModalOn}
        setIsVisible={setTaskDetailModalOn}
        task={selectedTask}
        isEdit={false} // 읽기 전용 모드 (TaskAddModal에서 사용하는 올바른 prop은 mode가 아닌 isEdit)
        onTaskAdd={handleTaskAdd}
        onTaskEdit={handleTaskEdit}
        onTaskDelete={handleTaskDelete}
        onSwitchToEditMode={handleSwitchToEditMode}
        onClose={handleCloseTaskDetailModal}
      />
    </>
  );
}

export default DateViewModal;
