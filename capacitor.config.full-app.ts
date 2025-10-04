import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.explainers.full-app',
  appName: 'The Explainers',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Preferences: {
      singlePlayMode: false,
      appName: 'The Explainers'
    }
  }
};

export default config;