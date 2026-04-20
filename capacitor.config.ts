import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zflux.app',
  appName: 'Z-Flux',
  webDir: 'public',
  server: {
    url: 'http://192.168.1.7:3000', // ← YOUR IP HERE
    cleartext: true
  }
};

export default config;