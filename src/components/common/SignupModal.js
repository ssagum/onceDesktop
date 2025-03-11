import React, { useState } from "react";
import { registerUser } from "../../utils/UserAuth";

function SignupModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    idNumberFront: "",
    idNumberBack: "",
    phoneFirst: "010",
    phoneMiddle: "",
    phoneLast: "",
    department: "",
    address: "",
    bankName: "",
    accountNumber: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDepartmentSelect = (dept) => {
    setFormData({
      ...formData,
      department: dept,
    });
  };

  const validateForm = () => {
    if (!formData.email || !formData.email.includes("@")) {
      setError("유효한 이메일을 입력해주세요");
      return false;
    }
    if (!formData.password) {
      setError("비밀번호를 입력해주세요");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다");
      return false;
    }
    if (!formData.name) {
      setError("이름을 입력해주세요");
      return false;
    }
    if (!formData.idNumberFront || !formData.idNumberBack) {
      setError("주민번호를 입력해주세요");
      return false;
    }
    if (!formData.phoneMiddle || !formData.phoneLast) {
      setError("연락처를 입력해주세요");
      return false;
    }
    if (!formData.department) {
      setError("부서를 선택해주세요");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      // 회원가입에 필요한 추가 정보 구성
      const additionalData = {
        idNumber: `${formData.idNumberFront}-${formData.idNumberBack}`,
        phoneNumber: `${formData.phoneFirst}-${formData.phoneMiddle}-${formData.phoneLast}`,
        department: formData.department,
        address: formData.address || "",
        bankInfo: {
          bankName: formData.bankName || "",
          accountNumber: formData.accountNumber || "",
        },
      };

      const result = await registerUser(
        formData.email,
        formData.password,
        formData.name,
        additionalData
      );

      if (result.success) {
        alert("회원가입이 완료되었습니다. 로그인해주세요.");
        onClose();
      } else {
        setError(result.message || "회원가입 중 오류가 발생했습니다.");
      }
    } catch (error) {
      setError("회원가입 중 오류가 발생했습니다.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 필드 라벨 컴포넌트
  const FormLabel = ({ label, required }) => (
    <label className="block text-sm font-semibold text-gray-800">
      {label}:{required && <span className="text-red-500">*</span>}
    </label>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-md w-full max-w-[800px] p-6 max-h-[90vh] overflow-y-auto">
        {/* 헤더 영역 */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[34px] font-bold">회원가입</h2>
          <button
            onClick={onClose}
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
          <div className="flex flex-col mb-4">
            <div className="flex items-center mb-2">
              <FormLabel label="ID/Email" required={true} />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="danielpark@shopthetrip.world"
              className="w-full border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
            />
          </div>

          {/* 비밀번호와 재확인을 같은 행에 배치 */}
          <div className="flex flex-row space-x-4 mb-4">
            <div className="flex flex-col flex-1">
              <div className="flex items-center mb-2">
                <FormLabel label="비밀번호" required={true} />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
              />
            </div>
            <div className="flex flex-col flex-1">
              <div className="flex items-center mb-2">
                <FormLabel label="재확인" required={true} />
              </div>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Password"
                className="w-full border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
              />
            </div>
          </div>

          {/* 이름과 주민번호를 같은 행에 배치 */}
          <div className="flex flex-row space-x-4 mb-4">
            <div className="flex flex-col">
              <div className="flex items-center mb-2">
                <FormLabel label="이름" required={true} />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="이름"
                className="w-full border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
              />
            </div>
            <div className="flex flex-col flex-1">
              <div className="flex items-center mb-2">
                <FormLabel label="주민번호" required={true} />
              </div>
              <div className="flex items-center">
                <input
                  type="text"
                  name="idNumberFront"
                  value={formData.idNumberFront}
                  onChange={handleChange}
                  placeholder="123456"
                  maxLength={6}
                  className="w-[120px] border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
                />
                <span className="mx-2 text-lg">-</span>
                <input
                  type="text"
                  name="idNumberBack"
                  value={formData.idNumberBack}
                  onChange={handleChange}
                  placeholder="1234567"
                  maxLength={7}
                  className="w-[120px] border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
                />
              </div>
            </div>
          </div>

          {/* 연락처 */}
          <div className="flex flex-col mb-4">
            <div className="flex items-center mb-2">
              <FormLabel label="연락처" required={true} />
            </div>
            <div className="flex items-center">
              <input
                type="text"
                name="phoneFirst"
                value={formData.phoneFirst}
                onChange={handleChange}
                placeholder="010"
                maxLength={3}
                className="w-[80px] border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
              />
              <span className="mx-2">-</span>
              <input
                type="text"
                name="phoneMiddle"
                value={formData.phoneMiddle}
                onChange={handleChange}
                placeholder="1234"
                maxLength={4}
                className="w-[100px] border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
              />
              <span className="mx-2">-</span>
              <input
                type="text"
                name="phoneLast"
                value={formData.phoneLast}
                onChange={handleChange}
                placeholder="0317"
                maxLength={4}
                className="w-[100px] border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
              />
            </div>
          </div>

          {/* 부서 */}
          <div className="flex flex-col mb-4">
            <div className="flex items-center mb-2">
              <FormLabel label="부서" required={true} />
            </div>
            <div className="flex space-x-2">
              {["진료", "물리치료", "원장님", "간호", "방사선"].map((dept) => (
                <button
                  type="button"
                  key={dept}
                  onClick={() => handleDepartmentSelect(dept)}
                  className={`px-4 py-2 border rounded-md ${
                    formData.department === dept
                      ? "bg-onceBlue text-white border-onceBlue"
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* 주소 */}
          <div className="flex flex-col mb-4">
            <div className="flex items-center mb-2">
              <FormLabel label="주소" required={false} />
            </div>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="경기도 오산시 궐동"
              className="w-full border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
            />
          </div>

          {/* 급여계좌 */}
          <div className="flex flex-col mb-4">
            <div className="flex items-center mb-2">
              <FormLabel label="급여계좌" required={false} />
            </div>
            <div className="flex space-x-2 w-full">
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                placeholder="은행"
                className="w-[150px] border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
              />
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                placeholder="계좌번호"
                className="flex-1 border border-gray-300 rounded-md h-[40px] px-4 bg-[#F9F9F9]"
              />
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="text-red-500 text-center text-sm mt-2">{error}</div>
          )}

          {/* 회원가입 버튼 */}
          <div className="pt-4 mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[48px] border border-[#002855] text-[#002855] py-3 rounded-md hover:bg-gray-50 disabled:opacity-50 font-medium transition-colors"
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
