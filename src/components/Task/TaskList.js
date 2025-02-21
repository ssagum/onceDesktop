import React, { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import ToDo from "../common/ToDo";

export default function TaskList() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    // Firestore에서 tasks 컬렉션 구독
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(taskList);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col w-full">
      {tasks.map((task) => (
        <ToDo key={task.id} task={task} />
      ))}
    </div>
  );
}
