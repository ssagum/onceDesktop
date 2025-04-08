import React, { useState, useEffect } from "react";
import ModalTemplate from "../common/ModalTemplate";
import styled from "styled-components";
import { cancel } from "../../assets";
import { useUserLevel } from "../../utils/UserLevelContext";
import { db } from "../../firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  setDoc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { useToast } from "../../contexts/ToastContext";
import JcyTable from "../common/JcyTable";
import { calculateTotalAccumulatedDays } from "../../utils/vacationUtils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Area,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  format,
  addDays,
  isEqual,
  parseISO,
  getDay,
  differenceInDays,
  differenceInMonths,
  differenceInCalendarMonths,
  isBefore,
  isAfter,
} from "date-fns";

const ModalHeaderZone = styled.div``;
const ContentZone = styled.div``;

const MainZone = styled.div``;

// 직원의 휴가 정보 계산 함수
const calculateStaffVacationInfo = (userData) => {
  // 입사일 처리
  let hireDate = userData.hireDate || null;

  // hireDate가 Timestamp 객체인 경우 처리
  if (hireDate && typeof hireDate === "object" && hireDate.seconds) {
    hireDate = format(new Date(hireDate.seconds * 1000), "yyyy-MM-dd");
  }

  // 기사용 휴가 일수
  const usedVacationDays = userData.usedVacationDays || 0;

  // 입사일부터 지금까지 누적된 사용 가능 휴가 일수
  const totalAccumulatedDays = calculateTotalAccumulatedDays(hireDate);

  // 잔여 휴가 일수 = 누적 사용 가능 일수 - 기사용 일수
  const remainingVacationDays = Math.max(
    0,
    totalAccumulatedDays - usedVacationDays
  );

  return {
    hireDate,
    usedVacationDays,
    totalAccumulatedDays,
    remainingVacationDays,
  };
};

// 토글 컨테이너와 옵션 스타일링
const ToggleContainer = styled.div`
  position: relative;
  width: 300px;
  height: 40px;
  background-color: #f0f0f0;
  border-radius: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ToggleSlider = styled.div`
  position: absolute;
  width: 150px;
  height: 32px;
  background-color: white;
  border-radius: 16px;
  transition: transform 0.3s ease;
  transform: translateX(
    ${(props) => (props.position === "left" ? "0" : "146px")}
  );
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ToggleOption = styled.div`
  z-index: 1;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: ${(props) => (props.active ? "#002855" : "#666")};
  font-weight: ${(props) => (props.active ? "bold" : "normal")};
  transition: color 0.3s ease;
`;

const ToggleIcon = styled.span`
  margin-right: 5px;
`;

// 직원 상세 정보 모달 컴포넌트
const StaffDetailModal = ({
  isVisible,
  setIsVisible,
  staff,
  onStaffUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStaff, setEditedStaff] = useState(null);
  const [displaySalary, setDisplaySalary] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    if (staff) {
      setEditedStaff({
        ...staff,
        bankInfo: {
          ...staff.bankInfo,
          salary: staff.bankInfo?.salary || "",
          salaryType: staff.bankInfo?.salaryType || "세전",
        },
      });
      // 월급에 콤마 표시
      if (staff.bankInfo?.salary) {
        setDisplaySalary(staff.bankInfo.salary.toLocaleString());
      } else {
        setDisplaySalary("");
      }
    }
  }, [staff]);

  // Timestamp로 저장된 날짜를 Firebase에 저장할 때 변환하는 함수
  const formatDateForFirebase = (dateString) => {
    if (!dateString) return null;
    return Timestamp.fromDate(new Date(dateString));
  };

  if (!isVisible || !staff) return null;

  // 숫자만 추출하는 함수
  const extractNumber = (str) => {
    return str.replace(/[^\d]/g, "");
  };

  // 숫자에 콤마를 추가하는 함수
  const formatNumberWithCommas = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "bankInfo.salary") {
      // 숫자만 추출하여 저장
      const numberValue = extractNumber(value);

      // 디스플레이용 콤마 추가된 값 설정
      if (numberValue) {
        setDisplaySalary(formatNumberWithCommas(numberValue));
      } else {
        setDisplaySalary("");
      }

      // 실제 데이터에는 숫자 형태로 저장
      setEditedStaff({
        ...editedStaff,
        bankInfo: {
          ...editedStaff.bankInfo,
          salary: numberValue ? parseInt(numberValue, 10) : "",
        },
      });
    } else if (name.startsWith("bankInfo.")) {
      const bankInfoField = name.split(".")[1];
      setEditedStaff({
        ...editedStaff,
        bankInfo: {
          ...editedStaff.bankInfo,
          [bankInfoField]: value,
        },
      });
    } else {
      setEditedStaff({
        ...editedStaff,
        [name]: value,
      });
    }
  };

  // 실제 Firebase에 저장하는 함수
  const handleSave = async () => {
    try {
      // 날짜 형식을 Timestamp로 변환
      const firestoreData = {
        ...editedStaff,
        hireDate: formatDateForFirebase(editedStaff.hireDate),
        resignationDate: formatDateForFirebase(editedStaff.resignationDate),
      };

      // Firebase에 직원 정보 업데이트
      const userDocRef = doc(db, "users", editedStaff.id);
      await setDoc(userDocRef, firestoreData, { merge: true });

      showToast("직원 정보가 성공적으로 저장되었습니다.", "success");

      // 부모 컴포넌트에 업데이트된 정보 전달
      if (onStaffUpdate) {
        onStaffUpdate(editedStaff);
      }

      setIsEditing(false);
    } catch (error) {
      showToast("직원 정보 저장에 실패했습니다.", "error");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-md w-[700px] max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {isEditing ? "직원 정보 편집" : "직원 상세 정보"}
          </h2>
          <button
            onClick={() => {
              setIsEditing(false);
              setIsVisible(false);
            }}
            className="text-gray-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* 기본 정보 */}
          <div className="col-span-2 bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              기본 정보
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm">이름</p>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={editedStaff.name || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-1.5"
                  />
                ) : (
                  <p className="font-medium">{staff.name}</p>
                )}
              </div>
              <div>
                <p className="text-gray-600 text-sm">부서</p>
                {isEditing ? (
                  <select
                    name="department"
                    value={editedStaff.department || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-1.5"
                  >
                    <option value="">선택하세요</option>
                    <option value="진료팀">진료팀</option>
                    <option value="간호팀">간호팀</option>
                    <option value="물리치료팀">물리치료팀</option>
                    <option value="원무팀">원무팀</option>
                    <option value="영상의학팀">영상의학팀</option>
                    <option value="경영지원팀">경영지원팀</option>
                  </select>
                ) : (
                  <p className="font-medium">{staff.department}</p>
                )}
              </div>
              <div>
                <p className="text-gray-600 text-sm">직책</p>
                {isEditing ? (
                  <select
                    name="role"
                    value={editedStaff.role || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-1.5"
                  >
                    <option value="">선택하세요</option>
                    <option value="팀원">팀원</option>
                    <option value="팀장">팀장</option>
                    <option value="과장">과장</option>
                  </select>
                ) : (
                  <p className="font-medium">{staff.role || "-"}</p>
                )}
              </div>
              <div>
                <p className="text-gray-600 text-sm">상태</p>
                {isEditing ? (
                  <select
                    name="status"
                    value={editedStaff.status || "재직"}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-1.5"
                  >
                    <option value="재직">재직</option>
                    <option value="휴직">휴직</option>
                    <option value="퇴직">퇴직</option>
                  </select>
                ) : (
                  <p className="font-medium">
                    <span
                      className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                        staff.status === "재직"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {staff.status || "재직"}
                    </span>
                  </p>
                )}
              </div>
              <div>
                <p className="text-gray-600 text-sm">입사일</p>
                {isEditing ? (
                  <input
                    type="date"
                    name="hireDate"
                    value={editedStaff.hireDate || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-1.5"
                  />
                ) : (
                  <p className="font-medium">{staff.hireDate || "-"}</p>
                )}
              </div>
              <div>
                <p className="text-gray-600 text-sm">퇴사일</p>
                {isEditing ? (
                  <input
                    type="date"
                    name="resignationDate"
                    value={editedStaff.resignationDate || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-1.5"
                  />
                ) : (
                  <p className="font-medium">{staff.resignationDate || "-"}</p>
                )}
              </div>
            </div>
          </div>

          {/* 연락처 정보 */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              연락처 정보
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-gray-600 text-sm">이메일</p>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editedStaff.email || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-1.5"
                  />
                ) : (
                  <p className="font-medium">{staff.email || "-"}</p>
                )}
              </div>
              <div>
                <p className="text-gray-600 text-sm">전화번호</p>
                {isEditing ? (
                  <input
                    type="text"
                    name="phoneNumber"
                    value={editedStaff.phoneNumber || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-1.5"
                  />
                ) : (
                  <p className="font-medium">{staff.phoneNumber || "-"}</p>
                )}
              </div>
              <div>
                <p className="text-gray-600 text-sm">주소</p>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={editedStaff.address || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-1.5"
                  />
                ) : (
                  <p className="font-medium">{staff.address || "-"}</p>
                )}
              </div>
            </div>
          </div>

          {/* 급여 정보 */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              급여 정보
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-gray-600 text-sm">은행</p>
                {isEditing ? (
                  <input
                    type="text"
                    name="bankInfo.bankName"
                    value={editedStaff.bankInfo?.bankName || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-1.5"
                  />
                ) : (
                  <p className="font-medium">
                    {staff.bankInfo?.bankName || "-"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-gray-600 text-sm">계좌번호</p>
                {isEditing ? (
                  <input
                    type="text"
                    name="bankInfo.accountNumber"
                    value={editedStaff.bankInfo?.accountNumber || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-1.5"
                  />
                ) : (
                  <p className="font-medium">
                    {staff.bankInfo?.accountNumber || "-"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-gray-600 text-sm">월급</p>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      name="bankInfo.salary"
                      value={displaySalary}
                      onChange={handleInputChange}
                      className="flex-1 border rounded-md px-3 py-1.5"
                      placeholder="금액 입력"
                    />
                    <select
                      name="bankInfo.salaryType"
                      value={editedStaff.bankInfo?.salaryType || "세전"}
                      onChange={handleInputChange}
                      className="border rounded-md px-3 py-1.5"
                    >
                      <option value="세전">세전</option>
                      <option value="세후">세후</option>
                    </select>
                  </div>
                ) : (
                  <p className="font-medium">
                    {staff.bankInfo?.salary
                      ? `${staff.bankInfo.salary.toLocaleString()}원 (${
                          staff.bankInfo.salaryType || "세전"
                        })`
                      : "-"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 주민번호 정보 (마스킹 처리) */}
          <div className="col-span-2 bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              주민등록번호
            </h3>
            {isEditing ? (
              <input
                type="text"
                name="idNumber"
                value={editedStaff.idNumber || ""}
                onChange={handleInputChange}
                className="w-full border rounded-md px-3 py-1.5"
                placeholder="000000-0000000 형식으로 입력"
              />
            ) : (
              <p className="font-medium">
                {staff.idNumber
                  ? staff.idNumber.replace(/(\d{6})-(\d{7})/, "$1-*******")
                  : "-"}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md mr-2"
              >
                취소
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
                onClick={handleSave}
              >
                저장
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsVisible(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md mr-2"
              >
                닫기
              </button>
              <button
                className="px-4 py-2 bg-onceBlue text-white rounded-md"
                onClick={() => setIsEditing(true)}
              >
                편집
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// 인력 현황 컴포넌트
const StaffManagement = () => {
  const [staffData, setStaffData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartmentFilters, setSelectedDepartmentFilters] = useState(
    []
  );
  const [isFilterModalOn, setIsFilterModalOn] = useState(false);
  const [sortedData, setSortedData] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 진료 및 물리치료 담당자 관리를 위한 상태 추가
  const [providers, setProviders] = useState({ 진료: [], 물리치료: [] });
  const [newProvider, setNewProvider] = useState("");
  const [providerType, setProviderType] = useState("진료");
  const [isEditingProviders, setIsEditingProviders] = useState(false);
  const { showToast } = useToast();

  // 부서 필터 목록
  const departments = [
    "원장팀",
    "간호팀",
    "물리치료팀",
    "원무팀",
    "영상의학팀",
    "경영지원팀",
  ];

  // 담당자 추가
  const handleAddProvider = () => {
    if (!newProvider.trim()) return;

    const updatedProviders = { ...providers };
    // 담당자를 객체 형태로 추가 (이름과 비근무 요일 정보 포함)
    updatedProviders[providerType] = [
      ...updatedProviders[providerType],
      {
        name: newProvider.trim(),
        offDays: [], // 기본적으로 비근무 요일은 없음
      },
    ];
    setProviders(updatedProviders);
    setNewProvider("");
  };

  // 담당자 제거
  const handleRemoveProvider = (type, providerName) => {
    const updatedProviders = { ...providers };
    updatedProviders[type] = updatedProviders[type].filter(
      (provider) => provider.name !== providerName
    );
    setProviders(updatedProviders);
  };

  // 비근무 요일 토글
  const toggleOffDay = (type, providerName, day) => {
    const updatedProviders = { ...providers };
    const providerIndex = updatedProviders[type].findIndex(
      (provider) => provider.name === providerName
    );

    if (providerIndex !== -1) {
      const provider = updatedProviders[type][providerIndex];

      // 이미 비근무 요일로 설정되어 있으면 제거, 아니면 추가
      if (provider.offDays.includes(day)) {
        provider.offDays = provider.offDays.filter((d) => d !== day);
      } else {
        provider.offDays = [...provider.offDays, day];
      }

      updatedProviders[type][providerIndex] = provider;
      setProviders(updatedProviders);
    }
  };

  // Firebase에서 담당자 정보 가져오기
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const settingDocRef = doc(db, "setting", "providers");
        const settingDoc = await getDoc(settingDocRef);

        if (settingDoc.exists()) {
          const data = settingDoc.data();

          // 기존 데이터가 문자열 배열인 경우 객체 배열로 변환
          const convertToObjectArray = (array) => {
            if (!array) return [];
            return array.map((item) => {
              // 이미 객체인 경우 그대로 반환
              if (typeof item === "object" && item !== null) {
                return item;
              }
              // 문자열인 경우 객체로 변환
              return { name: item, offDays: [] };
            });
          };

          setProviders({
            진료: convertToObjectArray(data.진료 || []),
            물리치료: convertToObjectArray(data.물리치료 || []),
          });
        } else {
        }
      } catch (error) {}
    };

    fetchProviders();
  }, []);

  // 담당자 정보 저장
  const handleSaveProviders = async () => {
    try {
      const settingDocRef = doc(db, "setting", "providers");
      await setDoc(settingDocRef, providers, { merge: true });
      showToast("담당자 정보가 저장되었습니다.", "success");
      setIsEditingProviders(false);
    } catch (error) {
      showToast("담당자 정보 저장에 실패했습니다.", "error");
    }
  };

  // Firebase에서 사용자 데이터 가져오기
  useEffect(() => {
    setIsLoading(true);

    try {
      const q = query(collection(db, "users"));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const users = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();

          // Timestamp를 문자열로 변환
          let formattedHireDate = "";
          let formattedResignationDate = "";

          // 입사일 처리
          if (userData.hireDate) {
            // Timestamp 객체인 경우
            if (
              userData.hireDate instanceof Timestamp ||
              userData.hireDate.seconds
            ) {
              formattedHireDate = format(
                new Date(userData.hireDate.seconds * 1000),
                "yyyy-MM-dd"
              );
            }
            // 문자열인 경우 그대로 사용
            else if (typeof userData.hireDate === "string") {
              formattedHireDate = userData.hireDate;
            }
          }

          // 퇴사일 처리
          if (userData.resignationDate) {
            // Timestamp 객체인 경우
            if (
              userData.resignationDate instanceof Timestamp ||
              userData.resignationDate.seconds
            ) {
              formattedResignationDate = format(
                new Date(userData.resignationDate.seconds * 1000),
                "yyyy-MM-dd"
              );
            }
            // 문자열인 경우 그대로 사용
            else if (typeof userData.resignationDate === "string") {
              formattedResignationDate = userData.resignationDate;
            }
          }

          // 휴가 정보 계산
          const vacationInfo = calculateStaffVacationInfo({
            ...userData,
            hireDate: formattedHireDate, // 문자열로 변환된 입사일 전달
          });

          users.push({
            id: doc.id,
            name: userData.name || "",
            department: userData.department || "",
            role: userData.role || "",
            hireDate: formattedHireDate,
            resignationDate: formattedResignationDate,
            email: userData.email || "",
            phoneNumber: userData.phoneNumber || "",
            status: userData.resignationDate ? "퇴직" : "재직",
            idNumber: userData.idNumber || "",
            address: userData.address || "",
            bankInfo: userData.bankInfo || {},
            userId: userData.userId || "",
            // 휴가 관련 정보 (계산된 값 사용)
            usedVacationDays: vacationInfo.usedVacationDays,
            totalAccumulatedDays: vacationInfo.totalAccumulatedDays,
            remainingVacationDays: vacationInfo.remainingVacationDays,
          });
        });

        setStaffData(users);
        setSortedData(users);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      setIsLoading(false);

      // 에러 시 더미 데이터 사용
      const dummyStaffData = [
        {
          id: "1",
          name: "홍길동",
          department: "원장팀",
          role: "원장",
          hireDate: "2020-01-01",
          email: "hong@example.com",
          phoneNumber: "010-1234-5678",
          status: "재직",
        },
        {
          id: "2",
          name: "김간호",
          department: "간호팀",
          role: "수간호사",
          hireDate: "2020-03-15",
          email: "kim@example.com",
          phoneNumber: "010-2345-6789",
          status: "재직",
        },
        {
          id: "3",
          name: "박치료",
          department: "물리치료팀",
          role: "물리치료사",
          hireDate: "2021-07-22",
          email: "park@example.com",
          phoneNumber: "010-3456-7890",
          status: "재직",
        },
        {
          id: "4",
          name: "이원무",
          department: "원무팀",
          role: "원무과장",
          hireDate: "2020-05-10",
          email: "lee@example.com",
          phoneNumber: "010-4567-8901",
          status: "재직",
        },
        {
          id: "5",
          name: "최영상",
          department: "영상의학팀",
          role: "방사선사",
          hireDate: "2021-02-28",
          email: "choi@example.com",
          phoneNumber: "010-5678-9012",
          status: "휴직",
        },
        {
          id: "6",
          name: "정경영",
          department: "경영지원팀",
          role: "총무",
          hireDate: "2020-09-18",
          email: "jung@example.com",
          phoneNumber: "010-6789-0123",
          status: "재직",
        },
      ];

      setStaffData(dummyStaffData);
      setSortedData(dummyStaffData);
    }
  }, []);

  // 부서 필터 토글
  const toggleDepartmentFilter = (dept) => {
    if (selectedDepartmentFilters.includes(dept)) {
      setSelectedDepartmentFilters(
        selectedDepartmentFilters.filter((d) => d !== dept)
      );
    } else {
      setSelectedDepartmentFilters([...selectedDepartmentFilters, dept]);
    }
  };

  // 모든 필터 초기화
  const resetFilters = () => {
    setSelectedDepartmentFilters([]);
  };

  // 개별 필터 제거
  const removeFilter = (filter) => {
    setSelectedDepartmentFilters(
      selectedDepartmentFilters.filter((d) => d !== filter)
    );
  };

  // 검색어 및 필터 적용 시 데이터 업데이트
  useEffect(() => {
    let filtered = staffData;

    // 검색어 필터링
    if (searchTerm) {
      const cleanedSearchTerm = searchTerm.replace(/\s+/g, "").toLowerCase();
      filtered = filtered.filter(
        (staff) =>
          staff.name
            ?.replace(/\s+/g, "")
            .toLowerCase()
            .includes(cleanedSearchTerm) ||
          staff.email?.replace(/\s+/g, "").toLowerCase().includes(cleanedSearchTerm) // 이메일도 공백 제거 및 소문자 변환
      );
    }

    // 부서 필터링
    if (selectedDepartmentFilters.length > 0) {
      filtered = filtered.filter((staff) =>
        selectedDepartmentFilters.includes(staff.department)
      );
    }

    setSortedData(filtered);
  }, [searchTerm, selectedDepartmentFilters, staffData]);

  // 직원 행 클릭 핸들러
  const handleStaffClick = (staff) => {
    setSelectedStaff(staff);
    setIsDetailModalVisible(true);
  };

  // 테이블 컬럼 정의
  const columns = [
    { label: "이름", key: "name" },
    { label: "부서", key: "department" },
    { label: "직책", key: "role" },
    { label: "입사일", key: "hireDate" },
    { label: "잔여연차", key: "remainingVacationDays" },
    { label: "상태", key: "status" },
  ];

  // 스태프 행 렌더링
  const renderStaffRow = (staff, index) => (
    <div
      className="grid gap-4 py-3 items-center px-2 cursor-pointer hover:bg-gray-50"
      style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 0.8fr" }}
      onClick={() => handleStaffClick(staff)}
    >
      <div className="text-center">{staff.name}</div>
      <div className="text-center">{staff.department}</div>
      <div className="text-center">{staff.role}</div>
      <div className="text-center">{staff.hireDate}</div>
      <div className="text-center">{staff.remainingVacationDays || 0}</div>
      <div className="flex justify-center">
        <span
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            staff.status === "재직"
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {staff.status}
        </span>
      </div>
    </div>
  );

  // 직원 정보 업데이트 처리 함수
  const handleStaffUpdate = (updatedStaff) => {
    // 업데이트된 직원 정보로 selectedStaff 상태 업데이트
    setSelectedStaff(updatedStaff);

    // staffData 배열에서 해당 직원 정보도 업데이트
    const updatedStaffData = staffData.map((staff) =>
      staff.id === updatedStaff.id ? updatedStaff : staff
    );

    setStaffData(updatedStaffData);

    // 필터링된 데이터도 업데이트
    const updatedSortedData = sortedData.map((staff) =>
      staff.id === updatedStaff.id ? updatedStaff : staff
    );

    setSortedData(updatedSortedData);
  };

  return (
    <div className="flex flex-col w-full bg-white h-full p-5">
      {/* 진료 및 물리치료 담당자 관리 섹션 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-blue-800">
            예약 시트 인력 관리
          </h3>
          <div>
            {isEditingProviders ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveProviders}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium"
                >
                  저장하기
                </button>
                <button
                  onClick={() => setIsEditingProviders(false)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded text-sm font-medium"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingProviders(true)}
                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm font-medium"
              >
                편집하기
              </button>
            )}
          </div>
        </div>

        {isEditingProviders ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white p-3 rounded-md border border-blue-100">
                <h4 className="font-medium text-blue-900 mb-2">진료 담당자</h4>
                <div className="space-y-3">
                  {providers.진료.map((provider, index) => (
                    <div
                      key={`doctor-${index}`}
                      className="border border-blue-100 rounded-md p-2"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{provider.name}</span>
                        <button
                          onClick={() =>
                            handleRemoveProvider("진료", provider.name)
                          }
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          비근무 요일:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {["월", "화", "수", "목", "금", "토", "일"].map(
                            (day) => (
                              <button
                                key={day}
                                onClick={() =>
                                  toggleOffDay("진료", provider.name, day)
                                }
                                className={`px-2 py-1 text-xs rounded-md ${
                                  provider.offDays &&
                                  provider.offDays.includes(day)
                                    ? "bg-red-100 text-red-800 border border-red-300"
                                    : "bg-gray-100 text-gray-800 border border-gray-200"
                                }`}
                              >
                                {day}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-3 rounded-md border border-blue-100">
                <h4 className="font-medium text-blue-900 mb-2">
                  물리치료 담당자
                </h4>
                <div className="space-y-3">
                  {providers.물리치료.map((provider, index) => (
                    <div
                      key={`therapist-${index}`}
                      className="border border-blue-100 rounded-md p-2"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{provider.name}</span>
                        <button
                          onClick={() =>
                            handleRemoveProvider("물리치료", provider.name)
                          }
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          비근무 요일:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {["월", "화", "수", "목", "금", "토", "일"].map(
                            (day) => (
                              <button
                                key={day}
                                onClick={() =>
                                  toggleOffDay("물리치료", provider.name, day)
                                }
                                className={`px-2 py-1 text-xs rounded-md ${
                                  provider.offDays &&
                                  provider.offDays.includes(day)
                                    ? "bg-red-100 text-red-800 border border-red-300"
                                    : "bg-gray-100 text-gray-800 border border-gray-200"
                                }`}
                              >
                                {day}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <select
                value={providerType}
                onChange={(e) => setProviderType(e.target.value)}
                className="border rounded-md px-3 py-1.5"
              >
                <option value="진료">진료</option>
                <option value="물리치료">물리치료</option>
              </select>

              <input
                type="text"
                value={newProvider}
                onChange={(e) => setNewProvider(e.target.value)}
                placeholder="담당자 이름 입력"
                className="border rounded-md px-3 py-1.5 flex-1"
              />

              <button
                onClick={handleAddProvider}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-md"
              >
                추가
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white p-3 rounded-md border border-blue-100">
              <h4 className="font-medium text-blue-900 mb-2">진료 담당자</h4>
              <div className="space-y-2">
                {providers.진료.length > 0 ? (
                  providers.진료.map((provider, index) => (
                    <div
                      key={`doctor-${index}`}
                      className="border border-gray-100 p-2 rounded-md"
                    >
                      <div className="flex items-center flex-wrap">
                        <span className="text-blue-800 font-medium mr-2">
                          {provider.name}
                        </span>
                        {(() => {
                          // 일요일을 제외한 요일 배열
                          const weekdays = ["월", "화", "수", "목", "금", "토"];
                          // 일요일을 제외하고 비근무 요일 필터링
                          const offDays = provider.offDays
                            ? provider.offDays.filter((day) => day !== "일")
                            : [];

                          const workingDays = weekdays.filter(
                            (day) => !offDays.includes(day)
                          );

                          if (offDays.length === 0) {
                            // 월-토 모두 근무하는 경우
                            return (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                매일 근무
                              </span>
                            );
                          } else if (workingDays.length <= 2) {
                            // 근무일이 1-2일인 경우 근무일 표시
                            return (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                {workingDays.join(", ")}요일 근무
                              </span>
                            );
                          } else {
                            // 비근무일이 적은 경우 비근무일 표시
                            return (
                              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                {offDays.join(", ")}요일 휴무
                              </span>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">
                    등록된 담당자가 없습니다
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white p-3 rounded-md border border-blue-100">
              <h4 className="font-medium text-blue-900 mb-2">
                물리치료 담당자
              </h4>
              <div className="space-y-2">
                {providers.물리치료.length > 0 ? (
                  providers.물리치료.map((provider, index) => (
                    <div
                      key={`therapist-${index}`}
                      className="border border-gray-100 p-2 rounded-md"
                    >
                      <div className="flex items-center flex-wrap">
                        <span className="text-blue-800 font-medium mr-2">
                          {provider.name}
                        </span>
                        {(() => {
                          // 일요일을 제외한 요일 배열
                          const weekdays = ["월", "화", "수", "목", "금", "토"];
                          // 일요일을 제외하고 비근무 요일 필터링
                          const offDays = provider.offDays
                            ? provider.offDays.filter((day) => day !== "일")
                            : [];

                          const workingDays = weekdays.filter(
                            (day) => !offDays.includes(day)
                          );

                          if (offDays.length === 0) {
                            // 월-토 모두 근무하는 경우
                            return (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                매일 근무
                              </span>
                            );
                          } else if (workingDays.length <= 2) {
                            // 근무일이 1-2일인 경우 근무일 표시
                            return (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                {workingDays.join(", ")}요일 근무
                              </span>
                            );
                          } else {
                            // 비근무일이 적은 경우 비근무일 표시
                            return (
                              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                {offDays.join(", ")}요일 휴무
                              </span>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">
                    등록된 담당자가 없습니다
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 검색 영역 */}
      <div className="flex flex-row w-full items-center justify-between mb-4">
        <div className="relative w-[400px]">
          <input
            type="text"
            placeholder="이름 또는 이메일을 입력해주세요."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-[#9D9D9C] bg-[#FCFAFA] rounded px-4 py-2"
          />
          <svg
            className="absolute right-3 top-3 w-5 h-5 text-[#9D9D9C]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z"
              clipRule="evenodd"
            ></path>
          </svg>
        </div>
      </div>

      {/* 로딩 표시 */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <JcyTable
          columns={columns}
          columnWidths="grid-cols-[1fr_1fr_1fr_1fr_1fr_0.8fr]"
          data={sortedData}
          rowClassName={(index) =>
            index % 2 === 0 ? "bg-gray-100" : "bg-white"
          }
          renderRow={renderStaffRow}
          itemsPerPage={2}
          emptyRowHeight="60px"
          onRowClick={(row) => {
            setSelectedStaff(row);
            setIsDetailModalVisible(true);
          }}
        />
      )}

      {/* 필터 모달 */}
      {isFilterModalOn && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-md w-[600px] p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">필터 설정</h2>
              <button
                onClick={() => setIsFilterModalOn(false)}
                className="text-gray-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">부서</h3>
              <div className="flex flex-wrap gap-2">
                {departments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => toggleDepartmentFilter(dept)}
                    className={`px-4 py-2 border rounded-md ${
                      selectedDepartmentFilters.includes(dept)
                        ? "bg-blue-100 border-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsFilterModalOn(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 직원 상세 정보 모달 */}
      <StaffDetailModal
        isVisible={isDetailModalVisible}
        setIsVisible={setIsDetailModalVisible}
        staff={selectedStaff}
        onStaffUpdate={handleStaffUpdate}
      />
    </div>
  );
};

// 매출 상세 내역 모달 컴포넌트
const RevenueDetailModal = ({ isVisible, setIsVisible, data }) => {
  if (!isVisible || !data || data.length === 0) return null;
  const [activeTab, setActiveTab] = useState("revenue"); // 'revenue', 'expense', 'profit'

  // 파이 차트 색상 설정
  const COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff8042",
    "#0088FE",
    "#00C49F",
  ];

  // 비용 구성 데이터 생성
  const expenseCompositionData = [
    { name: "고정비", value: 26 },
    { name: "인건비", value: 53 },
    { name: "의료소모품", value: 16 },
    { name: "기타", value: 5 },
  ];

  // 테이블 컬럼 정의 (매출 탭)
  const revenueColumns = [
    { label: "기간", key: "month" },
    { label: "총 매출", key: "revenue" },
    { label: "환자 수", key: "patients" },
    { label: "평균 매출", key: "average" },
  ];

  // 테이블 컬럼 정의 (비용 탭)
  const expenseColumns = [
    { label: "기간", key: "month" },
    { label: "고정비", key: "fixedCost" },
    { label: "인건비", key: "laborCost" },
    { label: "의료소모품", key: "medicalSupplies" },
    { label: "기타", key: "otherExpenses" },
    { label: "총 비용", key: "totalExpense" },
  ];

  // 수익성 컬럼 정의
  const profitColumns = [
    { label: "기간", key: "month" },
    { label: "매출", key: "revenue" },
    { label: "비용", key: "totalExpense" },
    { label: "순이익", key: "profit" },
    { label: "이익률", key: "profitMargin" },
  ];

  // 테이블 행 렌더링 함수 (매출 탭)
  const renderRevenueRow = (data, index) => (
    <div className="grid grid-cols-4 gap-4 py-3 items-center px-2">
      <div className="text-center">
        {data.month.substring(0, 4)}년 {data.month.substring(5, 7)}월
      </div>
      <div className="text-center">{data.revenue.toLocaleString()}원</div>
      <div className="text-center">{data.patients.toLocaleString()}명</div>
      <div className="text-center">{data.average.toLocaleString()}원</div>
    </div>
  );

  // 테이블 행 렌더링 함수 (비용 탭)
  const renderExpenseRow = (data, index) => (
    <div className="grid grid-cols-6 gap-4 py-3 items-center px-2">
      <div className="text-center">
        {data.month.substring(0, 4)}년 {data.month.substring(5, 7)}월
      </div>
      <div className="text-center">{data.fixedCost.toLocaleString()}원</div>
      <div className="text-center">{data.laborCost.toLocaleString()}원</div>
      <div className="text-center">
        {data.medicalSupplies.toLocaleString()}원
      </div>
      <div className="text-center">{data.otherExpenses.toLocaleString()}원</div>
      <div className="text-center">{data.totalExpense.toLocaleString()}원</div>
    </div>
  );

  // 테이블 행 렌더링 함수 (수익성 탭)
  const renderProfitRow = (data, index) => (
    <div className="grid grid-cols-5 gap-4 py-3 items-center px-2">
      <div className="text-center">
        {data.month.substring(0, 4)}년 {data.month.substring(5, 7)}월
      </div>
      <div className="text-center">{data.revenue.toLocaleString()}원</div>
      <div className="text-center">{data.totalExpense.toLocaleString()}원</div>
      <div className="text-center">{data.profit.toLocaleString()}원</div>
      <div className="text-center">{data.profitMargin}%</div>
    </div>
  );

  // 현재 활성화된 탭에 따라 컬럼 및 렌더링 함수 선택
  const getActiveColumns = () => {
    switch (activeTab) {
      case "expense":
        return expenseColumns;
      case "profit":
        return profitColumns;
      default:
        return revenueColumns;
    }
  };

  const getActiveRenderRow = () => {
    switch (activeTab) {
      case "expense":
        return renderExpenseRow;
      case "profit":
        return renderProfitRow;
      default:
        return renderRevenueRow;
    }
  };

  const getActiveColumnWidth = () => {
    switch (activeTab) {
      case "expense":
        return "grid-cols-6";
      case "profit":
        return "grid-cols-5";
      default:
        return "grid-cols-4";
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-md w-[900px] max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">병원 재정 분석</h2>
          <button onClick={() => setIsVisible(false)} className="text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* 탭 버튼 */}
        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "revenue"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("revenue")}
          >
            매출 분석
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "expense"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("expense")}
          >
            비용 분석
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "profit"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("profit")}
          >
            수익성 분석
          </button>
        </div>

        <div className="mb-6">
          <JcyTable
            columns={getActiveColumns()}
            columnWidths={getActiveColumnWidth()}
            data={data}
            rowClassName={(index) =>
              index % 2 === 0 ? "bg-gray-100" : "bg-white"
            }
            renderRow={getActiveRenderRow()}
            itemsPerPage={6}
            emptyRowHeight="60px"
          />
        </div>

        {/* 차트 영역 - 활성화된 탭에 따라 다른 차트 표시 */}
        <div className="mt-6">
          {activeTab === "revenue" && (
            <>
              <h3 className="text-xl font-semibold mb-4">
                월별 환자수 vs 매출
              </h3>
              <div className="h-[300px] w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={data.slice(-6)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis
                      yAxisId="left"
                      label={{
                        value: "매출(백만원)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      label={{
                        value: "환자 수",
                        angle: -90,
                        position: "insideRight",
                      }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="revenueInMillions"
                      name="매출(백만원)"
                      fill="#8884d8"
                      barSize={20}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="patients"
                      name="환자 수"
                      stroke="#ff7300"
                      strokeWidth={2}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {activeTab === "expense" && (
            <>
              <h3 className="text-xl font-semibold mb-4">비용 구성 분석</h3>
              <div className="h-[300px] w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={data.slice(-6)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis
                      label={{
                        value: "비용(백만원)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="fixedCostInMillions"
                      name="고정비"
                      stackId="a"
                      fill="#8884d8"
                    />
                    <Bar
                      dataKey="laborCostInMillions"
                      name="인건비"
                      stackId="a"
                      fill="#82ca9d"
                    />
                    <Bar
                      dataKey="medicalSuppliesInMillions"
                      name="의료소모품"
                      stackId="a"
                      fill="#ffc658"
                    />
                    <Bar
                      dataKey="otherExpensesInMillions"
                      name="기타"
                      stackId="a"
                      fill="#ff8042"
                    />
                    <Line
                      type="monotone"
                      dataKey="revenueInMillions"
                      name="매출"
                      stroke="#ff0000"
                      strokeWidth={2}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <h3 className="text-xl font-semibold mb-4">비용 항목별 비중</h3>
              <div className="h-[300px] w-full flex">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseCompositionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expenseCompositionData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.slice(-6)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis
                        label={{
                          value: "비용 비율(%)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey={(entry) =>
                          Math.round(
                            (entry.laborCost / entry.totalExpense) * 100
                          )
                        }
                        name="인건비 비율"
                        fill="#82ca9d"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {activeTab === "profit" && (
            <>
              <h3 className="text-xl font-semibold mb-4">
                수익 및 이익률 추이
              </h3>
              <div className="h-[300px] w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis
                      yAxisId="left"
                      label={{
                        value: "금액(백만원)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 50]}
                      label={{
                        value: "이익률(%)",
                        angle: -90,
                        position: "insideRight",
                      }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="revenueInMillions"
                      name="매출"
                      fill="#8884d8"
                      opacity={0.6}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="totalExpenseInMillions"
                      name="비용"
                      fill="#FF8042"
                      opacity={0.6}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="profitInMillions"
                      name="순이익"
                      fill="#82ca9d"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="profitMargin"
                      name="이익률(%)"
                      stroke="#ff0000"
                      strokeWidth={2}
                    />
                    <ReferenceLine
                      yAxisId="right"
                      y={20}
                      stroke="red"
                      strokeDasharray="3 3"
                      label="목표 이익률"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <h3 className="text-xl font-semibold mb-4">
                매출 대비 비용 구성
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.slice(-12).reverse()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="profitInMillions"
                      name="순이익"
                      stackId="a"
                      fill="#82ca9d"
                    />
                    <Bar
                      dataKey="totalExpenseInMillions"
                      name="총비용"
                      stackId="a"
                      fill="#8884d8"
                    />
                    <ReferenceLine y={0} stroke="#000" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsVisible(false)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md mr-2"
          >
            닫기
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
            onClick={() => {
              // 엑셀 다운로드 등 추가 기능 구현 가능
              alert("데이터 내보내기 기능은 준비 중입니다.");
            }}
          >
            데이터 내보내기
          </button>
        </div>
      </div>
    </div>
  );
};

// 매출 현황 컴포넌트
const RevenueManagement = () => {
  const [revenueData, setRevenueData] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalRevenue: 0,
    monthlyAverage: 0,
    currentMonth: 0,
    previousMonth: 0,
    growthRate: 0,
  });
  const [selectedPeriod, setSelectedPeriod] = useState("month"); // month, quarter, year
  const [isLoading, setIsLoading] = useState(true);
  const [activeChartType, setActiveChartType] = useState("profit"); // bar, line, composite, area, pie, expense, profit
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState("all"); // 연도별 필터링을 위한 상태

  // 가상의 월별 매출 데이터 (확장된 형태)
  const monthlyRevenueData = [
    {
      month: "2023-01",
      revenue: 48500000,
      patients: 320,
      average: 151563,
      newPatients: 78,
      returnPatients: 242,
      morningPatients: 192,
      afternoonPatients: 128,
      fixedCost: 12500000,
      laborCost: 22800000,
      medicalSupplies: 5600000,
      otherExpenses: 1200000,
      totalExpense: 42100000,
      profit: 6400000,
    },
    {
      month: "2023-02",
      revenue: 52300000,
      patients: 345,
      average: 151594,
      newPatients: 85,
      returnPatients: 260,
      morningPatients: 207,
      afternoonPatients: 138,
      fixedCost: 12500000,
      laborCost: 23100000,
      medicalSupplies: 6100000,
      otherExpenses: 1300000,
      totalExpense: 43000000,
      profit: 9300000,
    },
    {
      month: "2023-03",
      revenue: 55100000,
      patients: 367,
      average: 150136,
      newPatients: 92,
      returnPatients: 275,
      morningPatients: 220,
      afternoonPatients: 147,
      fixedCost: 12500000,
      laborCost: 23400000,
      medicalSupplies: 6300000,
      otherExpenses: 1400000,
      totalExpense: 43600000,
      profit: 11500000,
    },
    {
      month: "2023-04",
      revenue: 53800000,
      patients: 355,
      average: 151549,
      newPatients: 88,
      returnPatients: 267,
      morningPatients: 213,
      afternoonPatients: 142,
      fixedCost: 12500000,
      laborCost: 23200000,
      medicalSupplies: 6200000,
      otherExpenses: 1350000,
      totalExpense: 43250000,
      profit: 10550000,
    },
    {
      month: "2023-05",
      revenue: 58200000,
      patients: 388,
      average: 150000,
      newPatients: 95,
      returnPatients: 293,
      morningPatients: 233,
      afternoonPatients: 155,
      fixedCost: 12500000,
      laborCost: 23800000,
      medicalSupplies: 6700000,
      otherExpenses: 1450000,
      totalExpense: 44450000,
      profit: 13750000,
    },
    {
      month: "2023-06",
      revenue: 62100000,
      patients: 412,
      average: 150728,
      newPatients: 102,
      returnPatients: 310,
      morningPatients: 247,
      afternoonPatients: 165,
      fixedCost: 12500000,
      laborCost: 24100000,
      medicalSupplies: 7200000,
      otherExpenses: 1550000,
      totalExpense: 45350000,
      profit: 16750000,
    },
    {
      month: "2023-07",
      revenue: 57400000,
      patients: 380,
      average: 151053,
      newPatients: 93,
      returnPatients: 287,
      morningPatients: 228,
      afternoonPatients: 152,
      fixedCost: 12700000,
      laborCost: 23900000,
      medicalSupplies: 6600000,
      otherExpenses: 1400000,
      totalExpense: 44600000,
      profit: 12800000,
    },
    {
      month: "2023-08",
      revenue: 59800000,
      patients: 398,
      average: 150251,
      newPatients: 98,
      returnPatients: 300,
      morningPatients: 239,
      afternoonPatients: 159,
      fixedCost: 12700000,
      laborCost: 24000000,
      medicalSupplies: 6900000,
      otherExpenses: 1500000,
      totalExpense: 45100000,
      profit: 14700000,
    },
    {
      month: "2023-09",
      revenue: 63500000,
      patients: 425,
      average: 149412,
      newPatients: 105,
      returnPatients: 320,
      morningPatients: 255,
      afternoonPatients: 170,
      fixedCost: 12700000,
      laborCost: 24300000,
      medicalSupplies: 7400000,
      otherExpenses: 1600000,
      totalExpense: 46000000,
      profit: 17500000,
    },
    {
      month: "2023-10",
      revenue: 67200000,
      patients: 440,
      average: 152727,
      newPatients: 108,
      returnPatients: 332,
      morningPatients: 264,
      afternoonPatients: 176,
      fixedCost: 12700000,
      laborCost: 24600000,
      medicalSupplies: 7800000,
      otherExpenses: 1700000,
      totalExpense: 46800000,
      profit: 20400000,
    },
    {
      month: "2023-11",
      revenue: 71500000,
      patients: 470,
      average: 152128,
      newPatients: 115,
      returnPatients: 355,
      morningPatients: 282,
      afternoonPatients: 188,
      fixedCost: 12700000,
      laborCost: 25000000,
      medicalSupplies: 8300000,
      otherExpenses: 1800000,
      totalExpense: 47800000,
      profit: 23700000,
    },
    {
      month: "2023-12",
      revenue: 69700000,
      patients: 460,
      average: 151522,
      newPatients: 112,
      returnPatients: 348,
      morningPatients: 276,
      afternoonPatients: 184,
      fixedCost: 12700000,
      laborCost: 26000000,
      medicalSupplies: 8100000,
      otherExpenses: 2100000,
      totalExpense: 48900000,
      profit: 20800000,
    },
    {
      month: "2024-01",
      revenue: 73200000,
      patients: 480,
      average: 152500,
      newPatients: 118,
      returnPatients: 362,
      morningPatients: 288,
      afternoonPatients: 192,
      fixedCost: 13100000,
      laborCost: 25300000,
      medicalSupplies: 8500000,
      otherExpenses: 1700000,
      totalExpense: 48600000,
      profit: 24600000,
    },
    {
      month: "2024-02",
      revenue: 76500000,
      patients: 510,
      average: 150000,
      newPatients: 125,
      returnPatients: 385,
      morningPatients: 306,
      afternoonPatients: 204,
      fixedCost: 13100000,
      laborCost: 25600000,
      medicalSupplies: 8900000,
      otherExpenses: 1800000,
      totalExpense: 49400000,
      profit: 27100000,
    },
    {
      month: "2024-03",
      revenue: 78900000,
      patients: 520,
      average: 151731,
      newPatients: 127,
      returnPatients: 393,
      morningPatients: 312,
      afternoonPatients: 208,
      fixedCost: 13100000,
      laborCost: 25800000,
      medicalSupplies: 9200000,
      otherExpenses: 1850000,
      totalExpense: 49950000,
      profit: 28950000,
    },
    {
      month: "2024-04",
      revenue: 82100000,
      patients: 540,
      average: 152037,
      newPatients: 132,
      returnPatients: 408,
      morningPatients: 324,
      afternoonPatients: 216,
      fixedCost: 13100000,
      laborCost: 26200000,
      medicalSupplies: 9600000,
      otherExpenses: 1900000,
      totalExpense: 50800000,
      profit: 31300000,
    },
    {
      month: "2024-05",
      revenue: 85400000,
      patients: 560,
      average: 152500,
      newPatients: 137,
      returnPatients: 423,
      morningPatients: 336,
      afternoonPatients: 224,
      fixedCost: 13100000,
      laborCost: 26500000,
      medicalSupplies: 10000000,
      otherExpenses: 2000000,
      totalExpense: 51600000,
      profit: 33800000,
    },
  ];

  // 부서별 매출 데이터 (파이 차트용)
  const departmentRevenueData = [
    { name: "물리치료", value: 38 },
    { name: "진료", value: 25 },
    { name: "영상의학", value: 22 },
    { name: "기타", value: 15 },
  ];

  // 초기 데이터 생성
  const formatData = (rawData) => {
    return rawData.map((item) => ({
      ...item,
      name: `${item.month.substring(5, 7)}월`,
      revenueInMillions: item.revenue / 1000000, // 백만 단위로 변환
      patientRatio: Math.round((item.newPatients / item.patients) * 100), // 신환 비율
      fixedCostInMillions: item.fixedCost / 1000000, // 백만 단위 고정비
      laborCostInMillions: item.laborCost / 1000000, // 백만 단위 인건비
      medicalSuppliesInMillions: item.medicalSupplies / 1000000, // 백만 단위 의료소모품
      otherExpensesInMillions: item.otherExpenses / 1000000, // 백만 단위 기타비용
      totalExpenseInMillions: item.totalExpense / 1000000, // 백만 단위 총 비용
      profitInMillions: item.profit / 1000000, // 백만 단위 이익
      profitMargin: Math.round((item.profit / item.revenue) * 100), // 이익률(%)
    }));
  };

  // 컴포넌트 마운트 시 즉시 초기 데이터 설정
  const initialFormattedData = formatData(monthlyRevenueData);

  useEffect(() => {
    // 초기 상태 설정 (로딩 표시 없이 바로 데이터 보여주기)
    if (revenueData.length === 0) {
      setRevenueData(initialFormattedData);

      // 요약 데이터 계산
      const last = monthlyRevenueData[monthlyRevenueData.length - 1];
      const previousMonth = monthlyRevenueData[monthlyRevenueData.length - 2];
      const totalRevenue = monthlyRevenueData.reduce(
        (sum, item) => sum + item.revenue,
        0
      );
      const monthlyAverage = totalRevenue / monthlyRevenueData.length;
      const growthRate =
        ((last.revenue - previousMonth.revenue) / previousMonth.revenue) * 100;

      setSummaryData({
        totalRevenue,
        monthlyAverage,
        currentMonth: last.revenue,
        previousMonth: previousMonth.revenue,
        growthRate,
      });

      setIsLoading(false);
    }
  }, []);

  // 기간 변경 시 데이터 필터링
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  // 차트 타입 변경 핸들러
  const handleChartTypeChange = (type) => {
    setActiveChartType(type);
  };

  // 연도 변경 핸들러
  const handleYearChange = (year) => {
    setSelectedYear(year);
  };

  // 차트 데이터 포매팅 함수
  const getFilteredData = () => {
    // 선택된 기간에 따라 데이터 필터링
    let filteredData = [...revenueData];

    // 연도별 필터링
    if (selectedYear !== "all") {
      filteredData = filteredData.filter((item) =>
        item.month.startsWith(selectedYear)
      );
    }

    // 기간에 따라 필터링
    if (selectedPeriod === "month") {
      filteredData = filteredData.slice(-6); // 최근 6개월
    } else if (selectedPeriod === "quarter") {
      filteredData = filteredData.slice(-12); // 최근 12개월 (4분기)
    }

    return filteredData;
  };

  const filteredData = getFilteredData();

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-md shadow-md">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center mt-2">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              />
              <p className="text-sm">
                {entry.name === "revenueInMillions"
                  ? "매출: "
                  : entry.name === "patients"
                  ? "환자 수: "
                  : entry.name === "newPatients"
                  ? "신환: "
                  : entry.name === "returnPatients"
                  ? "재진: "
                  : entry.name === "patientRatio"
                  ? "신환 비율: "
                  : entry.name === "average"
                  ? "평균 매출: "
                  : entry.name === "fixedCostInMillions"
                  ? "고정비: "
                  : entry.name === "laborCostInMillions"
                  ? "인건비: "
                  : entry.name === "medicalSuppliesInMillions"
                  ? "의료소모품: "
                  : entry.name === "otherExpensesInMillions"
                  ? "기타 비용: "
                  : entry.name === "totalExpenseInMillions"
                  ? "총 비용: "
                  : entry.name === "profitInMillions"
                  ? "순이익: "
                  : entry.name === "profitMargin"
                  ? "이익률: "
                  : entry.name}
                <span className="font-semibold ml-1">
                  {entry.name === "revenueInMillions" ||
                  entry.name === "fixedCostInMillions" ||
                  entry.name === "laborCostInMillions" ||
                  entry.name === "medicalSuppliesInMillions" ||
                  entry.name === "otherExpensesInMillions" ||
                  entry.name === "totalExpenseInMillions" ||
                  entry.name === "profitInMillions"
                    ? `${entry.value.toLocaleString()}백만원`
                    : entry.name === "patients" ||
                      entry.name === "newPatients" ||
                      entry.name === "returnPatients"
                    ? `${entry.value}명`
                    : entry.name === "patientRatio" ||
                      entry.name === "profitMargin"
                    ? `${entry.value}%`
                    : `${entry.value.toLocaleString()}원`}
                </span>
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // 차트 색상 설정
  const COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff8042",
    "#0088FE",
    "#00C49F",
  ];

  // 차트 영역 렌더링 함수
  const renderChart = () => {
    if (isLoading || revenueData.length === 0) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    // 차트 타입에 따른 렌더링
    switch (activeChartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                yAxisId="left"
                label={{
                  value: "매출(백만원)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="revenueInMillions"
                name="매출(백만원)"
                fill="#8884d8"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                yAxisId="left"
                label={{
                  value: "매출(백만원)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenueInMillions"
                name="매출(백만원)"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              <ReferenceLine
                yAxisId="left"
                y={summaryData.monthlyAverage / 1000000}
                stroke="red"
                label={
                  <span style={{ backgroundColor: "white", padding: "0 4px" }}>
                    평균
                  </span>
                }
                strokeDasharray="3 3"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "composite":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={filteredData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                yAxisId="left"
                label={{
                  value: "매출(백만원)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{
                  value: "환자 수",
                  angle: -90,
                  position: "insideRight",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="revenueInMillions"
                name="매출(백만원)"
                fill="#8884d8"
                barSize={30}
                radius={[5, 5, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="patients"
                name="환자 수"
                stroke="#ff7300"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={filteredData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="newPatients"
                name="신환"
                fill="#8884d8"
                stroke="#8884d8"
                stackId="patients"
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="returnPatients"
                name="재진"
                fill="#82ca9d"
                stroke="#82ca9d"
                stackId="patients"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="patientRatio"
                name="신환 비율(%)"
                stroke="#ff7300"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <div className="flex flex-col h-full items-center justify-center">
            <h3 className="text-lg font-semibold mb-2">
              진료 부서별 매출 비중
            </h3>
            <div className="flex flex-row w-full h-[80%]">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentRevenueData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {departmentRevenueData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredData.slice(-3)}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 70, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      label={{
                        value: "최근 3개월",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="morningPatients"
                      name="오전"
                      stackId="a"
                      fill="#8884d8"
                    />
                    <Bar
                      dataKey="afternoonPatients"
                      name="오후"
                      stackId="a"
                      fill="#82ca9d"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      case "expense":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={filteredData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                yAxisId="left"
                label={{
                  value: "금액(백만원)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="fixedCostInMillions"
                name="고정비"
                stackId="a"
                fill="#8884d8"
              />
              <Bar
                yAxisId="left"
                dataKey="laborCostInMillions"
                name="인건비"
                stackId="a"
                fill="#82ca9d"
              />
              <Bar
                yAxisId="left"
                dataKey="medicalSuppliesInMillions"
                name="의료소모품"
                stackId="a"
                fill="#ffc658"
              />
              <Bar
                yAxisId="left"
                dataKey="otherExpensesInMillions"
                name="기타"
                stackId="a"
                fill="#ff8042"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenueInMillions"
                name="매출"
                stroke="#ff0000"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case "profit":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={filteredData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                yAxisId="left"
                label={{
                  value: "금액(백만원)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 50]}
                label={{
                  value: "이익률(%)",
                  angle: -90,
                  position: "insideRight",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="revenueInMillions"
                name="매출"
                fill="#8884d8"
                opacity={0.6}
              />
              <Bar
                yAxisId="left"
                dataKey="totalExpenseInMillions"
                name="비용"
                fill="#FF8042"
                opacity={0.6}
              />
              <Bar
                yAxisId="left"
                dataKey="profitInMillions"
                name="순이익"
                fill="#82ca9d"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="profitMargin"
                name="이익률(%)"
                stroke="#ff0000"
                strokeWidth={2}
              />
              <ReferenceLine
                yAxisId="right"
                y={20}
                stroke="red"
                strokeDasharray="3 3"
                label="목표 이익률"
              />
            </ComposedChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                yAxisId="left"
                label={{
                  value: "매출(백만원)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="revenueInMillions"
                name="매출(백만원)"
                fill="#8884d8"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="flex flex-col w-full bg-white h-full p-5 overflow-y-auto">
      {/* 요약 정보 카드 */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-300">
          <h3 className="text-sm text-blue-800 mb-1">총 매출</h3>
          <p className="text-2xl font-bold">
            {summaryData.totalRevenue.toLocaleString()}원
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-300">
          <h3 className="text-sm text-green-800 mb-1">월 평균 매출</h3>
          <p className="text-2xl font-bold">
            {Math.round(summaryData.monthlyAverage).toLocaleString()}원
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-300">
          <h3 className="text-sm text-purple-800 mb-1">이번 달 매출</h3>
          <p className="text-2xl font-bold">
            {summaryData.currentMonth.toLocaleString()}원
          </p>
        </div>
        <div
          className={`p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-300 ${
            summaryData.growthRate >= 0 ? "bg-emerald-50" : "bg-red-50"
          }`}
        >
          <h3
            className={`text-sm mb-1 ${
              summaryData.growthRate >= 0 ? "text-emerald-800" : "text-red-800"
            }`}
          >
            전월 대비 성장률
          </h3>
          <p
            className={`text-2xl font-bold ${
              summaryData.growthRate >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {summaryData.growthRate.toFixed(1)}%
            {summaryData.growthRate >= 0 ? "↑" : "↓"}
          </p>
        </div>
      </div>

      {/* 기간 선택 및 차트 타입 선택 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-xl font-bold">매출 추이</div>
        <div className="flex space-x-4">
          {/* 연도 선택 버튼 */}
          <div className="flex space-x-2 border-r pr-4 border-gray-300">
            <button
              onClick={() => handleYearChange("all")}
              className={`px-3 py-1 rounded-md ${
                selectedYear === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              전체
            </button>
            <button
              onClick={() => handleYearChange("2023")}
              className={`px-3 py-1 rounded-md ${
                selectedYear === "2023"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              2023년
            </button>
            <button
              onClick={() => handleYearChange("2024")}
              className={`px-3 py-1 rounded-md ${
                selectedYear === "2024"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              2024년
            </button>
          </div>
          {/* 기간 선택 버튼 */}
          {/* <div className="flex space-x-2">
            <button
              onClick={() => handlePeriodChange("month")}
              className={`px-4 py-2 rounded-md ${
                selectedPeriod === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              최근 6개월
            </button>
            <button
              onClick={() => handlePeriodChange("quarter")}
              className={`px-4 py-2 rounded-md ${
                selectedPeriod === "quarter"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              최근 12개월
            </button>
            <button
              onClick={() => handlePeriodChange("year")}
              className={`px-4 py-2 rounded-md ${
                selectedPeriod === "year"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              전체 기간
            </button>
          </div> */}

          {/* 차트 타입 선택 */}
          <div className="flex space-x-2 border-l pl-4 border-gray-300">
            <button
              onClick={() => handleChartTypeChange("profit")}
              className={`px-3 py-1 rounded-md ${
                activeChartType === "profit"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              수익성
            </button>
            <button
              onClick={() => handleChartTypeChange("pie")}
              className={`px-3 py-1 rounded-md ${
                activeChartType === "pie"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              부서별
            </button>
            {/* <button
              onClick={() => handleChartTypeChange("bar")}
              className={`px-3 py-1 rounded-md ${
                activeChartType === "bar"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              막대
            </button>
            <button
              onClick={() => handleChartTypeChange("line")}
              className={`px-3 py-1 rounded-md ${
                activeChartType === "line"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              선형
            </button> */}
            <button
              onClick={() => handleChartTypeChange("composite")}
              className={`px-3 py-1 rounded-md ${
                activeChartType === "composite"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              복합
            </button>
            <button
              onClick={() => handleChartTypeChange("area")}
              className={`px-3 py-1 rounded-md ${
                activeChartType === "area"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              영역
            </button>
            <button
              onClick={() => handleChartTypeChange("expense")}
              className={`px-3 py-1 rounded-md ${
                activeChartType === "expense"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              비용
            </button>
          </div>
        </div>
      </div>

      {/* Recharts 차트 영역 */}
      <div className="w-full bg-white rounded-lg p-4 mb-8 h-[400px] shadow border border-gray-100">
        {renderChart()}
      </div>

      {/* 매출 데이터 요약 보기 버튼 */}
      <div className="flex justify-center">
        <button
          onClick={() => setIsDetailModalVisible(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors duration-300 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
              clipRule="evenodd"
            />
          </svg>
          매출 상세 내역 보기
        </button>
      </div>

      {/* 매출 상세 내역 모달 */}
      <RevenueDetailModal
        isVisible={isDetailModalVisible}
        setIsVisible={setIsDetailModalVisible}
        data={revenueData}
      />
    </div>
  );
};

export default function ManagementModal({ isVisible, setIsVisible }) {
  const { userLevelData } = useUserLevel();
  const [viewMode, setViewMode] = useState("staff");

  return (
    <ModalTemplate
      isVisible={isVisible}
      setIsVisible={setIsVisible}
      showCancel={false}
      modalClassName="rounded-xl"
    >
      <div className="flex flex-col items-center w-[90vw] h-[85vh] bg-white px-[40px] py-[30px]">
        <ModalHeaderZone className="flex flex-row w-full justify-between h-[50px] items-center">
          <div className="flex flex-row items-center">
            <span className="text-[34px] font-bold">병원 현황</span>
            {/* 모드 전환 토글 */}
            <ToggleContainer className={"ml-6"}>
              <ToggleSlider
                position={viewMode === "staff" ? "left" : "right"}
              />
              <ToggleOption
                active={viewMode === "staff"}
                onClick={() => setViewMode("staff")}
              >
                <ToggleIcon>👨‍⚕️</ToggleIcon>
                인력 현황
              </ToggleOption>
              <ToggleOption
                active={viewMode === "revenue"}
                onClick={() => setViewMode("revenue")}
              >
                <ToggleIcon>💰</ToggleIcon>
                매출 현황
              </ToggleOption>
            </ToggleContainer>
          </div>
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
        <ContentZone className="w-full flex-grow overflow-auto mt-[20px]">
          {viewMode === "staff" ? <StaffManagement /> : <RevenueManagement />}
        </ContentZone>
      </div>
    </ModalTemplate>
  );
}
