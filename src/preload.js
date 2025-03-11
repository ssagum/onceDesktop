// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  openTimerWindow: () => ipcRenderer.send("open-timer-window"),
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
});

// 알림 소리 재생을 위한 리스너
ipcRenderer.on("play-notification-sound", () => {
  // 시스템 비프음 또는 "알림" 소리를 사용
  if (window.Audio) {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = 800;
      oscillator.connect(context.destination);
      oscillator.start();
      setTimeout(() => oscillator.stop(), 300);
    } catch (e) {
      console.error("오디오 재생 실패:", e);
    }
  }
});
