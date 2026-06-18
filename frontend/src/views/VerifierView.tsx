import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useToast } from "../components/Toaster";
import { FileDropzone } from "../components/FileDropzone";
import { TxButton } from "../components/TxButton";
import { ResultCard, type Resultado } from "../components/ResultCard";
import { Icon } from "../components/Icon";
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
    <section className="sheet p-6 sm:p-7">
      <div className="mb-1">
        <h2 className="font-display text-2xl font-semibold">Verificar un certificado</h2>
      </div>
      <div className="rule-double mb-4" />
      <p className="mb-5 text-sm leading-relaxed text-muted">
        Arrastra el PDF del certificado UAI y comprueba si fue emitido oficialmente y sigue
        vigente. El archivo <strong className="text-text">nunca se sube</strong> — su huella
        digital se calcula en tu navegador y se compara con el registro on-chain.
      </p>

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
          className="w-full py-3 text-base"
        >
          <Icon name="verify" size={19} />
          Verificar certificado
        </TxButton>
        <p className="mt-2 text-center text-xs text-ok">
          Gratis · No necesitas wallet · No queda registro de tu consulta
        </p>
      </div>

      <ResultCard resultado={resultado} />

      {/* Verificación avanzada (deja traza on-chain) — plegada */}
      <div className="mt-6 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setMostrarAvanzado((v) => !v)}
          aria-expanded={mostrarAvanzado}
          className="flex w-full items-center justify-between text-left text-sm font-medium text-muted transition-colors hover:text-text"
        >
          <span className="flex items-center gap-2">
            <Icon name="fingerprint" size={16} />
            Verificación avanzada (deja traza on-chain)
          </span>
          <Icon
            name="chevron"
            size={16}
            className={`transition-transform ${mostrarAvanzado ? "rotate-180" : ""}`}
          />
        </button>

        {mostrarAvanzado && (
          <div className="mt-3 rounded-[3px] border border-border bg-inset/60 p-4">
            <div className="mb-3 grid gap-3 text-xs sm:grid-cols-2">
              <div className="rounded-[3px] border border-ok/40 bg-ok/5 p-3">
                <p className="mb-1 flex items-center gap-1.5 font-semibold text-ok">
                  <Icon name="verify" size={15} />
                  Verificar (lo de arriba)
                </p>
                <p className="text-muted">
                  Solo <strong className="text-text">lee</strong> la blockchain. Gratis, instantáneo
                  y anónimo. Nadie se entera de que consultaste.
                </p>
              </div>
              <div className="rounded-[3px] border border-navy/40 bg-navy/5 p-3">
                <p className="mb-1 flex items-center gap-1.5 font-semibold text-navy">
                  <Icon name="quill" size={15} />
                  Verificar on-chain (esto)
                </p>
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
                <Icon name="quill" size={16} />
                Dejar traza on-chain
              </TxButton>
            ) : (
              <p className="rounded-[3px] border border-border bg-inset px-3 py-2 text-center text-xs text-muted">
                Conecta MetaMask para dejar una traza on-chain
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
