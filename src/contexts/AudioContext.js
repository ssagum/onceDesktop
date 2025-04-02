import React, { createContext, useState, useContext, useEffect } from "react";

// 오디오 컨텍스트 생성
const AudioContext = createContext();

// 로컬 스토리지 키
const VOLUME_KEY = 'once_audio_volume';
const MUTE_KEY = 'once_audio_mute';

export const AudioProvider = ({ children }) => {
  // 로컬 스토리지에서 볼륨 설정 불러오기 (기본값: 0.7)
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem(VOLUME_KEY);
    return savedVolume ? parseFloat(savedVolume) : 0.7;
  });
  
  // 로컬 스토리지에서 음소거 설정 불러오기 (기본값: false)
  const [isMuted, setIsMuted] = useState(() => {
    const savedMute = localStorage.getItem(MUTE_KEY);
    return savedMute ? savedMute === 'true' : false;
  });

  // 볼륨 변경 시 로컬 스토리지에 저장 및 Electron에 설정 전달
  useEffect(() => {
    localStorage.setItem(VOLUME_KEY, volume.toString());
    
    // Electron 메인 프로세스에 볼륨 설정 전달
    if (window.electron && window.electron.setAudioVolume) {
      window.electron.setAudioVolume(volume);
      console.log("Electron에 볼륨 설정 전달:", volume);
    }
  }, [volume]);

  // 음소거 변경 시 로컬 스토리지에 저장 및 Electron에 설정 전달
  useEffect(() => {
    localStorage.setItem(MUTE_KEY, isMuted.toString());
    
    // Electron 메인 프로세스에 음소거 설정 전달
    if (window.electron && window.electron.setAudioMuted) {
      window.electron.setAudioMuted(isMuted);
      console.log("Electron에 음소거 설정 전달:", isMuted);
    }
  }, [isMuted]);

  // 앱 시작 시 Electron에 초기 설정 전달
  useEffect(() => {
    // 초기 볼륨 및 음소거 설정을 Electron에 전달
    if (window.electron) {
      if (window.electron.setAudioVolume) {
        window.electron.setAudioVolume(volume);
        console.log("Electron에 초기 볼륨 설정 전달:", volume);
      }
      
      if (window.electron.setAudioMuted) {
        window.electron.setAudioMuted(isMuted);
        console.log("Electron에 초기 음소거 설정 전달:", isMuted);
      }
    }
  }, []);

  // 볼륨 설정 함수
  const changeVolume = (newVolume) => {
    setVolume(Math.max(0, Math.min(1, newVolume))); // 0~1 사이 값으로 제한
    
    // 실시간으로 모든 오디오 요소의 볼륨 조절
    updateAllAudioElements(newVolume, isMuted);
  };

  // 음소거 토글 함수
  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // 실시간으로 모든 오디오 요소의 음소거 상태 조절
    updateAllAudioElements(volume, newMutedState);
  };
  
  // 문서 내의 모든 오디오 요소 업데이트
  const updateAllAudioElements = (vol, muted) => {
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.volume = vol;
      audio.muted = muted;
    });
  };

  // 알림음 재생 함수
  const playNotificationSound = (audioSrc) => {
    if (isMuted) return; // 음소거 상태면 재생하지 않음
    
    try {
      const audio = new Audio(audioSrc);
      audio.volume = volume;
      
      // oncanplaythrough 이벤트 사용하여 로드 완료 후 재생
      audio.oncanplaythrough = () => {
        audio.play()
          .then(() => console.log("알림음 재생 성공"))
          .catch(error => console.error("알림음 재생 실패:", error));
      };
      
      // 로드 오류 처리
      audio.onerror = (error) => {
        console.error("알림음 로드 실패:", error);
      };
    } catch (error) {
      console.error("알림음 생성 실패:", error);
    }
  };

  return (
    <AudioContext.Provider value={{ volume, isMuted, changeVolume, toggleMute, playNotificationSound }}>
      {children}
    </AudioContext.Provider>
  );
};

// 커스텀 훅
export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}; 