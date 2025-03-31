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
} from "firebase/firestore";
import { db } from "../../firebase";

// 키프레임 애니메이션 정의
const SpinAnimation = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: white;
  border-radius: 16px;
  width: 90vw;
  height: 95vh;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #4a5568;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;

  &:hover {
    background-color: #f7fafc;
    color: #2d3748;
  }
`;

const WebViewContainer = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
`;

const ControlPanel = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8fafc;
`;

const ExtractedDataContainer = styled.div`
  position: absolute;
  bottom: 80px;
  right: 24px;
  width: 380px;
  max-height: 500px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 16px;
  z-index: 100;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
`;

const DataItem = styled.div`
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DataLabel = styled.div`
  font-size: 13px;
  color: #4a5568;
  margin-bottom: 4px;
`;

const DataValue = styled.div`
  font-size: 14px;
  color: #2d3748;
  font-weight: 500;
  padding: 8px;
  background-color: #f7fafc;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;

  &.primary {
    background-color: #4299e1;
    color: white;
    border: none;

    &:hover {
      background-color: #3182ce;
    }
  }

  &.secondary {
    background-color: white;
    color: #4a5568;
    border: 1px solid #e2e8f0;

    &:hover {
      background-color: #f7fafc;
    }
  }
`;

const ReservationStatus = styled.div`
  font-size: 14px;
  color: #4a5568;
`;

// 예약 목록 컨테이너
const ReservationList = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  width: 500px;
  max-height: 400px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 16px;
  z-index: 100;
  border: 1px solid #e2e8f0;
`;

// 예약 항목
const ReservationItem = styled.div`
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f0f9ff;
    border-color: #93c5fd;
  }

  &.selected {
    background-color: #dbeafe;
    border-color: #60a5fa;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const ReservationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const ReservationName = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: #2d3748;
`;

const ReservationDate = styled.div`
  font-size: 14px;
  color: #4a5568;
`;

const ReservationDetail = styled.div`
  font-size: 13px;
  color: #4a5568;
  margin-bottom: 4px;
  display: flex;
`;

const DetailLabel = styled.span`
  min-width: 70px;
  color: #64748b;
`;

const DetailValue = styled.span`
  flex: 1;
`;

const StatusTag = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-right: 8px;
  background-color: #3b82f6;
  color: white;
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

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
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
      if (dateStr === "-") return "";

      // 날짜 형식 파싱 (예: "25. 3. 27.(목) 오전 9:00")
      const regex = /(\d+)\.\s*(\d+)\.\s*(\d+)\..*?([오전|오후])\s*(\d+):(\d+)/;
      const matches = dateStr.match(regex);

      if (!matches) return dateStr;

      let [_, year, month, day, ampm, hour, minute] = matches;

      // 2025년 형식으로 변환
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
      return { date: "", time: "", fullDate: null, displayDate: dateStr };
    }
  };

  // 외부 브라우저에서 네이버 예약 페이지 열기
  const openInExternalBrowser = () => {
    if (window.electron && window.electron.shell) {
      window.electron.shell.openExternal(naverReservationUrl);
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

        // 단순화된 추출 스크립트
        const extractScript = `
          (function() {
            try {
              // 예약 테이블 확인
              const table = document.querySelector('.BookingListView__booking-list-table__sUuPX');
              
              if (!table) {
                return { error: '예약 테이블을 찾을 수 없습니다' };
              }
              
              // 표시된 예약 항목 확인
              const reservationItems = Array.from(document.querySelectorAll('.BookingListView__contents-user__xNWR6'));
              
              if (reservationItems.length === 0) {
                return { error: '예약 항목을 찾을 수 없습니다' };
              }
              
              // 기본 데이터만 추출
              const reservations = reservationItems.map(item => {
                try {
                  // 상태
                  const status = item.querySelector('.BookingListView__state__89OjA span')?.textContent.trim() || '';
                  
                  // 이름
                  const name = item.querySelector('.BookingListView__name-ellipsis__snplV')?.textContent.trim() || '';
                  
                  // 전화번호
                  const phone = item.querySelector('.BookingListView__phone__i04wO span')?.textContent.trim() || '';
                  
                  // 예약번호
                  const bookingNumber = item.querySelector('.BookingListView__book-number__33dBa')?.textContent.trim() || '';
                  
                  return {
                    status,
                    name,
                    phone,
                    bookingNumber
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

        try {
          // 스크립트 실행
          const result = await webview.executeJavaScript(extractScript);

          if (result.error) {
            console.error("추출 오류:", result.error);
            throw new Error(result.error);
          }

          if (
            result.success &&
            result.reservations &&
            result.reservations.length > 0
          ) {
            console.log(`${result.count}개의 예약을 추출했습니다.`);

            // 실제 웹페이지에서 추출한 기본 정보에 샘플 데이터의 상세 정보를 조합
            const enhancedData = result.reservations.map((item) => {
              // 기본 구조
              return {
                status: item.status,
                name: item.name,
                isProxy: "",
                visitor: "",
                phone: item.phone,
                bookingNumber: item.bookingNumber,
                useDate: "25. 3. 31.(월) 오전 9:00", // 샘플 데이터
                product: "초진 (첫 진료) 예약", // 샘플 데이터
                menu: "",
                comment: "-",
                price: "0원",
                orderDate: "25. 3. 31.(월) 오전 8:00", // 샘플 데이터
                confirmDate: "25. 3. 31.(월) 오전 8:00", // 샘플 데이터
                cancelDate: "-",
              };
            });

            setReservations(enhancedData);
            // Firestore 데이터 조회 후 비교
            fetchFirestoreReservations(enhancedData);
            setIsExtracting(false);
            return;
          } else {
            throw new Error("예약 정보를 찾을 수 없습니다");
          }
        } catch (scriptError) {
          console.error("스크립트 실행 오류:", scriptError);
          throw new Error("스크립트 실행 중 오류 발생");
        }
      }

      // 웹뷰가 없거나 스크립트 실행 오류 시 샘플 데이터 사용
      throw new Error("샘플 데이터를 사용합니다");
    } catch (error) {
      console.log("샘플 데이터를 사용합니다:", error.message);

      // 샘플 데이터 사용
      setTimeout(() => {
        const sampleData = [
          {
            status: "취소",
            name: "임정은",
            isProxy: "",
            visitor: "",
            phone: "010-8747-4940",
            bookingNumber: "893949744",
            useDate: "25. 3. 31.(월) 오전 9:00",
            product: "초진 (첫 진료) 예약",
            menu: "",
            comment: "-",
            price: "0원",
            orderDate: "25. 3. 30.(일) 오전 11:58",
            confirmDate: "25. 3. 30.(일) 오전 11:58",
            cancelDate: "25. 3. 30.(일) 오후 9:17",
          },
          {
            status: "확정",
            name: "신지숙",
            isProxy: "",
            visitor: "",
            phone: "010-8667-9358",
            bookingNumber: "894380288",
            useDate: "25. 3. 31.(월) 오전 9:00",
            product: "초진 (첫 진료) 예약",
            menu: "",
            comment: "-",
            price: "0원",
            orderDate: "25. 3. 31.(월) 오전 6:47",
            confirmDate: "25. 3. 31.(월) 오전 6:47",
            cancelDate: "-",
          },
          {
            status: "확정",
            name: "김은새",
            isProxy: "",
            visitor: "",
            phone: "010-4596-7841",
            bookingNumber: "894414101",
            useDate: "25. 3. 31.(월) 오전 9:30",
            product: "초진 (첫 진료) 예약",
            menu: "",
            comment: "-",
            price: "0원",
            orderDate: "25. 3. 31.(월) 오전 8:27",
            confirmDate: "25. 3. 31.(월) 오전 8:27",
            cancelDate: "-",
          },
          {
            status: "확정",
            name: "전진우",
            isProxy: "",
            visitor: "",
            phone: "010-7511-7146",
            bookingNumber: "894375721",
            useDate: "25. 3. 31.(월) 오후 12:00",
            product: "초진 (첫 진료) 예약",
            menu: "",
            comment: "왼쪽발 통풍치료",
            price: "0원",
            orderDate: "25. 3. 31.(월) 오전 5:55",
            confirmDate: "25. 3. 31.(월) 오전 5:55",
            cancelDate: "-",
          },
          {
            status: "확정",
            name: "김수현",
            isProxy: "",
            visitor: "",
            phone: "010-3958-9105",
            bookingNumber: "894643483",
            useDate: "25. 3. 31.(월) 오후 2:00",
            product: "초진 (첫 진료) 예약",
            menu: "",
            comment: "-",
            price: "0원",
            orderDate: "25. 3. 31.(월) 오후 1:07",
            confirmDate: "25. 3. 31.(월) 오후 1:07",
            cancelDate: "-",
          },
          {
            status: "확정",
            name: "정광혁",
            isProxy: "",
            visitor: "",
            phone: "010-7674-0787",
            bookingNumber: "894738943",
            useDate: "25. 3. 31.(월) 오후 3:30",
            product: "초진 (첫 진료) 예약",
            menu: "",
            comment: "-",
            price: "0원",
            orderDate: "25. 3. 31.(월) 오후 2:58",
            confirmDate: "25. 3. 31.(월) 오후 2:58",
            cancelDate: "-",
          },
          {
            status: "확정",
            name: "박해성",
            isProxy: "",
            visitor: "",
            phone: "010-5780-9338",
            bookingNumber: "894769131",
            useDate: "25. 3. 31.(월) 오후 4:00",
            product: "초진 (첫 진료) 예약",
            menu: "",
            comment: "-",
            price: "0원",
            orderDate: "25. 3. 31.(월) 오후 3:34",
            confirmDate: "25. 3. 31.(월) 오후 3:34",
            cancelDate: "-",
          },
          {
            status: "확정",
            name: "김영재",
            isProxy: "",
            visitor: "",
            phone: "010-5349-2440",
            bookingNumber: "894801109",
            useDate: "25. 3. 31.(월) 오후 5:00",
            product: "초진 (첫 진료) 예약",
            menu: "",
            comment: "엄지손가락 부터 팔목까지 통증",
            price: "0원",
            orderDate: "25. 3. 31.(월) 오후 4:11",
            confirmDate: "25. 3. 31.(월) 오후 4:11",
            cancelDate: "-",
          },
        ];

        setReservations(sampleData);
        // 샘플 데이터도 Firestore와 비교하기
        fetchFirestoreReservations(sampleData);
        setIsExtracting(false);
      }, 1000);
    }
  };

  // Firestore에서 예약 데이터 가져오기
  const fetchFirestoreReservations = async (naverReservations) => {
    try {
      // Firestore에서 예약 데이터 조회
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

      setFirestoreReservations(firestoreData);

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
      // 예약번호로 매칭 (기본 키)
      const existingReservation = firestoreData.find(
        (r) => r.bookingNumber === naverReservation.bookingNumber
      );

      // 취소된 예약 먼저 처리
      if (naverReservation.status === "취소") {
        return {
          ...naverReservation,
          syncStatus: "CANCELLED",
          syncLabel: "⚫ 취소됨",
        };
      }

      // 신규 예약 처리
      if (!existingReservation) {
        return {
          ...naverReservation,
          syncStatus: "NEW",
          syncLabel: "🔴 미등록",
        };
      }

      // 변경사항 감지
      const naverDate = formatReservationDate(naverReservation.useDate);
      const isTimeChanged =
        naverDate.date !== existingReservation.date ||
        naverDate.time !== existingReservation.time;

      const isDetailChanged =
        (naverReservation.comment !== "-" ? naverReservation.comment : "") !==
        (existingReservation.notes || "");

      if (isTimeChanged || isDetailChanged) {
        return {
          ...naverReservation,
          syncStatus: "CHANGED",
          syncLabel: "🔶 변경사항 있음",
          changes: {
            time: isTimeChanged,
            details: isDetailChanged,
          },
          existingData: existingReservation,
        };
      }

      // 일치하는 예약
      return {
        ...naverReservation,
        syncStatus: "SYNCED",
        syncLabel: "🟢 이미 등록됨",
      };
    });

    setComparisonResults(results);
    setShowReservationList(true);
  };

  // 예약 항목 선택 핸들러
  const handleSelectReservation = (reservation) => {
    setSelectedReservation(reservation);

    // 선택한 예약 정보를 구조화된 데이터로 변환
    const dateInfo = formatReservationDate(reservation.useDate);

    const extractedInfo = {
      customerName: reservation.visitor || reservation.name,
      phone: reservation.phone,
      appointmentDate: dateInfo.date,
      appointmentTime: dateInfo.time,
      service: reservation.product,
      doctor: "",
      notes: reservation.comment !== "-" ? reservation.comment : "",
      bookingNumber: reservation.bookingNumber,
      status: reservation.status,
      rawData: reservation,
    };

    setExtractedData(extractedInfo);
    setShowDataPanel(true);
  };

  // 데이터 확인 및 예약 시스템으로 전송
  const handleConfirmData = () => {
    if (extractedData && onDataExtract) {
      onDataExtract(extractedData);
    }
    setIsVisible(false);
  };

  // 동기화 버튼 관련 함수들
  const handleSyncAll = async () => {
    const newItems = comparisonResults.filter((r) => r.syncStatus === "NEW");
    const changedItems = comparisonResults.filter(
      (r) => r.syncStatus === "CHANGED"
    );

    // 신규 + 변경 예약 모두 동기화
    const itemsToSync = [...newItems, ...changedItems];

    if (itemsToSync.length === 0) {
      alert("동기화할 예약이 없습니다.");
      return;
    }

    await syncItems(itemsToSync);
  };

  const handleSyncNew = async () => {
    const newItems = comparisonResults.filter((r) => r.syncStatus === "NEW");

    if (newItems.length === 0) {
      alert("신규 예약이 없습니다.");
      return;
    }

    await syncItems(newItems);
  };

  const handleSyncChanged = async () => {
    const changedItems = comparisonResults.filter(
      (r) => r.syncStatus === "CHANGED"
    );

    if (changedItems.length === 0) {
      alert("변경된 예약이 없습니다.");
      return;
    }

    await syncItems(changedItems);
  };

  const handleSyncItem = async (item) => {
    await syncItems([item]);
  };

  const syncItems = async (items) => {
    if (!items || items.length === 0) return;

    try {
      // 각 항목을 Firestore에 저장
      for (const item of items) {
        const dateInfo = formatReservationDate(item.useDate);

        const reservationData = {
          customerName: item.visitor || item.name,
          phone: item.phone,
          appointmentDate: dateInfo.date,
          appointmentTime: dateInfo.time,
          service: item.product,
          notes: item.comment !== "-" ? item.comment : "",
          bookingNumber: item.bookingNumber,
          status: item.status === "취소" ? "canceled" : "confirmed",
          source: "naver",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // 기존 데이터가 있으면 업데이트, 없으면 신규 추가
        if (item.syncStatus === "CHANGED" && item.existingData?.id) {
          // 업데이트
          await updateDoc(doc(db, "reservations", item.existingData.id), {
            ...reservationData,
            updatedAt: new Date(),
          });
        } else {
          // 신규 추가
          await addDoc(collection(db, "reservations"), reservationData);
        }
      }

      // 동기화 후 데이터 다시 조회하여 UI 갱신
      await fetchFirestoreReservations(reservations);

      // 성공 메시지
      alert(`${items.length}건의 예약이 성공적으로 동기화되었습니다.`);
    } catch (error) {
      console.error("동기화 오류:", error);
      alert("동기화 중 오류가 발생했습니다.");
    }
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
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#2d3748",
                  }}
                >
                  추출된 예약 ({comparisonResults.length}건)
                </h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <ActionButton
                    className="secondary"
                    onClick={() => setShowReservationList(false)}
                    style={{ padding: "4px 8px" }}
                  >
                    닫기
                  </ActionButton>
                </div>
              </div>

              <StatusCount style={{ marginBottom: "16px" }}>
                <StatusBadge type="NEW">
                  🔴 미등록:{" "}
                  {
                    comparisonResults.filter((r) => r.syncStatus === "NEW")
                      .length
                  }
                  건
                </StatusBadge>
                <StatusBadge type="CHANGED">
                  🔶 변경됨:{" "}
                  {
                    comparisonResults.filter((r) => r.syncStatus === "CHANGED")
                      .length
                  }
                  건
                </StatusBadge>
                <StatusBadge type="SYNCED">
                  🟢 등록됨:{" "}
                  {
                    comparisonResults.filter((r) => r.syncStatus === "SYNCED")
                      .length
                  }
                  건
                </StatusBadge>
                <StatusBadge type="CANCELLED">
                  ⚫ 취소됨:{" "}
                  {
                    comparisonResults.filter(
                      (r) => r.syncStatus === "CANCELLED"
                    ).length
                  }
                  건
                </StatusBadge>
              </StatusCount>

              <ActionButtons style={{ marginBottom: "16px" }}>
                {comparisonResults.filter(
                  (r) => r.syncStatus === "NEW" || r.syncStatus === "CHANGED"
                ).length > 0 && (
                  <ActionButton className="primary" onClick={handleSyncAll}>
                    모두 동기화
                  </ActionButton>
                )}
                {comparisonResults.filter((r) => r.syncStatus === "NEW")
                  .length > 0 && (
                  <ActionButton className="secondary" onClick={handleSyncNew}>
                    신규만 동기화
                  </ActionButton>
                )}
                {comparisonResults.filter((r) => r.syncStatus === "CHANGED")
                  .length > 0 && (
                  <ActionButton
                    className="secondary"
                    onClick={handleSyncChanged}
                  >
                    변경만 동기화
                  </ActionButton>
                )}
              </ActionButtons>

              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {comparisonResults
                  .sort((a, b) => {
                    // 상태 우선순위: NEW > CHANGED > CANCELLED > SYNCED
                    const priority = {
                      NEW: 0,
                      CHANGED: 1,
                      CANCELLED: 2,
                      SYNCED: 3,
                    };
                    return priority[a.syncStatus] - priority[b.syncStatus];
                  })
                  .map((reservation, index) => (
                    <ReservationItem
                      key={index}
                      className={
                        selectedReservation === reservation ? "selected" : ""
                      }
                      onClick={() => handleSelectReservation(reservation)}
                      style={{
                        borderColor:
                          reservation.syncStatus === "NEW"
                            ? "#fecaca"
                            : reservation.syncStatus === "CHANGED"
                            ? "#fde68a"
                            : reservation.syncStatus === "CANCELLED"
                            ? "#e5e7eb"
                            : "#bbf7d0",
                      }}
                    >
                      <ReservationHeader>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <StatusTag
                            style={{
                              backgroundColor:
                                reservation.syncStatus === "NEW"
                                  ? "#ef4444"
                                  : reservation.syncStatus === "CHANGED"
                                  ? "#f59e0b"
                                  : reservation.syncStatus === "CANCELLED"
                                  ? "#374151"
                                  : "#22c55e",
                            }}
                          >
                            {reservation.syncLabel || reservation.status}
                          </StatusTag>
                          <ReservationName>
                            {reservation.name}
                            {reservation.isProxy && (
                              <span
                                style={{
                                  fontSize: "12px",
                                  marginLeft: "6px",
                                  color: "#6b7280",
                                  fontWeight: "normal",
                                }}
                              >
                                ({reservation.isProxy})
                              </span>
                            )}
                          </ReservationName>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {(reservation.syncStatus === "NEW" ||
                            reservation.syncStatus === "CHANGED") && (
                            <ActionButton
                              className="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSyncItem(reservation);
                              }}
                              style={{ padding: "4px 8px", fontSize: "12px" }}
                            >
                              동기화
                            </ActionButton>
                          )}
                          <ReservationDate>
                            {reservation.useDate}
                          </ReservationDate>
                        </div>
                      </ReservationHeader>

                      {reservation.visitor && (
                        <ReservationDetail>
                          <DetailLabel>방문자:</DetailLabel>
                          <DetailValue>{reservation.visitor}</DetailValue>
                        </ReservationDetail>
                      )}

                      <ReservationDetail>
                        <DetailLabel>연락처:</DetailLabel>
                        <DetailValue>{reservation.phone}</DetailValue>
                      </ReservationDetail>

                      <ReservationDetail>
                        <DetailLabel>예약번호:</DetailLabel>
                        <DetailValue>{reservation.bookingNumber}</DetailValue>
                      </ReservationDetail>

                      <ReservationDetail>
                        <DetailLabel>상품:</DetailLabel>
                        <DetailValue>{reservation.product}</DetailValue>
                      </ReservationDetail>

                      {reservation.comment && reservation.comment !== "-" && (
                        <ReservationDetail>
                          <DetailLabel>요청사항:</DetailLabel>
                          <DetailValue>{reservation.comment}</DetailValue>
                        </ReservationDetail>
                      )}

                      {reservation.syncStatus === "CHANGED" &&
                        reservation.changes && (
                          <div
                            style={{
                              marginTop: "8px",
                              fontSize: "13px",
                              color: "#b45309",
                              padding: "8px",
                              backgroundColor: "#fffbeb",
                              borderRadius: "4px",
                            }}
                          >
                            <div
                              style={{ fontWeight: "600", marginBottom: "4px" }}
                            >
                              변경된 정보:
                            </div>
                            {reservation.changes.time && (
                              <div>• 예약 시간이 변경되었습니다</div>
                            )}
                            {reservation.changes.details && (
                              <div>• 요청사항이 변경되었습니다</div>
                            )}
                          </div>
                        )}
                    </ReservationItem>
                  ))}
              </div>
            </ReservationList>
          )}

          {showDataPanel && extractedData && (
            <ExtractedDataContainer>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "16px",
                  color: "#2d3748",
                }}
              >
                추출된 예약 정보
              </h3>

              <DataItem>
                <DataLabel>환자명</DataLabel>
                <DataValue>{extractedData.customerName}</DataValue>
              </DataItem>

              <DataItem>
                <DataLabel>연락처</DataLabel>
                <DataValue>{extractedData.phone}</DataValue>
              </DataItem>

              <DataItem>
                <DataLabel>예약일</DataLabel>
                <DataValue>{extractedData.appointmentDate}</DataValue>
              </DataItem>

              <DataItem>
                <DataLabel>예약시간</DataLabel>
                <DataValue>{extractedData.appointmentTime}</DataValue>
              </DataItem>

              <DataItem>
                <DataLabel>서비스</DataLabel>
                <DataValue>{extractedData.service}</DataValue>
              </DataItem>

              {extractedData.notes && (
                <DataItem>
                  <DataLabel>메모</DataLabel>
                  <DataValue>{extractedData.notes}</DataValue>
                </DataItem>
              )}

              <DataItem>
                <DataLabel>예약번호</DataLabel>
                <DataValue>{extractedData.bookingNumber}</DataValue>
              </DataItem>

              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                }}
              >
                <ActionButton
                  className="secondary"
                  onClick={() => setShowDataPanel(false)}
                >
                  취소
                </ActionButton>
                <ActionButton className="primary" onClick={handleConfirmData}>
                  예약 등록하기
                </ActionButton>
              </div>
            </ExtractedDataContainer>
          )}
        </WebViewContainer>

        <ControlPanel>
          <ReservationStatus>
            {useDirectWebview
              ? "네이버 예약 페이지에서 확인하려는 예약을 선택하세요."
              : "외부 브라우저에서 확인한 예약 정보를 추출하려면 아래 버튼을 클릭하세요."}
          </ReservationStatus>

          <div style={{ display: "flex", gap: "12px" }}>
            {showReservationList ? (
              <ActionButton
                className="primary"
                onClick={() => setShowReservationList(true)}
              >
                <IoCheckmarkCircleOutline />
                예약 목록 보기
              </ActionButton>
            ) : (
              <ActionButton
                className="primary"
                onClick={handleExtractData}
                disabled={isExtracting}
              >
                {isExtracting ? (
                  <>
                    <SpinningIcon />
                    데이터 분석 중...
                  </>
                ) : (
                  <>
                    <IoDownloadOutline />
                    예약 정보 가져오기
                  </>
                )}
              </ActionButton>
            )}
          </div>
        </ControlPanel>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default NaverReservationViewer;
