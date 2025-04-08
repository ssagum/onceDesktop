import React, { useState, useEffect } from "react";
import styled from "styled-components";
import ModalTemplate from "../common/ModalTemplate";
import { cancel, search } from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import WhoSelector from "../common/WhoSelector";
import FormLabel from "../common/FormLabel";
import SelectableButton from "../common/SelectableButton";
import { useUserLevel } from "../../utils/UserLevelContext";
import { useToast } from "../../contexts/ToastContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

const ModalHeaderZone = styled.div``;
const WhoZone = styled.div``;
const SortZone = styled.div``;
const TeamZone = styled.div``;
const ButtonZone = styled.div`
  position: absolute;
  bottom: 30px;
  width: calc(100% - 80px);
`;

const ModalContent = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  padding-bottom: 80px;
  overflow-y: auto;
`;

// 거래처 모달 스타일 컴포넌트
const VendorModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const VendorModalContent = styled.div`
  background-color: white;
  border-radius: 12px;
  width: 650px;
  max-width: 95vw;
  height: 600px;
  padding: 28px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
  overflow-x: hidden;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #edf2f7;
  padding-bottom: 16px;
  flex-shrink: 0;
`;

const SearchBar = styled.div`
  position: relative;
  margin-bottom: 20px;
  display: flex;
  flex-shrink: 0;
`;

const VendorList = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const VendorItem = styled.div`
  padding: 14px 18px;
  border-bottom: 1px solid #edf2f7;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  overflow-wrap: break-word;
  word-break: break-all;

  &:hover {
    background-color: #f8fafc;
    transform: translateX(5px);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const VendorName = styled.div`
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const VendorUrl = styled.div`
  font-size: 0.875rem;
  color: #718096;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #718096;
  transition: color 0.2s;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;

  &:hover {
    color: #2d3748;
    background-color: #f7fafc;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
  pointer-events: none;
`;

const SelectVendorButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: #4299e1;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #3182ce;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
`;

const FormSection = styled.div`
  margin-bottom: 20px;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const StockRequestModal = ({ isVisible, setIsVisible }) => {
  const { userLevelData } = useUserLevel();
  const { showToast } = useToast();

  // 폼 필드 상태
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState(userLevelData?.department || "");
  const [quantity, setQuantity] = useState("");
  const [vendor, setVendor] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [writer, setWriter] = useState([]);
  const [measure, setMeasure] = useState("");
  const [price, setPrice] = useState("");
  const [safeStock, setSafeStock] = useState("");
  const [vat, setVat] = useState(true);

  // 거래처 모달 관련 상태
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorSearchTerm, setVendorSearchTerm] = useState("");
  const [vendors, setVendors] = useState([]);
  const [modalFilteredVendors, setModalFilteredVendors] = useState([]);

  // 시작 시 거래처 목록 초기화
  useEffect(() => {
    // 더미 거래처 데이터
    const dummyVendors = [
      {
        id: "1",
        clientName: "메디컬 서플라이",
        url: "medicalsupply.co.kr",
        isHidden: false,
      },
      {
        id: "2",
        clientName: "의료기기마트",
        url: "medicalmart.com",
        isHidden: false,
      },
      {
        id: "3",
        clientName: "헬스케어솔루션",
        url: "healthcare-solution.kr",
        isHidden: false,
      },
      {
        id: "4",
        clientName: "삼성메디컬",
        url: "samsungmedical.com",
        isHidden: false,
      },
      {
        id: "5",
        clientName: "메디칼 원스톱",
        url: "medical-onestop.com",
        isHidden: false,
      },
      {
        id: "6",
        clientName: "병원용품센터",
        url: "hospitalstore.co.kr",
        isHidden: false,
      },
      {
        id: "7",
        clientName: "의약품유통센터",
        url: "medi-distri.com",
        isHidden: false,
      },
      {
        id: "8",
        clientName: "LG헬스케어",
        url: "lghealthcare.com",
        isHidden: false,
      },
      {
        id: "9",
        clientName: "한국의료기기",
        url: "koreamedical.co.kr",
        isHidden: false,
      },
      {
        id: "10",
        clientName: "메디컬솔루션",
        url: "medicalsolution.kr",
        isHidden: false,
      },
    ];

    setVendors(dummyVendors);
    setModalFilteredVendors(dummyVendors);
  }, []);

  // 모달에서 거래처 검색 처리
  useEffect(() => {
    if (vendors.length > 0) {
      if (vendorSearchTerm.trim() === "") {
        setModalFilteredVendors(vendors);
      } else {
        const normalizedInput = vendorSearchTerm.toLowerCase();
        const filtered = vendors.filter((v) => {
          return (
            (v.clientName &&
              v.clientName.toLowerCase().includes(normalizedInput)) ||
            (v.url && v.url.toLowerCase().includes(normalizedInput))
          );
        });
        setModalFilteredVendors(filtered);
      }
    }
  }, [vendorSearchTerm, vendors]);

  // 폼 필드값 변경 핸들러
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    switch (name) {
      case "itemName":
        setItemName(value);
        break;
      case "quantity":
        setQuantity(value);
        break;
      case "vendor":
        setVendor(value);
        break;
      case "requestReason":
        setRequestReason(value);
        break;
      case "measure":
        setMeasure(value);
        break;
      case "price":
        setPrice(value);
        break;
      case "safeStock":
        setSafeStock(value);
        break;
      case "vat":
        setVat(checked);
        break;
      default:
        break;
    }
  };

  // 카테고리 선택 핸들러
  const handleCategoryChange = (value) => {
    setCategory(value);
  };

  // 부서 선택 핸들러
  const handleDepartmentChange = (value) => {
    setDepartment(value);
  };

  // 작성자 선택 핸들러
  const handlePeopleChange = (selectedPeople) => {
    setWriter(selectedPeople);
  };

  // 모달에서 거래처 선택
  const handleSelectVendorFromModal = (selectedVendor) => {
    setVendor(selectedVendor.clientName);
    setShowVendorModal(false);
  };

  // 모달 토글
  const toggleVendorModal = () => {
    setShowVendorModal(!showVendorModal);
    setVendorSearchTerm(""); // 모달 열 때 검색어 초기화
  };

  // 소모품 카테고리 여부 체크
  const isConsumableCategory = (category) => {
    const consumableCategories = [
      "사무용 소모품",
      "의료용 소모품",
      "마케팅 소모품",
      "기타 소모품",
    ];
    return consumableCategories.includes(category);
  };

  // 모달이 처음 열릴 때 폼 초기화
  useEffect(() => {
    if (isVisible) {
      resetForm();
      // 현재 로그인한 사용자의 부서 정보 설정
      setDepartment(userLevelData?.department || "");
      // 현재 유저 정보로 writer 초기화
      if (userLevelData?.id) {
        setWriter([userLevelData]);
      }
    }
  }, [isVisible, userLevelData]);

  // 제출 관련 함수 수정
  const handleSubmit = async (targetStatus) => {
    // 필수 필드 유효성 검사
    if (!itemName) {
      showToast("품명을 입력해주세요.", "error");
      return;
    }

    if (!category) {
      showToast("분류를 선택해주세요.", "error");
      return;
    }

    if (!quantity) {
      showToast("수량을 입력해주세요.", "error");
      return;
    }

    if (writer.length === 0) {
      showToast("작성자를 선택해주세요.", "error");
      return;
    }

    try {
      const stockRequestData = {
        itemName,
        category,
        department,
        quantity: Number(quantity),
        vendor,
        measure,
        requestReason,
        writer,
        price: price ? Number(price) : 0,
        safeStock: safeStock ? Number(safeStock) : 0,
        vat,
        createdAt: Date.now(),
        createdAt2: serverTimestamp(),
        status: targetStatus, // 버튼에 따라 상태 설정
        requestedBy: userLevelData?.id || "",
        requestedByName: userLevelData?.name || "",
        requestType: "manual", // 수동 신청 표시
      };

      console.log("저장할 비품신청 데이터:", stockRequestData);

      // stockRequest 컬렉션에 데이터 저장
      await addDoc(collection(db, "stockRequests"), stockRequestData);

      showToast(
        `비품이 ${
          targetStatus === "장바구니" ? "장바구니에 저장" : "대기중 상태로 신청"
        }되었습니다.`,
        "success"
      );
      resetForm();
      setIsVisible(false);
    } catch (error) {
      console.error("비품신청 중 오류:", error);
      showToast("비품신청 중 오류가 발생했습니다.", "error");
    }
  };

  // 장바구니 저장 핸들러
  const handleSaveToCart = () => {
    handleSubmit("장바구니");
  };

  // 대기중 신청 핸들러
  const handleRequestWaiting = () => {
    handleSubmit("대기중");
  };

  // 폼 초기화
  const resetForm = () => {
    setItemName("");
    setCategory("");
    setQuantity("");
    setVendor("");
    setRequestReason("");
    setWriter([]);
    setMeasure("");
    setPrice("");
    setSafeStock("");
    setVat(true);
  };

  return (
    <ModalTemplate
      isVisible={isVisible}
      setIsVisible={setIsVisible}
      showCancel={false}
      modalClassName="rounded-xl"
    >
      <div className="flex flex-col items-center w-onceBigModal h-onceBigModalH bg-white px-[40px] py-[30px] relative">
        <ModalHeaderZone className="flex flex-row w-full justify-between h-[50px] items-center mb-4">
          <span className="text-[34px] font-bold">비품신청</span>
          <div className="flex flex-row items-center">
            <img
              onClick={() => setIsVisible(false)}
              className="w-[30px]"
              src={cancel}
              alt="닫기"
              style={{ cursor: "pointer" }}
            />
          </div>
        </ModalHeaderZone>

        <ModalContent>
          <TopZone className="w-full flex flex-row justify-between mb-4">
            <div className="flex justify-between mb-4">
              <div className="flex items-center space-x-4">
                <label className="text-black font-semibold w-[120px]">
                  작성자:<span className="text-red-500">*</span>
                </label>
                <WhoSelector
                  who={"작성자"}
                  selectedPeople={writer}
                  onPeopleChange={handlePeopleChange}
                />
              </div>
            </div>
          </TopZone>

          {/* 품명 */}
          <FormSection>
            <FormLabel
              label={"품명"}
              required={true}
              className="w-[80px] block font-semibold text-black"
            />
            <input
              type="text"
              name="itemName"
              value={itemName}
              onChange={handleChange}
              placeholder="신청할 품목명을 입력하세요"
              className="w-[630px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
            />
          </FormSection>

          {/* 분류 */}
          <SortZone className="flex flex-row w-[730px] mb-4">
            <FormLabel
              label={"분류"}
              required={true}
              className="flex font-semibold text-black mb-2 w-[80px] h-[40px] items-center"
            />
            <div className="flex flex-col">
              <div className="flex flex-row mb-[10px]">
                <SelectableButton
                  field={category}
                  value="사무용 소모품"
                  onChange={handleCategoryChange}
                />
                <SelectableButton
                  field={category}
                  value="사무용품"
                  onChange={handleCategoryChange}
                />
                <SelectableButton
                  field={category}
                  value="의료용 소모품"
                  onChange={handleCategoryChange}
                />
                <SelectableButton
                  field={category}
                  value="의료용품"
                  onChange={handleCategoryChange}
                />
                <SelectableButton
                  field={category}
                  value="마케팅용품"
                  onChange={handleCategoryChange}
                />
              </div>
              <div className="flex flex-row mb-[10px]">
                <SelectableButton
                  field={category}
                  value="마케팅 소모품"
                  onChange={handleCategoryChange}
                />
                <SelectableButton
                  field={category}
                  value="기타용품"
                  onChange={handleCategoryChange}
                />
                <SelectableButton
                  field={category}
                  value="기타 소모품"
                  onChange={handleCategoryChange}
                />
              </div>
            </div>
          </SortZone>

          {/* 부서 */}
          <TeamZone className="flex flex-row w-[730px] mb-4">
            <FormLabel
              label={"부서"}
              required={true}
              className="flex font-semibold text-black mb-2 w-[80px] h-[40px] items-center"
            />
            <div className="flex flex-col">
              <div className="flex flex-row mb-[10px]">
                <SelectableButton
                  field={department}
                  value="진료"
                  onChange={handleDepartmentChange}
                />
                <SelectableButton
                  field={department}
                  value="간호"
                  onChange={handleDepartmentChange}
                />
                <SelectableButton
                  field={department}
                  value="물리치료"
                  onChange={handleDepartmentChange}
                />
                <SelectableButton
                  field={department}
                  value="원무"
                  onChange={handleDepartmentChange}
                />
                <SelectableButton
                  field={department}
                  value="영상의학"
                  onChange={handleDepartmentChange}
                />
              </div>
            </div>
          </TeamZone>

          {/* 단위 & 단가 */}
          <FormSection>
            <FormLabel
              label={"단위"}
              required={false}
              className="h-[40px] flex items-center font-semibold text-black w-[80px]"
            />
            <input
              type="text"
              name="measure"
              value={measure}
              onChange={handleChange}
              placeholder="단위 (예: 박스, 개, 세트)"
              className="border border-gray-400 rounded-md h-[40px] px-4 w-[280px] bg-textBackground mr-[40px]"
            />

            <FormLabel
              label={"단가"}
              required={false}
              className="h-[40px] flex items-center font-semibold text-black w-[80px]"
            />
            <input
              type="text"
              name="price"
              value={price}
              onChange={handleChange}
              placeholder="단가 (원)"
              className="w-[280px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
            />
          </FormSection>

          {/* VAT 체크 */}
          <FormSection>
            <div className="flex items-center ml-[80px]">
              <input
                type="checkbox"
                name="vat"
                id="vat"
                checked={vat}
                onChange={handleChange}
                className="mr-2 h-4 w-4"
              />
              <label htmlFor="vat" className="text-gray-700">
                VAT 포함
              </label>
            </div>
          </FormSection>

          {/* 수량 & 안전재고 */}
          <FormSection>
            <FormLabel
              label={"수량"}
              required={true}
              className="h-[40px] flex items-center font-semibold text-black w-[80px]"
            />
            <input
              type="text"
              name="quantity"
              value={quantity}
              onChange={handleChange}
              placeholder="신청 수량"
              className="w-[280px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground mr-[40px]"
            />

            {isConsumableCategory(category) && (
              <>
                <FormLabel
                  label={"안전재고"}
                  required={false}
                  className="h-[40px] flex items-center font-semibold text-black w-[80px]"
                />
                <input
                  type="text"
                  name="safeStock"
                  value={safeStock}
                  onChange={handleChange}
                  placeholder="안전재고 수량"
                  className="w-[280px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
                />
              </>
            )}
          </FormSection>

          {/* 안전재고 알림 문구 - 소모품일 때만 표시 */}
          {isConsumableCategory(category) && (
            <p className="text-red-500 text-sm mt-2 mb-4 ml-[80px]">
              * 안전재고 이하로 수량이 떨어지면 알림이 갑니다.
            </p>
          )}

          {/* 거래처 */}
          <FormSection>
            <label className="h-[40px] flex items-center font-semibold text-black w-[80px]">
              거래처:
            </label>
            <div className="relative w-[600px]">
              <input
                type="text"
                name="vendor"
                value={vendor}
                onChange={handleChange}
                placeholder="거래처명 또는 URL을 입력해주세요"
                className="w-full border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
              />
            </div>
            <div className="w-[80px] flex justify-center h-[40px]">
              <SelectVendorButton onClick={toggleVendorModal}>
                <img src={search} alt="검색" className="w-[24px] h-[24px]" />
              </SelectVendorButton>
            </div>
            <span className="text-gray-600 text-sm">목록보기</span>
          </FormSection>

          {/* 신청 사유 */}
          <FormSection className="w-full">
            <FormLabel
              label={"신청사유"}
              required={false}
              className="h-[40px] flex items-center font-semibold text-black w-[80px]"
            />
            <textarea
              name="requestReason"
              value={requestReason}
              onChange={handleChange}
              placeholder="신청 사유를 작성해주세요"
              className="w-full border border-gray-400 rounded-md h-[70px] px-4 py-2 bg-textBackground"
            />
          </FormSection>
        </ModalContent>

        {/* 하단 버튼 영역 UI 수정 */}
        <ButtonZone>
          <div className="flex flex-col w-full">
            {/* 버튼 영역 */}
            <div className="flex flex-row gap-x-[20px] w-full">
              <button
                className={`flex-1 py-3 rounded-lg font-medium text-white transition-colors ${
                  itemName !== "" &&
                  category !== "" &&
                  quantity !== "" &&
                  writer.length > 0
                    ? "bg-purple-500 hover:bg-purple-600 cursor-pointer"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
                onClick={
                  itemName !== "" &&
                  category !== "" &&
                  quantity !== "" &&
                  writer.length > 0
                    ? handleSaveToCart
                    : () => showToast("필수 항목을 입력해주세요", "warning")
                }
              >
                장바구니에 저장
              </button>

              <button
                className={`flex-1 py-3 rounded-lg font-medium text-white transition-colors ${
                  itemName !== "" &&
                  category !== "" &&
                  quantity !== "" &&
                  writer.length > 0
                    ? "bg-yellow-500 hover:bg-yellow-600 cursor-pointer"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
                onClick={
                  itemName !== "" &&
                  category !== "" &&
                  quantity !== "" &&
                  writer.length > 0
                    ? handleRequestWaiting
                    : () => showToast("필수 항목을 입력해주세요", "warning")
                }
              >
                비품신청
              </button>
            </div>
          </div>
        </ButtonZone>
      </div>

      {/* 거래처 선택 모달 */}
      {showVendorModal && (
        <VendorModal onClick={() => setShowVendorModal(false)}>
          <VendorModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2 className="text-xl font-bold text-gray-800">거래처 목록</h2>
              <CloseButton onClick={() => setShowVendorModal(false)}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </CloseButton>
            </ModalHeader>

            <SearchBar>
              <input
                type="text"
                value={vendorSearchTerm}
                onChange={(e) => setVendorSearchTerm(e.target.value)}
                placeholder="거래처 검색..."
                className="w-full border border-gray-300 rounded-lg h-[44px] px-4 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <SearchIcon>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </SearchIcon>
            </SearchBar>

            <VendorList>
              {modalFilteredVendors.length > 0 ? (
                modalFilteredVendors.map((vendor) => (
                  <VendorItem
                    key={vendor.id}
                    onClick={() => handleSelectVendorFromModal(vendor)}
                  >
                    <VendorName>{vendor.clientName}</VendorName>
                    {vendor.url && <VendorUrl>{vendor.url}</VendorUrl>}
                  </VendorItem>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  {vendors.length === 0
                    ? "등록된 거래처가 없습니다."
                    : "검색 결과가 없습니다."}
                </div>
              )}
            </VendorList>
          </VendorModalContent>
        </VendorModal>
      )}
    </ModalTemplate>
  );
};

const TopZone = styled.div``;

export default StockRequestModal;
