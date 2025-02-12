const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withGoogleServiceInfo = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const targetPath = path.join(config.modRequest.platformProjectRoot, 'GoogleService-Info.plist');
      if (process.env.GOOGLE_SERVICE_INFO_PLIST_BASE64) {
        const decodedContent = Buffer.from(process.env.GOOGLE_SERVICE_INFO_PLIST_BASE64, 'base64').toString('utf8');
        fs.writeFileSync(targetPath, decodedContent, 'utf8');
      } else {
        console.warn('GOOGLE_SERVICE_INFO_PLIST_BASE64 secret is not defined');
      }
      return config;
    }
  ]);
};

module.exports = withGoogleServiceInfo;
