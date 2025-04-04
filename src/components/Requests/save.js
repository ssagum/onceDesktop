import React, { useState, useEffect } from "react";
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
} from "firebase/firestore";
import { db } from "../../firebase";
import { useUserLevel } from "../../utils/UserLevelContext";
import VacationModal from "../call/VacationModal";
import StockRequestModal from "../Warehouse/StockRequestModal";
import RequestModal from "../Home/RequestModal";
import { format } from "date-fns";
import ChipText from "../common/ChipText";
import { useToast } from "../../contexts/ToastContext";

// 드래그 가능한 항목 컴포넌트
const DraggableItem = ({ id, data, type, onItemClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: "item",
      item: data,
      itemType: type,
      id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
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

  let content;
  switch (type) {
    case "vacation":
      content = (
        <>
          <div className="font-medium text-gray-800 text-base mb-2 border-l-4 border-blue-500 pl-2">
            {getVacationTitle(data)}
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
            {data.reason}
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
              {data.userName}
            </div>
            <div>{formatShortDate(data.timestamp)}</div>
          </div>
        </>
      );
      break;
    case "stock":
      content = (
        <>
          <div className="font-medium text-gray-800 text-base mb-2 border-l-4 border-green-500 pl-2">
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

          <div className="flex flex-wrap text-sm text-gray-600 mb-2">
            <span className="mr-2 bg-gray-100 px-2 py-0.5 rounded-full text-xs">
              수량: {data.quantity} {data.measure || "개"}
            </span>
            {data.price > 0 && (
              <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs mt-2">
                단가: {data.price.toLocaleString()}원
              </span>
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
              {data.requestedByName}
            </div>
            <div>{formatShortDate(data.timestamp)}</div>
          </div>
        </>
      );
      break;
    case "request":
      content = (
        <>
          <div
            className="font-medium text-gray-800 text-base mb-2 border-l-4 border-purple-500 pl-2 truncate"
            title={data.title}
          >
            {data.title || "요청"}
          </div>

          <div
            className="text-sm text-gray-600 mb-2 line-clamp-2"
            title={data.message}
          >
            {data.message}
          </div>

          <div className="flex flex-wrap text-sm mb-2">
            <span className="mr-2 bg-gray-100 px-2 py-0.5 rounded-full text-xs">
              중요도: {data.priority || "중"}
            </span>
            <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
              수신자: {data.receiverPeople?.length || 0}명
            </span>
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
              {data.senderPeople?.[0] ? data.senderPeople[0] : "익명"}
            </div>
            <div>{formatShortDate(data.timestamp)}</div>
          </div>
        </>
      );
      break;
    default:
      content = <div>Unknown item type</div>;
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="bg-white p-3 mb-2 rounded-lg shadow-sm cursor-grab border border-gray-200 hover:shadow-md transition-shadow"
      onClick={() => onItemClick && onItemClick(data)}
    >
      {content}
    </div>
  );
};

// 드롭 영역 컴포넌트 - 전면적 재설계
const DropArea = ({ id, title, items, itemType, renderItem, className }) => {
  // useDroppable로 드롭 영역 정의
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "container",
      accepts: itemType,
      id,
    },
  });

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

  // 기본 컨테이너 배경색 결정
  const baseClass = className || "bg-gray-50";

  return (
    <div
      className={`h-full flex flex-col relative ${baseClass} rounded-lg p-2`}
      style={{ position: "relative" }}
    >
      {/* 전체 영역을 커버하는 완전히 투명한 드롭 영역 */}
      <div
        ref={setNodeRef}
        className={`absolute inset-0 z-[1] ${
          isOver ? "ring-2 ring-blue-500" : ""
        } rounded-lg`}
        style={{
          touchAction: "none",
          // 투명 영역에 hover와 다른 이벤트를 줄 수 있도록 포인터 이벤트 활성화
          pointerEvents: "auto",
        }}
        data-droppable-id={id}
        data-droppable-type="container"
      />

      {/* 드래그 오버 시 보여줄 시각적 표시 영역 */}
      {isOver && (
        <div className="absolute inset-0 bg-blue-100/30 z-[2] rounded-lg pointer-events-none" />
      )}

      {/* 컨텐츠 영역 - 좌표 이벤트가 투명 영역으로 전달되도록 pointer-events: none 적용 */}
      <div className="flex flex-col h-full z-[3] relative">
        {/* 헤더 */}
        <div
          className={`flex items-center justify-between mb-2 p-2 rounded-lg shadow-sm ${getHeaderBgColor(
            id
          )}`}
          style={{ pointerEvents: "auto" }} // 헤더는 클릭 가능하도록
        >
          <div className="flex items-center">
            {getStatusIcon(id)}
            <h3 className="font-medium text-gray-700 ml-2">{statusName}</h3>
          </div>
          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full flex items-center justify-center min-w-[28px]">
            {itemCount}
          </span>
        </div>

        {/* 태스크 영역 */}
        <div
          className="flex-1 overflow-y-auto p-1 min-h-[250px] max-h-[600px]"
          style={{ pointerEvents: "auto" }} // 스크롤과 태스크 클릭 가능하도록
        >
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.length > 0 ? (
              items.map((item) => renderItem(item))
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm italic">항목 없음</p>
              </div>
            )}
          </SortableContext>
        </div>
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

// 더미 데이터 정의
const DUMMY_VACATION_REQUESTS = [
  {
    id: "vac1",
    vacationType: "휴가",
    startDate: "2023/12/20",
    endDate: "2023/12/22",
    startTime: "09:00",
    endTime: "18:00",
    status: "승인됨",
    userName: "김의사",
    days: 3,
    reason: "연차 사용",
    timestamp: new Date("2023/12/10").getTime(),
  },
  {
    id: "vac2",
    vacationType: "반차",
    startDate: "2023/12/15",
    endDate: "2023/12/15",
    startTime: "09:00",
    endTime: "13:00",
    status: "대기중",
    userName: "박간호",
    halfDayType: "오전반차",
    days: 0.5,
    reason: "개인 사정",
    timestamp: new Date("2023/12/13").getTime(),
  },
  {
    id: "vac3",
    vacationType: "경조사",
    startDate: "2023/12/05",
    endDate: "2023/12/07",
    startTime: "09:00",
    endTime: "18:00",
    status: "반려됨",
    userName: "최관리",
    days: 3,
    reason: "결혼식 참석",
    timestamp: new Date("2023/12/01").getTime(),
  },
  {
    id: "vac4",
    vacationType: "휴가",
    startDate: "2023/12/24",
    endDate: "2023/12/26",
    startTime: "09:00",
    endTime: "18:00",
    status: "대기중",
    userName: "이수석",
    days: 3,
    reason: "크리스마스 휴가",
    timestamp: new Date("2023/12/18").getTime(),
  },
];

const DUMMY_STOCK_REQUESTS = [
  {
    id: "stock1",
    itemName: "의료용 소독제",
    category: "의료용 소모품",
    quantity: 10,
    measure: "개",
    price: 25000,
    status: "입고 완료",
    requestedByName: "김의사",
    timestamp: new Date("2023/12/05").getTime(),
  },
  {
    id: "stock2",
    itemName: "사무용 프린터 용지",
    category: "사무용 소모품",
    quantity: 5,
    measure: "박스",
    price: 35000,
    status: "승인됨",
    requestedByName: "박간호",
    timestamp: new Date("2023/12/10").getTime(),
  },
  {
    id: "stock3",
    itemName: "CT 장비",
    category: "의료용품",
    quantity: 1,
    measure: "대",
    price: 50000000,
    status: "장바구니",
    requestedByName: "최관리",
    timestamp: new Date("2023/12/15").getTime(),
  },
  {
    id: "stock4",
    itemName: "수술 장갑",
    category: "의료용 소모품",
    quantity: 20,
    measure: "박스",
    price: 120000,
    status: "주문완료",
    requestedByName: "이과장",
    timestamp: new Date("2023/12/12").getTime(),
  },
  {
    id: "stock5",
    itemName: "모니터",
    category: "사무용품",
    quantity: 3,
    measure: "대",
    price: 750000,
    status: "대기중",
    requestedByName: "최과장",
    timestamp: new Date("2023/12/17").getTime(),
  },
  {
    id: "stock6",
    itemName: "수액세트",
    category: "의료용 소모품",
    quantity: 50,
    measure: "세트",
    price: 15000,
    status: "장바구니",
    requestedByName: "김간호",
    timestamp: new Date("2023/12/19").getTime(),
  },
];

const DUMMY_REQUESTS = [
  {
    id: "req1",
    title: "진료실 에어컨 점검 요청",
    message:
      "3번 진료실 에어컨에서 이상한 소음이 발생하고 있습니다. 점검 부탁드립니다.",
    status: "완료됨",
    receiverPeople: ["admin1", "admin2"],
    senderPeople: ["user1"],
    priority: "상",
    timestamp: new Date("2023/12/01").getTime(),
  },
  {
    id: "req2",
    title: "약품 발주 요청",
    message: "진통제가 부족하니 발주 부탁드립니다.",
    status: "승인됨",
    receiverPeople: ["admin1"],
    senderPeople: ["user1"],
    priority: "중",
    timestamp: new Date("2023/12/10").getTime(),
  },
  {
    id: "req3",
    title: "환자 기록 수정 요청",
    message: "김환자의 진료 기록에 오류가 있습니다. 수정 부탁드립니다.",
    status: "대기중",
    receiverPeople: ["admin1", "admin2", "admin3"],
    senderPeople: ["user1"],
    priority: "하",
    timestamp: new Date("2023/12/15").getTime(),
  },
  {
    id: "req4",
    title: "회의실 사용 요청",
    message:
      "12월 20일 오후 2시에 팀 미팅을 위해 2번 회의실 사용을 요청합니다.",
    status: "대기중",
    receiverPeople: ["admin2"],
    senderPeople: ["user1"],
    priority: "중",
    timestamp: new Date("2023/12/18").getTime(),
  },
];

// 휴가 신청 유형 포맷 함수
const getVacationTitle = (item) => {
  if (item.vacationType === "휴가") {
    return `${item.vacationType} (${item.days}일)`;
  } else if (item.vacationType === "반차") {
    return `${item.vacationType} (${item.halfDayType || ""})`;
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

const RequestStatusModal = ({
  isVisible,
  setIsVisible,
  initialTab = "vacation",
}) => {
  const { userLevelData } = useUserLevel();
  const { showToast } = useToast();
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

  // 상태별 필터링
  const [statusFilter, setStatusFilter] = useState("all");

  // 더미 데이터 사용 여부
  const [useDummyData, setUseDummyData] = useState(true);

  // 드래그 중인 항목
  const [activeId, setActiveId] = useState(null);

  // 관리자 권한 여부
  const isAdmin =
    userLevelData?.role === "admin" || userLevelData?.role === "manager";

  // dnd-kit 센서 설정 - 더 민감하게 조정
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // 더 민감한 마우스 감지를 위해 거리 축소
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(TouchSensor, {
      // 터치 감지 딜레이 축소
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  // 데이터 불러오기
  useEffect(() => {
    // 더미 데이터 사용시 기본 데이터 설정
    if (useDummyData) {
      // 상태 이름 변경
      const updatedVacations = DUMMY_VACATION_REQUESTS.map((item) => ({
        ...item,
        status:
          item.status === "승인됨"
            ? "승인됨"
            : item.status === "반려됨"
            ? "반려됨"
            : item.status,
      }));

      const updatedStocks = DUMMY_STOCK_REQUESTS.map((item) => ({
        ...item,
        status:
          item.status === "승인됨"
            ? "승인됨"
            : item.status === "반려됨"
            ? "반려됨"
            : item.status,
      }));

      const updatedRequests = DUMMY_REQUESTS.map((item) => ({
        ...item,
        status:
          item.status === "승인됨"
            ? "승인됨"
            : item.status === "반려됨"
            ? "반려됨"
            : item.status,
      }));

      setVacationRequests(updatedVacations);
      setStockRequests(updatedStocks);
      setGeneralRequests(updatedRequests);
      return;
    }

    if (!userLevelData?.id || !isVisible) return;

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
  }, [userLevelData?.id, isVisible, useDummyData]);

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
  };

  // 드래그 종료 핸들러 개선
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    // 디버그 정보 로깅
    console.log("Drag End:", {
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

    // 드롭 대상이 컨테이너인지 확인 - data.type이 없어도 id만으로 처리
    if (over.data.current?.type !== "container") {
      // ID가 STATUS_FLOW에 속하는 값이라면 컨테이너로 간주
      const targetStatus = STATUS_FLOW[activeTab]?.find(
        (status) => status === over.id
      );
      if (!targetStatus) {
        console.log("Drop target is not a valid container");
        return;
      }
    }

    // 현재 아이템 정보 가져오기
    let currentCollection;
    let currentItem;
    let updateFunction;

    switch (activeTab) {
      case "vacation":
        currentCollection = "vacations";
        currentItem = vacationRequests.find((item) => item.id === active.id);
        updateFunction = (newStatus) => {
          setVacationRequests((prev) =>
            prev.map((item) => {
              if (item.id === active.id) {
                // "승인"을 "승인됨"으로, "거부됨"을 "반려됨"으로 변환
                let updatedStatus = newStatus;
                if (newStatus === "승인") updatedStatus = "승인됨";
                if (newStatus === "반려됨") updatedStatus = "반려됨";
                console.log(
                  `Vacation status updated: ${item.id} -> ${updatedStatus}`
                );
                return { ...item, status: updatedStatus };
              }
              return item;
            })
          );
        };
        break;
      case "stock":
        currentCollection = "stockRequests";
        currentItem = stockRequests.find((item) => item.id === active.id);
        updateFunction = (newStatus) => {
          setStockRequests((prev) =>
            prev.map((item) => {
              if (item.id === active.id) {
                // "승인"을 "승인됨"으로, "거부됨"을 "반려됨"으로 변환
                let updatedStatus = newStatus;
                if (newStatus === "승인") updatedStatus = "승인됨";
                if (newStatus === "반려됨") updatedStatus = "반려됨";
                console.log(
                  `Stock status updated: ${item.id} -> ${updatedStatus}`
                );
                return { ...item, status: updatedStatus };
              }
              return item;
            })
          );
        };
        break;
      case "request":
        currentCollection = "requests";
        currentItem = generalRequests.find((item) => item.id === active.id);
        updateFunction = (newStatus) => {
          setGeneralRequests((prev) =>
            prev.map((item) => {
              if (item.id === active.id) {
                // "승인"을 "승인됨"으로, "거부됨"을 "반려됨"으로 변환
                let updatedStatus = newStatus;
                if (newStatus === "승인") updatedStatus = "승인됨";
                if (newStatus === "반려됨") updatedStatus = "반려됨";
                console.log(
                  `Request status updated: ${item.id} -> ${updatedStatus}`
                );
                return { ...item, status: updatedStatus };
              }
              return item;
            })
          );
        };
        break;
      default:
        return;
    }

    if (!currentItem) {
      console.log("Current item not found", active.id);
      return;
    }

    // 상태 변경 - 컨테이너 ID를 사용
    const newStatus = over.data.current.id;
    console.log("New status:", newStatus);

    // 변경된 내용 DB에 업데이트 (더미 데이터 사용 중에는 로컬 상태만 변경)
    if (useDummyData) {
      updateFunction(newStatus);
      showToast(
        `상태가 '${
          STATUS_DISPLAY_NAMES[newStatus] || newStatus
        }'(으)로 변경되었습니다.`,
        "success"
      );
    } else {
      try {
        // "승인"을 "승인됨"으로, "거부됨"을 "반려됨"으로 변환
        let dbStatus = newStatus;
        if (dbStatus === "승인") dbStatus = "승인됨";
        if (dbStatus === "반려됨") dbStatus = "반려됨";

        const docRef = doc(db, currentCollection, currentItem.id);
        updateDoc(docRef, {
          status: dbStatus,
          updatedAt: new Date(),
          updatedBy: userLevelData?.id || "system",
          updatedByName: userLevelData?.name || "System",
        }).then(() => {
          updateFunction(newStatus);
          showToast(
            `상태가 '${
              STATUS_DISPLAY_NAMES[newStatus] || newStatus
            }'(으)로 변경되었습니다.`,
            "success"
          );
        });
      } catch (error) {
        console.error("상태 업데이트 오류:", error);
        showToast("상태 변경에 실패했습니다.", "error");
      }
    }
  };

  // 선택된 탭의 데이터 가져오기
  const getCurrentData = () => {
    switch (activeTab) {
      case "vacation":
        return vacationRequests;
      case "stock":
        return stockRequests;
      case "request":
        return generalRequests;
      default:
        return [];
    }
  };

  // 상태별로 데이터 분류
  const getItemsByStatus = () => {
    const data = getCurrentData();
    const statusOrder = STATUS_FLOW[activeTab] || [];
    const result = {};

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
      <div className="bg-white p-3 rounded-lg shadow-lg border-2 border-blue-300 w-64 opacity-95 cursor-grabbing">
        <div className="flex items-center border-l-4 border-blue-500 pl-2 py-1 mb-2">
          {getTypeIcon()}
          <div className="font-medium text-gray-800 truncate">{getTitle()}</div>
        </div>
        <div className="text-sm text-gray-600 pl-2">{getSubtitle()}</div>
      </div>
    );
  };

  return (
    <>
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
              <div
                className="mr-5 text-xs cursor-pointer text-gray-500 hover:text-gray-700"
                onClick={() => setUseDummyData(!useDummyData)}
              >
                {useDummyData ? "실제 데이터 사용" : "더미 데이터 사용"}
              </div>
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
                <span>신청 상태에 따라 자동으로 분류됩니다.</span>
              )}
            </div>
            <button
              className="px-4 py-2 bg-onceBlue text-white rounded-lg hover:bg-blue-600 transition-colors flex-shrink-0 text-lg"
              onClick={() => handleNewRequest(activeTab)}
            >
              {activeTab === "vacation"
                ? "휴가 신청"
                : activeTab === "stock"
                ? "비품 신청"
                : "요청하기"}
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              collisionDetection={closestCorners}
              autoScroll={true}
              measuring={{
                droppable: {
                  strategy: "always",
                },
              }}
            >
              <div
                className={`grid ${getGridColsClass(activeTab)} gap-4 h-full`}
              >
                {STATUS_FLOW[activeTab]?.map((status) => {
                  const itemsByStatus = getItemsByStatus();
                  const items = itemsByStatus[status] || [];

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
                          onItemClick={() => setSelectedItem(item)}
                        />
                      )}
                    />
                  );
                })}
              </div>

              <DragOverlay adjustScale>{renderDragOverlay()}</DragOverlay>
            </DndContext>
          </div>
        </div>
      </ModalTemplate>

      {/* 각 신청 모달 컴포넌트들 */}
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
    </>
  );
};

export default RequestStatusModal;
