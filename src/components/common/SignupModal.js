import React, { useState, useEffect } from "react";
import { registerUser } from "../../utils/UserAuth";
import { format } from "date-fns";

// FormField 컴포넌트를 함수 외부로 분리
const FormField = ({ label, required, children, className = "" }) => (
  <div className={`flex items-center ${className}`}>
    <label className="w-24 text-sm font-semibold text-gray-800 shrink-0">
      {label}:{required && <span className="text-red-500">*</span>}
    </label>
    <div className="flex-1">{children}</div>
  </div>
);

function SignupModal({ isOpen, onClose }) {
  // 단일 formData 객체 대신 개별 상태로 관리
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [idNumberFront, setIdNumberFront] = useState("");
  const [idNumberBack, setIdNumberBack] = useState("");
  const [phoneFirst, setPhoneFirst] = useState("010");
  const [phoneMiddle, setPhoneMiddle] = useState("");
  const [phoneLast, setPhoneLast] = useState("");
  const [department, setDepartment] = useState("");
  const [address, setAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [hireDate, setHireDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  // 필수 필드가 모두 입력되었는지 확인하는 상태 추가
  const [isFormValid, setIsFormValid] = useState(false);

  // 모든 입력 필드 초기화 함수
  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setIdNumberFront("");
    setIdNumberBack("");
    setPhoneFirst("010");
    setPhoneMiddle("");
    setPhoneLast("");
    setDepartment("");
    setAddress("");
    setBankName("");
    setAccountNumber("");
    setHireDate(format(new Date(), "yyyy-MM-dd"));
    setIsFormValid(false);
    setError("");
  };

  // 모달 닫기 핸들러
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 필수 필드 검증 함수
  const checkFormValidity = () => {
    const isValid =
      email &&
      email.includes("@") &&
      password &&
      password === confirmPassword &&
      name &&
      idNumberFront &&
      idNumberBack &&
      phoneMiddle &&
      phoneLast &&
      department &&
      address &&
      bankName &&
      accountNumber;

    setIsFormValid(isValid);
    return isValid;
  };

  // 각 입력 필드가 변경될 때마다 폼 유효성 검사
  useEffect(() => {
    checkFormValidity();
  }, [
    email,
    password,
    confirmPassword,
    name,
    idNumberFront,
    idNumberBack,
    phoneMiddle,
    phoneLast,
    department,
    address,
    bankName,
    accountNumber,
    hireDate,
  ]);

  // ItemRegistrationZone 스타일의 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;

    // 각 필드별 상태 업데이트
    switch (name) {
      case "email":
        setEmail(value);
        break;
      case "password":
        setPassword(value);
        break;
      case "confirmPassword":
        setConfirmPassword(value);
        break;
      case "name":
        setName(value);
        break;
      case "idNumberFront":
        setIdNumberFront(value);
        break;
      case "idNumberBack":
        setIdNumberBack(value);
        break;
      case "phoneFirst":
        setPhoneFirst(value);
        break;
      case "phoneMiddle":
        setPhoneMiddle(value);
        break;
      case "phoneLast":
        setPhoneLast(value);
        break;
      case "address":
        setAddress(value);
        break;
      case "bankName":
        setBankName(value);
        break;
      case "accountNumber":
        setAccountNumber(value);
        break;
      case "hireDate":
        setHireDate(value);
        break;
      default:
        break;
    }
  };

  const handleDepartmentSelect = (dept) => {
    setDepartment(dept);
    // 부서 선택 후 폼 유효성 다시 검사
    setTimeout(() => checkFormValidity(), 0);
  };

  const validateForm = () => {
    const isValid = checkFormValidity();
    if (!isValid) {
      if (!email || !email.includes("@")) {
        setError("유효한 이메일을 입력해주세요");
      } else if (!password) {
        setError("비밀번호를 입력해주세요");
      } else if (password !== confirmPassword) {
        setError("비밀번호가 일치하지 않습니다");
      } else if (!name) {
        setError("이름을 입력해주세요");
      } else if (!idNumberFront || !idNumberBack) {
        setError("주민번호를 입력해주세요");
      } else if (!phoneMiddle || !phoneLast) {
        setError("연락처를 입력해주세요");
      } else if (!department) {
        setError("부서를 선택해주세요");
      } else if (!address) {
        setError("주소를 입력해주세요");
      } else if (!bankName || !accountNumber) {
        setError("급여계좌 정보를 입력해주세요");
      }
    }
    return isValid;
  };

  // 이름과 생년월일로 사용자 ID 생성
  const generateUserId = () => {
    // 주민번호 앞자리 6자리는 생년월일(YYMMDD)
    const birthDate = idNumberFront;
    return `${name}_${birthDate}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      // 사용자 ID 생성
      const userId = generateUserId();
      console.log("생성된 사용자 ID:", userId);

      // 회원가입에 필요한 추가 정보 구성
      const additionalData = {
        userId,
        idNumber: `${idNumberFront}-${idNumberBack}`,
        phoneNumber: `${phoneFirst}-${phoneMiddle}-${phoneLast}`,
        department,
        address: address || "",
        bankInfo: {
          bankName: bankName || "",
          accountNumber: accountNumber || "",
        },
        role: "팀원", // 기본 역할 설정
        // 사용자 휴가 정보 초기화
        usedVacationDays: 0,
      };

      // 입사일을 전달하도록 변경
      const result = await registerUser(
        email,
        password,
        name,
        hireDate,
        null,
        additionalData
      );

      if (result.success) {
        alert("회원가입이 완료되었습니다. 로그인해주세요.");
        resetForm(); // 성공 시에도 폼 초기화
        onClose();
      } else {
        // 서버에서 반환한 구체적인 오류 메시지 표시
        setError(result.message || "회원가입 중 오류가 발생했습니다.");
        console.error("회원가입 실패:", result.message);
      }
    } catch (error) {
      console.error("회원가입 오류:", error);
      // 오류 메시지를 더 구체적으로 표시
      if (error.message) {
        setError(`회원가입 중 오류가 발생했습니다: ${error.message}`);
      } else {
        setError(
          "회원가입 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 중요: 모달이 열려있지 않으면 렌더링하지 않음
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-md w-full max-w-[800px] p-6 max-h-[90vh] overflow-y-auto">
        {/* 헤더 영역 */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[34px] font-bold">회원가입</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ID/Email */}
          <FormField label="ID/Email" required={true}>
            <input
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              placeholder="danielpark@shopthetrip.world"
              className="w-full border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
            />
          </FormField>

          {/* 비밀번호와 재확인을 같은 행에 배치 */}
          <div className="flex flex-row space-x-4">
            <FormField label="비밀번호" required={true} className="flex-1">
              <input
                type="password"
                name="password"
                value={password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
              />
            </FormField>
            <FormField label="재확인" required={true} className="flex-1">
              <input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleChange}
                placeholder="Password"
                className="w-full border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
              />
            </FormField>
          </div>

          {/* 이름과 주민번호를 같은 행에 배치 */}
          <div className="flex flex-row space-x-4">
            <FormField label="이름" required={true} className="flex-1">
              <input
                type="text"
                name="name"
                value={name}
                onChange={handleChange}
                placeholder="이름"
                className="w-full border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
              />
            </FormField>
            <FormField label="주민번호" required={true} className="flex-1">
              <div className="flex items-center">
                <input
                  type="text"
                  name="idNumberFront"
                  value={idNumberFront}
                  onChange={handleChange}
                  placeholder="123456"
                  maxLength={6}
                  className="w-[120px] border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
                />
                <span className="mx-2 text-lg">-</span>
                <input
                  type="text"
                  name="idNumberBack"
                  value={idNumberBack}
                  onChange={handleChange}
                  placeholder="1234567"
                  maxLength={7}
                  className="w-[120px] border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
                />
              </div>
            </FormField>
          </div>

          {/* 연락처 */}
          <FormField label="연락처" required={true}>
            <div className="flex items-center">
              <input
                type="text"
                name="phoneFirst"
                value={phoneFirst}
                onChange={handleChange}
                placeholder="010"
                maxLength={3}
                className="w-[80px] border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
              />
              <span className="mx-2">-</span>
              <input
                type="text"
                name="phoneMiddle"
                value={phoneMiddle}
                onChange={handleChange}
                placeholder="1234"
                maxLength={4}
                className="w-[100px] border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
              />
              <span className="mx-2">-</span>
              <input
                type="text"
                name="phoneLast"
                value={phoneLast}
                onChange={handleChange}
                placeholder="0317"
                maxLength={4}
                className="w-[100px] border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
              />
            </div>
          </FormField>

          {/* 부서 */}
          <FormField label="부서" required={true}>
            <div className="flex space-x-2">
              {[
                "원장팀",
                "간호팀",
                "물리치료팀",
                "원무팀",
                "영상의학팀",
                "경영지원팀",
              ].map((dept) => (
                <button
                  type="button"
                  key={dept}
                  onClick={() => handleDepartmentSelect(dept)}
                  className={`px-4 py-2 border rounded-md ${
                    department === dept
                      ? "bg-onceBlue text-white border-onceBlue"
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </FormField>

          {/* 주소 */}
          <FormField label="주소" required={true}>
            <input
              type="text"
              name="address"
              value={address}
              onChange={handleChange}
              placeholder="경기 오산시 죽담안로 38-15 금영프라자 3, 4층"
              className="w-full border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
            />
          </FormField>

          {/* 급여계좌 */}
          <FormField label="급여계좌" required={true}>
            <div className="flex space-x-2 w-full">
              <input
                type="text"
                name="bankName"
                value={bankName}
                onChange={handleChange}
                placeholder="은행"
                className="w-[150px] border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
              />
              <input
                type="text"
                name="accountNumber"
                value={accountNumber}
                onChange={handleChange}
                placeholder="계좌번호"
                className="flex-1 border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
              />
            </div>
          </FormField>

          {/* 입사일 필드 추가 */}
          <FormField label="입사일" required={true}>
            <input
              type="date"
              name="hireDate"
              value={hireDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </FormField>

          {/* 에러 메시지 */}
          {error && (
            <div className="text-red-500 text-center text-sm mt-2">{error}</div>
          )}

          {/* 회원가입 버튼 */}
          <div className="pt-4 mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-[48px] border border-[#002855] py-3 rounded-md font-medium transition-colors ${
                isFormValid
                  ? "bg-[#002855] text-white hover:bg-[#001e42]"
                  : "text-[#002855] hover:bg-gray-50"
              } disabled:opacity-50`}
            >
              {isLoading ? "처리 중..." : "회원가입"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignupModal;
