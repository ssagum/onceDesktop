import React, { useState, useEffect } from "react";
import styled from "styled-components";
import ModalTemplate from "../common/ModalTemplate";
import { cancel } from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import { JcyCalendar } from "../common/JcyCalendar";
import TaskRecordModal from "./TaskRecordModal";
import { format } from "date-fns";
import DayToggle from "../common/DayToggle";
import PriorityToggle from "../common/PriorityToggle";

const ModalHeaderZone = styled.div``;
const ModalContentZone = styled.div``;
const InforationZone = styled.div``;
const InfoRow = styled.div``;
const ThreeButton = styled.div``;

function TaskAddModal({ isVisible, setIsVisible, task, isEdit = false }) {
  const [recordModalOn, setRecordModalOn] = useState(false);
  const [selectedDays, setSelectedDays] = useState(task?.days || []);
  const [selectedCycle, setSelectedCycle] = useState(task?.cycle || "매일");
  const [title, setTitle] = useState(task?.title || "");
  const [writer, setWriter] = useState(task?.writer || "");
  const [assignee, setAssignee] = useState(task?.assignee || "");
  const [category, setCategory] = useState(task?.category || "1회성");
  const [priority, setPriority] = useState(task?.priority || "중");
  const [startDate, setStartDate] = useState(
    task?.startDate
      ? format(new Date(task.startDate), "yyyy/MM/dd")
      : format(new Date(), "yyyy/MM/dd")
  );
  const [endDate, setEndDate] = useState(
    task?.endDate
      ? format(new Date(task.endDate), "yyyy/MM/dd")
      : format(new Date(), "yyyy/MM/dd")
  );
  // 무한 종료일 (반복성 업무용)
  const INFINITE_END_DATE = "2099/12/31";

  // 업무 분류 변경 시 날짜 설정 로직
  useEffect(() => {
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
      const startDateObj = new Date(currentStartDate);
      const endDateObj = new Date(endDate);

      if (endDate === INFINITE_END_DATE || startDateObj > endDateObj) {
        setEndDate(currentStartDate);
      }
    }
  }, [category, startDate, endDate, INFINITE_END_DATE]);

  // 시작 날짜 변경 시, 업무 유형에 따라 종료 날짜도 함께 변경
  const handleStartDateChange = (date) => {
    setStartDate(date);

    // 1회성 업무는 시작일 = 종료일
    if (category === "1회성") {
      setEndDate(date);
    }

    // 반복성 업무는 종료일을 무기한으로 유지
    if (category === "반복성") {
      setEndDate(INFINITE_END_DATE);
    }

    // 이벤트성 업무일 때 시작일이 종료일보다 이후라면 종료일도 시작일로 설정
    if (category === "이벤트성") {
      const startDateObj = new Date(date);
      const endDateObj = new Date(endDate);

      if (startDateObj > endDateObj) {
        setEndDate(date);
      }
    }
  };

  // 종료 날짜 변경 핸들러
  const handleEndDateChange = (date) => {
    // 1회성 또는 반복성 업무는 종료일 변경 불가
    if (category === "1회성" || category === "반복성") {
      return;
    }

    // 이벤트성 업무일 때 종료일이 시작일보다 이전이면 시작일도 종료일로 설정
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(date);

    if (endDateObj < startDateObj) {
      setStartDate(date);
    }

    setEndDate(date);
  };

  // 주기 변경 시 요일 자동 선택
  const handleCycleChange = (cycle) => {
    setSelectedCycle(cycle);
    if (cycle === "매일") {
      setSelectedDays(["월", "화", "수", "목", "금", "토", "일"]);
    } else {
      setSelectedDays([]);
    }
  };

  // 요일 토글
  const toggleDay = (day) => {
    if (selectedCycle === "매일") return; // 매일인 경우 요일 선택 불가

    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  return (
    <>
      <ModalTemplate
        isVisible={isVisible}
        setIsVisible={setIsVisible}
        showCancel={false}
      >
        <div className="flex flex-col items-center w-onceBigModal h-onceBigModalH bg-white px-[40px] py-[30px]">
          <ModalHeaderZone className="flex flex-row w-full bg-white justify-between h-[50px] items-center">
            <span className="text-[34px] font-bold">업무</span>
            <img
              onClick={() => setIsVisible(false)}
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
                  lockDates={false}
                  singleDateMode={category === "1회성"}
                  startDayOnlyMode={category === "반복성"}
                  isEdit={true}
                />
              </div>
              <InforationZone className="w-full flex flex-col px-[20px]">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="업무 제목을 입력하세요"
                  className="w-[630px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground mb-[20px]"
                />
                <InfoRow className="grid grid-cols-2 gap-4 mb-[10px]">
                  <div className="flex flex-row">
                    <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                      작성자:
                    </label>
                    <input
                      type="text"
                      value={writer}
                      onChange={(e) => setWriter(e.target.value)}
                      placeholder="작성자"
                      className="w-[200px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
                    />
                  </div>
                  <div className="flex flex-row">
                    <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                      담당자:
                    </label>
                    <input
                      type="text"
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value)}
                      placeholder="담당자"
                      className="w-[200px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
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
                      onClick={() => setCategory("1회성")}
                    />
                    <OnceOnOffButton
                      className="h-[40px] w-full rounded-md"
                      text={"반복성 업무"}
                      on={category === "반복성"}
                      onClick={() => setCategory("반복성")}
                    />
                    <OnceOnOffButton
                      className="h-[40px] w-full rounded-md"
                      text={"이벤트성 업무"}
                      on={category === "이벤트성"}
                      onClick={() => setCategory("이벤트성")}
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
                        onClick={() => setPriority(level)}
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
                        className="w-[200px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
                      />
                      <span className="w-[60px]">부터</span>
                      <input
                        type="text"
                        value={category === "반복성" ? "계속 반복" : endDate}
                        readOnly
                        placeholder="종료일 (YYYY/MM/DD)"
                        className={`w-[200px] border border-gray-400 rounded-md h-[40px] px-4 ${
                          category === "반복성"
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
                        onClick={() => handleCycleChange("매일")}
                      />
                      <OnceOnOffButton
                        className="h-[40px] w-full rounded-md"
                        text={"매주"}
                        on={selectedCycle === "매주"}
                        onClick={() => handleCycleChange("매주")}
                      />
                      <OnceOnOffButton
                        className="h-[40px] w-full rounded-md"
                        text={"격주"}
                        on={selectedCycle === "격주"}
                        onClick={() => handleCycleChange("격주")}
                      />
                      <OnceOnOffButton
                        className="h-[40px] w-full rounded-md"
                        text={"매월"}
                        on={selectedCycle === "매월"}
                        onClick={() => handleCycleChange("매월")}
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
                        onClick={() => handleCycleChange("매일")}
                      />
                      <OnceOnOffButton
                        className="h-[40px] w-full rounded-md"
                        text={"매주"}
                        on={selectedCycle === "매주"}
                        onClick={() => handleCycleChange("매주")}
                      />
                      <OnceOnOffButton
                        className="h-[40px] w-full rounded-md"
                        text={"격주"}
                        on={selectedCycle === "격주"}
                        onClick={() => handleCycleChange("격주")}
                      />
                      <OnceOnOffButton
                        className="h-[40px] w-full rounded-md"
                        text={"매월"}
                        on={selectedCycle === "매월"}
                        onClick={() => handleCycleChange("매월")}
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
                          disabled={selectedCycle === "매일"}
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
                          disabled={selectedCycle === "매일"}
                        />
                      ))}
                    </div>
                  </InfoRow>
                )}
                {category === "이벤트성" && selectedCycle === "매일" && (
                  <InfoRow className="flex flex-row">
                    <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                      요일:
                    </label>
                    <div className="flex items-center text-gray-500 italic">
                      매일 수행하는 업무는 요일 설정이 필요하지 않습니다
                    </div>
                  </InfoRow>
                )}
                {category === "반복성" && selectedCycle === "매일" && (
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
                  className="w-full h-[150px] p-4 border border-gray-300 rounded-md bg-white"
                  placeholder={
                    category === "1회성"
                      ? "1회성 업무: 하루 동안만 진행되는 업무입니다. 시작일과 종료일이 동일하게 설정됩니다."
                      : category === "반복성"
                      ? "반복성 업무: 정해진 주기에 따라 반복되는 업무입니다. 시작일 이후부터 계속 진행되며, 종료일은 지정할 수 없습니다."
                      : "이벤트성 업무: 특정 기간 동안 진행되는 업무입니다. 시작일과 종료일을 각각 설정할 수 있습니다."
                  }
                ></textarea>
              </div>
            </div>
            <ThreeButton className="flex flex-row w-full gap-x-[20px]">
              <OnceOnOffButton text={"업무삭제"} />
              <OnceOnOffButton text="수정하기" />
              <OnceOnOffButton
                on={true}
                text="업무일지"
                onClick={() => setRecordModalOn(true)}
              />
            </ThreeButton>
          </ModalContentZone>
        </div>
      </ModalTemplate>
      <TaskRecordModal
        isVisible={recordModalOn}
        setIsVisible={setRecordModalOn}
        task={task}
      />
    </>
  );
}

export default TaskAddModal;
