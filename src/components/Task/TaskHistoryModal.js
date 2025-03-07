import React from "react";
import styled from "styled-components";
import ModalTemplate from "../common/ModalTemplate";
import { cancel } from "../../assets";

const ModalHeaderZone = styled.div``;
const ModalContentZone = styled.div``;

/**
 * 업무 이력을 확인할 수 있는 모달 컴포넌트
 * @param {boolean} isVisible - 모달 표시 여부
 * @param {function} setIsVisible - 모달 표시 상태 변경 함수
 * @param {Object} task - 현재 선택된 업무 객체
 * @param {Array} history - 업무 이력 배열
 */
export default function TaskHistoryModal({
  isVisible,
  setIsVisible,
  task,
  history = [],
}) {
  if (!isVisible) return null;

  // 이력 행동(action)별 한글 표시
  const actionLabels = {
    create: "생성",
    update: "수정",
    complete: "완료",
    assign: "배정",
    delete: "삭제",
  };

  // 날짜 포맷팅 함수
  const formatDate = (date) => {
    if (!date) return "-";

    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(
      2,
      "0"
    )}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // 세부 정보 렌더링 함수
  const renderActionDetails = (item) => {
    switch (item.action) {
      case "assign":
        return (
          <span>
            담당자 변경: <strong>{item.previousAssignee || "미배정"}</strong> →{" "}
            <strong>{item.newAssignee || "미배정"}</strong>
          </span>
        );
      case "complete":
        return (
          <div>
            <div>
              상태 변경: {item.previousStatus === "completed" ? "완료" : "대기"}{" "}
              → <strong className="text-green-600">완료</strong>
            </div>
            {(item.completedBy ||
              item.actor ||
              (item.actors && item.actors.length > 0)) && (
              <div className="mt-1">
                완료자:{" "}
                <strong>
                  {item.completedBy ||
                    item.actor ||
                    (Array.isArray(item.actors) ? item.actors.join(", ") : "-")}
                </strong>
              </div>
            )}
            {item.memo && (
              <div className="mt-1 italic text-gray-600">"{item.memo}"</div>
            )}
          </div>
        );
      case "update":
        return <span>업무 정보 수정됨</span>;
      case "create":
        return (
          <span>
            <strong>{item.actionBy || "시스템"}</strong>에 의해 업무가 생성됨
          </span>
        );
      case "delete":
        return <span>업무 삭제됨</span>;
      default:
        return <span>{item.details || "세부 정보 없음"}</span>;
    }
  };

  return (
    <ModalTemplate
      isVisible={isVisible}
      setIsVisible={setIsVisible}
      showCancel={false}
    >
      <div className="flex flex-col items-center w-onceBigModal h-onceBigModalH bg-white px-[40px] py-[30px]">
        <ModalHeaderZone className="flex flex-row w-full bg-white justify-between h-[50px] items-center">
          <span className="text-[34px] font-bold">업무 이력</span>
          <img
            onClick={() => setIsVisible(false)}
            className="w-[30px]"
            src={cancel}
            alt="닫기"
            style={{ cursor: "pointer" }}
          />
        </ModalHeaderZone>

        <ModalContentZone className="flex flex-col h-full py-[20px] w-full">
          {/* 업무 정보 헤더 */}
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <h3 className="text-xl font-bold">{task?.title || "제목 없음"}</h3>
            <p className="text-gray-600 mt-2">{task?.content || "-"}</p>
            <div className="flex mt-2 text-sm text-gray-500">
              <span className="mr-4">
                시작일:{" "}
                {task?.startDate
                  ? new Date(task.startDate).toLocaleDateString()
                  : "-"}
              </span>
              <span>
                종료일:{" "}
                {task?.endDate
                  ? new Date(task.endDate).toLocaleDateString()
                  : "-"}
              </span>
            </div>
          </div>

          {/* 업무 이력 테이블 */}
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 border text-left">날짜</th>
                  <th className="p-2 border text-left">행동</th>
                  <th className="p-2 border text-left">담당자</th>
                  <th className="p-2 border text-left">세부 정보</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? (
                  history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-2 border">
                        {formatDate(item.timestamp)}
                      </td>
                      <td className="p-2 border">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs text-white ${
                            item.action === "complete"
                              ? "bg-green-500"
                              : item.action === "create"
                              ? "bg-blue-500"
                              : item.action === "assign"
                              ? "bg-purple-500"
                              : item.action === "update"
                              ? "bg-yellow-500"
                              : item.action === "delete"
                              ? "bg-red-500"
                              : "bg-gray-500"
                          }`}
                        >
                          {actionLabels[item.action] || item.action}
                        </span>
                      </td>
                      <td className="p-2 border font-medium">
                        {item.actionBy || item.actor || "-"}
                      </td>
                      <td className="p-2 border">
                        {renderActionDetails(item)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-gray-500">
                      이력이 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ModalContentZone>
      </div>
    </ModalTemplate>
  );
}
