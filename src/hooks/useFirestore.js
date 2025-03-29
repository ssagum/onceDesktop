import { filterHiddenDocuments } from "../utils/filterUtils";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useCallback } from "react";

export const useFirestore = () => {
  const fetchCollection = useCallback(async (collectionName) => {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const documents = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return filterHiddenDocuments(documents);
  }, []);

  const autoHideOldDocuments = useCallback(async (collectionName) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // 컬렉션에 따라 다른 쿼리 조건 사용
    let q;
    if (collectionName === "stockRequests") {
      // 비품은 주문완료 또는 반려됨 상태인 경우
      q = query(
        collection(db, collectionName),
        where("isHidden", "!=", true),
        where("status", "in", ["주문완료", "반려됨"])
      );
    } else {
      // 다른 컬렉션은 승인됨 또는 반려됨 상태인 경우
      q = query(
        collection(db, collectionName),
        where("isHidden", "!=", true),
        where("status", "in", ["승인됨", "반려됨"])
      );
    }

    const querySnapshot = await getDocs(q);

    // 각 문서를 확인하고 일주일이 지났으면 숨김 처리
    const batch = [];
    querySnapshot.forEach((document) => {
      const data = document.data();

      // updatedAt 또는 timestamp를 기준으로 시간 확인
      let updateTime;
      if (data.updatedAt) {
        updateTime = data.updatedAt.toDate();
      } else if (data.timestamp) {
        updateTime =
          typeof data.timestamp === "number"
            ? new Date(data.timestamp)
            : data.timestamp.toDate();
      } else {
        return; // 날짜 정보가 없으면 처리하지 않음
      }

      // 일주일이 지났는지 확인
      if (updateTime < oneWeekAgo) {
        const docRef = doc(db, collectionName, document.id);
        batch.push(
          updateDoc(docRef, {
            isHidden: true,
            hiddenAt: serverTimestamp(),
          })
        );
      }
    });

    // 모든 업데이트 실행
    await Promise.all(batch);
    return batch.length; // 처리된 문서 수 반환
  }, []);

  const deleteDocument = useCallback(async (collectionName, documentId) => {
    const docRef = doc(db, collectionName, documentId);
    await updateDoc(docRef, {
      isHidden: true,
      hiddenAt: serverTimestamp(),
    });
  }, []);

  return { fetchCollection, deleteDocument, autoHideOldDocuments };
};
