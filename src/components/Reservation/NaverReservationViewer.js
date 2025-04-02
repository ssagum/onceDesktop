import React, { useState, useRef, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import {
  IoCloseOutline,
  IoDownloadOutline,
  IoOpenOutline,
  IoCheckmarkCircleOutline,
  IoRefreshOutline,
} from "react-icons/io5";
import OnceOnOffButton from "../common/OnceOnOffButton";
import { format } from "date-fns";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useToast } from "../../contexts/ToastContext";

// 키프레임 애니메이션 정의
const SpinAnimation = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
`;

const SpinningIcon = styled(IoRefreshOutline)`
  animation: ${SpinAnimation} 1s linear infinite;
`;

// 모달 스타일 컴포넌트
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContainer = styled.div`
  background-color: white;
  border-radius: 16px;
  width: 90vw;
  height: 95vh;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: ${slideUp} 0.3s ease-out;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
`;

const ModalTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: #2d3748;

  &::before {
    content: "";
    display: inline-block;
    width: 4px;
    height: 22px;
    background-color: #4299e1;
    border-radius: 2px;
    margin-right: 12px;
    vertical-align: middle;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #4a5568;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    background-color: #f7fafc;
    color: #e53e3e;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const WebViewContainer = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
  background-color: #f8fafc;
`;

const ControlPanel = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8fafc;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const ActionButton = styled.button`
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &.primary {
    background-color: #4299e1;
    color: white;
    border: none;

    &:hover {
      background-color: #3182ce;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &.secondary {
    background-color: white;
    color: #4a5568;
    border: 1px solid #e2e8f0;

    &:hover {
      background-color: #f7fafc;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &.success {
    background-color: #48bb78;
    color: white;
    border: none;

    &:hover {
      background-color: #38a169;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &.danger {
    background-color: #f56565;
    color: white;
    border: none;

    &:hover {
      background-color: #e53e3e;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    &:active {
      transform: translateY(0);
    }
  }
`;

const ReservationStatus = styled.div`
  font-size: 14px;
  color: #4a5568;
  font-weight: 500;
  display: flex;
  align-items: center;

  &::before {
    content: "💡";
    margin-right: 8px;
    font-size: 16px;
  }
`;

const ExtractedDataContainer = styled.div`
  position: absolute;
  bottom: 80px;
  right: 24px;
  width: 380px;
  max-height: 550px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  padding: 20px;
  z-index: 100;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  animation: fadeInRight 0.3s ease-out;

  @keyframes fadeInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
  }
`;

// 담당자 드롭다운 스타일 추가
const StaffDropdown = styled.select`
  width: 100%;
  padding: 10px 12px;
  background-color: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #2d3748;
  font-weight: 500;
  appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232d3748' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  transition: all 0.2s;

  &:hover {
    border-color: #cbd5e0;
    background-color: #edf2f7;
  }

  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
  }
`;

const StaffOption = styled.option`
  padding: 12px;
  font-size: 14px;
`;

const DataItem = styled.div`
  margin-bottom: 16px;
  transition: all 0.2s;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DataLabel = styled.div`
  font-size: 14px;
  color: #4a5568;
  margin-bottom: 6px;
  font-weight: 600;
`;

const DataValue = styled.div`
  font-size: 15px;
  color: #2d3748;
  font-weight: 500;
  padding: 10px 12px;
  background-color: #f7fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;

  &:hover {
    background-color: #edf2f7;
  }
`;

// 예약 목록 컨테이너
const ReservationList = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  width: 520px;
  max-height: 500px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  padding: 20px;
  z-index: 100;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
  }
`;

// 예약 목록 스크롤 영역
const ReservationListScroll = styled.div`
  max-height: calc(100vh - 250px);
  overflow-y: auto;
  margin-top: 16px;
  padding-right: 6px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
  }
`;

// 예약 항목
const ReservationItem = styled.div`
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &:hover {
    background-color: ${(props) => (props.isCancelled ? "#f1f5f9" : "#f0f9ff")};
    border-color: ${(props) => (props.isCancelled ? "#cbd5e0" : "#93c5fd")};
    transform: ${(props) => (props.isCancelled ? "none" : "translateY(-2px)")};
    box-shadow: ${(props) =>
      props.isCancelled
        ? "0 1px 3px rgba(0, 0, 0, 0.05)"
        : "0 4px 6px rgba(0, 0, 0, 0.05)"};
  }

  &:active {
    transform: translateY(0);
  }

  &.selected {
    background-color: #dbeafe;
    border-color: #60a5fa;
    box-shadow: 0 0 0 2px #3b82f6;
  }

  &.cancelled {
    opacity: 0.7;
    background-color: #f8fafc;
    cursor: default;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const ReservationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const ReservationName = styled.div`
  font-weight: 700;
  font-size: 16px;
  color: #2d3748;
`;

const ReservationDate = styled.div`
  font-size: 14px;
  color: #4a5568;
  font-weight: 500;
`;

const ReservationDetail = styled.div`
  font-size: 14px;
  color: #4a5568;
  margin-bottom: 8px;
  display: flex;
`;

const DetailLabel = styled.span`
  min-width: 70px;
  color: #64748b;
  font-weight: 600;
`;

const DetailValue = styled.span`
  flex: 1;
  color: #1a202c;
`;

const StatusTag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-right: 8px;
  background-color: #3b82f6;
  color: white;
  letter-spacing: 0.3px;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

  &::before {
    content: "";
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: white;
    margin-right: 6px;
  }
`;

// 비교 결과 패널
const ComparisonPanel = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.98);
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;
  z-index: 200;
`;

const StatusHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
`;

const StatusCount = styled.div`
  display: flex;
  gap: 12px;
`;

const StatusBadge = styled.span`
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 16px;
  background-color: ${(props) =>
    props.type === "NEW"
      ? "#fee2e2"
      : props.type === "CHANGED"
      ? "#fef3c7"
      : props.type === "CANCELLED"
      ? "#e5e7eb"
      : "#dcfce7"};
  color: ${(props) =>
    props.type === "NEW"
      ? "#b91c1c"
      : props.type === "CHANGED"
      ? "#b45309"
      : props.type === "CANCELLED"
      ? "#374151"
      : "#166534"};
`;

const SyncItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SyncItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const SyncLabel = styled.div`
  font-weight: 600;
  font-size: 15px;
  color: #2d3748;
`;

const SyncDetails = styled.div`
  font-size: 13px;
  color: #4a5568;
  margin-top: 4px;
`;

const SyncButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

// 리스트 헤더 컴포넌트 재정의
const ListHeader = styled.div`
  display: grid;
  grid-template-columns: 24px 120px 180px 1fr 120px;
  gap: 8px;
  padding: 0 8px 8px 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
`;

const HeaderItem = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
  text-align: ${(props) => props.align || "left"};
`;

// 하단 태그 스타일 추가
const ItemTag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  margin-right: 4px;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const NaverReservationViewer = ({ isVisible, setIsVisible, onDataExtract }) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [showDataPanel, setShowDataPanel] = useState(false);
  const [useDirectWebview, setUseDirectWebview] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showReservationList, setShowReservationList] = useState(false);
  const [firestoreReservations, setFirestoreReservations] = useState([]);
  const [comparisonResults, setComparisonResults] = useState([]);
  const [showComparisonPanel, setShowComparisonPanel] = useState(false);
  const webviewRef = useRef(null);
  const { showToast } = useToast();
  // 담당자 관련 상태 수정 - 기본값을 박상현으로 설정
  const [staffList, setStaffList] = useState([
    { id: "박상현", name: "박상현" },
    { id: "진료팀", name: "진료팀" },
  ]);
  const [selectedStaff, setSelectedStaff] = useState({
    id: "박상현",
    name: "박상현",
  });

  // 네이버 예약 URL
  const naverReservationUrl =
    "https://partner.booking.naver.com/bizes/1324069/booking-list-view";

  useEffect(() => {
    if (!isVisible) {
      setShowDataPanel(false);
      setExtractedData(null);
      setShowReservationList(false);
      setReservations([]);
      setSelectedReservation(null);
    }
  }, [isVisible]);

  // 컴포넌트 마운트 시 진료팀 목록 불러오기 수정
  useEffect(() => {
    // 모달이 열릴 때만 데이터 로드
    if (isVisible) {
      const fetchStaffList = async () => {
        try {
          // Firestore에서 직원 목록 가져오기 (users 컬렉션 사용)
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("active", "!=", false));
          const querySnapshot = await getDocs(q);

          const staffData = [];

          querySnapshot.forEach((doc) => {
            const userData = doc.data();
            // 진료팀 구성원만 필터링 (또는 원하는 필터 조건 설정)
            if (
              userData.department === "진료" ||
              userData.department === "진료팀"
            ) {
              staffData.push({
                id: userData.name || doc.id,
                name: userData.name || doc.id,
                department: userData.department,
              });
            }
          });

          // 기본 담당자 목록 구성
          let uniqueStaff = [];

          // 박상현 의사가 목록에 있는지 확인
          const hasDefaultDoctor = staffData.some(
            (staff) => staff.name === "박상현"
          );

          // 박상현 의사가 없으면 첫 번째 항목으로 추가
          if (!hasDefaultDoctor) {
            uniqueStaff.push({ id: "박상현", name: "박상현" });
          }

          // 나머지 스태프 추가
          uniqueStaff = [...uniqueStaff, ...staffData];

          // 진료팀 옵션 추가
          if (!uniqueStaff.find((staff) => staff.id === "진료팀")) {
            uniqueStaff.push({ id: "진료팀", name: "진료팀" });
          }

          setStaffList(uniqueStaff);

          // 기본값으로 박상현 설정
          if (!selectedStaff || selectedStaff.id !== "박상현") {
            const defaultDoctor =
              uniqueStaff.find((staff) => staff.name === "박상현") ||
              uniqueStaff[0];
            setSelectedStaff(defaultDoctor);
          }
        } catch (error) {
          console.error("직원 목록 로드 오류:", error);
          // 오류 시 기본 목록 유지
          const defaultStaff = [
            { id: "박상현", name: "박상현" },
            { id: "진료팀", name: "진료팀" },
          ];
          setStaffList(defaultStaff);
          setSelectedStaff(defaultStaff[0]);
        }
      };

      fetchStaffList();
    }
  }, [isVisible]);

  // webview 이벤트 리스너 등록
  useEffect(() => {
    const setupWebviewListeners = () => {
      if (webviewRef.current && window.electron) {
        const webview = webviewRef.current;

        // 로드 완료 이벤트 리스너 등록
        webview.addEventListener("did-finish-load", handleWebViewLoaded);

        // 콘솔 로그 캡처하여 디버깅 용이하게
        webview.addEventListener("console-message", (e) => {
          console.log("웹뷰 콘솔:", e.message);
        });

        return () => {
          webview.removeEventListener("did-finish-load", handleWebViewLoaded);
        };
      }
    };

    // webview 요소가 DOM에 마운트된 후 리스너 등록
    const timeoutId = setTimeout(setupWebviewListeners, 1000);
    return () => clearTimeout(timeoutId);
  }, [webviewRef.current, isVisible]);

  // 예약 날짜 형식 변환 (25. 3. 27.(목) 오전 9:00 -> 2025-03-27)
  const formatReservationDate = (dateStr) => {
    try {
      if (!dateStr || dateStr === "-") {
        // 날짜 문자열이 없거나 "-"인 경우 현재 날짜와 시간을 기본값으로 사용
        const now = new Date();
        return {
          date: format(now, "yyyy-MM-dd"),
          time: format(now, "HH:mm"),
          fullDate: now,
          displayDate: dateStr || "-",
          isDefault: true,
        };
      }

      // 다양한 네이버 예약 날짜 패턴에 대응할 수 있는 정규식
      // 예: "25. 3. 27.(목) 오전 9:00", "2025-03-27 오전 9:00", "25.3.27 오전 9시" 등
      const regex1 =
        /(\d+)\.\s*(\d+)\.\s*(\d+)\..*?([오전|오후])\s*(\d+):(\d+)/;
      const regex2 =
        /(\d+)\.\s*(\d+)\.\s*(\d+).*?([오전|오후])\s*(\d+)[시:](\d+)?/;
      const regex3 =
        /(\d{4})-(\d{2})-(\d{2}).*?([오전|오후])\s*(\d+)[시:](\d+)?/;

      let matches =
        dateStr.match(regex1) || dateStr.match(regex2) || dateStr.match(regex3);

      if (!matches) {
        console.warn("표준 날짜 형식 파싱 실패, 대체 방법 시도:", dateStr);

        // 날짜만 있는 경우를 위한 단순 정규식 (예: "25.3.27", "2025-03-27")
        const dateOnlyRegex1 = /(\d+)\.(\d+)\.(\d+)/;
        const dateOnlyRegex2 = /(\d{4})-(\d{2})-(\d{2})/;

        const dateOnlyMatches =
          dateStr.match(dateOnlyRegex1) || dateStr.match(dateOnlyRegex2);

        if (dateOnlyMatches) {
          let [_, year, month, day] = dateOnlyMatches;

          // 2자리 연도를 4자리로 변환
          year = year.length === 2 ? `20${year}` : year;

          // 시간이 없으므로 기본값으로 9:00 사용
          const dateObj = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            9,
            0
          );

          return {
            date: format(dateObj, "yyyy-MM-dd"),
            time: "09:00",
            fullDate: dateObj,
            displayDate: dateStr,
            isPartialParsed: true,
          };
        }

        // 여전히 파싱 실패한 경우 현재 날짜 반환
        const now = new Date();
        return {
          date: format(now, "yyyy-MM-dd"),
          time: format(now, "HH:mm"),
          fullDate: now,
          displayDate: dateStr,
          isDefault: true,
        };
      }

      let [_, year, month, day, ampm, hour, minute = "0"] = matches;

      // 2자리 연도를 4자리로 변환
      year = year.length === 2 ? `20${year}` : year;

      // 시간 변환 (오후인 경우 12 더하기)
      let hourNum = parseInt(hour);
      if (ampm === "오후" && hourNum < 12) {
        hourNum += 12;
      } else if (ampm === "오전" && hourNum === 12) {
        hourNum = 0;
      }

      const dateObj = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        hourNum,
        parseInt(minute)
      );

      return {
        date: format(dateObj, "yyyy-MM-dd"),
        time: format(dateObj, "HH:mm"),
        fullDate: dateObj,
        displayDate: dateStr,
      };
    } catch (error) {
      console.error("날짜 변환 오류:", error, dateStr);
      // 오류 발생 시 현재 날짜와 시간을 기본값으로 사용
      const now = new Date();
      return {
        date: format(now, "yyyy-MM-dd"),
        time: format(now, "HH:mm"),
        fullDate: now,
        displayDate: dateStr || "-",
        isDefault: true,
      };
    }
  };

  // 외부 브라우저에서 네이버 예약 페이지 열기
  const openInExternalBrowser = () => {
    if (window.electron) {
      // window.electron.shell은 더 이상 사용할 수 없으므로 
      // 새 탭에서 열도록 변경
      window.open(naverReservationUrl, "_blank");
    } else {
      // 일반 웹 환경에서는 새 탭에서 열기
      window.open(naverReservationUrl, "_blank");
    }
  };

  // Electron 웹뷰 로드 완료 핸들러
  const handleWebViewLoaded = () => {
    console.log("네이버 예약 웹뷰 로드 완료");

    // webview에 접근하여 사용자 에이전트 변경 및 스크립트 실행 (로그인 문제 해결 시도)
    if (webviewRef.current && window.electron) {
      try {
        const webview = webviewRef.current;

        // 로그인 폼 감지
        webview
          .executeJavaScript(
            `
          // 로그인 폼 자동 감지 및 표시 향상
          function checkForLoginForm() {
            const loginForms = document.querySelectorAll('form[action*="login"]');
            console.log('로그인 폼 감지:', loginForms.length);
          }
          
          // 현재 페이지에서도 확인
          checkForLoginForm();
        `
          )
          .catch((err) => console.error("로그인 체크 스크립트 오류:", err));
      } catch (error) {
        console.error("웹뷰 스크립트 실행 오류:", error);
      }
    }
  };

  // 예약 데이터 추출 핸들러
  const handleExtractData = async () => {
    setIsExtracting(true);

    try {
      if (webviewRef.current && window.electron) {
        const webview = webviewRef.current;

        // 네이버 예약 데이터 추출 스크립트
        const extractScript = `
          (function() {
            try {
              // 화면 배율 조정 시도 코드 제거 (사용자 요청)
              
              // 예약 테이블 확인
              const table = document.querySelector('.BookingListView__booking-list-table__sUuPX');
              
              if (!table) {
                return { error: '예약 테이블을 찾을 수 없습니다. 네이버 예약 페이지에 로그인되어 있는지 확인해주세요.' };
              }
              
              // 디버깅용 정보 출력
              console.log("예약 테이블 찾음:", table);
              
              // 표시된 예약 항목 확인 - 다양한 클래스명 시도
              let reservationItems = Array.from(document.querySelectorAll('.BookingListView__contents-user__xNWR6'));
              
              // 첫 번째 선택자로 찾지 못한 경우 대체 선택자 시도
              if (reservationItems.length === 0) {
                reservationItems = Array.from(document.querySelectorAll('[class*="contents-user"]'));
              }
              
              // 그래도 못 찾으면 테이블의 행 자체를 가져오기
              if (reservationItems.length === 0) {
                reservationItems = Array.from(table.querySelectorAll('tr'));
              }
              
              if (reservationItems.length === 0) {
                return { error: '예약 항목을 찾을 수 없습니다. 네이버 예약이 있는지 확인해주세요.' };
              }
              
              console.log("예약 항목 수:", reservationItems.length);
              
              // 모든 예약 데이터 추출 (전체 정보)
              const reservations = reservationItems.map(item => {
                try {
                  // 상태
                  const status = item.querySelector('.BookingListView__state__89OjA span, [class*="state"] span')?.textContent.trim() || '';
                  
                  // 상태 정보가 없는 경우 추가 방법으로 시도
                  let finalStatus = status;
                  
                  // 상태 정보가 비어있거나 예상과 다른 경우 대체 방법 시도
                  if (!finalStatus || !['확정', '취소', '대기'].includes(finalStatus)) {
                    // 방법 1: 다른 클래스 이름으로 시도
                    const statusElems = item.querySelectorAll('[class*="state"]');
                    for (const elem of statusElems) {
                      const text = elem.textContent.trim();
                      if (text && ['확정', '취소', '대기'].includes(text)) {
                        finalStatus = text;
                        break;
                      }
                    }
                    
                    // 방법 2: 취소일 필드가 있으면 취소 상태로 간주
                    if (!finalStatus || !['확정', '취소', '대기'].includes(finalStatus)) {
                      const cancelDateElem = item.querySelector('[class*="order-cancel-date"]');
                      if (cancelDateElem && cancelDateElem.textContent.trim() !== '-') {
                        finalStatus = '취소';
                      }
                    }
                    
                    // 방법 3: CSS 스타일 분석 - 취소된 예약은 보통 회색 또는 특정 스타일로 표시됨
                    if (!finalStatus || !['확정', '취소', '대기'].includes(finalStatus)) {
                      // 회색 백그라운드나 특정 스타일을 가진 요소 확인
                      const cancelStyle = window.getComputedStyle(item);
                      if (cancelStyle.opacity < 1 || cancelStyle.color.includes('gray') || 
                          cancelStyle.backgroundColor.includes('gray')) {
                        finalStatus = '취소';
                      }
                    }
                    
                    // 방법 4: "취소" 텍스트가 포함된 요소 찾기
                    if (!finalStatus || !['확정', '취소', '대기'].includes(finalStatus)) {
                      if (item.textContent.includes('취소됨') || 
                          item.textContent.includes('취소 완료') ||
                          item.textContent.includes('예약취소')) {
                        finalStatus = '취소';
                      }
                    }
                  }
                  
                  // 그래도 상태를 결정할 수 없으면 기본값으로 '확정' 사용
                  if (!finalStatus || !['확정', '취소', '대기'].includes(finalStatus)) {
                    finalStatus = '확정';
                    console.log('상태 결정 불가: 기본값(확정) 적용');
                  }
                  
                  console.log('추출된 상태값:', { original: status, final: finalStatus });
                  
                  // 이름
                  const name = item.querySelector('.BookingListView__name-ellipsis__snplV, [class*="name-ellipsis"]')?.textContent.trim() || '';
                  
                  // 전화번호
                  const phone = item.querySelector('.BookingListView__phone__i04wO span, [class*="phone"] span')?.textContent.trim() || '';
                  
                  // 예약번호
                  const bookingNumber = item.querySelector('.BookingListView__book-number__33dBa, [class*="book-number"]')?.textContent.trim().split('변경')[0] || '';
                  
                  // 이용일시 - 다양한 방법으로 추출 시도
                  let useDate = '';
                  
                  // 1. 정확한 클래스명으로 시도
                  const useDateElem = item.querySelector('.BookingListView__book-date__F7BCG');
                  if (useDateElem) {
                    useDate = useDateElem.textContent.trim();
                  } 
                  // 2. 부분 클래스명으로 시도
                  else {
                    const dateCell = item.querySelector('[class*="book-date"]');
                    if (dateCell) {
                      useDate = dateCell.textContent.trim();
                    }
                  }
                  
                  // 3. 컨텐츠 영역에서 시도
                  if (!useDate) {
                    const contentBooking = item.querySelector('.BookingListView__contents-booking__1ffMf, [class*="contents-booking"]');
                    if (contentBooking) {
                      const dateCell = contentBooking.querySelector('div[class*="book-date"]');
                      if (dateCell) {
                        useDate = dateCell.textContent.trim();
                      }
                    }
                  }
                  
                  // 4. 태그 속성으로 시도
                  if (!useDate) {
                    const dateCells = Array.from(item.querySelectorAll('div'));
                    for (const cell of dateCells) {
                      if (cell.textContent.includes('오전') || cell.textContent.includes('오후')) {
                        useDate = cell.textContent.trim();
                        break;
                      }
                    }
                  }
                  
                  // 메뉴(상품)
                  const product = item.querySelector('.BookingListView__host__a\\+wPh, [class*="host"]')?.textContent.trim() || '';
                  
                  // 방문자
                  const visitorElem = item.querySelector('.BookingListView__sub-text__njwgc, [class*="sub-text"]');
                  const visitor = visitorElem ? visitorElem.textContent.trim().replace('방문자: ', '') : '';
                  
                  // 요청사항 - 다양한 방법으로 추출 시도
                  let comment = '-';
                  
                  // 1. 정확한 클래스명으로 시도 (이스케이프 처리)
                  const commentElem = item.querySelector('.BookingListView__comment__\\-1Fck');
                  if (commentElem) {
                    comment = commentElem.textContent.trim() || '-';
                  } 
                  // 2. 부분 클래스명으로 시도
                  else {
                    const commentCell = item.querySelector('[class*="comment"]');
                    if (commentCell) {
                      comment = commentCell.textContent.trim() || '-';
                    }
                  }
                  
                  // 3. 컨텐츠 영역에서 시도
                  if (comment === '-') {
                    const contentBooking = item.querySelector('.BookingListView__contents-booking__1ffMf, [class*="contents-booking"]');
                    if (contentBooking) {
                      const commentCell = contentBooking.querySelector('div[class*="comment"]');
                      if (commentCell) {
                        comment = commentCell.textContent.trim() || '-';
                      }
                    }
                  }
                  
                  // 4. "요청사항" 텍스트가 포함된 요소 찾기
                  if (comment === '-') {
                    const labels = Array.from(item.querySelectorAll('div'));
                    for (let i = 0; i < labels.length; i++) {
                      if (labels[i].textContent.includes('요청사항') && i + 1 < labels.length) {
                        comment = labels[i + 1].textContent.trim() || '-';
                        break;
                      }
                    }
                  }
                  
                  // 예약일
                  const orderDate = item.querySelector('.BookingListView__order-date__ebBq\\+ span, [class*="order-date"] span, [class*="order-date"]')?.textContent.trim() || '';
                  
                  // 확정일
                  const confirmDate = item.querySelector('.BookingListView__order-success-date__XEFuE, [class*="order-success-date"]')?.textContent.trim() || '-';
                  
                  // 취소일
                  const cancelDate = item.querySelector('.BookingListView__order-cancel-date__\\-kOfn, [class*="order-cancel-date"]')?.textContent.trim() || '-';
                  
                  // 가격
                  const price = item.querySelector('.BookingListView__total-price__Y2qoz, [class*="total-price"]')?.textContent.trim() || '0원';
                  
                  console.log("추출된 항목:", {
                    name, useDate, comment, bookingNumber
                  });
                  
                  return {
                    status: finalStatus,
                    name,
                    isProxy: item.querySelector('.BookingListView__label__BzZL5, [class*="label"]') ? '대리예약' : '',
                    visitor,
                    phone,
                    bookingNumber,
                    useDate,
                    product,
                    menu: '',
                    comment,
                    price,
                    orderDate,
                    confirmDate,
                    cancelDate
                  };
                } catch (err) {
                  console.error('항목 추출 오류:', err);
                  return null;
                }
              }).filter(item => item !== null);
              
              return { 
                success: true,
                reservations,
                count: reservations.length
              };
            } catch (error) {
              console.error('추출 오류:', error);
              return { error: error.toString() };
            }
          })();
        `;

        // 스크립트 실행
        const result = await webview.executeJavaScript(extractScript);

        if (result.error) {
          setIsExtracting(false);
          showToast(`데이터 추출 오류: ${result.error}`, "error");
          return;
        }

        if (
          result.success &&
          result.reservations &&
          result.reservations.length > 0
        ) {
          console.log(`${result.count}개의 예약을 추출했습니다.`);
          setReservations(result.reservations);
          // Firestore 데이터 조회 후 비교
          fetchFirestoreReservations(result.reservations);
          setIsExtracting(false);
        } else {
          setIsExtracting(false);
          showToast(
            "예약 정보를 찾을 수 없습니다. 네이버 예약 페이지에 로그인되어 있는지 확인해주세요.",
            "warning"
          );
        }
      } else {
        setIsExtracting(false);
        showToast(
          "웹뷰를 사용할 수 없습니다. 데스크탑 앱에서 실행해주세요.",
          "error"
        );
      }
    } catch (error) {
      console.error("데이터 추출 오류:", error);
      setIsExtracting(false);
      showToast(
        `데이터 추출 오류: ${
          error.message || "알 수 없는 오류가 발생했습니다."
        }`,
        "error"
      );
    }
  };

  // Firestore에서 예약 데이터 가져오기
  const fetchFirestoreReservations = async (naverReservations) => {
    try {
      // Firestore에서 예약 데이터 조회
      console.log("Firebase에서 기존 예약 데이터 조회 시작");
      const reservationsRef = collection(db, "reservations");
      const q = query(reservationsRef, where("isHidden", "!=", true));
      const querySnapshot = await getDocs(q);

      const firestoreData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(
          `Firebase 예약 데이터 로드: ID=${doc.id}, 번호=${
            data.bookingNumber || "번호없음"
          }`
        );
        firestoreData.push({
          ...data,
          id: doc.id,
          bookingNumber: data.bookingNumber || "",
        });
      });

      setFirestoreReservations(firestoreData);
      console.log(
        `Firebase에서 총 ${firestoreData.length}개의 예약 데이터 로드 완료`
      );

      // 데이터 로드 후 자동으로 비교 및 분류 실행
      compareAndCategorize(naverReservations, firestoreData);
    } catch (error) {
      console.error("Firestore 데이터 로드 오류:", error);
      // 오류 발생 시에도 UI를 표시하기 위해 빈 배열로 비교
      compareAndCategorize(naverReservations, []);
    }
  };

  // 네이버 예약과 Firestore 데이터 비교 및 분류
  const compareAndCategorize = (naverReservations, firestoreData) => {
    const results = naverReservations.map((naverReservation) => {
      // 취소된 예약 먼저 처리
      if (naverReservation.status === "취소") {
        return {
          ...naverReservation,
          syncStatus: "CANCELLED",
          syncLabel: "⚫ 취소됨",
          isCancelled: true,
        };
      }

      // 예약 ID 생성
      const customerName = naverReservation.visitor || naverReservation.name;
      const bookingId = generateBookingId(
        customerName,
        naverReservation.bookingNumber
      );

      // 예약번호 기반 매칭 또는 ID 기반 매칭
      const existingReservationByNumber = firestoreData.find(
        (r) => r.bookingNumber === naverReservation.bookingNumber
      );

      const existingReservationById = firestoreData.find(
        (r) => r.documentId === bookingId
      );

      // ID 또는 예약번호로 매칭된 항목이 없으면 신규 예약
      const existingReservation =
        existingReservationById || existingReservationByNumber;

      if (!existingReservation) {
        return {
          ...naverReservation,
          syncStatus: "NEW",
          syncLabel: "🔴 미등록",
          isCancelled: false,
          documentId: bookingId, // 생성된 ID 저장
        };
      }

      // 예약이 이미 Firebase에 존재하면 무조건 등록됨 상태로 표시
      // 내용이 변경되었는지 여부는 더 이상 확인하지 않음
      return {
        ...naverReservation,
        syncStatus: "SYNCED",
        syncLabel: "🟢 이미 등록됨",
        isCancelled: false,
        documentId: bookingId, // 생성된 ID 저장
      };
    });

    // 원래 네이버 예약 순서 유지 (취소된 예약 포함, 정렬하지 않음)
    setComparisonResults(results);
    setShowReservationList(true);
  };

  // 예약 항목 선택 핸들러 수정
  const handleSelectReservation = (reservation) => {
    setSelectedReservation(reservation);

    try {
      // 선택한 예약 정보를 구조화된 데이터로 변환
      const dateInfo = formatReservationDate(reservation.useDate);

      // 날짜 정보가 기본값(현재 날짜/시간)으로 설정된 경우 경고 표시
      if (dateInfo.isDefault) {
        console.warn(
          "날짜 정보 해석에 어려움이 있어 현재 날짜/시간을 사용합니다:",
          reservation.useDate
        );
        showToast(
          "날짜 형식을 파싱할 수 없어 현재 날짜와 시간을 사용합니다.",
          "warning"
        );
      } else if (dateInfo.isPartialParsed) {
        showToast("시간 정보가 없어 오전 9시로 설정합니다.", "info");
      }

      // 시작 시간에서 종료 시간 계산 (기본 30분)
      const [hours, minutes] = dateInfo.time.split(":").map(Number);
      let endHours = hours;
      let endMinutes = minutes + 30;

      if (endMinutes >= 60) {
        endHours += 1;
        endMinutes -= 60;
      }

      const endTime = `${String(endHours).padStart(2, "0")}:${String(
        endMinutes
      ).padStart(2, "0")}`;

      // reservation에 이미 담당자 정보가 있으면 사용, 없으면 현재 선택된 담당자 사용
      const staffInfo = reservation.selectedStaff || selectedStaff;

      // ScheduleGrid 예약 형식에 맞게 데이터 구성
      const extractedInfo = {
        date: dateInfo.date,
        startTime: dateInfo.time,
        endTime: endTime,
        title: reservation.visitor || reservation.name,
        type: "진료",
        notes: reservation.comment !== "-" ? reservation.comment : "",
        staffId: staffInfo.id,
        staffName: staffInfo.name,

        // 참조용 추가 필드
        customerName: reservation.visitor || reservation.name,
        phone: reservation.phone,
        appointmentDate: dateInfo.date,
        appointmentTime: dateInfo.time,
        service: reservation.product,
        bookingNumber: reservation.bookingNumber,
        status: reservation.status === "취소" ? "canceled" : "confirmed",
      };

      setExtractedData(extractedInfo);
      setShowDataPanel(true);
    } catch (error) {
      console.error("예약 선택 중 오류 발생:", error);
      showToast(
        "예약 정보 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
        "error"
      );
    }
  };

  // 담당자 변경 핸들러
  const handleStaffChange = (e) => {
    const staffId = e.target.value;
    const staff = staffList.find((s) => s.id === staffId) || {
      id: staffId,
      name: staffId,
    };
    setSelectedStaff(staff);

    // 추출된 데이터 업데이트
    if (extractedData) {
      // staffId 형식 맞추기 (doctor_0 형식으로)
      const formattedStaffId = staff.id.startsWith("doctor_")
        ? staff.id
        : staff.id === "박상현"
        ? "doctor_0"
        : `doctor_${staffList.indexOf(staff)}`;

      setExtractedData({
        ...extractedData,
        staffId: formattedStaffId,
        staffName: staff.name,
      });
    }
  };

  // 담당자 변경 핸들러 수정 - 특정 예약 항목의 담당자 변경
  const handleItemStaffChange = (reservation, staffId) => {
    // 선택한 담당자 정보 가져오기
    const staff = staffList.find((s) => s.id === staffId) || {
      id: staffId,
      name: staffId,
    };

    // 예약 객체에 담당자 정보 저장
    const updatedReservation = {
      ...reservation,
      selectedStaff: staff,
    };

    // 상태 업데이트 - reservation 목록에서 해당 항목 업데이트
    setComparisonResults((prevResults) =>
      prevResults.map((item) =>
        item.bookingNumber === reservation.bookingNumber
          ? updatedReservation
          : item
      )
    );

    // 현재 선택된 예약인 경우 extractedData도 업데이트
    if (
      selectedReservation?.bookingNumber === reservation.bookingNumber &&
      extractedData
    ) {
      setExtractedData({
        ...extractedData,
        staffId: staff.id,
        staffName: staff.name,
      });
    }
  };

  // 예약 등록 후 목록 갱신 함수 추가
  const refreshReservationList = async () => {
    try {
      console.log("예약 목록 새로고침 시작");

      // 기존 네이버 예약 정보 유지하면서 Firebase 데이터만 다시 가져오기
      const reservationsRef = collection(db, "reservations");
      const q = query(reservationsRef, where("isHidden", "!=", true));
      const querySnapshot = await getDocs(q);

      const firestoreData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        firestoreData.push({
          ...data,
          id: doc.id,
          bookingNumber: data.bookingNumber || "",
        });
      });

      console.log(
        `Firebase에서 총 ${firestoreData.length}개의 예약 데이터 새로 로드 완료`
      );

      // 기존 네이버 예약 데이터와 새로 로드한 Firebase 데이터로 비교 및 상태 업데이트
      compareAndCategorize(reservations, firestoreData);
    } catch (error) {
      console.error("예약 목록 새로고침 중 오류:", error);
    }
  };

  const handleBulkRegister = async () => {
    // 단일 예약 선택일 경우
    if (selectedReservation && extractedData) {
      try {
        // staffId 형식을 doctor_0 형식으로 변환
        let scheduleGridStaffId = extractedData.staffId;
        if (!scheduleGridStaffId.startsWith("doctor_")) {
          scheduleGridStaffId =
            scheduleGridStaffId === "박상현"
              ? "doctor_0"
              : `doctor_${staffList.findIndex(
                  (s) => s.id === scheduleGridStaffId
                )}`;
          if (scheduleGridStaffId.includes("doctor_-1")) {
            scheduleGridStaffId = "doctor_0"; // 못 찾을 경우 기본값
          }
        }

        // 예약 ID 생성 (페이지 전체에서 고유하게 식별 가능한 값)
        const bookingId = generateBookingId(
          extractedData.title,
          extractedData.bookingNumber
        );

        // ScheduleGrid 형식에 맞게 데이터 변환
        const appointmentData = {
          date: extractedData.date,
          startTime: extractedData.startTime,
          endTime: extractedData.endTime,
          title: extractedData.title,
          staffId: scheduleGridStaffId,
          staffName: extractedData.staffName,
          notes: `[네이버예약] ${extractedData.notes || ""} (연락처: ${
            extractedData.phone || ""
          }, 서비스: ${extractedData.service || ""})`.trim(),
          type: "예약",
          dateIndex: 0,
          bookingNumber: extractedData.bookingNumber || "",
          status: extractedData.status || "confirmed",
          createdAt: new Date().toISOString(),
          isHidden: false, // ScheduleGrid에 필드
          documentId: bookingId, // 문서 ID를 필드로도 저장
        };

        // 콜백 방식으로 데이터 전달
        if (onDataExtract) {
          console.log("콜백 방식으로 예약 데이터 전달:", appointmentData);
          onDataExtract(appointmentData);

          // 단일 예약 등록 알림 전송
          sendReservationNotification("단일", appointmentData);

          showToast("예약이 등록되었습니다.", "success");

          // 예약 등록 후 목록 닫기
          setShowReservationList(false);

          return;
        } else {
          try {
            console.log(`저장 시도: ID=${bookingId}, 데이터=`, appointmentData);

            // Firebase에 직접 저장
            const reservationsRef = collection(db, "reservations");

            // 방법 1: setDoc 사용 (ID를 명시적으로 지정)
            const docRef = doc(reservationsRef, bookingId);
            await setDoc(docRef, {
              ...appointmentData,
              updatedAt: serverTimestamp(), // 타임스탬프 추가
            });

            console.log(`예약이 Firebase에 저장되었습니다. ID: ${bookingId}`);

            // 단일 예약 등록 알림 전송
            sendReservationNotification("단일", appointmentData);

            showToast("예약이 데이터베이스에 저장되었습니다.", "success");
            setShowDataPanel(false);

            // 예약 등록 후 목록 닫기
            setShowReservationList(false);
          } catch (saveError) {
            console.error("예약 저장 중 세부 오류:", saveError);

            // 방법 1 실패시 방법 2: addDoc 사용 (ID를 자동 생성)
            try {
              console.log("대체 저장 방법 시도 (addDoc)...");
              const reservationsRef = collection(db, "reservations");
              const docRef = await addDoc(reservationsRef, {
                ...appointmentData,
                updatedAt: serverTimestamp(),
              });
              console.log(
                `대체 방법으로 저장 성공. 자동 생성된 ID: ${docRef.id}`
              );
              showToast("예약이 저장되었습니다. (대체 방법 사용)", "success");
              setShowDataPanel(false);

              // 예약 등록 후 목록 닫기
              setShowReservationList(false);
            } catch (fallbackError) {
              console.error("대체 저장 방법도 실패:", fallbackError);
              throw fallbackError; // 원래 오류 처리로 전달
            }
          }
        }
        return;
      } catch (error) {
        console.error("예약 등록 중 오류:", error);
        showToast(
          `예약 등록에 실패했습니다: ${error.message || "알 수 없는 오류"}`,
          "error"
        );
        return;
      }
    }

    // 선택된 예약 항목들 가져오기
    const selectedItems = comparisonResults.filter((res) => res.isSelected);

    if (selectedItems.length === 0) {
      showToast("등록할 예약을 선택해주세요.", "warning");
      return;
    }

    try {
      console.log(`총 ${selectedItems.length}개의 예약을 처리합니다.`);

      // 처리된 예약 목록
      const processedReservations = [];

      // 각 예약 항목 처리
      for (const reservation of selectedItems) {
        // 예약 상태 확인 - 취소된 예약은 건너뛰기
        if (reservation.status === "취소") {
          console.log(
            `예약 #${reservation.bookingNumber}(${
              reservation.name || reservation.visitor
            }): 취소된 예약이므로 등록 건너뜀`
          );
          continue;
        }

        // 날짜 정보 변환
        const dateInfo = formatReservationDate(reservation.useDate);

        // 시작 시간에서 종료 시간 계산 (기본 30분)
        const [hours, minutes] = dateInfo.time.split(":").map(Number);
        let endHours = hours;
        let endMinutes = minutes + 30;

        if (endMinutes >= 60) {
          endHours += 1;
          endMinutes -= 60;
        }

        const endTime = `${String(endHours).padStart(2, "0")}:${String(
          endMinutes
        ).padStart(2, "0")}`;

        // 담당자 정보
        const staffInfo = reservation.selectedStaff || selectedStaff;

        // staffId 형식을 doctor_0 형식으로 변환
        let scheduleGridStaffId = staffInfo.id;
        if (!scheduleGridStaffId.startsWith("doctor_")) {
          scheduleGridStaffId =
            scheduleGridStaffId === "박상현"
              ? "doctor_0"
              : `doctor_${staffList.findIndex(
                  (s) => s.id === scheduleGridStaffId
                )}`;
          if (scheduleGridStaffId.includes("doctor_-1")) {
            scheduleGridStaffId = "doctor_0"; // 못 찾을 경우 기본값
          }
        }

        // 방문자 또는 이름 가져오기
        const customerName = reservation.visitor || reservation.name;

        // 예약 ID 생성
        const bookingId = generateBookingId(
          customerName,
          reservation.bookingNumber
        );

        // ScheduleGrid 형식에 맞게 데이터 준비
        const appointmentData = {
          date: dateInfo.date,
          startTime: dateInfo.time,
          endTime: endTime,
          title: customerName,
          staffId: scheduleGridStaffId,
          staffName: staffInfo.name,
          notes: `[네이버예약] ${
            reservation.comment !== "-" ? reservation.comment : ""
          } (연락처: ${reservation.phone || ""}, 서비스: ${
            reservation.product || ""
          })`.trim(),
          type: "예약",
          dateIndex: 0,
          bookingNumber: reservation.bookingNumber || "",
          status: "confirmed",
          createdAt: new Date().toISOString(),
          isHidden: false, // ScheduleGrid에 필요한 필드
          documentId: bookingId, // 문서 ID를 필드로도 저장
        };

        processedReservations.push(appointmentData);
      }

      // 모든 예약 처리 후, 첫 번째 예약만 콜백으로 전달
      if (processedReservations.length > 0) {
        // 일괄 등록 알림 전송 (전체 예약 갯수 포함)
        sendReservationNotification("일괄", null, processedReservations.length);

        if (onDataExtract) {
          // 모든 예약을 배열로 전달하도록 수정
          console.log(
            `${processedReservations.length}개의 예약을 콜백으로 전달합니다.`
          );

          // 배열로 래핑하여 전달 (콜백이 배열을 처리할 수 있도록)
          onDataExtract({
            isMultiple: true,
            reservations: processedReservations,
            count: processedReservations.length,
          });

          showToast(
            `${processedReservations.length}개의 예약이 등록되었습니다.`,
            "success"
          );

          // 예약 등록 후 목록 닫기
          setShowReservationList(false);
        } else {
          // 콜백이 없으면 Firebase에 직접 저장 (모든 예약)
          setIsExtracting(true);
          let successCount = 0;
          let failCount = 0;

          // 이제 reservationsRef를 한 번만 가져옴
          const reservationsRef = collection(db, "reservations");

          for (const data of processedReservations) {
            try {
              console.log(
                `일괄 저장 시도: ID=${data.documentId}, 예약=${data.title}`
              );

              // 방법 1: setDoc으로 시도
              try {
                const docRef = doc(reservationsRef, data.documentId);
                await setDoc(docRef, {
                  ...data,
                  updatedAt: serverTimestamp(),
                });
                console.log(`예약 저장 성공 (setDoc): ${data.documentId}`);
                successCount++;
              } catch (setDocError) {
                console.error(`setDoc 실패: ${data.documentId}`, setDocError);

                // 방법 2: addDoc으로 시도
                try {
                  console.log(`대체 방법 시도 (addDoc): ${data.title}`);
                  const addDocRef = await addDoc(reservationsRef, {
                    ...data,
                    updatedAt: serverTimestamp(),
                  });
                  console.log(`대체 방법으로 저장 성공: ${addDocRef.id}`);
                  successCount++;
                } catch (addDocError) {
                  console.error("모든 저장 방법 실패:", addDocError);
                  failCount++;
                }
              }
            } catch (err) {
              console.error(`예약 저장 중 오류:`, err);
              failCount++;
            }
          }

          setIsExtracting(false);
          let resultMessage = `${successCount}개의 예약이 데이터베이스에 저장되었습니다.`;
          if (failCount > 0) {
            resultMessage += ` ${failCount}개 저장 실패.`;
          }
          showToast(resultMessage, successCount > 0 ? "success" : "warning");

          // 성공한 경우, 예약 목록 닫기
          if (successCount > 0) {
            showToast(resultMessage, successCount > 0 ? "success" : "warning");
            setShowReservationList(false);
          } else {
            showToast(resultMessage, "warning");
          }
        }
      } else {
        showToast("등록할 수 있는 예약이 없습니다.", "warning");
      }
    } catch (error) {
      setIsExtracting(false);
      console.error("예약 일괄 등록 중 오류:", error);
      showToast(
        `예약 등록에 실패했습니다: ${error.message || "알 수 없는 오류"}`,
        "error"
      );
    }
  };

  // 예약 ID 생성 함수 - title_bookingNumber 형식 (유효한 문서 ID로 정제)
  const generateBookingId = (title, bookingNumber) => {
    if (!bookingNumber) {
      // 예약번호가 없으면 타임스탬프 추가
      bookingNumber = Date.now().toString();
    }

    // 고유 ID 생성 (특수문자 제거 및 공백을 언더스코어로 변환)
    let cleanTitle = (title || "예약")
      .replace(/[^\w\s가-힣]/g, "") // 특수문자 제거 (한글, 영문, 숫자, 공백만 허용)
      .replace(/\s+/g, "_"); // 공백을 언더스코어로 변환

    // ID 길이 제한 (너무 길면 자르기)
    if (cleanTitle.length > 20) {
      cleanTitle = cleanTitle.substring(0, 20);
    }

    // 한글이 포함된 경우에도 그대로 사용
    // 이전에는 영숫자만 추출하고 없으면 "reservation"으로 대체했지만,
    // 이제는 한글을 포함한 제목을 그대로 사용합니다
    // 한글이 들어간 제목이 비어있는 경우만 기본값 사용
    if (cleanTitle.length === 0) {
      cleanTitle = "고객";
    }

    return `${cleanTitle}_${bookingNumber}`;
  };

  // 예약 등록 알림 전송 함수
  const sendReservationNotification = async (
    type,
    appointmentData,
    count = 1
  ) => {
    try {
      // 수신자는 항상 진료팀으로 설정
      const receiverId = "진료팀";

      // 현재 시간 포맷팅
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const formattedTime = `${hours}:${minutes}`;

      // 메시지 생성
      let message = "";

      if (type === "단일") {
        // 단일 예약인 경우
        const staffName = appointmentData.staffName || "담당자";
        const time = `${appointmentData.startTime}-${appointmentData.endTime}`;
        const date = appointmentData.date;
        message = `[네이버예약 등록] ${date} ${time} | ${staffName} | ${
          appointmentData.title || "예약"
        }`;
      } else {
        // 일괄 등록인 경우
        const today = format(new Date(), "yyyy-MM-dd");
        message = `[네이버예약 일괄등록] ${today} | ${count}건의 예약이 일괄 등록되었습니다.`;
      }

      // 발신자 정보 - "네이버예약"으로 설정
      const senderId = "네이버예약";

      // call 데이터 생성
      const callData = {
        message,
        receiverId,
        senderId,
        formattedTime,
        createdAt: Date.now(),
        createdAt2: serverTimestamp(),
        type: "예약",
        [receiverId]: true,
        [senderId]: true,
      };

      // Firebase에 call 저장
      await addDoc(collection(db, "calls"), callData);
      console.log(`${receiverId}에게 네이버예약 등록 알림 전송 완료`);
    } catch (error) {
      console.error("네이버예약 알림 전송 오류:", error);
    }
  };

  // 예약 항목 선택/선택 해제 토글 핸들러
  const toggleItemSelection = (reservation) => {
    // 등록됨(SYNCED)과 취소됨(CANCELLED) 상태의 예약은 선택할 수 없음
    if (
      reservation.syncStatus === "CANCELLED" ||
      reservation.syncStatus === "SYNCED"
    ) {
      return; // 아무 작업도 하지 않고 함수 종료
    }

    setComparisonResults((prevResults) =>
      prevResults.map((item) =>
        item.bookingNumber === reservation.bookingNumber
          ? { ...item, isSelected: !item.isSelected }
          : item
      )
    );
  };

  // 모든 예약 항목 선택/선택 해제 핸들러
  const toggleSelectAll = () => {
    // 선택 가능한 예약만 필터링 (취소됨과 등록됨 상태의 예약 제외)
    const selectableItems = comparisonResults.filter(
      (res) =>
        res.syncStatus !== "CANCELLED" &&
        res.syncStatus !== "SYNCED" &&
        res.status !== "취소"
    );

    // 선택 가능한 항목 중 선택되지 않은 항목이 있는지 확인
    const hasUnselectedItems = selectableItems.some((res) => !res.isSelected);

    // 결과 업데이트 - 취소됨과 등록됨 상태가 아닌 항목만 선택/해제
    setComparisonResults((prevResults) =>
      prevResults.map((item) => {
        // 취소됨과 등록됨 상태는 항상 선택 해제 유지
        if (
          item.syncStatus === "CANCELLED" ||
          item.syncStatus === "SYNCED" ||
          item.status === "취소"
        ) {
          return { ...item, isSelected: false };
        }
        // 나머지 항목은 전체 선택/해제 상태에 따라 설정
        return { ...item, isSelected: hasUnselectedItems };
      })
    );
  };

  if (!isVisible) return null;

  return (
    <ModalOverlay
      onClick={(e) => e.target === e.currentTarget && setIsVisible(false)}
    >
      <ModalContainer>
        <ModalHeader>
          <ModalTitle>네이버 예약 관리</ModalTitle>
          <CloseButton onClick={() => setIsVisible(false)}>
            <IoCloseOutline />
          </CloseButton>
        </ModalHeader>

        <WebViewContainer>
          {useDirectWebview ? (
            <>
              {/* Electron 환경에서는 webview 태그를 사용하고, 웹 환경에서는 iframe으로 대체 */}
              {window.electron ? (
                <webview
                  ref={webviewRef}
                  src={naverReservationUrl}
                  style={{ width: "100%", height: "100%" }}
                  nodeintegration="true"
                  webpreferences="contextIsolation=false, allowRunningInsecureContent=true"
                  allowpopups="true"
                  disablewebsecurity="true"
                  partition="persist:naverlogin"
                  useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
                ></webview>
              ) : (
                <iframe
                  ref={webviewRef}
                  src={naverReservationUrl}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  title="네이버 예약"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                ></iframe>
              )}
            </>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: "20px",
              }}
            >
              <p>
                네이버 예약 페이지를 외부 브라우저에서 확인 후 예약 정보를
                입력해주세요.
              </p>
              <button
                onClick={openInExternalBrowser}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  backgroundColor: "#22c55e",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                <IoOpenOutline />
                네이버 예약 페이지 열기
              </button>
            </div>
          )}

          {/* 예약 목록 UI 개선 */}
          {showReservationList && comparisonResults.length > 0 && (
            <ReservationList>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#2d3748",
                  }}
                >
                  네이버 예약 목록 ({comparisonResults.length}건
                  {comparisonResults.filter((res) => res.status === "취소")
                    .length > 0 &&
                    `, 취소 ${
                      comparisonResults.filter((res) => res.status === "취소")
                        .length
                    }건 포함`}
                  )
                </h3>
                <div>
                  <ActionButton
                    className="secondary"
                    onClick={() => setShowReservationList(false)}
                    style={{ padding: "6px 10px" }}
                  >
                    닫기
                  </ActionButton>
                </div>
              </div>

              <div
                style={{
                  marginBottom: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    id="select-all"
                    onChange={toggleSelectAll}
                    // "취소됨"과 "등록됨" 상태가 아닌 항목 중에서 모두 선택되어 있는지 확인
                    checked={comparisonResults
                      .filter(
                        (res) =>
                          res.syncStatus !== "CANCELLED" &&
                          res.syncStatus !== "SYNCED" &&
                          res.status !== "취소"
                      )
                      .every((res) => res.isSelected)}
                    style={{ marginRight: "8px" }}
                  />
                  <label
                    htmlFor="select-all"
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#4a5568",
                    }}
                  >
                    전체 선택 (미등록된 예약만)
                  </label>
                </div>
                <ActionButton
                  className="primary"
                  onClick={handleBulkRegister}
                  style={{ padding: "8px 16px" }}
                >
                  선택한 예약 등록하기
                </ActionButton>
              </div>

              <ReservationListScroll>
                {comparisonResults.map((reservation) => (
                  <ReservationItem
                    key={reservation.bookingNumber}
                    className={
                      selectedReservation?.bookingNumber ===
                      reservation.bookingNumber
                        ? "selected"
                        : ""
                    }
                    onClick={() => handleSelectReservation(reservation)}
                    isCancelled={reservation.isCancelled}
                    style={{
                      // 이미 등록된(SYNCED) 예약과 취소된(CANCELLED) 예약은 시각적으로 다르게 표시
                      opacity:
                        reservation.syncStatus === "SYNCED" ||
                        reservation.syncStatus === "CANCELLED"
                          ? 0.7
                          : 1,
                      cursor: "pointer",
                      backgroundColor:
                        reservation.syncStatus === "SYNCED"
                          ? "#e6f7ff" // 등록됨 상태는 연한 파란색 배경
                          : reservation.syncStatus === "CANCELLED"
                          ? "#f5f5f5" // 취소됨 상태는 연한 회색 배경
                          : reservation.isSelected
                          ? "#e6f7ff" // 선택된 상태는 연한 파란색
                          : "white",
                    }}
                  >
                    {/* 상단 영역: 체크박스, 상태 태그, 예약번호 */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        {/* 체크박스 - 취소된 예약이나 이미 등록된 예약은 체크박스 비활성화 */}
                        {reservation.status !== "취소" &&
                        reservation.syncStatus !== "SYNCED" ? (
                          <input
                            type="checkbox"
                            checked={reservation.isSelected || false}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleItemSelection(reservation);
                            }}
                          />
                        ) : (
                          <StatusTag
                            style={{
                              backgroundColor: "#718096",
                              width: "16px",
                              height: "16px",
                              padding: "0",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          ></StatusTag>
                        )}

                        {/* 상태 태그 */}
                        <StatusTag
                          style={{
                            backgroundColor:
                              reservation.status === "취소"
                                ? "#718096"
                                : reservation.syncStatus === "NEW"
                                ? "#f56565"
                                : reservation.syncStatus === "CHANGED"
                                ? "#f6ad55"
                                : "#3b82f6",
                            padding: "3px 8px",
                            fontSize: "12px",
                            display: "inline-block",
                          }}
                        >
                          {reservation.status === "취소"
                            ? "취소됨"
                            : reservation.syncStatus === "NEW"
                            ? "미등록"
                            : reservation.syncStatus === "CHANGED"
                            ? "변경됨"
                            : "등록됨"}
                        </StatusTag>
                      </div>

                      {/* 예약번호 */}
                      <div
                        style={{
                          fontSize: "12px",
                          color:
                            reservation.status === "취소"
                              ? "#94a3b8"
                              : "#718096",
                          fontWeight: "500",
                        }}
                      >
                        #{reservation.bookingNumber || "번호없음"}
                      </div>
                    </div>

                    {/* 예약자 정보 영역 */}
                    <div
                      style={{
                        marginBottom: "12px",
                        padding: "8px",
                        backgroundColor:
                          reservation.status === "취소" ? "#f8fafc" : "#f0f9ff",
                        borderRadius: "6px",
                        border: `1px solid ${
                          reservation.status === "취소" ? "#e2e8f0" : "#bfdbfe"
                        }`,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "600",
                          fontSize: "15px",
                          marginBottom: "6px",
                          color:
                            reservation.status === "취소"
                              ? "#718096"
                              : "#2d3748",
                        }}
                      >
                        {reservation.visitor || reservation.name}
                        {reservation.isProxy && (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#8b5cf6",
                              fontWeight: "normal",
                              marginLeft: "5px",
                              backgroundColor: "#f3e8ff",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            대리예약
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color:
                            reservation.status === "취소"
                              ? "#94a3b8"
                              : "#4a5568",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ marginRight: "8px" }}>📞</span>
                        {reservation.phone || "연락처 없음"}
                      </div>
                    </div>

                    {/* 이용일시 및 상품 */}
                    <div
                      style={{
                        marginBottom: "12px",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        backgroundColor:
                          reservation.status === "취소" ? "#f8fafc" : "#f0f9ff",
                        border: `1px solid ${
                          reservation.status === "취소" ? "#e2e8f0" : "#bfdbfe"
                        }`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: "500",
                          display: "flex",
                          alignItems: "center",
                          marginBottom: "6px",
                          color:
                            reservation.status === "취소"
                              ? "#718096"
                              : "#2d3748",
                        }}
                      >
                        <span style={{ marginRight: "8px" }}>🕒</span>
                        <span style={{ fontWeight: "bold" }}>
                          {reservation.useDate || "일시 정보 없음"}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          color:
                            reservation.status === "취소"
                              ? "#718096"
                              : "#2d3748",
                        }}
                      >
                        <span style={{ marginRight: "8px" }}>🏥</span>
                        <span style={{ fontWeight: "500" }}>
                          {reservation.product || "-"}
                        </span>
                      </div>
                    </div>

                    {/* 요청사항이 '-'가 아닐 때만 표시 */}
                    {reservation.comment && reservation.comment !== "-" && (
                      <div
                        style={{
                          fontSize: "13px",
                          marginBottom: "12px",
                          padding: "10px 12px",
                          borderRadius: "6px",
                          border: `1px solid ${
                            reservation.status === "취소"
                              ? "#e2e8f0"
                              : "#93c5fd"
                          }`,
                          borderLeft: `4px solid ${
                            reservation.status === "취소"
                              ? "#94a3b8"
                              : "#3b82f6"
                          }`,
                          backgroundColor:
                            reservation.status === "취소"
                              ? "#f8fafc"
                              : "#f0f9ff",
                          color:
                            reservation.status === "취소"
                              ? "#718096"
                              : "#2d3748",
                        }}
                      >
                        <div style={{ marginBottom: "6px", fontWeight: "600" }}>
                          📝 요청사항
                        </div>
                        {reservation.comment}
                      </div>
                    )}

                    {/* 담당자 선택 또는 취소된 예약 표시 */}
                    <div>
                      {reservation.status === "취소" ? (
                        <div
                          style={{
                            padding: "10px 12px",
                            textAlign: "center",
                            backgroundColor: "#f1f5f9",
                            color: "#64748b",
                            borderRadius: "6px",
                            fontWeight: "500",
                            border: "1px dashed #cbd5e1",
                          }}
                        >
                          ❌ 취소된 예약입니다
                        </div>
                      ) : (
                        <div>
                          <div
                            style={{
                              fontSize: "13px",
                              marginBottom: "6px",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <span style={{ marginRight: "5px" }}>👨‍⚕️</span>
                            담당자 선택
                          </div>
                          <select
                            value={
                              reservation.selectedStaff?.id || selectedStaff.id
                            }
                            onChange={(e) => {
                              e.stopPropagation();
                              handleItemStaffChange(
                                reservation,
                                e.target.value
                              );
                            }}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: "6px",
                              border: "1px solid #e2e8f0",
                              backgroundColor: "#f7fafc",
                              cursor: "pointer",
                              fontSize: "14px",
                              fontWeight: "500",
                              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">-- 담당자 선택 --</option>
                            {staffList.map((staff) => (
                              <option key={staff.id} value={staff.id}>
                                {staff.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </ReservationItem>
                ))}
              </ReservationListScroll>
            </ReservationList>
          )}

          {showDataPanel && extractedData && (
            <ExtractedDataContainer>
              <div
                style={{
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#2d3748",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "10px",
                      height: "10px",
                      background: "#4299e1",
                      borderRadius: "50%",
                      marginRight: "8px",
                    }}
                  ></span>
                  추출된 예약 정보
                </h3>
                <ActionButton
                  className="secondary"
                  onClick={() => setShowDataPanel(false)}
                  style={{ padding: "6px 10px", fontSize: "13px" }}
                >
                  <IoCloseOutline size={16} />
                </ActionButton>
              </div>

              <DataItem>
                <DataLabel>예약번호</DataLabel>
                <DataValue>
                  #{extractedData.bookingNumber || "번호없음"}
                </DataValue>
              </DataItem>

              <DataItem>
                <DataLabel>예약자</DataLabel>
                <DataValue>{extractedData.title}</DataValue>
              </DataItem>

              <DataItem>
                <DataLabel>연락처</DataLabel>
                <DataValue>{extractedData.phone || "연락처 없음"}</DataValue>
              </DataItem>

              <DataItem>
                <DataLabel>이용일시</DataLabel>
                <DataValue>
                  {extractedData.date} {extractedData.startTime} ~{" "}
                  {extractedData.endTime}
                </DataValue>
              </DataItem>

              <DataItem>
                <DataLabel>상품</DataLabel>
                <DataValue>{extractedData.service || "없음"}</DataValue>
              </DataItem>

              <DataItem>
                <DataLabel>요청사항</DataLabel>
                <DataValue>{extractedData.notes || "없음"}</DataValue>
              </DataItem>

              <DataItem>
                <DataLabel>담당자</DataLabel>
                <StaffDropdown
                  value={selectedStaff.id}
                  onChange={handleStaffChange}
                >
                  {staffList.map((staff) => (
                    <StaffOption key={staff.id} value={staff.id}>
                      {staff.name}
                    </StaffOption>
                  ))}
                </StaffDropdown>
              </DataItem>

              <DataItem>
                <DataLabel>등록노트</DataLabel>
                <DataValue
                  style={{ backgroundColor: "#f0f9ff", color: "#2b6cb0" }}
                >
                  {`[네이버예약] ${extractedData.notes || ""} (연락처: ${
                    extractedData.phone || ""
                  }, 서비스: ${extractedData.service || ""})`.trim()}
                </DataValue>
              </DataItem>

              <ButtonGroup
                style={{
                  marginTop: "20px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <ActionButton
                  className="secondary"
                  onClick={() => setShowDataPanel(false)}
                >
                  취소
                </ActionButton>
                <ActionButton className="primary" onClick={handleBulkRegister}>
                  <IoCheckmarkCircleOutline
                    size={18}
                    style={{ marginRight: "4px" }}
                  />
                  예약 등록하기
                </ActionButton>
              </ButtonGroup>
            </ExtractedDataContainer>
          )}
        </WebViewContainer>

        <ControlPanel>
          <ReservationStatus>
            {isExtracting ? (
              <>
                <SpinningIcon style={{ marginRight: "8px" }} /> 예약 데이터 추출
                중...
              </>
            ) : (
              <>
                {reservations.length > 0
                  ? `예약 정보 ${reservations.length}건이 로드되었습니다. 스크롤이 반영되지 않아 일부 예약 정보가 누락되었을 수 있습니다.`
                  : "실제 네이버 예약 정보를 불러오려면 '예약 추출하기' 버튼을 클릭하세요"}
              </>
            )}
          </ReservationStatus>
          <ButtonGroup>
            {reservations.length > 0 && (
              <ActionButton
                className="secondary"
                onClick={() => setShowReservationList(!showReservationList)}
              >
                {showReservationList ? (
                  <>
                    <IoCloseOutline /> 목록 닫기
                  </>
                ) : (
                  <>
                    <IoOpenOutline /> 목록 보기
                  </>
                )}
              </ActionButton>
            )}
            <ActionButton
              className="primary"
              onClick={handleExtractData}
              title="실제 로그인된 네이버 예약 페이지에서만 데이터를 추출합니다"
            >
              {isExtracting ? (
                <>
                  <SpinningIcon /> 추출 중...
                </>
              ) : (
                <>
                  <IoDownloadOutline /> 예약 추출하기
                </>
              )}
            </ActionButton>
          </ButtonGroup>
        </ControlPanel>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default NaverReservationViewer;
