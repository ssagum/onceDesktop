import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import NameCoin from "./NameCoin";
import ModalTemplate from "./ModalTemplate";
import HospitalStaffSelector from "./HospitalStaffSelector";
import WhoSelector from "./WhoSelector";
import TaskCompleterSelector from "./TaskCompleterSelector";
import TaskRecordModal from "../Task/TaskRecordModal";
import { getTaskHistory, getTaskCompleters } from "../Task/TaskService";
import { useToast } from "../../contexts/ToastContext";

const ColorZone = styled.div``;
const TextZone = styled.div``;
const ManagingZone = styled.div``;

// 중요도에 따른 색상 매핑
const priorityColors = {
  상: "bg-red-400",
  중: "bg-yellow-400",
  하: "bg-green-400",
};

/**
 * 통합 ToDo 컴포넌트
 * @param {Object} task - 업무 객체
 * @param {boolean} showCompleter - 완료자 표시/설정 UI 표시 여부 (HomeMainCanvas용)
 * @param {boolean} isDraggable - 드래그 가능 여부 (TaskMainCanvas용)
 * @param {Function} renderDragHandle - 드래그 핸들 렌더링 함수 (TaskMainCanvas에서 제공)
 * @param {Function} onViewHistory - 업무 이력 조회 핸들러
 */
export default function ToDo({
  task,
  tasks,
  showCompleter = false,
  isDraggable = false,
  renderDragHandle = null,
  onTaskClick,
  onViewHistory,
  currentDate,
}) {
  const [taskDetailModalOpen, setTaskDetailModalOpen] = useState(false);

  // tasks 배열이 전달된 경우
  if (Array.isArray(tasks)) {
    return (
      <div className="w-full">
        {tasks.length > 0 ? (
          tasks.map((taskItem) => (
            <SingleTodoItem
              key={taskItem.id}
              task={taskItem}
              showCompleter={showCompleter}
              isDraggable={isDraggable}
              renderDragHandle={renderDragHandle}
              onTaskClick={onTaskClick}
              onViewHistory={onViewHistory}
              currentDate={currentDate}
            />
          ))
        ) : (
          <div className="text-center text-gray-500 py-8 select-none">
            표시할 업무가 없습니다.
          </div>
        )}
      </div>
    );
  }

  // 단일 task가 전달된 경우
  return (
    <SingleTodoItem
      task={task}
      showCompleter={showCompleter}
      isDraggable={isDraggable}
      renderDragHandle={renderDragHandle}
      onTaskClick={onTaskClick}
      onViewHistory={onViewHistory}
      currentDate={currentDate}
    />
  );
}

// 단일 ToDo 아이템 컴포넌트
function SingleTodoItem({
  task,
  showCompleter,
  isDraggable,
  renderDragHandle,
  onTaskClick,
  onViewHistory,
  currentDate,
}) {
  const [selectedCompleters, setSelectedCompleters] = useState([]);
  const [taskHistory, setTaskHistory] = useState([]);
  const [hasTaskHistory, setHasTaskHistory] = useState(false);
  const [showTaskHistory, setShowTaskHistory] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { showToast } = useToast();

  // 최신 currentDate를 추적하는 ref
  const currentDateRef = useRef(currentDate);
  // 컴포넌트가 마운트될 때의 초기 날짜를 저장
  const [initialDate, setInitialDate] = useState(null);

  // 중복 호출 방지를 위한 플래그
  const isProcessingRef = useRef(false);
  // 마지막으로 처리한 요청 정보 저장
  const lastRequestRef = useRef(null);
  // 타이머 ID 저장
  const timerRef = useRef(null);

  // currentDate가 변경될 때마다 ref 업데이트
  useEffect(() => {
    currentDateRef.current = currentDate;
  }, [currentDate]);

  // 컴포넌트 마운트 시 초기 날짜 설정
  useEffect(() => {
    if (!initialDate && currentDate) {
      setInitialDate(currentDate);
    }
  }, [initialDate, currentDate]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // task가 없거나 문자열인 경우
  if (!task || typeof task === "string") {
    return (
      <div className="h-[56px] flex flex-row w-full items-center bg-onceBackground mb-[4px] pr-[10px]">
        <ColorZone className="w-[20px] h-full bg-yellow-400" />
        <TextZone className="flex-1 px-[20px]">
          <span className="font-medium">{task || "제목 없음"}</span>
        </TextZone>
      </div>
    );
  }

  const { id, title, content, priority = "중" } = task;

  // 컴포넌트 마운트 시 또는 task ID, currentDate 변경 시 taskHistory 가져오기
  useEffect(() => {
    if (id) {
      // 비동기 함수 정의
      const fetchHistory = async () => {
        try {
          setIsDataLoading(true);
          // 조회할 날짜 설정 (직접 props에서 받아옴)
          const dateToQuery = currentDate || new Date();

          // 이력 가져오기
          const history = await getTaskHistory(id, dateToQuery);

          // history가 없거나 빈 배열인 경우
          if (!history || history.length === 0) {
            setTaskHistory([]);
            setHasTaskHistory(false);
            setSelectedCompleters([]);
            setIsDataLoading(false);
            return;
          }

          // 히스토리가 존재하면 완료된 것으로 간주
          setTaskHistory(history);
          setHasTaskHistory(true);

          // 가장 최근 기록 기준으로 완료자 정보 설정
          const latestRecord = [...history].sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          )[0];

          // 완료자 정보가 있으면 설정
          if (latestRecord) {
            // actors 배열이 있는 경우
            if (
              Array.isArray(latestRecord.actors) &&
              latestRecord.actors.length > 0
            ) {
              setSelectedCompleters(latestRecord.actors);
            }
            // actor 문자열이 있는 경우
            else if (latestRecord.actor) {
              setSelectedCompleters([latestRecord.actor]);
            }
            // actionBy 문자열이 있는 경우
            else if (latestRecord.actionBy) {
              setSelectedCompleters([latestRecord.actionBy]);
            } else {
              setSelectedCompleters([]);
            }
          } else {
            setSelectedCompleters([]);
          }
        } catch (error) {
          console.error("업무 이력 조회 중 오류:", error);
          // 오류 발생 시에도 상태 초기화
          setHasTaskHistory(false);
          setSelectedCompleters([]);
        } finally {
          setIsDataLoading(false);
        }
      };

      // 비동기 함수 실행
      fetchHistory();
    }
  }, [id, currentDate]); // 의존성 배열에 currentDate 추가

  // 현재 날짜에 완료 여부 확인하는 함수
  const isCompletedForCurrentDate = () => {
    if (!taskHistory || taskHistory.length === 0) return false;

    // 취소 이력이 있으면 완료 안됨
    if (taskHistory.some((h) => h.action === "cancel_complete")) return false;

    // 완료 또는 완료자 변경 이력이 있으면 완료됨
    return taskHistory.some(
      (h) => h.action === "complete" || h.action === "update_completers"
    );
  };

  // 요청이 중복인지 확인하는 함수
  const isDuplicateRequest = (taskId, staffIds, dateStr) => {
    if (!lastRequestRef.current) return false;

    const {
      taskId: lastTaskId,
      staffIds: lastStaffIds,
      dateStr: lastDateStr,
      timestamp,
    } = lastRequestRef.current;

    // 1초 이내의 동일한 요청은 중복으로 간주
    const now = Date.now();
    const isRecentRequest = now - timestamp < 1000;

    // 동일한 태스크, 동일한 완료자, 동일한 날짜, 최근 요청인 경우 중복으로 판단
    const isSameRequest =
      lastTaskId === taskId &&
      JSON.stringify(lastStaffIds) === JSON.stringify(staffIds) &&
      lastDateStr === dateStr;

    return isRecentRequest && isSameRequest;
  };

  // 업무 완료 처리 함수 - 디바운싱 적용 및 중복 호출 방지
  const handleCompleteTask = async (staffIds = null) => {
    // 이미 처리 중인 경우 중복 호출 방지
    if (isProcessingRef.current) {
      return;
    }

    // 타이머가 있으면 취소 (디바운싱)
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 디바운싱 적용 (300ms)
    timerRef.current = setTimeout(async () => {
      try {
        // 처리 시작 플래그 설정
        isProcessingRef.current = true;
        setIsDataLoading(true);

        // 완료자 검증
        if (
          !staffIds &&
          (!selectedCompleters || selectedCompleters.length === 0)
        ) {
          showToast("완료자를 선택해주세요.", "warning");
          isProcessingRef.current = false;
          setIsDataLoading(false);
          return;
        }

        const completers = staffIds || selectedCompleters;

        // TaskService 모듈 동적 import - completeTask만 가져오기
        const { completeTask } = await import("../Task/TaskService");

        // *** 중요: 항상 최신 currentDate 사용 ***
        // 1. ref에서 최신 currentDate 가져오기 (현재 참조되는 값)
        const latestDate = currentDateRef.current;

        // 2. 날짜 객체 생성 - 항상 명시적으로 전달된 날짜만 사용
        let dateObj;

        if (latestDate) {
          // 문자열이면 Date 객체로 변환
          if (typeof latestDate === "string") {
            dateObj = new Date(latestDate);
          }
          // Date 객체면 복사
          else if (latestDate instanceof Date) {
            dateObj = new Date(latestDate.getTime());
          }
          // 시간 초기화 (00:00:00)
          if (dateObj) {
            dateObj.setHours(0, 0, 0, 0);
          }
        }

        // 유효하지 않은 날짜인 경우 (여기서는 현재 날짜를 사용하지 않고 오류 처리)
        if (!dateObj || isNaN(dateObj.getTime())) {
          console.error("[ToDo] 유효한 날짜가 제공되지 않았습니다.");
          isProcessingRef.current = false;
          setIsDataLoading(false);
          return;
        }

        // 3. YYYY-MM-DD 형식 문자열 생성
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        // 중복 요청 확인
        if (isDuplicateRequest(id, completers, dateStr)) {
          isProcessingRef.current = false;
          setIsDataLoading(false);
          return;
        }

        // 현재 요청 정보 저장
        lastRequestRef.current = {
          taskId: id,
          staffIds: completers,
          dateStr,
          timestamp: Date.now(),
        };

        // 업무 완료 처리 - 명확한 옵션 객체 전달
        const options = {
          taskDateStr: dateStr,
          date: dateObj,
        };

        // 먼저 상태를 업데이트하여 UI가 즉시 반응하도록 함
        setHasTaskHistory(true);
        setSelectedCompleters(completers);

        await completeTask(id, completers, options);

        // 완료한 날짜와 동일한 날짜로 이력 다시 조회
        const updatedHistory = await getTaskHistory(id, dateObj);

        setTaskHistory(updatedHistory || []);

        // 완료 상태 및 완료자 업데이트
        if (updatedHistory && updatedHistory.length > 0) {
          const latestHistory = updatedHistory[0];
          setHasTaskHistory(true);
          setSelectedCompleters(latestHistory.actors || completers || []);
        }

        // 성공 메시지 표시
        showToast("업무가 성공적으로 완료되었습니다.", "success");
      } catch (error) {
        console.error("업무 완료 처리 중 오류:", error);
        showToast(
          "업무 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
          "error"
        );
      } finally {
        // 처리 완료 플래그 설정
        isProcessingRef.current = false;
        setIsDataLoading(false);
      }
    }, 300); // 300ms 디바운싱
  };

  // 업무 이력 보기 핸들러
  const handleViewHistory = (e) => {
    e.stopPropagation();
    setShowTaskHistory(true);

    if (onViewHistory) {
      onViewHistory(task);
    }
  };

  // 클릭 핸들러
  const handleClick = () => {
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

  // 현재 날짜인지 확인하는 함수
  const isToday = () => {
    if (!currentDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let compareDate;
    if (typeof currentDate === "string") {
      compareDate = new Date(currentDate);
    } else if (currentDate instanceof Date) {
      compareDate = new Date(currentDate.getTime());
    } else {
      return false;
    }

    compareDate.setHours(0, 0, 0, 0);
    return compareDate.getTime() === today.getTime();
  };

  return (
    <>
      <div
        className={`h-[66px] flex flex-row w-full items-center bg-onceBackground mb-[4px] pr-[10px] ${
          isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
        } select-none`}
        onClick={isDraggable ? undefined : handleClick}
      >
        <ColorZone
          className={`w-[20px] h-full ${
            priorityColors[priority] || "bg-yellow-400"
          }`}
        />

        <TextZone className="flex-1 px-[20px] flex flex-col justify-center">
          <span
            className={`font-medium truncate ${
              isCompletedForCurrentDate() ? "line-through text-gray-500" : ""
            }`}
          >
            {title || content || "제목 없음"}
          </span>
        </TextZone>

        {/* 완료자 선택 표시 - 로딩 상태 관리 추가 */}
        {showCompleter && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center"
          >
            {isDataLoading ? (
              <div className="h-[40px] flex items-center justify-center px-4">
                <div className="w-5 h-5 border-t-2 border-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <TaskCompleterSelector
                selectedPeople={selectedCompleters}
                onPeopleChange={(selectedIds) => {
                  // 직접 완료 처리만 호출 (상태 업데이트는 completeTask 내부에서 수행)
                  if (selectedIds && selectedIds.length > 0) {
                    handleCompleteTask(selectedIds);
                  }
                }}
                isCurrentDate={isToday()}
                isCompleted={isCompletedForCurrentDate()}
                taskDate={currentDate}
              />
            )}
          </div>
        )}

        {/* 드래그 핸들 렌더링 */}
        {isDraggable && renderDragHandle && renderDragHandle()}
      </div>

      {/* 히스토리 모달 - 필요한 경우에만 표시 */}
      {showTaskHistory && (
        <TaskRecordModal
          isVisible={showTaskHistory}
          setIsVisible={setShowTaskHistory}
          task={task}
        />
      )}
    </>
  );
}
