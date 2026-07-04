import { useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { WalletBar } from "./components/WalletBar";
import { NetworkGuard } from "./components/NetworkGuard";
import { EventTable } from "./components/EventTable";
import { Icon, type IconName } from "./components/Icon";
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
  const tabs: { id: Tab; icon: IconName; label: string }[] = [
    { id: "verificar", icon: "verify", label: "Verificar" },
  ];
  if (puedeEmitir) tabs.push({ id: "emitir", icon: "quill", label: "Emitir" });
  if (puedeAdmin) tabs.push({ id: "admin", icon: "shield", label: "Admin" });

  // Si el rol pierde acceso a la pestaña activa (ej: desconecta wallet), volver a verificar.
  const tabActiva: Tab = tabs.some((t) => t.id === tab) ? tab : "verificar";

  // La wallet conectada no tiene permisos especiales (solo puede verificar).
  const walletSinPermisos = !!address && rol === "verificador";

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Membrete institucional */}
        <header className="mb-6">
          <div className="sheet overflow-hidden">
            {/* Banda superior granate */}
            <div className="h-1.5 bg-accent" />
            <div className="flex items-start gap-5 p-6">
              <div className="min-w-0 flex-1">
                <p className="label-officio mb-1">Registro Académico · Universidad Adolfo Ibáñez</p>
                <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-[2.1rem]">
                  Verificación de certificados en blockchain
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                  Comprueba la autenticidad de certificados académicos (alumno regular, título,
                  notas) sobre <span className="font-medium text-text">Ethereum Sepolia</span>. El
                  certificado nunca se sube — solo se compara su huella digital{" "}
                  <span className="font-mono text-accent">keccak256</span> con el registro inmutable
                  en blockchain.
                </p>
              </div>
              <span className="hidden shrink-0 rounded-[2px] border border-line px-3 py-1 font-mono text-xs text-muted lg:block">
                TICS0870 · Grupo 8
              </span>
            </div>
          </div>

          {/* Disclaimer: prototipo, no oficial */}
          <p className="mt-3 flex items-start gap-2 rounded-[3px] border border-warn/40 border-l-4 border-l-warn bg-warn/5 px-3 py-2 text-xs text-muted">
            <Icon name="warning" size={15} className="mt-px shrink-0 text-warn" />
            <span>
              <strong className="text-text">Prototipo académico.</strong> No es un servicio oficial
              de la Universidad Adolfo Ibáñez; el emisor "Registro Académico UAI" está simulado con
              fines demostrativos para el curso TICS0870.
            </span>
          </p>
        </header>

        {/* Wallet + Network */}
        <WalletBar />
        <NetworkGuard />

        {/* Onboarding: cómo funciona + roles, solo cuando NO hay wallet conectada */}
        {!address && (
          <>
            {/* Flujo guiado: la historia del caso de uso */}
            <div className="mb-6 sheet p-6">
              <p className="label-officio mb-1">¿Cómo funciona?</p>
              <div className="rule-double mb-4" />
              <div className="grid gap-4 sm:grid-cols-3">
                <FlowStep
                  n={1}
                  icon="institution"
                  title="UAI emite"
                  desc="El Registro Académico de la UAI registra la huella del certificado en la blockchain al momento de emitirlo."
                />
                <FlowStep
                  n={2}
                  icon="student"
                  title="El alumno recibe"
                  desc="El estudiante recibe su certificado en PDF, idéntico al de siempre. La prueba de autenticidad ya quedó on-chain."
                />
                <FlowStep
                  n={3}
                  icon="verify"
                  title="Un tercero verifica"
                  desc="Un empleador o embajada arrastra el PDF aquí y confirma en segundos que es auténtico, sin llamar a la universidad."
                />
              </div>
            </div>

            <div className="mb-6 sheet p-6">
              <p className="label-officio mb-1">¿Quién es quién?</p>
              <div className="rule-double mb-4" />
              <div className="grid gap-4 sm:grid-cols-3">
                <RoleCard
                  icon="verify"
                  title="Verificador"
                  badge="Tú, ahora"
                  badgeCls="border-muted text-muted"
                  desc="Empleador, embajada o institución que recibe un certificado y quiere confirmar que es auténtico. Gratis y sin wallet."
                />
                <RoleCard
                  icon="institution"
                  title="Emisor (Registro UAI)"
                  badge="Conecta wallet"
                  badgeCls="border-ok text-ok"
                  desc="La oficina del Registro Académico UAI: emite los certificados oficiales y puede revocarlos. Requiere una wallet autorizada."
                />
                <RoleCard
                  icon="shield"
                  title="Admin (TI UAI)"
                  badge="Conecta wallet"
                  badgeCls="border-navy text-navy"
                  desc="Dirección de TI de la universidad: define qué oficinas pueden emitir certificados. No emite: gestiona los permisos."
                />
              </div>
            </div>
          </>
        )}

        {/* Aviso: wallet conectada sin permisos especiales */}
        {walletSinPermisos && (
          <div className="mb-5 flex items-start gap-2 rounded-[3px] border border-border border-l-4 border-l-muted bg-panel px-4 py-3 text-sm text-muted">
            <Icon name="info" size={16} className="mt-0.5 shrink-0 text-navy" />
            <span>
              Esta wallet puede <strong className="text-text">verificar certificados</strong>, pero
              no está autorizada como emisor ni admin. Para emitir certificados, la dirección de TI
              de la UAI debe autorizar tu wallet.
            </span>
          </div>
        )}

        {/* Navegación por pestañas — solo aparece si hay más de una disponible */}
        {tabs.length > 1 && (
          <nav className="mb-5 flex gap-1.5 border-b border-line" aria-label="Secciones">
            {tabs.map((t) => {
              const activa = tabActiva === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  aria-current={activa}
                  className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                    activa
                      ? "border-accent text-accent"
                      : "border-transparent text-muted hover:text-text"
                  }`}
                >
                  <Icon name={t.icon} size={16} />
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

        <footer className="mt-10 border-t border-border pt-5 text-center font-mono text-xs text-muted">
          Proyecto final TICS0870 · Grupo 8 · Solidity + Foundry + React + ethers v6
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
  icon: IconName;
  title: string;
  desc: string;
}) {
  return (
    <div className="relative rounded-[3px] border border-border bg-inset/50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent font-mono text-xs font-bold text-panel">
          {n}
        </span>
        <Icon name={icon} size={18} className="text-accent" />
        <span className="font-display font-semibold text-text">{title}</span>
      </div>
      <p className="text-xs leading-relaxed text-muted">{desc}</p>
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
  icon: IconName;
  title: string;
  badge: string;
  badgeCls: string;
  desc: string;
}) {
  return (
    <div className="rounded-[3px] border border-border bg-inset/50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon name={icon} size={20} className="text-text" />
        <span className="font-display font-semibold text-text">{title}</span>
        <span
          className={`ml-auto rounded-[2px] border px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${badgeCls}`}
        >
          {badge}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-muted">{desc}</p>
    </div>
  );
}
