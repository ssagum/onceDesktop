import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { db } from "../../firebase";
import {
  collection,
  query,
  orderBy,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useUserLevel } from "../../utils/UserLevelContext";
import ChipText from "../common/ChipText";
import { format } from "date-fns";
import { useToast } from "../../contexts/ToastContext";
import {
  isHospitalOwner,
  isAdministrativeManager,
  canApproveVacation,
  canOrderStock,
  canApproveStockRequest,
  canManageRequest,
  canViewStockRequests,
  canViewDepartmentVacations,
} from "../../utils/permissionUtils";

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

const RequestGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 16px 20px;
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
  margin-top: auto;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  color: #718096;
  font-size: 14px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background-color: ${(props) =>
    props.variant === "approve"
      ? "var(--once-blue)"
      : props.variant === "reject"
      ? "#f56565"
      : props.variant === "order"
      ? "#ed8936"
      : props.variant === "complete"
      ? "#38a169"
      : "#e2e8f0"};
  color: white;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    background-color: #cbd5e0;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
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

const DetailsModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 16px;
`;

const ModalTitle = styled.h2`
  font-size: 22px;
  font-weight: bold;
  color: #2d3748;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #718096;
  transition: color 0.2s;

  &:hover {
    color: #2d3748;
  }
`;

const ModalRow = styled.div`
  margin-bottom: 16px;
`;

const ModalLabel = styled.div`
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 6px;
`;

const ModalValue = styled.div`
  color: #2d3748;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
`;

const FilterLabel = styled.span`
  font-weight: 600;
  color: #4a5568;
`;

const FilterButton = styled.button`
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background-color: ${(props) => (props.active ? "var(--once-blue)" : "white")};
  color: ${(props) => (props.active ? "white" : "#4a5568")};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${(props) =>
      props.active ? "var(--once-blue)" : "#f7fafc"};
  }
`;

const AdminRequestsManager = () => {
  const { userLevelData } = useUserLevel();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("vacation");
  const [vacationRequests, setVacationRequests] = useState([]);
  const [stockRequests, setStockRequests] = useState([]);
  const [generalRequests, setGeneralRequests] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [userPermissions, setUserPermissions] = useState({
    canApproveVacation: false,
    canApproveStock: false,
    canOrderStock: false,
    canManageRequest: false,
    isOwner: false,
    isAdminManager: false,
  });

  // 권한 설정
  useEffect(() => {
    if (userLevelData) {
      console.log("현재 사용자 역할:", userLevelData.role);
      console.log("현재 사용자 부서:", userLevelData.department);

      const isOwner = isHospitalOwner(userLevelData);
      const isAdminManager = isAdministrativeManager(userLevelData);
      const canManageReq = canManageRequest(userLevelData);

      console.log("대표원장 여부:", isOwner);
      console.log("원무과장 여부:", isAdminManager);
      console.log("요청 관리 권한:", canManageReq);

      setUserPermissions({
        canApproveVacation: canApproveVacation(userLevelData),
        canApproveStock: canApproveStockRequest(userLevelData),
        canOrderStock: canOrderStock(userLevelData),
        canManageRequest: canManageReq,
        isOwner: isOwner,
        isAdminManager: isAdminManager,
      });
    }
  }, [userLevelData]);

  // 사용자 부서 정보 가져오기
  const userDepartment = userLevelData?.department || "";

  useEffect(() => {
    fetchRequests();
  }, [activeTab, statusFilter, userLevelData]);

  const fetchRequests = async () => {
    if (!userLevelData) {
      showToast("사용자 정보를 불러올 수 없습니다.", "error");
      return;
    }

    try {
      switch (activeTab) {
        case "vacation":
          await fetchVacationRequests();
          break;
        case "stock":
          await fetchStockRequests();
          break;
        case "request":
          await fetchGeneralRequests();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("요청 조회 오류:", error);
      showToast("요청 목록을 불러오는 데 실패했습니다.", "error");
    }
  };

  const fetchVacationRequests = async () => {
    let q;

    console.log("휴가 데이터 조회 - 권한 확인");
    console.log("대표원장 여부:", userPermissions.isOwner);

    // 대표원장은 모든 부서의 휴가 신청을 볼 수 있음
    if (userPermissions.isOwner) {
      console.log("대표원장 권한으로 모든 휴가 조회");
      if (statusFilter === "all") {
        q = query(collection(db, "vacations"), orderBy("createdAt", "desc"));
      } else {
        q = query(
          collection(db, "vacations"),
          where("status", "==", statusFilter),
          orderBy("createdAt", "desc")
        );
      }
    } else {
      // 다른 사용자는 자신의 부서에 해당하는 휴가 신청만 볼 수 있음
      console.log("일반 사용자 권한으로 부서 휴가만 조회:", userDepartment);
      if (statusFilter === "all") {
        q = query(
          collection(db, "vacations"),
          where("department", "==", userDepartment),
          orderBy("createdAt", "desc")
        );
      } else {
        q = query(
          collection(db, "vacations"),
          where("department", "==", userDepartment),
          where("status", "==", statusFilter),
          orderBy("createdAt", "desc")
        );
      }
    }

    const querySnapshot = await getDocs(q);
    const requests = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().createdAt?.toDate?.() || new Date(),
    }));

    console.log(`조회된 휴가 개수: ${requests.length}건`);
    setVacationRequests(requests);
  };

  const fetchStockRequests = async () => {
    let q;

    console.log("비품 데이터 조회 - 권한 확인");
    console.log("대표원장 여부:", userPermissions.isOwner);
    console.log("원무과장 여부:", userPermissions.isAdminManager);

    // 대표원장과 원무과장은 모든 부서의 비품 신청을 볼 수 있음
    if (userPermissions.isOwner || userPermissions.isAdminManager) {
      console.log("대표원장/원무과장 권한으로 모든 비품 조회");
      if (statusFilter === "all") {
        q = query(
          collection(db, "stockRequests"),
          orderBy("createdAt2", "desc")
        );
      } else {
        q = query(
          collection(db, "stockRequests"),
          where("status", "==", statusFilter),
          orderBy("createdAt2", "desc")
        );
      }
    } else {
      // 다른 사용자는 자신의 부서에 해당하는 비품 신청만 볼 수 있음
      console.log("일반 사용자 권한으로 부서 비품만 조회:", userDepartment);
      if (statusFilter === "all") {
        q = query(
          collection(db, "stockRequests"),
          where("department", "==", userDepartment),
          orderBy("createdAt2", "desc")
        );
      } else {
        q = query(
          collection(db, "stockRequests"),
          where("department", "==", userDepartment),
          where("status", "==", statusFilter),
          orderBy("createdAt2", "desc")
        );
      }
    }

    const querySnapshot = await getDocs(q);
    const requests = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().createdAt || new Date().getTime(),
    }));

    console.log(`조회된 비품 개수: ${requests.length}건`);
    setStockRequests(requests);
  };

  const fetchGeneralRequests = async () => {
    let q;

    console.log("요청 데이터 조회 - 권한 확인");
    console.log("대표원장 여부:", userPermissions.isOwner);
    console.log("요청 관리 권한:", userPermissions.canManageRequest);

    // 대표원장은 모든 요청을 볼 수 있음
    if (userPermissions.isOwner) {
      console.log("대표원장 권한으로 모든 요청 조회");
      if (statusFilter === "all") {
        q = query(collection(db, "requests"), orderBy("createdAt2", "desc"));
      } else {
        q = query(
          collection(db, "requests"),
          where("status", "==", statusFilter),
          orderBy("createdAt2", "desc")
        );
      }
    }
    // 팀장급 이상은 요청 관리 가능
    else if (userPermissions.canManageRequest) {
      console.log("팀장급 권한으로 요청 조회");
      if (statusFilter === "all") {
        q = query(collection(db, "requests"), orderBy("createdAt2", "desc"));
      } else {
        q = query(
          collection(db, "requests"),
          where("status", "==", statusFilter),
          orderBy("createdAt2", "desc")
        );
      }
    }
    // 일반 사용자는 자신의 부서 요청만 볼 수 있음
    else {
      console.log("일반 사용자 권한으로 부서 요청만 조회:", userDepartment);
      if (statusFilter === "all") {
        q = query(
          collection(db, "requests"),
          where("senderDepartment", "==", userDepartment),
          orderBy("createdAt2", "desc")
        );
      } else {
        q = query(
          collection(db, "requests"),
          where("senderDepartment", "==", userDepartment),
          where("status", "==", statusFilter),
          orderBy("createdAt2", "desc")
        );
      }
    }

    const querySnapshot = await getDocs(q);
    const requests = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().createdAt || new Date().getTime(),
    }));

    console.log(`조회된 요청 개수: ${requests.length}건`);
    setGeneralRequests(requests);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
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

  const handleCardClick = (item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedItem(null);
  };

  const updateRequestStatus = async (id, status) => {
    try {
      // 신청 타입에 따라 적절한 컬렉션 참조
      let collectionName;
      switch (activeTab) {
        case "vacation":
          // 휴가 신청 승인/반려 권한 체크
          if (!userPermissions.canApproveVacation) {
            showToast("휴가 신청을 승인/반려할 권한이 없습니다.", "error");
            return;
          }
          collectionName = "vacations";
          break;
        case "stock":
          // 비품 신청 권한 체크 - 승인/반려는 대표원장만, 주문/입고는 원무과장도 가능
          if (status === "승인됨" || status === "거부됨") {
            if (!userPermissions.canApproveStock) {
              showToast("비품 신청을 승인/반려할 권한이 없습니다.", "error");
              return;
            }
          } else if (
            status === "주문 필요" ||
            status === "주문 완료" ||
            status === "입고 완료"
          ) {
            if (!userPermissions.canOrderStock) {
              showToast("비품 주문 상태를 변경할 권한이 없습니다.", "error");
              return;
            }
          }
          collectionName = "stockRequests";
          break;
        case "request":
          // 요청 승인/반려 권한 체크
          if (!userPermissions.canManageRequest) {
            showToast("요청을 승인/반려할 권한이 없습니다.", "error");
            return;
          }
          collectionName = "requests";
          break;
        default:
          return;
      }

      const requestRef = doc(db, collectionName, id);
      await updateDoc(requestRef, {
        status: status,
        updatedAt: new Date(),
        updatedBy: userLevelData.name,
        updatedByName: userLevelData.name,
      });

      showToast(`상태가 '${status}'(으)로 변경되었습니다.`, "success");

      // 목록 갱신
      fetchRequests();

      // 선택된 아이템도 업데이트
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem({
          ...selectedItem,
          status: status,
          updatedAt: new Date(),
          updatedBy: userLevelData.name,
          updatedByName: userLevelData.name,
        });
      }
    } catch (error) {
      console.error("상태 업데이트 오류:", error);
      showToast("상태 변경에 실패했습니다.", "error");
    }
  };

  const renderStatusActions = (item) => {
    switch (activeTab) {
      case "vacation":
        return renderVacationActions(item);
      case "stock":
        return renderStockActions(item);
      case "request":
        return renderRequestActions(item);
      default:
        return null;
    }
  };

  const renderVacationActions = (item) => {
    // 대표원장만 휴가 승인/반려 가능
    if (item.status === "대기중" && userPermissions.canApproveVacation) {
      return (
        <ButtonGroup>
          <ActionButton
            variant="approve"
            onClick={() => updateRequestStatus(item.id, "승인됨")}
          >
            승인
          </ActionButton>
          <ActionButton
            variant="reject"
            onClick={() => updateRequestStatus(item.id, "거부됨")}
          >
            거부
          </ActionButton>
        </ButtonGroup>
      );
    }
    return null;
  };

  const renderStockActions = (item) => {
    // 대표원장만 비품 승인/반려 가능
    if (item.status === "대기중" && userPermissions.canApproveStock) {
      return (
        <ButtonGroup>
          <ActionButton
            variant="approve"
            onClick={() => updateRequestStatus(item.id, "승인됨")}
          >
            승인
          </ActionButton>
          <ActionButton
            variant="reject"
            onClick={() => updateRequestStatus(item.id, "거부됨")}
          >
            거부
          </ActionButton>
        </ButtonGroup>
      );
    }

    // 주문 관련 권한은 대표원장 또는 원무과장
    if (userPermissions.canOrderStock) {
      switch (item.status) {
        case "승인됨":
          return (
            <ButtonGroup>
              <ActionButton
                variant="order"
                onClick={() => updateRequestStatus(item.id, "주문 필요")}
              >
                주문 필요
              </ActionButton>
            </ButtonGroup>
          );
        case "주문 필요":
          return (
            <ButtonGroup>
              <ActionButton
                variant="order"
                onClick={() => updateRequestStatus(item.id, "주문 완료")}
              >
                주문 완료
              </ActionButton>
            </ButtonGroup>
          );
        case "주문 완료":
          return (
            <ButtonGroup>
              <ActionButton
                variant="complete"
                onClick={() => updateRequestStatus(item.id, "입고 완료")}
              >
                입고 완료
              </ActionButton>
            </ButtonGroup>
          );
        default:
          return null;
      }
    }

    return null;
  };

  const renderRequestActions = (item) => {
    // 팀장급 이상만 요청 승인/반려 가능
    if (userPermissions.canManageRequest) {
      switch (item.status) {
        case "대기중":
          return (
            <ButtonGroup>
              <ActionButton
                variant="approve"
                onClick={() => updateRequestStatus(item.id, "처리중")}
              >
                접수
              </ActionButton>
              <ActionButton
                variant="reject"
                onClick={() => updateRequestStatus(item.id, "거부됨")}
              >
                거부
              </ActionButton>
            </ButtonGroup>
          );
        case "처리중":
          return (
            <ButtonGroup>
              <ActionButton
                variant="complete"
                onClick={() => updateRequestStatus(item.id, "완료됨")}
              >
                완료
              </ActionButton>
            </ButtonGroup>
          );
        default:
          return null;
      }
    }

    return null;
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

  const renderContent = () => {
    let requests = [];
    let renderItem;

    switch (activeTab) {
      case "vacation":
        requests = vacationRequests;
        renderItem = (item) => (
          <Card key={item.id} onClick={() => handleCardClick(item)}>
            <CardHeader>
              <CardTitle>{getVacationTitle(item)}</CardTitle>
              <ChipText text={item.status || "대기중"} />
            </CardHeader>
            <CardContent>
              {item.startDate} {item.startTime} ~ {item.endDate} {item.endTime}
            </CardContent>
            <CardFooter>
              <UserInfo>{item.userName}</UserInfo>
              <CardDate>{formatDate(item.timestamp)}</CardDate>
            </CardFooter>
            {renderStatusActions(item)}
          </Card>
        );
        break;

      case "stock":
        requests = stockRequests;
        renderItem = (item) => (
          <Card key={item.id} onClick={() => handleCardClick(item)}>
            <CardHeader>
              <CardTitle>{item.itemName}</CardTitle>
              <ChipText text={item.status || "대기중"} />
            </CardHeader>
            <CardContent>
              {item.category} / 수량: {item.quantity} {item.measure}
              {item.price > 0 && ` / 단가: ${item.price.toLocaleString()}원`}
            </CardContent>
            <CardFooter>
              <UserInfo>{item.requestedByName}</UserInfo>
              <CardDate>{formatDate(item.timestamp)}</CardDate>
            </CardFooter>
            {renderStatusActions(item)}
          </Card>
        );
        break;

      case "request":
        requests = generalRequests;
        renderItem = (item) => (
          <Card key={item.id} onClick={() => handleCardClick(item)}>
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
                {item.senderPeople?.length > 0
                  ? `${item.senderPeople.length}명의 발신자`
                  : ""}
              </UserInfo>
              <CardDate>{formatDate(item.timestamp)}</CardDate>
            </CardFooter>
            {renderStatusActions(item)}
          </Card>
        );
        break;

      default:
        return null;
    }

    return (
      <>
        <FilterContainer>
          <FilterLabel>상태:</FilterLabel>
          <FilterButton
            active={statusFilter === "대기중"}
            onClick={() => setStatusFilter("대기중")}
          >
            대기중
          </FilterButton>
          <FilterButton
            active={statusFilter === "승인됨"}
            onClick={() => setStatusFilter("승인됨")}
          >
            승인됨
          </FilterButton>
          <FilterButton
            active={statusFilter === "처리중"}
            onClick={() => setStatusFilter("처리중")}
          >
            처리중
          </FilterButton>
          <FilterButton
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          >
            전체
          </FilterButton>
        </FilterContainer>

        {requests.length > 0 ? (
          <RequestGrid>{requests.map((item) => renderItem(item))}</RequestGrid>
        ) : (
          <EmptyState>
            <p>해당하는 신청 내역이 없습니다.</p>
          </EmptyState>
        )}
      </>
    );
  };

  const renderDetailsModal = () => {
    if (!selectedItem) return null;

    let content;

    switch (activeTab) {
      case "vacation":
        content = (
          <>
            <ModalRow>
              <ModalLabel>신청자</ModalLabel>
              <ModalValue>{selectedItem.userName}</ModalValue>
            </ModalRow>
            <ModalRow>
              <ModalLabel>유형</ModalLabel>
              <ModalValue>{getVacationTitle(selectedItem)}</ModalValue>
            </ModalRow>
            <ModalRow>
              <ModalLabel>기간</ModalLabel>
              <ModalValue>
                {selectedItem.startDate} {selectedItem.startTime} ~{" "}
                {selectedItem.endDate} {selectedItem.endTime}
              </ModalValue>
            </ModalRow>
            <ModalRow>
              <ModalLabel>사유</ModalLabel>
              <ModalValue>{selectedItem.reason}</ModalValue>
            </ModalRow>
            <ModalRow>
              <ModalLabel>상태</ModalLabel>
              <ModalValue>
                <ChipText text={selectedItem.status || "대기중"} />
              </ModalValue>
            </ModalRow>
            <ModalRow>
              <ModalLabel>신청일</ModalLabel>
              <ModalValue>{formatDate(selectedItem.timestamp)}</ModalValue>
            </ModalRow>
            {renderStatusActions(selectedItem)}
          </>
        );
        break;

      case "stock":
        content = (
          <>
            <ModalRow>
              <ModalLabel>품명</ModalLabel>
              <ModalValue>{selectedItem.itemName}</ModalValue>
            </ModalRow>
            <ModalRow>
              <ModalLabel>분류</ModalLabel>
              <ModalValue>{selectedItem.category}</ModalValue>
            </ModalRow>
            <ModalRow>
              <ModalLabel>수량</ModalLabel>
              <ModalValue>
                {selectedItem.quantity} {selectedItem.measure}
              </ModalValue>
            </ModalRow>
            {selectedItem.price > 0 && (
              <ModalRow>
                <ModalLabel>단가</ModalLabel>
                <ModalValue>
                  {selectedItem.price.toLocaleString()}원{" "}
                  {selectedItem.vat ? "(VAT 포함)" : ""}
                </ModalValue>
              </ModalRow>
            )}
            <ModalRow>
              <ModalLabel>거래처</ModalLabel>
              <ModalValue>{selectedItem.vendor || "없음"}</ModalValue>
            </ModalRow>
            <ModalRow>
              <ModalLabel>부서</ModalLabel>
              <ModalValue>{selectedItem.department}</ModalValue>
            </ModalRow>
            <ModalRow>
              <ModalLabel>신청사유</ModalLabel>
              <ModalValue>{selectedItem.requestReason || "없음"}</ModalValue>
            </ModalRow>
            <ModalRow>
              <ModalLabel>신청자</ModalLabel>
              <ModalValue>{selectedItem.requestedByName}</ModalValue>
            </ModalRow>
            <ModalRow>
              <ModalLabel>상태</ModalLabel>
              <ModalValue>
                <ChipText text={selectedItem.status || "대기중"} />
              </ModalValue>
            </ModalRow>
            <ModalRow>
              <ModalLabel>신청일</ModalLabel>
              <ModalValue>{formatDate(selectedItem.timestamp)}</ModalValue>
            </ModalRow>
            {renderStatusActions(selectedItem)}
          </>
        );
        break;

      case "request":
        content = (
          <>
            <ModalRow>
              <ModalLabel>제목</ModalLabel>
              <ModalValue>{selectedItem.title || "요청"}</ModalValue>
            </ModalRow>
            <ModalRow>
              <ModalLabel>내용</ModalLabel>
              <ModalValue>{selectedItem.message}</ModalValue>
            </ModalRow>
            <ModalRow>
              <ModalLabel>발신자</ModalLabel>
              <ModalValue>
                {selectedItem.senderPeople?.length > 0
                  ? `${selectedItem.senderPeople.length}명의 발신자`
                  : "없음"}
              </ModalValue>
            </ModalRow>
            <ModalRow>
              <ModalLabel>수신자</ModalLabel>
              <ModalValue>
                {selectedItem.receiverPeople?.length > 0
                  ? `${selectedItem.receiverPeople.length}명의 수신자`
                  : "없음"}
              </ModalValue>
            </ModalRow>
            <ModalRow>
              <ModalLabel>중요도</ModalLabel>
              <ModalValue>{selectedItem.priority || "중"}</ModalValue>
            </ModalRow>
            <ModalRow>
              <ModalLabel>상태</ModalLabel>
              <ModalValue>
                <ChipText text={selectedItem.status || "대기중"} />
              </ModalValue>
            </ModalRow>
            <ModalRow>
              <ModalLabel>요청일</ModalLabel>
              <ModalValue>{formatDate(selectedItem.timestamp)}</ModalValue>
            </ModalRow>
            {renderStatusActions(selectedItem)}
          </>
        );
        break;

      default:
        content = <div>상세 정보가 없습니다.</div>;
    }

    return (
      <DetailsModal onClick={closeDetailsModal}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>상세 정보</ModalTitle>
            <CloseButton onClick={closeDetailsModal}>&times;</CloseButton>
          </ModalHeader>
          {content}
        </ModalContent>
      </DetailsModal>
    );
  };

  // 권한에 따른 각 탭 렌더링 여부 확인
  const shouldShowTab = (tabName) => {
    switch (tabName) {
      case "vacation":
        // 대표원장은 모든 휴가 신청을 볼 수 있고, 다른 사용자는 자신의 부서 휴가만 볼 수 있음
        return true;
      case "stock":
        // 대표원장과 원무과장은 모든 비품 신청을 볼 수 있고, 다른 사용자는 자신의 부서 비품만 볼 수 있음
        return true;
      case "request":
        // 팀장급 이상은 모든 요청을 관리할 수 있고, 일반 사용자는 자신의 부서 요청만 볼 수 있음
        return true;
      default:
        return false;
    }
  };

  return (
    <Container>
      <Header>
        <Title>신청 관리</Title>
      </Header>

      <TabsContainer>
        {shouldShowTab("vacation") && (
          <Tab
            active={activeTab === "vacation"}
            onClick={() => handleTabChange("vacation")}
          >
            휴가 신청
          </Tab>
        )}
        {shouldShowTab("stock") && (
          <Tab
            active={activeTab === "stock"}
            onClick={() => handleTabChange("stock")}
          >
            비품 신청
          </Tab>
        )}
        {shouldShowTab("request") && (
          <Tab
            active={activeTab === "request"}
            onClick={() => handleTabChange("request")}
          >
            요청 관리
          </Tab>
        )}
      </TabsContainer>

      <ContentArea>{renderContent()}</ContentArea>

      {showDetailsModal && renderDetailsModal()}
    </Container>
  );
};

export default AdminRequestsManager;
