import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const createTask = async ({
  title,
  priority,
  category,
  writer,
  assignee,
  startDate,
  endDate,
  cycle,
}) => {
  try {
    const taskRef = await addDoc(collection(db, "tasks"), {
      title,
      priority,
      category,
      writer,
      assignee,
      startDate,
      endDate,
      cycle,
      status: "진행중",
      completedBy: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return taskRef.id;
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId, completedBy) => {
  // 업무 상태 업데이트 및 기록 추가 로직
};
