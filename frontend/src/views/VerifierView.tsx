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
    toast.push("info", `Consulta gratuita: ${valido ? "documento válido" : "no válido"}.`);
  }

  async function verificar() {
    if (!hash) return;
    const c = await contratoEscritura();
    const tx = await c.verificar(hash);
    toast.push("info", "Verificación enviada…", { href: linkTx(tx.hash), label: "Etherscan" });
    await tx.wait();
    const [valido, doc] = await contratoLectura().consultar(hash);
    setResultado({ valido, doc: aDocumento(doc) });
    toast.push("ok", "Verificación registrada on-chain.");
  }

  return (
    <section className="rounded-xl border border-border bg-panel p-5">
      <h2 className="mb-1 text-base font-semibold text-accent">Verificar un documento</h2>
      <p className="mb-4 text-xs text-muted">
        Sube un archivo y comprueba si fue registrado y sigue vigente. La consulta es gratuita;
        verificar deja una traza on-chain de quién consultó.
      </p>

      <FileDropzone
        onSelect={(_, h) => {
          setHash(h);
          setResultado(null);
        }}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <TxButton variant="secondary" onRun={consultar} disabled={!hash} pendingLabel="Consultando…">
          🔍 Consultar (gratis)
        </TxButton>
        <TxButton variant="secondary" onRun={verificar} disabled={!hash || !address} pendingLabel="Verificando…">
          📝 Verificar (deja traza)
        </TxButton>
      </div>

      {!address && (
        <p className="mt-2 text-xs text-muted">
          Conecta tu wallet para usar “Verificar”. “Consultar” funciona sin wallet.
        </p>
      )}

      <ResultCard resultado={resultado} />
    </section>
  );
}
