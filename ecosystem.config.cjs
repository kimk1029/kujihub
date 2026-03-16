const path = require('path');

const appDir = process.env.KUJIHUB_APP_DIR || __dirname;
const serverPort = '3000';
const webPort = '8080';

module.exports = {
  apps: [
    {
      name: 'kujihub-server',
      cwd: path.join(appDir, 'server'),
      script: 'index.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: serverPort,
      },
    },
    {
      name: 'kujihub-web',
      cwd: appDir,
      script: 'serve',
      env: {
        PM2_SERVE_PATH: path.join(appDir, 'web', 'dist'),
        PM2_SERVE_PORT: webPort,
        PM2_SERVE_SPA: 'true',
      },
    },
  ],
};
