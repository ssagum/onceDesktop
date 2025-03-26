// 일정 생성 함수 수정 - 더 세밀한 시간 단위 지원
const createAppointment = async (data) => {
  try {
    // 시간대 계산 로직
    const startTime =
      data.startTime ||
      (data.startTimeIndex ? effectiveTimeSlots[data.startTimeIndex] : null);
    const endTime =
      data.endTime ||
      (data.endTimeIndex
        ? getEndTime(effectiveTimeSlots[data.endTimeIndex])
        : null);

    if (!startTime || !endTime) {
      alert("시작 시간과 종료 시간을 설정해주세요.");
      return;
    }

    // 시간 검증 - 종료 시간이 시작 시간보다 나중인지
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      alert("종료 시간은 시작 시간보다 나중이어야 합니다.");
      return;
    }

    // 담당자 정보 가져오기
    const selectedStaff = staff.find((s) => s.id === data.staffId);

    // 새 일정 데이터 생성
    const newAppointment = {
      title: data.title || "",
      staffId: data.staffId,
      staffName: selectedStaff ? selectedStaff.name : "알 수 없음",
      date: format(data.date, "yyyy-MM-dd"),
      startTime,
      endTime,
      notes: data.notes || "",
      type: data.type || (viewMode === "물리치료" ? "물리치료" : "예약"),
      dateIndex: data.dateIndex,
      staffColor: selectedStaff ? selectedStaff.color : "#999",
    };

    // 상위 컴포넌트 콜백 호출 - 여기서 Firebase 저장 처리
    let savedAppointment = null;
    if (onAppointmentCreate) {
      // 생성된 예약 정보 (id 포함) 받아오기
      savedAppointment = await onAppointmentCreate(newAppointment);

      // 로컬 상태 업데이트 - 반환된 객체가 있는 경우만
      if (savedAppointment && savedAppointment.id) {
        console.log("로컬 상태 업데이트:", savedAppointment);
        // 로컬 상태에 새 일정 추가
        setAppointments((prevAppointments) => [
          ...prevAppointments,
          savedAppointment,
        ]);
      }
    }

    // 폼 닫기 및 상태 초기화
    setShowForm(false);
    setSelection(null); // 선택 영역 초기화
    setCurrentCell(null); // 선택된 셀 초기화
  } catch (error) {
    console.error("일정 생성 오류:", error);
    alert("일정을 저장하는 중 오류가 발생했습니다.");
  }
};
