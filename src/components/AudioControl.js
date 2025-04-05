import React from "react";
import { useAudio } from "../contexts/AudioContext";
import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";

const AudioControl = () => {
  const { volume, muted, setVolume, toggleMute } = useAudio();

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center justify-between w-full mb-2">
        <button
          onClick={toggleMute}
          className="text-onceBlue hover:text-blue-700 p-2 rounded-full focus:outline-none"
          aria-label={muted ? "음소거 해제" : "음소거"}
        >
          {muted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
        </button>

        <div className="text-onceGray text-sm font-semibold">
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
        className="w-full h-2 appearance-none bg-gray-200 rounded-lg outline-none cursor-pointer"
        style={{
          // 볼륨 슬라이더 스타일 커스터마이징
          backgroundImage: `linear-gradient(to right, #162D66 0%, #162D66 ${
            volume * 100
          }%, #E5E7EB ${volume * 100}%, #E5E7EB 100%)`,
        }}
        disabled={muted}
        aria-label="볼륨 조절"
      />

      <div className="mt-[12px] text-center text-[15px] text-onceGray">
        {muted ? "음소거 상태" : "알림 볼륨"}
      </div>
    </div>
  );
};

export default AudioControl;
