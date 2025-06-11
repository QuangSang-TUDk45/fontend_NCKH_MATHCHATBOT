// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    cors: true,
    allowedHosts: [
      'all', // Cho phép tất cả host (bao gồm localhost)
      'zebra-equipped-gelding.ngrok-free.app', // Thêm host ngrok cụ thể
    ],
  },
  envDir: ".",
  envPrefix: "VITE_",
});