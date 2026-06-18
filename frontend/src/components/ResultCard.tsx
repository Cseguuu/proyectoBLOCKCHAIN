import type { Documento } from "../lib/contract";
import { nombreTipo } from "../lib/contract";
import { fmtFecha, truncar, linkAddress } from "../lib/format";
import { Icon } from "./Icon";
import { Seal } from "./Seal";

export interface Resultado {
  valido: boolean;
  doc: Documento;
}

function Dato({ k, v, link }: { k: string; v: string; link?: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/70 py-1.5">
      <dt className="label-officio">{k}</dt>
      <dd className="break-all font-mono text-xs text-text">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-accent"
          >
            {v}
            <Icon name="external" size={12} />
          </a>
        ) : (
          v
        )}
      </dd>
    </div>
  );
}

export function ResultCard({ resultado }: { resultado: Resultado | null }) {
  if (!resultado) return null;
  const { valido, doc } = resultado;

  if (valido) {
    return (
      <div className="mt-5 rounded-[3px] border-2 border-ok/50 bg-ok/[0.06] p-5">
        <div className="flex items-start gap-4">
          <Seal estado="valido" size={84} stamp className="shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xl font-semibold text-ok">Certificado auténtico</h3>
            <p className="mb-3 mt-0.5 text-sm text-muted">
              La huella coincide con un registro vigente emitido por la UAI.
            </p>
            <dl className="grid gap-x-6 sm:grid-cols-2">
              <Dato k="Emisor (UAI)" v={truncar(doc.emisor)} link={linkAddress(doc.emisor)} />
              <Dato k="Alumno titular" v={truncar(doc.titular)} link={linkAddress(doc.titular)} />
              <Dato k="Tipo de documento" v={nombreTipo(doc.tipo)} />
              <Dato k="Fecha de emisión" v={fmtFecha(doc.timestamp)} />
            </dl>
          </div>
        </div>
      </div>
    );
  }

  if (doc.existe && doc.revocado) {
    return (
      <div className="mt-5 rounded-[3px] border-2 border-warn/50 bg-warn/[0.06] p-5">
        <div className="flex items-start gap-4">
          <Seal estado="revocado" size={84} stamp className="shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xl font-semibold text-warn">Certificado revocado</h3>
            <p className="mb-3 mt-0.5 text-sm text-muted">
              Fue emitido por la UAI pero luego se invalidó (anulado o reemplazado). No debe
              considerarse válido.
            </p>
            <dl className="grid gap-x-6 sm:grid-cols-2">
              <Dato k="Emisor (UAI)" v={truncar(doc.emisor)} link={linkAddress(doc.emisor)} />
              <Dato k="Alumno titular" v={truncar(doc.titular)} link={linkAddress(doc.titular)} />
              <Dato k="Fecha de emisión" v={fmtFecha(doc.timestamp)} />
            </dl>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-[3px] border-2 border-bad/50 bg-bad/[0.06] p-5">
      <div className="flex items-start gap-3">
        <Icon name="ban" size={36} className="mt-0.5 shrink-0 text-bad" />
        <div>
          <h3 className="font-display text-xl font-semibold text-bad">
            Certificado no registrado
          </h3>
          <p className="mt-1 text-sm text-muted">
            Esta huella no existe en el registro. El certificado no fue emitido por este sistema
            o fue <strong className="text-text">alterado</strong>: basta cambiar un solo byte
            (una nota, una fecha, un nombre) para que la huella sea completamente distinta.
          </p>
        </div>
      </div>
    </div>
  );
}
