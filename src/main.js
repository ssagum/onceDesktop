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
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 두 번째 인스턴스가 실행되었을 때 기존 창을 활성화
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  let mainWindow;
  let tray = null;

  const createWindow = () => {
    // Windows 10에서 토스트 알림을 위한 AppUserModelID 설정
    if (process.platform === 'win32') {
      app.setAppUserModelId("삼성원스정형외과");
    }
    
    // CSP 설정 강화 - 개발 환경과 프로덕션 환경에 따라 다른 정책 적용
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      // 개발 환경에서는 웹팩 핫 리로딩을 위해 'unsafe-eval' 허용
      const cspHeader = isDevelopment
        ? "default-src 'self';" +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com;" +
          "connect-src 'self' https://firestore.googleapis.com https://*.googleapis.com wss://*.firebaseio.com ws: webpack:;" +
          "worker-src 'self' blob:;" +
          "img-src 'self' data: blob: https://*.googleapis.com https://*.googleusercontent.com https://*.firebasestorage.app https://firebasestorage.googleapis.com;" +
          "style-src 'self' 'unsafe-inline';" +
          "font-src 'self' data:;"
        : "default-src 'self';" +
          "script-src 'self';" +
          "connect-src 'self' https://firestore.googleapis.com https://*.googleapis.com wss://*.firebaseio.com;" +
          "worker-src 'self' blob:;" +
          "img-src 'self' data: blob: https://*.googleapis.com https://*.googleusercontent.com https://*.firebasestorage.app https://firebasestorage.googleapis.com;" +
          "style-src 'self' 'unsafe-inline';" +
          "font-src 'self' data:;";

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
    mainWindow.webContents.openDevTools();
  };

  // 시스템 트레이 아이콘 생성
  function createTray() {
    // 아이콘 경로 설정
    let iconPath;

    if (isDevelopment) {
      // 개발 환경
      iconPath = path.join(app.getAppPath(), "src/assets/icons", "icon.ico");
      console.log("개발 환경 아이콘 경로:", iconPath);
    } else {
      // 빌드 환경 - 여러 가능한 경로 시도
      const possiblePaths = [
        // 기존 경로
        path.join(
          process.resourcesPath,
          "app.asar",
          "src/assets/icons",
          "icon.ico"
        ),
        // public 폴더에서 시도
        path.join(process.resourcesPath, "app.asar", "public", "icon.ico"),
        // 최상위 리소스 디렉토리에서 시도
        path.join(process.resourcesPath, "icon.ico"),
        // 실행 파일 경로 기준
        path.join(app.getPath("exe"), "..", "resources", "icon.ico"),
      ];

      // 존재하는 첫 번째 경로 사용
      const fs = require("fs");
      iconPath = possiblePaths.find((p) => {
        const exists = fs.existsSync(p);
        console.log(`경로 확인: ${p} - ${exists ? "존재함" : "존재하지 않음"}`);
        return exists;
      });

      // 모든 경로가 실패하면 기본 경로 사용
      if (!iconPath) {
        console.warn("어떤 아이콘 경로도 존재하지 않음, 기본 경로 사용");
        iconPath = path.join(
          process.resourcesPath,
          "app.asar",
          "src/assets/icons",
          "icon.ico"
        );
      }
    }

    try {
      console.log("최종 트레이 아이콘 경로:", iconPath);
      const icon = nativeImage.createFromPath(iconPath);

      if (icon.isEmpty()) {
        console.error("생성된 nativeImage가 비어 있습니다!");
        // 대체 아이콘 시도 (PNG 파일)
        const pngPath = iconPath.replace(".ico", ".png");
        console.log("PNG 아이콘 시도:", pngPath);
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
  
  // Firebase 알림 처리를 위한 IPC 통신
  ipcMain.on("show-notification", (event, message) => {
    console.log("알림 요청 받음:", message);
    
    // 중복 실행 방지 (500ms 이내 재실행 방지)
    const now = Date.now();
    if (now - lastNotificationTime < 500) {
      console.log("최근에 알림이 표시되어 무시함 (중복 방지)");
      return;
    }
    
    // 알림 시간 업데이트
    lastNotificationTime = now;
    
    // 가장 단순한 방법으로 dialog만 사용하여 알림 표시
    if (mainWindow) {
      try {
        dialog.showMessageBox({
          type: "info",
          title: "호출 알림",
          message: message,
          buttons: ["확인"],
        });
        console.log("알림 표시됨 (dialog 사용)");
      } catch (error) {
        console.error("dialog 표시 실패:", error);
      }
    } else {
      console.error("메인 창이 없음, 알림을 표시할 수 없습니다.");
    }
  });

  // 파일 다운로드 처리
  ipcMain.on("download-file", async (event, { url, fileName }) => {
    if (!mainWindow) return;

    try {
      // 한글 파일명을 위한 인코딩 처리
      const decodedFileName = decodeURIComponent(fileName);

      // 윈도우용 한글 파일명 처리
      const normalizedFileName = Buffer.from(decodedFileName, "utf8").toString();

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
    const timerWindow = new BrowserWindow({
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

    if (isDevelopment) {
      timerWindow.webContents.openDevTools();
    }
  }

  // 테스트용 IPC 통신 추가
  ipcMain.on("test-ipc", (event, message) => {
    console.log("테스트 IPC 메시지 수신:", message);
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
    createTimerWindow();
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
  }
}
