import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kairos.lifetracker',
  appName: 'Kairos',
  webDir: 'out',
  server: {
    url: 'https://withkairos.app',
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
      spinnerColor: '#64b4a0',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'dark',
      backgroundColor: '#0D0D12'
    },
    Keyboard: {
      resize: 'none',
      resizeOnFullScreen: false
    }
  }
};

export default config;
