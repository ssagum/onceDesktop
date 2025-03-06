import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  session,
  Tray,
  nativeImage,
  dialog,
} from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";

const isDevelopment = process.env.NODE_ENV === "development";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow;
let tray = null;

const createWindow = () => {
  // CSP 설정
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self';" +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com;" +
            "connect-src 'self' https://firestore.googleapis.com https://*.googleapis.com wss://*.firebaseio.com;" +
            "worker-src 'self' blob:;" +
            "img-src 'self' data: blob: https://*.googleapis.com https://*.googleusercontent.com https://*.firebasestorage.app https://firebasestorage.googleapis.com;" +
            "style-src 'self' 'unsafe-inline';",
        ],
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
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: true,
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

// Firebase 알림 처리를 위한 IPC 통신
ipcMain.on("show-notification", (event, message) => {
  // 알림음 재생하는 코드 실행
  mainWindow.webContents.send("play-notification-sound");

  // 시스템 알림 표시 (선택사항)
  dialog.showMessageBox({
    type: "info",
    title: "새 알림",
    message: message,
    buttons: ["확인"],
  });
});

function createTimerWindow() {
  const timerWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(app.getAppPath(), "public", "icon.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: TIMER_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
    backgroundColor: "#000000",
  });

  timerWindow.loadURL(TIMER_WINDOW_WEBPACK_ENTRY);

  // CSP 설정 추가
  timerWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
          ],
        },
      });
    }
  );

  if (isDevelopment) {
    timerWindow.webContents.openDevTools();
  }
}

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
