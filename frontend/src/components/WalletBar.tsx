import { useWallet } from "../hooks/useWallet";
import { useToast } from "./Toaster";
import { RoleBadge } from "./RoleBadge";
import { Icon } from "./Icon";
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
    <div className="mb-5 sheet p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: wallet info */}
        <div className="min-w-0">
          {address ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <Icon name="wallet" size={18} className="text-muted" />
              <a
                href={linkAddress(address)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-sm text-text hover:text-accent"
                title={address}
              >
                {truncar(address)}
              </a>
              <RoleBadge rol={rol} />
              <span className="hidden text-xs text-muted sm:block">— {ROL_DESC[rol] ?? ""}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Icon name="wallet" size={18} className="text-muted" />
              <div>
                <p className="text-sm font-medium text-text">Sin conexión</p>
                <p className="text-xs text-muted">
                  {tieneWallet
                    ? "Conecta tu wallet para acceder a funciones de emisor o admin"
                    : "Instala MetaMask para registrar o verificar documentos on-chain"}
                </p>
              </div>
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
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-line px-4 py-2 text-sm font-semibold text-muted hover:bg-inset hover:text-text"
            >
              Instalar MetaMask
              <Icon name="external" size={14} />
            </a>
          ) : address ? (
            <div className="inline-flex items-center gap-1.5 rounded-[3px] border border-ok/50 bg-ok/10 px-3 py-2 text-xs font-semibold text-ok">
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
              className="inline-flex items-center gap-2 rounded-[3px] border border-accent-deep bg-accent px-5 py-2 text-sm font-semibold text-panel transition-colors hover:bg-accent-deep disabled:opacity-50"
            >
              <Icon name="wallet" size={16} />
              {conectando ? "Conectando…" : "Conectar MetaMask"}
            </button>
          )}
        </div>
      </div>

      {/* Notice: read-only mode available without wallet */}
      {!address && tieneWallet && (
        <p className="mt-3 flex items-start gap-2 border-t border-border pt-3 text-xs text-muted">
          <Icon name="info" size={15} className="mt-px shrink-0 text-navy" />
          <span>
            Sin wallet puedes <strong className="text-text">consultar documentos gratis</strong>{" "}
            (modo solo lectura). Conecta MetaMask para registrar, verificar on-chain o administrar.
          </span>
        </p>
      )}
    </div>
  );
}
