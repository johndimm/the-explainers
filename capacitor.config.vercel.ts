import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.explainers.app',
  appName: 'The Explainers',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    url: 'https://the-explainers.vercel.app',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#000000",
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: "dark"
    }
  }
};

export default config;