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
  // mainWindow.webContents.openDevTools();
};

// 시스템 트레이 아이콘 생성
function createTray() {
  // 트레이 아이콘 이미지 (build 폴더에 icon.png 파일을 추가해야 함)
  const iconPath = path.join(__dirname, "icon.png");
  const trayIcon = nativeImage.createFromPath(iconPath);

  tray = new Tray(trayIcon);

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
    webPreferences: {
      nodeIntegration: false, // 보안을 위해 false로 설정
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
