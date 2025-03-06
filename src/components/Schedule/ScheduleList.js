import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { useToast } from "../../contexts/ToastContext";

const ScheduleList = ({
  currentDate,
  selectedTeam,
  schedules = [],
  onAddSchedule,
  onEditSchedule,
  onDeleteSchedule,
}) => {
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [activeMember, setActiveMember] = useState(null);

  // useToast 훅 사용
  const { showToast } = useToast();

  // 선택된 날짜가 변경될 때 필터링된 일정 업데이트
  useEffect(() => {
    if (!currentDate || !schedules) return;

    const filtered = schedules.filter(
      (schedule) =>
        schedule.date.getDate() === currentDate.getDate() &&
        schedule.date.getMonth() === currentDate.getMonth() &&
        schedule.date.getFullYear() === currentDate.getFullYear()
    );

    setFilteredSchedules(filtered);
  }, [currentDate, schedules]);

  // 팀원 선택 시 해당 팀원 부분으로 스크롤
  const handleMemberClick = (member) => {
    setActiveMember(member.id === activeMember ? null : member.id);
    const element = document.getElementById(`member-${member.id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // 일정 유형별 배경 색상
  const typeColors = {
    일반: "#16B028", // 녹색
    예약: "#002D5D", // 파란색
    휴가: "#FF762D", // 오렌지색
  };

  // 새 일정 추가 핸들러
  const handleAddSchedule = (memberId) => {
    if (onAddSchedule) {
      onAddSchedule(memberId);
    } else {
      showToast("일정 추가 기능이 아직 구현되지 않았습니다.", "info");
    }
  };

  // 일정 수정 핸들러
  const handleEditSchedule = (scheduleId) => {
    if (onEditSchedule) {
      onEditSchedule(scheduleId);
    } else {
      showToast("일정 수정 기능이 아직 구현되지 않았습니다.", "info");
    }
  };

  // 일정 삭제 핸들러
  const handleDeleteSchedule = (scheduleId) => {
    if (onDeleteSchedule) {
      onDeleteSchedule(scheduleId);
    } else {
      showToast("일정 삭제 기능이 아직 구현되지 않았습니다.", "info");
    }
  };

  return (
    <div className="w-full h-full">
      {/* 팀원 목록 */}
      {/* <div className="flex flex-wrap mb-6">
        {selectedTeam.members.map((member) => (
          <div key={member.id} className="mb-4 mr-4">
            <div
              className={`border-2 border-[#002D5D] rounded-[4px] p-2 w-[159px] text-center cursor-pointer ${
                activeMember === member.id ? "bg-[#002D5D] text-white" : ""
              }`}
              onClick={() => handleMemberClick(member)}
            >
              <h3 className="font-medium">{member.name}</h3>
            </div>
          </div>
        ))}
      </div> */}

      {/* 팀원별 일정 */}
      <div className="grid grid-cols-3 gap-6">
        {selectedTeam.members.map((member) => (
          <div
            key={member.id}
            id={`member-${member.id}`}
            className={`mb-8 ${
              activeMember && activeMember !== member.id ? "opacity-50" : ""
            }`}>
            <div className="border-2 border-[#002D5D] rounded-[4px] p-2 mb-4 w-full text-center">
              <h3 className="font-medium">{member.name}</h3>
            </div>

            <div className="space-y-3">
              {filteredSchedules
                .filter((schedule) => schedule.memberId === member.id)
                .map((schedule) => (
                  <div
                    key={schedule.id}
                    className="w-full rounded-[7px] p-2 relative"
                    style={{ backgroundColor: typeColors[schedule.type] }}>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">
                        {schedule.title}
                      </span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditSchedule(schedule.id)}
                          className="text-white hover:text-gray-200">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="text-white hover:text-gray-200">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex text-white text-xs mt-1">
                      <span>{schedule.type}</span>
                      <span className="mx-1">|</span>
                      <span>
                        {schedule.startTime} - {schedule.endTime}
                      </span>
                    </div>
                    {schedule.type === "예약" && schedule.patientName && (
                      <div className="text-white text-xs mt-1">
                        환자: {schedule.patientName}
                        {schedule.patientNumber &&
                          ` (${schedule.patientNumber})`}
                      </div>
                    )}
                    {schedule.note && (
                      <div className="text-white text-xs mt-1 italic">
                        {schedule.note}
                      </div>
                    )}
                  </div>
                ))}

              <div
                className="w-full h-[32px] border border-[#002D5D] rounded-[8px] flex items-center justify-center cursor-pointer hover:bg-gray-50"
                onClick={() => handleAddSchedule(member.id)}>
                <span className="text-[#002D5D] text-xs">추가하기 +</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleList;
