export const isTestMode = () => process.env.TEST_MODE === '1';

export const testEnv = {
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:4311',
  statusUser: process.env.STATUS_USER || 'test',
  statusPass: process.env.STATUS_PASS || 'test',
};
