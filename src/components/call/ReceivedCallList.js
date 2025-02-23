import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { db } from "../../firebase.js";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useUserLevel } from "../../utils/UserLevelContext";
import RenderCallItem from "./RenderCallItem";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
`;

const NoCallMessage = styled.div`
  text-align: center;
  color: #666;
  padding: 20px;
`;

const getTimeInMillis = (timestamp) => {
  if (!timestamp) return 0;

  return typeof timestamp === "number"
    ? timestamp
    : timestamp.toMillis
    ? timestamp.toMillis()
    : timestamp.getTime
    ? timestamp.getTime()
    : timestamp.seconds
    ? timestamp.seconds * 1000
    : 0;
};

export default function ReceivedCallList() {
  const [calls, setCalls] = useState([]);
  const { userLevelData } = useUserLevel();

  useEffect(() => {
    if (!userLevelData?.location) return;

    const callsRef = collection(db, "calls");
    const q = query(
      callsRef,
      where("receiverId", "==", userLevelData.location)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const callsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const sortedCalls = callsData.sort(
        (a, b) => getTimeInMillis(b.createdAt) - getTimeInMillis(a.createdAt)
      );
      setCalls(sortedCalls);
    });

    return () => unsubscribe();
  }, [userLevelData?.location]);

  return (
    <Container>
      {calls.length > 0 ? (
        calls.map((call) => <RenderCallItem key={call.id} call={call} />)
      ) : (
        <NoCallMessage>수신된 호출이 없습니다.</NoCallMessage>
      )}
    </Container>
  );
}
