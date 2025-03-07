import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import ModalTemplate from "../common/ModalTemplate";
import { cancel } from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import { JcyCalendar } from "../common/JcyCalendar";
import TaskRecordModal from "./TaskRecordModal";
import { format } from "date-fns";
import DayToggle from "../common/DayToggle";
import PriorityToggle from "../common/PriorityToggle";
import DepartmentRoleSelector from "../common/DepartmentRoleSelector";
import { useToast } from "../../contexts/ToastContext";

const ModalHeaderZone = styled.div``;
const ModalContentZone = styled.div``;
const InforationZone = styled.div``;
const InfoRow = styled.div``;
const ThreeButton = styled.div``;

// 날짜가 유효한지 확인하는 헬퍼 함수
const isValidDate = (dateString) => {
  if (!dateString) return false;

  console.log("isValidDate 검사 중: ", dateString, typeof dateString);

  try {
    // 한글 날짜 형식 처리 (예: "2099년 12월 31일 오전 12시 0분 0초 UTC+9")
    if (
      typeof dateString === "string" &&
      dateString.includes("년") &&
      dateString.includes("월")
    ) {
      return true; // 한글 날짜 형식은 유효하다고 간주
    }

    // 일반적인 날짜 형식 처리
    const date = new Date(dateString);
    const isValid = date instanceof Date && !isNaN(date.getTime());
    console.log(`${dateString} 유효성 결과: ${isValid}`);
    return isValid;
  } catch (error) {
    console.error("날짜 유효성 검사 중 오류:", error);
    return false;
  }
};

// 한글 날짜 문자열을 Date 객체로 변환하는 함수
const parseKoreanDate = (koreanDateString) => {
  try {
    // "2099년 12월 31일 오전 12시 0분 0초 UTC+9" 형식 파싱
    if (typeof koreanDateString !== "string") return null;

    // 연, 월, 일 추출
    const yearMatch = koreanDateString.match(/(\d+)년/);
    const monthMatch = koreanDateString.match(/(\d+)월/);
    const dayMatch = koreanDateString.match(/(\d+)일/);

    if (!yearMatch || !monthMatch || !dayMatch) return null;

    const year = parseInt(yearMatch[1]);
    const month = parseInt(monthMatch[1]) - 1; // 월은 0부터 시작
    const day = parseInt(dayMatch[1]);

    // 시간 정보도 있으면 추출
    let hours = 0,
      minutes = 0,
      seconds = 0;
    const hoursMatch = koreanDateString.match(/(\d+)시/);
    const minutesMatch = koreanDateString.match(/(\d+)분/);
    const secondsMatch = koreanDateString.match(/(\d+)초/);

    if (hoursMatch) hours = parseInt(hoursMatch[1]);
    if (minutesMatch) minutes = parseInt(minutesMatch[1]);
    if (secondsMatch) seconds = parseInt(secondsMatch[1]);

    // 오전/오후 처리
    if (koreanDateString.includes("오후") && hours < 12) {
      hours += 12;
    }

    console.log(
      `한글 날짜 파싱: ${year}년 ${
        month + 1
      }월 ${day}일 ${hours}시 ${minutes}분 ${seconds}초`
    );
    return new Date(year, month, day, hours, minutes, seconds);
  } catch (error) {
    console.error("한글 날짜 파싱 오류:", error);
    return null;
  }
};

// 안전하게 날짜 포맷팅하는 함수
const formatSafeDate = (dateValue) => {
  console.log("formatSafeDate 호출됨: ", dateValue, typeof dateValue);

  try {
    // null, undefined 체크
    if (!dateValue) {
      console.log("날짜가 null 또는 undefined임");
      return format(new Date(), "yyyy/MM/dd");
    }

    // 한글 날짜 형식 처리
    if (
      typeof dateValue === "string" &&
      dateValue.includes("년") &&
      dateValue.includes("월")
    ) {
      const parsedDate = parseKoreanDate(dateValue);
      if (parsedDate) {
        const formattedDate = format(parsedDate, "yyyy/MM/dd");
        console.log(`한글 날짜 변환: ${dateValue} -> ${formattedDate}`);
        return formattedDate;
      }
    }

    // 다양한 날짜 형식 처리
    let dateObj;

    if (dateValue instanceof Date) {
      // 이미 Date 객체인 경우
      dateObj = dateValue;
    } else if (typeof dateValue === "object" && dateValue.seconds) {
      // Firestore 타임스탬프 처리
      dateObj = new Date(dateValue.seconds * 1000);
    } else if (typeof dateValue === "number") {
      // 타임스탬프(밀리초) 처리
      dateObj = new Date(dateValue);
    } else if (typeof dateValue === "string") {
      // 문자열 날짜 처리
      dateObj = new Date(dateValue);
    } else {
      // 기타 케이스
      console.log("알 수 없는 날짜 형식:", dateValue);
      return format(new Date(), "yyyy/MM/dd");
    }

    // 생성된 Date 객체 유효성 검사
    if (isNaN(dateObj.getTime())) {
      console.log("유효하지 않은 Date 객체 생성됨:", dateValue);
      return format(new Date(), "yyyy/MM/dd");
    }

    // 유효한 날짜를 원하는 형식으로 포맷팅
    const formattedDate = format(dateObj, "yyyy/MM/dd");
    console.log(`날짜 변환 성공: ${dateValue} -> ${formattedDate}`);
    return formattedDate;
  } catch (error) {
    console.error("날짜 포맷팅 중 오류:", error, "원본 값:", dateValue);
    return format(new Date(), "yyyy/MM/dd");
  }
};

// 초기 날짜 값 설정 함수 - 컴포넌트 외부로 이동
const getInitialDate = (dateValue) => {
  console.log("getInitialDate 호출됨:", dateValue, typeof dateValue);

  // 간단히 formatSafeDate 함수를 재사용
  return formatSafeDate(dateValue);
};

function TaskAddModal({
  isVisible,
  setIsVisible,
  task,
  isEdit = false,
  onTaskAdd,
  onTaskEdit,
  onTaskDelete,
}) {
  console.log("TaskAddModal 렌더링: ", task);
  if (task) {
    console.log("task 객체 정보: ", {
      id: task.id,
      startDate: task.startDate,
      type: typeof task.startDate,
      isValidDate: isValidDate(task.startDate),
    });
  }

  // 모달 모드 관리 상태 추가
  // 'create': 새 Task 생성 모드
  // 'view': 기존 Task 상세 보기 모드
  // 'edit': 기존 Task 수정 모드
  const [mode, setMode] = useState("create");

  const [recordModalOn, setRecordModalOn] = useState(false);
  const [selectedDays, setSelectedDays] = useState(task?.days || []);
  const [selectedCycle, setSelectedCycle] = useState(task?.cycle || "매일");
  const [title, setTitle] = useState(task?.title || "");
  const [writer, setWriter] = useState(task?.writer || "");
  const [assignee, setAssignee] = useState(task?.assignee || "");
  const [category, setCategory] = useState(task?.category || "1회성");
  const [priority, setPriority] = useState(task?.priority || "중");
  const [startDate, setStartDate] = useState(getInitialDate(task?.startDate));
  const [endDate, setEndDate] = useState(getInitialDate(task?.endDate));
  // 무한 종료일 (반복성 업무용)
  const INFINITE_END_DATE = "2099/12/31";
  // 업무 내용 상태 추가
  const [content, setContent] = useState(task?.content || "");
  const { showToast } = useToast();

  // 이전 날짜 값 비교를 위한 ref 추가
  const prevStartDateRef = useRef(startDate);
  const prevEndDateRef = useRef(endDate);

  // 모달이 열릴 때 모드 설정
  useEffect(() => {
    if (isVisible) {
      if (!task) {
        // task가 없으면 생성 모드
        setMode("create");
        resetFields(); // 필드 초기화
      } else if (isEdit) {
        // task가 있고 isEdit이 true면 수정 모드
        setMode("edit");
        resetFields(); // 필드 초기화
      } else {
        // task가 있고 isEdit이 false면 보기 모드
        setMode("view");
        resetFields(); // 필드 초기화
      }
    }
  }, [isVisible, task, isEdit]);

  // 필드 수정 가능 여부 계산
  const isFieldEditable = mode === "create" || mode === "edit";

  // 입력 필드 초기화 함수
  const resetFields = () => {
    console.log("resetFields 호출됨: ", task);
    if (task) {
      try {
        // task가 있으면 task 데이터로 초기화
        setSelectedDays(task.days || []);
        setSelectedCycle(task.cycle || "매일");
        setTitle(task.title || "");
        setWriter(task.writer || "");
        setAssignee(task.assignee || "");
        setCategory(task.category || "1회성");
        setPriority(task.priority || "중");

        // 안전하게 날짜 초기화
        console.log("날짜 초기화 전: ", {
          startDate: task.startDate,
          startDateType: typeof task.startDate,
          endDate: task.endDate,
          endDateType: typeof task.endDate,
        });

        // 날짜 처리 (다양한 형식 지원)
        let formattedStartDate = format(new Date(), "yyyy/MM/dd"); // 기본값
        let formattedEndDate = format(new Date(), "yyyy/MM/dd"); // 기본값

        // 한글 날짜 형식 처리
        if (
          typeof task.startDate === "string" &&
          task.startDate.includes("년") &&
          task.startDate.includes("월")
        ) {
          const parsedDate = parseKoreanDate(task.startDate);
          if (parsedDate) {
            formattedStartDate = format(parsedDate, "yyyy/MM/dd");
            console.log(
              `한글 시작일 변환 성공: ${task.startDate} -> ${formattedStartDate}`
            );
          }
        } else if (task.startDate) {
          try {
            // Date 객체 생성 시도
            let startDateObj;
            if (task.startDate instanceof Date) {
              startDateObj = task.startDate;
            } else if (
              typeof task.startDate === "object" &&
              task.startDate.seconds
            ) {
              // Firestore 타임스탬프 처리
              startDateObj = new Date(task.startDate.seconds * 1000);
            } else {
              startDateObj = new Date(task.startDate);
            }

            if (!isNaN(startDateObj.getTime())) {
              formattedStartDate = format(startDateObj, "yyyy/MM/dd");
              console.log(
                `시작일 변환 성공: ${task.startDate} -> ${formattedStartDate}`
              );
            } else {
              console.log(
                "유효하지 않은 시작일을 발견했습니다",
                task.startDate
              );
            }
          } catch (error) {
            console.error("시작일 처리 중 오류:", error, task.startDate);
          }
        }

        // 한글 날짜 형식 처리 (종료일)
        if (
          typeof task.endDate === "string" &&
          task.endDate.includes("년") &&
          task.endDate.includes("월")
        ) {
          const parsedDate = parseKoreanDate(task.endDate);
          if (parsedDate) {
            formattedEndDate = format(parsedDate, "yyyy/MM/dd");
            console.log(
              `한글 종료일 변환 성공: ${task.endDate} -> ${formattedEndDate}`
            );
          }
        } else if (task.endDate) {
          try {
            // Date 객체 생성 시도
            let endDateObj;
            if (task.endDate instanceof Date) {
              endDateObj = task.endDate;
            } else if (
              typeof task.endDate === "object" &&
              task.endDate.seconds
            ) {
              // Firestore 타임스탬프 처리
              endDateObj = new Date(task.endDate.seconds * 1000);
            } else {
              endDateObj = new Date(task.endDate);
            }

            if (!isNaN(endDateObj.getTime())) {
              formattedEndDate = format(endDateObj, "yyyy/MM/dd");
              console.log(
                `종료일 변환 성공: ${task.endDate} -> ${formattedEndDate}`
              );
            } else {
              console.log("유효하지 않은 종료일을 발견했습니다", task.endDate);
            }
          } catch (error) {
            console.error("종료일 처리 중 오류:", error, task.endDate);
          }
        }

        setStartDate(formattedStartDate);
        setEndDate(formattedEndDate);

        // refs 업데이트 (있을 경우)
        if (typeof prevStartDateRef !== "undefined") {
          prevStartDateRef.current = formattedStartDate;
        }
        if (typeof prevEndDateRef !== "undefined") {
          prevEndDateRef.current = formattedEndDate;
        }

        setContent(task.content || "");
      } catch (error) {
        console.error("resetFields 중 오류 발생:", error);
        // 오류 발생 시 기본값으로 초기화
        setStartDate(format(new Date(), "yyyy/MM/dd"));
        setEndDate(format(new Date(), "yyyy/MM/dd"));
      }
    } else {
      // 새 업무 추가 모드일 경우 빈 값으로 초기화
      setSelectedDays([]);
      setSelectedCycle("매일");
      setTitle("");
      setWriter("");
      setAssignee("");
      setCategory("1회성");
      setPriority("중");
      setStartDate(format(new Date(), "yyyy/MM/dd"));
      setEndDate(format(new Date(), "yyyy/MM/dd"));
      setContent("");
    }
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setIsVisible(false);
  };

  // 업무 분류 변경 시 날짜 설정 로직
  useEffect(() => {
    if (!isVisible) return; // 모달이 표시되지 않을 때는 실행하지 않음

    try {
      const currentStartDate = startDate;

      if (category === "1회성") {
        // 1회성 업무는 시작일과 종료일이 같아야 함
        setEndDate(currentStartDate);
      } else if (category === "반복성") {
        // 반복성 업무는 종료일을 2099년 12월 31일로 설정
        setEndDate(INFINITE_END_DATE);
      } else if (category === "이벤트성") {
        // 이벤트성 업무에서 다른 업무로 변경했다가 다시 이벤트성으로 돌아왔을 때
        // 시작일이 종료일보다 이후라면 종료일을 시작일로 설정
        if (!isValidDate(currentStartDate) || !isValidDate(endDate)) {
          // 유효하지 않은 날짜가 있으면 현재 날짜로 설정
          const today = format(new Date(), "yyyy/MM/dd");
          setStartDate(today);
          setEndDate(today);
          return;
        }

        const startDateObj = new Date(currentStartDate);
        const endDateObj = new Date(endDate);

        if (endDate === INFINITE_END_DATE || startDateObj > endDateObj) {
          setEndDate(currentStartDate);
        }
      }
    } catch (error) {
      console.error("날짜 처리 중 오류 발생:", error);
      // 오류 발생 시 현재 날짜로 초기화
      const today = format(new Date(), "yyyy/MM/dd");
      setStartDate(today);
      setEndDate(today);
    }
  }, [category, startDate, endDate, INFINITE_END_DATE, isVisible]);

  // 시작 날짜 변경 시, 업무 유형에 따라 종료 날짜도 함께 변경
  const handleStartDateChange = useCallback(
    (date) => {
      if (!isFieldEditable) return;

      console.log("handleStartDateChange called with date:", date);

      try {
        // formatSafeDate 함수를 사용하여 일관된 날짜 처리
        const formattedDate = formatSafeDate(date);

        // 현재 값과 같으면 불필요한 상태 업데이트를 피함
        if (
          formattedDate === startDate ||
          formattedDate === prevStartDateRef.current
        ) {
          console.log("같은 시작 날짜로 변경 요청: 무시");
          return;
        }

        // 이전 날짜 값 업데이트
        prevStartDateRef.current = formattedDate;

        setStartDate(formattedDate);

        // 1회성 업무는 시작일 = 종료일
        if (category === "1회성") {
          setEndDate(formattedDate);
          prevEndDateRef.current = formattedDate;
        }

        // 반복성 업무는 종료일을 무기한으로 유지
        if (category === "반복성") {
          setEndDate(INFINITE_END_DATE);
          prevEndDateRef.current = INFINITE_END_DATE;
        }

        // 이벤트성 업무일 때 시작일이 종료일보다 이후라면 종료일도 시작일로 설정
        if (category === "이벤트성") {
          try {
            const startDateObj = new Date(formattedDate.split("/").join("-"));
            const endDateObj = new Date(endDate.split("/").join("-"));

            if (startDateObj > endDateObj) {
              setEndDate(formattedDate);
              prevEndDateRef.current = formattedDate;
            }
          } catch (error) {
            console.error("날짜 비교 중 오류:", error);
          }
        }
      } catch (error) {
        console.error("시작일 변경 중 오류 발생:", error);
        // 오류 발생 시 현재 날짜로 초기화
        const today = format(new Date(), "yyyy/MM/dd");
        setStartDate(today);
        prevStartDateRef.current = today;

        if (category === "1회성") {
          setEndDate(today);
          prevEndDateRef.current = today;
        }
      }
    },
    [isFieldEditable, category, INFINITE_END_DATE, startDate, endDate]
  );

  // 종료 날짜 변경 핸들러
  const handleEndDateChange = useCallback(
    (date) => {
      if (!isFieldEditable) return;

      console.log("handleEndDateChange called with date:", date);

      try {
        // 1회성 또는 반복성 업무는 종료일 변경 불가
        if (category === "1회성" || category === "반복성") {
          return;
        }

        // formatSafeDate 함수를 사용하여 일관된 날짜 처리
        const formattedDate = formatSafeDate(date);

        // 현재 값과 같으면 불필요한 상태 업데이트를 피함
        if (
          formattedDate === endDate ||
          formattedDate === prevEndDateRef.current
        ) {
          console.log("같은 종료 날짜로 변경 요청: 무시");
          return;
        }

        // 이전 날짜 값 업데이트
        prevEndDateRef.current = formattedDate;

        // 이벤트성 업무일 때 종료일이 시작일보다 이전이면 시작일도 종료일로 설정
        try {
          const startDateObj = new Date(startDate.split("/").join("-"));
          const endDateObj = new Date(formattedDate.split("/").join("-"));

          if (endDateObj < startDateObj) {
            setStartDate(formattedDate);
            prevStartDateRef.current = formattedDate;
          }
        } catch (error) {
          console.error("날짜 비교 중 오류:", error);
        }

        setEndDate(formattedDate);
      } catch (error) {
        console.error("종료일 변경 중 오류 발생:", error);
        // 오류 발생 시 현재 날짜로 초기화
        const today = format(new Date(), "yyyy/MM/dd");
        setEndDate(today);
        prevEndDateRef.current = today;
      }
    },
    [isFieldEditable, category, startDate, endDate]
  );

  // 주기 변경 시 요일 자동 선택
  const handleCycleChange = (cycle) => {
    if (!isFieldEditable) return;

    setSelectedCycle(cycle);
    if (cycle === "매일") {
      setSelectedDays(["월", "화", "수", "목", "금", "토", "일"]);
    } else {
      setSelectedDays([]);
    }
  };

  // 요일 토글
  const toggleDay = (day) => {
    if (!isFieldEditable) return;
    if (selectedCycle === "매일") return; // 매일인 경우 요일 선택 불가

    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // 수정 모드로 전환
  const handleSwitchToEditMode = () => {
    setMode("edit");
  };

  // 업무 삭제 핸들러
  const handleTaskDelete = () => {
    if (task && onTaskDelete) {
      onTaskDelete(task.id);
      handleCloseModal();
    }
  };

  // 업무 저장 핸들러
  const handleSaveTask = () => {
    // 기본 유효성 검증
    if (!title) {
      showToast("업무 제목을 입력해주세요.", "warning");
      return;
    }

    // assignee가 문자열이거나 배열일 수 있으므로 유연하게 검증
    const hasAssignee =
      assignee &&
      (typeof assignee === "string"
        ? assignee.trim().length > 0
        : assignee.length > 0);

    if (!hasAssignee) {
      showToast("담당자를 선택해주세요.", "warning");
      return;
    }

    // 새 업무 객체 생성
    const newTask = {
      id: mode === "edit" && task ? task.id : Date.now().toString(), // 편집 시 기존 ID 유지, 새 업무는 새 ID 생성
      title,
      writer: writer || "", // 빈 문자열로 기본값 설정
      assignee,
      category,
      priority,
      startDate,
      endDate: category === "반복성" ? INFINITE_END_DATE : endDate,
      cycle: selectedCycle,
      days: selectedDays,
      content,
      createdAt:
        mode === "edit" && task ? task.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 모드에 따라 적절한 핸들러 호출
    if (mode === "create" && onTaskAdd) {
      onTaskAdd(newTask);
    } else if (mode === "edit" && onTaskEdit) {
      onTaskEdit(newTask);
    }

    // 모달 닫기
    handleCloseModal();
  };

  return (
    <>
      <ModalTemplate
        isVisible={isVisible}
        setIsVisible={handleCloseModal}
        showCancel={false}
      >
        <div className="flex flex-col items-center w-onceBigModal h-onceBigModalH bg-white px-[40px] py-[30px]">
          <ModalHeaderZone className="flex flex-row w-full bg-white justify-between h-[50px] items-center">
            <span className="text-[34px] font-bold">
              {mode === "create"
                ? "업무 추가"
                : mode === "view"
                ? "업무 상세"
                : "업무 수정"}
            </span>
            <img
              onClick={handleCloseModal}
              className="w-[30px]"
              src={cancel}
              alt="닫기"
              style={{ cursor: "pointer" }}
            />
          </ModalHeaderZone>
          <ModalContentZone className="flex flex-col h-full py-[20px] w-full">
            <div className="flex-[5] flex flex-row w-full items-center justify-center h-full">
              <div className="flex flex-col items-center">
                <JcyCalendar
                  preStartDay={startDate}
                  preEndDay={endDate}
                  setTargetStartDay={handleStartDateChange}
                  setTargetEndDay={handleEndDateChange}
                  lockDates={!isFieldEditable}
                  singleDateMode={category === "1회성"}
                  startDayOnlyMode={category === "반복성"}
                  isEdit={isFieldEditable}
                />
              </div>
              <InforationZone className="w-full flex flex-col px-[20px]">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => isFieldEditable && setTitle(e.target.value)}
                  placeholder="업무 제목을 입력하세요"
                  className={`w-[630px] border border-gray-400 rounded-md h-[40px] px-4 ${
                    isFieldEditable ? "bg-textBackground" : "bg-gray-100"
                  } mb-[20px]`}
                  disabled={!isFieldEditable}
                />
                <InfoRow className="grid grid-cols-2 gap-4 mb-[10px]">
                  <div className="flex flex-row">
                    <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                      작성자:
                    </label>
                    <DepartmentRoleSelector
                      value={writer}
                      onChange={(val) => isFieldEditable && setWriter(val)}
                      label="작성자 선택"
                      onlyLeaders={true}
                      disabled={!isFieldEditable}
                    />
                  </div>
                  <div className="flex flex-row">
                    <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                      담당자:
                    </label>
                    <DepartmentRoleSelector
                      value={assignee}
                      onChange={(val) => isFieldEditable && setAssignee(val)}
                      label="담당 선택"
                      disabled={!isFieldEditable}
                    />
                  </div>
                </InfoRow>
                <InfoRow className="flex flex-row mb-[10px]">
                  <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                    분류:
                  </label>
                  <div className="flex flex-row gap-x-[10px] w-full">
                    <OnceOnOffButton
                      className="h-[40px] w-full rounded-md"
                      text={"1회성 업무"}
                      on={category === "1회성"}
                      onClick={() => isFieldEditable && setCategory("1회성")}
                      disabled={!isFieldEditable}
                    />
                    <OnceOnOffButton
                      className="h-[40px] w-full rounded-md"
                      text={"반복성 업무"}
                      on={category === "반복성"}
                      onClick={() => isFieldEditable && setCategory("반복성")}
                      disabled={!isFieldEditable}
                    />
                    <OnceOnOffButton
                      className="h-[40px] w-full rounded-md"
                      text={"이벤트성 업무"}
                      on={category === "이벤트성"}
                      onClick={() => isFieldEditable && setCategory("이벤트성")}
                      disabled={!isFieldEditable}
                    />
                  </div>
                </InfoRow>
                <InfoRow className="flex flex-row mb-[10px]">
                  <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                    중요도:
                  </label>
                  <div className="flex flex-row gap-x-[10px]">
                    {["상", "중", "하"].map((level) => (
                      <PriorityToggle
                        key={level}
                        text={level}
                        isOn={priority === level}
                        onClick={() => isFieldEditable && setPriority(level)}
                        disabled={!isFieldEditable}
                      />
                    ))}
                  </div>
                </InfoRow>
                <InfoRow className="flex flex-row mb-[10px]">
                  <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                    날짜:
                  </label>
                  <div className="flex flex-col w-full">
                    <div className="flex flex-row items-center gap-x-[10px]">
                      <input
                        type="text"
                        value={startDate}
                        readOnly
                        placeholder="시작일 (YYYY/MM/DD)"
                        className={`w-[200px] border border-gray-400 rounded-md h-[40px] px-4 ${
                          isFieldEditable ? "bg-textBackground" : "bg-gray-100"
                        }`}
                      />
                      <span className="w-[60px]">부터</span>
                      <input
                        type="text"
                        value={category === "반복성" ? "계속 반복" : endDate}
                        readOnly
                        placeholder="종료일 (YYYY/MM/DD)"
                        className={`w-[200px] border border-gray-400 rounded-md h-[40px] px-4 ${
                          category === "반복성" || !isFieldEditable
                            ? "bg-gray-200 text-gray-500"
                            : "bg-textBackground"
                        }`}
                      />
                    </div>
                  </div>
                </InfoRow>
                {category === "반복성" && (
                  <InfoRow className="flex flex-row mb-[10px]">
                    <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                      주기:
                    </label>
                    <div className="flex flex-row gap-x-[10px] w-full">
                      <OnceOnOffButton
                        className="h-[40px] w-full rounded-md"
                        text={"매일"}
                        on={selectedCycle === "매일"}
                        onClick={() =>
                          isFieldEditable && handleCycleChange("매일")
                        }
                        disabled={!isFieldEditable}
                      />
                      <OnceOnOffButton
                        className="h-[40px] w-full rounded-md"
                        text={"매주"}
                        on={selectedCycle === "매주"}
                        onClick={() =>
                          isFieldEditable && handleCycleChange("매주")
                        }
                        disabled={!isFieldEditable}
                      />
                      <OnceOnOffButton
                        className="h-[40px] w-full rounded-md"
                        text={"격주"}
                        on={selectedCycle === "격주"}
                        onClick={() =>
                          isFieldEditable && handleCycleChange("격주")
                        }
                        disabled={!isFieldEditable}
                      />
                      <OnceOnOffButton
                        className="h-[40px] w-full rounded-md"
                        text={"매월"}
                        on={selectedCycle === "매월"}
                        onClick={() =>
                          isFieldEditable && handleCycleChange("매월")
                        }
                        disabled={!isFieldEditable}
                      />
                    </div>
                  </InfoRow>
                )}
                {category === "1회성" && (
                  <InfoRow className="flex flex-row mb-[10px]">
                    <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                      주기:
                    </label>
                    <div className="flex items-center text-gray-500 italic">
                      1회성 업무는 주기 설정이 필요하지 않습니다
                    </div>
                  </InfoRow>
                )}
                {category === "이벤트성" && (
                  <InfoRow className="flex flex-row mb-[10px]">
                    <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                      주기:
                    </label>
                    <div className="flex flex-row gap-x-[10px] w-full">
                      <OnceOnOffButton
                        className="h-[40px] w-full rounded-md"
                        text={"매일"}
                        on={selectedCycle === "매일"}
                        onClick={() =>
                          isFieldEditable && handleCycleChange("매일")
                        }
                        disabled={!isFieldEditable}
                      />
                      <OnceOnOffButton
                        className="h-[40px] w-full rounded-md"
                        text={"매주"}
                        on={selectedCycle === "매주"}
                        onClick={() =>
                          isFieldEditable && handleCycleChange("매주")
                        }
                        disabled={!isFieldEditable}
                      />
                      <OnceOnOffButton
                        className="h-[40px] w-full rounded-md"
                        text={"격주"}
                        on={selectedCycle === "격주"}
                        onClick={() =>
                          isFieldEditable && handleCycleChange("격주")
                        }
                        disabled={!isFieldEditable}
                      />
                      <OnceOnOffButton
                        className="h-[40px] w-full rounded-md"
                        text={"매월"}
                        on={selectedCycle === "매월"}
                        onClick={() =>
                          isFieldEditable && handleCycleChange("매월")
                        }
                        disabled={!isFieldEditable}
                      />
                    </div>
                  </InfoRow>
                )}
                {category === "반복성" && selectedCycle !== "매일" && (
                  <InfoRow className="flex flex-row">
                    <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                      요일:
                    </label>
                    <div className="flex flex-row gap-x-[10px] w-full">
                      {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
                        <DayToggle
                          key={day}
                          text={day}
                          isOn={selectedDays.includes(day)}
                          onClick={() => toggleDay(day)}
                          disabled={
                            !isFieldEditable || selectedCycle === "매일"
                          }
                        />
                      ))}
                    </div>
                  </InfoRow>
                )}
                {category === "1회성" && (
                  <InfoRow className="flex flex-row">
                    <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                      요일:
                    </label>
                    <div className="flex items-center text-gray-500 italic">
                      1회성 업무는 요일 설정이 필요하지 않습니다
                    </div>
                  </InfoRow>
                )}
                {category === "이벤트성" && selectedCycle !== "매일" && (
                  <InfoRow className="flex flex-row">
                    <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                      요일:
                    </label>
                    <div className="flex flex-row gap-x-[10px] w-full">
                      {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
                        <DayToggle
                          key={day}
                          text={day}
                          isOn={selectedDays.includes(day)}
                          onClick={() => toggleDay(day)}
                          disabled={
                            !isFieldEditable || selectedCycle === "매일"
                          }
                        />
                      ))}
                    </div>
                  </InfoRow>
                )}
                {(category === "이벤트성" || category === "반복성") &&
                  selectedCycle === "매일" && (
                    <InfoRow className="flex flex-row">
                      <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                        요일:
                      </label>
                      <div className="flex items-center text-gray-500 italic">
                        매일 수행하는 업무는 요일 설정이 필요하지 않습니다
                      </div>
                    </InfoRow>
                  )}
              </InforationZone>
            </div>
            <div className="flex-[4] flex border my-[20px] bg-textBackground rounded-lg">
              <div className="p-6 w-full">
                <div className="mb-4 font-semibold text-lg">업무 내용</div>
                <textarea
                  className={`w-full h-[150px] p-4 border border-gray-300 rounded-md ${
                    isFieldEditable ? "bg-white" : "bg-gray-100"
                  }`}
                  placeholder={
                    category === "1회성"
                      ? "1회성 업무: 하루 동안만 진행되는 업무입니다. 시작일과 종료일이 동일하게 설정됩니다."
                      : category === "반복성"
                      ? "반복성 업무: 정해진 주기에 따라 반복되는 업무입니다. 시작일 이후부터 계속 진행되며, 종료일은 지정할 수 없습니다."
                      : "이벤트성 업무: 특정 기간 동안 진행되는 업무입니다. 시작일과 종료일을 각각 설정할 수 있습니다."
                  }
                  value={content}
                  onChange={(e) =>
                    isFieldEditable && setContent(e.target.value)
                  }
                  disabled={!isFieldEditable}
                ></textarea>
              </div>
            </div>
            <ThreeButton className="flex flex-row w-full gap-x-[20px]">
              {mode === "view" && (
                <>
                  {/* 보기 모드일 때 수정하기 버튼 표시 */}
                  <OnceOnOffButton
                    text="수정하기"
                    on={true}
                    onClick={handleSwitchToEditMode}
                  />
                  {/* 기존 업무에 대해서만 업무일지 표시 */}
                  <OnceOnOffButton
                    on={true}
                    text="업무일지"
                    onClick={() => setRecordModalOn(true)}
                  />
                </>
              )}

              {mode === "edit" && (
                <>
                  {/* 수정 모드일 때 삭제/저장/업무일지 버튼 표시 */}
                  <OnceOnOffButton text="업무삭제" onClick={handleTaskDelete} />
                  <OnceOnOffButton
                    text="수정하기"
                    on={true}
                    onClick={handleSaveTask}
                  />
                  <OnceOnOffButton
                    on={true}
                    text="업무일지"
                    onClick={() => setRecordModalOn(true)}
                  />
                </>
              )}

              {mode === "create" && (
                <>
                  {/* 생성 모드일 때 등록하기 버튼만 표시 */}
                  <OnceOnOffButton
                    text="등록하기"
                    on={true}
                    onClick={handleSaveTask}
                  />
                </>
              )}
            </ThreeButton>
          </ModalContentZone>
        </div>
      </ModalTemplate>
      {/* 업무일지 모달은 기존 업무일 때만 표시 */}
      {task && (
        <TaskRecordModal
          isVisible={recordModalOn}
          setIsVisible={setRecordModalOn}
          task={task}
        />
      )}
    </>
  );
}

export default TaskAddModal;
