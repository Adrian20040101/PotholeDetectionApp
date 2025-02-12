const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAppJsonSecret = (config) => {
  return withDangerousMod(config, [
    'node',
    async (config) => {
      const targetPath = path.join(config.modRequest.projectRoot, 'app.json');
      
      if (process.env.APP_JSON_BASE64) {
        const decodedContent = Buffer.from(process.env.APP_JSON_BASE64, 'base64').toString('utf8');
        fs.writeFileSync(targetPath, decodedContent, 'utf8');
        console.log(`Wrote app.json to: ${targetPath}`);
      } else {
        console.warn('APP_JSON_BASE64 secret is not defined');
      }
      return config;
    }
  ]);
};

module.exports = withAppJsonSecret;
