import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { cancel } from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import WhoSelector from "../common/WhoSelector";
import ModalTemplate from "../common/ModalTemplate";
import CurrencyInput from "../common/CurrencyInput";
import ItemRegistrationZone from "./ItemRegistrationZone";
import JcyTable from "../common/JcyTable";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import PropTypes from "prop-types";
import { QRCodeCanvas } from "qrcode.react";
import { IoPrintOutline } from "react-icons/io5";
import { PDFDocument } from "pdf-lib";
import html2canvas from "html2canvas";
import { useToast } from "../../contexts/ToastContext";
import VendorModal from "./VendorModal";
import ChipText from "../common/ChipText";

const ModalHeaderZone = styled.div``;
const WhoZone = styled.div``;
const TitleZone = styled.div``;
const ContentZone = styled.div``;
const ButtonZone = styled.div``;
const TopZone = styled.div``;
const TopLeftZone = styled.div``;
const TopRightZone = styled.div``;
const Zone = styled.div``;
const PlusPurchaseModal = styled.div``;

export default function StockDetailModal({
  isVisible,
  setIsVisible,
  item: initialItem,
  onUpdate,
  setWarehouseMode,
}) {
  const { showToast } = useToast();
  const [item, setItem] = useState(initialItem);
  const [isPlusPurchaseModalOn, setIsPlusPurchaseModalOn] = useState(false);
  const [isRegistrationModalOn, setIsRegistrationModalOn] = useState(false);
  const [formData, setFormData] = useState({
    writer: initialItem?.writer || [],
    requester: initialItem?.requester || [],
    orderReason: "추가 주문",
  });
  const [isQRModalOn, setIsQRModalOn] = useState(false);
  const [qrSize, setQrSize] = useState(150);
  const printRef = useRef();
  const [isSimpleStockModalOn, setIsSimpleStockModalOn] = useState(false);
  const [stockAction, setStockAction] = useState("입고");
  const [simpleStockData, setSimpleStockData] = useState({
    writer: [],
    requester: [],
    quantity: "",
    reason: "",
  });
  const [isVendorModalVisible, setIsVendorModalVisible] = useState(false);
  const [vendorData, setVendorData] = useState(null);
  const [vendorModalMode, setVendorModalMode] = useState("view");

  // 내부 상태에서 item 값을 사용
  const {
    id,
    category,
    itemName,
    department,
    price,
    vat,
    quantity,
    safeStock,
    vendor,
    location,
    measure,
    state,
  } = item || {};

  // 입출고 내역을 위한 컬럼 정의
  const stockHistoryColumns = [
    { key: "date", label: "날짜" },
    { key: "type", label: "구분" },
    { key: "quantity", label: "수량" },
    { key: "previousStock", label: "이전재고" },
    { key: "currentStock", label: "현재재고" },
    { key: "writer", label: "작성자" },
    { key: "reason", label: "사유" },
  ];

  // 예시 데이터 - 실제로는 Firestore에서 가져올 데이터
  const [stockHistory, setStockHistory] = useState([]);

  // stockAction이 변경될 때 reason 필드 자동 설정
  useEffect(() => {
    let defaultReason = "";
    if (stockAction === "입고") {
      defaultReason = "PC 입고";
    } else if (stockAction === "출고") {
      defaultReason = "PC 출고";
    }

    setSimpleStockData((prev) => ({
      ...prev,
      reason: defaultReason,
    }));
  }, [stockAction]);

  // props로 전달받은 item이 변경될 때 내부 상태 업데이트
  useEffect(() => {
    setItem(initialItem);
  }, [initialItem]);

  // Firestore에서 재고 히스토리 가져오기
  useEffect(() => {
    const fetchStockHistory = async () => {
      if (!item?.id) return;

      try {
        const historyRef = collection(db, "stockHistory");
        const q = query(historyRef, where("itemId", "==", item.id));

        const querySnapshot = await getDocs(q);
        const history = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            date: data.date?.toDate().toLocaleDateString() || "-",
            requester: data.requester || "-",
            state: data.state || "-",
            dateForSort: data.date?.toDate() || new Date(0),
          };
        });

        // JavaScript로 date 기준 내림차순 정렬
        const sortedHistory = history.sort(
          (a, b) => b.dateForSort - a.dateForSort
        );
        setStockHistory(sortedHistory);
      } catch (error) {
        console.error("Error fetching stock history:", error);
      }
    };

    fetchStockHistory();
  }, [item?.id]);

  // stockHistory 실시간 리스너 설정
  useEffect(() => {
    if (!item?.id) return;

    const historyRef = collection(db, "stockHistory");
    const q = query(historyRef, where("itemId", "==", item.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          date: data.date?.toDate().toLocaleDateString() || "-",
          requester: data.requester || "-",
          state: data.state || "-",
          dateForSort: data.date?.toDate() || new Date(0),
        };
      });

      // JavaScript로 date 기준 내림차순 정렬
      const sortedHistory = history.sort(
        (a, b) => b.dateForSort - a.dateForSort
      );
      setStockHistory(sortedHistory);

      // 가장 최근 재고 히스토리의 currentStock으로 아이템 재고 업데이트
      if (sortedHistory.length > 0) {
        const latestHistory = sortedHistory[0];
        // 현재 아이템의 quantity와 최신 히스토리의 currentStock이 다를 경우에만 업데이트
        if (latestHistory.currentStock !== Number(item.quantity)) {
          const updatedItem = { ...item, quantity: latestHistory.currentStock };
          setItem(updatedItem);
          // 부모 컴포넌트에도 업데이트 알림
          onUpdate?.(updatedItem);
        }
      }
    });

    return () => unsubscribe();
  }, [item?.id, item?.quantity, onUpdate]);

  const handleItemUpdate = ({ type, data }) => {
    if (type === "update") {
      onUpdate?.(data); // 부모 컴포넌트에 업데이트 알림
      setIsRegistrationModalOn(false);
      // 모달을 닫지 않도록 주석 처리
      // setIsVisible(false);

      // 현재 컴포넌트의 item 상태도 업데이트
      setItem(data);

      // 성공 메시지 표시
      showToast("물품 정보가 업데이트 되었습니다.", "success");
    }
  };

  // 이미지 업로드 핸들러 추가
  const handleImageUpload = (e) => {
    // 이미지 업로드 로직 구현 필요
    console.log("이미지 업로드:", e.target.files[0]);
  };

  // WhoSelector 변경 핸들러 추가
  const handlePeopleChange = (type) => (selectedPeople) => {
    setFormData((prev) => ({
      ...prev,
      [type]: selectedPeople,
    }));
  };

  const handleDeleteItem = async () => {
    try {
      if (!item?.id) return;

      if (!window.confirm("정말로 이 품목을 삭제하시겠습니까?")) {
        return;
      }

      const itemRef = doc(db, "stocks", item.id);
      await updateDoc(itemRef, {
        isHidden: true,
        lastUpdated: serverTimestamp(),
      });

      // 모달 닫기
      setIsVisible(false);
      showToast("품목이 삭제되었습니다.", "success");
    } catch (error) {
      console.error("Error deleting item:", error);
      showToast("품목 삭제 중 오류가 발생했습니다.", "error");
    }
  };

  const handlePurchaseRequest = async () => {
    try {
      if (!formData.writer.length) {
        showToast("작성자를 선택해주세요.", "error");
        return;
      }

      // 아이템 상태를 "주문 필요"로 업데이트
      const itemRef = doc(db, "stocks", item.id);
      await updateDoc(itemRef, {
        state: "주문 필요",
        lastUpdated: serverTimestamp(),
      });

      // stockHistory에 주문 요청 기록 추가
      await addDoc(collection(db, "stockHistory"), {
        itemId: item.id,
        itemName: item.itemName,
        type: "주문 필요",
        quantity: Number(formData.orderQuantity),
        previousStock: Number(item.quantity),
        currentStock: Number(item.quantity), // 주문 요청은 현재 재고를 변경하지 않음
        date: serverTimestamp(),
        writer: item.writer || [],
        requester: item.requester || [],
        requestDate: serverTimestamp(),
        department: item.department,
        reason: formData.orderReason,
        status: "대기",
        measure: item.measure,
        state: "주문 필요",
      });

      // 현재 컴포넌트의 item 상태 업데이트
      const updatedItem = { ...item, state: "주문 필요" };
      setItem(updatedItem);
      onUpdate(updatedItem);

      // 폼 초기화 및 모달 닫기
      setFormData((prev) => ({
        ...prev,
        orderQuantity: "",
        orderReason: "추가 주문",
      }));
      setIsPlusPurchaseModalOn(false);
      showToast("주문 요청이 등록되었습니다.", "success");
    } catch (error) {
      console.error("Error creating purchase request:", error);
      showToast("주문 요청 등록 중 오류가 발생했습니다.", "error");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!item?.id) return;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 크기
    const { width, height } = page.getSize();

    const element = document.getElementById(`qr-${item.id}`);
    const canvas = await html2canvas(element, { scale: 2 });
    const qrImage = await pdfDoc.embedPng(canvas.toDataURL("image/png"));

    // 중앙에 QR 코드 배치
    page.drawImage(qrImage, {
      x: (width - qrSize) / 2,
      y: (height - qrSize) / 2,
      width: qrSize,
      height: qrSize,
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `QR_${item.itemName}.pdf`;
    link.click();
  };

  const handleSimpleStockUpdate = async () => {
    try {
      if (!simpleStockData.writer.length) {
        showToast("작성자를 선택해주세요.", "error");
        return;
      }

      if (!simpleStockData.quantity || simpleStockData.quantity === "0") {
        showToast("수량을 입력해주세요.", "error");
        return;
      }

      let newQuantity = Number(item.quantity);
      const changeQuantity = Number(simpleStockData.quantity);

      // 입고/출고에 따라 수량 계산
      if (stockAction === "입고") {
        newQuantity += changeQuantity;
      } else {
        // 출고일 경우 재고 체크
        if (changeQuantity > newQuantity) {
          showToast("출고 수량이 현재 재고보다 많습니다.", "error");
          return;
        }
        newQuantity -= changeQuantity;
      }

      // 출고 시 상태 결정
      let newState = item.state;
      let historyState = stockAction === "입고" ? "입고 완료" : item.state;

      if (stockAction === "입고") {
        newState = "입고 완료";
        historyState = "입고 완료";
      } else if (stockAction === "출고") {
        // 출고 후 재고가 안전재고 이하면 "주문 필요" 상태로 변경
        if (newQuantity <= Number(item.safeStock || 0)) {
          newState = "주문 필요";
          historyState = "주문 필요";
        }
        // 출고 시에는 기본적으로 상태를 변경하지 않음
      }

      // 재고 히스토리 추가
      await addDoc(collection(db, "stockHistory"), {
        itemId: item.id,
        itemName: item.itemName,
        type: stockAction,
        quantity: changeQuantity,
        previousStock: Number(item.quantity),
        currentStock: newQuantity,
        date: serverTimestamp(),
        writer: simpleStockData.writer,
        requester: simpleStockData.requester,
        reason: simpleStockData.reason,
        department: item.department,
        measure: item.measure,
        status: "완료",
        state: historyState,
      });

      // 실제 재고 업데이트
      const itemRef = doc(db, "stocks", item.id);
      await updateDoc(itemRef, {
        quantity: newQuantity,
        state: newState,
        lastUpdated: serverTimestamp(),
      });

      // 현재 표시된 아이템 정보 업데이트
      const updatedItem = { ...item, quantity: newQuantity, state: newState };
      onUpdate(updatedItem);

      // 현재 컴포넌트에서도 아이템 정보 업데이트 (모달이 닫히지 않도록)
      setItem(updatedItem);

      // 폼 초기화 (모달은 닫지 않음)
      setSimpleStockData({
        writer: [],
        requester: [],
        quantity: "",
        reason: "",
      });
      setIsSimpleStockModalOn(false);
      showToast(`${stockAction} 처리가 완료되었습니다.`, "success");
    } catch (error) {
      console.error("Error updating stock:", error);
      showToast(`${stockAction} 처리 중 오류가 발생했습니다.`, "error");
    }
  };

  // 단순 입출고용 작성자 변경 핸들러
  const handleSimpleStockWriterChange = (selectedPeople) => {
    setSimpleStockData((prev) => ({
      ...prev,
      writer: selectedPeople,
    }));
  };

  // 거래처 정보 가져오기 함수
  const fetchVendorInfo = async (vendorName) => {
    if (!vendorName) return;

    try {
      const vendorsRef = query(
        collection(db, "vendors"),
        where("clientName", "==", vendorName)
      );

      const querySnapshot = await getDocs(vendorsRef);
      if (!querySnapshot.empty) {
        const vendorDoc = querySnapshot.docs[0];
        setVendorData({ id: vendorDoc.id, ...vendorDoc.data() });
        setIsVendorModalVisible(true);
      } else {
        showToast("해당 거래처 정보를 찾을 수 없습니다.", "error");
      }
    } catch (error) {
      console.error("거래처 정보 조회 오류:", error);
      showToast("거래처 정보를 불러오는 중 오류가 발생했습니다.", "error");
    }
  };

  // 거래처 클릭 핸들러
  const handleVendorClick = () => {
    if (vendor) {
      fetchVendorInfo(vendor);
    }
  };

  return (
    <ModalTemplate
      isVisible={isVisible}
      setIsVisible={setIsVisible}
      showCancel={false}
      modalClassName="rounded-xl"
    >
      <div className="flex flex-col items-center w-onceBigModal h-onceBigModalH bg-white px-[40px] py-[30px]">
        <ModalHeaderZone className="flex flex-row w-full justify-between h-[50px] items-center mb-[20px]">
          <span className="text-[34px] font-bold">물품 상세</span>
          <img
            onClick={() => setIsVisible(false)}
            className="w-[30px] cursor-pointer"
            src={cancel}
            alt="닫기"
          />
        </ModalHeaderZone>
        <TopZone className="flex flex-row w-full">
          <TopLeftZone className="flex-[3] flex flex-col">
            <WhoZone className="flex flex-row items-center w-full px-[20px] my-[15px]">
              <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px]">
                작성자:
              </label>
              <div className="cursor-pointer">
                <WhoSelector
                  who={"작성자"}
                  selectedPeople={formData.writer}
                  onPeopleChange={handlePeopleChange("writer")}
                />
              </div>
              {/* <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px] ml-[20px]">
                요청자:
              </label>
              <WhoSelector
                who={"요청자"}
                selectedPeople={formData.requester}
                onPeopleChange={handlePeopleChange("requester")}
              /> */}
              <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[40px] ml-[20px]">
                부서:
              </label>
              <div className="w-[120px]">
                <OnceOnOffButton
                  text={department || "진료"}
                  className="w-[80px] h-[40px] rounded-lg"
                />
              </div>
              <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[40px] ml-[20px]">
                상태:
              </label>
              <div className="w-[120px]">
                <ChipText text={state || "일반"} />
              </div>
            </WhoZone>
            <Zone className="flex flex-row items-center w-full px-[20px] mb-[15px]">
              <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px]">
                품명:
              </label>
              <input
                type="text"
                value={itemName || ""}
                readOnly
                placeholder="품명"
                className="w-[490px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
              />
            </Zone>
            <Zone className="flex flex-row items-center w-full px-[20px] mb-[15px]">
              <div className="flex-[1] flex-row flex">
                <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px]">
                  분류:
                </label>
                <div className="w-[120px]">
                  <OnceOnOffButton
                    text={category || "의료용 소모품"}
                    className="w-[120px] h-[40px] rounded-lg"
                  />
                </div>
              </div>
              <div className="flex-[1] flex-row flex">
                <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px]">
                  단위:
                </label>
                <input
                  type="text"
                  value={measure || ""}
                  readOnly
                  placeholder="단위"
                  className="w-[200px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
                />
              </div>
            </Zone>
            <Zone className="flex flex-row items-center w-full px-[20px] mb-[15px]">
              <div className="flex-[1] flex-row flex">
                <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px]">
                  현재재고:
                </label>
                <input
                  type="number"
                  value={quantity || ""}
                  readOnly
                  placeholder="현재재고 수량"
                  className="w-[200px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
                />
              </div>
              <div className="flex-[1] flex-row flex">
                <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px]">
                  안전재고:
                </label>
                <input
                  type="number"
                  value={safeStock || ""}
                  readOnly
                  placeholder="안전재고 수량"
                  className="w-[200px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
                />
              </div>
            </Zone>
            <Zone className="flex flex-row items-center w-full px-[20px] mb-[15px]">
              <label className="h-[40px] flex flex-row items-center font-semibold text-black w-[70px]">
                거래처:
              </label>
              <div className="relative w-[490px]">
                <input
                  type="text"
                  value={vendor || ""}
                  readOnly
                  placeholder="거래처 정보 없음"
                  className={`w-full border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground ${
                    vendor ? "cursor-pointer hover:bg-gray-100" : ""
                  }`}
                  onClick={handleVendorClick}
                />
                {vendor && (
                  <div
                    onClick={handleVendorClick}
                    className="absolute right-3 top-[10px] text-blue-500 flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-once14">상세보기</span>
                  </div>
                )}
              </div>
            </Zone>
          </TopLeftZone>
          <TopRightZone className="flex-[2] flex flex-col pr-[30px] py-[20px] h-[380px]">
            <div className="flex relative w-full h-full bg-gray-100 cursor-pointer overflow-hidden rounded-lg">
              {item?.locationImage ? (
                <img
                  src={item.locationImage}
                  alt={itemName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <span className="text-gray-500">위치 이미지 없음</span>
                </div>
              )}
              <div className="absolute w-full flex h-[40px] bottom-0 items-center justify-center opacity-50 bg-black">
                <span className="text-white text-once18 text-center">
                  {location || "위치 미지정"}
                </span>
              </div>
            </div>
          </TopRightZone>
        </TopZone>
        <ContentZone className="flex flex-col w-full px-[20px] my-[15px] h-[230px]">
          <div className="w-full h-full border border-gray-300 rounded-md overflow-hidden">
            {/* 테이블 헤더 */}
            <div className="grid grid-cols-7 gap-4 bg-gray-50 border-b border-gray-300 h-12 items-center font-semibold sticky top-0 px-2">
              {stockHistoryColumns.map((column) => (
                <div key={column.key} className="text-center text-gray-700">
                  {column.label}
                </div>
              ))}
            </div>

            {/* 테이블 바디 - 스크롤 가능한 영역 (4개 항목만 보이도록 높이 조정) */}
            <div
              className="overflow-y-auto h-[calc(100%-48px)] max-h-[168px] scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {stockHistory.length > 0 ? (
                stockHistory.map((row, index) => (
                  <div
                    key={index}
                    className={`grid grid-cols-7 gap-4 py-3 h-[42px] ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } hover:bg-gray-100 transition-colors px-2`}
                  >
                    <div className="text-center">{row.date}</div>
                    <div className="text-center">
                      <span
                        className={`px-2 py-1 rounded ${
                          row.type === "입고"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {row.type}
                      </span>
                    </div>
                    <div className="text-center">{row.quantity}</div>
                    <div className="text-center">{row.previousStock}</div>
                    <div className="text-center">{row.currentStock}</div>
                    <div className="text-center">{row.writer}</div>
                    <div className="text-center">{row.reason}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  입출고 내역이 없습니다.
                </div>
              )}
            </div>
          </div>
        </ContentZone>
        <ButtonZone className="flex flex-row w-full justify-center px-[20px] mt-[10px]">
          <div className="flex flex-row gap-x-[20px] w-full">
            <OnceOnOffButton
              text={"품목 삭제"}
              on={true}
              onClick={handleDeleteItem}
            />
            <OnceOnOffButton
              text={"품목정보 수정"}
              on={true}
              onClick={() => {
                if (typeof setWarehouseMode === "function") {
                  setWarehouseMode("품목등록", item);
                  setIsVisible(false);
                } else {
                  console.error(
                    "setWarehouseMode is not properly passed as a prop"
                  );
                }
              }}
            />
            <OnceOnOffButton
              on={true}
              text={"추가 주문"}
              onClick={() => setIsPlusPurchaseModalOn(true)}
            />
            <OnceOnOffButton
              on={true}
              text={"단순 입출고"}
              onClick={() => setIsSimpleStockModalOn(true)}
            />
            <OnceOnOffButton
              on={true}
              text={"QR 인쇄"}
              onClick={() => setIsQRModalOn(true)}
            />
          </div>
        </ButtonZone>
      </div>

      {/* 품목정보 수정 모달 */}
      {isRegistrationModalOn && (
        <ItemRegistrationZone
          item={{
            ...item,
            docId: item?.firestoreId, // Firestore document ID 추가
          }}
          onRegister={handleItemUpdate}
        />
      )}

      {/* 거래처 정보 모달 */}
      {isVendorModalVisible && vendorData && (
        <VendorModal
          isVisible={isVendorModalVisible}
          setIsVisible={setIsVendorModalVisible}
          vendor={vendorData}
          mode="view"
          onUpdate={() => {}}
          viewOnly={true} // 확인 버튼만 표시하기 위한 속성 추가
        />
      )}

      {/* 추가 주문 모달 */}
      <ModalTemplate
        isVisible={isPlusPurchaseModalOn}
        setIsVisible={setIsPlusPurchaseModalOn}
        showCancel={false}
        modalClassName="rounded-xl"
      >
        <div className="flex flex-col items-center w-[500px] bg-white p-[30px] rounded-xl">
          <div className="flex justify-between items-center w-full mb-6">
            <span className="text-2xl font-bold">추가 주문</span>
            <img
              onClick={() => setIsPlusPurchaseModalOn(false)}
              className="w-[30px] cursor-pointer"
              src={cancel}
              alt="닫기"
            />
          </div>

          {/* 품목 정보 표시 */}
          <div className="w-full mb-6 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-600">품명:</div>
              <div>{item?.itemName}</div>
              <div className="text-gray-600">현재 재고:</div>
              <div>
                {item?.quantity} {item?.measure}
              </div>
              <div className="text-gray-600">안전 재고:</div>
              <div>
                {item?.safeStock} {item?.measure}
              </div>
            </div>
          </div>

          {/* 주문 입력 폼 */}
          <div className="w-full space-y-4">
            <div className="flex items-center">
              <label className="w-24 font-semibold">작성자:</label>
              <div className="cursor-pointer">
                <WhoSelector
                  who={"작성자"}
                  selectedPeople={formData.writer}
                  onPeopleChange={handlePeopleChange("writer")}
                />
              </div>
            </div>

            <div className="flex items-center">
              <label className="w-24 font-semibold">주문 수량:</label>
              <input
                type="number"
                value={formData.orderQuantity || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    orderQuantity: e.target.value,
                  }))
                }
                className="flex-1 border border-gray-300 rounded-md p-2"
                placeholder={`수량 입력 (${item?.measure})`}
              />
            </div>

            <div className="flex items-start">
              <label className="w-24 font-semibold mt-2">사유:</label>
              <textarea
                value={formData.orderReason}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    orderReason: e.target.value,
                  }))
                }
                className="flex-1 border border-gray-300 rounded-md p-2 h-24"
                placeholder="주문 사유를 입력하세요"
              />
            </div>
          </div>

          {/* 주문 버튼 */}
          <div className="w-full mt-6">
            <button
              onClick={handlePurchaseRequest}
              disabled={!formData.writer.length || !formData.orderQuantity}
              className={`w-full py-3 rounded-md ${
                formData.writer.length && formData.orderQuantity
                  ? "bg-onceBlue text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              주문 요청
            </button>
          </div>
        </div>
      </ModalTemplate>

      {/* QR 코드 모달 */}
      <ModalTemplate
        isVisible={isQRModalOn}
        setIsVisible={setIsQRModalOn}
        showCancel={false}
        modalClassName="rounded-xl"
      >
        <div className="flex flex-col items-center w-[400px] bg-white p-[30px] rounded-xl">
          <div className="flex justify-between items-center w-full mb-6">
            <span className="text-2xl font-bold">QR 코드</span>
            <img
              onClick={() => setIsQRModalOn(false)}
              className="w-[30px] cursor-pointer"
              src={cancel}
              alt="닫기"
            />
          </div>

          <div className="flex flex-col items-center w-full">
            <div className="flex items-center justify-between w-full mb-4">
              <label className="font-semibold">QR 크기 조정: </label>
              <input
                type="range"
                min="60"
                max="300"
                value={qrSize}
                onChange={(e) => setQrSize(parseInt(e.target.value, 10))}
                className="w-[200px]"
              />
            </div>

            <div
              ref={printRef}
              className="flex flex-col items-center p-4 border rounded-md bg-white w-full"
              style={{ pageBreakInside: "avoid" }}
            >
              <QRCodeCanvas
                id={`qr-${item?.id}`}
                value={item?.id || ""}
                size={qrSize}
              />
              <span className="mt-2 font-semibold text-sm">{item?.id}</span>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-onceBlue text-white rounded-md flex items-center gap-2"
              >
                <IoPrintOutline size={20} /> 인쇄
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-green-600 text-white rounded-md"
              >
                PDF 다운로드
              </button>
            </div>
          </div>
        </div>
      </ModalTemplate>

      {/* 단순 입출고 모달 */}
      <ModalTemplate
        isVisible={isSimpleStockModalOn}
        setIsVisible={setIsSimpleStockModalOn}
        showCancel={false}
        modalClassName="rounded-xl"
      >
        <div className="flex flex-col items-center w-[500px] bg-white p-[30px] rounded-xl">
          <div className="flex justify-between items-center w-full mb-6">
            <span className="text-2xl font-bold">단순 입출고</span>
            <img
              onClick={() => setIsSimpleStockModalOn(false)}
              className="w-[30px] cursor-pointer"
              src={cancel}
              alt="닫기"
            />
          </div>

          {/* 품목 정보 표시 */}
          <div className="w-full mb-6 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-600">품명:</div>
              <div>{item?.itemName}</div>
              <div className="text-gray-600">현재 재고:</div>
              <div>
                {item?.quantity} {item?.measure}
              </div>
            </div>
          </div>

          {/* 입출고 입력 폼 */}
          <div className="w-full space-y-4">
            <div className="flex w-full h-[40px]">
              <button
                className={`flex-1 rounded-md border ${
                  stockAction === "입고"
                    ? "border-onceBlue bg-onceBlue text-white"
                    : "border-gray-400 text-gray-600"
                }`}
                onClick={() => setStockAction("입고")}
              >
                입고
              </button>
              <div className="w-[20px]" />
              <button
                className={`flex-1 rounded-md border ${
                  stockAction === "출고"
                    ? "border-onceBlue bg-onceBlue text-white"
                    : "border-gray-400 text-gray-600"
                }`}
                onClick={() => setStockAction("출고")}
              >
                출고
              </button>
            </div>

            <div className="flex items-center">
              <label className="w-24 font-semibold">작성자:</label>
              <WhoSelector
                who={"작성자"}
                selectedPeople={simpleStockData.writer}
                onPeopleChange={handleSimpleStockWriterChange}
              />
            </div>

            <div className="flex items-center">
              <label className="w-24 font-semibold">수량:</label>
              <input
                type="number"
                value={simpleStockData.quantity || ""}
                onChange={(e) =>
                  setSimpleStockData((prev) => ({
                    ...prev,
                    quantity: e.target.value,
                  }))
                }
                className="flex-1 border border-gray-300 rounded-md p-2"
                placeholder={`${stockAction} 수량 입력 (${item?.measure})`}
              />
            </div>

            <div className="flex items-start">
              <label className="w-24 font-semibold mt-2">사유:</label>
              <textarea
                value={simpleStockData.reason || ""}
                onChange={(e) =>
                  setSimpleStockData((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                className="flex-1 border border-gray-300 rounded-md p-2 h-24"
                placeholder={`${stockAction} 사유를 입력하세요`}
              />
            </div>
          </div>

          {/* 처리 버튼 */}
          <div className="w-full mt-6">
            <button
              onClick={handleSimpleStockUpdate}
              disabled={
                !simpleStockData.writer.length || !simpleStockData.quantity
              }
              className={`w-full py-3 rounded-md ${
                simpleStockData.writer.length && simpleStockData.quantity
                  ? "bg-onceBlue hover:bg-onceBlue text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {stockAction} 처리
            </button>
          </div>
        </div>
      </ModalTemplate>
    </ModalTemplate>
  );
}

StockDetailModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  setIsVisible: PropTypes.func.isRequired,
  item: PropTypes.object,
  onUpdate: PropTypes.func,
  setWarehouseMode: PropTypes.func.isRequired,
};
