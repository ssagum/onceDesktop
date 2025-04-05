import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NOTIFICATION_BASE64, NOTIFICATION_PATHS } from '../assets/sound';

// 오디오 컨텍스트 생성
const AudioContext = createContext();

// 로컬 스토리지 키
const VOLUME_KEY = 'once_audio_volume';
const MUTE_KEY = 'once_audio_mute';

// 로컬 스토리지에서 안전하게 값을 읽는 헬퍼 함수
const loadFromLocalStorage = (key, defaultValue) => {
  try {
    const savedValue = localStorage.getItem(key);
    if (savedValue !== null) {
      // 'true'/'false' 문자열은 boolean으로, 나머지는 float으로 파싱
      if (savedValue === 'true') return true;
      if (savedValue === 'false') return false;
      return parseFloat(savedValue);
    }
  } catch (e) {
    console.error(`로컬 스토리지에서 ${key} 불러오기 실패:`, e);
  }
  return defaultValue;
};

export const AudioProvider = ({ children }) => {
  // 1. 초기 상태 설정: 로컬 스토리지 값 우선
  const [volume, setVolumeState] = useState(() => {
    const initialVolume = loadFromLocalStorage(VOLUME_KEY, 0.7);
    console.log('초기 볼륨 로드 (로컬 스토리지):', initialVolume);
    return initialVolume;
  });

  const [muted, setMutedState] = useState(() => {
    const initialVolume = loadFromLocalStorage(VOLUME_KEY, 0.7); // 볼륨 먼저 확인
    const initialMuted = loadFromLocalStorage(MUTE_KEY, false);
    // 볼륨이 0이면 무조건 음소거
    const finalMuted = initialVolume === 0 ? true : initialMuted;
    console.log(`초기 음소거 로드 (로컬 스토리지): ${initialMuted}, 최종 결정: ${finalMuted} (볼륨 ${initialVolume})`);
    return finalMuted;
  });

  const [audioInstance, setAudioInstance] = useState(null);

  // 2. Electron 설정 로드 (컴포넌트 마운트 시 1회 실행)
  useEffect(() => {
    const loadElectronSettings = async () => {
      if (window.electron && window.electron.getAudioSettings) {
        try {
          console.log('Electron 설정 로드 시도...');
          const settings = await window.electron.getAudioSettings();
          console.log('Electron에서 받은 설정:', settings);

          // 로컬 스토리지에 볼륨 및 음소거 설정이 있는지 확인
          const hasVolumeInStorage = localStorage.getItem(VOLUME_KEY) !== null;
          const hasMutedInStorage = localStorage.getItem(MUTE_KEY) !== null;
          
          console.log('로컬 스토리지 설정 존재 여부 - 볼륨:', hasVolumeInStorage, ', 음소거:', hasMutedInStorage);

          // 로컬 스토리지에 볼륨 설정이 없는 경우에만 Electron 볼륨 설정 적용
          if (!hasVolumeInStorage) {
            console.log('로컬 스토리지에 볼륨 설정이 없어 Electron 설정 적용:', settings.volume);
            const electronVolume = settings.volume;
            setVolumeState(electronVolume);
            localStorage.setItem(VOLUME_KEY, electronVolume.toString());
          } else {
            console.log('로컬 스토리지 볼륨 설정 유지:', volume);
          }

          // 로컬 스토리지에 음소거 설정이 없는 경우에만 Electron 음소거 설정 적용
          if (!hasMutedInStorage) {
            // 볼륨이 0이면 자동으로 음소거 설정
            const volumeToCheck = hasVolumeInStorage ? volume : settings.volume;
            const electronMuted = volumeToCheck === 0 ? true : settings.muted;
            
            console.log('로컬 스토리지에 음소거 설정이 없어 Electron 설정 적용:', electronMuted);
            setMutedState(electronMuted);
            localStorage.setItem(MUTE_KEY, electronMuted.toString());
          } else {
            console.log('로컬 스토리지 음소거 설정 유지:', muted);
          }

          console.log('설정 로드 완료 - 최종 볼륨:', volume, ', 최종 음소거:', muted);
        } catch (error) {
          console.error('Electron 오디오 설정 로드 오류:', error);
        }
      }
    };
    loadElectronSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. 볼륨 변경 핸들러
  const setVolume = useCallback((newVolume) => {
    const volumeValue = Math.max(0, Math.min(1, newVolume)); // 0과 1 사이 값 보장
    console.log(`볼륨 변경 요청: ${newVolume} -> ${volumeValue}`);
    
    // 상태 업데이트
    setVolumeState(volumeValue);
    
    // 로컬 스토리지 저장
    try {
      localStorage.setItem(VOLUME_KEY, volumeValue.toString());
      console.log('볼륨 로컬 스토리지에 저장:', volumeValue);
    } catch (e) {
      console.error('볼륨 로컬 스토리지 저장 실패:', e);
    }

    // 볼륨이 0이면 자동으로 음소거 처리
    if (volumeValue === 0 && !muted) {
      console.log('볼륨 0, 자동 음소거 실행');
      toggleMute(true); // 음소거 상태 및 로컬 스토리지 업데이트 포함
    }

    // Electron에 변경 알림
    if (window.electron && window.electron.send) {
      window.electron.send('set-audio-volume', volumeValue);
    }

    // 오디오 인스턴스에 적용
    if (audioInstance) {
      audioInstance.volume = volumeValue;
    }
  }, [muted, audioInstance]); // toggleMute 의존성 제거 (아래 toggleMute에서 처리)

  // 4. 음소거 토글 핸들러
  const toggleMute = useCallback((forceMute) => {
    // forceMute가 boolean이면 그 값을 사용, 아니면 현재 상태 토글
    const newMuted = typeof forceMute === 'boolean' ? forceMute : !muted;
    console.log(`음소거 토글 요청: ${forceMute} -> ${newMuted}`);

    // 볼륨이 0인데 음소거 해제 시도는 무시 (항상 음소거 상태 유지)
    if (volume === 0 && !newMuted) {
        console.log('볼륨이 0이므로 음소거 해제 불가');
        return; 
    }

    // 상태 업데이트
    setMutedState(newMuted);

    // 로컬 스토리지 저장
    try {
      localStorage.setItem(MUTE_KEY, newMuted.toString());
      console.log('음소거 상태 로컬 스토리지에 저장:', newMuted);
    } catch (e) {
      console.error('음소거 상태 로컬 스토리지 저장 실패:', e);
    }

    // Electron에 변경 알림
    if (window.electron && window.electron.send) {
      window.electron.send('set-audio-muted', newMuted);
    }

    // 오디오 인스턴스에 적용
    if (audioInstance) {
      audioInstance.muted = newMuted;
    }
  }, [muted, volume, audioInstance]); // volume 의존성 추가

  // 5. Electron 외부 변경 리스너
  useEffect(() => {
    const handleVolumeChange = (event, newVolume) => {
      // 수신된 값 유효성 검사
      if (typeof newVolume === 'undefined') {
        console.error('Electron 외부 볼륨 변경 감지 오류: 수신된 볼륨 값이 undefined입니다.');
        return; // 처리 중단
      }
      console.log('Electron 외부 볼륨 변경 감지:', newVolume);
      
      // 값 범위 보정 (추가적인 안정성)
      const volumeValue = Math.max(0, Math.min(1, parseFloat(newVolume))); 
      
      setVolumeState(volumeValue);
      localStorage.setItem(VOLUME_KEY, volumeValue.toString());
      if (volumeValue === 0 && !muted) {
        setMutedState(true);
        localStorage.setItem(MUTE_KEY, 'true');
      }
      if (audioInstance) audioInstance.volume = volumeValue;
    };

    const handleMuteChange = (event, newMuted) => {
      // 수신된 값 유효성 검사
      if (typeof newMuted === 'undefined') {
        console.error('Electron 외부 음소거 변경 감지 오류: 수신된 음소거 값이 undefined입니다.');
        return; // 처리 중단
      }
      console.log('Electron 외부 음소거 변경 감지:', newMuted);
      
      // boolean 값으로 변환 시도 (추가적인 안정성)
      const isMuted = newMuted === true || newMuted === 'true';

      // 볼륨 0이면 강제 음소거
      const finalMuted = volume === 0 ? true : isMuted;
      setMutedState(finalMuted);
      localStorage.setItem(MUTE_KEY, finalMuted.toString());
      if (audioInstance) audioInstance.muted = finalMuted;
    };

    if (window.electron && window.electron.receive) {
      window.electron.receive('volume-changed', handleVolumeChange);
      window.electron.receive('mute-changed', handleMuteChange);
      console.log('Electron 외부 변경 리스너 등록');
    }

    return () => {
      if (window.electron && window.electron.removeListener) {
        window.electron.removeListener('volume-changed', handleVolumeChange);
        window.electron.removeListener('mute-changed', handleMuteChange);
        console.log('Electron 외부 변경 리스너 제거');
      }
    };
  }, [audioInstance, volume, muted]); // volume, muted 의존성 추가

  // 6. 알림음 재생 함수 (변경 없음)
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

  // 7. 컨텍스트 값 제공
  const value = {
    volume,
    muted,
    isMuted: muted,
    setVolume, // 핸들러 함수 직접 제공
    toggleMute, // 핸들러 함수 직접 제공
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