import React, { useState } from "react";
import DepartmentRoleSelector from "./DepartmentRoleSelector";

export default function DepartmentRoleSelectorExample() {
  const [selectedDepartmentRole, setSelectedDepartmentRole] = useState("");

  const handleRoleChange = (value) => {
    setSelectedDepartmentRole(value);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        담당 부서/역할 선택 컴포넌트 예제
      </h1>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">기본 사용 예시</h2>
        <div className="flex items-center space-x-4">
          <label className="font-medium">담당 선택:</label>
          <DepartmentRoleSelector
            value={selectedDepartmentRole}
            onChange={handleRoleChange}
          />
        </div>
        {selectedDepartmentRole && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <p className="font-medium">선택된 담당 부서/역할:</p>
            <pre className="mt-2 bg-white p-2 rounded border">
              {JSON.stringify(selectedDepartmentRole, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">비활성화 상태</h2>
        <div className="flex items-center space-x-4">
          <label className="font-medium">담당 선택 (비활성화):</label>
          <DepartmentRoleSelector value="간호팀장" disabled={true} />
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">사용자 정의 라벨</h2>
        <div className="flex items-center space-x-4">
          <label className="font-medium">담당:</label>
          <DepartmentRoleSelector
            label="담당 부서나 역할을 선택하세요"
            onChange={handleRoleChange}
          />
        </div>
      </div>
    </div>
  );
}
