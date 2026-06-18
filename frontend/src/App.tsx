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
        <header className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                🎓 Validador de Certificados UAI
              </h1>
              <p className="mt-1.5 text-sm text-muted">
                Comprueba la autenticidad de certificados académicos de la Universidad Adolfo
                Ibáñez (alumno regular, título, notas) usando{" "}
                <span className="text-text font-medium">Ethereum Sepolia</span>. El certificado
                nunca se sube — solo se compara su huella digital{" "}
                <span className="font-mono text-accent">keccak256</span> con el registro
                inmutable en blockchain.
              </p>
            </div>
            <span className="hidden shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted sm:block">
              TICS0870 · Grupo 8
            </span>
          </div>

          {/* Disclaimer: prototipo, no oficial */}
          <p className="mt-3 rounded-md border border-warn/30 bg-warn/5 px-3 py-2 text-xs text-muted">
            ⚠️ <strong className="text-text">Prototipo académico.</strong> No es un servicio
            oficial de la Universidad Adolfo Ibáñez; el emisor "Registro Académico UAI" está
            simulado con fines demostrativos para el curso TICS0870.
          </p>
        </header>

        {/* Wallet + Network */}
        <WalletBar />
        <NetworkGuard />

        {/* Onboarding: cómo funciona + roles, solo cuando NO hay wallet conectada */}
        {!address && (
          <>
            {/* Flujo guiado: la historia del caso de uso */}
            <div className="mb-6 rounded-xl border border-border bg-panel p-5">
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted">
                ¿Cómo funciona?
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <FlowStep
                  n={1}
                  icon="🏛️"
                  title="UAI emite"
                  desc="El Registro Académico de la UAI registra la huella del certificado en la blockchain al momento de emitirlo."
                />
                <FlowStep
                  n={2}
                  icon="🎓"
                  title="El alumno recibe"
                  desc="El estudiante recibe su certificado en PDF, idéntico al de siempre. La prueba de autenticidad ya quedó on-chain."
                />
                <FlowStep
                  n={3}
                  icon="✅"
                  title="Un tercero verifica"
                  desc="Un empleador o embajada arrastra el PDF aquí y confirma en segundos que es auténtico, sin llamar a la universidad."
                />
              </div>
            </div>

            <div className="mb-6">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
                ¿Quién es quién?
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <RoleCard
                  icon="🔍"
                  title="Verificador"
                  badge="Tú, ahora"
                  badgeCls="bg-[#45525f]"
                  desc="Empleador, embajada o institución que recibe un certificado y quiere confirmar que es auténtico. Gratis y sin wallet."
                />
                <RoleCard
                  icon="🏛️"
                  title="Emisor (Registro UAI)"
                  badge="Conecta wallet"
                  badgeCls="bg-[#1f6e42]"
                  desc="La oficina del Registro Académico UAI: emite los certificados oficiales y puede revocarlos. Requiere una wallet autorizada."
                />
                <RoleCard
                  icon="⚙️"
                  title="Admin (TI UAI)"
                  badge="Conecta wallet"
                  badgeCls="bg-[#5b3fb9]"
                  desc="Dirección de TI de la universidad: define qué oficinas pueden emitir certificados. No emite: gestiona los permisos."
                />
              </div>
            </div>
          </>
        )}

        {/* Aviso: wallet conectada sin permisos especiales */}
        {walletSinPermisos && (
          <div className="mb-5 rounded-lg border border-border bg-panel/60 px-4 py-3 text-sm text-muted">
            ℹ️ Esta wallet puede <strong className="text-text">verificar certificados</strong>, pero
            no está autorizada como emisor ni admin. Para emitir certificados, la dirección de TI
            de la UAI debe autorizar tu wallet.
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

function FlowStep({
  n,
  icon,
  title,
  desc,
}: {
  n: number;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="relative rounded-lg border border-border bg-bg/40 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
          {n}
        </span>
        <span className="text-lg">{icon}</span>
        <span className="font-semibold text-text">{title}</span>
      </div>
      <p className="text-xs text-muted leading-relaxed">{desc}</p>
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
