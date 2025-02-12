import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: "PotholeDetectionApp",
  slug: "PotholeDetectionApp",
  version: "1.0.0",
  //scheme: "com.potholedetectionapp",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    ...config.ios,
    bundleIdentifier: "com.potholedetectionapp.potholedetectionapp",
    googleServicesFile: "./GoogleService-Info.plist",
    config: {
      googleMapsApiKey: process.env.GOOGLE_API_KEY,
    },
  },
  android: {
    ...config.android,
    package: "com.potholedetectionapp.potholedetectionapp",
    googleServicesFile: "./google-services.json",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    permissions: ["CAMERA"],
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_API_KEY,
      },
    },
  },
  web: {
    ...config.web,
    favicon: "./assets/favicon.png",
  },
  extra: {
    googleMapsApiKey: process.env.GOOGLE_API_KEY,
    eas: {
      projectId: "df0e7fdd-3a98-4aa5-bd4a-92d0760d1869",
    },
  },
});
