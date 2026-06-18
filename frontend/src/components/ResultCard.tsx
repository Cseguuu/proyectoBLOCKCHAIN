import type { Documento } from "../lib/contract";
import { nombreTipo } from "../lib/contract";
import { fmtFecha, truncar, linkAddress } from "../lib/format";

export interface Resultado {
  valido: boolean;
  doc: Documento;
}

function Dato({ k, v, link }: { k: string; v: string; link?: string }) {
  return (
    <>
      <dt className="text-muted">{k}</dt>
      <dd className="break-all font-mono">
        {link ? (
          <a href={link} target="_blank" rel="noreferrer" className="hover:text-accent">
            {v}
          </a>
        ) : (
          v
        )}
      </dd>
    </>
  );
}

export function ResultCard({ resultado }: { resultado: Resultado | null }) {
  if (!resultado) return null;
  const { valido, doc } = resultado;

  if (valido) {
    return (
      <div className="mt-4 rounded-lg border border-ok bg-ok/10 p-4">
        <h3 className="mb-2 text-base font-semibold">✅ CERTIFICADO AUTÉNTICO</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          <Dato k="Emisor (UAI)" v={truncar(doc.emisor)} link={linkAddress(doc.emisor)} />
          <Dato k="Alumno" v={truncar(doc.titular)} link={linkAddress(doc.titular)} />
          <Dato k="Tipo" v={nombreTipo(doc.tipo)} />
          <Dato k="Emitido" v={fmtFecha(doc.timestamp)} />
        </dl>
      </div>
    );
  }

  if (doc.existe && doc.revocado) {
    return (
      <div className="mt-4 rounded-lg border border-warn bg-warn/10 p-4">
        <h3 className="mb-2 text-base font-semibold">⚠️ CERTIFICADO REVOCADO</h3>
        <p className="text-sm">
          Fue emitido por la UAI pero luego se invalidó (anulado o reemplazado). No debe
          considerarse válido.
        </p>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          <Dato k="Emisor (UAI)" v={truncar(doc.emisor)} link={linkAddress(doc.emisor)} />
          <Dato k="Alumno" v={truncar(doc.titular)} link={linkAddress(doc.titular)} />
          <Dato k="Emitido" v={fmtFecha(doc.timestamp)} />
        </dl>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-bad bg-bad/10 p-4">
      <h3 className="mb-2 text-base font-semibold">❌ CERTIFICADO NO REGISTRADO</h3>
      <p className="text-sm">
        Esta huella no existe en el registro. El certificado no fue emitido por este sistema o
        fue <strong>alterado</strong>: basta cambiar un solo byte (una nota, una fecha, un
        nombre) para que el hash sea completamente distinto.
      </p>
    </div>
  );
}
