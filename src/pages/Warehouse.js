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

const MainZone = styled.div``;
const TitleZone = styled.div``;
const CenterZone = styled.div``;

const WarehouseButton = ({ targetText, targetStatus, onClick }) => {
  return (
    <button
      className="bg-slate-400 p-2"
      onClick={() => {
        onClick(targetStatus);
      }}
    >
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
                }`}
              >
                <span
                  className={`${
                    warehouseMode === "QR 전체 인쇄"
                      ? "text-white"
                      : "text-onceBlue"
                  } font-semibold text-once18`}
                >
                  QR 전체 인쇄
                </span>
              </button>
              <button
                onClick={() => setWarehouseMode("비품현황")}
                className={`rounded-md w-[140px] h-[40px] flex justify-center items-center text-center border ${
                  warehouseMode === "비품현황"
                    ? "bg-onceBlue border-onceBlue"
                    : "bg-white border-onceBlue"
                }`}
              >
                <span
                  className={`${
                    warehouseMode === "비품현황"
                      ? "text-white"
                      : "text-onceBlue"
                  } font-semibold text-once18`}
                >
                  비품현황
                </span>
              </button>
              <button
                onClick={() => setWarehouseMode("품목등록")}
                className={`rounded-md w-[140px] h-[40px] flex justify-center items-center text-center border ${
                  warehouseMode === "품목등록"
                    ? "bg-onceBlue border-onceBlue"
                    : "bg-white border-onceBlue"
                }`}
              >
                <span
                  className={`${
                    warehouseMode === "품목등록"
                      ? "text-white"
                      : "text-onceBlue"
                  } font-semibold text-once18`}
                >
                  품목등록
                </span>
              </button>
              <button
                onClick={() => setWarehouseMode("거래처관리")}
                className={`rounded-md w-[140px] h-[40px] flex justify-center items-center text-center border ${
                  warehouseMode === "거래처관리"
                    ? "bg-onceBlue border-onceBlue"
                    : "bg-white border-onceBlue"
                }`}
              >
                <span
                  className={`${
                    warehouseMode === "거래처관리"
                      ? "text-white"
                      : "text-onceBlue"
                  } font-semibold text-once18`}
                >
                  거래처관리
                </span>
              </button>
            </div>
          </TitleZone>
          <CenterZone className="h-full w-full">
            {warehouseMode === "비품현황" && (
              <InventoryStatusZone onDataUpdate={setInventoryData} />
            )}
            {warehouseMode === "품목등록" && <ItemRegistrationZone />}
            {warehouseMode === "거래처관리" && <VendorZone />}
          </CenterZone>
        </section>
      </MainZone>
      <ModalTemplate
        isVisible={isQRModalOpen}
        setIsVisible={setIsQRModalOpen}
        showCancel={false}
      >
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
          <QRCodeGenerator
            idList={inventoryData.map((item) => item?.itemName)}
          />
        </div>
      </ModalTemplate>
    </div>
  );
};

export default Warehouse;
