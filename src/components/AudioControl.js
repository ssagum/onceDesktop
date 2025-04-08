import React from "react";
import { useAudio } from "../contexts/AudioContext";
import { FaVolumeUp, FaVolumeMute, FaBell, FaBellSlash } from "react-icons/fa";

const AudioControl = () => {
  const {
    volume,
    muted,
    showNotifications,
    setVolume,
    toggleMute,
    toggleShowNotifications,
  } = useAudio();

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);

    // showNotifications가 false인 경우 음소거 상태를 유지
    if (!showNotifications) {
      if (!muted) toggleMute(true);
      return;
    }

    // 알림이 활성화된 상태에서만 볼륨에 따라 음소거 상태 조절
    if (newVolume > 0 && muted) {
      toggleMute(false); // 음소거 해제
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* 예약 알림 표시 설정 */}
      <div className="mb-3 flex items-center justify-between w-full mt-4 p-3 bg-gray-100 rounded-lg pl-4">
        <div className="flex items-center gap-2">
          {showNotifications ? (
            <FaBell className="text-onceBlue" />
          ) : (
            <FaBellSlash className="text-gray-400" />
          )}
          <span className="text-sm font-medium">알림 표시</span>
        </div>
        <button
          onClick={toggleShowNotifications}
          className={`w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
            showNotifications ? "bg-onceBlue" : "bg-gray-300"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
              showNotifications ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      <div className="flex items-center justify-between w-[170px] mb-2">
        <button
          onClick={toggleMute}
          className={`${
            showNotifications
              ? "text-onceBlue hover:text-blue-700"
              : "text-gray-400"
          } p-2 rounded-full focus:outline-none`}
          aria-label={muted ? "음소거 해제" : "음소거"}
        >
          {muted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
        </button>

        <div
          className={`${
            showNotifications ? "text-onceGray" : "text-gray-400"
          } text-sm font-semibold`}
        >
          {Math.round(volume * 100)}%
        </div>
      </div>

      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleVolumeChange}
        className="w-[160px] h-2 appearance-none bg-gray-200 rounded-lg outline-none cursor-pointer"
        style={{
          // 볼륨 슬라이더 스타일 커스터마이징
          backgroundImage: `linear-gradient(to right, ${
            showNotifications ? "#162D66" : "#9CA3AF"
          } 0%, ${showNotifications ? "#162D66" : "#9CA3AF"} ${
            volume * 100
          }%, #E5E7EB ${volume * 100}%, #E5E7EB 100%)`,
        }}
        aria-label="볼륨 조절"
      />

      <div
        className={`mt-[12px] text-center text-[15px] ${
          showNotifications ? "text-onceGray" : "text-gray-400"
        }`}
      >
        {muted ? "음소거 상태" : "알림 볼륨"}
      </div>
    </div>
  );
};

export default AudioControl;
