import React, { useState } from "react";
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
  const [category, setCategory] = useState(task?.category || "일반");
  const [priority, setPriority] = useState(task?.priority || "중");
  const [startDate, setStartDate] = useState(
    task?.startDate ? format(new Date(task.startDate), "yyyy/MM/dd") : ""
  );
  const [endDate, setEndDate] = useState(
    task?.endDate ? format(new Date(task.endDate), "yyyy/MM/dd") : ""
  );

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
            <span className="text-[34px] font-bold">&lt; 업무</span>
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
              <JcyCalendar
                preStartDay={startDate}
                preEndDay={endDate}
                setTargetStartDay={setStartDate}
                setTargetEndDay={setEndDate}
                lockDates={!isEdit}
                isEdit={isEdit}
              />
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
                      text={"일반"}
                      on={category === "일반"}
                      onClick={() => setCategory("일반")}
                    />
                    <OnceOnOffButton
                      className="h-[40px] w-full rounded-md"
                      text={"이벤트"}
                      on={category === "이벤트"}
                      onClick={() => setCategory("이벤트")}
                    />
                    <OnceOnOffButton
                      className="h-[40px] w-full rounded-md"
                      text={"기타"}
                      on={category === "기타"}
                      onClick={() => setCategory("기타")}
                    />
                    <div className="w-full" />
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
                  <div className="flex flex-row w-full items-center gap-x-[10px]">
                    <input
                      type="text"
                      value={startDate}
                      readOnly
                      placeholder="시작일 (YYYY/MM/DD)"
                      className="w-[200px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
                    />
                    <span>부터</span>
                    <input
                      type="text"
                      value={endDate}
                      readOnly
                      placeholder="종료일 (YYYY/MM/DD)"
                      className="w-[200px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
                    />
                  </div>
                </InfoRow>
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
              </InforationZone>
            </div>
            <div className="flex-[4] flex border my-[20px] bg-textBackground rounded-lg"></div>
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
