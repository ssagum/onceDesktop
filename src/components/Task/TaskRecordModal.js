import React, { useState, useEffect } from "react";
import styled from "styled-components";
import ModalTemplate from "../common/ModalTemplate";
import { cancel } from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import DayToggle from "../common/DayToggle";
import PriorityToggle from "../common/PriorityToggle";
import { JcyCalendar } from "../common/JcyCalendar";
import {
  format,
  parseISO,
  formatISO,
  addDays,
  parse,
  isBefore,
  isAfter,
  isSameDay,
  differenceInDays,
  isWithinInterval,
  isValid,
} from "date-fns";
import { getTaskHistory } from "./TaskService";
import NameCoin from "../common/NameCoin";
import { formatSafeDate, parseToDateWithoutTime } from "../../utils/dateUtils";

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

// 완료자 컨테이너
const CompletionInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;

  .actor-list {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 2px;
  }

  .completion-time {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 2px;
  }
`;

// 정렬 및 필터 헤더 컴포넌트
const InteractiveHeader = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  user-select: none;
  position: relative;

  &:hover {
    background-color: #f9fafb;
  }

  .indicator {
    margin-left: 4px;
    transition: transform 0.2s;
  }

  .indicator.asc {
    transform: rotate(180deg);
  }

  &.active {
    background-color: #ffedd5;
    border-bottom: 2px solid #f97316;
    font-weight: 600;
    color: #f97316;
  }

  .filter-text {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    margin-left: 4px;
    padding: 2px 6px;
    border-radius: 4px;
    color: #fff;
    background-color: #f97316;
    transition: all 0.2s;
  }
`;

// 안전하게 시간 포맷팅하는 함수 - 컴포넌트 바깥으로 이동
function formatTimeWithFallback(timestamp) {
  try {
    if (!timestamp) return "-";

    const date = new Date(timestamp);
    if (!isValid(date)) return "-";

    // 12시간제로 변경
    const hours = date.getHours() % 12 || 12; // 0시는 12로 표시
    const minutes = date.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  } catch (error) {
    console.error("시간 포맷팅 오류:", error, timestamp);
    return "-";
  }
}

// 안전하게 오전/오후 구분하는 함수 - 컴포넌트 바깥으로 이동
function getDayPeriod(timestamp) {
  try {
    const date = new Date(timestamp);
    return isValid(date) ? (date.getHours() < 12 ? "오전" : "오후") : "-";
  } catch (error) {
    console.error("오전/오후 구분 오류:", error, timestamp);
    return "-";
  }
}

function TaskRecordModal({ isVisible, setIsVisible, task }) {
  const [selectedDays, setSelectedDays] = useState(task?.days || []);
  const [selectedCycle, setSelectedCycle] = useState(task?.cycle || "매일");
  const [priority, setPriority] = useState(task?.priority || "중");
  const [startDate, setStartDate] = useState(
    task?.startDate
      ? formatSafeDate(task.startDate)
      : formatSafeDate(new Date())
  );
  const [endDate, setEndDate] = useState(
    task?.endDate ? formatSafeDate(task.endDate) : formatSafeDate(new Date())
  );
  const [taskHistory, setTaskHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("일반");
  const [sortDirection, setSortDirection] = useState("desc"); // 기본값: 내림차순(최신순)
  const [showOnlyCompleted, setShowOnlyCompleted] = useState(false); // 기본값: 모든 기록 표시
  const [filteredAndSortedRecords, setFilteredAndSortedRecords] = useState([]);

  // 무한 종료일 (반복성 업무용)
  const INFINITE_END_DATE = "2099/12/31";

  // 작업 이력 가져오기
  useEffect(() => {
    if (isVisible && task?.id) {
      fetchTaskHistory();
    }
  }, [isVisible, task]);

  // 유효하지 않은 task 체크
  useEffect(() => {
    if (isVisible && (!task || !task.id)) {
      console.error("유효하지 않은 업무 데이터:", task);
      setIsVisible(false); // 유효하지 않은 task면 모달 닫기
    }
  }, [isVisible, task, setIsVisible]);

  useEffect(() => {
    if (!loading) {
      // 데이터가 로드되었을 때 필터링된 기록 생성
      const records = getFilteredAndSortedRecords();
      setFilteredAndSortedRecords(records);
      setDataReady(true);
    }
  }, [loading, showOnlyCompleted, sortDirection, taskHistory]);

  // 작업 이력 조회
  const fetchTaskHistory = async () => {
    if (!task?.id) return;

    try {
      setLoading(true);
      setDataReady(false);
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

    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

      if (isNaN(date.getTime())) return "날짜 형식 오류";

      return date.toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("날짜 포맷팅 오류:", error, timestamp);
      return "날짜 변환 오류";
    }
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

  // 날짜가 업무 요일에 해당하는지 확인
  const isTaskDay = (date) => {
    try {
      if (task?.category === "1회성") {
        const taskStartDate = parse(startDate, "yyyy/MM/dd", new Date());
        return isValid(taskStartDate) && isSameDay(date, taskStartDate);
      }

      if (selectedCycle === "매일") {
        return true;
      }

      const dayOfWeek = format(date, "E"); // 1: 월요일, 7: 일요일
      const koreanDays = ["월", "화", "수", "목", "금", "토", "일"];
      const dayName = koreanDays[dayOfWeek - 1];

      return selectedDays.includes(dayName);
    } catch (error) {
      console.error("요일 확인 오류:", error, date);
      return false;
    }
  };

  // 시작일부터 종료일까지의 모든 날짜 생성
  const generateAllDates = () => {
    try {
      // 안전하게 날짜 값 확인
      if (!startDate) {
        console.error("시작일이 없습니다");
        return [];
      }

      // 시작일과 종료일 파싱 - 타입에 맞게 안전하게 처리
      let startDateObj;
      try {
        startDateObj = parseToDateWithoutTime(startDate);
        if (!isValid(startDateObj)) {
          console.error("시작일 파싱 오류:", startDate);
          return [];
        }
      } catch (error) {
        console.error("시작일 파싱 예외 발생:", error);
        // 오류 발생 시 기본값으로 오늘 날짜 사용
        startDateObj = new Date();
      }

      let endDateObj;

      // 반복성 업무거나 아직 종료일이 도래하지 않은 경우 오늘 날짜까지로 제한
      if (task?.category === "반복성" || endDate === INFINITE_END_DATE) {
        // 시간 정보 제거하고 날짜만 사용 (오늘 날짜 포함)
        endDateObj = new Date();
        // 종료일은 오늘 날짜를 포함하도록 시간을 23:59:59로 설정
        endDateObj.setHours(23, 59, 59, 999);
      } else {
        try {
          endDateObj = parseToDateWithoutTime(endDate);
          if (!isValid(endDateObj)) {
            console.error("종료일 파싱 오류:", endDate);
            endDateObj = new Date(); // 오류 시 오늘 날짜 사용
            endDateObj.setHours(23, 59, 59, 999);
          }
        } catch (error) {
          console.error("종료일 파싱 예외 발생:", error);
          endDateObj = new Date();
          endDateObj.setHours(23, 59, 59, 999);
        }

        // 종료일이 미래인 경우 오늘까지만 표시
        const todayWithoutTime = new Date();
        todayWithoutTime.setHours(23, 59, 59, 999); // 오늘 날짜를 포함하도록 23:59:59로 설정
        if (endDateObj > todayWithoutTime) {
          endDateObj = todayWithoutTime;
        }
      }

      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        console.error("날짜 파싱 오류", { startDate, endDate });
        return [];
      }

      // 시작일이 종료일보다 이후인 경우
      if (startDateObj > endDateObj) {
        return [];
      }

      const dates = [];
      let currentDate = startDateObj;

      // 날짜가 너무 많아지는 것을 방지 (최대 365일)
      const maxDays = 365;
      const totalDays = differenceInDays(endDateObj, startDateObj);

      if (totalDays > maxDays) {
        console.warn(
          `날짜 범위가 너무 큽니다: ${totalDays}일. ${maxDays}일로 제한합니다.`
        );
        endDateObj = addDays(startDateObj, maxDays);
      }

      // 각 날짜 생성
      while (
        isBefore(currentDate, endDateObj) ||
        isSameDay(currentDate, endDateObj)
      ) {
        // 현재 날짜가 업무 요일에 해당하는지 확인 (매일, 매주, 격주 등 설정에 따라)
        if (isTaskDay(currentDate)) {
          const dateStr = format(currentDate, "yyyy/MM/dd");
          dates.push(dateStr);
        }

        currentDate = addDays(currentDate, 1);
      }

      return dates;
    } catch (error) {
      console.error("날짜 목록 생성 중 오류:", error);
      return [];
    }
  };

  // 이름에서 언더스코어 제거하는 함수
  const formatActorName = (name) => {
    if (!name || typeof name !== "string") return name;

    // 언더스코어가 있으면 앞부분만 반환
    const underscoreIndex = name.indexOf("_");
    if (underscoreIndex > 0) {
      return name.substring(0, underscoreIndex);
    }

    return name;
  };

  // 특정 날짜의 완료 상태 확인 및, 완료자 정보 (actors) 반환
  const getCompletionStatus = (dateStr) => {
    if (!taskHistory || taskHistory.length === 0) return { status: "미완료" };

    // 이 날짜에 대한 관련 기록 찾기 (complete, cancel_complete, update_completers)
    const relevantRecords = taskHistory.filter((item) => {
      if (!item.timestamp) return false;

      try {
        const recordDate = new Date(item.timestamp);
        if (!isValid(recordDate)) return false;

        // 시간 정보 없이 년/월/일만 비교
        const recordDateStr = format(recordDate, "yyyy/MM/dd");

        // 날짜가 일치하고 관련 액션인 경우
        return (
          recordDateStr === dateStr &&
          ["complete", "cancel_complete", "update_completers"].includes(
            item.action
          )
        );
      } catch (error) {
        console.error(
          "날짜/액션 비교 오류:",
          error,
          item.timestamp,
          item.action
        );
        return false;
      }
    });

    if (relevantRecords.length === 0) return { status: "미완료" };

    // 가장 최근 관련 기록 기준 (시간순으로 정렬 후)
    relevantRecords.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    const latestRelevantRecord = relevantRecords[0];

    // 최신 기록이 완료 취소면 미완료 상태
    if (latestRelevantRecord.action === "cancel_complete") {
      return { status: "미완료" };
    }

    // 완료 또는 완료자 변경 기록이 있으면 완료 상태
    // 완료자 정보 처리
    let actors = [];
    const record = latestRelevantRecord; // 명확성을 위해 변수명 변경

    // actors 배열 처리
    if (Array.isArray(record.actors) && record.actors.length > 0) {
      actors = record.actors;
    }
    // actor 문자열 처리 (쉼표 구분 포함)
    else if (record.actor) {
      actors = (
        typeof record.actor === "string" && record.actor.includes(",")
          ? record.actor.split(",").map((a) => a.trim())
          : [record.actor]
      ).filter(Boolean); // 빈 문자열 제거
    }
    // completedBy 문자열 처리 (쉼표 구분 포함)
    else if (record.completedBy) {
      actors = (
        typeof record.completedBy === "string" &&
        record.completedBy.includes(",")
          ? record.completedBy.split(",").map((a) => a.trim())
          : [record.completedBy]
      ).filter(Boolean); // 빈 문자열 제거
    }
    // actionBy 문자열 처리 (쉼표 구분 포함)
    else if (record.actionBy) {
      actors = (
        typeof record.actionBy === "string" && record.actionBy.includes(",")
          ? record.actionBy.split(",").map((a) => a.trim())
          : [record.actionBy]
      ).filter(Boolean); // 빈 문자열 제거
    }

    // 각 actor를 객체 형태로 변환 (NameCoin 컴포넌트 요구사항)
    const actorObjects = actors
      .map((actor) => {
        // 이미 객체인 경우
        if (typeof actor === "object" && actor !== null) {
          return {
            id: actor.id || actor.userId || actor, // 다양한 ID 필드 고려
            name: formatActorName(actor.name || actor.userName || actor), // 다양한 이름 필드 고려
            ...actor,
          };
        }
        // 문자열인 경우 객체로 변환
        if (typeof actor === "string" && actor.trim()) {
          return {
            id: actor.trim(),
            name: formatActorName(actor.trim()),
          };
        }
        return null; // 유효하지 않은 액터는 null 반환
      })
      .filter(Boolean); // null 값 제거

    return {
      status: "상완",
      timestamp: record.timestamp,
      actors: actorObjects,
    };
  };

  // 날짜별 완료 상태 포함한 전체 기록 생성
  const getAllRecords = () => {
    const allDates = generateAllDates();

    return allDates.map((dateStr) => {
      const completionInfo = getCompletionStatus(dateStr);

      // 날짜 문자열에서 요일 계산 (수정된 방식)
      const dateObj = new Date(dateStr.split("/").join("-"));
      const dayIndex = dateObj.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
      const koreanDays = ["일", "월", "화", "수", "목", "금", "토"];
      const dayName = koreanDays[dayIndex];

      // 해당 날짜의 완료 기록 찾기 (시간 정보 포함)
      const dateRecord = taskHistory.find((item) => {
        if (!item.timestamp) return false;

        try {
          // 시간 정보 없이 년/월/일만 비교
          const recordDate = new Date(item.timestamp);
          const recordDateStr = format(recordDate, "yyyy/MM/dd");

          // 해당 날짜의 완료 작업만 확인
          return (
            recordDateStr === dateStr &&
            (item.action === "complete" ||
              (item.completedBy && item.completedBy.length > 0))
          );
        } catch (error) {
          console.error("날짜 비교 오류:", error, item.timestamp);
          return false;
        }
      });

      // 오늘 날짜 확인
      const today = new Date();
      const todayStr = format(today, "yyyy/MM/dd");
      const isToday = dateStr === todayStr;

      // 날짜와 상태 정보 반환
      return {
        date: dateStr,
        dayName, // 요일 추가
        isToday, // 오늘 날짜 여부 플래그 추가
        ...completionInfo,
        // 시간 정보 추가 (완료된 경우에만)
        ...(dateRecord
          ? {
              time: formatTimeWithFallback(dateRecord.timestamp),
              dayPeriod: getDayPeriod(dateRecord.timestamp),
            }
          : {
              time: "-",
              dayPeriod: "-",
            }),
      };
    });
  };

  // 정렬 및 필터링된 업무 기록 가져오기
  const getFilteredAndSortedRecords = () => {
    let allRecords = getAllRecords();

    // 완료된 업무만 보기 옵션이 켜져있으면 완료된 업무만 필터링
    if (showOnlyCompleted) {
      allRecords = allRecords.filter((record) => record.status === "상완");
    }

    // 날짜 기준으로 정렬
    allRecords.sort((a, b) => {
      try {
        const dateA = parse(a.date, "yyyy/MM/dd", new Date());
        const dateB = parse(b.date, "yyyy/MM/dd", new Date());

        // 유효한 날짜인지 확인
        if (!isValid(dateA) || !isValid(dateB)) {
          console.error("정렬 중 유효하지 않은 날짜:", a.date, b.date);
          return 0;
        }

        // 정렬 방향에 따라 정렬
        return sortDirection === "asc"
          ? dateA.getTime() - dateB.getTime() // 오름차순 (과거 → 최신)
          : dateB.getTime() - dateA.getTime(); // 내림차순 (최신 → 과거)
      } catch (error) {
        console.error("날짜 정렬 오류:", error, a.date, b.date);
        return 0;
      }
    });

    return allRecords;
  };

  // 정렬 방향 토글
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  // 완료된 업무만 보기 토글
  const toggleCompletedFilter = () => {
    setShowOnlyCompleted(!showOnlyCompleted);
  };

  // TaskAddModal로 돌아가기
  const handleBack = () => {
    setIsVisible(false);
  };

  // 요일 배열
  const days = ["월", "화", "수", "목", "금", "토", "일"];

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
              {/* 테이블 레코드 개수 표시 */}
              <div className="mb-2 text-sm text-gray-600 flex justify-between items-center">
                <div>
                  <span className="font-medium">
                    {filteredAndSortedRecords.length}개
                  </span>
                  <span className="ml-1">
                    {showOnlyCompleted ? "완료 항목" : "업무 기록"} 표시 중
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  <span className="italic">헤더를 클릭하여 정렬/필터 변경</span>
                </div>
              </div>

              {/* 헤더 부분 */}
              <div className="mb-4 bg-white border border-gray-300 rounded-md overflow-hidden">
                <div className="flex">
                  <InteractiveHeader
                    className="px-6 py-3 font-medium text-center w-1/2 border-r border-gray-300"
                    onClick={toggleSortDirection}
                  >
                    일시
                    <span
                      className={`indicator ml-1 ${
                        sortDirection === "asc" ? "asc" : ""
                      }`}
                    >
                      {sortDirection === "asc" ? "▼" : "▲"}
                    </span>
                  </InteractiveHeader>
                  <InteractiveHeader
                    className={`px-6 py-3 font-medium text-center w-1/2 ${
                      showOnlyCompleted ? "active" : ""
                    }`}
                    onClick={toggleCompletedFilter}
                  >
                    {showOnlyCompleted ? (
                      <div className="flex items-center justify-center">
                        완료만
                        <svg
                          className="w-4 h-4 ml-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        모두
                      </div>
                    )}
                  </InteractiveHeader>
                </div>
              </div>

              {/* 테이블 본문 - 스크롤 가능한 영역 */}
              <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md">
                {loading || !dataReady ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : filteredAndSortedRecords.length > 0 ? (
                  filteredAndSortedRecords.map((record, index) => (
                    <div
                      key={index}
                      className={`flex border-b border-gray-100 ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } ${record.isToday ? "bg-yellow-50" : ""}`}
                    >
                      <div className="w-1/2 py-4 px-4 flex flex-col items-center justify-center">
                        <div
                          className={`font-medium ${
                            record.isToday
                              ? "text-orange-600 font-bold"
                              : "text-gray-700"
                          }`}
                        >
                          {record.date} ({record.dayName})
                          {record.isToday && (
                            <span className="ml-1 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                              오늘
                            </span>
                          )}
                        </div>
                        {record.status === "상완" &&
                          record.dayPeriod !== "-" && (
                            <div className="text-xs text-gray-500 mt-1">
                              {record.dayPeriod} {record.time} 완료
                            </div>
                          )}
                      </div>
                      <div className="w-1/2 py-4 px-2 flex justify-center items-center">
                        {record.status === "상완" ? (
                          <CompletionInfo>
                            <div className="actor-list">
                              {record.actors && record.actors.length > 0 ? (
                                <>
                                  {record.actors.length <= 3 ? (
                                    // 3명 이하면 모두 표시
                                    record.actors.map((actor, i) => (
                                      <NameCoin key={i} item={actor} />
                                    ))
                                  ) : (
                                    // 3명 초과면 첫 2명과 나머지 수 표시
                                    <>
                                      <NameCoin item={record.actors[0]} />
                                      <NameCoin item={record.actors[1]} />
                                      <NameCoin
                                        extraCount={record.actors.length - 2}
                                      />
                                    </>
                                  )}
                                </>
                              ) : (
                                <StatusBadge className="bg-orange-100 text-orange-500 border border-orange-200">
                                  완료됨
                                </StatusBadge>
                              )}
                            </div>
                          </CompletionInfo>
                        ) : (
                          <StatusBadge className="bg-gray-100 text-gray-500 border border-gray-200">
                            미완료
                          </StatusBadge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-center items-center h-full text-gray-500 py-10">
                    {showOnlyCompleted
                      ? "완료된 업무가 없습니다"
                      : "업무 일지가 없습니다"}
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
