import { useState } from "react";
import { isAddress } from "ethers";
import { useWallet } from "../hooks/useWallet";
import { useToast } from "../components/Toaster";
import { FileDropzone } from "../components/FileDropzone";
import { TxButton } from "../components/TxButton";
import { ResultCard, type Resultado } from "../components/ResultCard";
import { aDocumento, TIPOS } from "../lib/contract";
import { linkTx } from "../lib/format";

export function IssuerView() {
  const { contratoLectura, contratoEscritura } = useWallet();
  const toast = useToast();
  const [hash, setHash] = useState<string | null>(null);
  const [titular, setTitular] = useState("");
  const [tipo, setTipo] = useState(0);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  async function refrescarResultado() {
    if (!hash) return;
    const [valido, doc] = await contratoLectura().consultar(hash);
    setResultado({ valido, doc: aDocumento(doc) });
  }

  async function registrar() {
    if (!hash) return;
    if (!isAddress(titular)) {
      toast.push("bad", "La dirección del titular es inválida.");
      return;
    }
    const c = await contratoEscritura();
    const tx = await c.registrar(hash, titular, tipo);
    toast.push("info", "Registro enviado…", { href: linkTx(tx.hash), label: "Etherscan" });
    const receipt = await tx.wait();
    toast.push("ok", `Documento registrado (bloque ${receipt.blockNumber}).`);
    await refrescarResultado();
  }

  async function revocar() {
    if (!hash) return;
    const c = await contratoEscritura();
    const tx = await c.revocarDocumento(hash);
    toast.push("info", "Revocación enviada…", { href: linkTx(tx.hash), label: "Etherscan" });
    await tx.wait();
    toast.push("warn", "Documento revocado.");
    await refrescarResultado();
  }

  return (
    <section className="rounded-xl border border-border bg-panel p-5">
      <h2 className="mb-1 text-base font-semibold text-accent">Emitir / revocar documentos</h2>
      <p className="mb-4 text-xs text-muted">
        Como emisor autorizado puedes registrar el hash de un documento (asignándole un titular y
        un tipo) o revocar uno que emitiste.
      </p>

      <FileDropzone
        onSelect={(_, h) => {
          setHash(h);
          setResultado(null);
        }}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
        <div>
          <label htmlFor="titular" className="mb-1 block text-xs text-muted">
            Titular (dirección Ethereum)
          </label>
          <input
            id="titular"
            value={titular}
            onChange={(e) => setTitular(e.target.value)}
            placeholder="0x…"
            className="w-full rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="tipo" className="mb-1 block text-xs text-muted">
            Tipo de documento
          </label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(Number(e.target.value))}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          >
            {TIPOS.map((t, i) => (
              <option key={t} value={i}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <TxButton onRun={registrar} disabled={!hash} pendingLabel="Registrando…">
          ✅ Registrar
        </TxButton>
        <TxButton variant="danger" onRun={revocar} disabled={!hash} pendingLabel="Revocando…">
          🚫 Revocar documento
        </TxButton>
      </div>

      <ResultCard resultado={resultado} />
    </section>
  );
}
