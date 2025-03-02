import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";

const TimerContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: #1a1a1a;
  padding: 20px;
  color: #a9b5df;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const TimeDisplay = styled.div`
  font-size: 15vw;
  font-weight: bold;
  margin-bottom: 30px;
  font-family: monospace;
`;

const InputContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  align-items: center;
`;

const TimeInput = styled.input`
  width: 80px;
  padding: 8px;
  text-align: center;
  border-radius: 8px;
  font-size: 16px;
  background-color: #2a2a2a;
  border: 1px solid #3a3a3a;
  color: #e0e0e0;

  &::placeholder {
    color: #808080;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  background-color: #2a2a2a;
  color: #e0e0e0;
  font-size: 16px;
  cursor: pointer;
  border: 1px solid #3a3a3a;
  transition: all 0.2s;

  &:hover {
    background-color: #3a3a3a;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ModeToggle = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  background-color: #2a2a2a;
  padding: 5px;
  border-radius: 8px;
`;

const ToggleButton = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  background-color: ${(props) => (props.active ? "#3a3a3a" : "transparent")};
  color: ${(props) => (props.active ? "#a9b5df" : "#808080")};
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #a9b5df;
  }
`;

const PresetContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
  width: 100%;
  max-width: 800px;
`;

const PresetButtonsRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  padding: 5px 0;
`;

const PresetButton = styled.div`
  padding: 8px 16px;
  border-radius: 8px;
  background-color: #2a2a2a;
  color: #e0e0e0;
  font-size: 14px;
  cursor: ${(props) => (props.disabled ? "default" : "pointer")};
  border: 1px solid #3a3a3a;
  transition: all 0.2s;
  position: relative;
  min-width: 80px;
  text-align: center;
  user-select: none;

  &:hover {
    background-color: ${(props) => (props.disabled ? "#2a2a2a" : "#3a3a3a")};
  }

  &:active {
    transform: ${(props) => (props.disabled ? "none" : "scale(0.98)")};
  }
`;

const DeleteButton = styled.button`
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #e74c3c;
  color: white;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  border: none;
  z-index: 20;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  padding: 0;
  margin: 0;

  &:hover {
    background-color: #c0392b;
    transform: scale(1.1);
  }
`;

const PresetControlsContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
  align-items: center;
  justify-content: center;
`;

const PresetInput = styled.input`
  width: 80px;
  padding: 8px;
  text-align: center;
  border-radius: 8px;
  font-size: 14px;
  background-color: #2a2a2a;
  border: 1px solid #3a3a3a;
  color: #e0e0e0;

  &::placeholder {
    color: #808080;
  }
`;

const ToggleEditButton = styled(Button)`
  background-color: ${(props) => (props.active ? "#3a3a3a" : "#2a2a2a")};
  padding: 8px 16px;
  font-size: 14px;
`;

export default function TimerWindow() {
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [totalMinutes, setTotalMinutes] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [presets, setPresets] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newPresetMinutes, setNewPresetMinutes] = useState("");
  const intervalRef = useRef(null);
  const initialTimeRef = useRef(null);

  useEffect(() => {
    const savedPresets = localStorage.getItem("timerPresets");
    if (savedPresets) {
      try {
        const parsedPresets = JSON.parse(savedPresets);

        // 이전 형식의 프리셋을 새 형식으로 변환
        let formattedPresets;
        if (parsedPresets.length > 0 && typeof parsedPresets[0] === "object") {
          formattedPresets = parsedPresets
            .map(
              (preset) =>
                preset.totalMinutes || preset.hours * 60 + preset.minutes || 0
            )
            .filter((minutes) => minutes > 0);

          // 새 형식으로 저장
          localStorage.setItem(
            "timerPresets",
            JSON.stringify(formattedPresets)
          );
        } else {
          formattedPresets = parsedPresets;
        }

        // 중복 제거 및 정렬
        formattedPresets = [...new Set(formattedPresets)].sort((a, b) => a - b);
        setPresets(formattedPresets);
      } catch (error) {
        console.error("프리셋 불러오기 오류:", error);
        // 오류 발생 시 기본값으로 초기화
        const defaultPresets = [5, 10, 30, 50, 60, 70, 90];
        setPresets(defaultPresets);
        localStorage.setItem("timerPresets", JSON.stringify(defaultPresets));
      }
    } else {
      const defaultPresets = [5, 10, 30, 50, 60, 70, 90];
      setPresets(defaultPresets);
      localStorage.setItem("timerPresets", JSON.stringify(defaultPresets));
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isRunning && !isPaused) {
      let totalSeconds;
      if (isDetailMode) {
        totalSeconds =
          parseInt(hours || 0) * 3600 + parseInt(minutes || 0) * 60;
      } else {
        totalSeconds = parseInt(totalMinutes || 0) * 60;
      }
      setTimeLeft(totalSeconds || null);
    }
  }, [hours, minutes, totalMinutes, isDetailMode, isRunning, isPaused]);

  const startTimer = () => {
    if ((!hours && !minutes && !totalMinutes) || isRunning) return;

    let totalSeconds;
    if (isDetailMode) {
      totalSeconds = parseInt(hours || 0) * 3600 + parseInt(minutes || 0) * 60;
    } else {
      totalSeconds = parseInt(totalMinutes || 0) * 60;
    }

    setTimeLeft(totalSeconds);
    initialTimeRef.current = totalSeconds;
    setIsRunning(true);
    setIsPaused(false);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      setIsPaused(true);
    }
  };

  const resumeTimer = () => {
    setIsPaused(false);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTimeLeft(initialTimeRef.current);
    setIsRunning(false);
    setIsPaused(false);
    setHours("");
    setMinutes("");
    setTotalMinutes("");
    initialTimeRef.current = null;
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "00:00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleMode = () => {
    if (isRunning || isPaused) return;
    setIsDetailMode(!isDetailMode);
    setHours("");
    setMinutes("");
    setTotalMinutes("");
  };

  const addPreset = () => {
    if (!newPresetMinutes || isNaN(parseInt(newPresetMinutes))) return;

    const minutes = parseInt(newPresetMinutes);
    if (minutes <= 0 || minutes > 1439) return;

    const updatedPresets = [...presets, minutes].sort((a, b) => a - b);
    setPresets(updatedPresets);
    localStorage.setItem("timerPresets", JSON.stringify(updatedPresets));
    setNewPresetMinutes("");
  };

  const applyPreset = (minutes) => {
    if (isRunning || isPaused || isEditMode) return;

    if (isDetailMode) {
      // 기존 시/분 값 계산
      const currentHours = parseInt(hours || 0);
      const currentMinutes = parseInt(minutes || 0);
      const currentTotalMinutes = currentHours * 60 + currentMinutes;

      // 프리셋 시간 추가
      const newTotalMinutes = currentTotalMinutes + minutes;

      // 새 시/분 값 설정
      setHours(Math.floor(newTotalMinutes / 60).toString());
      setMinutes((newTotalMinutes % 60).toString());
    } else {
      // 분 모드에서는 단순히 분 값에 추가
      const current = parseInt(totalMinutes || 0);
      setTotalMinutes((current + minutes).toString());
    }
  };

  const clearInputs = () => {
    setHours("");
    setMinutes("");
    setTotalMinutes("");
    setTimeLeft(null);
  };

  const deletePreset = (index) => {
    const updatedPresets = presets.filter((_, i) => i !== index);
    setPresets(updatedPresets);
    localStorage.setItem("timerPresets", JSON.stringify(updatedPresets));
  };

  const formatPreset = (minutes) => {
    // 타입 체크 추가
    if (typeof minutes !== "number") {
      console.error("유효하지 않은 프리셋 값:", minutes);
      return "오류";
    }

    if (minutes >= 60) {
      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hrs}시간 ${mins}분` : `${hrs}시간`;
    }
    return `${minutes}분`;
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  return (
    <TimerContainer>
      <ModeToggle>
        <ToggleButton active={isDetailMode} onClick={() => toggleMode()}>
          시/분
        </ToggleButton>
        <ToggleButton active={!isDetailMode} onClick={() => toggleMode()}>
          분
        </ToggleButton>
      </ModeToggle>

      <TimeDisplay>{formatTime(timeLeft)}</TimeDisplay>

      {!isRunning && !isPaused && (
        <InputContainer>
          {isDetailMode ? (
            <>
              <TimeInput
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="시간"
                min="0"
                max="23"
              />
              <span>시간</span>
              <TimeInput
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="분"
                min="0"
                max="59"
              />
              <span>분</span>
            </>
          ) : (
            <>
              <TimeInput
                type="number"
                value={totalMinutes}
                onChange={(e) => setTotalMinutes(e.target.value)}
                placeholder="분"
                min="0"
                max="1439"
              />
              <span>분</span>
            </>
          )}
          <Button onClick={startTimer}>시작</Button>
          <Button onClick={clearInputs}>초기화</Button>
        </InputContainer>
      )}

      {(isRunning || isPaused) && (
        <ButtonContainer>
          {isPaused ? (
            <Button onClick={resumeTimer}>재개</Button>
          ) : (
            <Button onClick={pauseTimer}>일시정지</Button>
          )}
          <Button onClick={resetTimer}>초기화</Button>
        </ButtonContainer>
      )}

      {!isRunning && !isPaused && (
        <PresetContainer>
          <PresetButtonsRow>
            {presets.map((preset, index) => (
              <PresetButton
                key={index}
                onClick={() => !isEditMode && applyPreset(preset)}
                disabled={isEditMode}
              >
                {formatPreset(preset)}

                {isEditMode && (
                  <DeleteButton
                    onClick={(e) => {
                      deletePreset(index);
                    }}
                  >
                    ×
                  </DeleteButton>
                )}
              </PresetButton>
            ))}
          </PresetButtonsRow>
          <PresetControlsContainer>
            <PresetInput
              type="number"
              value={newPresetMinutes}
              onChange={(e) => setNewPresetMinutes(e.target.value)}
              placeholder="분"
              min="1"
              max="1439"
            />
            <Button onClick={addPreset}>프리셋 추가</Button>
            <ToggleEditButton active={isEditMode} onClick={toggleEditMode}>
              {isEditMode ? "완료" : "편집"}
            </ToggleEditButton>
          </PresetControlsContainer>
        </PresetContainer>
      )}
    </TimerContainer>
  );
}
