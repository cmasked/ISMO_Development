const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://ismo-development.onrender.com/api';
const e2e = process.env.ISMO_E2E === 'true' && process.env.CI === 'true';
const url = new URL(apiUrl);
if ((!e2e && url.protocol !== 'https:') || (e2e && !['https:', 'http:'].includes(url.protocol)) || url.username || url.password || url.pathname.replace(/\/$/, '') !== '/api') {
  throw new Error('Configure a public HTTPS API URL ending in /api.');
}
module.exports = {
  expo: {
    name: 'ISMO', slug: 'ismo-projects', version: '1.0.0', orientation: 'default',
    userInterfaceStyle: 'automatic', newArchEnabled: true,
    android: {
      package: e2e ? 'com.ismo.projects.e2e' : 'com.ismo.projects',
      versionCode: 1, softwareKeyboardLayoutMode: 'resize',
      permissions: [], blockedPermissions: ['android.permission.RECORD_AUDIO', 'android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE', 'android.permission.SYSTEM_ALERT_WINDOW']
    },
    plugins: ['expo-secure-store', ['expo-build-properties', { android: { usesCleartextTraffic: e2e } }]],
    extra: { apiBaseUrl: apiUrl }
  }
};
