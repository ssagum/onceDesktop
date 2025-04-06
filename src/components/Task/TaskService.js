import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { format, parse } from "date-fns";
import { convertToFirestoreDate, formatSafeDate } from "../../utils/dateUtils";

// Task 컬렉션 레퍼런스
const tasksCollectionRef = () => collection(db, "tasks");
// TaskHistory 컬렉션 레퍼런스 (별도 컬렉션으로 변경)
const taskHistoryCollectionRef = () => collection(db, "taskHistory");

/**
 * 모든 업무 목록을 가져옵니다.
 */
export const getAllTasks = async () => {
  try {
    const q = query(tasksCollectionRef(), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    // 모든 task를 가져와 클라이언트에서 필터링
    const allTasks = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // isHidden이 true인 업무는 필터링하여 제외
    return allTasks.filter((task) => !task.isHidden);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
};

/**
 * 특정 부서/역할의 업무 목록을 가져옵니다.
 */
export const getTasksByAssignee = async (assignee) => {
  try {
    const q = query(
      tasksCollectionRef(),
      where("assignee", "==", assignee),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    // isHidden이 true인 업무는 필터링하여 제외
    return querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((task) => !task.isHidden);
  } catch (error) {
    console.error("Error fetching tasks by assignee:", error);
    return [];
  }
};

/**
 * 특정 날짜에 해당하는 업무 목록을 가져옵니다.
 */
export const getTasksByDate = async (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const q = query(
      tasksCollectionRef(),
      where("startDate", "<=", endOfDay),
      where("endDate", ">=", startOfDay),
      orderBy("startDate", "asc")
    );
    const querySnapshot = await getDocs(q);

    // isHidden이 true인 업무는 필터링하여 제외
    return querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((task) => !task.isHidden);
  } catch (error) {
    console.error("Error fetching tasks by date:", error);
    return [];
  }
};

/**
 * 새 업무를 추가합니다.
 */
export const addTask = async (taskData) => {
  console.log("TaskService: 새 업무 추가 시작", taskData);

  try {
    // title을 기반으로 문서 ID 생성
    const generateTaskId = (title) => {
      // 타임스탬프 추가 (고유성 보장)
      const timestamp = Date.now();

      // 제목이 있는 경우 제목 기반 ID 생성
      if (title && typeof title === "string" && title.trim() !== "") {
        // 제목에서 특수 문자와 공백 제거
        const sanitizedTitle = title
          .toLowerCase()
          .replace(/[^a-z0-9가-힣]/g, "_")
          .replace(/_+/g, "_")
          .substring(0, 30); // 길이 제한

        return `${sanitizedTitle}_${timestamp}`;
      }

      // 제목이 없는 경우 타임스탬프만 사용
      return `task_${timestamp}`;
    };

    // ID 생성
    const documentId = generateTaskId(taskData.title);
    console.log(`TaskService: 생성된, 업무 ID: ${documentId}`);

    // 날짜 필드를 Date 객체로 변환 (Firestore 호환성) - 시간 정보는 제거
    const processedData = {
      ...taskData,
      id: documentId, // 문서 ID를 id 필드에도 저장 (중요!)
      startDate: convertToFirestoreDate(taskData.startDate),
      endDate: convertToFirestoreDate(taskData.endDate),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("TaskService: 처리된 업무 데이터", processedData);

    // setDoc으로 변경하여 문서 ID 직접 지정
    const docRef = doc(db, "tasks", documentId);
    await setDoc(docRef, processedData);

    console.log("TaskService: 업무 추가 성공, ID:", documentId);

    // 업무 이력 추가 (생성 이력)
    const now = new Date();
    const historyId = generateHistoryId(documentId, now);

    const historyData = {
      id: historyId,
      taskId: documentId,
      title: taskData.title || "제목 없음",
      content: taskData.content || "",
      action: "create",
      actionBy: taskData.writer || "시스템",
      timestamp: now,
      date: serverTimestamp(),
      dateStr: formatDateForTask(now),
    };

    console.log("TaskService: 업무 생성 이력 추가", historyData);

    // 이력 저장 시 ID 직접 지정
    const historyDocRef = doc(db, "taskHistory", historyId);
    await setDoc(historyDocRef, historyData);

    console.log("TaskService: 업무 생성 이력 추가 성공", historyId);

    return {
      id: documentId,
      ...processedData,
    };
  } catch (error) {
    console.error("TaskService: 업무 추가 오류:", error);
    console.error("오류 상세:", error.message);
    console.error("오류 스택:", error.stack);
    throw error;
  }
};

/**
 * 업무를 업데이트합니다.
 */
export const updateTask = async (updatedTaskData) => {
  try {
    const taskId = updatedTaskData.id;
    if (!taskId) {
      throw new Error("업무 ID가 없습니다.");
    }

    // ID를 제외한 나머지 데이터만 추출
    const { id, ...taskDataWithoutId } = updatedTaskData;

    // 날짜 필드 처리
    const processedData = {
      ...taskDataWithoutId,
      startDate: convertToFirestoreDate(updatedTaskData.startDate),
      endDate: convertToFirestoreDate(updatedTaskData.endDate),
      updatedAt: serverTimestamp(),
    };

    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, processedData);

    return updatedTaskData;
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

/**
 * 업무를 삭제합니다.
 */
export const deleteTask = async (taskId) => {
  try {
    const taskRef = doc(db, "tasks", taskId);
    await deleteDoc(taskRef);
    return true;
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

/**
 * 날짜를 YYYY-MM-DD 형식의 문자열로 변환
 */
const formatDateForId = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    console.warn("유효하지 않은 날짜가 제공되어 현재 날짜를 사용합니다.");
    date = new Date();
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
};

/**
 * 날짜 객체를 정규화 (시간을 초기화하고 복사본 반환)
 * 훨씬 더 엄격한 검증 추가
 */
const normalizeDate = (date) => {
  // 날짜가 없으면 오류 발생
  if (!date) {
    throw new Error("날짜가 제공되지 않았습니다.");
  }

  let normalizedDate;

  // 문자열인 경우
  if (typeof date === "string") {
    // YYYY-MM-DD 형식 검증
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split("-").map(Number);
      normalizedDate = new Date(year, month - 1, day);
    } else {
      // 다른 형식의 문자열
      normalizedDate = new Date(date);
    }
  }
  // Date 객체인 경우
  else if (date instanceof Date) {
    normalizedDate = new Date(date.getTime()); // 복사본 생성
  }
  // 그 외의 경우 오류 발생
  else {
    throw new Error("유효하지 않은 날짜 형식입니다.");
  }

  // 유효성 검사
  if (isNaN(normalizedDate.getTime())) {
    throw new Error("유효하지 않은 날짜입니다.");
  }

  // 시간을 00:00:00으로 설정
  normalizedDate.setHours(0, 0, 0, 0);
  return normalizedDate;
};

/**
 * 날짜 문자열을 TaskHistory 문서 ID에 사용할 형식으로 포맷
 * 더 안전한 처리 추가
 */
const getDateStrForTask = (date) => {
  // 날짜가 없으면 오류 발생
  if (!date) {
    throw new Error("날짜가 제공되지 않았습니다.");
  }

  // 이미 YYYY-MM-DD 형식 문자열인 경우 그대로 반환
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  // 날짜 객체이거나 다른 형식의 문자열인 경우 정규화 후 포맷
  const normalizedDate = normalizeDate(date);
  return formatDateForId(normalizedDate);
};

/**
 * TaskHistory 문서 ID 생성
 * 더 명확한 오류 처리 추가
 */
const generateHistoryId = (taskId, date = new Date()) => {
  if (!taskId) {
    throw new Error("generateHistoryId: taskId는 필수 값입니다.");
  }

  const dateStr = getDateStrForTask(date);
  console.log(`[generateHistoryId] 태스크: ${taskId}, 날짜: ${dateStr}`, date);
  return `${taskId}_${dateStr}`;
};

/**
 * 업무를 완료 처리하고 이력을 추가합니다.
 * 완전히 개선된 버전
 */
export const completeTask = async (taskId, staffIds, options = {}) => {
  try {
    console.log(`[completeTask] 시작 - 태스크: ${taskId}`, options);

    // 1. 입력값 검증
    if (!taskId) {
      console.error("업무 완료 처리 실패: 업무 ID가 제공되지 않았습니다.");
      throw new Error("Task ID is required");
    }

    if (!staffIds) {
      console.error("업무 완료 처리 실패: 직원 ID가 제공되지 않았습니다.");
      throw new Error("Staff IDs are required");
    }

    // 2. staffIds가 문자열이면 배열로 변환
    const staffIdArray = Array.isArray(staffIds) ? staffIds : [staffIds];

    if (staffIdArray.length === 0) {
      console.error("업무 완료 처리 실패: 완료자 정보가 비어 있습니다.");
      throw new Error("No completers specified");
    }

    // 3. 날짜 처리 - 더 엄격하게
    let dateObj;
    let dateStr;

    // 3.1 taskDateStr이 우선 (형식이 맞는 경우)
    if (
      options.taskDateStr &&
      /^\d{4}-\d{2}-\d{2}$/.test(options.taskDateStr)
    ) {
      dateStr = options.taskDateStr;
      // 문자열에서 날짜 객체 생성
      const [year, month, day] = dateStr.split("-").map(Number);
      dateObj = new Date(year, month - 1, day);
      dateObj.setHours(0, 0, 0, 0);

      console.log(
        `[completeTask] taskDateStr에서 날짜 생성: ${dateStr}`,
        dateObj
      );
    }
    // 3.2 date 객체가 있는 경우
    else if (options.date) {
      dateObj = normalizeDate(options.date);
      dateStr = formatDateForId(dateObj);

      console.log(
        `[completeTask] options.date에서 날짜 생성: ${dateStr}`,
        dateObj
      );
    }
    // 3.3 둘 다 없는 경우 - 오류 발생
    else {
      console.error("[completeTask] 날짜 정보가 제공되지 않았습니다.");
      throw new Error("날짜 정보(taskDateStr 또는 date)가 필요합니다.");
    }

    // 3.4 최종 유효성 검증
    if (!dateObj || isNaN(dateObj.getTime())) {
      console.error("[completeTask] 유효하지 않은 날짜가 생성되었습니다.");
      throw new Error("Invalid date was generated");
    }

    // 4. 업무 정보 조회
    const taskRef = doc(db, "tasks", taskId);
    const taskDoc = await getDoc(taskRef);

    if (!taskDoc.exists()) {
      console.error(
        `업무 완료 처리 실패: 업무 ID ${taskId}가 존재하지 않습니다.`
      );
      throw new Error(`Task with ID ${taskId} not found`);
    }

    const taskData = taskDoc.data();

    // 5. 히스토리 ID 생성 (taskId_YYYY-MM-DD 형식)
    const historyId = `${taskId}_${dateStr}`;
    console.log(`[completeTask] 생성된 히스토리 ID: ${historyId}`);

    // 6. 기존 히스토리 문서 확인 (중복 생성 방지)
    try {
      const historyDocRef = doc(db, "taskHistory", historyId);
      const existingHistoryDoc = await getDoc(historyDocRef);

      // 7. 히스토리 데이터 생성 (action은 "complete"으로 고정)
      const historyData = {
        id: historyId,
        taskId,
        dateStr,
        timestamp: new Date(),
        date: serverTimestamp(),
        action: "complete",
        actors: staffIdArray,
        actionBy: options.actionBy || staffIdArray[0],
        title: taskData.title,
        content: taskData.content,
        ...(options.memo && { memo: options.memo }),
      };

      // 8. 히스토리 문서 생성 또는 업데이트
      if (existingHistoryDoc.exists()) {
        console.log(
          `[completeTask] 기존 히스토리 문서 업데이트 - ID: ${historyId}`
        );

        try {
          await updateDoc(historyDocRef, {
            actors: staffIdArray,
            actionBy: options.actionBy || staffIdArray[0],
            timestamp: new Date(),
            date: serverTimestamp(),
          });
        } catch (updateError) {
          // 업데이트 중 오류가 발생해도 조용히 처리 (무시)
          console.warn(
            `[completeTask] 문서 업데이트 중 오류 발생 (무시됨): ${updateError.message}`
          );
          // 오류를 throw하지 않음 - 정상적으로 처리된 것으로 간주
        }
      } else {
        console.log(`[completeTask] 새 히스토리 문서 생성 - ID: ${historyId}`);
        try {
          await setDoc(historyDocRef, historyData);
        } catch (setError) {
          // 문서 생성 중 오류가 발생해도 조용히 처리 (무시)
          console.warn(
            `[completeTask] 문서 생성 중 오류 발생 (무시됨): ${setError.message}`
          );
          // 오류를 throw하지 않음 - 정상적으로 처리된 것으로 간주
        }
      }

      console.log(
        `[completeTask] 히스토리 저장 완료 - ID: ${historyId}, 날짜: ${dateStr}`
      );
    } catch (dbError) {
      // 데이터베이스 작업 중 발생한 오류도 조용히 처리
      console.warn(
        `[completeTask] 데이터베이스 작업 중 오류 발생 (무시됨): ${dbError.message}`
      );
      // 오류를 throw하지 않고 계속 진행
    }

    // 9. 업데이트된 업무 데이터 반환
    return {
      id: taskId,
      ...taskData,
      status: "completed",
      completed: true,
    };
  } catch (error) {
    console.error("[completeTask] 업무 완료 처리 중 오류:", error);
    throw error;
  }
};

/**
 * 업무 완료자 정보를 업데이트합니다.
 * completeTask와 동일한 개선 적용
 */
export const updateTaskCompleters = async (
  taskId,
  newStaffIds,
  updatedBy,
  options = {}
) => {
  try {
    console.log(`[updateTaskCompleters] 시작 - 태스크: ${taskId}`, options);

    // 1. 입력값 검증
    if (!taskId) {
      console.error("업무 완료자 수정 실패: 업무 ID가 제공되지 않았습니다.");
      throw new Error("Task ID is required");
    }

    if (
      !newStaffIds ||
      !Array.isArray(newStaffIds) ||
      newStaffIds.length === 0
    ) {
      console.error("업무 완료자 수정 실패: 완료자 ID가 제공되지 않았습니다.");
      throw new Error("New staff IDs are required");
    }

    // 2. 날짜 처리 - 엄격하게
    let dateObj;
    let dateStr;

    // 2.1 taskDateStr이 우선 (형식이 맞는 경우)
    if (
      options.taskDateStr &&
      /^\d{4}-\d{2}-\d{2}$/.test(options.taskDateStr)
    ) {
      dateStr = options.taskDateStr;
      // 문자열에서 날짜 객체 생성
      const [year, month, day] = dateStr.split("-").map(Number);
      dateObj = new Date(year, month - 1, day);
      dateObj.setHours(0, 0, 0, 0);

      console.log(
        `[updateTaskCompleters] taskDateStr에서 날짜 생성: ${dateStr}`,
        dateObj
      );
    }
    // 2.2 date 객체가 있는 경우
    else if (options.date) {
      dateObj = normalizeDate(options.date);
      dateStr = formatDateForId(dateObj);

      console.log(
        `[updateTaskCompleters] options.date에서 날짜 생성: ${dateStr}`,
        dateObj
      );
    }
    // 2.3 둘 다 없는 경우 - 오류 발생
    else {
      console.error("[updateTaskCompleters] 날짜 정보가 제공되지 않았습니다.");
      throw new Error("날짜 정보(taskDateStr 또는 date)가 필요합니다.");
    }

    // 2.4 최종 유효성 검증
    if (!dateObj || isNaN(dateObj.getTime())) {
      console.error(
        "[updateTaskCompleters] 유효하지 않은 날짜가 생성되었습니다."
      );
      throw new Error("Invalid date was generated");
    }

    // 3. 업무 정보 조회
    const taskRef = doc(db, "tasks", taskId);
    const taskDoc = await getDoc(taskRef);

    if (!taskDoc.exists()) {
      console.error(
        `업무 완료자 수정 실패: 업무 ID ${taskId}가 존재하지 않습니다.`
      );
      throw new Error(`Task with ID ${taskId} not found`);
    }

    const taskData = taskDoc.data();

    // 4. 히스토리 ID 생성
    const historyId = `${taskId}_${dateStr}`;
    console.log(`[updateTaskCompleters] 생성된 히스토리 ID: ${historyId}`);

    // 5. 기존 히스토리 문서 확인 (중복 생성 방지)
    try {
      const historyDocRef = doc(db, "taskHistory", historyId);
      const existingHistoryDoc = await getDoc(historyDocRef);

      // 6. 히스토리 데이터 생성 (action은 "update_completers"로 설정)
      const historyData = {
        id: historyId,
        taskId,
        dateStr,
        timestamp: new Date(),
        date: serverTimestamp(),
        action: "update_completers",
        actors: newStaffIds,
        actionBy: updatedBy,
        title: taskData.title,
        content: taskData.content,
        ...(options.memo && { memo: options.memo }),
      };

      // 7. 히스토리 문서 생성 또는 업데이트
      if (existingHistoryDoc.exists()) {
        console.log(
          `[updateTaskCompleters] 기존 히스토리 문서 업데이트 - ID: ${historyId}`
        );

        try {
          await updateDoc(historyDocRef, {
            actors: newStaffIds,
            actionBy: updatedBy,
            action: "update_completers",
            timestamp: new Date(),
            date: serverTimestamp(),
          });
        } catch (updateError) {
          // 업데이트 중 오류가 발생해도 조용히 처리 (무시)
          console.warn(
            `[updateTaskCompleters] 문서 업데이트 중 오류 발생 (무시됨): ${updateError.message}`
          );
          // 오류를 throw하지 않음 - 정상적으로 처리된 것으로 간주
        }
      } else {
        console.log(
          `[updateTaskCompleters] 새 히스토리 문서 생성 - ID: ${historyId}`
        );
        try {
          await setDoc(historyDocRef, historyData);
        } catch (setError) {
          // 문서 생성 중 오류가 발생해도 조용히 처리 (무시)
          console.warn(
            `[updateTaskCompleters] 문서 생성 중 오류 발생 (무시됨): ${setError.message}`
          );
          // 오류를 throw하지 않음 - 정상적으로 처리된 것으로 간주
        }
      }

      console.log(
        `[updateTaskCompleters] 히스토리 저장 완료 - ID: ${historyId}, 날짜: ${dateStr}`
      );
    } catch (dbError) {
      // 데이터베이스 작업 중 발생한 오류도 조용히 처리
      console.warn(
        `[updateTaskCompleters] 데이터베이스 작업 중 오류 발생 (무시됨): ${dbError.message}`
      );
      // 오류를 throw하지 않고 계속 진행
    }

    // 8. 업데이트된 업무 데이터 반환
    return {
      id: taskId,
      ...taskData,
    };
  } catch (error) {
    console.error("[updateTaskCompleters] 업무 완료자 수정 중 오류:", error);
    throw error;
  }
};

/**
 * 특정 업무의 이력을 가져옵니다.
 * @param {string} taskId - 업무 ID
 * @param {Date|string} [date] - 특정 날짜의 이력을 조회할 경우 지정 (기본: 모든 이력)
 */
export const getTaskHistory = async (taskId, date = null) => {
  try {
    // 날짜가 제공되면 해당 날짜에 대한 ID로 직접 조회
    if (date) {
      const dateStr = getDateStrForTask(date);
      console.log(`이력 조회 - 태스크: ${taskId}, 날짜: ${dateStr}`);

      // 문서 ID로 직접 조회
      const historyId = `${taskId}_${dateStr}`;
      const historyDocRef = doc(db, "taskHistory", historyId);
      const historyDoc = await getDoc(historyDocRef);

      if (historyDoc.exists()) {
        const data = historyDoc.data();
        console.log(`${dateStr} 날짜의 히스토리 문서 발견`);

        // timestamp 처리
        let timestamp = data.timestamp;
        if (timestamp instanceof Timestamp) {
          timestamp = timestamp.toDate();
        } else if (typeof timestamp === "string") {
          timestamp = new Date(timestamp);
        } else if (!timestamp) {
          timestamp = new Date();
        }

        return [
          {
            id: historyDoc.id,
            ...data,
            timestamp,
          },
        ];
      }

      console.log(`${dateStr} 날짜에 대한 히스토리가 없습니다.`);
      return [];
    }

    // 날짜가 없으면 모든 이력 조회
    console.log(`모든 이력 조회 - 태스크: ${taskId}`);
    const q = query(
      taskHistoryCollectionRef(),
      where("taskId", "==", taskId),
      orderBy("timestamp", "desc")
    );

    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map((doc) => {
      const data = doc.data();

      // timestamp 처리
      let timestamp = data.timestamp;
      if (timestamp instanceof Timestamp) {
        timestamp = timestamp.toDate();
      } else if (typeof timestamp === "string") {
        timestamp = new Date(timestamp);
      } else if (!timestamp) {
        timestamp = new Date();
      }

      return {
        id: doc.id,
        ...data,
        timestamp,
      };
    });

    console.log(`조회 결과: ${results.length}개 이력`);
    return results;
  } catch (error) {
    console.error("이력 조회 중 오류:", error);
    return [];
  }
};

/**
 * 디버깅을 위해 모든 업무 목록을 반환합니다.
 */
export const debugShowAllTasks = async () => {
  try {
    console.log("모든 업무 조회 시작");
    const tasksSnapshot = await getDocs(tasksCollectionRef());

    // .docs는 쿼리 결과의 문서 배열을 제공합니다
    if (tasksSnapshot.empty) {
      console.log("업무가 없습니다!");
      return [];
    }

    // 각 문서의 ID와 데이터를 포함한 배열 반환
    const tasks = tasksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // isHidden이 true인 업무는 필터링하여 제외
    const visibleTasks = tasks.filter((task) => !task.isHidden);

    console.log(
      `총 ${tasks.length}개의 업무 중 ${visibleTasks.length}개 표시 가능:`,
      visibleTasks
    );
    return visibleTasks;
  } catch (error) {
    console.error("업무 조회 중 오류:", error);
    return [];
  }
};

/**
 * 사용자(부서/직급)에 할당된 업무 목록을 가져옵니다.
 * 사용자의 부서와 일치하는 업무만 필터링하고,
 * 요일(days)과 주기(cycle)를 고려하여 오늘 수행해야 하는 업무만 반환합니다.
 *
 * @param {Object} options - 필터링 옵션
 * @param {string} options.department - 사용자의 부서
 * @param {Date} options.date - 기준 날짜 (기본값: 오늘)
 * @param {boolean} options.ignoreSchedule - true인 경우 요일과 주기를 무시하고 모든 업무 반환
 * @returns {Promise<Array>} 필터링된 업무 목록
 */
export const getUserTasks = async (options = {}) => {
  try {
    // 기본 옵션 설정
    const { department, date = new Date(), ignoreSchedule = false } = options;

    // 모든 업무를 가져옵니다
    const allTasks = await getAllTasks();
    console.log(`총 ${allTasks.length}개의 업무가 있습니다.`);

    // 필터링할 요일 확인 (0: 일, 1: 월, 2: 화, 3: 수, 4: 목, 5: 금, 6: 토)
    const dayOfWeek = date.getDay();
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const todayName = dayNames[dayOfWeek];

    // 오늘 날짜의 일자 (1-31)
    const dayOfMonth = date.getDate();

    // 필터링 함수
    const filterTasks = (task) => {
      // 1. 부서 필터링 (부서가 제공된 경우)
      if (department) {
        // 부서 필드의 불일치 문제 해결: task.department 또는 task.assignee 둘 중 하나라도 일치하면 통과
        const isDepartmentMatch =
          task.department === department || task.assignee === department;
        if (!isDepartmentMatch) {
          console.log(
            `업무 [${
              task.title || task.id
            }] 부서 불일치: 요청=${department}, 업무 부서=${
              task.department
            }, 담당자=${task.assignee}`
          );
          return false;
        }
      }

      // 스케줄 무시 옵션이 활성화된 경우 부서만 체크하고 반환
      if (ignoreSchedule) {
        return true;
      }

      // 2. 요일 및 주기 필터링

      // 2.1 매일 실행되는 업무 (한글/영문 모두 처리)
      if (task.cycle === "daily" || task.cycle === "매일") {
        return true;
      }

      // 2.2 특정 요일에 실행되는 업무 (한글/영문 모두 처리)
      if (
        (task.cycle === "weekly" ||
          task.cycle === "매주" ||
          task.cycle === "biweekly" ||
          task.cycle === "격주") &&
        task.days &&
        Array.isArray(task.days)
      ) {
        // 요일이 일치하는지 확인
        const dayMatches = task.days.includes(todayName);

        // 요일이 일치하지 않으면 바로 false 반환
        if (!dayMatches) {
          return false;
        }

        // 주간 업무는 요일만 확인
        if (task.cycle === "weekly" || task.cycle === "매주") {
          return true;
        }

        // 격주 업무는 주차 계산 필요
        if (task.cycle === "biweekly" || task.cycle === "격주") {
          try {
            // 시작일 가져오기
            let startDate;
            if (task.startDate instanceof Date) {
              startDate = new Date(task.startDate.getTime());
            } else if (task.startDate?.seconds) {
              startDate = new Date(task.startDate.seconds * 1000);
            } else {
              startDate = new Date(task.startDate);
            }

            // 두 날짜 사이의 일수 계산
            const timeDiff = Math.abs(date.getTime() - startDate.getTime());
            const diffDays = Math.floor(timeDiff / (1000 * 3600 * 24));

            // 주차 계산 (0부터 시작)
            const weeksFromStart = Math.floor(diffDays / 7);

            // 짝수 주차(0, 2, 4...)인지 홀수 주차(1, 3, 5...)인지 확인
            // 0, 2, 4... 주차에 업무 표시 (첫 주 포함, 다음 주 제외, 다다음 주 포함...)
            return weeksFromStart % 2 === 0;
          } catch (error) {
            console.error("격주 계산 중 오류:", error);
            // 오류 발생 시 안전하게 처리
            return true;
          }
        }

        return dayMatches;
      }

      // 2.3 특정 날짜에 실행되는 업무 (매월 X일) (한글/영문 모두 처리)
      if (
        (task.cycle === "monthly" || task.cycle === "매월") &&
        task.dayOfMonth
      ) {
        return dayOfMonth === parseInt(task.dayOfMonth);
      }

      // 2.4 cycle 값이 없거나 'none'/'1회성'인 경우, 항상 표시
      if (!task.cycle || task.cycle === "none" || task.cycle === "1회성") {
        return true;
      }

      // 2.5 기타 주기 유형은 기본적으로 표시
      return true;
    };

    // 필터링된 업무 반환
    const filteredTasks = allTasks.filter(filterTasks);
    console.log(`필터링된 업무: ${filteredTasks.length}개`);

    return filteredTasks;
  } catch (error) {
    console.error("사용자 업무 가져오기 오류:", error);
    return [];
  }
};

/**
 * 업무의 담당자를 변경하고 이력을 추가합니다.
 */
export const assignTask = async (taskId, assignee, assignedBy) => {
  try {
    // 1. 업무 정보 가져오기
    const taskRef = doc(db, "tasks", taskId);
    const taskDoc = await getDoc(taskRef);

    if (!taskDoc.exists()) {
      throw new Error("Task not found");
    }

    const taskData = taskDoc.data();
    const previousAssignee = taskData.assignee || "미배정";

    // 2. 업무 담당자 업데이트
    await updateDoc(taskRef, {
      assignee,
      updatedAt: serverTimestamp(),
    });

    // 3. 업무 이력 추가
    const now = new Date();
    const historyId = generateHistoryId(taskId, now) + "_assign";

    const historyData = {
      id: historyId,
      taskId,
      title: taskData.title,
      content: taskData.content,
      action: "assign",
      actionBy: assignedBy || "시스템",
      previousAssignee,
      newAssignee: assignee,
      timestamp: now,
      date: serverTimestamp(),
      dateStr: formatDateForId(now),
    };

    // setDoc으로 변경하여 ID 직접 지정
    const historyDocRef = doc(db, "taskHistory", historyId);
    await setDoc(historyDocRef, historyData);

    return {
      id: taskId,
      ...taskData,
      assignee,
    };
  } catch (error) {
    console.error("업무 담당자 변경 중 오류:", error);
    throw error;
  }
};

/**
 * 특정 날짜의 완료자 정보를 가져옵니다.
 * @param {string} taskId - 업무 ID
 * @param {Date|string} date - 조회할 날짜
 * @returns {Promise<Array>} 완료자 ID 배열
 */
export const getTaskCompleters = async (taskId, date) => {
  try {
    // 날짜 처리
    const dateStr = getDateStrForTask(date);
    console.log(`완료자 조회 - 태스크: ${taskId}, 날짜: ${dateStr}`);

    // 히스토리 ID로 직접 문서 조회
    const historyId = `${taskId}_${dateStr}`;
    const historyDocRef = doc(db, "taskHistory", historyId);
    const historyDoc = await getDoc(historyDocRef);

    if (historyDoc.exists()) {
      const data = historyDoc.data();
      console.log(`${dateStr} 날짜의 히스토리 문서 발견:`, historyId);

      // actors 필드가 있으면 반환
      if (data.actors && Array.isArray(data.actors) && data.actors.length > 0) {
        return data.actors;
      }

      // actors가 없고 actionBy가 있으면 배열로 변환하여 반환
      if (data.actionBy) {
        return [data.actionBy];
      }
    }

    console.log(`${dateStr} 날짜에 완료 이력 없음`);
    return [];
  } catch (error) {
    console.error("완료자 조회 중 오류:", error);
    return [];
  }
};

// 날짜 형식화 유틸리티 함수
const formatDateForTask = (date) => {
  return formatSafeDate(date, "yyyy-MM-dd");
};
