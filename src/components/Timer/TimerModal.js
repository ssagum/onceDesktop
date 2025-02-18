import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";

const ModalBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const TimerContainer = styled.div`
  width: 800px;
  height: 600px;
  background-color: black;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
`;

const TimeDisplay = styled.div`
  font-size: 120px;
  font-weight: bold;
  margin-bottom: 30px;
`;

const InputContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  background-color: #ffffff;
  color: black;
  font-size: 16px;
  cursor: pointer;
  border: none;

  &:hover {
    background-color: #eeeeee;
  }
`;

export default function TimerModal({ isVisible, setIsVisible }) {
  const [minutes, setMinutes] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startTimer = () => {
    if (!minutes || isRunning) return;

    const totalSeconds = parseInt(minutes) * 60;
    setTimeLeft(totalSeconds);
    setIsRunning(true);

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

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      setIsRunning(false);
      setTimeLeft(null);
      setMinutes("");
    }
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (!isVisible) return null;

  return (
    <ModalBackground onClick={() => setIsVisible(false)}>
      <TimerContainer onClick={(e) => e.stopPropagation()}>
        <TimeDisplay>{formatTime(timeLeft)}</TimeDisplay>
        {!isRunning && (
          <InputContainer>
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="분 입력"
              className="p-2 text-black rounded-lg w-[100px] text-center"
            />
            <Button onClick={startTimer}>시작</Button>
          </InputContainer>
        )}
        {isRunning && <Button onClick={stopTimer}>정지</Button>}
      </TimerContainer>
    </ModalBackground>
  );
}
