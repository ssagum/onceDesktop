import React, { useState, useEffect } from "react";
import { registerUser } from "../../utils/UserAuth";
import { format } from "date-fns";
import { useToast } from "../../contexts/ToastContext";

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
  const { showToast } = useToast();
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
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
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
    setPrivacyAgreed(false);
    setShowPrivacyModal(false);
    setIsFormValid(false);
    setError("");
  };

  // 모달 닫기 핸들러
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 개인정보 모달 열기/닫기 핸들러
  const togglePrivacyModal = (e) => {
    e.preventDefault();
    setShowPrivacyModal(!showPrivacyModal);
  };

  // 개인정보 동의 처리 핸들러 추가
  const handlePrivacyAgree = (e) => {
    e.preventDefault();
    setPrivacyAgreed(true);
    setShowPrivacyModal(false);
  };

  // 개인정보 동의 취소 핸들러 추가
  const handlePrivacyCancel = (e) => {
    e.preventDefault();
    setShowPrivacyModal(false);
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
      accountNumber &&
      privacyAgreed;

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
    privacyAgreed,
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
      case "privacyAgreed":
        setPrivacyAgreed(e.target.checked);
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
      } else if (!privacyAgreed) {
        setError("개인정보 수집 및 이용에 동의해주세요");
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
        showToast("회원가입이 완료되었습니다. 로그인해주세요.", "success");
        resetForm(); // 성공 시에도 폼 초기화
        onClose();
      } else {
        // 서버에서 반환한 구체적인 오류 메시지 표시
        setError(result.message || "회원가입 중 오류가 발생했습니다.");
        showToast(
          result.message || "회원가입 중 오류가 발생했습니다.",
          "error"
        );
        console.error("회원가입 실패:", result.message);
      }
    } catch (error) {
      console.error("회원가입 오류:", error);
      // 오류 메시지를 더 구체적으로 표시
      if (error.message) {
        const errorMessage = `회원가입 중 오류가 발생했습니다: ${error.message}`;
        setError(errorMessage);
        showToast(errorMessage, "error");
      } else {
        const errorMessage =
          "회원가입 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.";
        setError(errorMessage);
        showToast(errorMessage, "error");
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
              placeholder="onceonce@gmail.com"
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
                "진료팀",
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

          {/* 개인정보 수집 및 이용 동의 */}
          <div className="mt-6">
            <div className="flex items-start mb-2">
              <div className="flex items-center h-5">
                <input
                  id="privacyAgreed"
                  name="privacyAgreed"
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={handleChange}
                  className="w-4 h-4 text-onceBlue border-gray-300 rounded focus:ring-onceBlue"
                />
              </div>
              <div className="ml-2 flex items-center">
                <label
                  htmlFor="privacyAgreed"
                  className="text-sm font-medium text-gray-700"
                >
                  개인정보 수집 및 이용 동의{" "}
                  <span className="text-red-500">*</span>
                </label>
                <button
                  onClick={togglePrivacyModal}
                  className="ml-2 text-xs text-gray-700 hover:underline focus:outline-none underline"
                >
                  내용보기
                </button>
              </div>
            </div>
          </div>

          {/* 개인정보 수집 및 이용 동의 모달 */}
          {showPrivacyModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60]">
              <div className="bg-white rounded-md w-full max-w-[800px] p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">
                    개인정보 수집 및 이용 동의
                  </h2>
                  <button
                    onClick={togglePrivacyModal}
                    className="text-gray-500 hover:text-gray-700"
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
                <div className="text-sm text-gray-700 overflow-y-auto">
                  <div className="policy-box">
                    <div className="inner">
                      <h2 className="text-lg font-bold text-center mb-4">
                        MEDIVANCE 병원 운영관리 프로그램 직원용 개인정보
                        처리방침
                      </h2>

                      <p className="txt mb-4">
                        메디플로우 주식회사(이하 "회사")는 「개인정보 보호법」에
                        따라 직원 여러분의 개인정보 보호와 권익을 보호하고
                        개인정보와 관련한 이용자의 고충을 원활하게 처리할 수
                        있도록 다음과 같은 처리방침을 두고 있습니다. 회사는
                        개인정보처리방침을 개정하는 경우 내부 공지사항(또는
                        개별공지)을 통하여 공지할 것입니다.
                      </p>

                      <h3 className="font-bold text-base mt-6 mb-2">
                        1. 개인정보의 처리 목적
                      </h3>
                      <p className="txt mb-4">
                        회사는 다음의 목적을 위하여 직원의 개인정보를
                        처리합니다. 처리한 개인정보는 다음의 목적 이외의
                        용도로는 사용되지 않으며 이용 목적이 변경될 경우에는
                        「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등
                        필요한 조치를 이행할 예정입니다.
                        <br />
                        <br />
                        가. 인사 및 노무관리
                        <br />
                        &nbsp;&nbsp;&nbsp;- 직원의 인적 사항, 학력, 자격, 경력,
                        근태, 입/퇴사, 인사평가 등 인사관리
                        <br />
                        &nbsp;&nbsp;&nbsp;- 임금, 퇴직금, 급여계좌 지급관리, 4대
                        보험 및 세금 납부 등 직원 급여 지급 및 관리
                        <br />
                        &nbsp;&nbsp;&nbsp;- 각종 증명서 발급, 휴가 및 복리후생
                        제공, 사내교육 관리 등<br />
                        &nbsp;&nbsp;&nbsp;- 근로계약 체결 및 유지, 법적 의무사항
                        준수(세무신고, 서류보존 등)
                        <br />
                        <br />
                        나. 병원 운영관리 시스템(MEDIVANCE) 이용
                        <br />
                        &nbsp;&nbsp;&nbsp;- 시스템 계정 발급, 접근 권한 관리,
                        보안관리
                        <br />
                        &nbsp;&nbsp;&nbsp;- 직원 간 업무 소통 및 협업 지원
                        <br />
                        &nbsp;&nbsp;&nbsp;- 근태관리, 휴가관리, 직원별 업무 실적
                        관리
                        <br />
                        &nbsp;&nbsp;&nbsp;- 병원 내 부서별 업무 관리 및 조정
                        <br />
                        <br />
                        다. 보안 및 시설관리
                        <br />
                        &nbsp;&nbsp;&nbsp;- 병원 시설 출입 통제 및 보안 유지
                        <br />
                        &nbsp;&nbsp;&nbsp;- 시스템 불법접근 및 부정사용 방지
                        <br />
                        &nbsp;&nbsp;&nbsp;- 민원 처리 및 분쟁 해결
                        <br />
                      </p>

                      <h3 className="font-bold text-base mt-6 mb-2">
                        2. 수집하는 개인정보 항목 및 수집방법
                      </h3>
                      <p className="txt mb-4">
                        회사는 인사 및 급여관리, 시스템 사용 등을 위해 다음과
                        같은 개인정보 항목을 수집하고 있습니다.
                        <br />
                        <br />
                        가. 필수수집 항목
                        <br />
                        &nbsp;&nbsp;&nbsp;- 성명, 주민등록번호, 생년월일,
                        ID/이메일, 비밀번호, 휴대전화번호, 주소
                        <br />
                        &nbsp;&nbsp;&nbsp;- 소속부서, 직위/직급, 입사일
                        <br />
                        &nbsp;&nbsp;&nbsp;- 은행명, 계좌번호(급여지급용)
                        <br />
                        <br />
                        나. 선택수집 항목
                        <br />
                        &nbsp;&nbsp;&nbsp;- 사진, 비상연락처, 가족사항, 학력,
                        자격증, 경력사항
                        <br />
                        <br />
                        다. 자동수집 항목
                        <br />
                        &nbsp;&nbsp;&nbsp;- IP 주소, 접속 로그, 시스템 사용기록
                        <br />
                        &nbsp;&nbsp;&nbsp;- 근태정보(출퇴근 기록, 휴가 사용 내역
                        등)
                        <br />
                        <br />
                        라. 개인정보 수집방법
                        <br />
                        &nbsp;&nbsp;&nbsp;- 회원가입 시 입력한 정보
                        <br />
                        &nbsp;&nbsp;&nbsp;- 인사 관련 서류 제출
                        <br />
                        &nbsp;&nbsp;&nbsp;- 내부 시스템 사용 시 생성되는 정보
                        <br />
                      </p>

                      <h3 className="font-bold text-base mt-6 mb-2">
                        3. 개인정보의 보유 및 이용기간
                      </h3>
                      <p className="txt mb-4">
                        원칙적으로 직원의 개인정보는 수집·이용 목적이 달성된
                        후에는 해당 정보를 지체 없이 파기합니다. 다만, 다음의
                        사유로 명시한 기간 동안 보존합니다.
                        <br />
                        <br />
                        가. 관련 법령에 따른 보존
                        <br />
                        &nbsp;&nbsp;&nbsp;- 근로기준법에 따른 근로계약관련 서류:
                        근로관계 종료 후 5년
                        <br />
                        &nbsp;&nbsp;&nbsp;- 소득세법에 따른 증빙서류: 5년
                        <br />
                        &nbsp;&nbsp;&nbsp;- 국민건강보험법, 국민연금법 등
                        4대보험 관련 서류: 5년
                        <br />
                        <br />
                        나. 퇴직 후 인사관리
                        <br />
                        &nbsp;&nbsp;&nbsp;- 경력증명서 발급, 퇴직금 지급,
                        4대보험 처리 등을 위해 퇴직 후 5년간 보관
                        <br />
                        <br />
                        다. 삭제 요청 시<br />
                        &nbsp;&nbsp;&nbsp;- 직원이 개인정보 삭제를 요청하는
                        경우, 법령에 따른 보존 사유가 없는 한 즉시 삭제
                        <br />
                      </p>

                      <h3 className="font-bold text-base mt-6 mb-2">
                        4. 개인정보의 제3자 제공
                      </h3>
                      <p className="txt mb-4">
                        회사는 직원의 개인정보를 원칙적으로 제3자에게 제공하지
                        않습니다. 다만, 다음의 경우에는 예외적으로 제공할 수
                        있습니다.
                        <br />
                        <br />
                        가. 직원이 사전에 동의한 경우
                        <br />
                        나. 법령에 의거하거나, 수사 목적으로 법령에 정해진
                        절차와 방법에 따라 수사기관의 요구가 있는 경우
                        <br />
                        다. 통계작성, 학술연구 또는 시장조사를 위하여 필요한
                        경우로서 특정 개인을 식별할 수 없는 형태로 가공하여
                        제공하는 경우
                        <br />
                      </p>

                      <h3 className="font-bold text-base mt-6 mb-2">
                        5. 개인정보 처리의 위탁
                      </h3>
                      <p className="txt mb-4">
                        회사는 서비스 향상을 위해 아래와 같이 개인정보 처리
                        업무를 위탁하고 있습니다. 회사는 위탁계약 체결 시
                        「개인정보 보호법」 제26조에 따라 위탁업무 수행목적 외
                        개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한,
                        수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을
                        계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게
                        처리하는지를 감독하고 있습니다.
                        <br />
                        <br />
                        - 위탁받는 자(수탁자): 네이버 클라우드 플랫폼(NCP)
                        <br />
                        - 위탁 업무 내용: 클라우드 서비스 제공, 시스템 운영 및
                        관리, 문자메시지/이메일 발송
                        <br />
                        <br />
                        - 위탁받는 자(수탁자): 이니시스
                        <br />
                        - 위탁 업무 내용: 급여지급 결제대행
                        <br />
                        <br />
                        - 위탁받는 자(수탁자): 주식회사 채널코퍼레이션
                        <br />
                        - 위탁 업무 내용: 시스템 고객지원
                        <br />
                      </p>

                      <h3 className="font-bold text-base mt-6 mb-2">
                        6. 정보주체와 법정대리인의 권리·의무 및 행사방법
                      </h3>
                      <p className="txt mb-4">
                        직원은 개인정보주체로서 다음과 같은 권리를 행사할 수
                        있습니다.
                        <br />
                        <br />
                        가. 개인정보 열람 요구
                        <br />
                        나. 오류 등이 있을 경우 정정 요구
                        <br />
                        다. 삭제 요구
                        <br />
                        라. 처리정지 요구
                        <br />
                        <br />
                        개인정보 열람, 정정·삭제, 처리정지 요청은 MEDIVANCE
                        시스템 내 '내 정보 관리' 페이지에서 직접 처리하거나,
                        인사담당자 또는 개인정보 보호책임자에게 서면, 전화,
                        이메일로 연락하시면 지체 없이 조치하겠습니다.
                      </p>

                      <h3 className="font-bold text-base mt-6 mb-2">
                        7. 개인정보의 안전성 확보조치
                      </h3>
                      <p className="txt mb-4">
                        회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를
                        취하고 있습니다.
                        <br />
                        <br />
                        가. 관리적 조치
                        <br />
                        &nbsp;&nbsp;&nbsp;- 개인정보 보호책임자 지정 및 정기적
                        직원 교육
                        <br />
                        &nbsp;&nbsp;&nbsp;- 개인정보 처리 관련 내부 규정
                        수립·시행
                        <br />
                        <br />
                        나. 기술적 조치
                        <br />
                        &nbsp;&nbsp;&nbsp;- 개인정보처리시스템 접근 권한 관리
                        <br />
                        &nbsp;&nbsp;&nbsp;- 개인정보 암호화, 접속기록 보관
                        <br />
                        &nbsp;&nbsp;&nbsp;- 보안프로그램 설치 및 주기적 업데이트
                        <br />
                        <br />
                        다. 물리적 조치
                        <br />
                        &nbsp;&nbsp;&nbsp;- 전산실, 자료보관실 등의 접근통제
                        <br />
                      </p>

                      <h3 className="font-bold text-base mt-6 mb-2">
                        8. 개인정보 보호책임자
                      </h3>
                      <p className="txt mb-4">
                        회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고,
                        개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제
                        등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고
                        있습니다.
                        <br />
                        <br />
                        - 개인정보 보호책임자: 지창윤
                        <br />
                        - 소속: 경영지원팀
                        <br />
                        <br />
                        - 연락처: 010-5141-7233, lukeji0519@gmail.com
                        <br />
                      </p>

                      <h3 className="font-bold text-base mt-6 mb-2">
                        9. 개인정보 처리방침 변경
                      </h3>
                      <p className="txt mb-4">
                        이 개인정보 처리방침은 2025년 04월 01일부터 적용되며,
                        법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는
                        경우에는 변경사항의 시행 7일 전부터 내부 공지사항(또는
                        개별공지)을 통해 고지할 것입니다.
                      </p>

                      <div className="bg-gray-100 p-4 rounded-md mt-8">
                        <p className="font-semibold mb-2">
                          개인정보 수집 및 이용 동의
                        </p>
                        <p className="mb-2">
                          위와 같이 개인정보를 수집·이용하는데 동의하십니까?
                        </p>
                        <p>
                          ※ 직원은 개인정보 수집 및 이용에 대한 동의를 거부할
                          권리가 있습니다. 다만, 동의를 거부할 경우 회원가입 및
                          시스템 접근이 제한되어 근무가 불가능할 수 있습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-6 space-x-4">
                  <button
                    type="button"
                    onClick={handlePrivacyCancel}
                    className="bg-gray-300 text-gray-700 py-2 px-6 rounded-md font-medium hover:bg-gray-400"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handlePrivacyAgree}
                    className="bg-onceBlue text-white py-2 px-6 rounded-md font-medium hover:bg-blue-800"
                  >
                    동의합니다
                  </button>
                </div>
              </div>
            </div>
          )}

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
