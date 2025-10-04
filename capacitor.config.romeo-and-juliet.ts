import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.explainers.romeo-and-juliet',
  appName: 'Romeo and Juliet Explained',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Preferences: {
      singlePlayMode: true,
      playTitle: 'Romeo and Juliet',
      playAuthor: 'William Shakespeare',
      themeType: 'tragedy',
      appName: 'Romeo and Juliet Explained'
    }
  }
};

export default config;