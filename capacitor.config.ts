import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arc.lifetracker',
  appName: 'Arc',
  webDir: 'out',
  server: {
    url: 'https://crest-weld.vercel.app',
    cleartext: false,
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0D0D12',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      spinnerColor: '#2DD4BF',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0D0D12',
      overlaysWebView: false
    }
  }
};

export default config;
