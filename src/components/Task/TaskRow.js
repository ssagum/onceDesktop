import React, { useState } from "react";
import ChipText from "../common/ChipText";
// import TaskDetailModal from "./TaskDetailModal";

const TaskRow = ({ task, index }) => {
  const {
    taskName,
    writer,
    manager,
    category,
    priority,
    startDate,
    endDate,
    frequency,
    days,
    description,
  } = task;

  const [isDetailModalOn, setIsDetailModalOn] = useState(false);

  // index가 짝수면 'bg-onceTextBackground', 홀수면 'bg-onceBackground'
  const rowBgClass =
    index % 2 === 0 ? "bg-onceTextBackground" : "bg-onceBackground";

  return (
    <div
      onClick={() => setIsDetailModalOn(true)}
      className={`grid grid-cols-8 gap-4 py-2 h-boxH items-center ${rowBgClass} cursor-pointer`}
    >
      <div className="text-center text-black">{taskName}</div>
      <div className="text-center text-black">{writer}</div>
      <div className="text-center text-black">{manager}</div>
      <div className="text-center text-black">{category}</div>
      <div className="flex justify-center">
        <ChipText text={priority} />
      </div>
      <div className="text-center text-black">{startDate}</div>
      <div className="text-center text-black">{frequency}</div>
      <div className="text-center text-black">
        {Array.isArray(days) ? days.join(", ") : days}
      </div>

      {/* <TaskDetailModal
        isVisible={isDetailModalOn}
        setIsVisible={setIsDetailModalOn}
        task={task}
      /> */}
    </div>
  );
};

export default TaskRow;
