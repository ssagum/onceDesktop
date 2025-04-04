const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

module.exports = {
  packagerConfig: {
    asar: true,
    icon: "./src/assets/icons/icon",
    extraResource: [
      "./src/assets/icons/icon.ico",
      "./src/assets/icons/icon.png",
      "./public/icon.ico",
      "./public/icon.png",
      "./public/notification.mp3",
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        setupIcon: "./src/assets/icons/icon.ico", // Windows용 아이콘 (.ico)
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
      config: {
        icon: "./src/assets/icons/icon.icns", // macOS용 아이콘 (.icns)
      },
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    {
      name: "@electron-forge/plugin-webpack",
      config: {
        mainConfig: "./webpack.main.config.js",
        devContentSecurityPolicy: "connect-src 'self' * 'unsafe-eval'",
        renderer: {
          config: "./webpack.renderer.config.js",
          entryPoints: [
            {
              html: "./src/index.html",
              js: "./src/renderer.js",
              name: "main_window",
              preload: {
                js: "./src/preload.js",
              },
            },
            {
              html: "./src/timer.html",
              js: "./src/timer.js",
              name: "timer_window",
              preload: {
                js: "./src/preload.js",
              },
            },
            {
              html: "./src/chat.html",
              js: "./src/chat.js",
              name: "chat_window",
              preload: {
                js: "./src/preload.js",
              },
            },
          ],
        },
        devServer: {
          hot: true,
          client: {
            overlay: false,
            progress: true,
          },
        },
      },
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  config: {
    forge: {
      webPreferences: {
        webSecurity: true,
        contextIsolation: true,
        nodeIntegration: true,
      },
    },
  },
};
