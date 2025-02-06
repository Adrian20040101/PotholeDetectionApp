import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    bundleIdentifier: "com.potholedetectionapp.potholedetectionapp",
    config: {
      googleMapsApiKey: process.env.GOOGLE_API_KEY,
    },
  },
  android: {
    ...config.android,
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_API_KEY,
      },
    },
    package: "com.potholedetectionapp.potholedetectionapp",
    googleServicesFile: "./google-services.json",
  },
  extra: {
    googleMapsApiKey: process.env.GOOGLE_API_KEY,
    eas: {
      projectId: "df0e7fdd-3a98-4aa5-bd4a-92d0760d1869",
    },
  },
});
