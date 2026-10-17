import { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: "com.diegomarques.gestorfinanceiro",
  appName: "Finanças MEI",
  bundledWebRuntime: false,
  npmClient: "npm",
  webDir: "www",
  server: {
    androidScheme: "http",
    cleartext: true
  },
};

export default config;

