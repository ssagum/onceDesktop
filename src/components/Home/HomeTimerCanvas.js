import React, { useState, useEffect } from "react";
import styled from "styled-components";

const DigitZone = styled.div``;
const ControlZone = styled.div``;
const FloatingZone = styled.div``;

const HomeTimerCanvas = () => {
  const [time, setTime] = useState(0); // Time in seconds
  const [isRunning, setIsRunning] = useState(false); // Start/Stop state
  const [isCountdown, setIsCountdown] = useState(false); // Mode: Countdown or Stopwatch

  // Timer logic
  useEffect(() => {
    let timer;
    if (isRunning) {
      timer = setInterval(() => {
        setTime((prevTime) => {
          if (isCountdown) {
            return prevTime > 0 ? prevTime - 1 : 0;
          } else {
            return prevTime + 1;
          }
        });
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isRunning, isCountdown]);

  // Format time as HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  // Reset timer
  const resetTime = () => {
    setTime(isCountdown ? 60 : 0); // Default countdown starts at 60 seconds
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col h-screen w-full">
      <DigitZone className="flex-grow-[5] bg-red w-full flex items-center justify-center font-digital text-[240px] bg-black text-lime-500 py-4 rounded-lg">
        {formatTime(time)}
      </DigitZone>
      <ControlZone className="flex-grow-[2] w-full flex items-center justify-center bg-white space-x-4">
        <FloatingZone className="flex-row flex px-[20px] py-[20px] rounded-lg bg-commonContainer justify-center items-center"></FloatingZone>
        <button
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          onClick={() => setIsRunning(!isRunning)}
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-700 transition"
          onClick={resetTime}
        >
          Reset
        </button>
        <button
          className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-700 transition"
          onClick={() => {
            setIsCountdown(!isCountdown);
            resetTime();
          }}
        >
          {isCountdown ? "Switch to Stopwatch" : "Switch to Countdown"}
        </button>
      </ControlZone>
    </div>
  );
};

export default HomeTimerCanvas;
