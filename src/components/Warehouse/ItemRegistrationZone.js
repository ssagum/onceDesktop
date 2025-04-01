import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { imageFile, search, task } from "../../assets";
import OnceOnOffButton from "../common/OnceOnOffButton";
import WhoSelector from "../common/WhoSelector";
import FormLabel from "../common/FormLabel";
import SelectableButton from "../common/SelectableButton";
import CurrencyInput from "../common/CurrencyInput";
import CustomSelect from "../common/CustomSelect";
import ImageUploader from "../common/ImageUploader";
import ItemRegistrationButton from "../common/ItemRegistrationButton";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  setDoc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useToast } from "../../contexts/ToastContext";

const TopZone = styled.div``;
const SortZone = styled.div``;
const TeamZone = styled.div``;

// 거래처 모달 스타일 컴포넌트 추가
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

const ModalContent = styled.div`
  background-color: white;
  border-radius: 12px;
  width: 650px;
  max-width: 95vw;
  height: 600px; /* 고정 높이 설정 */
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
  flex-shrink: 0; /* 헤더 크기 고정 */
`;

const SearchBar = styled.div`
  position: relative;
  margin-bottom: 20px;
  display: flex;
  flex-shrink: 0; /* 검색바 크기 고정 */
`;

const VendorList = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1; /* 남은 공간 모두 차지 */
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

const ItemRegistrationZone = ({ onRegister, item }) => {
  // 개별 상태로 관리
  const [mode, setMode] = useState(item ? "정정" : "신규");
  const [itemName, setItemName] = useState(item?.itemName || "");
  const [category, setCategory] = useState(item?.category || "");
  const [department, setDepartment] = useState(item?.department || "");
  const [price, setPrice] = useState(item?.price || "");
  const [vat, setVat] = useState(item?.vat !== undefined ? item.vat : true);
  const [quantity, setQuantity] = useState(item?.quantity || "");
  const [safeStock, setSafeStock] = useState(item?.safeStock || "");
  const [vendor, setVendor] = useState(item?.vendor || "");
  const [location, setLocation] = useState(item?.location || "");
  const [writer, setWriter] = useState(item?.writer || []);
  const [measure, setMeasure] = useState(item?.measure || "");
  const [state, setState] = useState(item?.state || "입고 완료");
  const [locationImage, setLocationImage] = useState(item?.locationImage || "");

  // 거래처 자동완성 관련 상태
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  // 거래처 모달 상태 추가
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorSearchTerm, setVendorSearchTerm] = useState("");
  const [modalFilteredVendors, setModalFilteredVendors] = useState([]);

  const { showToast } = useToast();

  // 거래처 목록 가져오기
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        // 실제 Firebase 데이터 가져오기
        const querySnapshot = await getDocs(collection(db, "vendors"));
        const vendorList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVendors(vendorList.filter((vendor) => !vendor.isHidden));
        setModalFilteredVendors(
          vendorList.filter((vendor) => !vendor.isHidden)
        );
      } catch (error) {
        console.error("거래처 데이터 로딩 실패:", error);
      }
    };
    fetchVendors();
  }, []);

  // URL 정규화 함수 (https://, www. 등을 고려)
  const normalizeUrl = (url) => {
    if (!url) return "";

    // 공백 제거 및 소문자 변환
    url = url.trim().toLowerCase();

    // 프로토콜 제거
    url = url.replace(/^https?:\/\//, "");

    // www. 제거
    url = url.replace(/^www\./, "");

    return url;
  };

  // 거래처 검색 필터링
  useEffect(() => {
    if (vendor.trim() === "") {
      setFilteredVendors([]);
      setShowVendorDropdown(false);
      return;
    }

    const normalizedInput = vendor.toLowerCase();
    const normalizedVendors = vendors.filter((v) => {
      // clientName에서 검색
      if (
        v.clientName &&
        v.clientName.toLowerCase().includes(normalizedInput)
      ) {
        return true;
      }

      // URL에서 검색 (정규화 후)
      if (v.url) {
        const normalizedVendorUrl = normalizeUrl(v.url);
        const normalizedSearchUrl = normalizeUrl(normalizedInput);
        return normalizedVendorUrl.includes(normalizedSearchUrl);
      }

      return false;
    });

    setFilteredVendors(normalizedVendors);
    setShowVendorDropdown(normalizedVendors.length > 0);
  }, [vendor, vendors]);

  // 모달 내 거래처 검색
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
            (v.url &&
              normalizeUrl(v.url).includes(normalizeUrl(normalizedInput)))
          );
        });
        setModalFilteredVendors(filtered);
      }
    }
  }, [vendorSearchTerm, vendors]);

  // 거래처 데이터 초기화
  useEffect(() => {
    if (vendors.length > 0) {
      setModalFilteredVendors(vendors);
    }
  }, [vendors]);

  // 아이템이 변경될 때 상태 초기화
  useEffect(() => {
    if (item) {
      setMode("정정");
      setItemName(item.itemName || "");
      setCategory(item.category || "");
      setDepartment(item.department || "");
      setPrice(item.price || "");
      setVat(item.vat !== undefined ? item.vat : true);
      setQuantity(item.quantity || "");
      setSafeStock(item.safeStock || "");
      setVendor(item.vendor || "");
      setLocation(item.location || "");
      setWriter(item.writer || []);
      setMeasure(item.measure || "");
      setState(item.state || "입고 완료");
      setLocationImage(item.locationImage || "");
    } else {
      setMode("신규");
      setItemName("");
      setCategory("");
      setDepartment("");
      setPrice("");
      setVat(true);
      setQuantity("");
      setSafeStock("");
      setVendor("");
      setLocation("");
      setWriter([]);
      setMeasure("");
      setState("입고 완료");
      setLocationImage("");
    }
  }, [item]);

  useEffect(() => {
    console.log("ItemRegistrationZone - Current item:", item);
    console.log("ItemRegistrationZone - Current mode:", mode);
  }, [item, mode]);

  const requiredFields = [
    "itemName",
    "category",
    "quantity",
    "writer",
    "department",
    "location",
  ];

  const isFormValid = () => {
    // 필수 필드 유효성 검사
    return (
      itemName &&
      category &&
      quantity &&
      writer.length > 0 &&
      department &&
      location
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // 정정 모드일 때 품명, 부서, 단위, 분류 필드의 변경 방지
    if (
      mode === "정정" &&
      ["itemName", "department", "measure", "category"].includes(name)
    ) {
      return;
    }

    // 각 필드별 상태 업데이트
    switch (name) {
      case "itemName":
        setItemName(value);
        break;
      case "price":
        setPrice(value);
        break;
      case "quantity":
        setQuantity(value);
        break;
      case "safeStock":
        setSafeStock(value);
        break;
      case "vendor":
        setVendor(value);
        setShowVendorDropdown(true);
        break;
      case "location":
        setLocation(value);
        break;
      case "measure":
        setMeasure(value);
        break;
      case "vat":
        setVat(checked);
        break;
      case "locationImage":
        setLocationImage(value);
        break;
      default:
        break;
    }
  };

  const handleCategoryChange = (value) => {
    if (mode === "정정") return;
    setCategory(value);
  };

  const handleModeChange = (newMode) => {
    if (newMode === "정정" && !item) {
      showToast("정정은 비품현황을 통해서만 가능합니다.", "error");
      return;
    }

    if (newMode === "신규" && mode === "정정") {
      setMode("신규");
      setItemName("");
      setCategory("");
      setDepartment("");
      setPrice("");
      setVat(true);
      setQuantity("");
      setSafeStock("");
      setVendor("");
      setLocation("");
      setWriter([]);
      setMeasure("");
      setState("입고 완료");
      setLocationImage("");

      showToast("신규 모드로 변경되었습니다.", "success");
      return;
    }

    if (newMode === "정정" && item) {
      setMode("정정");
      setItemName(item.itemName || "");
      setCategory(item.category || "");
      setDepartment(item.department || "");
      setPrice(item.price || "");
      setVat(item.vat !== undefined ? item.vat : true);
      setQuantity(item.quantity || "");
      setSafeStock(item.safeStock || "");
      setVendor(item.vendor || "");
      setLocation(item.location || "");
      setWriter(item.writer || []);
      setMeasure(item.measure || "");
      setState(item.state || "입고 완료");
      setLocationImage(item.locationImage || "");
      return;
    }

    setMode(newMode);
  };

  // 현재 상태들을 formData 객체로 합치는 함수
  const getFormData = () => {
    return {
      id: item?.id || "",
      itemName,
      category,
      department,
      price,
      vat,
      quantity,
      safeStock,
      vendor,
      location,
      writer,
      measure,
      state,
      locationImage,
    };
  };

  // 재고 히스토리 생성을 위한 함수 추가
  const createStockHistory = async (params) => {
    const { itemId, type, quantity, previousStock, currentStock, reason } =
      params;

    const stockHistoryData = {
      itemId: itemId,
      type: type,
      quantity: Number(quantity) || 0,
      previousStock: Number(previousStock) || 0,
      currentStock: Number(currentStock) || 0,
      date: serverTimestamp(),
      writer: writer || [],
      reason: reason || "미지정",
      status: "완료",
    };

    // 모든 필드가 유효한지 확인
    Object.entries(stockHistoryData).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        throw new Error(`${key} 필드가 유효하지 않습니다.`);
      }
    });

    return addDoc(collection(db, "stockHistory"), stockHistoryData);
  };

  const handleRegister = async () => {
    console.log("1. ItemRegistrationZone handleRegister 시작");
    console.log("현재 mode:", mode);
    console.log("받은 item:", item);

    // 현재 상태들을 formData 객체로 합침
    const formData = getFormData();

    const generateItemId = () => {
      const baseParts = [department, itemName];
      if (measure) {
        baseParts.push(measure);
      }
      return `${baseParts.join("_")}`;
    };

    try {
      if (mode === "신규") {
        const generatedId = generateItemId();
        const newDocRef = doc(db, "stocks", generatedId);

        // 문서가 이미 존재하는지 확인
        const docSnap = await getDoc(newDocRef);
        if (docSnap.exists()) {
          showToast("중복된 ID가 있어, 신규로 등록할 수 없습니다.", "error");
          return;
        }

        // 수량을 숫자로 변환하여 저장
        const quantityNum = Number(quantity) || 0;

        const newItemData = {
          ...formData,
          id: generatedId,
          quantity: quantityNum,
          lastUpdated: serverTimestamp(),
        };

        // stocks 컬렉션에 데이터 저장
        await setDoc(newDocRef, newItemData);
        console.log("2. 새 아이템 등록 완료");

        // stockHistory 생성 - 초기 입고 기록
        try {
          await createStockHistory({
            itemId: generatedId,
            type: "입고",
            quantity: quantityNum,
            previousStock: 0,
            currentStock: quantityNum,
            reason: "초기 등록",
          });
          console.log("3. 초기 재고 히스토리 생성 완료");
        } catch (historyError) {
          console.error("재고 히스토리 생성 중 오류:", historyError);
          throw historyError;
        }

        onRegister({ type: "create", data: newItemData });
      } else {
        console.log("3. 수정 모드 진입");
        console.log("item.id:", item.id);

        const itemRef = doc(db, "stocks", item.id);
        console.log("4. Firestore 문서 참조 생성:", itemRef);

        // 정정 모드에서는 품명, 부서, 단위를 변경하지 못하도록 원본 값 유지
        const updateData = {
          ...formData,
          id: item.id,
          itemName: item.itemName, // 원본 값 유지
          department: item.department, // 원본 값 유지
          measure: item.measure, // 원본 값 유지
          category: item.category, // 원본 값 유지
        };
        console.log("5. 업데이트할 데이터:", updateData);

        // updateDoc 대신 setDoc with merge 사용
        await setDoc(itemRef, updateData, { merge: true });
        console.log("6. Firestore 문서 업데이트 완료");

        // 재고 수량이 변경된 경우 히스토리 기록
        if (Number(item.quantity) !== Number(quantity)) {
          console.log("7. 재고 수량 변경 감지");
          console.log("이전 수량:", item.quantity);
          console.log("새로운 수량:", quantity);

          await createStockHistory({
            itemId: item.id,
            type: Number(quantity) > Number(item.quantity) ? "입고" : "출고",
            quantity: Math.abs(Number(quantity) - Number(item.quantity)),
            previousStock: Number(item.quantity),
            currentStock: Number(quantity),
            reason: "수량 정정",
          });
          console.log("8. 재고 히스토리 기록 완료");
        }

        const finalData = { ...formData, id: item.id };
        console.log("9. onRegister에 전달할 최종 데이터:", finalData);
        onRegister({ type: "update", data: finalData });
      }

      showToast(mode === "신규" ? "등록 완료!" : "수정 완료!", "success");

      // 폼 초기화 및 모드 재설정
      if (mode === "신규") {
        // 신규 등록 후 필드 초기화
        setItemName("");
        setCategory("");
        setDepartment("");
        setPrice("");
        setVat(true);
        setQuantity("");
        setSafeStock("");
        setVendor("");
        setLocation("");
        setWriter([]);
        setMeasure("");
        setState("입고 완료");
        setLocationImage("");
      } else {
        // 정정 모드였던 경우 신규 모드로 변경하고 초기화
        setMode("신규");
        setItemName("");
        setCategory("");
        setDepartment("");
        setPrice("");
        setVat(true);
        setQuantity("");
        setSafeStock("");
        setVendor("");
        setLocation("");
        setWriter([]);
        setMeasure("");
        setState("입고 완료");
        setLocationImage("");
      }
      console.log("11. 폼 초기화 완료");
    } catch (error) {
      console.error("Error in handleRegister:", error);
      showToast("저장 중 오류가 발생했습니다: " + error.message, "error");
    }
  };

  const locations = ["창고 A", "창고 B", "사무실", "물류센터"]; // 예제 옵션

  // 소모품 카테고리 목록
  const consumableCategories = [
    "사무용 소모품",
    "의료용 소모품",
    "마케팅 소모품",
    "기타 소모품",
  ];

  // 현재 선택된 카테고리가 소모품인지 확인하는 함수
  const isConsumableCategory = (category) => {
    return consumableCategories.includes(category);
  };

  const handleDepartmentChange = (value) => {
    // 정정 모드에서는 변경 무시
    if (mode === "정정") return;
    setDepartment(value);
  };

  // WhoSelector 변경 핸들러 추가
  const handlePeopleChange = (type) => (selectedPeople) => {
    setWriter(selectedPeople);
  };

  // 거래처 선택 핸들러
  const handleVendorSelect = (selectedVendor) => {
    setVendor(selectedVendor.clientName);
    setShowVendorDropdown(false);
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

  // 모달에서 검색어 변경 핸들러
  const handleVendorSearchChange = (e) => {
    setVendorSearchTerm(e.target.value);
  };

  return (
    <div className="w-full flex flex-col relative h-full">
      <TopZone className="w-full flex flex-row justify-between">
        <div className="flex space-x-4 mb-6">
          <button
            className={`w-[89px] h-[38px] border rounded-md ${
              mode === "신규"
                ? "border-onceBlue bg-onceBlue text-white"
                : "border-gray-400 text-gray-600"
            }`}
            onClick={() => handleModeChange("신규")}
          >
            신규
          </button>
          <button
            className={`w-[89px] h-[38px] border rounded-md ${
              mode === "정정"
                ? "border-onceBlue bg-onceBlue text-white"
                : "border-gray-400 text-gray-600"
            }`}
            onClick={() => handleModeChange("정정")}
          >
            정정
          </button>
        </div>
        <div className="flex justify-between mb-8">
          <div className="flex items-center space-x-4">
            <label className="text-black font-semibold w-[120px]">
              작성자:<span className="text-red-500">*</span>
            </label>
            <WhoSelector
              who={"작성자"}
              selectedPeople={writer}
              onPeopleChange={handlePeopleChange("writer")}
            />
          </div>
        </div>
      </TopZone>
      {/* Form */}
      <div className="space-y-6">
        {/* 품명 */}
        <div className="flex flex-row items-center">
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
            placeholder="품명"
            disabled={mode === "정정"}
            className={`w-[630px] border border-gray-400 rounded-md h-[40px] px-4 ${
              mode === "정정"
                ? "bg-gray-200 cursor-not-allowed"
                : "bg-textBackground"
            }`}
          />
        </div>
        {/* 분류 */}
        <SortZone className="flex flex-row w-[730px]">
          <FormLabel
            label={"분류"}
            required={true}
            className="flex font-semibold text-black mb-2 w-[80px] h-[40px] items-center"
          />
          <div className="flex flex-col">
            <div className="flex flex-row mb-[20px]">
              <SelectableButton
                field={category}
                value="사무용 소모품"
                onChange={handleCategoryChange}
                disabled={mode === "정정"}
              />
              <SelectableButton
                field={category}
                value="사무용품"
                onChange={handleCategoryChange}
                disabled={mode === "정정"}
              />
              <SelectableButton
                field={category}
                value="의료용 소모품"
                onChange={handleCategoryChange}
                disabled={mode === "정정"}
              />
              <SelectableButton
                field={category}
                value="의료용품"
                onChange={handleCategoryChange}
                disabled={mode === "정정"}
              />
              <SelectableButton
                field={category}
                value="마케팅용품"
                onChange={handleCategoryChange}
                disabled={mode === "정정"}
              />
            </div>
            <div className="flex flex-row mb-[20px]">
              <SelectableButton
                field={category}
                value="마케팅 소모품"
                onChange={handleCategoryChange}
                disabled={mode === "정정"}
              />
              <SelectableButton
                field={category}
                value="기타용품"
                onChange={handleCategoryChange}
                disabled={mode === "정정"}
              />
              <SelectableButton
                field={category}
                value="기타 소모품"
                onChange={handleCategoryChange}
                disabled={mode === "정정"}
              />
            </div>
          </div>
        </SortZone>
        {/* 분류 */}
        <TeamZone className="flex flex-row w-[730px]">
          <FormLabel
            label={"부서"}
            required={true}
            className="flex font-semibold text-black mb-2 w-[80px] h-[40px] items-center"
          />
          <div className="flex flex-col">
            <div className="flex flex-row mb-[20px]">
              <SelectableButton
                field={department}
                value="진료"
                onChange={handleDepartmentChange}
                disabled={mode === "정정"}
              />
              <SelectableButton
                field={department}
                value="간호"
                onChange={handleDepartmentChange}
                disabled={mode === "정정"}
              />
              <SelectableButton
                field={department}
                value="물리치료"
                onChange={handleDepartmentChange}
                disabled={mode === "정정"}
              />
              <SelectableButton
                field={department}
                value="원무"
                onChange={handleDepartmentChange}
                disabled={mode === "정정"}
              />
              <SelectableButton
                field={department}
                value="방사선"
                onChange={handleDepartmentChange}
                disabled={mode === "정정"}
              />
            </div>
          </div>
        </TeamZone>
        {/* 단가 */}
        <div className="flex flex-row items-center">
          <FormLabel
            label={"단위"}
            required={true}
            className="h-[40px] flex items-center font-semibold text-black w-[80px]"
          />
          <input
            type="text"
            name="measure"
            value={measure}
            onChange={handleChange}
            placeholder="단위"
            disabled={mode === "정정"}
            className={`border border-gray-400 rounded-md h-[40px] px-4 w-[280px] ${
              mode === "정정"
                ? "bg-gray-200 cursor-not-allowed"
                : "bg-textBackground"
            } mr-[40px]`}
          />
        </div>
        {/* 기초재고 & 안전재고 */}
        <div className="flex flex-row items-center">
          <FormLabel
            label={"현재재고"}
            required={true}
            className="h-[40px] flex items-center font-semibold text-black mb-2 w-[80px]"
          />
          <input
            type="text"
            name="quantity"
            value={quantity}
            onChange={handleChange}
            placeholder="현재재고 수량"
            className="w-[280px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground mr-[40px]"
          />
          {isConsumableCategory(category) && (
            <>
              <FormLabel
                label={"안전재고"}
                required={false}
                className="h-[40px] flex items-center font-semibold text-black mb-2 w-[80px]"
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
        </div>

        {/* 안전재고 알림 문구 - 소모품일 때만 표시 */}
        {isConsumableCategory(category) && (
          <p className="text-red-500 text-sm mt-4">
            * 안전재고 이하로 수량이 떨어지면 알림이 갑니다.
          </p>
        )}

        {/* 거래처 */}
        <div className="flex flex-row items-center relative">
          <label className="h-[40px] flex items-center font-semibold text-black w-[80px]">
            거래처:
          </label>
          <div className="relative w-[600px]">
            <input
              type="text"
              name="vendor"
              value={vendor}
              onChange={handleChange}
              onFocus={() =>
                setShowVendorDropdown(
                  vendor.trim() !== "" && filteredVendors.length > 0
                )
              }
              onBlur={() => setTimeout(() => setShowVendorDropdown(false), 200)}
              placeholder="거래처명 또는 URL을 입력해주세요"
              className="w-full border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
            />
            {showVendorDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredVendors.length > 0 ? (
                  filteredVendors.map((v) => (
                    <div
                      key={v.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onMouseDown={() => handleVendorSelect(v)}
                    >
                      <div className="font-semibold">{v.clientName}</div>
                      {v.url && (
                        <div className="text-sm text-gray-600">{v.url}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500">
                    검색 결과가 없습니다
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="w-[80px] flex justify-center h-[40px]">
            <SelectVendorButton onClick={toggleVendorModal}>
              <img src={search} alt="검색" className="w-[24px] h-[24px]" />
            </SelectVendorButton>
          </div>
          <span className="text-gray-600 text-sm">목록보기</span>
        </div>

        {/* 거래처 선택 모달 */}
        {showVendorModal && (
          <VendorModal onClick={() => setShowVendorModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
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
                  onChange={handleVendorSearchChange}
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
            </ModalContent>
          </VendorModal>
        )}

        {/* 위치 - 필수 표시 추가 */}
        <div className="flex flex-row items-center">
          <label className="h-[40px] flex items-center font-semibold text-black w-[80px]">
            위치:<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="location"
            value={location}
            onChange={handleChange}
            placeholder="위치를 입력해주세요"
            className="w-[600px] border border-gray-400 rounded-md h-[40px] px-4 bg-textBackground"
          />
          <div className="ml-[20px]">
            <ImageUploader
              name="locationImage"
              value={locationImage}
              onChange={(file) =>
                handleChange({ target: { name: "locationImage", value: file } })
              }
            />
          </div>
        </div>
      </div>

      {/* 등록/수정 버튼 */}
      <div className="absolute bottom-0 w-full">
        <ItemRegistrationButton
          mode={mode}
          formData={getFormData()}
          requiredFields={requiredFields}
          onClick={handleRegister}
          showToast={showToast}
        />
      </div>
    </div>
  );
};

export default ItemRegistrationZone;
