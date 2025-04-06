// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electron", {
  sendNotification: (message) => {
    return ipcRenderer.send("show-notification", message);
  },
  send: (channel, data) => {
    // 허용된 채널 목록
    let validChannels = [
      "test-ipc",
      "open-timer-window",
      "open-chat-window",
      "download-file",
      "set-audio-volume",
      "set-audio-muted",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    // 허용된 채널 목록
    let validChannels = [
      "test-ipc-reply",
      "download-progress",
      "download-complete",
      "volume-changed",
      "mute-changed",
      "notification-displayed",
    ];
    if (validChannels.includes(channel)) {
      // 이전 리스너 제거 (중복 방지)
      ipcRenderer.removeAllListeners(channel);

      // 새 리스너 추가
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  removeListener: (channel, func) => {
    let validChannels = [
      "test-ipc-reply",
      "download-progress",
      "download-complete",
      "volume-changed",
      "mute-changed",
      "notification-displayed",
    ];
    if (validChannels.includes(channel)) {
      if (func) {
        ipcRenderer.removeListener(channel, func);
      } else {
        ipcRenderer.removeAllListeners(channel);
      }
    }
  },
  // 오디오 설정 가져오기
  getAudioSettings: async () => {
    return await ipcRenderer.invoke("get-audio-settings");
  },

  // === 이전 API와의 호환성 유지를 위한 함수들 ===
  openTimerWindow: () => ipcRenderer.send("open-timer-window"),
  openChatWindow: () => ipcRenderer.send("open-chat-window"),
  downloadFile: (fileUrl, fileName) => {
    return ipcRenderer.send("download-file", {
      url: fileUrl,
      fileName: fileName,
    });
  },
  onDownloadProgress: (callback) => {
    // 이전 리스너 제거
    ipcRenderer.removeAllListeners("download-progress");

    // 새 리스너 등록
    ipcRenderer.on("download-progress", (event, progress) =>
      callback(progress)
    );

    // 정리 함수 반환
    return () => ipcRenderer.removeListener("download-progress", callback);
  },
  onDownloadComplete: (callback) => {
    // 이전 리스너 제거
    ipcRenderer.removeAllListeners("download-complete");

    // 새 리스너 등록
    ipcRenderer.on("download-complete", (event, result) => callback(result));

    // 정리 함수 반환
    return () => ipcRenderer.removeListener("download-complete", callback);
  },
  testIpc: (message) => {
    ipcRenderer.send("test-ipc", message);

    return new Promise((resolve) => {
      ipcRenderer.once("test-ipc-reply", (event, response) => {
        resolve(response);
      });
    });
  },
  setAudioVolume: (volume) => {
    ipcRenderer.send("set-audio-volume", volume);
  },
  setAudioMuted: (muted) => {
    ipcRenderer.send("set-audio-muted", muted);
  },
  onVolumeChanged: (callback) => {
    // 이전 리스너 제거
    ipcRenderer.removeAllListeners("volume-changed");

    // 새 리스너 등록
    ipcRenderer.on("volume-changed", (_, volume) => callback(volume));

    // 정리 함수 반환
    return () => ipcRenderer.removeListener("volume-changed", callback);
  },
  onMuteChanged: (callback) => {
    // 이전 리스너 제거
    ipcRenderer.removeAllListeners("mute-changed");

    // 새 리스너 등록
    ipcRenderer.on("mute-changed", (_, muted) => callback(muted));

    // 정리 함수 반환
    return () => ipcRenderer.removeListener("mute-changed", callback);
  },
  // 알림음 재생 요청 함수 추가
  playNotificationSound: () => {
    ipcRenderer.send("play-notification-sound");

    // 이벤트 응답 처리를 위한 Promise 반환
    return new Promise((resolve) => {
      ipcRenderer.once("notification-sound-played", (_, result) => {
        resolve(result);
      });
    });
  },
});

// 알림 소리 재생을 위한 리스너 - 소리는 App.js에서 재생하므로 여기서는 제거
ipcRenderer.on("play-notification-sound", () => {
  // oscillator 코드 제거 - App.js에서 notification 소리가 이미 재생됨
  console.log("알림 이벤트 수신됨 - 소리는 App.js에서 재생");
});
