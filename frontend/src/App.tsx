import { useMemo, useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { WalletBar } from "./components/WalletBar";
import { NetworkGuard } from "./components/NetworkGuard";
import { EventTable } from "./components/EventTable";
import { VerifierView } from "./views/VerifierView";
import { IssuerView } from "./views/IssuerView";
import { AdminView } from "./views/AdminView";
import { CONTRACT_ADDRESS } from "./lib/contract";

type Tab = "verificar" | "emitir" | "admin";

export function App() {
  const { rol, contractAddress } = useWallet();
  const [tab, setTab] = useState<Tab>("verificar");

  const puedeEmitir = rol === "emisor" || rol === "admin";
  const puedeAdmin = rol === "admin";

  // Tabs visibles según el rol actual.
  const tabs = useMemo(() => {
    const t: { id: Tab; label: string }[] = [{ id: "verificar", label: "🔍 Verificar" }];
    if (puedeEmitir) t.push({ id: "emitir", label: "🖋️ Emitir" });
    if (puedeAdmin) t.push({ id: "admin", label: "⚙️ Admin" });
    return t;
  }, [puedeEmitir, puedeAdmin]);

  // Si el rol pierde acceso a la pestaña activa, volver a "verificar".
  const tabActiva: Tab = tabs.some((t) => t.id === tab) ? tab : "verificar";

  const sinContrato = !contractAddress || rol === "sin-contrato";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">🔗 Registro de Documentos en Blockchain</h1>
        <p className="mt-1 text-sm text-muted">
          Verificación de autenticidad sobre Ethereum Sepolia — TICS0870. El archivo nunca sale de
          tu navegador: solo se registra su hash <span className="font-mono">keccak256</span>.
        </p>
      </header>

      <WalletBar />
      <NetworkGuard />

      {sinContrato && (
        <div className="mb-4 rounded-lg border border-bad/60 bg-bad/10 px-4 py-3 text-sm">
          ⚠️ No hay un contrato válido configurado{" "}
          {!CONTRACT_ADDRESS && "(falta VITE_CONTRACT_ADDRESS)"}. Ábrelo en{" "}
          <strong>⚙️ Contrato</strong> y pega la dirección de la v2 desplegada en Sepolia.
        </div>
      )}

      <nav className="mb-4 flex gap-2" aria-label="Secciones">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-current={tabActiva === t.id}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              tabActiva === t.id
                ? "bg-accent text-white"
                : "border border-border text-muted hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="space-y-4">
        {tabActiva === "verificar" && <VerifierView />}
        {tabActiva === "emitir" && puedeEmitir && <IssuerView />}
        {tabActiva === "admin" && puedeAdmin && <AdminView />}
        <EventTable />
      </main>

      <footer className="mt-8 text-center text-xs text-muted">
        Proyecto final TICS0870 · Grupo 8 · Solidity + Foundry + React + ethers v6
      </footer>
    </div>
  );
}
