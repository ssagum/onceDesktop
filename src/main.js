import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  session,
  Tray,
  nativeImage,
  dialog,
  Notification,
} from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import fs from "node:fs";
import { download } from "electron-dl";

const isDevelopment = process.env.NODE_ENV === "development";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// 단일 인스턴스 잠금 구현
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // 두 번째 인스턴스가 실행되었을 때 기존 창을 활성화
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  let mainWindow;
  let tray = null;

  // 창 객체를 전역 변수로 저장
  let timerWindow = null;
  let chatWindow = null;

  const createWindow = () => {
    // Windows 10에서 토스트 알림을 위한 AppUserModelID 설정
    if (process.platform === "win32") {
      app.setAppUserModelId("삼성원스정형외과");
    }

    // CSP 설정 강화 - 개발 환경과 프로덕션 환경에 따라 다른 정책 적용
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      // 개발 환경에서는 웹팩 핫 리로딩을 위해 'unsafe-eval' 허용
      const cspHeader = isDevelopment
        ? "default-src 'self';" +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com;" +
          "connect-src 'self' https://firestore.googleapis.com https://*.googleapis.com wss://*.firebaseio.com ws: webpack: http://*.iparking.co.kr https://*.iparking.co.kr;" +
          "worker-src 'self' blob:;" +
          "img-src 'self' data: blob: https://*.googleapis.com https://*.googleusercontent.com https://*.firebasestorage.app https://firebasestorage.googleapis.com http://*.iparking.co.kr https://*.iparking.co.kr;" +
          "style-src 'self' 'unsafe-inline';" +
          "font-src 'self' data:;" +
          "frame-src 'self' http://members.iparking.co.kr https://members.iparking.co.kr;" +
          "form-action 'self' http://*.iparking.co.kr https://*.iparking.co.kr;"
        : "default-src 'self';" +
          "script-src 'self';" +
          "connect-src 'self' https://firestore.googleapis.com https://*.googleapis.com wss://*.firebaseio.com http://*.iparking.co.kr https://*.iparking.co.kr;" +
          "worker-src 'self' blob:;" +
          "img-src 'self' data: blob: https://*.googleapis.com https://*.googleusercontent.com https://*.firebasestorage.app https://firebasestorage.googleapis.com http://*.iparking.co.kr https://*.iparking.co.kr;" +
          "style-src 'self' 'unsafe-inline';" +
          "font-src 'self' data:;" +
          "frame-src 'self' http://members.iparking.co.kr https://members.iparking.co.kr;" +
          "form-action 'self' http://*.iparking.co.kr https://*.iparking.co.kr;";

      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [cspHeader],
        },
      });
    });

    // Create the browser window.
    mainWindow = new BrowserWindow({
      width: 1360,
      height: 980,
      title: "삼성원스정형외과",
      icon: isDevelopment
        ? path.join(app.getAppPath(), "src/assets/icons", "icon.ico")
        : path.join(
            process.resourcesPath,
            "app.asar",
            "src/assets/icons",
            "icon.ico"
          ),
      webPreferences: {
        preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        sandbox: true,
        webviewTag: true,
      },
    });

    // and load the index.html of the app.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    Menu.setApplicationMenu(null);
    mainWindow.setMenuBarVisibility(false);

    // 창이 닫힐 때 앱이 종료되지 않고 트레이로 최소화
    mainWindow.on("close", (event) => {
      if (!app.isQuitting) {
        event.preventDefault();
        mainWindow.hide();
        return false;
      }
    });

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();
  };

  // 시스템 트레이 아이콘 생성
  function createTray() {
    // 아이콘 경로 설정
    let iconPath;

    if (isDevelopment) {
      // 개발 환경
      iconPath = path.join(app.getAppPath(), "src/assets/icons", "icon.ico");
    } else {
      // 빌드 환경 - 리소스 디렉토리에서 아이콘 찾기
      iconPath = path.join(process.resourcesPath, "icon.ico");

      // 아이콘이 없으면 대체 경로 시도
      if (!fs.existsSync(iconPath)) {
        const possiblePaths = [
          // 리소스 경로
          path.join(process.resourcesPath, "icon.ico"),
          // 기존 경로들
          path.join(
            process.resourcesPath,
            "app.asar",
            "src/assets/icons",
            "icon.ico"
          ),
          path.join(process.resourcesPath, "app.asar", "public", "icon.ico"),
          path.join(app.getPath("exe"), "..", "resources", "icon.ico"),
        ];

        // 존재하는 첫 번째 경로 사용
        iconPath = possiblePaths.find((p) => fs.existsSync(p)) || iconPath;
      }
    }

    try {
      const icon = nativeImage.createFromPath(iconPath);

      if (icon.isEmpty()) {
        // 대체 아이콘 시도 (PNG 파일)
        const pngPath = iconPath.replace(".ico", ".png");
        if (require("fs").existsSync(pngPath)) {
          const pngIcon = nativeImage.createFromPath(pngPath);
          if (!pngIcon.isEmpty()) {
            tray = new Tray(pngIcon);
          } else {
            // 기본 빈 이미지 생성 (16x16 투명 이미지)
            const emptyIcon = nativeImage.createEmpty();
            tray = new Tray(emptyIcon);
          }
        } else {
          const emptyIcon = nativeImage.createEmpty();
          tray = new Tray(emptyIcon);
        }
      } else {
        tray = new Tray(icon);
      }

      const contextMenu = Menu.buildFromTemplate([
        {
          label: "열기",
          click: () => {
            if (mainWindow) {
              mainWindow.show();
            }
          },
        },
        {
          label: "종료",
          click: () => {
            app.isQuitting = true;
            app.quit();
          },
        },
      ]);

      tray.setToolTip("삼성원스프로그램");
      tray.setContextMenu(contextMenu);

      // 트레이 아이콘 클릭 시 앱 표시/숨김 전환
      tray.on("double-click", () => {
        if (mainWindow) {
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
          }
        }
      });
    } catch (error) {
      console.error("트레이 아이콘 생성 실패:", error);
    }
  }

  // 알림 중복 방지를 위한 타임스탬프 저장
  let lastNotificationTime = 0;

  // 오디오 설정 저장 (기본값)
  let audioSettings = {
    volume: 0.7,
    muted: false,
  };

  // Firebase 알림 처리를 위한 IPC 통신
  ipcMain.on("show-notification", (event, message) => {
    // 중복 실행 방지 (500ms 이내 재실행 방지)
    const now = Date.now();
    if (now - lastNotificationTime < 500) {
      console.log("최근에 알림이 표시되어 무시함 (중복 방지)");
      return;
    }

    // 알림 시간 업데이트
    lastNotificationTime = now;

    // Windows 10 토스트 알림 사용
    try {
      if (Notification.isSupported()) {
        const notificationOptions = {
          title: "삼성원스정형외과",
          body: message,
          icon: isDevelopment
            ? path.join(app.getAppPath(), "src/assets/icons", "icon.png")
            : path.join(process.resourcesPath, "icon.png"),
          silent: audioSettings.muted, // 음소거 설정이면 시스템 알림음 끄기
        };

        const notification = new Notification(notificationOptions);

        // 클릭 시 메인 윈도우 표시
        notification.on("click", () => {
          if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
          }
        });

        notification.show();

        // 알림음 재생 여부를 메인 창에 알림 (음소거 상태에 따라)
        event.reply("notification-displayed", { muted: audioSettings.muted });
      } else {
        // 토스트 알림을 지원하지 않는 환경에서는 dialog 사용
        dialog.showMessageBox({
          type: "info",
          title: "삼성원스정형외과",
          message: message,
          buttons: ["확인"],
        });
        event.reply("notification-displayed", { muted: audioSettings.muted });
      }
    } catch (error) {
      console.error("알림 표시 실패:", error);
      // 오류 발생 시 기존 방식으로 대체
      dialog.showMessageBox({
        type: "info",
        title: "삼성원스정형외과",
        message: message,
        buttons: ["확인"],
      });
      event.reply("notification-displayed", { muted: audioSettings.muted });
    }
  });

  // 오디오 볼륨 설정 IPC 핸들러
  ipcMain.on("set-audio-volume", (event, volume) => {
    audioSettings.volume = volume;

    // 모든 창에 볼륨 변경 알림
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send("volume-changed", volume);
      }
    });
  });

  // 오디오 음소거 설정 IPC 핸들러
  ipcMain.on("set-audio-muted", (event, muted) => {
    audioSettings.muted = muted;

    // 모든 창에 음소거 상태 변경 알림
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send("mute-changed", muted);
      }
    });
  });

  // 현재 오디오 설정 가져오기
  ipcMain.handle("get-audio-settings", (event) => {
    return audioSettings;
  });

  // 파일 다운로드 처리
  ipcMain.on("download-file", async (event, { url, fileName }) => {
    if (!mainWindow) return;

    try {
      // 한글 파일명을 위한 인코딩 처리
      const decodedFileName = decodeURIComponent(fileName);

      // 윈도우용 한글 파일명 처리
      const normalizedFileName = Buffer.from(
        decodedFileName,
        "utf8"
      ).toString();

      // 사용자에게 저장할 위치 선택 요청
      const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
        title: "파일 저장",
        defaultPath: path.join(app.getPath("downloads"), normalizedFileName),
        buttonLabel: "저장",
        filters: [{ name: "모든 파일", extensions: ["*"] }],
      });

      // 취소된 경우 처리
      if (canceled || !filePath) {
        mainWindow.webContents.send("download-complete", {
          success: false,
          error: "canceled",
        });
        return;
      }

      if (url.startsWith("http://") || url.startsWith("https://")) {
        // 다운로드 경로의 디렉토리와 파일명을 분리
        const downloadDir = path.dirname(filePath);
        const downloadFileName = Buffer.from(
          path.basename(filePath),
          "utf8"
        ).toString();

        await download(mainWindow, url, {
          filename: downloadFileName,
          directory: downloadDir,
          onProgress: (progress) => {
            mainWindow.webContents.send("download-progress", progress);
          },
        });
        mainWindow.webContents.send("download-complete", {
          success: true,
          filePath,
        });
      } else {
        const sourceFile = url.startsWith("file://") ? url.slice(7) : url;
        fs.copyFile(sourceFile, filePath, (err) => {
          if (err) {
            mainWindow.webContents.send("download-complete", {
              success: false,
              error: err.message,
            });
          } else {
            mainWindow.webContents.send("download-complete", {
              success: true,
              filePath,
            });
          }
        });
      }
    } catch (error) {
      console.error("파일 다운로드 오류:", error);
      mainWindow.webContents.send("download-complete", {
        success: false,
        error: error.message,
      });
    }
  });

  function createTimerWindow() {
    // 이미 창이 열려 있으면 활성화하고 리턴
    if (timerWindow && !timerWindow.isDestroyed()) {
      if (timerWindow.isMinimized()) timerWindow.restore();
      timerWindow.focus();
      return timerWindow;
    }

    // 새 창 생성
    timerWindow = new BrowserWindow({
      width: 800,
      height: 600,
      icon: path.join(app.getAppPath(), "public", "icon.ico"),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: TIMER_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
      backgroundColor: "#000000",
    });

    timerWindow.loadURL(TIMER_WINDOW_WEBPACK_ENTRY);

    // CSP 설정 - 개발 환경과 프로덕션 환경에 따라 다른 정책 적용
    timerWindow.webContents.session.webRequest.onHeadersReceived(
      (details, callback) => {
        // 개발 환경에서는 웹팩 핫 리로딩을 위해 'unsafe-eval' 허용
        const cspHeader = isDevelopment
          ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: webpack:;"
          : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';";

        callback({
          responseHeaders: {
            ...details.responseHeaders,
            "Content-Security-Policy": [cspHeader],
          },
        });
      }
    );

    // if (isDevelopment) {
    //   timerWindow.webContents.openDevTools();
    // }

    // 창이 닫힐 때 참조 제거
    timerWindow.on("closed", () => {
      timerWindow = null;
    });

    return timerWindow;
  }

  function createChatWindow() {
    // 이미 창이 열려 있으면 활성화하고 리턴
    if (chatWindow && !chatWindow.isDestroyed()) {
      if (chatWindow.isMinimized()) chatWindow.restore();
      chatWindow.focus();
      return chatWindow;
    }

    // 새 창 생성
    chatWindow = new BrowserWindow({
      width: 450,
      height: 700,
      icon: path.join(app.getAppPath(), "public", "icon.ico"),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: CHAT_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
      backgroundColor: "#f5f6f8",
    });

    chatWindow.loadURL(CHAT_WINDOW_WEBPACK_ENTRY);

    // CSP 설정 - 개발 환경과 프로덕션 환경에 따라 다른 정책 적용
    chatWindow.webContents.session.webRequest.onHeadersReceived(
      (details, callback) => {
        // 개발 환경에서는 웹팩 핫 리로딩을 위해 'unsafe-eval' 허용
        const cspHeader = isDevelopment
          ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: webpack: https://firestore.googleapis.com https://*.googleapis.com wss://*.firebaseio.com;"
          : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://firestore.googleapis.com https://*.googleapis.com wss://*.firebaseio.com;";

        callback({
          responseHeaders: {
            ...details.responseHeaders,
            "Content-Security-Policy": [cspHeader],
          },
        });
      }
    );

    // 항상 개발 도구 열기
    // chatWindow.webContents.openDevTools();

    // 창이 닫힐 때 이벤트 처리
    chatWindow.on("closed", () => {
      chatWindow = null;
    });

    // 콘솔 로그 출력
    chatWindow.webContents.on("did-finish-load", () => {
      // 로딩 완료 후 창 크기 및 위치 재조정
      chatWindow.setSize(450, 700);
      chatWindow.center();
    });

    chatWindow.webContents.on(
      "console-message",
      (event, level, message, line, sourceId) => {
        console.log(`채팅 창 콘솔 (${level}):`, message);
      }
    );

    return chatWindow;
  }

  // 테스트용 IPC 통신 추가
  ipcMain.on("test-ipc", (event, message) => {
    event.reply("test-ipc-reply", "메인 프로세스에서 응답: " + message);

    // 알림 테스트
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "IPC 테스트",
      message: "IPC 통신 테스트 성공: " + message,
      buttons: ["확인"],
    });
  });

  // IPC 통신 설정
  ipcMain.on("open-timer-window", () => {
    try {
      createTimerWindow();
    } catch (error) {
      console.error("타이머 창 생성 중 오류 발생:", error);
    }
  });

  ipcMain.on("open-chat-window", () => {
    try {
      createChatWindow();
    } catch (error) {
      console.error("채팅 창 생성 중 오류 발생:", error);
    }
  });

  // 알림음 재생 요청 처리
  ipcMain.on("play-notification-sound", (event) => {
    try {
      // 알림음 재생 성공 시 응답
      event.reply("notification-sound-played", { success: true });

      // 알림음은 렌더러에서 처리하므로 여기서는 성공 응답만 보냄
    } catch (error) {
      console.error("알림음 재생 요청 처리 오류:", error);
      event.reply("notification-sound-played", {
        success: false,
        error: error.message,
      });
    }
  });

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    createWindow();
    createTray();

    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });

    // 앱이 시작될 때 Electron 내장 API 사용하여 시작 프로그램에 등록
    app.setLoginItemSettings({
      openAtLogin: true,
      // 시스템 시작 시 창 표시
      openAsHidden: false,
    });
  });

  // 앱이 종료될 때 트레이 아이콘 정리
  app.on("before-quit", () => {
    app.isQuitting = true;
  });

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  // In this file you can include the rest of your app's specific main process
  // code. You can also put them in separate files and import them here.

  // 앱 아이콘 설정 (앱 시작 전에)
  if (isDevelopment) {
    try {
      app.setPath("userData", path.join(app.getAppPath(), "userData"));
      app.whenReady().then(() => {
        const iconPath = path.join(app.getAppPath(), "public", "icon.ico");
        app.dock && app.dock.setIcon(iconPath); // macOS용
      });
    } catch (error) {
      console.error("앱 아이콘 설정 실패:", error);
    }
  } else {
    // 프로덕션 환경에서도 아이콘 설정
    try {
      app.whenReady().then(() => {
        const iconPath = path.join(process.resourcesPath, "icon.ico");
        app.dock && app.dock.setIcon(iconPath); // macOS용
      });
    } catch (error) {
      console.error("프로덕션 앱 아이콘 설정 실패:", error);
    }
  }
}
