import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import NameCoin from "./NameCoin";
import ModalTemplate from "./ModalTemplate";
import HospitalStaffSelector from "./HospitalStaffSelector";
import WhoSelector from "./WhoSelector";
import TaskCompleterSelector from "./TaskCompleterSelector";
import TaskRecordModal from "../Task/TaskRecordModal";
import {
  completeTask,
  getTaskHistory,
  getTaskCompleters,
} from "../Task/TaskService";
import { useToast } from "../../contexts/ToastContext";
import { format } from "date-fns";

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
  const { showToast, currentUser } = useToast();

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

  const { id, title, content, priority = "중" } = task || {};

  // fetchHistory function
  const fetchHistory = async () => {
    if (!id) return; // Exit if task ID is not available
    try {
      setIsDataLoading(true);
      const dateToQuery = currentDate || new Date();
      const history = await getTaskHistory(id, dateToQuery);

      if (!history || history.length === 0) {
        setTaskHistory([]);
        setHasTaskHistory(false);
        setSelectedCompleters([]);
        return; // Exit early
      }

      setTaskHistory(history);
      const isCompleted = isCompletedForCurrentDate(history);
      setHasTaskHistory(isCompleted);

      if (isCompleted) {
        // 완료 상태일 때만 완료자 정보 추출 시도
        const latestRecord = [...history].sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        )[0];

        let completers = [];
        if (latestRecord) {
          if (
            Array.isArray(latestRecord.actors) &&
            latestRecord.actors.length > 0
          ) {
            // Ensure actors are objects {id, name}
            completers = latestRecord.actors
              .map(
                (actor) =>
                  typeof actor === "object" && actor !== null && actor.id
                    ? actor // Already an object with id
                    : { id: String(actor), name: String(actor) } // Convert string ID or other types to object
              )
              .filter((c) => c.id); // Ensure valid id after conversion
          } else if (latestRecord.actor) {
            // Fallback for older data structures?
            completers = [
              {
                id: String(latestRecord.actor),
                name: String(latestRecord.actor),
              },
            ];
          }
          // Note: actionBy should generally not be considered a completer
        }
        // If isCompleted is true, but we couldn't find completers, log a warning.
        if (completers.length === 0) {
          console.warn(
            `[ToDo] Task ${id} marked as completed but no completers found in latest record:`,
            latestRecord
          );
        }
        setSelectedCompleters(completers);
      } else {
        setSelectedCompleters([]); // Not completed
      }
    } catch (error) {
      console.error(`업무 이력 조회 중 오류 (${id}):`, error);
      setHasTaskHistory(false);
      setSelectedCompleters([]);
    } finally {
      setIsDataLoading(false);
    }
  };

  // useEffect for fetching history
  useEffect(() => {
    fetchHistory();
  }, [id, currentDate]); // Dependencies

  // isCompletedForCurrentDate function (seems correct)
  const isCompletedForCurrentDate = (historyToCheck = taskHistory) => {
    if (!historyToCheck || historyToCheck.length === 0) return false;
    const sortedHistory = [...historyToCheck].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    const latestRelevantAction = sortedHistory.find((h) =>
      ["complete", "update_completers", "cancel_complete"].includes(h.action)
    );
    return (
      latestRelevantAction && latestRelevantAction.action !== "cancel_complete"
    );
  };

  // handleCompleteTask function
  const handleCompleteTask = async (staffIds = null) => {
    if (isProcessingRef.current) {
      console.warn("[ToDo] 이전 완료 요청 처리 중...");
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      let previousCompleters = [...selectedCompleters];
      let previousHasHistory = hasTaskHistory;
      setIsDataLoading(true); // Indicate loading START

      try {
        isProcessingRef.current = true;

        // Ensure staffIds is an array of IDs and not empty
        const completersToSet = Array.isArray(staffIds)
          ? staffIds.filter(Boolean)
          : []; // Filter out any null/undefined IDs

        if (completersToSet.length === 0) {
          showToast("완료자를 선택해주세요.", "warning");
          throw new Error("No completers selected"); // Throw error to simplify cleanup
        }

        // --- Date processing ---
        const latestDate = currentDateRef.current;
        let dateObj;
        if (latestDate) {
          if (typeof latestDate === "string") {
            // Attempt to parse YYYY/MM/DD or YYYY-MM-DD
            dateObj = new Date(latestDate.replace(/\//g, "-"));
          } else if (latestDate instanceof Date) {
            dateObj = new Date(latestDate.getTime());
          }
          // Validate and normalize
          if (dateObj && !isNaN(dateObj.getTime())) {
            dateObj.setHours(0, 0, 0, 0);
          } else {
            console.error(
              "[ToDo] Invalid date object created from:",
              latestDate
            );
            dateObj = null;
          }
        }
        if (!dateObj) {
          showToast("날짜 정보 오류로 완료 처리에 실패했습니다.", "error");
          throw new Error("Invalid date provided");
        }
        const dateStr = format(dateObj, "yyyy-MM-dd");

        // --- Duplicate request check ---
        const now = Date.now();
        if (lastRequestRef.current) {
          const {
            taskId: lastTaskId,
            staffIds: lastStaffIds,
            dateStr: lastDateStr,
            timestamp,
          } = lastRequestRef.current;
          const isRecent = now - timestamp < 1500;
          // Compare stringified ID arrays for simplicity
          const isSame =
            lastTaskId === id &&
            JSON.stringify(lastStaffIds?.sort()) ===
              JSON.stringify(completersToSet?.sort()) &&
            lastDateStr === dateStr;
          if (isRecent && isSame) {
            console.warn(
              `[ToDo] ${id} (${dateStr}) 중복 완료 요청 감지. 무시합니다.`
            );
            // Stop processing but ensure finally block runs for cleanup
            isProcessingRef.current = false;
            setIsDataLoading(false);
            return;
          }
        }
        // Store the original ID array for duplicate check
        lastRequestRef.current = {
          taskId: id,
          staffIds: completersToSet,
          dateStr,
          timestamp: now,
        };

        console.log(
          `[ToDo] ${id} (${dateStr}) 완료 처리 시도:`,
          completersToSet
        );

        // --- Optimistic Update ---
        // Convert IDs to objects for local state display
        // Fetch user details for better optimistic display might be needed here later
        const completerObjects = completersToSet.map((cId) => ({
          id: cId,
          name: cId,
        })); // Simple optimistic display
        setSelectedCompleters(completerObjects);
        setHasTaskHistory(true);

        // --- Call Service ---
        const options = {
          taskDateStr: dateStr,
          date: dateObj,
          actionBy: currentUser?.uid || "unknown",
        };
        console.log(`[ToDo] Calling completeTask with:`, {
          id,
          staffIds: completersToSet,
          options,
        });
        await completeTask(id, completersToSet, options); // Pass the ID array

        console.log(`[ToDo] ${id} (${dateStr}) 완료 처리 성공.`);
        showToast("업무가 완료 처리되었습니다.", "success");

        // --- Post-Success: Consider re-fetching history ---
        // await fetchHistory(); // Uncomment for maximum data consistency assurance
      } catch (error) {
        console.error(`[ToDo] ${id} 완료 처리 중 오류:`, error);
        // Avoid double toasts if validation failed
        if (
          error.message !== "No completers selected" &&
          error.message !== "Invalid date provided"
        ) {
          showToast("업무 완료 처리 중 오류가 발생했습니다.", "error");
        }

        // --- Rollback ---
        console.warn(`[ToDo] 오류 발생으로 상태 롤백 중...`);
        lastRequestRef.current = null; // Clear last request on error
        setSelectedCompleters(previousCompleters);
        setHasTaskHistory(previousHasHistory);
      } finally {
        // --- Cleanup ---
        setIsDataLoading(false); // Indicate loading END
        isProcessingRef.current = false;
        // Clear timer reference
        timerRef.current = null;
      }
    }, 300); // Debounce
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

        <TextZone className="flex-1 px-[20px] flex flex-col justify-center overflow-hidden">
          <span
            className={`font-medium truncate ${
              hasTaskHistory ? "line-through text-gray-500" : ""
            }`}
            title={title || content || "제목 없음"}
          >
            {title || content || "제목 없음"}
          </span>
        </TextZone>

        {/* Completer Display Area */}
        {showCompleter && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center min-w-[120px] px-2"
          >
            {/* Loading State */}
            {isDataLoading ? (
              <div className="h-[40px] flex items-center justify-center">
                <div className="w-5 h-5 border-t-2 border-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : hasTaskHistory ? (
              <div className="flex items-center justify-center h-[40px] gap-1 flex-wrap">
                {selectedCompleters && selectedCompleters.length > 0 ? (
                  // Display NameCoins for completers
                  selectedCompleters.map((completer, index) => (
                    <NameCoin key={completer.id || index} item={completer} />
                  ))
                ) : (
                  // Completed but no completer info (indicates data issue)
                  <span className="text-xs text-gray-500 italic whitespace-nowrap">
                    완료됨(정보?)
                  </span>
                )}
              </div>
            ) : (
              <TaskCompleterSelector
                selectedPeople={selectedCompleters
                  .map((c) => c.id)
                  .filter(Boolean)}
                onPeopleChange={handleCompleteTask}
                isCurrentDate={isToday()}
                isCompleted={false}
                taskDate={currentDate}
              />
            )}
          </div>
        )}

        {/* Drag Handle */}
        {isDraggable && renderDragHandle && renderDragHandle()}
      </div>

      {/* History Modal */}
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
