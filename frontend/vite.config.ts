import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// SPA estática: ethers habla directo con MetaMask / RPC público desde el navegador.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
