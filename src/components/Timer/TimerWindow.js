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

export default function TimerWindow() {
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [totalMinutes, setTotalMinutes] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const intervalRef = useRef(null);
  const initialTimeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

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
    if (isRunning || isPaused) return; // 타이머 실행 중에는 모드 변경 불가
    setIsDetailMode(!isDetailMode);
    setHours("");
    setMinutes("");
    setTotalMinutes("");
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
    </TimerContainer>
  );
}
