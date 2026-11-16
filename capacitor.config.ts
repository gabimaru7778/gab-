import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ai.low.personal",
  appName: "LOW",
  webDir: "dist",
  server: {
    androidScheme: "https"
  }
};

export default config;
