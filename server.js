const app = require('./src/app');
const config = require('./src/config/env');
const logger = require('./src/utils/logger');

const PORT = config.port;

app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    env: config.nodeEnv,
    apiKeyConfigured: !!config.googleMapsApiKey,
  });
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api/extract`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
});
