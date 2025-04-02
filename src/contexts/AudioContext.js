import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NOTIFICATION_BASE64, NOTIFICATION_PATHS } from '../assets/sound';

// 오디오 컨텍스트 생성
const AudioContext = createContext();

// 로컬 스토리지 키
const VOLUME_KEY = 'once_audio_volume';
const MUTE_KEY = 'once_audio_mute';

export const AudioProvider = ({ children }) => {
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [audioInstance, setAudioInstance] = useState(null);

  // 초기 오디오 설정 로드
  useEffect(() => {
    const loadAudioSettings = async () => {
      try {
        if (window.electron && window.electron.getAudioSettings) {
          const settings = await window.electron.getAudioSettings();
          console.log('메인 프로세스에서 오디오 설정 로드:', settings);
          setVolume(settings.volume);
          setMuted(settings.muted);
        }
      } catch (error) {
        console.error('오디오 설정 로드 오류:', error);
      }
    };

    loadAudioSettings();
  }, []);

  // 볼륨 변경 리스너 설정
  useEffect(() => {
    if (window.electron && window.electron.receive) {
      // 볼륨 변경 리스너
      window.electron.receive('volume-changed', (newVolume) => {
        console.log('볼륨 변경됨:', newVolume);
        setVolume(newVolume);
        
        // 현재 재생 중인 오디오에 볼륨 적용
        if (audioInstance) {
          audioInstance.volume = newVolume;
        }
      });

      // 음소거 변경 리스너
      window.electron.receive('mute-changed', (newMuted) => {
        console.log('음소거 변경됨:', newMuted);
        setMuted(newMuted);
        
        // 현재 재생 중인 오디오에 음소거 적용
        if (audioInstance) {
          audioInstance.muted = newMuted;
        }
      });
    }

    // 정리 함수
    return () => {
      if (window.electron && window.electron.removeListener) {
        window.electron.removeListener('volume-changed');
        window.electron.removeListener('mute-changed');
      }
    };
  }, [audioInstance]);

  // 볼륨 변경 핸들러
  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume);
    
    // 메인 프로세스에 볼륨 변경 알림
    if (window.electron && window.electron.send) {
      window.electron.send('set-audio-volume', newVolume);
    }
    
    // 현재 재생 중인 오디오에 볼륨 적용
    if (audioInstance) {
      audioInstance.volume = newVolume;
    }
  }, [audioInstance]);

  // 음소거 변경 핸들러
  const handleMuteToggle = useCallback(() => {
    const newMuted = !muted;
    setMuted(newMuted);
    
    // 메인 프로세스에 음소거 변경 알림
    if (window.electron && window.electron.send) {
      window.electron.send('set-audio-muted', newMuted);
    }
    
    // 현재 재생 중인 오디오에 음소거 적용
    if (audioInstance) {
      audioInstance.muted = newMuted;
    }
  }, [muted, audioInstance]);

  // 알림음 재생 함수 - 이전 방식으로 단순화
  const playNotificationSound = useCallback((soundFile) => {
    try {
      console.log('알림음 재생 시도:', soundFile);
      
      // 음소거 상태일 때는 재생하지 않음
      if (muted) {
        console.log('음소거 상태: 알림음 재생 건너뜀');
        return;
      }
      
      // 직접 오디오 생성 및 재생
      const audio = new Audio(soundFile);
      audio.volume = volume;
      
      // 인스턴스 저장
      setAudioInstance(audio);
      
      // 디버깅을 위한 이벤트 리스너
      audio.addEventListener('canplaythrough', () => {
        console.log('알림음 로드 완료, 재생 시작');
        audio.play()
          .then(() => console.log('알림음 재생 성공'))
          .catch(err => console.error('알림음 재생 실패:', err));
      });
      
      audio.addEventListener('error', (e) => {
        console.error('알림음 로드 오류:', e);
      });
      
      // 재생 완료 시 인스턴스 정리
      audio.onended = () => {
        console.log('알림음 재생 완료');
        setAudioInstance(null);
      };
      
      // 명시적 로드 시작
      audio.load();
      
    } catch (error) {
      console.error('알림음 재생 오류:', error);
    }
  }, [volume, muted]);

  const value = {
    volume,
    muted,
    isMuted: muted, // 편의를 위한 별칭
    setVolume: handleVolumeChange,
    toggleMute: handleMuteToggle,
    playNotificationSound
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

// 커스텀 훅
export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}; 