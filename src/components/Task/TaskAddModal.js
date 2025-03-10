import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import ModalTemplate from "../common/ModalTemplate";
import { cancel } from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import { JcyCalendar } from "../common/JcyCalendar";
import TaskRecordModal from "./TaskRecordModal";
import { format, parse, isValid, parseISO } from "date-fns";
import DayToggle from "../common/DayToggle";
import PriorityToggle from "../common/PriorityToggle";
import DepartmentRoleSelector from "../common/DepartmentRoleSelector";
import { useToast } from "../../contexts/ToastContext";
import FormLabel from "../common/FormLabel";
import { formatSafeDate, parseKoreanDate } from "../../utils/dateUtils";

const ModalHeaderZone = styled.div``;
const ModalContentZone = styled.div``;
const InforationZone = styled.div``;
const InfoRow = styled.div``;
const ThreeButton = styled.div``;

const isValidDate = (dateString) => {
  if (!dateString) return false;

  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// 한글 날짜 형식인지 확인하는 함수
const isKoreanDateFormat = (dateString) => {
  return (
    typeof dateString === "string" &&
    dateString.includes("년") &&
    dateString.includes("월")
  );
};

// 초기 날짜 값 설정 함수 - 컴포넌트 외부로 이동
const getInitialDate = (dateValue) => {
  // formatSafeDate 유틸리티 함수 사용
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
  onSwitchToEditMode,
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
    if (onSwitchToEditMode) {
      onSwitchToEditMode();
    }
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

    // 새 업무 객체 생성
    const newTask = {
      id: mode === "edit" && task ? task.id : Date.now().toString(), // 편집 시 기존 ID 유지, 새 업무는 새 ID 생성
      title,
      writer: writer || "", // 빈 문자열로 기본값 설정
      assignee: assignee || "", // assignee가 빈 값이어도 저장 가능하도록 빈 문자열로 기본값 설정
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
            <span
              className="text-[34px] font-bold"
              style={{ whiteSpace: "nowrap" }}
            >
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
                <div className="flex flex-row items-center mb-[20px]">
                  <FormLabel
                    label="업무 제목"
                    required={true}
                    className="mb-2"
                  />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) =>
                      isFieldEditable && setTitle(e.target.value)
                    }
                    placeholder="업무 제목을 입력하세요"
                    className={`w-[570px] border border-gray-400 rounded-md h-[40px] px-4 ${
                      isFieldEditable ? "bg-textBackground" : "bg-gray-100"
                    }`}
                    disabled={!isFieldEditable}
                  />
                </div>
                <InfoRow className="grid grid-cols-2 gap-4 mb-[20px]">
                  <div className="flex flex-row">
                    <FormLabel
                      label="작성자"
                      required={true}
                      className="mb-2"
                    />
                    <DepartmentRoleSelector
                      value={writer}
                      onChange={(val) => isFieldEditable && setWriter(val)}
                      label="작성자 선택"
                      onlyLeaders={true}
                      disabled={!isFieldEditable}
                    />
                  </div>
                  <div className="flex flex-row">
                    <FormLabel
                      label="담당자"
                      required={false}
                      className="mb-2"
                    />
                    <DepartmentRoleSelector
                      value={assignee}
                      onChange={(val) => isFieldEditable && setAssignee(val)}
                      label="담당자 선택"
                      disabled={!isFieldEditable}
                    />
                  </div>
                </InfoRow>
                <InfoRow className="flex flex-row mb-[20px]">
                  <FormLabel label="분류" required={true} className="mb-2" />
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
                <InfoRow className="flex flex-row mb-[20px]">
                  <FormLabel label="중요도" required={true} className="mb-2" />
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
                <InfoRow className="flex flex-row mb-[20px]">
                  <FormLabel label="날짜" required={true} className="mb-2" />
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
                  <InfoRow className="flex flex-row mb-[20px]">
                    <FormLabel label="주기" required={true} className="mb-2" />
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
                  <InfoRow className="flex flex-row mb-[20px]">
                    <FormLabel label="주기" required={false} className="mb-2" />
                    <div className="flex items-center text-gray-500 italic">
                      1회성 업무는 주기 설정이 필요하지 않습니다
                    </div>
                  </InfoRow>
                )}
                {category === "이벤트성" && (
                  <InfoRow className="flex flex-row mb-[20px]">
                    <FormLabel label="주기" required={false} className="mb-2" />
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
                  <InfoRow className="flex flex-row mb-[20px]">
                    <FormLabel
                      label="요일"
                      required={selectedCycle !== "매일"}
                      className="mb-2"
                    />
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
                  <InfoRow className="flex flex-row mb-[20px]">
                    <FormLabel label="요일" required={false} className="mb-2" />
                    <div className="flex items-center text-gray-500 italic">
                      1회성 업무는 요일 설정이 필요하지 않습니다
                    </div>
                  </InfoRow>
                )}
                {category === "이벤트성" && selectedCycle !== "매일" && (
                  <InfoRow className="flex flex-row mb-[20px]">
                    <FormLabel label="요일" required={false} className="mb-2" />
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
                    <InfoRow className="flex flex-row mb-[20px]">
                      <FormLabel
                        label="요일"
                        required={false}
                        className="mb-2"
                      />
                      <div className="flex items-center text-gray-500 italic">
                        매일 수행하는 업무는 요일 설정이 필요하지 않습니다
                      </div>
                    </InfoRow>
                  )}
              </InforationZone>
            </div>
            <div className="flex-[4] flex border my-[20px] bg-textBackground rounded-lg">
              <div className="p-4 w-full">
                <div className="mb-2 font-semibold flex items-center">
                  <FormLabel
                    label="업무 내용"
                    required={false}
                    className="text-lg mb-2"
                  />
                </div>
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
