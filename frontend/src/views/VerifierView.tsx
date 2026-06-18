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

  async function consultar() {
    if (!hash) return;
    const [valido, doc] = await contratoLectura().consultar(hash);
    setResultado({ valido, doc: aDocumento(doc) });
    toast.push("info", `Consulta completada: ${valido ? "documento válido" : "no encontrado o revocado"}.`);
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
        <h2 className="text-lg font-semibold">Verificar un documento</h2>
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

      {hash && (
        <div className="mt-3 rounded-md border border-border bg-bg px-3 py-2">
          <p className="text-xs text-muted">Hash keccak256 del archivo:</p>
          <p className="mt-0.5 break-all font-mono text-xs text-text">{hash}</p>
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {/* Consultar — free */}
        <div className="rounded-lg border border-border p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg">🔍</span>
            <div>
              <p className="text-sm font-semibold text-text">Consultar</p>
              <p className="text-xs text-ok font-medium">Gratis · Sin wallet</p>
            </div>
          </div>
          <p className="mb-3 text-xs text-muted">
            Lee el estado del documento directamente del contrato. No queda traza de quién consultó.
          </p>
          <TxButton
            variant="secondary"
            onRun={consultar}
            disabled={!hash}
            pendingLabel="Consultando…"
            className="w-full justify-center"
          >
            Consultar
          </TxButton>
        </div>

        {/* Verificar — on-chain */}
        <div className={`rounded-lg border p-4 transition-colors ${address ? "border-accent/40" : "border-border opacity-60"}`}>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg">📝</span>
            <div>
              <p className="text-sm font-semibold text-text">Verificar on-chain</p>
              <p className="text-xs text-warn font-medium">Requiere wallet · Deja traza</p>
            </div>
          </div>
          <p className="mb-3 text-xs text-muted">
            Envía una transacción que queda registrada en la blockchain: quién verificó y cuándo.
          </p>
          {address ? (
            <TxButton
              onRun={verificar}
              disabled={!hash}
              pendingLabel="Verificando…"
              className="w-full justify-center"
            >
              Verificar on-chain
            </TxButton>
          ) : (
            <p className="rounded-md bg-border/30 px-3 py-2 text-center text-xs text-muted">
              Conecta MetaMask para usar esta función
            </p>
          )}
        </div>
      </div>

      <ResultCard resultado={resultado} />
    </section>
  );
}
