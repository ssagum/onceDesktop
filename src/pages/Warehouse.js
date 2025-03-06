import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import SideBar from "../components/SideBar";
import InventoryStatusZone from "../components/Warehouse/InventoryStatusZone";
import VendorZone from "../components/Warehouse/VendorZone";
import ItemRegistrationZone from "../components/Warehouse/ItemRegistrationZone";
import QRCodeGenerator from "../components/common/QRCodeGenerator";
import ModalTemplate from "../components/common/ModalTemplate";
import { cancel } from "../assets";
import {
  collection,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { useToast } from "../contexts/ToastContext";

const MainZone = styled.main``;
const TitleZone = styled.div``;
const CenterZone = styled.div``;

const WarehouseButton = ({ targetText, targetStatus, onClick }) => {
  return (
    <button
      className="bg-slate-400 p-2"
      onClick={() => {
        onClick(targetStatus);
      }}>
      <p>{targetText}</p>
    </button>
  );
};

const Warehouse = () => {
  //inventoryStatus, itemRegistration, vendor
  const [warehouseMode, setWarehouseMode] = useState("비품현황");
  const { pathname } = useLocation();
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  // useToast 훅 사용
  const { showToast } = useToast();

  // warehouseMode가 변경될 때마다 실행
  useEffect(() => {
    console.log("Warehouse - Current mode:", warehouseMode);
    console.log("Warehouse - Selected item:", selectedItem);
  }, [warehouseMode, selectedItem]);

  // warehouseMode 변경 핸들러
  const handleWarehouseModeChange = (newMode, item = null) => {
    // 품목정보 수정이 아닌 경우 (item이 없는 경우) selectedItem을 null로 초기화
    if (!item && newMode === "품목등록") {
      setSelectedItem(null);
    }
    setWarehouseMode(newMode);
    setSelectedItem(item);
  };

  // 아이템 등록/수정 핸들러
  const handleRegisterItem = async ({ type, data }) => {
    console.log("1. handleRegisterItem 시작:", type, data);

    try {
      if (type === "create") {
        // 새 품목 등록
        const documentId = data.id;
        console.log("2. 생성할 문서 ID:", documentId);

        const stockData = {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        console.log("3. Firestore에 저장할 데이터:", stockData);

        // setDoc을 사용하여 문서 ID를 직접 지정
        await setDoc(doc(db, "stocks", documentId), stockData);
        console.log("5. Firestore 문서 추가 완료");

        setInventoryData((prev) => [...prev, stockData]);
        showToast("품목이 등록되었습니다.", "success");
      } else {
        // 기존 문서 업데이트
        const stockData = {
          ...data,
          updatedAt: serverTimestamp(),
        };
        console.log("3. Firestore 업데이트할 데이터:", stockData);

        await setDoc(doc(db, "stocks", data.id), stockData, { merge: true });
        console.log("4. Firestore 문서 업데이트 완료");

        setInventoryData((prev) =>
          prev.map((item) => (item.id === data.id ? stockData : item))
        );
        showToast("품목이 수정되었습니다.", "success");
      }
    } catch (error) {
      console.error("5. Firestore 오류:", error);
      showToast("작업 중 오류가 발생했습니다.", "error");
    }
  };

  console.log("하하", inventoryData);

  // 페이지 전체 리턴
  return (
    <div className="flex flex-row w-full h-screen bg-onceBackground">
      <div className="w-[250px] h-full flex flex-col justify-center">
        <SideBar />
      </div>
      <MainZone className="w-full flex flex-col justify-evenly items-center bg-onceBackground p-[20px] h-screen">
        <section className="flex flex-col items-center w-full justify-between h-full bg-white rounded-2xl px-[40px] py-[30px]">
          <TitleZone className="w-full mb-[50px] flex flex-row justify-between items-center">
            <span className="text-[34px] font-semibold">{warehouseMode}</span>
            <div className="flex flex-row gap-x-[20px]">
              <button
                onClick={() => setIsQRModalOpen(true)}
                className={`rounded-md w-[140px] h-[40px] flex justify-center items-center text-center border ${
                  warehouseMode === "QR 전체 인쇄"
                    ? "bg-onceBlue border-onceBlue"
                    : "bg-white border-onceBlue"
                }`}>
                <span
                  className={`${
                    warehouseMode === "QR 전체 인쇄"
                      ? "text-white"
                      : "text-onceBlue"
                  } font-semibold text-once18`}>
                  QR 전체 인쇄
                </span>
              </button>
              <button
                onClick={() => setWarehouseMode("비품현황")}
                className={`rounded-md w-[140px] h-[40px] flex justify-center items-center text-center border ${
                  warehouseMode === "비품현황"
                    ? "bg-onceBlue border-onceBlue"
                    : "bg-white border-onceBlue"
                }`}>
                <span
                  className={`${
                    warehouseMode === "비품현황"
                      ? "text-white"
                      : "text-onceBlue"
                  } font-semibold text-once18`}>
                  비품현황
                </span>
              </button>
              <button
                onClick={() => handleWarehouseModeChange("품목등록")}
                className={`rounded-md w-[140px] h-[40px] flex justify-center items-center text-center border ${
                  warehouseMode === "품목등록"
                    ? "bg-onceBlue border-onceBlue"
                    : "bg-white border-onceBlue"
                }`}>
                <span
                  className={`${
                    warehouseMode === "품목등록"
                      ? "text-white"
                      : "text-onceBlue"
                  } font-semibold text-once18`}>
                  품목등록
                </span>
              </button>
              <button
                onClick={() => setWarehouseMode("거래처관리")}
                className={`rounded-md w-[140px] h-[40px] flex justify-center items-center text-center border ${
                  warehouseMode === "거래처관리"
                    ? "bg-onceBlue border-onceBlue"
                    : "bg-white border-onceBlue"
                }`}>
                <span
                  className={`${
                    warehouseMode === "거래처관리"
                      ? "text-white"
                      : "text-onceBlue"
                  } font-semibold text-once18`}>
                  거래처관리
                </span>
              </button>
            </div>
          </TitleZone>
          <CenterZone className="h-full w-full">
            {warehouseMode === "비품현황" && (
              <InventoryStatusZone
                onDataUpdate={setInventoryData}
                setWarehouseMode={handleWarehouseModeChange}
              />
            )}
            {warehouseMode === "품목등록" && (
              <ItemRegistrationZone
                onRegister={handleRegisterItem}
                item={selectedItem}
              />
            )}
            {warehouseMode === "거래처관리" && <VendorZone />}
          </CenterZone>
        </section>
      </MainZone>
      <ModalTemplate
        isVisible={isQRModalOpen}
        setIsVisible={setIsQRModalOpen}
        showCancel={false}>
        <div className="flex flex-col items-center w-onceBigModal h-onceBigModalH bg-white px-[40px] py-[30px]">
          <div className="flex flex-row w-full justify-between h-[50px] items-center mb-[20px]">
            <span className="text-[34px] font-bold">QR 코드 생성</span>
            <img
              onClick={() => setIsQRModalOpen(false)}
              className="w-[30px]"
              src={cancel}
              alt="닫기"
              style={{ cursor: "pointer" }}
            />
          </div>
          <QRCodeGenerator idList={inventoryData.map((item) => item?.id)} />
        </div>
      </ModalTemplate>
    </div>
  );
};

export default Warehouse;
