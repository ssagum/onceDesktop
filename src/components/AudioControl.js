import React from "react";
import { useAudio } from "../contexts/AudioContext";
import styled from "styled-components";

const AudioControlContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;
  width: 100%;
  padding: 0 15px;
`;

const ControlRow = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 5px;
`;

const AudioIcon = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: #162D66;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  
  &:hover {
    opacity: 0.8;
  }
`;

const VolumeSlider = styled.input`
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #e0e0e0;
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #162D66;
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #162D66;
    cursor: pointer;
    border: none;
  }
`;

const VolumeLabel = styled.span`
  font-size: 12px;
  color: #888888;
  margin-left: 8px;
  min-width: 30px;
`;

const AudioControl = () => {
  const { volume, isMuted, changeVolume, toggleMute } = useAudio();
  
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    changeVolume(newVolume);
  };
  
  // 음소거 아이콘 결정 (폰트 어썸 아이콘 코드 사용)
  const getVolumeIcon = () => {
    if (isMuted) return "🔇";
    if (volume < 0.1) return "🔇";
    if (volume < 0.5) return "🔉";
    return "🔊";
  };
  
  return (
    <AudioControlContainer>
      <ControlRow>
        <AudioIcon onClick={toggleMute}>
          {getVolumeIcon()}
        </AudioIcon>
        <VolumeSlider
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          disabled={isMuted}
        />
        <VolumeLabel>{Math.round(volume * 100)}%</VolumeLabel>
      </ControlRow>
    </AudioControlContainer>
  );
};

export default AudioControl; 