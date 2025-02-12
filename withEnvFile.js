const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withEnvFile = (config) => {
  return withDangerousMod(config, [
    'node',
    async (config) => {
      const targetPath = path.join(config.modRequest.projectRoot, '.env');
      if (process.env.ENV_FILE_BASE64) {
        const decodedContent = Buffer.from(process.env.ENV_FILE_BASE64, 'base64').toString('utf8');
        fs.writeFileSync(targetPath, decodedContent, 'utf8');
        console.log(`Wrote .env file to: ${targetPath}`);
      } else {
        console.warn('ENV_FILE_BASE64 secret is not defined');
      }
      return config;
    }
  ]);
};

module.exports = withEnvFile;
