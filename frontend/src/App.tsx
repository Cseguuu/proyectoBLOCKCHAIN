import { useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { WalletBar } from "./components/WalletBar";
import { NetworkGuard } from "./components/NetworkGuard";
import { EventTable } from "./components/EventTable";
import { VerifierView } from "./views/VerifierView";
import { IssuerView } from "./views/IssuerView";
import { AdminView } from "./views/AdminView";

type Tab = "verificar" | "emitir" | "admin";

interface TabDef {
  id: Tab;
  icon: string;
  label: string;
  desc: string;
  requiere: string | null;
}

const TABS: TabDef[] = [
  {
    id: "verificar",
    icon: "🔍",
    label: "Verificar",
    desc: "Comprueba si un documento fue registrado y sigue vigente",
    requiere: null,
  },
  {
    id: "emitir",
    icon: "🖋️",
    label: "Emitir",
    desc: "Registra o revoca documentos como emisor autorizado",
    requiere: "emisor",
  },
  {
    id: "admin",
    icon: "⚙️",
    label: "Admin",
    desc: "Gestiona emisores y transfiere el control del contrato",
    requiere: "admin",
  },
];

export function App() {
  const { rol, address } = useWallet();
  const [tab, setTab] = useState<Tab>("verificar");
  const [lockedHint, setLockedHint] = useState<Tab | null>(null);

  const puedeEmitir = rol === "emisor" || rol === "admin";
  const puedeAdmin = rol === "admin";

  function tabHabilitada(t: TabDef) {
    if (t.id === "verificar") return true;
    if (t.id === "emitir") return puedeEmitir;
    if (t.id === "admin") return puedeAdmin;
    return false;
  }

  const tabActiva: Tab =
    (tab === "emitir" && !puedeEmitir) || (tab === "admin" && !puedeAdmin) ? "verificar" : tab;

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                🔗 Registro de Documentos
              </h1>
              <p className="mt-1.5 text-sm text-muted">
                Sistema de certificación sobre{" "}
                <span className="text-text font-medium">Ethereum Sepolia</span> — el archivo
                nunca sale de tu navegador. Solo se registra su huella digital{" "}
                <span className="font-mono text-accent">keccak256</span> en la blockchain.
              </p>
            </div>
            <span className="hidden shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted sm:block">
              TICS0870 · Grupo 8
            </span>
          </div>
        </header>

        {/* Wallet + Network */}
        <WalletBar />
        <NetworkGuard />

        {/* Onboarding: roles explanation when not connected */}
        {!address && (
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <RoleCard
              icon="🔍"
              title="Verificador"
              badge="Público"
              badgeCls="bg-[#45525f]"
              desc="Cualquier persona puede comprobar si un documento es auténtico, sin wallet ni costo."
            />
            <RoleCard
              icon="🖋️"
              title="Emisor"
              badge="Requiere wallet"
              badgeCls="bg-[#1f6e42]"
              desc="Organizaciones autorizadas por el admin pueden registrar y revocar documentos."
            />
            <RoleCard
              icon="⚙️"
              title="Admin"
              badge="Solo deployer"
              badgeCls="bg-[#5b3fb9]"
              desc="El deployer del contrato puede autorizar emisores y transferir el control."
            />
          </div>
        )}

        {/* Tab navigation */}
        <nav className="mb-5 flex gap-1.5" aria-label="Secciones">
          {TABS.map((t) => {
            const activa = tabActiva === t.id;
            const habilitada = tabHabilitada(t);
            return (
              <div key={t.id} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (habilitada) {
                      setTab(t.id);
                      setLockedHint(null);
                    } else {
                      setLockedHint(lockedHint === t.id ? null : t.id);
                    }
                  }}
                  aria-current={activa}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                    activa
                      ? "bg-accent text-white shadow-sm"
                      : habilitada
                        ? "border border-border text-muted hover:border-accent/50 hover:text-text"
                        : "border border-border/50 text-muted/50 cursor-pointer"
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  {!habilitada && <span className="text-xs opacity-60">🔒</span>}
                </button>

                {/* Tooltip for locked tabs */}
                {lockedHint === t.id && !habilitada && (
                  <div className="absolute left-0 top-full z-10 mt-1.5 w-56 rounded-lg border border-border bg-panel p-3 text-xs shadow-lg">
                    <p className="font-semibold text-text">Acceso restringido</p>
                    <p className="mt-1 text-muted">{t.desc}</p>
                    <p className="mt-2 text-warn">
                      {!address
                        ? "Conecta MetaMask para que el sistema detecte tu rol."
                        : t.id === "emitir"
                          ? "Tu wallet no tiene el rol de emisor. Pídele al admin que te autorice."
                          : "Solo el deployer del contrato tiene acceso."}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Main content */}
        <main className="space-y-5">
          {tabActiva === "verificar" && <VerifierView />}
          {tabActiva === "emitir" && puedeEmitir && <IssuerView />}
          {tabActiva === "admin" && puedeAdmin && <AdminView />}
          <EventTable />
        </main>

        <footer className="mt-10 text-center text-xs text-muted">
          Proyecto final TICS0870 · Grupo 8 "Los Callampines" · Solidity + Foundry + React +
          ethers v6
        </footer>
      </div>
    </div>
  );
}

function RoleCard({
  icon,
  title,
  badge,
  badgeCls,
  desc,
}: {
  icon: string;
  title: string;
  badge: string;
  badgeCls: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-panel p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="font-semibold text-text">{title}</span>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold text-white ${badgeCls}`}>
          {badge}
        </span>
      </div>
      <p className="text-xs text-muted leading-relaxed">{desc}</p>
    </div>
  );
}
