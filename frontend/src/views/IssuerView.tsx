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
  const [fileName, setFileName] = useState<string | null>(null);
  const [titular, setTitular] = useState("");
  const [tipo, setTipo] = useState(0);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [accion, setAccion] = useState<"registrar" | "revocar">("registrar");

  async function refrescarResultado() {
    if (!hash) return;
    const [valido, doc] = await contratoLectura().consultar(hash);
    setResultado({ valido, doc: aDocumento(doc) });
  }

  async function registrar() {
    if (!hash) return;
    if (!isAddress(titular)) {
      toast.push("bad", "Ingresa una dirección Ethereum válida para el titular.");
      return;
    }
    const c = await contratoEscritura();
    const tx = await c.registrar(hash, titular, tipo);
    toast.push("info", "Registro enviado…", { href: linkTx(tx.hash), label: "Ver en Etherscan" });
    const receipt = await tx.wait();
    toast.push("ok", `Documento registrado en bloque ${receipt.blockNumber}.`);
    await refrescarResultado();
  }

  async function revocar() {
    if (!hash) return;
    const c = await contratoEscritura();
    const tx = await c.revocarDocumento(hash);
    toast.push("info", "Revocación enviada…", { href: linkTx(tx.hash), label: "Ver en Etherscan" });
    await tx.wait();
    toast.push("warn", "Documento revocado — ya no será considerado auténtico.");
    await refrescarResultado();
  }

  return (
    <section className="rounded-xl border border-border bg-panel p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Emitir certificado · Registro Académico UAI</h2>
        <p className="mt-1 text-sm text-muted">
          Como oficina autorizada puedes registrar la huella digital de un certificado en la
          blockchain, asociándolo al alumno titular. También puedes revocar certificados que
          hayas emitido (por ejemplo, si se anula o se reemplaza por una versión corregida).
        </p>
      </div>

      {/* Action toggle */}
      <div className="mb-5 flex gap-1 rounded-lg border border-border bg-bg p-1 w-fit">
        <button
          type="button"
          onClick={() => setAccion("registrar")}
          className={`rounded-md px-5 py-2 text-sm font-semibold transition-all ${
            accion === "registrar"
              ? "bg-accent text-white shadow-sm"
              : "text-muted hover:text-text"
          }`}
        >
          ✅ Registrar
        </button>
        <button
          type="button"
          onClick={() => setAccion("revocar")}
          className={`rounded-md px-5 py-2 text-sm font-semibold transition-all ${
            accion === "revocar"
              ? "bg-bad text-white shadow-sm"
              : "text-muted hover:text-text"
          }`}
        >
          🚫 Revocar
        </button>
      </div>

      {/* File dropzone */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-muted uppercase tracking-wider">
          1. Selecciona el documento
        </label>
        <FileDropzone
          onSelect={(file, h) => {
            setHash(h);
            setFileName(file.name);
            setResultado(null);
          }}
        />
        {hash && (
          <div className="mt-2 rounded-md border border-border bg-bg px-3 py-2">
            <p className="text-xs text-muted">
              <span className="font-medium text-text">{fileName}</span> — hash keccak256:
            </p>
            <p className="mt-0.5 break-all font-mono text-xs text-text/70">{hash}</p>
          </div>
        )}
      </div>

      {/* Register fields */}
      {accion === "registrar" && (
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-muted uppercase tracking-wider">
            2. Datos del registro
          </label>
          <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
            <div>
              <label htmlFor="titular" className="mb-1 block text-xs text-muted">
                Alumno titular (dirección Ethereum)
              </label>
              <input
                id="titular"
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
                placeholder="0x…"
                className="w-full rounded-md border border-border bg-bg px-3 py-2.5 font-mono text-sm text-text outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label htmlFor="tipo" className="mb-1 block text-xs text-muted">
                Tipo de certificado
              </label>
              <select
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors"
              >
                {TIPOS.map((t, i) => (
                  <option key={t} value={i}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Revocar explanation */}
      {accion === "revocar" && (
        <div className="mb-4 rounded-lg border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-muted">
          <p>
            <strong className="text-text">Revocar</strong> invalida el documento: pasará a
            reportarse como <span className="font-semibold text-warn">REVOCADO</span> en
            cualquier consulta futura. El registro histórico se conserva en la blockchain.
          </p>
        </div>
      )}

      {/* Action button */}
      <div>
        <label className="mb-2 block text-xs font-medium text-muted uppercase tracking-wider">
          {accion === "registrar" ? "3. Confirmar registro" : "2. Confirmar revocación"}
        </label>
        {accion === "registrar" ? (
          <TxButton onRun={registrar} disabled={!hash} pendingLabel="Registrando en blockchain…">
            ✅ Registrar documento
          </TxButton>
        ) : (
          <TxButton variant="danger" onRun={revocar} disabled={!hash} pendingLabel="Revocando…">
            🚫 Revocar documento
          </TxButton>
        )}
      </div>

      <ResultCard resultado={resultado} />
    </section>
  );
}
