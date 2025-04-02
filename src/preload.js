// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  openTimerWindow: () => ipcRenderer.send("open-timer-window"),
  openChatWindow: () => ipcRenderer.send("open-chat-window"),
  sendNotification: (message) => {
    ipcRenderer.send("show-notification", message);
  },
  downloadFile: (fileUrl, fileName) => {
    return ipcRenderer.send("download-file", {
      url: fileUrl,
      fileName: fileName,
    });
  },
  onDownloadProgress: (callback) => {
    const progressListener = (event, progress) => callback(progress);
    ipcRenderer.on("download-progress", progressListener);
    return () =>
      ipcRenderer.removeListener("download-progress", progressListener);
  },
  onDownloadComplete: (callback) => {
    const completeListener = (event, result) => callback(result);
    ipcRenderer.on("download-complete", completeListener);
    return () =>
      ipcRenderer.removeListener("download-complete", completeListener);
  },
  testIpc: (message) => {
    console.log("preload.js: testIPC 호출됨", message);
    ipcRenderer.send("test-ipc", message);

    return new Promise((resolve) => {
      ipcRenderer.once("test-ipc-reply", (event, response) => {
        console.log("preload.js: IPC 응답 수신", response);
        alert("IPC 테스트 응답: " + response);
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
    ipcRenderer.on("volume-changed", (_, volume) => callback(volume));
    return () => ipcRenderer.removeListener("volume-changed", callback);
  },
  onMuteChanged: (callback) => {
    ipcRenderer.on("mute-changed", (_, muted) => callback(muted));
    return () => ipcRenderer.removeListener("mute-changed", callback);
  }
});

// 알림 소리 재생을 위한 리스너 - 소리는 App.js에서 재생하므로 여기서는 제거
ipcRenderer.on("play-notification-sound", () => {
  // oscillator 코드 제거 - App.js에서 notification 소리가 이미 재생됨
  console.log("알림 이벤트 수신됨 - 소리는 App.js에서 재생");
});
