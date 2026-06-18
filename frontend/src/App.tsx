import { useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { WalletBar } from "./components/WalletBar";
import { NetworkGuard } from "./components/NetworkGuard";
import { EventTable } from "./components/EventTable";
import { VerifierView } from "./views/VerifierView";
import { IssuerView } from "./views/IssuerView";
import { AdminView } from "./views/AdminView";

type Tab = "verificar" | "emitir" | "admin";

export function App() {
  const { rol, address } = useWallet();
  const [tab, setTab] = useState<Tab>("verificar");

  const puedeEmitir = rol === "emisor" || rol === "admin";
  const puedeAdmin = rol === "admin";

  // Solo se muestran las pestañas que el rol actual puede usar (progressive disclosure).
  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: "verificar", icon: "🔍", label: "Verificar" },
  ];
  if (puedeEmitir) tabs.push({ id: "emitir", icon: "🖋️", label: "Emitir" });
  if (puedeAdmin) tabs.push({ id: "admin", icon: "⚙️", label: "Admin" });

  // Si el rol pierde acceso a la pestaña activa (ej: desconecta wallet), volver a verificar.
  const tabActiva: Tab = tabs.some((t) => t.id === tab) ? tab : "verificar";

  // La wallet conectada no tiene permisos especiales (solo puede verificar).
  const walletSinPermisos = !!address && rol === "verificador";

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">🔗 Registro de Documentos</h1>
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

        {/* Onboarding: explicación de roles solo cuando NO hay wallet conectada */}
        {!address && (
          <div className="mb-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
              ¿Quién puede hacer qué?
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <RoleCard
                icon="🔍"
                title="Verificador"
                badge="Tú, ahora"
                badgeCls="bg-[#45525f]"
                desc="Cualquier persona comprueba si un documento es auténtico. Gratis y sin wallet — es lo que puedes hacer en esta pantalla."
              />
              <RoleCard
                icon="🖋️"
                title="Emisor"
                badge="Conecta wallet"
                badgeCls="bg-[#1f6e42]"
                desc="Organizaciones autorizadas por el admin registran y revocan documentos. Las funciones aparecen al conectar una wallet emisora."
              />
              <RoleCard
                icon="⚙️"
                title="Admin"
                badge="Conecta wallet"
                badgeCls="bg-[#5b3fb9]"
                desc="El dueño del contrato autoriza emisores y traspasa el control. No emite documentos: gestiona quién puede hacerlo."
              />
            </div>
          </div>
        )}

        {/* Aviso: wallet conectada sin permisos especiales */}
        {walletSinPermisos && (
          <div className="mb-5 rounded-lg border border-border bg-panel/60 px-4 py-3 text-sm text-muted">
            ℹ️ Esta wallet puede <strong className="text-text">verificar documentos</strong>, pero
            no es emisor ni admin. Para emitir documentos necesitas que el admin del contrato
            autorice tu dirección.
          </div>
        )}

        {/* Navegación por pestañas — solo aparece si hay más de una disponible */}
        {tabs.length > 1 && (
          <nav className="mb-5 flex gap-1.5" aria-label="Secciones">
            {tabs.map((t) => {
              const activa = tabActiva === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  aria-current={activa}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                    activa
                      ? "bg-accent text-white shadow-sm"
                      : "border border-border text-muted hover:border-accent/50 hover:text-text"
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Contenido principal */}
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
