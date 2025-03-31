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
  height: 85vh;
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
  bottom: 80px;
  right: 24px;
  width: 500px;
  max-height: 600px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 16px;
  z-index: 100;
  overflow-y: auto;
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

const NaverReservationViewer = ({ isVisible, setIsVisible, onDataExtract }) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [showDataPanel, setShowDataPanel] = useState(false);
  const [useDirectWebview, setUseDirectWebview] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showReservationList, setShowReservationList] = useState(false);
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
        webview.executeJavaScript(`
          // 로그인 폼 자동 감지 및 표시 향상
          function checkForLoginForm() {
            const loginForms = document.querySelectorAll('form[action*="login"]');
            console.log('로그인 폼 감지:', loginForms.length);
          }
          
          // 현재 페이지에서도 확인
          checkForLoginForm();
        `);
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

        const extractScript = `
          // 예약 목록 추출
          function extractReservations() {
            try {
              // 먼저 DOM에서 요소 찾기
              const bookingListContainers = document.querySelectorAll('.BookingListView__list-contents__g037Y');
              const bookingItems = document.querySelectorAll('.BookingListView__contents-user__xNWR6');
              
              console.log('예약 컨테이너:', bookingListContainers.length, '예약 항목:', bookingItems.length);
              
              if (!bookingItems || bookingItems.length === 0) {
                // 다른 HTML 구조 시도 (고객의 코드에 기반한 선택자)
                const fallbackItems = document.querySelectorAll('.BookingListView__contents-user__xNWR6, [class*="contents-user"]');
                console.log('대체 선택자로 찾은 항목:', fallbackItems.length);
                
                if (fallbackItems.length === 0) {
                  // 모든 예약 관련 클래스 디버깅
                  const allElements = Array.from(document.querySelectorAll('*'))
                    .filter(el => el.className && typeof el.className === 'string' && 
                      (el.className.includes('Booking') || el.className.includes('booking')));
                  
                  console.log('모든 Booking 관련 요소:', allElements.length);
                  
                  // 가장 유사한 HTML 구조 출력
                  document.body.innerHTML = document.body.innerHTML;
                  
                  return { error: '예약 항목을 찾을 수 없습니다. 페이지가 로딩되었는지 확인하세요.' };
                }
              }
              
              // 예약 목록 테이블 직접 찾기
              const table = document.querySelector('.BookingListView__booking-list-table__sUuPX') || 
                            document.querySelector('[class*="booking-list-table"]');
              
              if (table) {
                console.log('예약 테이블 찾음');
              }
              
              // 예약 정보 추출
              const reservations = [];
              
              // 각 예약 행 처리
              bookingItems.forEach((item, index) => {
                try {
                  // 예약 상태
                  const statusEl = item.querySelector('.BookingListView__state__89OjA span') || 
                                  item.querySelector('[class*="state"] span');
                  const status = statusEl ? statusEl.textContent.trim() : '';
                  
                  // 예약자 이름
                  const nameEl = item.querySelector('.BookingListView__name-ellipsis__snplV') || 
                                item.querySelector('[class*="name-ellipsis"]');
                  const name = nameEl ? nameEl.textContent.trim() : '';
                  
                  // 대리예약 여부
                  const isProxyEl = item.querySelector('.BookingListView__label__BzZL5') || 
                                   item.querySelector('[class*="label"]');
                  const isProxy = isProxyEl ? isProxyEl.textContent.trim() : '';
                  
                  // 방문자 정보
                  const visitorEl = item.querySelector('.BookingListView__sub-text__njwgc') || 
                                   item.querySelector('[class*="sub-text"]');
                  const visitor = visitorEl ? visitorEl.textContent.trim().replace('방문자: ', '') : '';
                  
                  // 전화번호
                  const phoneEl = item.querySelector('.BookingListView__phone__i04wO span') || 
                                 item.querySelector('[class*="phone"] span');
                  const phone = phoneEl ? phoneEl.textContent.trim() : '';
                  
                  // 추가 전화번호
                  const subPhoneEl = item.querySelector('.BookingListView__sub-phone__KQ0jo span') || 
                                    item.querySelector('[class*="sub-phone"] span');
                  const subPhone = subPhoneEl ? subPhoneEl.textContent.trim() : '';
                  
                  // 예약번호
                  const bookingNumberEl = item.querySelector('.BookingListView__book-number__33dBa') || 
                                         item.querySelector('[class*="book-number"]');
                  const bookingNumber = bookingNumberEl ? bookingNumberEl.textContent.trim() : '';
                  
                  // 예약 내용 컨테이너 찾기 (다양한 선택자 시도)
                  const contentEl = item.querySelector('.BookingListView__contents-booking__1ffMf') || 
                                  item.querySelector('[class*="contents-booking"]') ||
                                  item.nextElementSibling;
                  
                  if (contentEl) {
                    // 이용일시
                    const useDateEl = contentEl.querySelector('.BookingListView__book-date__F7BCG') || 
                                     contentEl.querySelector('[class*="book-date"]');
                    const useDate = useDateEl ? useDateEl.textContent.trim() : '';
                    
                    // 상품명
                    const productEl = contentEl.querySelector('.BookingListView__host__a+wPh') || 
                                     contentEl.querySelector('[class*="host"]');
                    const product = productEl ? productEl.textContent.trim() : '';
                    
                    // 시술메뉴
                    const menuEl = contentEl.querySelector('.BookingListView__option__i+0Ta') || 
                                  contentEl.querySelector('[class*="option"]');
                    const menu = menuEl ? (menuEl.getAttribute('title') || menuEl.textContent.trim()) : '';
                    
                    // 요청사항
                    const commentEl = contentEl.querySelector('.BookingListView__comment__-1Fck') || 
                                     contentEl.querySelector('[class*="comment"]');
                    const comment = commentEl ? (commentEl.getAttribute('title') || commentEl.textContent.trim()) : '';
                    
                    // 총금액
                    const priceEl = contentEl.querySelector('.BookingListView__total-price__Y2qoz') || 
                                   contentEl.querySelector('[class*="total-price"]');
                    const price = priceEl ? priceEl.textContent.trim() : '';
                    
                    // 신청일시
                    const orderDateEl = contentEl.querySelector('.BookingListView__order-date__ebBq+') || 
                                       contentEl.querySelector('[class*="order-date"]');
                    const orderDate = orderDateEl ? orderDateEl.textContent.trim() : '';
                    
                    // 확정일시
                    const confirmDateEl = contentEl.querySelector('.BookingListView__order-success-date__XEFuE') || 
                                         contentEl.querySelector('[class*="order-success-date"]');
                    const confirmDate = confirmDateEl ? confirmDateEl.textContent.trim() : '';
                    
                    // 취소일시
                    const cancelDateEl = contentEl.querySelector('.BookingListView__order-cancel-date__-kOfn') || 
                                        contentEl.querySelector('[class*="order-cancel-date"]');
                    const cancelDate = cancelDateEl ? cancelDateEl.textContent.trim() : '';
                    
                    // 예약 정보 객체 생성
                    reservations.push({
                      status,
                      name,
                      isProxy,
                      visitor,
                      phone,
                      subPhone,
                      bookingNumber,
                      useDate,
                      product,
                      menu,
                      comment,
                      price,
                      orderDate,
                      confirmDate,
                      cancelDate
                    });
                  }
                } catch (itemError) {
                  console.error('항목 추출 오류:', itemError);
                }
              });
              
              // 테이블 구조 직접 추출 (대안)
              if (reservations.length === 0 && table) {
                try {
                  const rows = table.querySelectorAll('a[class*="contents-user"]');
                  console.log('테이블 행 개수:', rows.length);
                  
                  rows.forEach(row => {
                    const cells = row.querySelectorAll('[class*="cell"]');
                    if (cells.length >= 5) {
                      const statusCell = cells[1];
                      const nameCell = cells[2];
                      const phoneCell = cells[3];
                      const bookingNumCell = cells[4];
                      
                      const status = statusCell ? statusCell.textContent.trim() : '';
                      const name = nameCell ? nameCell.textContent.trim().replace('방문자:', '').trim() : '';
                      const phone = phoneCell ? phoneCell.textContent.trim() : '';
                      const bookingNumber = bookingNumCell ? bookingNumCell.textContent.trim() : '';
                      
                      // 콘텐츠 영역 찾기
                      const contentRow = row.nextElementSibling;
                      let useDate = '';
                      let product = '';
                      let comment = '';
                      
                      if (contentRow) {
                        const contentCells = contentRow.querySelectorAll('[class*="cell"]');
                        if (contentCells.length >= 5) {
                          useDate = contentCells[0] ? contentCells[0].textContent.trim() : '';
                          product = contentCells[1] ? contentCells[1].textContent.trim() : '';
                          comment = contentCells[3] ? contentCells[3].textContent.trim() : '';
                        }
                      }
                      
                      reservations.push({
                        status,
                        name,
                        isProxy: '',
                        visitor: '',
                        phone,
                        subPhone: '',
                        bookingNumber,
                        useDate,
                        product,
                        menu: '',
                        comment,
                        price: '',
                        orderDate: '',
                        confirmDate: '',
                        cancelDate: ''
                      });
                    }
                  });
                } catch (tableError) {
                  console.error('테이블 추출 오류:', tableError);
                }
              }
              
              // 아무것도 찾지 못한 경우, 텍스트 기반 수동 파싱 시도
              if (reservations.length === 0) {
                // 페이지 텍스트에서 패턴 찾기
                const text = document.body.innerText;
                const statusMatches = text.match(/확정|대기|취소/g) || [];
                
                if (statusMatches.length > 0) {
                  console.log('텍스트에서 상태 패턴 발견:', statusMatches);
                  
                  // 각 상태 주변 텍스트 분석
                  for (const status of statusMatches) {
                    // 이 상태 주변 200자 가져오기
                    const startIndex = text.indexOf(status);
                    if (startIndex !== -1) {
                      const contextText = text.substring(startIndex, startIndex + 200);
                      
                      // 전화번호 패턴 찾기
                      const phoneMatch = contextText.match(/\d{3}-\d{4}-\d{4}/);
                      const phone = phoneMatch ? phoneMatch[0] : '';
                      
                      // 예약일시 패턴 찾기
                      const dateMatch = contextText.match(/\d{2}\.\s*\d{1,2}\.\s*\d{1,2}/);
                      const dateText = dateMatch ? dateMatch[0] : '';
                      
                      // 이름 추정 (비문법적이지만 시도)
                      let name = '';
                      const nameEndIndex = contextText.indexOf(phone);
                      if (nameEndIndex > 0) {
                        const nameStart = Math.max(0, nameEndIndex - 20);
                        const nameContext = contextText.substring(nameStart, nameEndIndex).trim();
                        const nameParts = nameContext.split(/\s+/);
                        if (nameParts.length > 0) {
                          name = nameParts[nameParts.length - 1];
                        }
                      }
                      
                      if (phone || dateText) {
                        reservations.push({
                          status,
                          name: name || '이름 추출 불가',
                          isProxy: '',
                          visitor: '',
                          phone: phone || '번호 추출 불가',
                          bookingNumber: '',
                          useDate: dateText ? dateText + '. 시간 추출 불가' : '날짜 추출 불가',
                          product: '',
                          comment: '',
                          price: '',
                          orderDate: '',
                          confirmDate: '',
                          cancelDate: ''
                        });
                      }
                    }
                  }
                }
              }
              
              return { 
                reservations,
                debug: {
                  foundContainers: bookingListContainers.length,
                  foundItems: bookingItems.length,
                  hasTable: !!table
                }
              };
            } catch (error) {
              console.error('예약 추출 오류:', error);
              return { error: error.toString() };
            }
          }
          
          // 실행 및 결과 반환
          extractReservations();
        `;

        try {
          // 웹뷰에서 추출 스크립트 실행
          const result = await webview.executeJavaScript(extractScript);
          console.log("추출 결과:", result);

          if (result.error) {
            throw new Error(result.error);
          }

          if (result.reservations && result.reservations.length > 0) {
            // 예약 목록 설정
            setReservations(result.reservations);
            setShowReservationList(true);
            setIsExtracting(false);
            return;
          } else {
            console.log("디버그 정보:", result.debug);
            throw new Error(
              "예약 정보를 찾을 수 없습니다. 페이지가 로딩되었는지 확인하세요."
            );
          }
        } catch (scriptError) {
          console.error("스크립트 실행 오류:", scriptError);
          throw new Error(
            "스크립트 실행 중 오류가 발생했습니다: " + scriptError.message
          );
        }
      }

      // 웹뷰를 사용할 수 없는 경우 샘플 데이터 제공
      setTimeout(() => {
        const sampleReservations = [
          {
            status: "확정",
            name: "이예진",
            isProxy: "",
            visitor: "",
            phone: "010-9243-7768",
            bookingNumber: "891408102",
            useDate: "25. 3. 27.(목) 오전 9:00",
            product: "초진 (첫 진료) 예약",
            menu: "",
            comment: "비타민D 주사",
            price: "0원",
            orderDate: "25. 3. 26.(수) 오후 6:20",
            confirmDate: "25. 3. 26.(수) 오후 6:20",
            cancelDate: "-",
          },
          {
            status: "확정",
            name: "이보라",
            isProxy: "대리예약",
            visitor: "안유진",
            phone: "010-9223-8365",
            subPhone: "010-9223-8365",
            bookingNumber: "891537181",
            useDate: "25. 3. 27.(목) 오전 9:30",
            product: "초진 (첫 진료) 예약",
            menu: "",
            comment: "-",
            price: "0원",
            orderDate: "25. 3. 26.(수) 오후 9:51",
            confirmDate: "25. 3. 26.(수) 오후 9:51",
            cancelDate: "-",
          },
          {
            status: "확정",
            name: "고바야시아께미",
            isProxy: "",
            visitor: "",
            phone: "010-5522-2618",
            bookingNumber: "889913194",
            useDate: "25. 3. 27.(목) 오후 2:30",
            product: "초진 (첫 진료) 예약",
            menu: "",
            comment: "-",
            price: "0원",
            orderDate: "25. 3. 24.(월) 오후 6:30",
            confirmDate: "25. 3. 24.(월) 오후 6:30",
            cancelDate: "-",
          },
        ];

        setReservations(sampleReservations);
        setShowReservationList(true);
        setIsExtracting(false);
      }, 1000);
    } catch (error) {
      console.error("데이터 추출 중 오류 발생:", error);
      setIsExtracting(false);
      alert(`데이터 추출 중 오류가 발생했습니다: ${error.message}`);
    }
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

          {showReservationList && reservations.length > 0 && (
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
                  추출된 예약 ({reservations.length}건)
                </h3>
                <ActionButton
                  className="secondary"
                  onClick={() => setShowReservationList(false)}
                  style={{ padding: "4px 8px" }}
                >
                  닫기
                </ActionButton>
              </div>

              <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                {reservations.map((reservation, index) => (
                  <ReservationItem
                    key={index}
                    className={
                      selectedReservation === reservation ? "selected" : ""
                    }
                    onClick={() => handleSelectReservation(reservation)}
                  >
                    <ReservationHeader>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <StatusTag>{reservation.status}</StatusTag>
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
                      <ReservationDate>{reservation.useDate}</ReservationDate>
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
