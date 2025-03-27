import React, { useState, useEffect } from "react";
import styled from "styled-components";
import StatusTracker from "../common/StatusTracker";
import { db } from "../../firebase";
import {
  collection,
  query,
  orderBy,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { useUserLevel } from "../../utils/UserLevelContext";
import RequestModal from "../Home/RequestModal";
import VacationModal from "../call/VacationModal";
import StockRequestModal from "../Warehouse/StockRequestModal";
import { format } from "date-fns";
import ChipText from "../common/ChipText";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 20px;
  background-color: var(--once-background);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: bold;
  color: #333;
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
`;

const Tab = styled.button`
  padding: 12px 24px;
  font-size: 16px;
  font-weight: ${(props) => (props.active ? "bold" : "normal")};
  background-color: ${(props) => (props.active ? "var(--once-blue)" : "white")};
  color: ${(props) => (props.active ? "white" : "#333")};
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;

  &:hover {
    background-color: ${(props) =>
      props.active ? "var(--once-blue)" : "#f0f5ff"};
  }
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 16px 20px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.1);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
`;

const CardDate = styled.span`
  font-size: 14px;
  color: #718096;
`;

const CardContent = styled.div`
  margin-bottom: 12px;
  color: #4a5568;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  color: #718096;
  font-size: 14px;
`;

const ListContainer = styled.div`
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 20px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  background-color: white;
  border-radius: 12px;
  color: #718096;
`;

const RequestsOverview = ({ initialTab = "vacation" }) => {
  const { userLevelData } = useUserLevel();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [vacationRequests, setVacationRequests] = useState([]);
  const [stockRequests, setStockRequests] = useState([]);
  const [generalRequests, setGeneralRequests] = useState([]);

  // 모달 상태
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [showStockRequestModal, setShowStockRequestModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // 선택된 항목
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (!userLevelData?.id) return;

    // 휴가 신청 데이터 가져오기
    const vacationQuery = query(
      collection(db, "vacations"),
      where("userId", "==", userLevelData.id),
      orderBy("createdAt", "desc")
    );

    const unsubscribeVacation = onSnapshot(vacationQuery, (snapshot) => {
      const vacations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt?.toDate?.() || new Date(),
      }));
      setVacationRequests(vacations);
    });

    // 비품 신청 데이터 가져오기
    const stockQuery = query(
      collection(db, "stockRequests"),
      where("requestedBy", "==", userLevelData.id),
      orderBy("createdAt2", "desc")
    );

    const unsubscribeStock = onSnapshot(stockQuery, (snapshot) => {
      const stocks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt || new Date().getTime(),
      }));
      setStockRequests(stocks);
    });

    // 일반 요청 데이터 가져오기
    const requestQuery = query(
      collection(db, "requests"),
      where("senderPeople", "array-contains", userLevelData.id),
      orderBy("createdAt2", "desc")
    );

    const unsubscribeRequest = onSnapshot(requestQuery, (snapshot) => {
      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt || new Date().getTime(),
      }));
      setGeneralRequests(requests);
    });

    return () => {
      unsubscribeVacation();
      unsubscribeStock();
      unsubscribeRequest();
    };
  }, [userLevelData?.id]);

  // 컴포넌트 마운트 시 초기 탭 설정
  useEffect(() => {
    if (initialTab && ["vacation", "stock", "request"].includes(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleNewRequest = (type) => {
    switch (type) {
      case "vacation":
        setShowVacationModal(true);
        break;
      case "stock":
        setShowStockRequestModal(true);
        break;
      case "request":
        setShowRequestModal(true);
        break;
      default:
        break;
    }
  };

  const getVacationTitle = (item) => {
    if (item.vacationType === "휴가") {
      return `${item.vacationType} (${item.days}일)`;
    } else if (item.vacationType === "반차") {
      return `${item.vacationType} (${item.halfDayType || ""})`;
    } else {
      return item.vacationType;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";

    const date =
      timestamp instanceof Date
        ? timestamp
        : new Date(
            typeof timestamp === "number" ? timestamp : timestamp.seconds * 1000
          );

    return format(date, "yyyy/MM/dd HH:mm");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "vacation":
        return (
          <>
            <StatusTracker
              type="vacation"
              currentStatus={vacationRequests[0]?.status || "대기중"}
              history={vacationRequests}
              onNewRequest={() => handleNewRequest("vacation")}
              buttonText="휴가 신청하기"
            />
            <ListContainer>
              {vacationRequests.length > 0 ? (
                vacationRequests.map((item) => (
                  <Card key={item.id} onClick={() => setSelectedItem(item)}>
                    <CardHeader>
                      <CardTitle>{getVacationTitle(item)}</CardTitle>
                      <ChipText text={item.status || "대기중"} />
                    </CardHeader>
                    <CardContent>
                      {item.startDate} {item.startTime} ~ {item.endDate}{" "}
                      {item.endTime}
                    </CardContent>
                    <CardFooter>
                      <UserInfo>
                        {item.userName || userLevelData?.name}
                      </UserInfo>
                      <CardDate>{formatDate(item.timestamp)}</CardDate>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <EmptyState>
                  <p>휴가 신청 내역이 없습니다.</p>
                  <p>새 휴가를 신청해보세요.</p>
                </EmptyState>
              )}
            </ListContainer>
          </>
        );

      case "stock":
        return (
          <>
            <StatusTracker
              type="stock"
              currentStatus={stockRequests[0]?.status || "대기중"}
              history={stockRequests}
              onNewRequest={() => handleNewRequest("stock")}
              buttonText="비품 신청하기"
            />
            <ListContainer>
              {stockRequests.length > 0 ? (
                stockRequests.map((item) => (
                  <Card key={item.id} onClick={() => setSelectedItem(item)}>
                    <CardHeader>
                      <CardTitle>{item.itemName}</CardTitle>
                      <ChipText text={item.status || "대기중"} />
                    </CardHeader>
                    <CardContent>
                      {item.category} / 수량: {item.quantity} {item.measure}
                      {item.price > 0 &&
                        ` / 단가: ${item.price.toLocaleString()}원`}
                    </CardContent>
                    <CardFooter>
                      <UserInfo>
                        {item.requestedByName || userLevelData?.name}
                      </UserInfo>
                      <CardDate>{formatDate(item.timestamp)}</CardDate>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <EmptyState>
                  <p>비품 신청 내역이 없습니다.</p>
                  <p>새 비품을 신청해보세요.</p>
                </EmptyState>
              )}
            </ListContainer>
          </>
        );

      case "request":
        return (
          <>
            <StatusTracker
              type="request"
              currentStatus={generalRequests[0]?.status || "대기중"}
              history={generalRequests}
              onNewRequest={() => handleNewRequest("request")}
              buttonText="새 요청하기"
            />
            <ListContainer>
              {generalRequests.length > 0 ? (
                generalRequests.map((item) => (
                  <Card key={item.id} onClick={() => setSelectedItem(item)}>
                    <CardHeader>
                      <CardTitle>{item.title || "요청"}</CardTitle>
                      <ChipText text={item.status || "대기중"} />
                    </CardHeader>
                    <CardContent>
                      {item.message && item.message.length > 100
                        ? `${item.message.substring(0, 100)}...`
                        : item.message}
                    </CardContent>
                    <CardFooter>
                      <UserInfo>
                        {userLevelData?.name} → {item.receiverPeople.length}명
                      </UserInfo>
                      <CardDate>{formatDate(item.timestamp)}</CardDate>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <EmptyState>
                  <p>요청 내역이 없습니다.</p>
                  <p>새 요청을 생성해보세요.</p>
                </EmptyState>
              )}
            </ListContainer>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Container>
      <Header>
        <Title>신청 현황</Title>
      </Header>

      <TabsContainer>
        <Tab
          active={activeTab === "vacation"}
          onClick={() => handleTabChange("vacation")}
        >
          휴가 신청
        </Tab>
        <Tab
          active={activeTab === "stock"}
          onClick={() => handleTabChange("stock")}
        >
          비품 신청
        </Tab>
        <Tab
          active={activeTab === "request"}
          onClick={() => handleTabChange("request")}
        >
          요청 관리
        </Tab>
      </TabsContainer>

      <ContentArea>{renderContent()}</ContentArea>

      {/* 모달 컴포넌트들 */}
      <VacationModal
        isVisible={showVacationModal}
        setIsVisible={setShowVacationModal}
      />

      <StockRequestModal
        isVisible={showStockRequestModal}
        setIsVisible={setShowStockRequestModal}
      />

      <RequestModal
        isVisible={showRequestModal}
        setIsVisible={setShowRequestModal}
      />
    </Container>
  );
};

export default RequestsOverview;
