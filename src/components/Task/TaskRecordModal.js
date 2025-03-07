import React, { useState, useEffect } from "react";
import styled from "styled-components";
import ModalTemplate from "../common/ModalTemplate";
import { cancel } from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import DayToggle from "../common/DayToggle";
import PriorityToggle from "../common/PriorityToggle";
import { JcyCalendar } from "../common/JcyCalendar";
import { format, parseISO } from "date-fns";
import { getTaskHistory } from "./TaskService";
import NameCoin from "../common/NameCoin";

const ModalHeaderZone = styled.div``;
const ModalContentZone = styled.div`
  overflow-y: hidden;
`;
const InforationZone = styled.div``;
const InfoRow = styled.div`
  margin-bottom: 8px;
`;

// 완료 상태 배지 컴포넌트
const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-block;
  text-align: center;
  white-space: nowrap;
`;

function TaskRecordModal({ isVisible, setIsVisible, task }) {
  const [selectedDays, setSelectedDays] = useState(task?.days || []);
  const [selectedCycle, setSelectedCycle] = useState(task?.cycle || "매일");
  const [priority, setPriority] = useState(task?.priority || "중");
  const [startDate, setStartDate] = useState(
    task?.startDate
      ? format(new Date(task.startDate), "yyyy/MM/dd")
      : format(new Date(), "yyyy/MM/dd")
  );
  const [endDate, setEndDate] = useState(
    task?.endDate
      ? format(new Date(task.endDate), "yyyy/MM/dd")
      : format(new Date(), "yyyy/MM/dd")
  );
  const [taskHistory, setTaskHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("일반");

  // 무한 종료일 (반복성 업무용)
  const INFINITE_END_DATE = "2099/12/31";

  // 작업 이력 가져오기
  useEffect(() => {
    if (isVisible && task?.id) {
      fetchTaskHistory();
    }
  }, [isVisible, task]);

  // 작업 이력 조회
  const fetchTaskHistory = async () => {
    if (!task?.id) return;

    try {
      setLoading(true);
      const historyData = await getTaskHistory(task.id);
      setTaskHistory(historyData);
      console.log("업무 이력 조회 결과:", historyData);
    } catch (error) {
      console.error("업무 이력 조회 중 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (timestamp) => {
    if (!timestamp) return "날짜 없음";

    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

    if (isNaN(date.getTime())) return "날짜 형식 오류";

    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 날짜와 시간 분리 포맷팅
  const formatDateForDisplay = (timestamp) => {
    if (!timestamp) return { date: "-", time: "-", dayPeriod: "-" };

    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

    if (isNaN(date.getTime()))
      return { date: "날짜 오류", time: "-", dayPeriod: "-" };

    // YYYY/MM/DD 형식
    const dateStr = format(date, "yyyy/MM/dd");

    // 오전/오후 구분
    const hours = date.getHours();
    const dayPeriod = hours < 12 ? "오전" : "오후";

    // 시:분 형식
    const displayHours = hours % 12 || 12; // 12시간제
    const minutes = date.getMinutes();
    const timeStr = `${displayHours}:${minutes.toString().padStart(2, "0")}`;

    return { date: dateStr, time: timeStr, dayPeriod };
  };

  // 행동(action)별 한글 표시
  const getActionLabel = (action) => {
    const actionLabels = {
      create: "업무 생성",
      complete: "업무 완료",
      update: "업무 업데이트",
      assign: "담당자 변경",
      delete: "업무 삭제",
      cancel_complete: "완료 취소",
      update_completers: "완료자 변경",
    };

    return actionLabels[action] || action;
  };

  // 완료 관련 이력만 필터링하여 표시 형식으로 변환
  const getCompletionRecords = () => {
    if (!taskHistory || taskHistory.length === 0) return [];

    // 완료 또는 취소 관련 이력만 필터링
    const completionHistories = taskHistory.filter(
      (item) => item.action === "complete" || item.action === "cancel_complete"
    );

    // 표시 형식으로 변환
    return completionHistories.map((item) => {
      const { date, time, dayPeriod } = formatDateForDisplay(item.timestamp);
      let status = "미완료";

      if (item.action === "complete") {
        status = "상완"; // 완료됨
      } else if (item.action === "cancel_complete") {
        status = "미완료"; // 취소됨
      }

      return {
        date,
        time,
        dayPeriod,
        status,
        actor:
          item.actionBy ||
          item.actor ||
          (item.actors && item.actors.length > 0 ? item.actors[0] : ""),
      };
    });
  };

  // 완료 기록 가져오기
  const completionRecords = getCompletionRecords();

  // 요일 배열
  const days = ["월", "화", "수", "목", "금", "토", "일"];

  // TaskAddModal로 돌아가기
  const handleBack = () => {
    setIsVisible(false);
  };

  return (
    <ModalTemplate
      isVisible={isVisible}
      setIsVisible={setIsVisible}
      showCancel={false}
    >
      <div className="flex flex-col items-center w-onceBigModal h-onceBigModalH bg-white px-[40px] py-[30px]">
        <ModalHeaderZone className="flex flex-row w-full bg-white justify-between h-[50px] items-center">
          <div className="flex items-center">
            <span
              className="text-[34px] font-bold mr-2 cursor-pointer"
              onClick={handleBack}
            >
              ←
            </span>
            <span className="text-[34px] font-bold">업무일지</span>
          </div>
          <img
            onClick={() => setIsVisible(false)}
            className="w-[30px]"
            src={cancel}
            alt="닫기"
            style={{ cursor: "pointer" }}
          />
        </ModalHeaderZone>

        <ModalContentZone className="flex flex-col  w-full h-full pt-[20px]">
          <div className="flex flex-row w-full space-x-4 h-full">
            {/* 좌측: 업무 정보 (3:2 비율로 변경) */}
            <div className="w-3/5 pr-4 h-full overflow-y-auto">
              {/* 업무 제목 (왼쪽에만 표시) */}
              <input
                type="text"
                value={task?.title || ""}
                readOnly
                placeholder="업무 제목을 입력하세요"
                className="w-full border border-gray-400 rounded-md h-[40px] px-4 bg-gray-100 mb-[20px] text-ellipsis"
                disabled
              />

              {/* JcyCalendar 컴포넌트 추가 */}
              <div className="mb-4 flex">
                <JcyCalendar
                  preStartDay={startDate}
                  preEndDay={endDate}
                  setTargetStartDay={() => {}}
                  setTargetEndDay={() => {}}
                  lockDates={true}
                  singleDateMode={task?.category === "1회성"}
                  startDayOnlyMode={task?.category === "반복성"}
                  isEdit={false}
                />
              </div>
              {/* 분류 */}
              <InfoRow className="flex flex-row items-center">
                <label className="font-semibold text-black w-[70px]">
                  분류:
                </label>
                <div className="flex flex-row gap-x-[10px] flex-1">
                  <OnceOnOffButton
                    className="h-[36px] w-full rounded-md"
                    text={"1회성 업무"}
                    on={task?.category === "1회성"}
                    disabled
                  />
                  <OnceOnOffButton
                    className="h-[36px] w-full rounded-md"
                    text={"반복성 업무"}
                    on={task?.category === "반복성"}
                    disabled
                  />
                  <OnceOnOffButton
                    className="h-[36px] w-full rounded-md"
                    text={"이벤트성 업무"}
                    on={task?.category === "이벤트성"}
                    disabled
                  />
                </div>
              </InfoRow>

              {/* 중요도 */}
              <InfoRow className="flex flex-row items-center">
                <label className="font-semibold text-black w-[70px]">
                  중요도:
                </label>
                <div className="flex flex-row gap-x-[10px]">
                  {["상", "중", "하"].map((level) => (
                    <PriorityToggle
                      key={level}
                      text={level}
                      isOn={priority === level}
                      onClick={() => {}}
                      disabled
                    />
                  ))}
                </div>
              </InfoRow>

              {/* 주기 */}
              <InfoRow className="flex flex-row items-center">
                <label className="font-semibold text-black w-[70px]">
                  주기:
                </label>
                <div className="flex flex-row gap-x-[10px] flex-1">
                  <OnceOnOffButton
                    className="h-[36px] w-full rounded-md"
                    text={"매일"}
                    on={selectedCycle === "매일"}
                    disabled
                  />
                  <OnceOnOffButton
                    className="h-[36px] w-full rounded-md"
                    text={"매주"}
                    on={selectedCycle === "매주"}
                    disabled
                  />
                  <OnceOnOffButton
                    className="h-[36px] w-full rounded-md"
                    text={"격주"}
                    on={selectedCycle === "격주"}
                    disabled
                  />
                  <OnceOnOffButton
                    className="h-[36px] w-full rounded-md"
                    text={"매월"}
                    on={selectedCycle === "매월"}
                    disabled
                  />
                </div>
              </InfoRow>

              {/* 날짜 */}
              <InfoRow className="flex flex-row items-center">
                <label className="font-semibold text-black w-[70px]">
                  날짜:
                </label>
                <div className="flex flex-row items-center gap-x-[10px] flex-1">
                  <input
                    type="text"
                    value={startDate}
                    readOnly
                    placeholder="시작일 (YYYY/MM/DD)"
                    className="flex-1 border border-gray-400 rounded-md h-[36px] px-3 bg-gray-100 text-ellipsis"
                  />
                  <span className="px-2">부터</span>
                  <input
                    type="text"
                    value={task?.category === "반복성" ? "계속 반복" : endDate}
                    readOnly
                    placeholder="종료일 (YYYY/MM/DD)"
                    className="flex-1 border border-gray-400 rounded-md h-[36px] px-3 bg-gray-100 text-ellipsis"
                  />
                </div>
              </InfoRow>

              {/* 요일 */}
              <InfoRow className="flex flex-row items-center">
                <label className="font-semibold text-black w-[70px]">
                  요일:
                </label>
                <div className="flex flex-row gap-x-[5px] flex-1">
                  {days.map((day) => (
                    <DayToggle
                      key={day}
                      text={day}
                      isOn={selectedDays.includes(day)}
                      onClick={() => {}}
                      disabled
                    />
                  ))}
                </div>
              </InfoRow>
            </div>

            {/* 우측: 업무 일지 테이블 (3:2 비율로 변경) */}
            <div className="w-2/5 pl-4 h-full flex flex-col">
              {/* 헤더 부분 */}
              <div className="mb-4 bg-white border border-gray-300 rounded-md overflow-hidden">
                <div className="flex">
                  <div className="px-6 py-2 font-medium text-center w-1/2 border-r border-gray-300">
                    일시
                  </div>
                  <div className="px-6 py-2 font-medium text-center w-1/2 bg-gray-50">
                    완료
                  </div>
                </div>
              </div>

              {/* 테이블 본문 - 스크롤 가능한 영역 */}
              <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : completionRecords.length > 0 ? (
                  completionRecords.map((record, index) => (
                    <div
                      key={index}
                      className={`flex border-b border-gray-100 ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <div className="w-1/2 py-4 px-4 flex flex-col items-center justify-center">
                        <div className="font-medium text-gray-700">
                          {record.date}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.dayPeriod} {record.time}
                        </div>
                      </div>
                      <div className="w-1/2 py-4 px-4 flex justify-center items-center">
                        <StatusBadge
                          className={
                            record.status === "상완"
                              ? "bg-orange-100 text-orange-500 border border-orange-200"
                              : "bg-gray-100 text-gray-500 border border-gray-200"
                          }
                        >
                          {record.status}
                        </StatusBadge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-center items-center h-full text-gray-500 py-10">
                    업무 일지가 없습니다
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalContentZone>
      </div>
    </ModalTemplate>
  );
}

export default TaskRecordModal;
