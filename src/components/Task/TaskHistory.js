import React, { useState, useEffect } from "react";
import { getTaskHistory } from "./TaskService";
import ModalTemplate from "../common/ModalTemplate";
import NameCoin from "../common/NameCoin";
import hospitalStaff from "../../datas/users";

const TaskHistory = ({ taskId, isVisible, setIsVisible, currentDate }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isVisible && taskId) {
      fetchTaskHistory();
    }
  }, [isVisible, taskId, currentDate]);

  const fetchTaskHistory = async () => {
    if (!taskId) return;

    try {
      setLoading(true);
      const historyData = await getTaskHistory(taskId, currentDate);
      setHistory(historyData);
      console.log("TaskHistory: 이력 조회 결과", historyData);
    } catch (error) {
      console.error("TaskHistory: 업무 이력 조회 중 오류", error);
    } finally {
      setLoading(false);
    }
  };

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

  const renderStaffIds = (staffIds) => {
    if (!staffIds || (Array.isArray(staffIds) && staffIds.length === 0)) {
      return <span className="text-gray-400">없음</span>;
    }

    const staffList = Array.isArray(staffIds) ? staffIds : [staffIds];
    const staffObjects = staffList.map((id) => {
      const staff = hospitalStaff.find((s) => s.id === id);
      return staff || { id, name: id };
    });

    return (
      <div className="flex flex-wrap gap-1">
        {staffObjects.map((staff) => (
          <NameCoin key={staff.id} item={staff} size="sm" />
        ))}
      </div>
    );
  };

  const groupHistoryByDate = () => {
    const groups = {};

    history.forEach((item) => {
      const date =
        item.timestamp instanceof Date
          ? item.timestamp
          : new Date(item.timestamp);

      const dateStr = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }

      groups[dateStr].push(item);
    });

    return Object.entries(groups)
      .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
      .map(([date, items]) => ({
        date,
        items: items.sort((a, b) => {
          const timeA =
            a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
          const timeB =
            b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
          return timeB - timeA;
        }),
      }));
  };

  const historyGroups = groupHistoryByDate();

  return (
    <ModalTemplate isVisible={isVisible} setIsVisible={setIsVisible}>
      <div className="p-4 max-w-lg w-full bg-white rounded-lg">
        <h2 className="text-xl font-bold mb-4">업무 이력</h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">이력이 없습니다.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {historyGroups.map((group) => (
              <div key={group.date} className="py-3">
                <div className="font-medium text-gray-700 mb-2 px-2 bg-gray-100 rounded">
                  {new Date(group.date).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>

                <ul className="space-y-3">
                  {group.items.map((item) => (
                    <li key={item.id} className="px-2">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold">
                          {getActionLabel(item.action)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(item.timestamp)
                            .split(" ")
                            .slice(-2)
                            .join(" ")}
                        </span>
                      </div>

                      {item.action === "complete" && (
                        <div className="mt-2">
                          <div className="flex">
                            <span className="text-sm text-gray-500 w-20">
                              완료자:
                            </span>
                            <div className="flex-1">
                              {renderStaffIds(item.actors || item.actionBy)}
                            </div>
                          </div>
                        </div>
                      )}

                      {item.action === "update_completers" && (
                        <div className="mt-2">
                          <div className="flex">
                            <span className="text-sm text-gray-500 w-20">
                              이전 완료자:
                            </span>
                            <div className="flex-1">
                              {renderStaffIds(item.previousActors)}
                            </div>
                          </div>
                          <div className="flex mt-1">
                            <span className="text-sm text-gray-500 w-20">
                              새 완료자:
                            </span>
                            <div className="flex-1">
                              {renderStaffIds(item.actors)}
                            </div>
                          </div>
                        </div>
                      )}

                      {item.action === "assign" && (
                        <div className="mt-2">
                          <div className="flex">
                            <span className="text-sm text-gray-500 w-20">
                              이전 담당:
                            </span>
                            <div className="flex-1">
                              {item.previousAssignee}
                            </div>
                          </div>
                          <div className="flex mt-1">
                            <span className="text-sm text-gray-500 w-20">
                              새 담당:
                            </span>
                            <div className="flex-1">{item.newAssignee}</div>
                          </div>
                        </div>
                      )}

                      {item.action === "cancel_complete" && (
                        <div className="mt-2">
                          <div className="flex">
                            <span className="text-sm text-gray-500 w-20">
                              취소자:
                            </span>
                            <div className="flex-1">
                              {renderStaffIds(item.actor || item.actionBy)}
                            </div>
                          </div>
                        </div>
                      )}

                      {item.memo && (
                        <div className="mt-2">
                          <div className="flex">
                            <span className="text-sm text-gray-500 w-20">
                              메모:
                            </span>
                            <div className="flex-1">{item.memo}</div>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => setIsVisible(false)}
          >
            닫기
          </button>
        </div>
      </div>
    </ModalTemplate>
  );
};

export default TaskHistory;
