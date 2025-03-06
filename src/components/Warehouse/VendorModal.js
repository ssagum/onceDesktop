import React, { useState, useEffect } from "react";
import ModalTemplate from "../common/ModalTemplate";
import SelectableButton from "../common/SelectableButton";
import EditableField from "../common/EditableField";
import PhoneNumberField from "../common/PhoneNumberField";
import ImageUploader from "../common/ImageUploader";
import styled from "styled-components";
import {
  doc,
  addDoc,
  updateDoc,
  collection,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";
import { useToast } from "../../contexts/ToastContext";

const OneLine = styled.div``;
const Half = styled.div``;
const SectionZone = styled.div``;

const VendorModal = ({
  isVisible,
  setIsVisible,
  vendor = null,
  onUpdate,
  mode = "view",
}) => {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    clientName: vendor?.clientName || "",
    manager: vendor?.manager || "",
    industry: vendor?.industry || "",
    contact: vendor?.contact || "",
    email: vendor?.email || "",
    documents: {
      businessRegistration: vendor?.documents?.businessRegistration || null,
      businessCard: vendor?.documents?.businessCard || null,
    },
  });
  const [selectedIndustry, setSelectedIndustry] = useState(
    vendor?.industry || ""
  );
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (vendor) {
      setFormData({
        clientName: vendor.clientName || "",
        manager: vendor.manager || "",
        industry: vendor.industry || "",
        contact: vendor.contact || "",
        email: vendor.email || "",
        documents: {
          businessRegistration: vendor?.documents?.businessRegistration || null,
          businessCard: vendor?.documents?.businessCard || null,
        },
      });
      setSelectedIndustry(vendor.industry || "");
    }
  }, [vendor]);

  // 필수 필드 검증
  const validateForm = () => {
    const newErrors = {};
    if (!formData.clientName.trim()) {
      newErrors.clientName = "거래처명은 필수입니다";
    }
    if (!selectedIndustry) {
      newErrors.industry = "업종을 선택해주세요";
    }
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showToast("필수 항목을 모두 입력해주세요.", "error");
      return false;
    }
    return true;
  };

  // isFormValid 함수 추가
  const isFormValid = () => {
    return formData.clientName.trim() && selectedIndustry;
  };

  // 이미지 업로드 함수
  const uploadImage = async (file, path) => {
    if (!file) return null;
    try {
      const storageRef = ref(
        storage,
        `vendors/${path}/${Date.now()}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      console.log(
        `성공적으로 업로드됨: ${path}, URL: ${downloadUrl.substring(0, 50)}...`
      );
      return downloadUrl;
    } catch (error) {
      console.error(`이미지 업로드 실패 (${path}):`, error);
      console.error("파일 정보:", {
        name: file.name,
        type: file.type,
        size: file.size,
      });
      throw new Error(`이미지 업로드 실패: ${error.message}`);
    }
  };

  // 저장 처리
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      // 이미지 업로드 처리 개선
      let businessRegistrationUrl = null;
      let businessCardUrl = null;

      // 사업자등록증 처리
      if (formData.documents.businessRegistration instanceof File) {
        businessRegistrationUrl = await uploadImage(
          formData.documents.businessRegistration,
          "business-registration"
        );
      } else if (formData.documents.businessRegistration) {
        // 기존 URL이 있고 변경되지 않은 경우
        businessRegistrationUrl = formData.documents.businessRegistration;
      }

      // 명함 처리
      if (formData.documents.businessCard instanceof File) {
        businessCardUrl = await uploadImage(
          formData.documents.businessCard,
          "business-cards"
        );
      } else if (formData.documents.businessCard) {
        // 기존 URL이 있고 변경되지 않은 경우
        businessCardUrl = formData.documents.businessCard;
      }

      // 최종 데이터 생성
      const vendorData = {
        clientName: formData.clientName,
        manager: formData.manager,
        industry: selectedIndustry,
        contact: formData.contact,
        email: formData.email,
        documents: {},
        updatedAt: new Date(),
      };

      // 문서 필드를 명시적으로 처리
      if (businessRegistrationUrl) {
        vendorData.documents.businessRegistration = businessRegistrationUrl;
      } else {
        // null이나 undefined인 경우 Firebase에 직접 null 저장
        vendorData.documents.businessRegistration = null;
      }

      if (businessCardUrl) {
        vendorData.documents.businessCard = businessCardUrl;
      } else {
        // null이나 undefined인 경우 Firebase에 직접 null 저장
        vendorData.documents.businessCard = null;
      }

      console.log("Firestore에 저장할 데이터:", {
        clientName: vendorData.clientName,
        manager: vendorData.manager,
        industry: vendorData.industry,
        contact: vendorData.contact,
        email: vendorData.email,
        "documents.businessRegistration": vendorData.documents
          .businessRegistration
          ? "(URL 있음)"
          : "(NULL)",
        "documents.businessCard": vendorData.documents.businessCard
          ? "(URL 있음)"
          : "(NULL)",
      });

      if (mode === "create") {
        try {
          const docRef = await addDoc(collection(db, "vendors"), vendorData);
          vendorData.id = docRef.id;
          console.log("새 거래처 생성 성공:", docRef.id);
        } catch (error) {
          console.error("거래처 생성 실패:", error);
          throw error;
        }
      } else {
        try {
          console.log("기존 거래처 업데이트:", vendor.id);
          await updateDoc(doc(db, "vendors", vendor.id), vendorData);
          vendorData.id = vendor.id;
        } catch (error) {
          console.error("거래처 업데이트 실패:", error);
          throw error;
        }
      }

      console.log("저장 성공!");
      onUpdate((prevVendors) => {
        if (mode === "create") {
          return [...prevVendors, vendorData];
        } else {
          return prevVendors.map((v) =>
            v.id === vendor.id ? { ...v, ...vendorData, id: vendor.id } : v
          );
        }
      });

      showToast(
        mode === "create"
          ? "거래처가 등록되었습니다."
          : "거래처가 수정되었습니다.",
        "success"
      );
      setIsVisible(false);
    } catch (error) {
      console.error("거래처 저장 실패:", error);
      console.error("에러 세부 정보:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      showToast(`저장 중 오류가 발생했습니다: ${error.message}`, "error");
    }
  };

  // 삭제 처리를 soft delete로 변경
  const handleDelete = async () => {
    try {
      if (!vendor?.id) return;

      await updateDoc(doc(db, "vendors", vendor.id), {
        isHidden: true,
        updatedAt: new Date(),
      });

      onUpdate((prevVendors) => prevVendors.filter((v) => v.id !== vendor.id));
      showToast("거래처가 삭제되었습니다.", "success");
      setIsVisible(false);
    } catch (error) {
      console.error("거래처 삭제 실패:", error);
      showToast("삭제 중 오류가 발생했습니다.", "error");
    }
  };

  return (
    <ModalTemplate
      isVisible={isVisible}
      setIsVisible={setIsVisible}
      showCancel={false}>
      <div className="flex flex-col w-[700px] h-[580px] items-center py-[40px] justify-between">
        <SectionZone className="flex flex-col w-full px-[30px]">
          <label className="flex font-semibold text-black mb-2 w-[300px] h-[40px]">
            <div className="text-once20 w-[300px]">거래처 상세</div>
          </label>
          <OneLine className="flex flex-row w-full gap-x-[20px] mt-[20px]">
            <Half className="w-1/2 flex flex-row items-center">
              <label className="flex font-semibold text-black w-[100px] h-[40px] items-center">
                <span className="text-once16">
                  거래처명 <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    clientName: e.target.value,
                  }))
                }
                placeholder="거래처명"
                className="w-[200px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground text-center"
              />
            </Half>
            <Half className="w-1/2 flex flex-row items-center">
              <label className="flex font-semibold text-black w-[100px] h-[40px] items-center">
                <span className="text-once16">담당자</span>
              </label>
              <input
                type="text"
                value={formData.manager}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, manager: e.target.value }))
                }
                placeholder="담당자"
                className="w-[200px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground text-center"
              />
            </Half>
          </OneLine>
          {/* 업종 선택 부분 */}
          <OneLine className="flex flex-row w-full items-start mt-[30px]">
            <label className="flex font-semibold text-black w-[140px] h-[40px] items-center">
              <span className="text-once16">
                업종 <span className="text-red-500">*</span>
              </span>
            </label>
            <div className="flex flex-col w-full">
              <div className="flex flex-row justify-between mb-[10px]">
                {["의료용품", "사무용품", "마케팅"].map((industry) => (
                  <SelectableButton
                    key={industry}
                    field={selectedIndustry}
                    value={industry}
                    onChange={setSelectedIndustry}
                    className="w-[32%]"
                  />
                ))}
              </div>
              <div className="flex flex-row justify-between">
                {["인테리어", "외부간판", "기타"].map((industry) => (
                  <SelectableButton
                    key={industry}
                    field={selectedIndustry}
                    value={industry}
                    onChange={setSelectedIndustry}
                    className="w-[32%]"
                  />
                ))}
              </div>
            </div>
            {errors.industry && (
              <span className="text-red-500 text-sm">{errors.industry}</span>
            )}
          </OneLine>

          <OneLine className="flex flex-row w-full items-center mt-[30px]">
            <label className="flex font-semibold text-black w-[120px] h-[40px] items-center">
              <span className="text-once16">연락처</span>
            </label>
            <PhoneNumberField
              value={formData.contact}
              setValue={(value) =>
                setFormData((prev) => ({ ...prev, contact: value }))
              }
              className="h-[40px] w-full text-center"
              placeholder="031-372-3300"
            />
          </OneLine>

          <OneLine className="flex flex-row w-full items-center mt-[30px]">
            <label className="flex font-semibold text-black w-[120px] h-[40px] items-center">
              <span className="text-once16">이메일</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="once@once.com"
              className="w-full border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground text-center"
            />
          </OneLine>

          <OneLine className="flex flex-row w-full gap-x-[20px] mt-[30px] mb-[30px]">
            <Half className="w-1/2 flex flex-row items-center">
              <label className="flex font-semibold text-black w-[100px] h-[40px] items-center">
                <span className="text-once16">사업자등록증</span>
              </label>
              <ImageUploader
                value={formData.documents.businessRegistration}
                onChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    documents: {
                      ...prev.documents,
                      businessRegistration: value,
                    },
                  }));
                }}
              />
            </Half>
            <Half className="w-1/2 flex flex-row items-center">
              <label className="flex font-semibold text-black w-[100px] h-[40px] items-center">
                <span className="text-once16">명함</span>
              </label>
              <ImageUploader
                value={formData.documents.businessCard}
                onChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    documents: {
                      ...prev.documents,
                      businessCard: value,
                    },
                  }));
                }}
              />
            </Half>
          </OneLine>
        </SectionZone>

        <div className="w-full px-[30px] flex flex-row justify-between gap-x-[20px]">
          <button
            onClick={() => setIsVisible(false)}
            className="flex-1 h-[40px] bg-gray-500 text-white rounded-md font-semibold hover:bg-gray-600 transition-colors">
            취소
          </button>
          {mode !== "create" && (
            <button
              onClick={handleDelete}
              className="flex-1 h-[40px] bg-red-500 text-white rounded-md font-semibold hover:bg-red-600 transition-colors">
              삭제
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!isFormValid()}
            className={`flex-1 h-[40px] text-white rounded-md font-semibold transition-colors ${
              isFormValid()
                ? "bg-onceBlue hover:bg-blue-600"
                : "bg-gray-300 cursor-not-allowed"
            }`}>
            {mode === "create" ? "등록" : "수정"}
          </button>
        </div>
      </div>
    </ModalTemplate>
  );
};

export default VendorModal;
