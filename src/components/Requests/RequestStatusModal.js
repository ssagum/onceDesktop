import React, { useState, useEffect, useRef, useMemo } from "react";
import ModalTemplate from "../common/ModalTemplate";
import { cancel } from "../../assets";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  useDndMonitor,
  MeasuringStrategy,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import {
  collection,
  query,
  orderBy,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useUserLevel } from "../../utils/UserLevelContext";
import VacationModal from "../call/VacationModal";
import StockRequestModal from "../Warehouse/StockRequestModal";
import RequestModal from "../Home/RequestModal";
import { format } from "date-fns";
import ChipText from "../common/ChipText";
import { useToast } from "../../contexts/ToastContext";
import { useFirestore } from "../../hooks/useFirestore";
import VendorModal from "../Warehouse/VendorModal";
import {
  isHospitalOwner,
  isAdministrativeManager,
  canApproveStockRequest,
  canApproveVacation,
  canOrderStock,
  canManageRequest,
} from "../../utils/permissionUtils";

// 애니메이션 스타일 추가
const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.3s ease-out forwards;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.2s ease-out forwards;
  }
  
  .hover-scale {
    transition: transform 0.2s;
  }
  
  .hover-scale:hover {
    transform: scale(1.02);
    z-index: 10;
  }
`;

// Writer 정보 포맷 함수
const formatWriter = (writer) => {
  if (!writer) return "Unknown";
  
  if (typeof writer === 'object') {
    if (writer.name) return writer.name.split('_')[0];
    if (writer.displayName) return writer.displayName.split('_')[0];
    return "Unknown";
  }
  
  if (Array.isArray(writer) && writer.length > 0) {
    const firstWriter = writer[0];
    return firstWriter ? firstWriter.split('_')[0] : "Unknown";
  }
  
  return typeof writer === 'string' ? writer.split('_')[0] : writer || "Unknown";
};

// 아이템 상세 모달 컴포넌트
const ItemDetailModal = ({
  isVisible,
  setIsVisible,
  item,
  itemType,
  isAdmin,
  onStatusChange,
  verifiedItems,
}) => {
  const { userLevelData, currentUser } = useUserLevel();
  const { showToast } = useToast();
  const [reason, setReason] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(""); // 현재 상태를 저장할 변수 추가

  // 전역에서 모달 닫기 함수 제공
  window.closeDetailModal = () => {
    setIsVisible(false);
  };

  // 대표원장 여부 확인
  const isOwner = isHospitalOwner(userLevelData, currentUser);

  // 비밀번호 검증 여부 확인 - 원장님인 경우 항상 true
  const isItemVerified = useMemo(() => {
    if (isOwner) return true;
    return itemType === "vacation"
      ? verifiedItems && verifiedItems[item?.id]
      : true;
  }, [itemType, verifiedItems, item?.id, isOwner]);

  useEffect(() => {
    // 모달이 열릴 때 선택된 상태 초기화
    if (isVisible) {
      setSelectedStatus(null);
      setReason("");

      // 휴가 정보이고 원장님이 아니고 검증되지 않은 경우 비밀번호 모달 표시
      if (itemType === "vacation" && !isOwner && !isItemVerified) {
        setShowPasswordModal(true);
      }
    }
  }, [isVisible, itemType, isOwner, isItemVerified]);

  // 비밀번호 확인 처리
  const handlePasswordResult = (success) => {
    if (!success) {
      // 비밀번호가 맞지 않으면 모달 닫기
      setIsVisible(false);
    }
  };

  // 거래처 클릭 핸들러 - 전역 함수로 정의
  const handleVendorClick = async (vendorName) => {
    if (!vendorName) return;

    try {
      // Firestore에서 거래처 데이터 가져오기
      const vendorsRef = query(
        collection(db, "vendors"),
        where("clientName", "==", vendorName)
      );

      const querySnapshot = await getDocs(vendorsRef);
      if (!querySnapshot.empty) {
        const vendorDoc = querySnapshot.docs[0];
        // 메인 컴포넌트의 상태를 사용하기 위해 이벤트를 상위로 전파
        if (typeof globalThis.onceHandleVendorClick === "function") {
          globalThis.onceHandleVendorClick(vendorName);
        } else {
          showToast("거래처 정보 표시 기능을 사용할 수 없습니다.", "error");
        }
      } else {
        showToast("해당 거래처 정보를 찾을 수 없습니다.", "error");
      }
    } catch (error) {
      console.error("거래처 정보 조회 오류:", error);
      showToast("거래처 정보를 불러오는 중 오류가 발생했습니다.", "error");
    }
  };

  // 전역에서 접근 가능하도록 설정
  globalThis.onceHandleVendorClick = handleVendorClick;

  // 모달이 열릴 때 현재 아이템 상태 설정
  useEffect(() => {
    if (item && isVisible) {
      setCurrentStatus(item.status || "대기중");
      setReason("");
      setSelectedStatus(null);
    }
  }, [item, isVisible]);

  // 상태가 없는 경우 처리
  if (!item) return null;

  // 권한 체크 함수 추가
  const checkPermission = (newStatus) => {
    // 승인/반려 권한 체크
    if (newStatus === "승인됨" || newStatus === "반려됨") {
      if (itemType === "vacation") {
        if (!canApproveVacation(userLevelData, currentUser)) {
          showToast("휴가 신청을 승인/반려할 권한이 없습니다.", "error");
          return false;
        }
      } else if (itemType === "stock") {
        if (!canApproveStockRequest(userLevelData, currentUser)) {
          showToast("비품 신청을 승인/반려할 권한이 없습니다.", "error");
          return false;
        }
      } else if (itemType === "request") {
        // 요청 항목은 누구나 상태 변경 가능
        return true;
      }
    }
    // 주문 관련 상태 체크 (비품에만 해당)
    else if (
      ["주문 필요", "주문 완료", "입고 완료"].includes(newStatus) &&
      itemType === "stock"
    ) {
      if (!canOrderStock(userLevelData, currentUser)) {
        showToast("비품 주문 상태를 변경할 권한이 없습니다.", "error");
        return false;
      }
    }

    return true;
  };

  // 아이템 유형별 제목 설정
  const getTitle = () => {
    switch (itemType) {
      case "vacation":
        return getVacationTitle(item);
      case "stock":
        return item.itemName;
      case "request":
        return item.title || "요청";
      default:
        return "상세 정보";
    }
  };

  // 상태 선택 핸들러
  const handleStatusSelect = (newStatus) => {
    // 권한 체크 먼저 수행
    if (!checkPermission(newStatus)) {
      return;
    }

    // 현재 상태와 같은 상태는 선택 불가능하도록 함
    if (newStatus === item.status) {
      showToast(
        `이미 '${newStatus}' 상태입니다. 다른 상태를 선택해주세요.`,
        "warning"
      );
      return;
    }

    // 상태가 같으면 선택 취소, 다르면 상태 선택 및 기본 사유 설정
    if (selectedStatus === newStatus) {
      setSelectedStatus(null);
      setReason("");
    } else {
      setSelectedStatus(newStatus);
      // 기본 사유 설정 (기존 코드 유지)
      switch (newStatus) {
        case "승인됨":
          switch (itemType) {
            case "vacation":
              setReason("검토 후 승인합니다.");
              break;
            case "stock":
              setReason("비품 신청을 승인합니다.");
              break;
            case "request":
              setReason("요청 사항을 확인하고 승인합니다.");
              break;
            default:
              setReason("승인합니다.");
          }
          break;
        case "반려됨":
          switch (itemType) {
            case "vacation":
              setReason("추가 검토가 필요하여 반려합니다.");
              break;
            case "stock":
              setReason("재고 상황을 고려하여 반려합니다.");
              break;
            case "request":
              setReason("검토 후 반려합니다.");
              break;
            default:
              setReason("반려합니다.");
          }
          break;
        case "장바구니":
          setReason("장바구니에 추가합니다.");
          break;
        case "대기중":
          setReason("대기 상태로 변경합니다.");
          break;
        case "주문완료":
          setReason("주문 처리를 완료합니다.");
          break;
        case "완료됨":
          setReason("처리가 완료되었습니다.");
          break;
        case "입고 완료":
          setReason("입고 처리를 완료합니다.");
          break;
        default:
          setReason(`${newStatus} 상태로 변경합니다.`);
      }
    }
  };

  // 사유 입력 핸들러
  const handleReasonChange = (e) => {
    setReason(e.target.value);
  };

  // 상태 변경 확인 핸들러
  const handleStatusConfirm = () => {
    if (!selectedStatus) return; // 선택된 상태가 있어야 함

    if (onStatusChange && reason.trim()) {
      // 1. 상태 변경 함수 호출 (간단히)
      onStatusChange(item.id, selectedStatus, reason);

      // 2. 모달 바로 닫기
      setIsVisible(false);
    } else {
      showToast("사유를 입력해주세요.", "error");
    }
  };

  // 아이템 유형별 상세 정보 렌더링
  const renderDetails = () => {
    if (!item) return null;

    // 휴가 정보이고 대표원장이 아니고 검증되지 않은 경우 내용 마스킹
    if (itemType === "vacation" && !isItemVerified) {
      return (
        <div className="p-4 bg-gray-50 rounded-md text-center">
          <p className="text-gray-500 mb-4">
            <i className="fas fa-lock mr-2"></i>
            비밀번호 인증이 필요합니다
          </p>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 bg-onceBlue text-white rounded-md"
          >
            비밀번호 입력하기
          </button>
        </div>
      );
    }

    switch (itemType) {
      case "vacation":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">신청 유형</h3>
                <p className="text-base">{item.vacationType || "휴가"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">신청자</h3>
                <p className="text-base">{item.userName || "미정"}</p>
              </div>
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-gray-500">기간</h3>
                <p className="text-base">
                  {item.startDate} {item.startTime} ~ {item.endDate}{" "}
                  {item.endTime}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">휴가 일수</h3>
                <p className="text-base">{item.days || 0}일</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">현재 상태</h3>
                <p className={`text-base ${getStatusColor(item.status)}`}>
                  {item.status}
                </p>
              </div>
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-gray-500">사유</h3>
                <p className="text-base bg-gray-50 p-2 rounded-md">
                  {item.reason || "사유 없음"}
                </p>
              </div>
              {item.approvalReason && (
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">
                    승인/반려 사유
                  </h3>
                  <p className="text-base bg-gray-50 p-2 rounded-md">
                    {item.approvalReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      case "stock":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">분류</h3>
                <p className="text-base">{item.category || "미분류"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">신청자</h3>
                <p className="text-base">{item.requestedByName || "미정"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">수량</h3>
                <p className="text-base">
                  {item.quantity || 0} {item.measure || "개"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">단가</h3>
                <p className="text-base">
                  {item.price ? `${item.price.toLocaleString()}원` : "-"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">거래처</h3>
                <p
                  className="text-base cursor-pointer hover:underline text-blue-600"
                  onClick={() => handleVendorClick(item.vendor)}
                >
                  {item.vendor || "-"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">현재 상태</h3>
                <p className={`text-base ${getStatusColor(item.status)}`}>
                  {item.status}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">신청 유형</h3>
                <p className="text-base">
                  {item.requestType === "auto" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      자동 신청
                    </span>
                  ) : item.requestType === "manual" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      수동 신청
                    </span>
                  ) : (
                    "-"
                  )}
                </p>
              </div>
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-gray-500">신청 사유</h3>
                <p className="text-base bg-gray-50 p-2 rounded-md">
                  {item.requestReason || "사유 없음"}
                </p>
              </div>
              {item.approvalReason && (
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">
                    승인/반려 사유
                  </h3>
                  <p className="text-base bg-gray-50 p-2 rounded-md">
                    {item.approvalReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      case "request":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">발신 부서</h3>
                <p className="text-base font-medium bg-gray-100 px-2 py-1 rounded-md">
                  {item.senderDepartment || "미지정"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">수신 부서</h3>
                <p className="text-base font-medium bg-purple-100 text-purple-800 px-2 py-1 rounded-md">
                  {item.receiverDepartment || "미지정"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">중요도</h3>
                <p className="text-base">{item.priority || "중"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">현재 상태</h3>
                <p className={`text-base ${getStatusColor(item.status)}`}>
                  {item.status}
                </p>
              </div>
              <div className="col-span-2 py-1">
                <h3 className="text-sm font-medium text-gray-500">내용</h3>
                <p className="text-base bg-gray-50 p-2 rounded-md line-clamp-2 overflow-hidden text-ellipsis">
                  {item.message || "내용 없음"}
                </p>
              </div>
              {item.approvalReason && (
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">
                    승인/반려 사유
                  </h3>
                  <p className="text-base bg-gray-50 p-2 rounded-md">
                    {item.approvalReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return <div>상세 정보가 없습니다.</div>;
    }
  };

  // 상태에 따른 텍스트 색상 반환
  const getStatusColor = (status) => {
    switch (status) {
      case "반려됨":
        return "text-red-600";
      case "승인됨":
        return "text-blue-600";
      case "대기중":
        return "text-yellow-600";
      case "완료됨":
      case "주문완료":
      case "입고 완료":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[550px] max-h-[80vh] overflow-y-auto p-6 animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">{getTitle()}</h2>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {renderDetails()}

        <div className="mt-8 border-t pt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">상태 변경</h3>
          <div className="flex flex-wrap gap-2">
            {STATUS_FLOW[itemType]?.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusSelect(status)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  selectedStatus === status
                    ? status === "반려됨"
                      ? "bg-red-100 border-2 border-red-400 text-red-700"
                      : status === "승인됨"
                      ? "bg-blue-100 border-2 border-blue-400 text-blue-700"
                      : status === "대기중"
                      ? "bg-yellow-100 border-2 border-yellow-400 text-yellow-700"
                      : status === "장바구니"
                      ? "bg-purple-100 border-2 border-purple-400 text-purple-700"
                      : status === "주문완료" ||
                        status === "완료됨" ||
                        status === "입고 완료"
                      ? "bg-green-100 border-2 border-green-400 text-green-700"
                      : "bg-gray-100 border-2 border-gray-300 text-gray-700"
                    : status === "반려됨"
                    ? "bg-white border border-red-300 text-red-600 hover:bg-red-50"
                    : status === "승인됨"
                    ? "bg-white border border-blue-300 text-blue-600 hover:bg-blue-50"
                    : status === "대기중"
                    ? "bg-white border border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                    : status === "장바구니"
                    ? "bg-white border border-purple-300 text-purple-600 hover:bg-purple-50"
                    : status === "주문완료" ||
                      status === "완료됨" ||
                      status === "입고 완료"
                    ? "bg-white border border-green-300 text-green-600 hover:bg-green-50"
                    : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {selectedStatus && (
            <div className="mt-4 border-t pt-4 animate-fade-in">
              <div className="flex items-center mb-2">
                <h3 className="text-sm font-medium text-gray-500">
                  변경 사유 입력
                </h3>
                <span className="text-xs text-gray-400 ml-2">(필수)</span>
              </div>
              <textarea
                value={reason}
                onChange={handleReasonChange}
                placeholder="사유를 입력해주세요..."
                className="w-full border border-gray-300 rounded-md px-4 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-onceBlue focus:border-transparent mb-2"
              />
              <div className="text-xs text-gray-500 mb-4">
                * 상태 변경 시 사유가 필수적으로 기록됩니다.
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => setIsVisible(false)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            닫기
          </button>
          {selectedStatus && reason.trim() && (
            <button
              onClick={handleStatusConfirm}
              className="bg-onceBlue text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-medium shadow-sm"
            >
              저장
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// 사유 입력 모달 컴포넌트
const ReasonInputModal = ({
  isVisible,
  setIsVisible,
  onSubmit,
  actionType,
  itemType,
}) => {
  const [reason, setReason] = useState("");
  const reasonRef = useRef(null);
  const submitButtonRef = useRef(null);
  const isSubmittingRef = useRef(false);

  // 모달이 열릴 때 입력 필드에 포커스
  useEffect(() => {
    if (isVisible && reasonRef.current) {
      reasonRef.current.focus();

      // 액션 타입에 따라 기본 사유 설정
      const defaultReason = getDefaultReason();
      setReason(defaultReason);
    }

    // 모달이 닫힐 때 제출 중 상태 초기화
    return () => {
      isSubmittingRef.current = false;
    };
  }, [isVisible, actionType, itemType]);

  // 사유 입력 핸들러
  const handleReasonChange = (e) => {
    setReason(e.target.value);
  };

  // 모달 닫을 때 상태 초기화
  const handleClose = () => {
    setReason("");
    setIsVisible(false);
  };

  // 개선된 제출 함수 - 비동기 처리를 통해 입력 내용이 모두 반영되도록 함
  const handleSubmit = () => {
    // 이미 제출 중이면 중복 제출 방지
    if (isSubmittingRef.current) return;

    // 제출 중 상태로 설정
    isSubmittingRef.current = true;

    // 입력이 완전히 적용되도록 약간의 지연 추가
    setTimeout(() => {
      if (onSubmit && reason.trim()) {
        // 직접 Firestore 업데이트
        const { itemId, toStatus } = window.targetStatusChange || {};

        if (itemId && toStatus) {
          // 모달을 먼저 닫아 UX 개선
          handleClose();

          // Firestore 직접 업데이트
          onSubmit(reason)
            .then(() => {
              console.log("사유 제출 및 상태 변경 완료:", toStatus);
              // 상세 모달도 닫기
              if (typeof window.closeDetailModal === "function") {
                window.closeDetailModal();
              }
            })
            .catch((error) => {
              console.error("사유 제출 중 오류:", error);
            });
        } else {
          // 일반적인 경우
          onSubmit(reason);
          handleClose();
        }
      } else {
        handleClose();
      }

      // 제출 중 상태 초기화
      isSubmittingRef.current = false;
    }, 50);
  };

  // 개선된 키 이벤트 핸들러
  const handleKeyDown = (e) => {
    // 이미 제출 중이면 처리하지 않음
    if (isSubmittingRef.current) {
      e.preventDefault();
      return;
    }

    // Enter 키이고 Shift 키가 눌리지 않은 경우 폼 제출
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // 기본 엔터 동작 방지

      // 텍스트가 있을 경우에만 제출
      if (reason.trim()) {
        // 현재 포커스된 요소를 기억
        const activeElement = document.activeElement;

        // 포커스를 blur하여 입력 이벤트가 모두 적용되도록 함
        if (activeElement) {
          activeElement.blur();
        }

        // 비동기 제출로 처리
        handleSubmit();
      }
    }
  };

  // 액션 타입에 따른 타이틀 설정
  const getActionTitle = () => {
    switch (actionType) {
      case "승인됨":
        return "승인 사유";
      case "반려됨":
        return "반려 사유";
      case "장바구니":
        return "장바구니 이동 사유";
      case "대기중":
        return "대기 상태 변경 사유";
      case "주문완료":
        return "주문 완료 사유";
      case "완료됨":
        return "완료 처리 사유";
      case "입고 완료":
        return "입고 완료 사유";
      default:
        return "상태 변경 사유";
    }
  };

  // 아이템 타입에 따른 추가 설명
  const getDescription = () => {
    switch (itemType) {
      case "vacation":
        if (actionType === "반려됨") {
          return "휴가 신청을 반려하는 사유를 입력해주세요.";
        } else if (actionType === "승인됨") {
          return "휴가 신청을 승인하는 사유를 입력해주세요.";
        } else {
          return `휴가 신청을 ${actionType} 상태로 변경하는 사유를 입력해주세요.`;
        }
      case "stock":
        if (actionType === "반려됨") {
          return "비품 신청을 반려하는 사유를 입력해주세요.";
        } else if (actionType === "승인됨") {
          return "비품 신청을 승인하는 사유를 입력해주세요.";
        } else if (actionType === "장바구니") {
          return "비품 신청을 장바구니로 이동하는 사유를 입력해주세요.";
        } else if (actionType === "주문완료") {
          return "비품 주문이 완료된 사유를 입력해주세요.";
        } else if (actionType === "입고 완료") {
          return "비품 입고가 완료된 사유를 입력해주세요.";
        } else {
          return `비품 신청을 ${actionType} 상태로 변경하는 사유를 입력해주세요.`;
        }
      case "request":
        if (actionType === "반려됨") {
          return "요청을 반려하는 사유를 입력해주세요.";
        } else if (actionType === "승인됨") {
          return "요청을 승인하는 사유를 입력해주세요.";
        } else if (actionType === "완료됨") {
          return "요청이 완료된 사유를 입력해주세요.";
        } else {
          return `요청을 ${actionType} 상태로 변경하는 사유를 입력해주세요.`;
        }
      default:
        return `${actionType} 상태로 변경하는 사유를 입력해주세요.`;
    }
  };

  // 액션 타입에 따른 기본 사유 텍스트
  const getDefaultReason = () => {
    switch (actionType) {
      case "승인됨":
        switch (itemType) {
          case "vacation":
            return "검토 후 승인합니다.";
          case "stock":
            return "비품 신청을 승인합니다.";
          case "request":
            return "요청 사항을 확인하고 승인합니다.";
          default:
            return "승인합니다.";
        }
      case "반려됨":
        switch (itemType) {
          case "vacation":
            return "추가 검토가 필요하여 반려합니다.";
          case "stock":
            return "재고 상황을 고려하여 반려합니다.";
          case "request":
            return "검토 후 반려합니다.";
          default:
            return "반려합니다.";
        }
      case "장바구니":
        return "장바구니에 추가합니다.";
      case "대기중":
        return "대기 상태로 변경합니다.";
      case "주문완료":
        return "주문 처리를 완료합니다.";
      case "완료됨":
        return "처리가 완료되었습니다.";
      case "입고 완료":
        return "입고 처리를 완료합니다.";
      default:
        return `${actionType} 상태로 변경합니다.`;
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-white rounded-lg shadow-xl w-[450px] p-6 animate-fade-in-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {getActionTitle()}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <p className="text-gray-600 mb-4">{getDescription()}</p>

        <textarea
          ref={reasonRef}
          value={reason}
          onChange={handleReasonChange}
          onKeyDown={handleKeyDown}
          placeholder="사유를 입력해주세요..."
          className="w-full border border-gray-300 rounded-md px-4 py-2 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
        />

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            ref={submitButtonRef}
            onClick={handleSubmit}
            className="bg-onceBlue text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            disabled={!reason.trim() || isSubmittingRef.current}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

// 전역 상태 변수 추가 - 동시에 여러 요소가 하이라이트되는 문제 방지
let currentHighlightedElement = null;
let globalDragState = {
  isDragging: false,
  activeId: null,
  targetStatus: null,
};

// 비밀번호 입력 모달 컴포넌트 추가
const PasswordModal = ({
  isVisible,
  setIsVisible,
  onPasswordSubmit,
  itemData,
}) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const passwordRef = useRef(null);

  useEffect(() => {
    if (isVisible && passwordRef.current) {
      passwordRef.current.focus();
    }
    // 모달이 열릴 때마다 상태 초기화
    if (isVisible) {
      setPassword("");
      setError("");
    }
  }, [isVisible]);

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    // 숫자만 입력 가능하도록 제한
    if (value === "" || /^\d{0,6}$/.test(value)) {
      setPassword(value);
      if (error) setError("");
    }
  };

  const handleSubmit = () => {
    // 휴가 신청 시 설정한 6자리 비밀번호 확인
    if (itemData?.password && password === itemData.password) {
      onPasswordSubmit(true);
      setIsVisible(false);
    } else {
      setError("비밀번호가 일치하지 않습니다.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[400px] p-6 animate-fade-in-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">휴가 정보 보호</h2>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          휴가 신청 정보를 확인하려면 6자리 비밀번호를 입력해주세요.
        </p>

        <div className="mb-4">
          <input
            ref={passwordRef}
            type="password"
            value={password}
            onChange={handlePasswordChange}
            onKeyDown={handleKeyDown}
            maxLength={6}
            inputMode="numeric"
            placeholder="비밀번호 입력 (6자리)"
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={() => setIsVisible(false)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="bg-onceBlue text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

// 드래그 가능한 항목 컴포넌트
const DraggableItem = ({
  id,
  data,
  type,
  onItemClick,
  isAdmin,
  isVerified = false,
}) => {
  const { userLevelData, currentUser } = useUserLevel();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isVerifiedState, setIsVerifiedState] = useState(isVerified);

  // useEffect를 통해 외부에서 isVerified가 변경되면 내부 상태도 업데이트
  useEffect(() => {
    setIsVerifiedState(isVerified);
  }, [isVerified]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    over,
  } = useSortable({
    id,
    data: {
      type: "item",
      item: data,
      itemType: type,
      id,
      parent: data.status, // 부모 상태 저장
    },
  });

  // 컴포넌트의 ref
  const itemRef = useRef(null);
  const [isBeingHoveredOver, setIsBeingHoveredOver] = useState(false);

  // 대표원장 여부 확인
  const isOwner = useMemo(() => {
    return isHospitalOwner(userLevelData, currentUser);
  }, [userLevelData, currentUser]);

  // 비밀번호 입력 결과 처리
  const handlePasswordResult = (success) => {
    if (success) {
      setIsVerifiedState(true);
      // 비밀번호 확인 후 바로 상세 모달 열기
      if (onItemClick) {
        onItemClick(data);
      }
    }
  };

  // DndContext에서 모니터링을 위한 훅 사용
  const dndContext = useDndMonitor({
    onDragStart() {
      // 드래그 시작 시 전역 상태 초기화
      globalDragState.isDragging = true;
      currentHighlightedElement = null;
    },
    onDragOver({ active, over }) {
      // 아이템 위에 드래그했는지 확인
      const isOverThisItem = over && over.id === id && active.id !== id;

      // 이전 상태와 다를 때만 상태 업데이트 (불필요한 리렌더링 방지)
      if (isOverThisItem !== isBeingHoveredOver) {
        setIsBeingHoveredOver(isOverThisItem);
      }

      if (isOverThisItem) {
        // 부모 드롭 영역 찾기
        const parentDropArea = itemRef.current?.closest(
          '[data-droppable="true"]'
        );

        if (parentDropArea && currentHighlightedElement !== parentDropArea) {
          // 이전에 하이라이트된 요소가 있으면 모두 제거
          if (currentHighlightedElement) {
            currentHighlightedElement.removeAttribute("data-highlight");
            currentHighlightedElement.classList.remove(
              "ring-2",
              "ring-blue-400",
              "bg-blue-50/20",
              "shadow-md",
              "scale-[1.01]",
              "z-10"
            );
          }

          // 현재 영역을 하이라이트하고 전역 참조 업데이트
          currentHighlightedElement = parentDropArea;
          parentDropArea.setAttribute("data-highlight", "true");
          parentDropArea.classList.add(
            "ring-2",
            "ring-blue-400",
            "bg-blue-50/20",
            "shadow-md",
            "scale-[1.01]",
            "z-10"
          );

          // 전역 상태 업데이트
          globalDragState.targetStatus =
            parentDropArea.getAttribute("data-status");
        }
      }
    },
    onDragEnd() {
      // 드래그 종료 시 상태 초기화
      setIsBeingHoveredOver(false);
      globalDragState.isDragging = false;
      globalDragState.targetStatus = null;

      // 하이라이트된 요소 정리
      if (currentHighlightedElement) {
        currentHighlightedElement.removeAttribute("data-highlight");
        currentHighlightedElement.classList.remove(
          "ring-2",
          "ring-blue-400",
          "bg-blue-50/20",
          "shadow-md",
          "scale-[1.01]",
          "z-10"
        );
        currentHighlightedElement = null;
      }

      // 혹시나 남아있는 다른 하이라이트된 요소들도 모두 정리
      document
        .querySelectorAll('[data-highlight="true"], [data-hovered="true"]')
        .forEach((el) => {
          el.removeAttribute("data-highlight");
          el.removeAttribute("data-hovered");
          el.classList.remove(
            "ring-2",
            "ring-blue-400",
            "bg-blue-50/20",
            "shadow-md",
            "scale-[1.01]",
            "z-10"
          );
        });
    },
    onDragCancel() {
      // 드래그 취소 시도 정리 작업 수행
      setIsBeingHoveredOver(false);
      globalDragState.isDragging = false;
      globalDragState.targetStatus = null;

      if (currentHighlightedElement) {
        currentHighlightedElement.removeAttribute("data-highlight");
        currentHighlightedElement.classList.remove(
          "ring-2",
          "ring-blue-400",
          "bg-blue-50/20",
          "shadow-md",
          "scale-[1.01]",
          "z-10"
        );
        currentHighlightedElement = null;
      }
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 9999 : isBeingHoveredOver ? 30 : 1,
    pointerEvents: isDragging ? "none" : "auto",
  };

  // 날짜 포맷 간소화 (YYYY/MM/DD만 표시)
  const formatShortDate = (timestamp) => {
    if (!timestamp) return "";

    const date =
      timestamp instanceof Date
        ? timestamp
        : new Date(
            typeof timestamp === "number" ? timestamp : timestamp.seconds * 1000
          );

    return format(date, "yyyy/MM/dd");
  };

  // 아이템 클릭 핸들러 수정
  const handleItemClick = (e) => {
    if (isDragging) return; // 드래그 중일 때는 클릭 무시
    e.stopPropagation(); // 이벤트 전파 중단

    // 휴가 타입일 때
    if (type === "vacation") {
      // 원장님은 비밀번호 없이 바로 확인 가능
      if (isOwner) {
        setIsVerifiedState(true);
        if (onItemClick) {
          onItemClick(data);
        }
      }
      // 원장님이 아니고 아직 검증되지 않은 경우 비밀번호 입력
      else if (!isVerifiedState) {
        setShowPasswordModal(true);
      }
      // 이미 검증된 경우 바로 열기
      else if (onItemClick) {
        onItemClick(data);
      }
    }
    // 다른 타입은 바로 열기
    else if (onItemClick) {
      onItemClick(data);
    }
  };

  let content;
  switch (type) {
    case "vacation":
      // DraggableItem 상태에서는 원장님도 내용을 볼 수 없도록 마스킹
      // 단, 원장님은 클릭 시 비밀번호 없이 볼 수 있음
      const shouldMask = type === "vacation" && !isVerifiedState;

      // 승인 상태인 경우 신청자 이름은 공개
      const isApproved = data.status === "승인됨";

      content = (
        <>
          <div className="font-medium text-gray-800 text-base mb-2 border-l-4 border-blue-500 pl-2">
            {getVacationTitle(data)}
          </div>

          <div className="flex items-center text-sm text-gray-700 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>
              {data.startDate} ~ {data.endDate}
            </span>
          </div>

          <div
            className="text-sm text-gray-600 mb-2 line-clamp-2"
            title={data.reason}
          >
            {shouldMask ? (
              <div className="flex items-center">
                <span className="text-gray-500">
                  <i className="fas fa-lock mr-1"></i>
                  비밀번호 보호된 내용입니다
                </span>
              </div>
            ) : (
              data.reason
            )}
          </div>

          <div className="flex justify-between items-center mt-1 text-xs text-gray-500 pt-1 border-t border-gray-100">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              {shouldMask && !isApproved ? "***" : data.userName}
            </div>
            <div>{formatShortDate(data.timestamp)}</div>
          </div>

          {shouldMask && (
            <div
              className="text-xs text-blue-500 mt-1 cursor-pointer hover:underline"
              onClick={handleItemClick}
            >
              {isOwner ? "클릭하여 내용 확인" : "비밀번호 입력하여 확인"}
            </div>
          )}
        </>
      );
      break;
    case "stock":
      content = (
        <>
          <div className="font-medium text-gray-800 text-base mb-2 border-l-4 border-green-500 pl-2 truncate" title={data.itemName}>
            {data.itemName}
          </div>

          <div className="flex items-center text-sm text-gray-700 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <span>{data.category}</span>
          </div>

          <div className="flex items-center text-sm text-gray-700 mb-2">
            {data.requestType === "auto" ? (
              <span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full mr-2">
                자동
              </span>
            ) : data.requestType === "manual" ? (
              <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full mr-2">
                수동
              </span>
            ) : null}

            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
              {data.department || "미지정"}
            </span>
          </div>

          {/* 수량, 단가, 총액은 수동 신청일 때만 표시 */}
          {data.requestType !== "auto" && (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                수량: {data.quantity} {data.measure || "개"}
              </span>
              <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                단가:{" "}
                {data.price ? data.price.toLocaleString() + "원" : "미지정"}
              </span>
              {data.price > 0 && data.quantity > 0 && (
                <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                  총액: {(data.price * data.quantity).toLocaleString()}원
                </span>
              )}
            </div>
          )}

          {/* 자동 신청의 경우 간단한 수량 표시 */}
          {data.requestType === "auto" && (
            <div className="text-sm text-gray-600 mb-2">
              필요 수량: {data.quantity} {data.measure || "개"}
            </div>
          )}

          {data.vendor && (
            <div className={`flex items-center text-sm mt-2 text-gray-600`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span>{data.vendor}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-xs text-gray-500 mt-3">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              {formatWriter(data.writer)}
            </div>
            <div>{formatShortDate(data.createdAt)}</div>
          </div>
        </>
      );
      break;
    case "request":
      content = (
        <>
          <div
            className="font-medium text-gray-800 text-base mb-2 border-l-4 border-purple-500 pl-2 truncate flex items-center justify-between"
            title={data.title}
          >
            <span>{data.title || "요청"}</span>
            <span
              className={`text-xs font-bold rounded-full px-2 py-0.5 ml-2 ${
                data.priority === "상"
                  ? "bg-red-100 text-red-800"
                  : data.priority === "중"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {data.priority || "중"}
            </span>
          </div>

          <div className="flex items-center justify-center mb-2 mt-1">
            <div className="flex items-center text-center w-full">
              <span className="flex-1 font-medium text-xs text-gray-700 bg-gray-100 rounded-md px-2 py-1">
                {data.senderDepartment || "발신부서 미상"}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mx-2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
              <span className="flex-1 font-medium text-xs text-purple-800 bg-purple-100 rounded-md px-2 py-1">
                {data.receiverDepartment || "수신부서 미상"}
              </span>
            </div>
          </div>

          <div
            className="text-sm text-gray-600 mb-3 line-clamp-2 bg-gray-50 p-2 rounded-md"
            title={data.message}
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxHeight: "3rem",
            }}
          >
            {data.message}
          </div>

          <div className="flex justify-between items-center mt-1 text-xs text-gray-500 pt-1 border-t border-gray-100">
            <div className="flex items-center text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formatShortDate(data.timestamp)}
            </div>
            <div className="flex items-center text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {data.formattedTime || ""}
            </div>
          </div>
        </>
      );
      break;
    default:
      content = <div>Unknown item type</div>;
  }

  return (
    <>
      <div
        ref={(node) => {
          setNodeRef(node);
          itemRef.current = node;
        }}
        {...attributes}
        {...listeners}
        style={style}
        className={`bg-white p-3 mb-2 rounded-lg shadow-sm cursor-grab border border-gray-200 hover:shadow-md transition-all relative hover-scale ${
          isBeingHoveredOver
            ? "border-blue-500 border-2 bg-blue-50/20 shadow-md"
            : ""
        }`}
        onClick={handleItemClick}
        data-item-id={id}
        data-item-type={type}
        data-parent-status={data.status}
      >
        {content}

        {/* 아이템 위에 드래그 중일 때 드롭 대상 표시 - 크기 축소 */}
        {isBeingHoveredOver && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-blue-500/5 border border-blue-300 pointer-events-none z-10"></div>
        )}
      </div>

      {/* 비밀번호 입력 모달 */}
      <PasswordModal
        isVisible={showPasswordModal}
        setIsVisible={setShowPasswordModal}
        onPasswordSubmit={handlePasswordResult}
        itemData={data}
      />
    </>
  );
};

// 완전히 새로운 드롭 영역 컴포넌트
const DropArea = ({ id, title, items, itemType, renderItem, className }) => {
  const containerRef = useRef(null);

  // Droppable 훅 사용
  const { setNodeRef, isOver, active, over } = useDroppable({
    id,
    data: {
      type: "container",
      accepts: itemType,
      id,
      status: id,
    },
  });

  // 관리자 아닐 때는 드래그 불가능하도록 설정 제거

  // 현재 이 영역 위에 마우스가 있는지 여부를 확인하고 UI 업데이트
  useEffect(() => {
    if (!containerRef.current) return;

    if (isOver) {
      // 다른 하이라이트된 요소들 정리
      if (
        currentHighlightedElement &&
        currentHighlightedElement !== containerRef.current
      ) {
        currentHighlightedElement.removeAttribute("data-highlight");
        currentHighlightedElement.classList.remove(
          "ring-2",
          "ring-blue-400",
          "bg-blue-50/20",
          "shadow-md",
          "scale-[1.01]",
          "z-10"
        );
      }

      // 이 요소를 현재 하이라이트된 요소로 설정
      currentHighlightedElement = containerRef.current;
      containerRef.current.setAttribute("data-hovered", "true");
      globalDragState.targetStatus = id;
    } else if (
      containerRef.current.hasAttribute("data-hovered") &&
      currentHighlightedElement !== containerRef.current
    ) {
      containerRef.current.removeAttribute("data-hovered");
    }

    // 하위 아이템에 부모 상태 정보 전달
    const items = containerRef.current.querySelectorAll("[data-item-id]");
    items.forEach((item) => {
      item.setAttribute("data-parent-status", id);
    });
  }, [isOver, id]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (currentHighlightedElement === containerRef.current) {
        currentHighlightedElement = null;
      }
    };
  }, []);

  // 상태에 따라 아이콘 선택
  const getStatusIcon = (status) => {
    switch (status) {
      case "반려됨":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-red-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "대기중":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-yellow-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "승인됨":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-blue-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "장바구니":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-purple-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
          </svg>
        );
      case "주문완료":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-green-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
            <path
              fillRule="evenodd"
              d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5A1 1 0 0110 8h2a2 2 0 012 2v.5a.5.5 0 01-1 0V10a1 1 0 00-1-1h-2a.5.5 0 01-.5-.5 1.5 1.5 0 00-3 0V12a.5.5 0 01-1 0v-1.5a2.5 2.5 0 012.5-2.5h1z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  // 제목에서 괄호와 항목 수 분리
  const titleParts = title.match(/^(.+) \((\d+)\)$/);
  const statusName = titleParts ? titleParts[1] : title;
  const itemCount = titleParts ? titleParts[2] : "0";

  // 상태에 따른 헤더 배경색 결정
  const getHeaderBgColor = (status) => {
    switch (status) {
      case "반려됨":
        return "bg-red-50";
      case "대기중":
        return "bg-yellow-50";
      case "승인됨":
        return "bg-blue-50";
      case "장바구니":
        return "bg-purple-50";
      case "주문완료":
      case "완료됨":
      case "입고 완료":
        return "bg-green-50";
      default:
        return "bg-white";
    }
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        containerRef.current = node;
      }}
      className={`h-full flex flex-col rounded-lg p-[2px] ${
        className || "bg-gray-50"
      } ${
        isOver
          ? "ring-2 ring-blue-400 bg-blue-50/20 shadow-md scale-[1.01] z-10"
          : ""
      } transition-all duration-150 overflow-hidden`}
      data-status={id}
      data-type="container"
      data-droppable="true"
      style={{ maxHeight: "520px" }}
    >
      {/* 상단 헤더 부분 */}
      <div
        className={`flex items-center justify-between mb-2 p-2 rounded-lg shadow-sm ${getHeaderBgColor(
          id
        )}`}
      >
        <div className="flex items-center">
          {getStatusIcon(id)}
          <h3 className="font-medium text-gray-700 ml-2">{statusName}</h3>
        </div>
        <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full flex items-center justify-center min-w-[28px]">
          {itemCount}
        </span>
      </div>

      {/* 스크롤 영역 부분 - 스크롤바 숨김 스타일 적용 */}
      <div
        className="flex-1 overflow-y-auto p-1 min-h-[250px] h-[300px] rounded-md
        [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.length > 0 ? (
            <div className="px-1 pb-2">
              {items.map((item) => renderItem({ ...item, status: id }))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-sm italic">항목 없음</p>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
};

// 각 신청 유형별 상태 순서
const STATUS_FLOW = {
  vacation: ["반려됨", "대기중", "승인됨"],
  stock: ["반려됨", "장바구니", "대기중", "승인됨", "주문완료"],
  request: ["반려됨", "대기중", "승인됨"],
};

// 상태별 디스플레이 이름
const STATUS_DISPLAY_NAMES = {
  대기중: "대기중",
  승인됨: "승인됨",
  반려됨: "반려됨",
  취소됨: "취소됨",
  "주문 완료": "주문 완료",
  주문완료: "주문완료",
  장바구니: "장바구니",
  "입고 완료": "입고 완료",
  완료됨: "완료됨",
};

// 휴가 신청 유형 포맷 함수
const getVacationTitle = (item) => {
  if (item.vacationType === "휴가") {
    return `${item.vacationType} (${item.days}일)`;
  } else if (item.vacationType === "반차") {
    return `${item.vacationType}`;
  } else {
    return item.vacationType;
  }
};

// 날짜 포맷 함수
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

// 개선된 충돌 감지 함수 - rectIntersection과 pointerWithin의 조합
const customCollisionDetection = (args) => {
  // 첫 번째로 rectIntersection을 시도
  const rectCollisions = rectIntersection(args);
  if (rectCollisions.length > 0) {
    return rectCollisions;
  }

  // 그 다음 pointerWithin을 시도
  return pointerWithin(args);
};

// ConfirmModal 컴포넌트 추가
const ConfirmModal = ({
  isVisible,
  setIsVisible,
  title,
  message,
  onConfirm,
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[450px] p-6 animate-fade-in-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setIsVisible(false)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="bg-onceBlue text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

const RequestStatusModal = ({
  isVisible,
  setIsVisible,
  initialTab = "vacation",
}) => {
  const { userLevelData, currentUser } = useUserLevel();
  const { showToast } = useToast();
  const { autoHideOldDocuments } = useFirestore();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [vacationRequests, setVacationRequests] = useState([]);
  const [stockRequests, setStockRequests] = useState([]);
  const [generalRequests, setGeneralRequests] = useState([]);
  // 누락된 상태 변수 추가
  const [stockItems, setStockItems] = useState([]);
  // addTestData 변수 추가
  const [addTestData, setAddTestData] = useState(true);

  // 거래처 모달 관련 상태 추가
  const [vendorModalVisible, setVendorModalVisible] = useState(false);
  const [selectedVendorData, setSelectedVendorData] = useState(null);

  // 모달 상태
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [showStockRequestModal, setShowStockRequestModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // 선택된 항목
  const [selectedItem, setSelectedItem] = useState(null);

  // 상태별 필터링
  const [statusFilter, setStatusFilter] = useState("all");

  // useDummyData 상태 제거하고 isGeneratingData만 유지
  const [isGeneratingData, setIsGeneratingData] = useState(false);

  // 드래그 중인 항목
  const [activeId, setActiveId] = useState(null);

  // 관리자 권한 여부
  const isAdmin =
    userLevelData?.role === "대표원장" || userLevelData?.role === "과장";

  // 상세 모달 관련 상태 추가
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 상태 변경 사유 입력 모달 관련 상태
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [targetStatusChange, setTargetStatusChange] = useState({
    itemId: null,
    fromStatus: "",
    toStatus: "",
  });

  // 확인 모달 상태
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalProps, setConfirmModalProps] = useState({});

  // 비밀번호 검증 상태 추가
  const [verifiedItems, setVerifiedItems] = useState({});

  // 개선된 센서 설정
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // 마우스 감도 높임 - 빨리 시작
      activationConstraint: {
        distance: 1, // 최소 이동 거리 (픽셀)
      },
    }),
    useSensor(TouchSensor, {
      // 터치 감도 높임 - 빨리 시작
      activationConstraint: {
        delay: 100, // 지연시간 (ms)
        tolerance: 5, // 허용 오차
      },
    })
  );

  // 데이터 불러오기
  useEffect(() => {
    if (!userLevelData?.id || !isVisible) return;

    // 모달이 열릴 때 일주일이 지난 항목들을 숨김 처리
    const hideOldItems = async () => {
      try {
        await autoHideOldDocuments("vacations");
        await autoHideOldDocuments("stockRequests");
        await autoHideOldDocuments("requests");
      } catch (error) {
        console.error("오래된 항목 숨김 처리 오류:", error);
      }
    };

    hideOldItems();

    // 실제 데이터 로딩
    const loadData = async () => {
      try {
        // 언마운트 시 구독 해제할 함수들
        const unsubscribe = [];

        // 휴가 신청 데이터 가져오기
        const vacationQuery = query(collection(db, "vacations"));

        const vacationUnsub = onSnapshot(vacationQuery, (snapshot) => {
          const vacations = snapshot.docs.map((doc) => {
            const data = doc.data();
            // 부서 정보가 없는 경우 경고 로그 출력
            if (!data.department) {
              console.warn(
                `[부서 정보 없음] 휴가 ID: ${doc.id}, 신청자: ${
                  data.userName || "미상"
                }`
              );
            }
            return {
              id: doc.id,
              ...data,
              timestamp: data.createdAt?.toDate?.() || new Date(),
            };
          });

          console.log("휴가 데이터 로드 성공:", vacations.length, "건");
          console.log(
            "부서별 데이터:",
            vacations.reduce((acc, item) => {
              const dept = item.department || "부서없음";
              acc[dept] = (acc[dept] || 0) + 1;
              return acc;
            }, {})
          );

          setVacationRequests(vacations);
        });
        unsubscribe.push(vacationUnsub);

        // 비품 신청 데이터 가져오기
        const stockQuery = query(collection(db, "stockRequests"));

        const stockUnsub = onSnapshot(stockQuery, (snapshot) => {
          const stocks = snapshot.docs.map((doc) => {
            const data = doc.data();
            // 부서 정보가 없는 경우 경고 로그 출력
            if (!data.department) {
              console.warn(
                `[부서 정보 없음] 비품 ID: ${doc.id}, 품목명: ${
                  data.itemName || "미상"
                }`
              );
            }
            return {
              id: doc.id,
              ...data,
              timestamp: data.createdAt || new Date().getTime(),
            };
          });

          console.log("비품 데이터 로드 성공:", stocks.length, "건");
          console.log(
            "부서별 비품 데이터:",
            stocks.reduce((acc, item) => {
              const dept = item.department || "부서없음";
              acc[dept] = (acc[dept] || 0) + 1;
              return acc;
            }, {})
          );
          console.log(
            "타입별 비품 데이터:",
            stocks.reduce((acc, item) => {
              const type = item.requestType || "미지정";
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {})
          );

          setStockRequests(stocks);
          setStockItems(stocks); // stockItems 상태도 업데이트
        });
        unsubscribe.push(stockUnsub);

        // 일반 요청 데이터 가져오기
        const requestQuery = query(collection(db, "requests"));

        const requestUnsub = onSnapshot(requestQuery, (snapshot) => {
          const requests = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              timestamp: data.createdAt || new Date().getTime(),
            };
          });

          //check 1
          console.log("요청 데이터 로드 성공:", requests.length, "건");

          setGeneralRequests(requests);
        });
        unsubscribe.push(requestUnsub);

        // 컴포넌트 언마운트 시 구독 해제
        return () => {
          unsubscribe.forEach((unsub) => unsub());
        };
      } catch (error) {
        console.error("데이터 로딩 오류:", error);
        showToast("데이터를 불러오는 중 오류가 발생했습니다.", "error");
      }
    };

    // 데이터 로드 시작
    const unsubscribeAll = loadData();

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      if (typeof unsubscribeAll === "function") {
        unsubscribeAll();
      }
    };
  }, [userLevelData?.id, isVisible, autoHideOldDocuments, showToast]);

  // 컴포넌트 마운트 시 초기 탭 설정
  useEffect(() => {
    if (initialTab && ["vacation", "stock", "request"].includes(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setStatusFilter("all");
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

  // 드래그 시작 핸들러
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    globalDragState.activeId = active.id;
    console.log("Drag started:", active.id);
  };

  // 개선된 드래그 종료 핸들러
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    globalDragState.activeId = null;
    globalDragState.isDragging = false;
    globalDragState.targetStatus = null;

    // 모든 하이라이트된 요소 정리
    currentHighlightedElement = null;
    document
      .querySelectorAll('[data-highlight="true"], [data-hovered="true"]')
      .forEach((el) => {
        el.removeAttribute("data-highlight");
        el.removeAttribute("data-hovered");
        el.classList.remove(
          "ring-2",
          "ring-blue-400",
          "bg-blue-50/20",
          "shadow-md",
          "scale-[1.01]",
          "z-10"
        );
      });

    // 디버그 정보 로깅
    console.log("Drag End Event:", {
      activeId: active.id,
      activeData: active.data.current,
      overId: over?.id,
      overData: over?.data.current,
    });

    // 드롭 위치가 없으면 취소
    if (!over) {
      console.log("No drop target found");
      return;
    }

    // 같은 위치면 아무 것도 하지 않음
    if (active.id === over.id) {
      console.log("Dropped in same position");
      return;
    }

    // 드롭 타겟 식별 로직 - HTML 요소의 부모 찾기까지 포함
    let targetStatusId = over.id;
    const overElement = document.querySelector(`[data-item-id="${over.id}"]`);

    // DraggableItem 위에 드롭된 경우
    if (overElement) {
      // 가장 가까운 드롭 영역 찾기
      const closestDroppable = overElement.closest('[data-droppable="true"]');
      if (closestDroppable) {
        targetStatusId = closestDroppable.getAttribute("data-status");
        console.log("Found parent droppable:", targetStatusId);
      }
    }

    // 유효한 드롭 대상인지 확인
    const isValidStatus = STATUS_FLOW[activeTab]?.includes(targetStatusId);
    if (!isValidStatus) {
      console.log("Invalid drop target:", targetStatusId);
      return;
    }

    // 현재 아이템 정보 가져오기
    let currentCollection;
    let currentItem;

    switch (activeTab) {
      case "vacation":
        currentCollection = "vacations";
        currentItem = vacationRequests.find((item) => item.id === active.id);
        break;
      case "stock":
        currentCollection = "stockRequests";
        currentItem = stockRequests.find((item) => item.id === active.id);
        break;
      case "request":
        currentCollection = "requests";
        currentItem = generalRequests.find((item) => item.id === active.id);
        break;
      default:
        return;
    }

    if (!currentItem) {
      console.log("Current item not found", active.id);
      return;
    }

    // 상태 변경 - targetStatusId를 사용
    const newStatus = targetStatusId;
    console.log("New status:", newStatus);

    // 권한 체크 로직 추가
    // 승인/반려 권한 체크
    if (newStatus === "승인됨" || newStatus === "반려됨") {
      if (activeTab === "vacation") {
        if (!canApproveVacation(userLevelData, currentUser)) {
          showToast("휴가 신청을 승인/반려할 권한이 없습니다.", "error");
          return;
        }
      } else if (activeTab === "stock") {
        if (!canApproveStockRequest(userLevelData, currentUser)) {
          showToast("비품 신청을 승인/반려할 권한이 없습니다.", "error");
          return;
        }
      } else if (activeTab === "request") {
        // 요청 탭에서는 누구나 상태 변경 가능하도록 변경
        // 권한 체크 로직 제거
      }
    }
    // 주문 관련 상태 체크 (비품에만 해당)
    else if (
      ["주문 필요", "주문 완료", "입고 완료"].includes(newStatus) &&
      activeTab === "stock"
    ) {
      if (!canOrderStock(userLevelData, currentUser)) {
        showToast("비품 주문 상태를 변경할 권한이 없습니다.", "error");
        return;
      }
    }

    // 승인 또는 반려로 변경되는 경우 사유 입력 모달 표시
    if (newStatus === "승인됨" || newStatus === "반려됨") {
      setTargetStatusChange({
        itemId: active.id,
        fromStatus: currentItem.status,
        toStatus: newStatus,
      });
      setShowReasonModal(true);
    } else {
      // 다른 상태로 변경되는 경우 바로 적용
      const emptyReason = "";
      setTargetStatusChange({
        itemId: active.id,
        fromStatus: currentItem.status,
        toStatus: newStatus,
      });
      handleReasonSubmit(emptyReason);
    }
  };

  // 부서명 일치 여부 확인 함수 (팀 명칭 유무 상관없이 비교)
  const isDepartmentMatch = (dept1, dept2) => {
    // 입력값 디버깅
    console.log(`부서 비교: '${dept1}' vs '${dept2}'`);

    // null/undefined/빈 문자열 체크
    if (!dept1 || !dept2) {
      console.log(
        `  부서 비교 실패: 하나 이상의 부서가 비어있음 - dept1: '${dept1}', dept2: '${dept2}'`
      );
      return false;
    }

    // 문자열로 변환 (만약 다른 타입이 들어왔을 경우를 대비)
    const dept1Str = String(dept1).trim();
    const dept2Str = String(dept2).trim();

    // 정확히 일치하는 경우
    if (dept1Str === dept2Str) {
      console.log(`  정확히 일치: '${dept1Str}' === '${dept2Str}'`);
      return true;
    }

    // '팀' 명칭 제거 후 비교
    const dept1Base = dept1Str.endsWith("팀")
      ? dept1Str.slice(0, -1)
      : dept1Str;
    const dept2Base = dept2Str.endsWith("팀")
      ? dept2Str.slice(0, -1)
      : dept2Str;

    const result = dept1Base === dept2Base;
    console.log(
      `  팀 명칭 제거 후 비교: '${dept1Base}' vs '${dept2Base}' = ${result}`
    );

    return result;
  };

  // 선택된 탭의 데이터 가져오기
  const getCurrentData = () => {
    let data;
    switch (activeTab) {
      case "vacation":
        data = vacationRequests;
        break;
      case "stock":
        data = stockRequests;
        break;
      case "request":
        // 요청 데이터는 발신 부서 또는 수신 부서가 사용자 부서인 것만 필터링
        const pcDepartment = userLevelData?.department || "";
        console.log("요청 데이터 필터링 - 사용자 부서:", pcDepartment);

        if (pcDepartment) {
          const filtered = generalRequests.filter((req) => {
            const senderMatch = req.senderDepartment === pcDepartment;
            const receiverMatch = req.receiverDepartment === pcDepartment;
            if (senderMatch || receiverMatch) {
              console.log(
                `[부서 일치] 요청 - 발신부서: ${req.senderDepartment}, 수신부서: ${req.receiverDepartment}, PC 부서: ${pcDepartment}, 제목: ${req.title}`
              );
            }
            return senderMatch || receiverMatch;
          });

          console.log("필터링 전 요청 데이터 개수:", generalRequests.length);
          console.log("필터링 후 요청 데이터 개수:", filtered.length);
          return filtered;
        }

        // 부서 정보가 없는 경우 모든 요청 반환 (이전과 동일)
        console.log("부서 정보 없음 - 모든 요청 데이터 반환");
        return generalRequests;
      default:
        data = [];
    }

    console.log(`===== getCurrentData 호출 - ${activeTab} 탭 =====`);
    console.log("데이터 개수:", data.length);
    console.log("현재 사용자 역할:", userLevelData?.role);
    console.log("현재 PC 부서:", userLevelData?.department);

    // 데이터 있는지 확인하는 디버그 로그 추가
    if (data.length === 0) {
      console.warn(
        `${activeTab} 데이터가 없습니다! 데이터 로딩에 문제가 있을 수 있습니다.`
      );
      console.log("상태 변수 현황:", {
        vacationRequests: vacationRequests.length,
        stockRequests: stockRequests.length,
        generalRequests: generalRequests.length,
      });
    } else {
      // 데이터 샘플 출력 (첫 번째 항목)
      console.log("데이터 샘플 (첫 번째 항목):", data[0]);
    }

    // PC의 부서 정보 가져오기
    const pcDepartment = userLevelData?.department || "";
    console.log("PC 부서 정보:", pcDepartment);

    // 장바구니의 경우 모든 사용자(대표원장 포함)가 자기 부서의 것만 볼 수 있도록 설정
    if (activeTab === "stock" && pcDepartment) {
      // 장바구니 상태인 항목은 부서 기준으로 필터링
      const cartItems = data.filter((item) => item.status === "장바구니");
      if (cartItems.length > 0) {
        // 장바구니 항목은 항상 부서 필터링 적용
        const filteredCartItems = cartItems.filter((item) =>
          isDepartmentMatch(item.department, pcDepartment)
        );

        // 장바구니가 아닌 다른 항목들
        const nonCartItems = data.filter((item) => item.status !== "장바구니");

        // 대표원장 여부 확인
        const isOwner = isHospitalOwner(userLevelData, currentUser);
        // 원무과장 여부 확인
        const isAdminManager = isAdministrativeManager(
          userLevelData,
          currentUser
        );

        if (isOwner || isAdminManager) {
          // 대표원장이나 원무과장의 경우 장바구니 항목은 부서 필터링, 다른 항목은 모두 표시
          return [...filteredCartItems, ...nonCartItems];
        } else {
          // 일반 사용자는 모든 항목에 부서 필터링 적용 (기존 로직)
          return [
            ...filteredCartItems,
            ...nonCartItems.filter((item) =>
              isDepartmentMatch(item.department, pcDepartment)
            ),
          ];
        }
      }
    }

    // 대표원장 여부 확인 - 로그인 여부와 상관없이 role 정보만 사용
    const isOwner = isHospitalOwner(userLevelData, currentUser);
    console.log("대표원장 여부 (isHospitalOwner):", isOwner);

    // 대표원장인 경우 모든 데이터를 볼 수 있음 (장바구니는 위에서 처리됨)
    if (isOwner) {
      console.log("대표원장 권한으로 모든 데이터 조회 - 필터링 없음");
      return data;
    }

    // 원무과장 여부 확인 - 로그인 여부와 상관없이 role 정보만 사용
    const isAdminManager = isAdministrativeManager(userLevelData, currentUser);
    console.log("원무과장 여부 (isAdministrativeManager):", isAdminManager);

    // 원무과장이고 비품 데이터인 경우 - 모든 비품 데이터를 볼 수 있음
    if (activeTab === "stock" && isAdminManager) {
      console.log("원무과장 권한으로 모든 비품 데이터 조회");
      return data;
    }

    // 부서 정보가 있으면 해당 부서 데이터만 필터링 (로그인 여부와 상관없이)
    if (pcDepartment) {
      console.log("부서별 데이터 조회:", pcDepartment);

      // 각 탭별로 다른 필드를 기준으로 필터링
      if (activeTab === "vacation") {
        // 휴가의 경우 부서 기준 (팀 명칭 유무 무관하게 비교)
        console.log("[부서 필터링 디버그] 휴가 - PC 부서:", pcDepartment);

        // 부서 정보가 없는 항목 로그
        const itemsWithoutDept = data.filter((item) => !item.department);
        if (itemsWithoutDept.length > 0) {
          console.warn(
            `부서 정보가 없는 휴가 항목: ${itemsWithoutDept.length}건`
          );
          console.log(
            itemsWithoutDept.map((item) => ({
              id: item.id,
              userName: item.userName,
            }))
          );
        }

        const filtered = data.filter((item) => {
          const match = isDepartmentMatch(item.department, pcDepartment);
          if (match) {
            console.log(
              `[부서 일치] 휴가 - 항목 부서: ${item.department}, PC 부서: ${pcDepartment}, 신청자: ${item.userName}`
            );
          }
          return match;
        });

        // 로그인한 경우 본인 휴가도 추가
        if (currentUser && currentUser.id) {
          const personalItems = data.filter(
            (item) =>
              !isDepartmentMatch(item.department, pcDepartment) && // 이미 포함된 항목 제외
              (item.userName === currentUser.name ||
                item.userId === currentUser.id)
          );

          if (personalItems.length > 0) {
            console.log(
              `[개인 항목] 본인 휴가 항목 ${personalItems.length}건 추가`
            );
          }
          filtered.push(...personalItems);
        }

        console.log("필터링 전 휴가 데이터 개수:", data.length);
        console.log("필터링 후 휴가 데이터 개수:", filtered.length);
        return filtered;
      } else if (activeTab === "stock") {
        // 비품은 부서 기준 (팀 명칭 유무 무관하게 비교)
        console.log("[부서 필터링 디버그] 비품 - PC 부서:", pcDepartment);

        // 부서 정보가 없는 항목 로그
        const itemsWithoutDept = data.filter((item) => !item.department);
        if (itemsWithoutDept.length > 0) {
          console.warn(
            `부서 정보가 없는 비품 항목: ${itemsWithoutDept.length}건`
          );
          console.log(
            itemsWithoutDept.map((item) => ({
              id: item.id,
              itemName: item.itemName,
            }))
          );
        }

        const filtered = data.filter((item) => {
          const match = isDepartmentMatch(item.department, pcDepartment);
          if (match) {
            console.log(
              `[부서 일치] 비품 - 항목 부서: ${item.department}, PC 부서: ${pcDepartment}, 품목: ${item.itemName}`
            );
          }
          return match;
        });

        // 로그인한 경우 본인 비품 신청도 추가
        if (currentUser && currentUser.id) {
          const personalItems = data.filter(
            (item) =>
              !isDepartmentMatch(item.department, pcDepartment) && // 이미 포함된 항목 제외
              (item.requestedBy === currentUser.id ||
                item.writer === currentUser.name)
          );

          filtered.push(...personalItems);
        }

        console.log("필터링 전 비품 데이터 개수:", data.length);
        console.log("필터링 후 비품 데이터 개수:", filtered.length);
        return filtered;
      }
    }

    // 부서 정보가 없는 경우 - 로그인한 경우에만 본인 데이터 표시
    if (currentUser && currentUser.id) {
      console.log("부서 정보 없음 - 본인 데이터만 표시");
      if (activeTab === "vacation") {
        const filtered = data.filter(
          (item) =>
            item.userName === currentUser.name || item.userId === currentUser.id
        );
        console.log("사용자 본인의 휴가 데이터만 표시:", filtered.length);
        return filtered;
      } else if (activeTab === "stock") {
        const filtered = data.filter(
          (item) =>
            item.requestedBy === currentUser.id ||
            item.writer === currentUser.name
        );
        console.log("사용자 본인의 비품 데이터만 표시:", filtered.length);
        return filtered;
      }
    }

    // 아무 필터링도 적용되지 않은 경우 (부서 정보도 없고 로그인도 안된 경우)
    console.log("필터링 조건 없음 - 모든 데이터 표시");
    return data;
  };

  // 상태별로 데이터 분류
  const getItemsByStatus = () => {
    const data = getCurrentData();
    const statusOrder = STATUS_FLOW[activeTab] || [];
    const result = {};

    // 권한 확인 로깅
    const isOwner = isHospitalOwner(userLevelData, currentUser);
    const isAdminManager = isAdministrativeManager(userLevelData, currentUser);
    const pcDepartment = userLevelData?.department || "";

    console.log(
      `getItemsByStatus - 대표원장: ${isOwner}, 원무과장: ${isAdminManager}, 부서: ${pcDepartment}, 탭: ${activeTab}, 데이터 수: ${data.length}`
    );

    // 초기화
    statusOrder.forEach((status) => {
      result[status] = [];
    });

    // 아이템 분류
    data.forEach((item) => {
      const status = item.status || "대기중";
      if (result[status]) {
        result[status].push(item);
      } else {
        // 정의되지 않은 상태는 대기중으로 처리
        result["대기중"] = result["대기중"] || [];
        result["대기중"].push(item);
      }
    });

    return result;
  };

  // 격자 컬럼 수를 동적으로 계산하는 함수
  const getGridColsClass = (activeTab) => {
    const statusCount = STATUS_FLOW[activeTab]?.length || 4;
    switch (statusCount) {
      case 3:
        return "grid-cols-3";
      case 5:
        return "grid-cols-5";
      default:
        return "grid-cols-4";
    }
  };

  // 드래그 오버레이 렌더링
  const renderDragOverlay = () => {
    if (!activeId) return null;

    // 현재 아이템 정보 가져오기
    let currentItem;
    switch (activeTab) {
      case "vacation":
        currentItem = vacationRequests.find((item) => item.id === activeId);
        break;
      case "stock":
        currentItem = stockRequests.find((item) => item.id === activeId);
        break;
      case "request":
        currentItem = generalRequests.find((item) => item.id === activeId);
        break;
      default:
        return null;
    }

    if (!currentItem) return null;

    // 전역 상태에서 타겟 상태 가져오기
    const targetStatus = globalDragState.targetStatus;

    // 아이템 유형별 아이콘
    const getTypeIcon = () => {
      switch (activeTab) {
        case "vacation":
          return (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-500 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
          );
        case "stock":
          return (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-green-500 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
              <path
                fillRule="evenodd"
                d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          );
        case "request":
          return (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-purple-500 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z"
                clipRule="evenodd"
              />
            </svg>
          );
        default:
          return null;
      }
    };

    // 아이템 내용 간략화
    const getTitle = () => {
      switch (activeTab) {
        case "vacation":
          return getVacationTitle(currentItem);
        case "stock":
          return currentItem.itemName;
        case "request":
          return currentItem.title || "요청";
        default:
          return "항목";
      }
    };

    // 간략 정보
    const getSubtitle = () => {
      switch (activeTab) {
        case "vacation":
          return `${currentItem.startDate} ~ ${currentItem.endDate}`;
        case "stock":
          return `${currentItem.quantity} ${currentItem.measure || "개"}`;
        case "request":
          return (
            currentItem.message?.substring(0, 40) +
            (currentItem.message?.length > 40 ? "..." : "")
          );
        default:
          return "";
      }
    };

    return (
      <div className="bg-white p-3 rounded-lg shadow-xl border-2 border-blue-400 w-64 opacity-95 cursor-grabbing relative z-50">
        <div className="flex items-center border-l-4 border-blue-500 pl-2 py-1 mb-2">
          {getTypeIcon()}
          <div className="font-medium text-gray-800 truncate">{getTitle()}</div>
        </div>
        <div className="text-sm text-gray-600 pl-2">{getSubtitle()}</div>

        {/* 현재 호버 중인 영역 정보 표시 - 크기 축소 */}
        {/* {targetStatus && (
          <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/3 bg-blue-400 text-white px-1.5 py-0.5 rounded-full text-xs shadow-sm">
            {STATUS_DISPLAY_NAMES[targetStatus] || targetStatus}
          </div>
        )} */}
      </div>
    );
  };

  // 아이템 클릭 핸들러 함수 수정
  const handleItemClick = (item) => {
    // 대표원장 권한 확인
    const isOwner = isHospitalOwner(userLevelData, currentUser);

    // 휴가 항목인 경우 처리
    if (activeTab === "vacation") {
      // 대표원장인 경우 자동으로 검증 상태로 설정
      if (isOwner) {
        setVerifiedItems((prev) => ({
          ...prev,
          [item.id]: true,
        }));
      }
      // 일반 사용자의 경우 비밀번호 검증이 필요
      else if (!verifiedItems[item.id] && item.password) {
        // 비밀번호 검증을 DraggableItem 컴포넌트에서 처리함
        // 검증 성공시 verifiedItems에 추가하고 상세 모달 표시
        return; // 검증되지 않았으면 모달을 열지 않음
      }
    }

    setSelectedItem(item);
    setShowDetailModal(true);
  };

  // 상태 변경 사유 입력 후 처리 핸들러
  const handleReasonSubmit = async (reason) => {
    const { itemId, fromStatus, toStatus } = targetStatusChange;

    if (!itemId || !toStatus) return Promise.resolve(); // Promise 반환

    try {
      console.log("상태 변경 시작:", { itemId, fromStatus, toStatus, reason });

      // 현재 아이템 정보 가져오기
      let currentCollection;
      let currentItem;

      switch (activeTab) {
        case "vacation":
          currentCollection = "vacations";
          currentItem = vacationRequests.find((item) => item.id === itemId);
          break;
        case "stock":
          currentCollection = "stockRequests";
          currentItem = stockRequests.find((item) => item.id === itemId);
          break;
        case "request":
          currentCollection = "requests";
          currentItem = generalRequests.find((item) => item.id === itemId);
          break;
        default:
          return Promise.resolve(); // Promise 반환
      }

      if (!currentItem) {
        console.log("Current item not found", itemId);
        return Promise.resolve(); // Promise 반환
      }

      // Firestore 문서 업데이트
      try {
        let dbStatus = toStatus;
        // 이제 승인 -> 승인됨 변환은 필요 없음
        if (dbStatus === "반려") dbStatus = "반려됨";

        console.log(`Firestore 업데이트 시작: ${currentCollection}/${itemId}`, {
          이전상태: currentItem.status,
          새상태: dbStatus,
        });

        const docRef = doc(db, currentCollection, currentItem.id);
        await updateDoc(docRef, {
          status: dbStatus,
          approvalReason: reason,
          updatedAt: new Date(),
          updatedBy: userLevelData?.id || "system",
          updatedByName: userLevelData?.name || "System",
        });

        console.log("Firestore 업데이트 완료");

        // 즉시 메모리 상의 데이터도 업데이트 - UI 즉시 반영을 위함
        switch (activeTab) {
          case "vacation":
            setVacationRequests((prev) =>
              prev.map((item) =>
                item.id === itemId
                  ? { ...item, status: dbStatus, approvalReason: reason }
                  : item
              )
            );
            break;
          case "stock":
            setStockRequests((prev) =>
              prev.map((item) =>
                item.id === itemId
                  ? { ...item, status: dbStatus, approvalReason: reason }
                  : item
              )
            );
            break;
          case "request":
            setGeneralRequests((prev) =>
              prev.map((item) =>
                item.id === itemId
                  ? { ...item, status: dbStatus, approvalReason: reason }
                  : item
              )
            );
            break;
        }

        showToast(
          `상태가 '${
            STATUS_DISPLAY_NAMES[toStatus] || toStatus
          }'(으)로 변경되었습니다.`,
          "success"
        );

        // 알림 전송 처리 - 각 탭별로 처리
        if (
          activeTab === "request" &&
          (toStatus === "승인됨" || toStatus === "반려됨")
        ) {
          // 기존 요청 알림 로직 유지
          await sendCallNotification(currentItem, toStatus, reason);
        }
        // 휴가 신청 알림 추가
        else if (
          activeTab === "vacation" &&
          (toStatus === "승인됨" || toStatus === "반려됨")
        ) {
          await sendVacationNotification(currentItem, toStatus, reason);
        }
        // 비품 신청 알림 추가
        else if (
          activeTab === "stock" &&
          (toStatus === "승인됨" ||
            toStatus === "반려됨" ||
            toStatus === "주문완료")
        ) {
          await sendStockNotification(currentItem, toStatus, reason);
        }

        // 데이터 리프레시 - 1초 후 서버 데이터와 동기화
        setTimeout(() => {
          loadRealData();
          console.log("상태 변경 후 데이터 리프레시 완료");
        }, 1000);

        return Promise.resolve(true); // 성공했을 때 true 반환
      } catch (error) {
        console.error("상태 업데이트 오류:", error);
        showToast("상태 업데이트 중 오류가 발생했습니다.", "error");
        return Promise.reject(error); // 오류 시 reject
      }
    } catch (error) {
      console.error("상태 변경 처리 오류:", error);
      showToast("상태 변경 처리 중 오류가 발생했습니다.", "error");
      return Promise.reject(error); // 오류 시 reject
    }
  };

  // 요청 상태 변경 알림(call) 전송 함수 추가
  const sendCallNotification = async (requestItem, newStatus, reason) => {
    try {
      // 요청 항목에 필요한 정보가 있는지 확인
      if (!requestItem.senderDepartment) {
        console.warn("요청 항목에 발신 부서 정보가 없습니다:", requestItem);
        return;
      }

      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const formattedTime = `${hours}:${minutes}`;

      // 상태에 따른 메시지 내용 생성
      const statusText = newStatus === "승인됨" ? "승인" : "반려";
      const message = `[${
        requestItem.receiverDepartment || userLevelData.department
      }] ${requestItem.title} 요청이 ${statusText}되었습니다.`;

      // 호출(call) 데이터 생성 - 발신부서에 알림
      const callData = {
        message: message,
        receiverId: requestItem.senderDepartment, // 요청 발신 부서를 receiverId로 설정
        senderId: requestItem.receiverDepartment || userLevelData.department, // 요청 수신 부서(현재 처리자 부서)를 senderId로 설정
        formattedTime,
        createdAt: Date.now(),
        createdAt2: serverTimestamp(),
        type: "요청", // 호출 타입을 '요청'으로 설정
        requestId: requestItem.id, // 요청 ID 저장 (나중에 링크용)
        approvalReason: reason, // 승인/반려 사유 추가
        newStatus: newStatus, // 변경된 상태 정보 추가
        [requestItem.senderDepartment]: true, // 수신 부서 필드 설정 (발신 부서)
        [requestItem.receiverDepartment || userLevelData.department]: true, // 발신 부서 필드 설정 (수신 부서/처리자)
      };

      console.log("상태 변경 알림 콜 데이터:", callData);

      // Firestore에 호출 데이터 저장
      await addDoc(collection(db, "calls"), callData);
      console.log("상태 변경 알림 전송 완료:", newStatus);

      return true;
    } catch (error) {
      console.error("상태 변경 알림 전송 오류:", error);
      // 알림 전송 오류는 사용자에게 표시하지 않음 (주요 기능에 영향 없음)
      return false;
    }
  };

  // 휴가 신청 알림 전송 함수 추가
  const sendVacationNotification = async (vacationItem, newStatus, reason) => {
    try {
      // 필요한 정보가 있는지 확인
      if (!vacationItem.department || !vacationItem.userName) {
        console.warn(
          "휴가 항목에 부서 또는 사용자 정보가 없습니다:",
          vacationItem
        );
        return;
      }

      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const formattedTime = `${hours}:${minutes}`;

      // 상태에 따른 메시지 내용 생성
      const statusText = newStatus === "승인됨" ? "승인" : "반려";

      // 휴가 정보 표시
      const vacationInfo =
        vacationItem.vacationType === "휴가"
          ? `${vacationItem.vacationType} (${vacationItem.days}일)`
          : vacationItem.vacationType;

      const message = `${vacationItem.userName}님의 ${vacationInfo} 신청이 ${statusText}되었습니다.`;

      // 호출(call) 데이터 생성
      const callData = {
        message: message,
        receiverId: vacationItem.department, // 부서를 receiverId로 설정
        senderId: userLevelData?.department || "관리자", // 현재 처리자 부서
        formattedTime,
        createdAt: Date.now(),
        createdAt2: serverTimestamp(),
        type: "휴가", // 호출 타입을 '휴가'로 설정
        vacationId: vacationItem.id, // 휴가 ID 저장
        approvalReason: reason, // 승인/반려 사유 추가
        newStatus: newStatus, // 변경된 상태 정보 추가
        [vacationItem.department]: true, // 부서 필드 설정
      };

      console.log("휴가 상태 변경 알림 데이터:", callData);

      // Firestore에 호출 데이터 저장
      await addDoc(collection(db, "calls"), callData);
      console.log("휴가 상태 변경 알림 전송 완료:", newStatus);

      return true;
    } catch (error) {
      console.error("휴가 상태 변경 알림 전송 오류:", error);
      return false;
    }
  };

  // 비품 신청 알림 전송 함수 추가
  const sendStockNotification = async (stockItem, newStatus, reason) => {
    try {
      // 필요한 정보가 있는지 확인
      if (!stockItem.department) {
        console.warn("비품 항목에 부서 정보가 없습니다:", stockItem);
        return;
      }

      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const formattedTime = `${hours}:${minutes}`;

      // 상태에 따른 메시지 내용 생성
      let statusText;
      if (newStatus === "승인됨") statusText = "승인";
      else if (newStatus === "반려됨") statusText = "반려";
      else if (newStatus === "주문완료") statusText = "주문 완료";
      else statusText = newStatus;

      // 신청자 이름 또는 기본값
      const requesterName =
        stockItem.requestedByName || stockItem.writer || "사용자";

      // 비품 정보
      const stockInfo = `${stockItem.itemName} (${stockItem.quantity}${
        stockItem.measure || "개"
      })`;

      const message = `${requesterName}님의 비품 신청 [${stockInfo}]이(가) ${statusText}되었습니다.`;

      // 호출(call) 데이터 생성
      const callData = {
        message: message,
        receiverId: stockItem.department, // 부서를 receiverId로 설정
        senderId: userLevelData?.department || "관리자", // 현재 처리자 부서
        formattedTime,
        createdAt: Date.now(),
        createdAt2: serverTimestamp(),
        type: "비품", // 호출 타입을 '비품'으로 설정
        stockId: stockItem.id, // 비품 ID 저장
        approvalReason: reason, // 승인/반려 사유 추가
        newStatus: newStatus, // 변경된 상태 정보 추가
        [stockItem.department]: true, // 부서 필드 설정
      };

      console.log("비품 상태 변경 알림 데이터:", callData);

      // Firestore에 호출 데이터 저장
      await addDoc(collection(db, "calls"), callData);
      console.log("비품 상태 변경 알림 전송 완료:", newStatus);

      return true;
    } catch (error) {
      console.error("비품 상태 변경 알림 전송 오류:", error);
      return false;
    }
  };

  // 상세 모달에서 상태 변경 처리 함수 수정
  const handleModalStatusChange = (itemId, newStatus, reason) => {
    console.log("모달 상태 변경 시작:", { itemId, newStatus, reason });

    // 권한 체크 로직
    if (newStatus === "승인됨" || newStatus === "반려됨") {
      if (
        activeTab === "vacation" &&
        !canApproveVacation(userLevelData, currentUser)
      ) {
        showToast("휴가 신청을 승인/반려할 권한이 없습니다.", "error");
        return;
      } else if (
        activeTab === "stock" &&
        !canApproveStockRequest(userLevelData, currentUser)
      ) {
        showToast("비품 신청을 승인/반려할 권한이 없습니다.", "error");
        return;
      }
    } else if (
      ["주문 필요", "주문 완료", "입고 완료"].includes(newStatus) &&
      activeTab === "stock" &&
      !canOrderStock(userLevelData, currentUser)
    ) {
      showToast("비품 주문 상태를 변경할 권한이 없습니다.", "error");
      return;
    }

    // 현재 아이템 정보 가져오기
    let currentCollection;
    let currentItem;

    switch (activeTab) {
      case "vacation":
        currentCollection = "vacations";
        currentItem = vacationRequests.find((item) => item.id === itemId);
        break;
      case "stock":
        currentCollection = "stockRequests";
        currentItem = stockRequests.find((item) => item.id === itemId);
        break;
      case "request":
        currentCollection = "requests";
        currentItem = generalRequests.find((item) => item.id === itemId);
        break;
      default:
        return;
    }

    if (!currentItem) {
      console.log("Current item not found", itemId);
      showToast("상태 변경할 항목을 찾을 수 없습니다.", "error");
      return;
    }

    // 같은 상태로 변경하려는 경우 방지
    if (currentItem.status === newStatus) {
      showToast(`이미 '${newStatus}' 상태입니다.`, "warning");
      return;
    }

    // 사유가 전달된 경우와 아닌 경우를 구분 처리
    if (reason) {
      // 직접 Firestore 업데이트 처리 (handleReasonSubmit 대신 직접 처리)
      const updateFirestore = async () => {
        try {
          let dbStatus = newStatus;
          if (dbStatus === "반려") dbStatus = "반려됨";

          console.log(
            "Firestore 직접 업데이트 시작:",
            currentCollection,
            itemId
          );

          // Firestore 문서 업데이트
          const docRef = doc(db, currentCollection, itemId);
          await updateDoc(docRef, {
            status: dbStatus,
            approvalReason: reason,
            updatedAt: new Date(),
            updatedBy: userLevelData?.id || "system",
            updatedByName: userLevelData?.name || "System",
          });

          console.log("Firestore 업데이트 완료, 알림 처리 시작");

          // 알림 처리
          if (
            activeTab === "request" &&
            (newStatus === "승인됨" || newStatus === "반려됨")
          ) {
            await sendCallNotification(currentItem, newStatus, reason);
          } else if (
            activeTab === "vacation" &&
            (newStatus === "승인됨" || newStatus === "반려됨")
          ) {
            await sendVacationNotification(currentItem, newStatus, reason);
          } else if (
            activeTab === "stock" &&
            (newStatus === "승인됨" ||
              newStatus === "반려됨" ||
              newStatus === "주문완료")
          ) {
            await sendStockNotification(currentItem, newStatus, reason);
          }

          // 성공 메시지 표시
          showToast(
            `상태가 '${
              STATUS_DISPLAY_NAMES[newStatus] || newStatus
            }'(으)로 변경되었습니다.`,
            "success"
          );

          // 데이터 리프레시 - 드래그앤드롭과 동일하게 바로 호출
          loadRealData();

          // 상세 모달 닫기
          setShowDetailModal(false);
        } catch (error) {
          console.error("상태 업데이트 오류:", error);
          showToast("상태 업데이트 중 오류가 발생했습니다.", "error");
        }
      };

      // 바로 실행
      updateFirestore();
    } else {
      // 승인/반려/주문완료는 사유 입력 필요
      if (
        newStatus === "승인됨" ||
        newStatus === "반려됨" ||
        newStatus === "주문완료"
      ) {
        // 상태 변경 정보 저장 (ReasonInputModal에서 사용)
        setTargetStatusChange({
          itemId,
          fromStatus: currentItem.status,
          toStatus: newStatus,
        });

        // 사유 입력 모달 표시
        setShowReasonModal(true);
      } else {
        // 다른 상태는 빈 문자열로 직접 처리
        const emptyReason = "";

        // 상태 변경 정보 저장
        setTargetStatusChange({
          itemId,
          fromStatus: currentItem.status,
          toStatus: newStatus,
        });

        // Firestore 직접 업데이트
        const updateFirestore = async () => {
          try {
            let dbStatus = newStatus;
            if (dbStatus === "반려") dbStatus = "반려됨";

            console.log(
              "Firestore 직접 업데이트 시작:",
              currentCollection,
              itemId
            );

            // Firestore 문서 업데이트
            const docRef = doc(db, currentCollection, itemId);
            await updateDoc(docRef, {
              status: dbStatus,
              approvalReason: emptyReason,
              updatedAt: new Date(),
              updatedBy: userLevelData?.id || "system",
              updatedByName: userLevelData?.name || "System",
            });

            // 성공 메시지 표시
            showToast(
              `상태가 '${
                STATUS_DISPLAY_NAMES[newStatus] || newStatus
              }'(으)로 변경되었습니다.`,
              "success"
            );

            // 데이터 리프레시
            loadRealData();

            // 상세 모달 닫기
            setShowDetailModal(false);
          } catch (error) {
            console.error("상태 업데이트 오류:", error);
            showToast("상태 업데이트 중 오류가 발생했습니다.", "error");
          }
        };

        // 바로 실행
        updateFirestore();
      }
    }
  };

  // 상태 버튼 스타일 가져오기 함수
  const getStatusButtonStyle = (status, isSelected) => {
    let baseStyle = "px-3 py-2 rounded text-sm font-medium transition-colors ";

    if (isSelected) {
      switch (status) {
        case "반려됨":
          return baseStyle + "bg-red-100 border-2 border-red-400 text-red-700";
        case "승인됨":
          return (
            baseStyle + "bg-blue-100 border-2 border-blue-400 text-blue-700"
          );
        case "대기중":
          return (
            baseStyle +
            "bg-yellow-100 border-2 border-yellow-400 text-yellow-700"
          );
        case "장바구니":
          return (
            baseStyle +
            "bg-purple-100 border-2 border-purple-400 text-purple-700"
          );
        case "주문완료":
        case "완료됨":
        case "입고 완료":
          return (
            baseStyle + "bg-green-100 border-2 border-green-400 text-green-700"
          );
        default:
          return (
            baseStyle + "bg-gray-100 border-2 border-gray-300 text-gray-700"
          );
      }
    } else {
      switch (status) {
        case "반려됨":
          return (
            baseStyle +
            "bg-white border border-red-300 text-red-600 hover:bg-red-50"
          );
        case "승인됨":
          return (
            baseStyle +
            "bg-white border border-blue-300 text-blue-600 hover:bg-blue-50"
          );
        case "대기중":
          return (
            baseStyle +
            "bg-white border border-yellow-300 text-yellow-600 hover:bg-yellow-50"
          );
        case "장바구니":
          return (
            baseStyle +
            "bg-white border border-purple-300 text-purple-600 hover:bg-purple-50"
          );
        case "주문완료":
        case "완료됨":
        case "입고 완료":
          return (
            baseStyle +
            "bg-white border border-green-300 text-green-600 hover:bg-green-50"
          );
        default:
          return (
            baseStyle +
            "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
          );
      }
    }
  };

  // 상태에 따른 텍스트 색상 반환
  const getStatusColor = (status) => {
    switch (status) {
      case "반려됨":
        return "text-red-600";
      case "승인됨":
        return "text-blue-600";
      case "대기중":
        return "text-yellow-600";
      case "완료됨":
      case "주문완료":
      case "입고 완료":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  // 비품 신청 시 부서 정보 활용 (수정)
  const handleNewStockRequest = () => {
    // 사용자의 부서 정보 가져오기
    const userDepartment = userLevelData?.department || "미지정";

    // 초기 데이터 설정 - 부서 정보 포함
    const initialData = {
      department: userDepartment,
      requestType: "manual", // 수동 신청으로 기본값 설정
      writer: userLevelData?.name || "",
      // 기타 필요한 초기 데이터
    };

    // 비품 신청 모달 열기
    setShowStockRequestModal(true);
  };

  // 비품 데이터 로드 부분
  useEffect(() => {
    if (!isVisible) return;

    // 재고 요청 데이터 가져오기
    const stockRef = query(
      collection(db, "stockRequests"),
      orderBy("createdAt2", "desc")
    );

    const unsubscribe = onSnapshot(stockRef, (snapshot) => {
      const stockData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          department: data.department || userLevelData?.department || "미지정", // 부서 정보 명시적 설정
          createdAt: data.createdAt2?.toDate() || new Date(),
          // 다른 필요한 필드들...
        };
      });

      setStockItems(stockData);
    });

    return () => unsubscribe();
  }, [isVisible, userLevelData?.department]);

  // 테스트를 위한 더미 데이터 (실제 데이터가 없을 경우에만 사용)
  useEffect(() => {
    if (!isVisible) return;

    // 실제 데이터가 없거나 테스트가 필요한 경우에만 더미 데이터 사용
    if (stockItems.length === 0) {
      // 더미 비품 데이터 설정
      const dummyStockItems = [
        {
          id: "stock1",
          itemName: "주사기 세트",
          category: "의료용 소모품",
          department: "진료", // 명시적 부서 정보
          quantity: 50,
          price: 15000,
          requestType: "auto",
          status: "대기중",
          writer: "김의사",
          createdAt: new Date(),
          vendor: "메디컬 서플라이",
        },
        {
          id: "stock2",
          itemName: "소독용 알코올",
          category: "의료용 소모품",
          department: "간호", // 명시적 부서 정보
          quantity: 30,
          price: 8000,
          requestType: "manual",
          status: "승인됨",
          writer: "이간호",
          createdAt: new Date(),
          vendor: "의료기기마트",
        },
        {
          id: "stock3",
          itemName: "프린터 토너",
          category: "사무용품",
          department: "원무", // 명시적 부서 정보
          quantity: 5,
          price: 120000,
          requestType: "manual",
          status: "대기중",
          writer: "최원무",
          createdAt: new Date(),
          vendor: "삼성메디컬",
        },
      ];

      // 상태 업데이트
      setStockItems(dummyStockItems);
    }
  }, [isVisible, stockItems.length]);

  // 장바구니 항목을 일괄 대기중으로 변경하는 함수 수정
  const handleMoveAllToWaiting = async () => {
    if (activeTab !== "stock") return;

    try {
      // 현재 사용자에게 보이는 데이터만 가져옴 (getCurrentData 사용)
      const currentItems = getCurrentData();
      // 현재 보이는 항목 중 장바구니 상태인 항목만 필터링
      const cartItems = currentItems.filter(
        (item) => item.status === "장바구니"
      );

      if (cartItems.length === 0) {
        showToast("장바구니에 항목이 없습니다.", "warning");
        return;
      }

      // 확인 모달 표시
      setConfirmModalProps({
        title: "장바구니 항목 이동",
        message: `장바구니에 있는 ${cartItems.length}개의 항목을 대기중 상태로 이동하시겠습니까?`,
        onConfirm: () => executeCartToWaiting(cartItems),
      });
      setShowConfirmModal(true);
    } catch (error) {
      console.error("장바구니 항목 확인 오류:", error);
      showToast("처리 중 오류가 발생했습니다.", "error");
    }
  };

  // 실제 장바구니 → 대기중 이동 처리 함수
  const executeCartToWaiting = async (cartItems) => {
    try {
      // 실제 Firestore 업데이트
      const updatePromises = cartItems.map((item) => {
        const docRef = doc(db, "stockRequests", item.id);
        return updateDoc(docRef, {
          status: "대기중",
          approvalReason: "장바구니에서 대기 상태로 이동함",
          updatedAt: new Date(),
          updatedBy: userLevelData?.id || "system",
          updatedByName: userLevelData?.name || "System",
        });
      });

      await Promise.all(updatePromises);
      showToast(
        `${cartItems.length}개 항목이 대기 상태로 이동되었습니다.`,
        "success"
      );
    } catch (error) {
      console.error("장바구니 항목 대기 상태 변경 오류:", error);
      showToast("항목 상태 변경 중 오류가 발생했습니다.", "error");
    }
  };

  // 실제 데이터 로딩 함수
  const loadRealData = async () => {
    console.log("데이터 로딩 시작 - 사용자 역할:", currentUser?.role);

    // 권한 확인
    const isOwner = isHospitalOwner(userLevelData, currentUser);
    const isAdminMgr = isAdministrativeManager(userLevelData, currentUser);

    console.log("◆ 데이터 로딩 권한 확인");
    console.log("◆ 대표원장 여부:", isOwner);
    console.log("◆ 원무과장 여부:", isAdminMgr);
    console.log("◆ 사용자 부서:", userLevelData?.department);
    console.log("◆ 현재 userLevelData.role:", userLevelData?.role);
    console.log("◆ 현재 currentUser.role:", currentUser?.role);

    if (isOwner) {
      console.log("=== 대표원장 권한으로 모든 데이터 조회 시작 ===");
    }

    // 휴가 신청 데이터 가져오기
    const vacationQuery = query(collection(db, "vacations"));

    const unsubscribeVacation = onSnapshot(vacationQuery, (snapshot) => {
      const vacations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt?.toDate?.() || new Date(),
      }));
      console.log("휴가 데이터 불러옴:", vacations.length, "건");
      setVacationRequests(vacations);
    });

    // 비품 신청 데이터 가져오기
    const stockQuery = query(collection(db, "stockRequests"));

    const unsubscribeStock = onSnapshot(stockQuery, (snapshot) => {
      const stocks = snapshot.docs.map((doc) => ({
        id: doc?.id,
        ...doc.data(),
        timestamp: doc.data().createdAt || new Date().getTime(),
      }));
      console.log("비품 데이터 불러옴:", stocks.length, "건");
      setStockRequests(stocks);
    });

    // 일반 요청 데이터 가져오기
    const requestQuery = query(collection(db, "requests"));

    const unsubscribeRequest = onSnapshot(requestQuery, (snapshot) => {
      const requests = snapshot.docs.map((doc) => ({
        id: doc?.id,
        ...doc.data(),
        timestamp: doc.data().createdAt || new Date().getTime(),
      }));
      setGeneralRequests(requests);
    });

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      unsubscribeVacation();
      unsubscribeStock();
      unsubscribeRequest();
    };
  };

  // 테스트 데이터 생성 함수 - 약 2710-2799 라인 사이
  const generateTestData = async () => {
    try {
      const defaultDepartments = [
        "진료팀",
        "간호팀",
        "물리치료팀",
        "원무팀",
        "방사선팀",
      ];
      const testRequests = [];
      const testVacations = [];
      const testStockRequests = [];

      // 1. 요청 데이터 생성
      for (let i = 0; i < 10; i++) {
        const department = defaultDepartments[i % defaultDepartments.length];
        const status = i < 3 ? "대기중" : i < 6 ? "승인됨" : "반려됨";

        testRequests.push({
          title: `테스트 요청 #${i + 1} - ${department}`,
          message: `이것은 ${department}의 테스트 요청입니다. 권한 테스트용으로 생성됩니다.`,
          receiverPeople: ["testadmin"],
          senderPeople: ["testuser"],
          senderLocation: "1층",
          senderDepartment: department,
          formattedTime: "12:00",
          createdAt: Date.now() - i * 3600000,
          createdAt2: new Date(),
          priority: i % 3 === 0 ? "상" : i % 3 === 1 ? "중" : "하",
          status: status,
          sentToManagers: false,
        });
      }

      // 2. 휴가 신청 데이터 생성
      for (let i = 0; i < 10; i++) {
        const department = defaultDepartments[i % defaultDepartments.length];
        const status = i < 3 ? "대기중" : i < 6 ? "승인됨" : "반려됨";
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + i);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (i % 3) + 1);

        testVacations.push({
          userId: `testuser${i}`,
          userName: `테스트사용자${i}`,
          email: `test${i}@example.com`,
          department: department,
          location: "1층",
          startDate: startDate.toISOString().split("T")[0],
          startTime: "09:00",
          endDate: endDate.toISOString().split("T")[0],
          endTime: "18:00",
          reason: `${department} 테스트 휴가 사유입니다.`,
          vacationType: i % 3 === 0 ? "휴가" : i % 3 === 1 ? "반차" : "경조사",
          dayTypes: {},
          holidayCount: 0,
          replacementId: null,
          status: status,
          days: i % 3 === 1 ? 0.5 : i % 3 === 0 ? (i % 5) + 1 : 0,
          createdAt: new Date(),
        });
      }

      // 3. 비품 신청 데이터 생성
      for (let i = 0; i < 15; i++) {
        const department = defaultDepartments[i % defaultDepartments.length];
        const statusOptions = ["대기중", "승인됨", "주문완료", "반려됨"];
        const status = statusOptions[i % statusOptions.length];
        const categories = [
          "사무용 소모품",
          "사무용품",
          "의료용 소모품",
          "의료용품",
          "마케팅용품",
        ];

        testStockRequests.push({
          itemName: `테스트 비품 #${i + 1}`,
          category: categories[i % categories.length],
          department: department,
          quantity: (i % 5) + 1,
          vendor: `테스트 거래처 ${(i % 3) + 1}`,
          measure: "개",
          requestReason: `${department} 테스트 비품 신청 사유입니다.`,
          writer: ["testuser"],
          price: (i + 1) * 10000,
          safeStock: i % 3 === 0 ? 5 : 0,
          vat: true,
          createdAt: Date.now() - i * 3600000,
          createdAt2: new Date(),
          status: status,
          requestedBy: `testuser${i}`,
          requestedByName: `테스트사용자${i}`,
          requestType: "manual",
        });
      }

      // 4. 장바구니 아이템 추가
      for (let i = 0; i < 5; i++) {
        const department = defaultDepartments[i % defaultDepartments.length];
        const categories = [
          "사무용 소모품",
          "사무용품",
          "의료용 소모품",
          "의료용품",
          "마케팅용품",
        ];

        testStockRequests.push({
          itemName: `장바구니 비품 #${i + 1}`,
          category: categories[i % categories.length],
          department: department,
          quantity: (i % 5) + 1,
          vendor: `테스트 거래처 ${(i % 3) + 1}`,
          measure: "개",
          requestReason: `${department} 장바구니 테스트입니다.`,
          writer: ["testuser"],
          price: (i + 1) * 5000,
          safeStock: 0,
          vat: true,
          createdAt: Date.now() - i * 3600000,
          createdAt2: new Date(),
          status: "장바구니",
          requestedBy: `testuser${i}`,
          requestedByName: `테스트사용자${i}`,
          requestType: "manual",
        });
      }

      // 요청 데이터 저장
      for (const request of testRequests) {
        await addDoc(collection(db, "requests"), request);
      }

      // 휴가 데이터 저장
      for (const vacation of testVacations) {
        await addDoc(collection(db, "vacations"), vacation);
      }

      // 비품 데이터 저장
      for (const stockRequest of testStockRequests) {
        await addDoc(collection(db, "stockRequests"), stockRequest);
      }

      showToast("테스트 데이터 생성 완료", "success");
      loadRealData(); // 데이터 다시 로드
    } catch (error) {
      console.error("테스트 데이터 생성 중 오류:", error);
      showToast("테스트 데이터 생성 실패", "error");
    }
  };

  // 테스트 데이터 생성 버튼 UI 수정
  <div className="flex flex-row w-full justify-between h-[50px] items-center mb-[10px]">
    {isGeneratingData ? (
      <span className="mr-5 text-xs text-blue-500">
        테스트 데이터 생성 중...
      </span>
    ) : (
      <button
        onClick={() => {
          setConfirmModalProps({
            title: "테스트 데이터 생성",
            message:
              "Firebase에 테스트 데이터를 생성하시겠습니까? 이 작업은 실제 데이터베이스에 영향을 줍니다.",
            onConfirm: generateTestData,
          });
          setShowConfirmModal(true);
        }}
        className="mr-5 text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
      >
        테스트 데이터 생성
      </button>
    )}
    <img
      onClick={() => setIsVisible(false)}
      className="w-[30px] cursor-pointer"
      src={cancel}
      alt="닫기"
    />
  </div>;

  // RequestStatusModal 컴포넌트 시작 부분
  useEffect(() => {
    if (isVisible) {
      loadRealData();
    }
  }, [isVisible]);

  // 거래처 클릭 핸들러
  const handleVendorClick = async (vendorName) => {
    if (!vendorName) return;

    try {
      // Firestore에서 거래처 데이터 가져오기
      const vendorsRef = query(
        collection(db, "vendors"),
        where("clientName", "==", vendorName)
      );

      const querySnapshot = await getDocs(vendorsRef);
      if (!querySnapshot.empty) {
        const vendorDoc = querySnapshot.docs[0];
        setSelectedVendorData({ id: vendorDoc.id, ...vendorDoc.data() });
        setVendorModalVisible(true);
      } else {
        // 더미 데이터에서 거래처 찾기
        const dummyVendors = [
          {
            id: "1",
            clientName: "메디컬 서플라이",
            url: "medicalsupply.co.kr",
          },
          { id: "2", clientName: "의료기기마트", url: "medicalmart.com" },
          {
            id: "3",
            clientName: "헬스케어솔루션",
            url: "healthcare-solution.kr",
          },
        ];

        const foundVendor = dummyVendors.find(
          (v) => v.clientName === vendorName
        );
        if (foundVendor) {
          setSelectedVendorData(foundVendor);
          setVendorModalVisible(true);
        } else {
          showToast("해당 거래처 정보를 찾을 수 없습니다.", "error");
        }
      }
    } catch (error) {
      console.error("거래처 정보 조회 오류:", error);
      showToast("거래처 정보를 불러오는 중 오류가 발생했습니다.", "error");
    }
  };

  // ItemDetailModal에서 접근할 수 있도록 전역 객체에 할당
  globalThis.onceHandleVendorClick = handleVendorClick;

  // 상태 변경을 위한 전역 상태 공유
  window.targetStatusChange = targetStatusChange;

  // RequestStatusModal 컴포넌트 내에서 targetStatusChange가 변경될 때마다 전역 변수에 복사
  useEffect(() => {
    window.targetStatusChange = targetStatusChange;
  }, [targetStatusChange]);

  return (
    <>
      {/* 애니메이션 스타일 적용 */}
      <style>{styles}</style>

      <ModalTemplate
        isVisible={isVisible}
        setIsVisible={setIsVisible}
        showCancel={false}
        modalClassName="rounded-xl"
      >
        <div className="flex flex-col w-onceBigModal h-onceBigModalH bg-white px-[40px] py-[30px]">
          <div className="flex flex-row w-full justify-between h-[50px] items-center mb-[10px]">
            <span className="text-[34px] font-bold">신청 현황</span>
            <div className="flex flex-row items-center">
              <img
                onClick={() => setIsVisible(false)}
                className="w-[30px] cursor-pointer"
                src={cancel}
                alt="닫기"
              />
            </div>
          </div>

          <div className="flex mb-4 bg-white rounded-lg overflow-hidden w-full border border-gray-300">
            <button
              className={`px-6 py-3 text-base flex-1 transition-all duration-200 cursor-pointer h-[50px] ${
                activeTab === "vacation"
                  ? "bg-onceBlue text-white font-bold"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } ${
                activeTab !== "vacation" && activeTab !== "stock"
                  ? ""
                  : "border-r border-gray-300"
              }`}
              onClick={() => handleTabChange("vacation")}
            >
              휴가 신청
            </button>
            <button
              className={`px-6 py-3 text-base flex-1 transition-all duration-200 cursor-pointer h-[50px] ${
                activeTab === "stock"
                  ? "bg-onceBlue text-white font-bold"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } ${
                activeTab !== "stock" && activeTab !== "request"
                  ? ""
                  : "border-r border-gray-300"
              }`}
              onClick={() => handleTabChange("stock")}
            >
              비품 신청
            </button>
            <button
              className={`px-6 py-3 text-base flex-1 transition-all duration-200 cursor-pointer h-[50px] ${
                activeTab === "request"
                  ? "bg-onceBlue text-white font-bold"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => handleTabChange("request")}
            >
              요청 관리
            </button>
          </div>

          {/* 안내 메시지 - 상단으로 이동 */}
          <div className="mb-4 bg-gray-100 p-3 rounded-lg text-sm text-gray-700 flex justify-between items-center">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-gray-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              {isAdmin ? (
                <span>
                  관리자 권한으로 항목을 드래그하여 상태를 변경할 수 있습니다.
                </span>
              ) : (
                <span>
                  신청 상태에 따라 자동으로 분류됩니다.
                  <br />
                  반려된 사안과 승인된 사안(비품의 경우 주문완료)은 일주일 후
                  목록에서 사라집니다.
                </span>
              )}
            </div>
            <div className="flex flex-shrink-0 space-x-2">
              {activeTab === "stock" && (
                <button
                  className="px-3 py-2 bg-onceBlue text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  onClick={handleMoveAllToWaiting}
                >
                  장바구니 → 대기중
                </button>
              )}
              <button
                className="px-4 py-2 bg-onceBlue text-white rounded-lg hover:bg-blue-600 transition-colors text-lg"
                onClick={() => handleNewRequest(activeTab)}
              >
                {activeTab === "vacation"
                  ? "휴가 신청"
                  : activeTab === "stock"
                  ? "비품 신청"
                  : "요청하기"}
              </button>
            </div>
          </div>

          <div className="flex-1">
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              collisionDetection={customCollisionDetection}
              measuring={{
                droppable: {
                  strategy: MeasuringStrategy.Always,
                },
              }}
              autoScroll={{
                enabled: true,
                threshold: { x: 0.1, y: 0.1 },
                acceleration: 12,
                interval: 5,
              }}
            >
              <div
                className={`grid ${getGridColsClass(
                  activeTab
                )} gap-2 h-full p-2`}
              >
                {STATUS_FLOW[activeTab]?.map((status) => {
                  const itemsByStatus = getItemsByStatus();
                  const items = itemsByStatus[status] || [];
                  //임의 값(arbitrary value) 클래스를 사용하여 scrollbar-hide 스타일 적용
                  return (
                    <DropArea
                      key={status}
                      id={status}
                      title={`${STATUS_DISPLAY_NAMES[status] || status} (${
                        items.length
                      })`}
                      items={items}
                      itemType={activeTab}
                      className={
                        status === "반려됨" || status === "취소됨"
                          ? "bg-red-50"
                          : status === "완료됨" ||
                            status === "입고 완료" ||
                            status === "주문완료"
                          ? "bg-green-50"
                          : status === "승인됨"
                          ? "bg-blue-50"
                          : status === "장바구니"
                          ? "bg-purple-50"
                          : status === "대기중"
                          ? "bg-yellow-50"
                          : ""
                      }
                      renderItem={(item) => (
                        <DraggableItem
                          key={item.id}
                          id={item.id}
                          data={item}
                          type={activeTab}
                          onItemClick={handleItemClick}
                          isVerified={verifiedItems[item.id] || false}
                        />
                      )}
                    />
                  );
                })}
              </div>

              <DragOverlay
                adjustScale={false}
                dropAnimation={null}
                zIndex={1000}
                modifiers={[
                  ({ transform }) => ({
                    ...transform,
                    y: transform.y - 10, // 위로 들어올리는 높이 축소
                  }),
                ]}
              >
                {renderDragOverlay()}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </ModalTemplate>

      {/* 각 신청 모달 컴포넌트들 */}

      {/* 아이템 상세 모달 */}
      {showDetailModal && selectedItem && (
        <ItemDetailModal
          isVisible={showDetailModal}
          setIsVisible={setShowDetailModal}
          item={selectedItem}
          itemType={activeTab}
          isAdmin={isAdmin}
          onStatusChange={handleModalStatusChange}
          verifiedItems={verifiedItems}
        />
      )}

      {/* 상태 변경 사유 입력 모달 */}
      <ReasonInputModal
        isVisible={showReasonModal}
        setIsVisible={setShowReasonModal}
        onSubmit={handleReasonSubmit}
        actionType={targetStatusChange.toStatus}
        itemType={activeTab}
      />

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

      {/* 확인 모달 추가 */}
      <ConfirmModal
        isVisible={showConfirmModal}
        setIsVisible={setShowConfirmModal}
        title={confirmModalProps.title}
        message={confirmModalProps.message}
        onConfirm={confirmModalProps.onConfirm}
      />

      {/* 거래처 정보 모달 */}
      {vendorModalVisible && selectedVendorData && (
        <VendorModal
          isVisible={vendorModalVisible}
          setIsVisible={setVendorModalVisible}
          vendor={selectedVendorData}
          mode="view"
          viewOnly={true}
        />
      )}
    </>
  );
};
export default RequestStatusModal;
