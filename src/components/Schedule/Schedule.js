const handleAppointmentUpdate = async (updatedAppointment) => {
  try {
    // Firestore 문서 업데이트
    const appointmentRef = doc(db, "reservations", updatedAppointment.id);
    await updateDoc(appointmentRef, {
      ...updatedAppointment,
      updatedAt: new Date(),
    });

    // 로컬 상태 업데이트
    setAppointments((prevAppointments) =>
      prevAppointments.map((app) =>
        app.id === updatedAppointment.id ? updatedAppointment : app
      )
    );

    // 데이터 갱신
    await fetchAppointments();
  } catch (error) {
    console.error("일정 수정 중 오류 발생:", error);
    showToast("일정 수정 중 오류가 발생했습니다.", "error");
  }
};

const handleAppointmentDelete = async (appointmentId) => {
  try {
    // Firestore 문서 삭제
    const appointmentRef = doc(db, "reservations", appointmentId);
    await deleteDoc(appointmentRef);

    // 로컬 상태 업데이트
    setAppointments((prevAppointments) =>
      prevAppointments.filter((app) => app.id !== appointmentId)
    );

    // 데이터 갱신
    await fetchAppointments();
  } catch (error) {
    console.error("일정 삭제 중 오류 발생:", error);
    showToast("일정 삭제 중 오류가 발생했습니다.", "error");
  }
};

const handleAppointmentCreate = async (newAppointment) => {
  try {
    // Firestore에 새 문서 추가
    const docRef = await addDoc(collection(db, "reservations"), {
      ...newAppointment,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 생성된 문서의 ID로 새 일정 객체 생성
    const createdAppointment = {
      ...newAppointment,
      id: docRef.id,
    };

    // 로컬 상태 업데이트
    setAppointments((prevAppointments) => [
      ...prevAppointments,
      createdAppointment,
    ]);

    // 데이터 갱신
    await fetchAppointments();

    return createdAppointment;
  } catch (error) {
    console.error("일정 생성 중 오류 발생:", error);
    showToast("일정 생성 중 오류가 발생했습니다.", "error");
    throw error;
  }
};
