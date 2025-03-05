import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import SideBar from "../components/SideBar";
import ScheduleCalendar from "../components/Schedule/ScheduleCalendar";
import ScheduleList from "../components/Schedule/ScheduleList";
import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { db } from "../firebase";

const MainZone = styled.div``;
const LeftZone = styled.div``;
const RightZone = styled.div``;
const FormZone = styled.div``;

// 더미 데이터 - 나중에 파이어베이스로 대체 가능
const teamData = [
  {
    id: "physicalTherapy",
    name: "물리치료팀",
    members: [
      { id: "member1", name: "이진용", color: "#4F46E5" },
      { id: "member2", name: "정현", color: "#10B981" },
      { id: "member3", name: "이기현", color: "#F59E0B" },
    ],
  },
  {
    id: "nursing",
    name: "간호팀",
    members: [
      { id: "member4", name: "김수현", color: "#EC4899" },
      { id: "member5", name: "이민정", color: "#8B5CF6" },
      { id: "member6", name: "박지원", color: "#06B6D4" },
    ],
  },
  {
    id: "admin",
    name: "행정팀",
    members: [
      { id: "member7", name: "최지훈", color: "#F97316" },
      { id: "member8", name: "한소희", color: "#14B8A6" },
      { id: "member9", name: "정우성", color: "#6366F1" },
    ],
  },
  {
    id: "doctor",
    name: "의사팀",
    members: [
      { id: "member10", name: "강동원", color: "#D946EF" },
      { id: "member11", name: "손예진", color: "#EF4444" },
      { id: "member12", name: "조인성", color: "#65A30D" },
    ],
  },
];

// 더미 일정 데이터
const dummySchedules = [
  {
    id: 1,
    date: new Date(2023, 2, 15),
    startTime: "09:30",
    endTime: "10:30",
    type: "일반",
    title: "회의",
    memberId: "member1",
  },
  {
    id: 2,
    date: new Date(2023, 2, 15),
    startTime: "10:30",
    endTime: "12:30",
    type: "예약",
    title: "환자 상담",
    memberId: "member2",
    patientName: "홍길동",
    patientNumber: "2014",
  },
  {
    id: 3,
    date: new Date(2023, 2, 15),
    startTime: "13:30",
    endTime: "14:30",
    type: "휴가",
    title: "연차",
    memberId: "member3",
  },
  {
    id: 4,
    date: new Date(2023, 2, 16),
    startTime: "09:30",
    endTime: "10:30",
    type: "예약",
    title: "환자 진료",
    memberId: "member1",
    patientName: "박상빈",
    patientNumber: "2014",
  },
  {
    id: 5,
    date: new Date(2023, 2, 17),
    startTime: "13:00",
    endTime: "15:00",
    type: "일반",
    title: "교육",
    memberId: "member4",
    note: "도수치료",
  },
  {
    id: 6,
    date: new Date(2023, 2, 17),
    startTime: "15:30",
    endTime: "16:30",
    type: "휴가",
    title: "반차",
    memberId: "member5",
  },
];

const Schedule = () => {
  const { pathname } = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTeam, setSelectedTeam] = useState(teamData[0]);
  const [schedules, setSchedules] = useState(dummySchedules);
  const [isLoading, setIsLoading] = useState(false);

  // 일정 입력 폼 상태
  const [scheduleForm, setScheduleForm] = useState({
    type: "예약", // 일반, 예약, 휴가
    title: "",
    startTime: "09:30",
    endTime: "10:30",
    memberId: selectedTeam.members[0].id,
    patientName: "",
    patientNumber: "",
    note: "",
  });

  // 수정 모드 관련 상태
  const [isEditMode, setIsEditMode] = useState(false);
  const [editScheduleId, setEditScheduleId] = useState(null);

  // 선택된 날짜에 해당하는 일정 필터링
  const filteredSchedules = schedules.filter(
    (schedule) =>
      schedule.date.getDate() === currentDate.getDate() &&
      schedule.date.getMonth() === currentDate.getMonth() &&
      schedule.date.getFullYear() === currentDate.getFullYear()
  );

  // 일정 유형별 색상
  const typeColors = {
    일반: "#16B028", // 녹색
    예약: "#002D5D", // 파란색
    휴가: "#FF762D", // 오렌지색
  };

  // 팀 변경 시 첫 번째 멤버로 자동 선택
  useEffect(() => {
    if (selectedTeam && selectedTeam.members.length > 0) {
      setScheduleForm({
        ...scheduleForm,
        memberId: selectedTeam.members[0].id,
      });
    }
  }, [selectedTeam]);

  // 실제 구현에서는 Firebase에서 일정 데이터를 가져오는 함수
  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      // 더미 데이터용 타임아웃
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error("일정을 가져오는 중 오류 발생:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [currentDate]);

  // 날짜 포맷 함수
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const dayName = dayNames[date.getDay()];

    return `${year}.${month}.${day} (${dayName})`;
  };

  // 멤버 정보 가져오기
  const getMemberById = (memberId) => {
    for (const team of teamData) {
      const member = team.members.find((m) => m.id === memberId);
      if (member) return member;
    }
    return null;
  };

  // 새 일정 추가
  const handleAddSchedule = (e) => {
    e.preventDefault();

    if (!scheduleForm.title.trim()) {
      alert("일정 제목을 입력해주세요.");
      return;
    }

    if (isEditMode) {
      // 기존 일정 수정
      const updatedSchedules = schedules.map((schedule) =>
        schedule.id === editScheduleId
          ? {
              ...schedule,
              type: scheduleForm.type,
              title: scheduleForm.title,
              startTime: scheduleForm.startTime,
              endTime: scheduleForm.endTime,
              memberId: scheduleForm.memberId,
              patientName: scheduleForm.patientName,
              patientNumber: scheduleForm.patientNumber,
              note: scheduleForm.note,
            }
          : schedule
      );

      setSchedules(updatedSchedules);
      // 수정 모드 종료
      setIsEditMode(false);
      setEditScheduleId(null);
    } else {
      // 새 일정 추가
      const newSchedule = {
        id: Date.now(),
        date: currentDate,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        type: scheduleForm.type,
        title: scheduleForm.title,
        memberId: scheduleForm.memberId,
        patientName: scheduleForm.patientName,
        patientNumber: scheduleForm.patientNumber,
        note: scheduleForm.note,
      };

      setSchedules([...schedules, newSchedule]);
    }

    // 폼 초기화
    setScheduleForm({
      ...scheduleForm,
      title: "", // 제목 초기화
      patientName: "", // 환자명 초기화
      patientNumber: "", // 환자번호 초기화
      note: "", // 비고 초기화
    });
  };

  // 일정 삭제
  const handleDeleteSchedule = (scheduleId) => {
    if (isEditMode && editScheduleId === scheduleId) {
      // 수정 중인 일정을 삭제하는 경우, 수정 모드 종료
      handleCancelEdit();
    }
    setSchedules(schedules.filter((schedule) => schedule.id !== scheduleId));
  };

  // 일정 수정
  const handleEditSchedule = (scheduleId) => {
    const scheduleToEdit = schedules.find(
      (schedule) => schedule.id === scheduleId
    );
    if (!scheduleToEdit) return;

    setIsEditMode(true);
    setEditScheduleId(scheduleId);
    setScheduleForm({
      type: scheduleToEdit.type,
      title: scheduleToEdit.title,
      startTime: scheduleToEdit.startTime,
      endTime: scheduleToEdit.endTime,
      memberId: scheduleToEdit.memberId,
      patientName: scheduleToEdit.patientName || "",
      patientNumber: scheduleToEdit.patientNumber || "",
      note: scheduleToEdit.note || "",
    });
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditScheduleId(null);
    setScheduleForm({
      type: "예약",
      title: "",
      startTime: "09:30",
      endTime: "10:30",
      memberId: selectedTeam.members[0].id,
      patientName: "",
      patientNumber: "",
      note: "",
    });
  };

  return (
    <div className="flex flex-row w-full h-screen">
      <div className="w-[310px] h-full flex flex-col">
        <SideBar />
      </div>
      <MainZone className="w-full flex flex-row justify-evenly items-center bg-onceBackground p-[20px] h-screen">
        {/* 왼쪽 영역: 캘린더 및 폼 */}
        <LeftZone className="w-[442px] mr-6 bg-white rounded-[21px] h-full overflow-y-auto px-[20px] py-[20px]">
          {/* 캘린더 */}
          <ScheduleCalendar
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            appointments={schedules}
          />
          {/* 일정 유형 선택 */}
          <div className="mb-6">
            <div className="flex mb-2">
              <button
                className={`w-[81px] h-[38px] rounded-[5px] flex items-center justify-center ${
                  scheduleForm.type === "일반"
                    ? "bg-[#002D5D] text-white"
                    : "border border-[#9D9D9C] text-[#9D9D9C]"
                }`}
                onClick={() =>
                  setScheduleForm({ ...scheduleForm, type: "일반" })
                }
              >
                일반
              </button>
              <button
                className={`w-[81px] h-[38px] rounded-[5px] flex items-center justify-center ${
                  scheduleForm.type === "예약"
                    ? "bg-[#002D5D] text-white"
                    : "border border-[#9D9D9C] text-[#9D9D9C]"
                }`}
                onClick={() =>
                  setScheduleForm({ ...scheduleForm, type: "예약" })
                }
              >
                예약
              </button>
              <button
                className={`w-[81px] h-[38px] rounded-[5px] flex items-center justify-center ${
                  scheduleForm.type === "휴가"
                    ? "bg-[#002D5D] text-white"
                    : "border border-[#9D9D9C] text-[#9D9D9C]"
                }`}
                onClick={() =>
                  setScheduleForm({ ...scheduleForm, type: "휴가" })
                }
              >
                휴가
              </button>
            </div>
          </div>

          {/* 일정 추가 폼 */}
          <FormZone id="schedule-form" className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">
              {isEditMode ? "일정 수정" : "일정 추가"}
            </h3>
            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div className="mb-4">
                <label className="block mb-1">담당자</label>
                <div className="relative">
                  <select
                    className="w-full p-2 bg-[#FCFAFA] border border-[#9D9D9C] rounded-[4px] appearance-none"
                    value={scheduleForm.memberId}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        memberId: e.target.value,
                      })
                    }
                  >
                    {selectedTeam.members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mb-4">
                <div className="w-1/2">
                  <label className="block mb-1">환자명</label>
                  <input
                    type="text"
                    className="w-full p-2 bg-[#FCFAFA] border border-[#9D9D9C] rounded-[4px]"
                    value={scheduleForm.patientName}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        patientName: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="w-1/2">
                  <label className="block mb-1">환자번호</label>
                  <input
                    type="text"
                    className="w-full p-2 bg-[#FCFAFA] border border-[#9D9D9C] rounded-[4px]"
                    value={scheduleForm.patientNumber}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        patientNumber: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex space-x-4 mb-4">
                <div className="w-1/2">
                  <label className="block mb-1">시작 시간</label>
                  <div className="relative">
                    <input
                      type="time"
                      className="w-full p-2 bg-[#FCFAFA] border border-[#9D9D9C] rounded-[4px] appearance-none"
                      value={scheduleForm.startTime}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          startTime: e.target.value,
                        })
                      }
                      min="09:00"
                      max="17:30"
                      step="300"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-[#002D5D]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="w-1/2">
                  <label className="block mb-1">종료 시간</label>
                  <div className="relative">
                    <input
                      type="time"
                      className="w-full p-2 bg-[#FCFAFA] border border-[#9D9D9C] rounded-[4px] appearance-none"
                      value={scheduleForm.endTime}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          endTime: e.target.value,
                        })
                      }
                      min="09:30"
                      max="18:00"
                      step="300"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-[#002D5D]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mb-4">
                <div className="w-1/2">
                  <label className="block mb-1">제목</label>
                  <input
                    type="text"
                    className="w-full p-2 bg-[#FCFAFA] border border-[#9D9D9C] rounded-[4px]"
                    placeholder="일정 제목"
                    value={scheduleForm.title}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        title: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block mb-1">비고</label>
                <textarea
                  className="w-full p-2 bg-[#FCFAFA] border border-[#9D9D9C] rounded-[4px] h-[100px]"
                  placeholder="추가 내용을 입력하세요"
                  value={scheduleForm.note}
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      note: e.target.value,
                    })
                  }
                ></textarea>
              </div>

              <div className="flex space-x-4">
                {isEditMode ? (
                  <>
                    <button
                      type="button"
                      className="w-[162px] h-[40px] border-2 border-[#002D5D] text-[#002D5D] rounded-[5px] font-normal"
                      onClick={handleCancelEdit}
                    >
                      취소하기
                    </button>
                    <button
                      type="submit"
                      className="w-[162px] h-[40px] bg-[#002D5D] text-white rounded-[5px] font-normal"
                    >
                      수정하기
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    className="w-[162px] h-[40px] bg-[#002D5D] text-white rounded-[5px] font-normal"
                  >
                    등록하기
                  </button>
                )}
              </div>
            </form>
          </FormZone>
        </LeftZone>

        {/* 오른쪽 영역: 팀 멤버별 일정 */}
        <RightZone className="flex-1 bg-white rounded-[21px] h-full p-5">
          {/* <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{selectedTeam.name}</h2>
            <div>
              <span className="text-lg">{formatDate(currentDate)}</span>
            </div>
          </div> */}

          {/* 팀 선택 탭 */}
          <div className="flex border-b mb-6 pb-2">
            {teamData.map((team) => (
              <button
                key={team.id}
                className={`px-4 py-2 ${
                  selectedTeam.id === team.id
                    ? "border-b-2 border-[#002D5D] text-[#002D5D] font-semibold"
                    : "text-[#9D9D9C]"
                }`}
                onClick={() => setSelectedTeam(team)}
              >
                {team.name}
              </button>
            ))}
          </div>

          {/* 팀원별 일정 - ScheduleList 컴포넌트 사용 */}
          <ScheduleList
            currentDate={currentDate}
            selectedTeam={selectedTeam}
            schedules={schedules}
            onAddSchedule={(memberId) => {
              // 해당 멤버로 폼 초기화
              setScheduleForm({
                ...scheduleForm,
                memberId: memberId,
              });
              // 스크롤을 폼으로 이동
              const formElement = document.getElementById("schedule-form");
              if (formElement) {
                formElement.scrollIntoView({ behavior: "smooth" });
              }
            }}
            onEditSchedule={handleEditSchedule}
            onDeleteSchedule={handleDeleteSchedule}
          />
        </RightZone>
      </MainZone>
    </div>
  );
};

export default Schedule;
