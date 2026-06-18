import { useState } from "react";
import { isAddress } from "ethers";
import { useWallet } from "../hooks/useWallet";
import { useToast } from "../components/Toaster";
import { FileDropzone } from "../components/FileDropzone";
import { TxButton } from "../components/TxButton";
import { ResultCard, type Resultado } from "../components/ResultCard";
import { Icon } from "../components/Icon";
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

  const paso = "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent font-mono text-xs font-bold text-accent";

  return (
    <section className="sheet p-6 sm:p-7">
      <div className="mb-1 flex items-center gap-2">
        <Icon name="quill" size={22} className="text-accent" />
        <h2 className="font-display text-2xl font-semibold">Emitir certificado</h2>
        <span className="ml-1 text-sm text-muted">· Registro Académico UAI</span>
      </div>
      <div className="rule-double mb-4" />
      <p className="mb-5 text-sm leading-relaxed text-muted">
        Como oficina autorizada puedes registrar la huella digital de un certificado en la
        blockchain, asociándolo al alumno titular. También puedes revocar certificados que hayas
        emitido (por ejemplo, si se anula o se reemplaza por una versión corregida).
      </p>

      {/* Action toggle */}
      <div className="mb-6 flex w-fit gap-1 rounded-[3px] border border-line bg-inset p-1">
        <button
          type="button"
          onClick={() => setAccion("registrar")}
          className={`inline-flex items-center gap-1.5 rounded-[2px] px-5 py-2 text-sm font-semibold transition-colors ${
            accion === "registrar" ? "bg-accent text-panel" : "text-muted hover:text-text"
          }`}
        >
          <Icon name="check" size={15} />
          Registrar
        </button>
        <button
          type="button"
          onClick={() => setAccion("revocar")}
          className={`inline-flex items-center gap-1.5 rounded-[2px] px-5 py-2 text-sm font-semibold transition-colors ${
            accion === "revocar" ? "bg-bad text-panel" : "text-muted hover:text-text"
          }`}
        >
          <Icon name="ban" size={15} />
          Revocar
        </button>
      </div>

      {/* File dropzone */}
      <div className="mb-5">
        <label className="mb-2 flex items-center gap-2 label-officio">
          <span className={paso}>1</span>
          Selecciona el documento
        </label>
        <FileDropzone
          onSelect={(file, h) => {
            setHash(h);
            setFileName(file.name);
            setResultado(null);
          }}
        />
        {hash && (
          <div className="mt-2 rounded-[3px] border border-border bg-inset px-3 py-2">
            <p className="text-xs text-muted">
              <span className="font-medium text-text">{fileName}</span> — huella keccak256:
            </p>
            <p className="mt-0.5 break-all font-mono text-xs text-text/70">{hash}</p>
          </div>
        )}
      </div>

      {/* Register fields */}
      {accion === "registrar" && (
        <div className="mb-5">
          <label className="mb-2 flex items-center gap-2 label-officio">
            <span className={paso}>2</span>
            Datos del registro
          </label>
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <div>
              <label htmlFor="titular" className="mb-1 block text-xs text-muted">
                Alumno titular (dirección Ethereum)
              </label>
              <input
                id="titular"
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
                placeholder="0x…"
                className="w-full rounded-[3px] border border-line bg-panel px-3 py-2.5 font-mono text-sm text-text outline-none transition-colors focus:border-accent"
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
                className="w-full rounded-[3px] border border-line bg-panel px-3 py-2.5 text-sm text-text outline-none transition-colors focus:border-accent"
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
        <div className="mb-5 rounded-[3px] border border-bad/40 border-l-4 border-l-bad bg-bad/5 px-4 py-3 text-sm text-muted">
          <p>
            <strong className="text-text">Revocar</strong> invalida el documento: pasará a
            reportarse como <span className="font-semibold text-warn">REVOCADO</span> en cualquier
            consulta futura. El registro histórico se conserva en la blockchain.
          </p>
        </div>
      )}

      {/* Action button */}
      <div>
        <label className="mb-2 flex items-center gap-2 label-officio">
          <span className={paso}>{accion === "registrar" ? "3" : "2"}</span>
          {accion === "registrar" ? "Confirmar registro" : "Confirmar revocación"}
        </label>
        {accion === "registrar" ? (
          <TxButton onRun={registrar} disabled={!hash} pendingLabel="Registrando en blockchain…">
            <Icon name="check" size={16} />
            Registrar documento
          </TxButton>
        ) : (
          <TxButton variant="danger" onRun={revocar} disabled={!hash} pendingLabel="Revocando…">
            <Icon name="ban" size={16} />
            Revocar documento
          </TxButton>
        )}
      </div>

      <ResultCard resultado={resultado} />
    </section>
  );
}
