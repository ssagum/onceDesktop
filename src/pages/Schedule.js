import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import SideBar from "../components/SideBar";
import ScheduleCalendar from "../components/Schedule/ScheduleCalendar";
import ScheduleList from "../components/Schedule/ScheduleList";
import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import WhoSelector from "../components/common/WhoSelector";
import { useToast } from "../contexts/ToastContext";

const MainZone = styled.div``;
const LeftZone = styled.div``;
const RightZone = styled.div``;
const FormZone = styled.div``;

// 더미 데이터 - 나중에 파이어베이스로 대체 가능
const teamData = [
  {
    id: "doctor",
    name: "진료",
    members: [{ id: "member10", name: "박상현", color: "#D946EF" }],
  },
  {
    id: "physicalTherapy",
    name: "물리치료",
    members: [
      { id: "member1", name: "이기현", color: "#F59E0B" },
      { id: "member2", name: "이진용", color: "#4F46E5" },
      { id: "member3", name: "정현", color: "#10B981" },
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
    vacationType: "휴가", // 휴가, 반차, 경조사
    startDate: new Date(),
    endDate: new Date(),
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

  // useToast 훅 사용
  const { showToast } = useToast();

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
      showToast("일정 제목을 입력해주세요.", "error");
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
              patientName:
                scheduleForm.type === "예약" ? scheduleForm.patientName : "",
              patientNumber:
                scheduleForm.type === "예약" ? scheduleForm.patientNumber : "",
              note: scheduleForm.note,
              vacationType:
                scheduleForm.type === "휴가" ? scheduleForm.vacationType : "",
              startDate:
                scheduleForm.type === "휴가"
                  ? scheduleForm.startDate
                  : currentDate,
              endDate:
                scheduleForm.type === "휴가"
                  ? scheduleForm.endDate
                  : currentDate,
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
        patientName:
          scheduleForm.type === "예약" ? scheduleForm.patientName : "",
        patientNumber:
          scheduleForm.type === "예약" ? scheduleForm.patientNumber : "",
        note: scheduleForm.note,
        vacationType:
          scheduleForm.type === "휴가" ? scheduleForm.vacationType : "",
        startDate:
          scheduleForm.type === "휴가" ? scheduleForm.startDate : currentDate,
        endDate:
          scheduleForm.type === "휴가" ? scheduleForm.endDate : currentDate,
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
      vacationType: scheduleToEdit.vacationType || "휴가",
      startDate: scheduleToEdit.startDate || currentDate,
      endDate: scheduleToEdit.endDate || currentDate,
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
      vacationType: "휴가",
      startDate: new Date(),
      endDate: new Date(),
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
          <div className="flex flex-row w-full gap-x-2 px-2 mt-2">
            <button
              className={`w-full h-[38px] rounded-[5px] flex items-center justify-center ${
                scheduleForm.type === "예약"
                  ? "bg-[#002D5D] text-white"
                  : "border border-[#9D9D9C] text-[#9D9D9C]"
              }`}
              onClick={() => setScheduleForm({ ...scheduleForm, type: "예약" })}
            >
              예약
            </button>
            <button
              className={`w-full h-[38px] rounded-[5px] flex items-center justify-center ${
                scheduleForm.type === "휴가"
                  ? "bg-onceOrange text-white"
                  : "border border-[#9D9D9C] text-[#9D9D9C]"
              }`}
              onClick={() => setScheduleForm({ ...scheduleForm, type: "휴가" })}
            >
              휴가
            </button>
          </div>

          {/* 일정 추가 폼 */}
          <FormZone
            id="schedule-form"
            className="bg-white rounded-lg mt-4 px-1"
          >
            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div className="mb-4 flex flex-row items-center">
                <label className="mr-2">
                  {scheduleForm.type === "휴가" ? "휴가자" : "담당자"}
                </label>
                <WhoSelector
                  who={"담당자"}
                  disabled={scheduleForm.type === "휴가"}
                />
              </div>

              {/* 휴가 모드일 때만 휴가 유형 선택 표시 */}
              {scheduleForm.type === "휴가" && (
                <div className="mb-4">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className={`flex-1 p-2 rounded-[4px] ${
                        scheduleForm.vacationType === "휴가"
                          ? "bg-onceOrange text-white"
                          : "border border-[#9D9D9C] text-[#9D9D9C]"
                      }`}
                      onClick={() =>
                        setScheduleForm({
                          ...scheduleForm,
                          vacationType: "휴가",
                          title: "휴가",
                        })
                      }
                    >
                      휴가
                    </button>
                    <button
                      type="button"
                      className={`flex-1 p-2 rounded-[4px] ${
                        scheduleForm.vacationType === "반차"
                          ? "bg-onceOrange text-white"
                          : "border border-[#9D9D9C] text-[#9D9D9C]"
                      }`}
                      onClick={() =>
                        setScheduleForm({
                          ...scheduleForm,
                          vacationType: "반차",
                          title: "반차",
                        })
                      }
                    >
                      반차
                    </button>
                    <button
                      type="button"
                      className={`flex-1 p-2 rounded-[4px] ${
                        scheduleForm.vacationType === "경조사"
                          ? "bg-onceOrange text-white"
                          : "border border-[#9D9D9C] text-[#9D9D9C]"
                      }`}
                      onClick={() =>
                        setScheduleForm({
                          ...scheduleForm,
                          vacationType: "경조사",
                          title: "경조사",
                        })
                      }
                    >
                      경조사
                    </button>
                  </div>
                </div>
              )}

              {/* 휴가 모드일 때는 환자 정보 필드 숨김 */}
              {scheduleForm.type !== "휴가" && (
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
              )}

              {/* 휴가 모드일 때 시작/종료 날짜 선택 */}
              {scheduleForm.type === "휴가" ? (
                <>
                  <div className="flex space-x-4 mb-4">
                    <div className="w-1/2">
                      <label className="block mb-1">시작 날짜</label>
                      <input
                        type="date"
                        className="w-full p-2 bg-[#FCFAFA] border border-[#9D9D9C] rounded-[4px] cursor-not-allowed opacity-70"
                        value={
                          scheduleForm.startDate instanceof Date
                            ? scheduleForm.startDate.toISOString().split("T")[0]
                            : new Date().toISOString().split("T")[0]
                        }
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            startDate: new Date(e.target.value),
                          })
                        }
                        readOnly
                      />
                    </div>

                    <div className="w-1/2">
                      <label className="block mb-1">시작 시간</label>
                      <div className="relative">
                        <input
                          type="time"
                          className="w-full p-2 bg-[#FCFAFA] border border-[#9D9D9C] rounded-[4px] appearance-none cursor-not-allowed opacity-70"
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
                          readOnly
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg
                            className="w-5 h-5 text-[#002D5D] opacity-70"
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
                      <label className="block mb-1">종료 날짜</label>
                      <input
                        type="date"
                        className="w-full p-2 bg-[#FCFAFA] border border-[#9D9D9C] rounded-[4px] cursor-not-allowed opacity-70"
                        value={
                          scheduleForm.endDate instanceof Date
                            ? scheduleForm.endDate.toISOString().split("T")[0]
                            : new Date().toISOString().split("T")[0]
                        }
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            endDate: new Date(e.target.value),
                          })
                        }
                        readOnly
                      />
                    </div>

                    <div className="w-1/2">
                      <label className="block mb-1">종료 시간</label>
                      <div className="relative">
                        <input
                          type="time"
                          className="w-full p-2 bg-[#FCFAFA] border border-[#9D9D9C] rounded-[4px] appearance-none cursor-not-allowed opacity-70"
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
                          readOnly
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg
                            className="w-5 h-5 text-[#002D5D] opacity-70"
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
                </>
              ) : (
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
              )}

              {/* 비고 필드 - 휴가 모드가 아닐 때만 표시 */}
              {scheduleForm.type !== "휴가" && (
                <div className="mb-4">
                  <label className="block mb-1">비고</label>
                  <textarea
                    className="w-full p-2 bg-[#FCFAFA] border border-[#9D9D9C] rounded-[4px] h-[90px]"
                    placeholder="연락처나 특이사항이 있으면 입력해주세요"
                    value={scheduleForm.note}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        note: e.target.value,
                      })
                    }
                  ></textarea>
                </div>
              )}

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
                      className={`w-[162px] h-[40px] ${
                        scheduleForm.type === "휴가"
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-[#002D5D]"
                      } text-white rounded-[5px] font-normal`}
                      disabled={scheduleForm.type === "휴가"}
                    >
                      {scheduleForm.type === "휴가" ? "수정 불가" : "수정하기"}
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    className={`w-full h-[40px] ${
                      scheduleForm.type === "휴가"
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-[#002D5D]"
                    } text-white rounded-[5px] font-normal`}
                    disabled={scheduleForm.type === "휴가"}
                  >
                    {scheduleForm.type === "휴가" ? "읽기 전용" : "등록하기"}
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
