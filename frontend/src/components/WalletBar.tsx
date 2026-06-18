import { useWallet } from "../hooks/useWallet";
import { useToast } from "./Toaster";
import { RoleBadge } from "./RoleBadge";
import { truncar, linkAddress } from "../lib/format";
import { mensajeError } from "../lib/errors";

const ROL_DESC: Record<string, string> = {
  admin: "Control total del contrato",
  emisor: "Puede registrar y revocar documentos",
  verificador: "Solo puede consultar documentos",
  "sin-contrato": "Contrato no encontrado",
};

export function WalletBar() {
  const { address, rol, conectar, conectando, tieneWallet } = useWallet();
  const toast = useToast();

  return (
    <div className="mb-5 rounded-xl border border-border bg-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: wallet info */}
        <div className="min-w-0">
          {address ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={linkAddress(address)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-sm text-text hover:text-accent transition-colors"
                title={address}
              >
                {truncar(address)}
              </a>
              <RoleBadge rol={rol} />
              <span className="text-xs text-muted hidden sm:block">
                — {ROL_DESC[rol] ?? ""}
              </span>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-text">Sin conexión</p>
              <p className="text-xs text-muted">
                {tieneWallet
                  ? "Conecta tu wallet para acceder a funciones de emisor o admin"
                  : "Instala MetaMask para registrar o verificar documentos on-chain"}
              </p>
            </div>
          )}
        </div>

        {/* Right: action button */}
        <div className="flex items-center gap-2">
          {!tieneWallet ? (
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted hover:text-text transition-colors"
            >
              Instalar MetaMask ↗
            </a>
          ) : address ? (
            <div className="flex items-center gap-1.5 rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-xs font-semibold text-ok">
              <span className="h-1.5 w-1.5 rounded-full bg-ok" />
              Conectado · Sepolia
            </div>
          ) : (
            <button
              type="button"
              onClick={async () => {
                try {
                  await conectar();
                } catch (e) {
                  toast.push("bad", mensajeError(e));
                }
              }}
              disabled={conectando}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {conectando ? "Conectando…" : "Conectar MetaMask"}
            </button>
          )}
        </div>
      </div>

      {/* Notice: read-only mode available without wallet */}
      {!address && tieneWallet && (
        <p className="mt-3 border-t border-border pt-3 text-xs text-muted">
          💡 Sin wallet puedes{" "}
          <strong className="text-text">consultar documentos gratis</strong> (modo solo lectura).
          Conecta MetaMask para registrar, verificar on-chain o administrar.
        </p>
      )}
    </div>
  );
}
