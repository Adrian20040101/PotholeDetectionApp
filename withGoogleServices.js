const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withGoogleServices = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const targetPath = path.join(config.modRequest.platformProjectRoot, 'google-services.json');
      if (process.env.GOOGLE_SERVICES_JSON_BASE64) {
        const decodedContent = Buffer.from(process.env.GOOGLE_SERVICES_JSON_BASE64, 'base64').toString('utf8');
        fs.writeFileSync(targetPath, decodedContent, 'utf8');
        console.log(`Wrote google-services.json to: ${targetPath}`);
      } else {
        console.warn('GOOGLE_SERVICES_JSON_BASE64 secret is not defined');
      }
      return config;
    }
  ]);
};

module.exports = withGoogleServices;
