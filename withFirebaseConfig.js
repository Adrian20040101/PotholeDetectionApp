const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withFirebaseConfig = (config) => {
  return withDangerousMod(config, [
    'node',
    async (config) => {

      const targetPath = path.join(config.modRequest.projectRoot, 'config', 'firebase', 'firebase-config.js');
      
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      if (process.env.FIREBASE_CONFIG_JS_BASE64) {
        const decodedContent = Buffer.from(process.env.FIREBASE_CONFIG_JS_BASE64, 'base64').toString('utf8');
        fs.writeFileSync(targetPath, decodedContent, 'utf8');
        console.log(`Wrote firebase-config.js to: ${targetPath}`);
      } else {
        console.warn('FIREBASE_CONFIG_JS_BASE64 secret is not defined');
      }
      return config;
    }
  ]);
};

module.exports = withFirebaseConfig;
