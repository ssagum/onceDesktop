import React from "react";
import styled from "styled-components";
import ChipText from "./ChipText";
import { chevronForward } from "../../assets";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.05);
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
`;

const StatusFlow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
`;

const StatusItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 10px;
`;

const ArrowContainer = styled.div`
  margin: 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatusDate = styled.div`
  font-size: 14px;
  color: #666;
  margin-top: 8px;
`;

const StatusText = styled.div`
  font-size: 15px;
  font-weight: ${(props) => (props.active ? "bold" : "normal")};
  color: ${(props) => (props.active ? "var(--once-blue)" : "#666")};
  margin-top: 10px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

const ActionButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  background-color: var(--once-blue);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  outline: none;

  &:hover {
    background-color: #3182ce;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const StatusTracker = ({
  type,
  currentStatus,
  history,
  onNewRequest,
  canCreateNew = true,
  buttonText = "새 신청하기",
  disableButton = false,
  isAdmin = false,
}) => {
  // 신청 유형별 상태 흐름 정의
  const statusFlows = {
    vacation: [
      { status: "대기중", label: "신청" },
      { status: "승인", label: "승인" },
      { status: "거부됨", label: "거부" },
      { status: "취소됨", label: "취소" },
    ],
    stock: [
      { status: "대기중", label: "신청" },
      { status: "승인", label: "승인" },
      { status: "주문 필요", label: "주문 필요" },
      { status: "주문 완료", label: "주문 완료" },
      { status: "입고 완료", label: "입고 완료" },
    ],
    request: [
      { status: "대기중", label: "요청" },
      { status: "처리중", label: "처리중" },
      { status: "완료됨", label: "완료" },
      { status: "거부됨", label: "거부" },
    ],
  };

  // 신청 유형에 따른 타이틀 설정
  const titles = {
    vacation: "휴가 신청 현황",
    stock: "비품 신청 현황",
    request: "요청 현황",
  };

  // 현재 신청 유형의 상태 흐름 가져오기
  const flow = statusFlows[type] || [];
  const title = titles[type] || "신청 현황";

  // 가장 최근 이력 가져오기
  const latestItem = history && history.length > 0 ? history[0] : null;

  // 관리자 버튼 텍스트 설정
  const adminButtonText = {
    vacation: "휴가 승인/거부",
    stock: "비품 신청 처리",
    request: "요청 처리",
  };

  return (
    <Container>
      <Title>{title}</Title>

      {/* 상태 흐름 표시 */}
      <StatusFlow>
        {flow.map((item, index) => {
          const isCurrentStatus = item.status === currentStatus;

          return (
            <React.Fragment key={item.status}>
              {index > 0 && (
                <ArrowContainer>
                  <img
                    src={chevronForward}
                    alt="arrow"
                    style={{ width: "24px", height: "24px" }}
                  />
                </ArrowContainer>
              )}

              <StatusItem>
                <ChipText text={item.label} />
                <StatusText active={isCurrentStatus}>{item.label}</StatusText>

                {/* 현재 상태인 경우, 날짜 정보 표시 */}
                {isCurrentStatus && latestItem && (
                  <StatusDate>
                    {new Date(latestItem.timestamp).toLocaleDateString()}
                    {new Date(latestItem.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </StatusDate>
                )}
              </StatusItem>
            </React.Fragment>
          );
        })}
      </StatusFlow>

      {/* 버튼 영역 */}
      <ButtonContainer>
        {isAdmin ? (
          <ActionButton onClick={onNewRequest} disabled={disableButton}>
            {adminButtonText[type] || "처리하기"}
          </ActionButton>
        ) : (
          canCreateNew && (
            <ActionButton onClick={onNewRequest} disabled={disableButton}>
              {buttonText}
            </ActionButton>
          )
        )}
      </ButtonContainer>
    </Container>
  );
};

export default StatusTracker;
