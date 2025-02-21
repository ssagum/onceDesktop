import React, { useState } from "react";
import ChipText from "../common/ChipText";
import TaskAddModal from "./TaskAddModal";

const TaskRow = ({ task, index }) => {
  const {
    title,
    writer,
    assignee,
    category,
    priority,
    startDate,
    endDate,
    cycle,
    days,
    description,
  } = task;

  const [taskDetailModalOn, setTaskDetailModalOn] = useState(false);

  // index가 짝수면 'bg-onceTextBackground', 홀수면 'bg-onceBackground'
  const rowBgClass =
    index % 2 === 0 ? "bg-onceTextBackground" : "bg-onceBackground";

  const formatDate = (date) => {
    return date instanceof Date ? date.toLocaleDateString() : date;
  };

  return (
    <>
      <div
        onClick={() => setTaskDetailModalOn(true)}
        className={`grid grid-cols-8 gap-4 py-2 h-boxH items-center ${rowBgClass} cursor-pointer`}
      >
        <div className="text-center text-black">{title}</div>
        <div className="text-center text-black">{writer}</div>
        <div className="text-center text-black">{assignee}</div>
        <div className="text-center text-black">{category}</div>
        <div className="flex justify-center">
          <ChipText text={priority} />
        </div>
        <div className="text-center text-black">{formatDate(startDate)}</div>
        <div className="text-center text-black">{cycle}</div>
        <div className="text-center text-black">
          {Array.isArray(days) ? days.join(", ") : days}
        </div>
      </div>

      <TaskAddModal
        isVisible={taskDetailModalOn}
        setIsVisible={setTaskDetailModalOn}
        task={task}
      />
    </>
  );
};

export default TaskRow;
