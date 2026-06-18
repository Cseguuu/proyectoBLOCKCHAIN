import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useToast } from "../components/Toaster";
import { FileDropzone } from "../components/FileDropzone";
import { TxButton } from "../components/TxButton";
import { ResultCard, type Resultado } from "../components/ResultCard";
import { aDocumento } from "../lib/contract";
import { linkTx } from "../lib/format";

export function VerifierView() {
  const { contratoLectura, contratoEscritura, address } = useWallet();
  const toast = useToast();
  const [hash, setHash] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [mostrarAvanzado, setMostrarAvanzado] = useState(false);

  async function consultar() {
    if (!hash) return;
    const [valido, doc] = await contratoLectura().consultar(hash);
    setResultado({ valido, doc: aDocumento(doc) });
    toast.push(
      valido ? "ok" : "info",
      valido ? "Documento válido." : "El documento no está registrado o fue revocado.",
    );
  }

  async function verificar() {
    if (!hash) return;
    const c = await contratoEscritura();
    const tx = await c.verificar(hash);
    toast.push("info", "Verificación enviada…", { href: linkTx(tx.hash), label: "Ver en Etherscan" });
    await tx.wait();
    const [valido, doc] = await contratoLectura().consultar(hash);
    setResultado({ valido, doc: aDocumento(doc) });
    toast.push("ok", "Verificación registrada en la blockchain.");
  }

  return (
    <section className="rounded-xl border border-border bg-panel p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Verificar autenticidad</h2>
        <p className="mt-1 text-sm text-muted">
          Sube cualquier archivo y comprueba si su huella digital está registrada en el contrato.
          El archivo <strong className="text-text">nunca se sube</strong> — el hash se calcula en
          tu navegador.
        </p>
      </div>

      <FileDropzone
        onSelect={(_, h) => {
          setHash(h);
          setResultado(null);
        }}
      />

      {/* Acción principal: consultar (gratis) */}
      <div className="mt-5">
        <TxButton
          onRun={consultar}
          disabled={!hash}
          pendingLabel="Verificando…"
          className="w-full justify-center py-3 text-base"
        >
          🔍 Verificar documento
        </TxButton>
        <p className="mt-2 text-center text-xs text-ok">
          Gratis · No necesitas wallet · No queda registro de tu consulta
        </p>
      </div>

      <ResultCard resultado={resultado} />

      {/* Verificación avanzada (deja traza on-chain) — plegada */}
      <div className="mt-5 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setMostrarAvanzado((v) => !v)}
          aria-expanded={mostrarAvanzado}
          className="flex w-full items-center justify-between text-left text-sm font-medium text-muted hover:text-text transition-colors"
        >
          <span>⚙️ Verificación avanzada (deja traza on-chain)</span>
          <span className={`transition-transform ${mostrarAvanzado ? "rotate-180" : ""}`}>▾</span>
        </button>

        {mostrarAvanzado && (
          <div className="mt-3 rounded-lg border border-border bg-bg/50 p-4">
            <div className="mb-3 grid gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-md border border-ok/30 bg-ok/5 p-3">
                <p className="mb-1 font-semibold text-ok">🔍 Verificar (lo de arriba)</p>
                <p className="text-muted">
                  Solo <strong className="text-text">lee</strong> la blockchain. Gratis, instantáneo
                  y anónimo. Nadie se entera de que consultaste.
                </p>
              </div>
              <div className="rounded-md border border-accent/30 bg-accent/5 p-3">
                <p className="mb-1 font-semibold text-accent">📝 Verificar on-chain (esto)</p>
                <p className="text-muted">
                  Envía una <strong className="text-text">transacción</strong> que deja registrado
                  <em> quién</em> verificó y <em>cuándo</em>. Cuesta gas. Sirve como prueba de
                  auditoría.
                </p>
              </div>
            </div>

            <p className="mb-3 text-xs text-muted">
              Úsalo solo si necesitas dejar evidencia permanente de que revisaste este documento
              (por ejemplo, para un proceso legal o de auditoría).
            </p>

            {address ? (
              <TxButton
                variant="secondary"
                onRun={verificar}
                disabled={!hash}
                pendingLabel="Registrando verificación…"
              >
                📝 Dejar traza on-chain
              </TxButton>
            ) : (
              <p className="rounded-md bg-border/30 px-3 py-2 text-center text-xs text-muted">
                Conecta MetaMask para dejar una traza on-chain
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
