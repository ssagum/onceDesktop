// PartnerRow.js
import React, { useState } from "react";
// 상황에 적합한 아이콘 선택: 사업자등록증은 문서 아이콘, 명함은 연락처 아이콘을 사용
import { MdDescription, MdContactPage } from "react-icons/md";
import VendorModal from "./VendorModal";

const VendorRow = ({ partner, index, onUpdate }) => {
  const { clientName, manager, industry, contact, email, documents } = partner;
  const [isModalOpen, setIsModalOpen] = useState(false);

  // index가 짝수면 "bg-onceTextBackground", 홀수면 "bg-onceBackground" 적용
  const rowBgClass =
    index % 2 === 0 ? "bg-onceTextBackground" : "bg-onceBackground";

  return (
    <>
      <div
        className="grid grid-cols-6 text-center py-4 border-b cursor-pointer hover:bg-gray-50"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="text-center text-black">{clientName}</div>
        <div className="text-center text-black">{manager}</div>
        <div className="text-center text-black">{industry}</div>
        <div className="text-center text-black">{contact}</div>
        <div className="text-center text-black">{email}</div>
        <div className="flex justify-center space-x-2">
          {/* 사업자등록증 아이콘: 있으면 녹색, 없으면 회색 */}
          {documents?.businessRegistration ? (
            <MdDescription className="text-green-500" size={20} />
          ) : (
            <MdDescription className="text-gray-300" size={20} />
          )}
          {/* 명함 아이콘: 있으면 파란색, 없으면 회색 */}
          {documents?.businessCard ? (
            <MdContactPage className="text-blue-500" size={20} />
          ) : (
            <MdContactPage className="text-gray-300" size={20} />
          )}
        </div>
      </div>

      <VendorModal
        isVisible={isModalOpen}
        setIsVisible={setIsModalOpen}
        vendor={partner}
        onUpdate={onUpdate}
        mode="edit"
      />
    </>
  );
};

export default VendorRow;
