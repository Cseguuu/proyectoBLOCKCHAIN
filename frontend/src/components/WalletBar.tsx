import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useToast } from "./Toaster";
import { RoleBadge } from "./RoleBadge";
import { truncar, linkAddress } from "../lib/format";
import { mensajeError } from "../lib/errors";

export function WalletBar() {
  const {
    address,
    rol,
    conectar,
    conectando,
    contractAddress,
    setContractAddress,
    tieneWallet,
  } = useWallet();
  const toast = useToast();
  const [mostrarConfig, setMostrarConfig] = useState(false);

  return (
    <div className="mb-4 rounded-xl border border-border bg-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          {address ? (
            <>
              <a
                href={linkAddress(address)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-sm text-text hover:text-accent"
                title={address}
              >
                {truncar(address)}
              </a>
              <div className="mt-1">
                <RoleBadge rol={rol} />
              </div>
            </>
          ) : (
            <span className="text-sm text-muted">No conectado</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMostrarConfig((v) => !v)}
            className="rounded-md border border-border px-3 py-2 text-xs text-muted hover:text-text"
            aria-expanded={mostrarConfig}
          >
            ⚙️ Contrato
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await conectar();
              } catch (e) {
                toast.push("bad", mensajeError(e));
              }
            }}
            disabled={conectando || !!address}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {address ? "Conectado ✓" : conectando ? "Conectando…" : "Conectar MetaMask"}
          </button>
        </div>
      </div>

      {!tieneWallet && (
        <p className="mt-3 text-xs text-warn">
          No se detectó MetaMask. Puedes consultar documentos en modo lectura, pero para
          registrar, verificar o administrar necesitas una wallet.
        </p>
      )}

      {mostrarConfig && (
        <div className="mt-4 border-t border-border pt-4">
          <label htmlFor="contractAddr" className="mb-1 block text-xs text-muted">
            Dirección del contrato (Sepolia)
          </label>
          <input
            id="contractAddr"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="0x…"
            className="w-full rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm text-text outline-none focus:border-accent"
          />
          <p className="mt-1 text-xs text-muted">
            Debe ser la dirección de la versión v2 del contrato. Se guarda en tu navegador.
          </p>
        </div>
      )}
    </div>
  );
}
