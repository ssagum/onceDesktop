import React, { useState } from "react";
import styled from "styled-components";
import ModalTemplate from "../common/ModalTemplate";
import { cancel } from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import JcyTable from "../common/JcyTable";
import DayToggle from "../common/DayToggle";
import { JcyCalendar } from "../common/JcyCalendar";
import PriorityToggle from "../common/PriorityToggle";
import { format } from "date-fns";

const ModalHeaderZone = styled.div``;
const ModalContentZone = styled.div``;
const InforationZone = styled.div``;
const InfoRow = styled.div``;

function TaskRecordModal({ isVisible, setIsVisible, task }) {
  const [selectedDays, setSelectedDays] = useState(task?.days || []);
  const [selectedCycle, setSelectedCycle] = useState(task?.cycle || "매일");
  const [priority, setPriority] = useState(task?.priority || "중");
  const [startDate, setStartDate] = useState(
    task?.startDate ? format(new Date(task.startDate), "yyyy/MM/dd") : ""
  );
  const [endDate, setEndDate] = useState(
    task?.endDate ? format(new Date(task.endDate), "yyyy/MM/dd") : ""
  );

  // 업무 기록 데이터
  const recordData = [
    {
      date: "2025/01/24",
      time: "7:24",
      dayOfWeek: "오후",
      status: "상완",
    },
    {
      date: "2025/01/24",
      time: "7:24",
      dayOfWeek: "오후",
      status: "상완",
    },
    {
      date: "2025/01/24",
      time: "7:24",
      dayOfWeek: "오후",
      status: "미완료",
    },
    {
      date: "2025/01/24",
      time: "7:24",
      dayOfWeek: "오후",
      status: "상완",
    },
  ];

  const columns = [
    { label: "일시", key: "date" },
    { label: "완료", key: "status" },
  ];

  const toggleDay = (day) => {
    if (selectedCycle === "매일") return;
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
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
          <span className="text-[34px] font-bold">&lt; 업무일지</span>
          <img
            onClick={() => setIsVisible(false)}
            className="w-[30px]"
            src={cancel}
            alt="닫기"
            style={{ cursor: "pointer" }}
          />
        </ModalHeaderZone>
        <ModalContentZone className="flex flex-col h-full py-[20px] w-full">
          <div className="flex-[5] flex flex-row w-full items-start justify-between">
            {/* 좌측: 업무 정보 */}
            <div className="w-1/2 pr-4">
              <input
                type="text"
                value={task?.title || ""}
                readOnly
                placeholder="업무 제목"
                className="w-full border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground mb-[20px]"
              />
              <JcyCalendar
                preStartDay={startDate}
                preEndDay={endDate}
                setTargetStartDay={setStartDate}
                setTargetEndDay={setEndDate}
                lockDates={true}
                isEdit={false}
              />
              <InfoRow className="grid grid-cols-2 gap-4 mb-[10px]">
                <div className="flex flex-row">
                  <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                    작성자:
                  </label>
                  <input
                    type="text"
                    value={task?.writer || ""}
                    readOnly
                    className="w-[200px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
                  />
                </div>
                <div className="flex flex-row">
                  <label className="h-[40px] flex items-center font-semibold text-black mb-2 w-[60px]">
                    담당자:
                  </label>
                  <input
                    type="text"
                    value={task?.assignee || ""}
                    readOnly
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
                    on={task?.category === "일반"}
                    disabled
                  />
                  <OnceOnOffButton
                    className="h-[40px] w-full rounded-md"
                    text={"이벤트"}
                    on={task?.category === "이벤트"}
                    disabled
                  />
                  <OnceOnOffButton
                    className="h-[40px] w-full rounded-md"
                    text={"기타"}
                    on={task?.category === "기타"}
                    disabled
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
                    disabled
                  />
                  <OnceOnOffButton
                    className="h-[40px] w-full rounded-md"
                    text={"매주"}
                    on={selectedCycle === "매주"}
                    disabled
                  />
                  <OnceOnOffButton
                    className="h-[40px] w-full rounded-md"
                    text={"격주"}
                    on={selectedCycle === "격주"}
                    disabled
                  />
                  <OnceOnOffButton
                    className="h-[40px] w-full rounded-md"
                    text={"매월"}
                    on={selectedCycle === "매월"}
                    disabled
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
                      disabled={true}
                    />
                  ))}
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
                      onClick={() => {}}
                      disabled
                    />
                  ))}
                </div>
              </InfoRow>
            </div>

            {/* 우측: 업무 기록 테이블 */}
            <div className="w-1/2 pl-4">
              <JcyTable
                columns={columns}
                columnWidths="grid-cols-2"
                data={recordData}
                renderRow={(row) => (
                  <div className="grid grid-cols-2 gap-4 py-2">
                    <div className="text-center">
                      <div>{row.date}</div>
                      <div>
                        {row.dayOfWeek} {row.time}
                      </div>
                    </div>
                    <div className="text-center">
                      <span
                        className={`px-3 py-1 rounded-full ${
                          row.status === "상완"
                            ? "bg-orange-100 text-orange-500"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>
                  </div>
                )}
              />
            </div>
          </div>
        </ModalContentZone>
      </div>
    </ModalTemplate>
  );
}

export default TaskRecordModal;
