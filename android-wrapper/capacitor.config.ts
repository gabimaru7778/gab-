import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lowone.assistant',
  appName: 'LOW ONE',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    url: 'https://low-ko7kz4.v2.appdeploy.ai',
    cleartext: false,
  },
};

export default config;
