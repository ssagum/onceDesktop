import React, { useState } from "react";
import ModalTemplate from "../common/ModalTemplate";
import styled from "styled-components";
import { cancel } from "../../assets";
import { tasks } from "../../datas/tasks";
import JcyTable from "../common/JcyTable";
import TaskRow from "./TaskRow";
import ToDo from "../common/ToDo";
import { useUserLevel } from "../../utils/UserLevelContext";

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

export default function TaskListModal({
  isVisible,
  setIsVisible,
  role = "간호팀",
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tableViewMode, setTableViewMode] = useState(true);
  const { userLevelData } = useUserLevel();

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

  const columns = [
    { label: "업무명", key: "taskName" },
    { label: "작성자", key: "writer" },
    { label: "담당자", key: "manager" },
    { label: "분류", key: "category" },
    { label: "중요도", key: "priority" },
    { label: "시작일", key: "startDate" },
    { label: "주기", key: "frequency" },
    { label: "요일", key: "days" },
  ];

  // 부서별 업무 필터링 (부서장인 경우 모든 업무 표시)
  const departmentTasks = tasks.filter((task) => {
    const isUserDepartmentHead = userLevelData?.role.includes("장");
    return (
      task.department === role ||
      task.department === "전체" ||
      (isUserDepartmentHead && task.department === userLevelData?.department)
    );
  });

  return (
    <ModalTemplate
      isVisible={isVisible}
      setIsVisible={setIsVisible}
      showCancel={false}
    >
      <div className="flex flex-col items-center w-onceBigModal h-onceBigModalH bg-white px-[40px] py-[30px]">
        <ModalHeaderZone className="flex flex-row w-full bg-white justify-between h-[50px] items-center">
          <span className="text-[34px] font-bold">{role} 업무</span>
          <div className="flex items-center gap-x-4">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                className={`px-4 py-2 rounded-lg transition-all ${
                  !tableViewMode
                    ? "bg-white text-gray-800 shadow"
                    : "text-gray-500"
                }`}
                onClick={() => setTableViewMode(false)}
              >
                일자별
              </button>
              <button
                className={`px-4 py-2 rounded-lg transition-all ${
                  tableViewMode
                    ? "bg-white text-gray-800 shadow"
                    : "text-gray-500"
                }`}
                onClick={() => setTableViewMode(true)}
              >
                목록
              </button>
            </div>
            <img
              onClick={() => setIsVisible(false)}
              className="w-[30px]"
              src={cancel}
              alt="닫기"
              style={{ cursor: "pointer" }}
            />
          </div>
        </ModalHeaderZone>

        {tableViewMode === false && (
          <ModalContentZone className="flex flex-row h-full py-[50px] w-full">
            <button
              className="px-3 py-1 rounded text-[30px]"
              onClick={handlePrevDay}
            >
              &lt;
            </button>
            <div className="flex flex-row w-full items-center justify-center gap-x-[20px] h-full">
              {/* 이전 근무일 */}
              <DayCol className="flex flex-col w-full items-center bg-onceBlue text-white rounded h-full border-onceBlue border">
                <div className="bg-onceBlue py-2 w-full text-center">
                  {formatDate(previousDate)}
                </div>
                <div className="w-full h-full flex-col flex bg-textBackground p-4">
                  {departmentTasks
                    .filter((task) =>
                      isSameDay(new Date(task.startDate), previousDate)
                    )
                    .map((task, index) => (
                      <ToDo key={task.id || index} task={task} />
                    ))}
                </div>
              </DayCol>
              {/* 오늘 */}
              <DayCol className="flex flex-col w-full items-center bg-onceBlue text-white rounded h-full border-onceBlue border">
                <div className="bg-onceBlue py-2 w-full text-center">
                  {formatDate(currentDate)}
                </div>
                <div className="w-full h-full flex-col flex bg-textBackground p-4">
                  {departmentTasks
                    .filter((task) =>
                      isSameDay(new Date(task.startDate), currentDate)
                    )
                    .map((task, index) => (
                      <ToDo key={task.id || index} task={task} />
                    ))}
                </div>
              </DayCol>
              {/* 다음 근무일 */}
              <DayCol className="flex flex-col w-full items-center bg-onceBlue text-white rounded h-full border-onceBlue border">
                <div className="bg-onceBlue py-2 w-full text-center">
                  {formatDate(nextDate)}
                </div>
                <div className="w-full h-full flex-col flex bg-textBackground p-4">
                  {departmentTasks
                    .filter((task) =>
                      isSameDay(new Date(task.startDate), nextDate)
                    )
                    .map((task, index) => (
                      <ToDo key={task.id || index} task={task} />
                    ))}
                </div>
              </DayCol>
            </div>
            <button
              className="px-3 py-1 rounded text-[30px]"
              onClick={handleNextDay}
            >
              &gt;
            </button>
          </ModalContentZone>
        )}

        {tableViewMode === true && (
          <ModalContentZone className="flex flex-row h-full py-[50px] w-full">
            <JcyTable
              columns={columns}
              columnWidths="grid-cols-8"
              data={departmentTasks}
              rowClassName={(index) =>
                index % 2 === 0 ? "bg-gray-100" : "bg-white"
              }
              renderRow={(row, index) => <TaskRow task={row} index={index} />}
              emptyRowHeight="44px"
            />
          </ModalContentZone>
        )}
      </div>
    </ModalTemplate>
  );
}

// 날짜 비교 헬퍼 함수
function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
