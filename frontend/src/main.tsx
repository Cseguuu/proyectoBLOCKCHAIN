import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { WalletProvider } from "./hooks/useWallet";
import { ToastProvider } from "./components/Toaster";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <WalletProvider>
        <App />
      </WalletProvider>
    </ToastProvider>
  </StrictMode>,
);
