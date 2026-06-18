import { useEvents, type TipoEvento } from "../hooks/useEvents";
import { truncar, linkTx } from "../lib/format";
import { Icon } from "./Icon";

const COLOR: Record<TipoEvento, string> = {
  Registrado: "text-ok",
  Verificado: "text-navy",
  Revocado: "text-warn",
};

export function EventTable() {
  const { filas, cargando, error, recargar } = useEvents();

  return (
    <section className="sheet p-6">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Icon name="scroll" size={20} className="text-accent" />
          Historial on-chain
        </h2>
        <button
          type="button"
          onClick={() => void recargar()}
          className="inline-flex items-center gap-1.5 rounded-[3px] border border-line px-3 py-1.5 text-xs font-medium text-muted hover:bg-inset hover:text-text"
        >
          <Icon name="refresh" size={14} className={cargando ? "animate-spin" : ""} />
          {cargando ? "Cargando…" : "Actualizar"}
        </button>
      </div>
      <div className="rule-double mb-4" />

      {error && <p className="text-xs text-warn">{error}</p>}

      {!error && filas.length === 0 && !cargando && (
        <p className="text-sm text-muted">Aún no hay asientos registrados en el rango consultado.</p>
      )}

      {filas.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-line text-muted">
                <th className="label-officio py-2 pr-3">Asiento</th>
                <th className="label-officio py-2 pr-3">Huella doc.</th>
                <th className="label-officio py-2 pr-3">Responsable</th>
                <th className="label-officio py-2 pr-3">Detalle</th>
                <th className="label-officio py-2">Tx</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {filas.map((f) => (
                <tr key={`${f.txHash}-${f.tipo}-${f.hashDoc}`} className="border-b border-border/60">
                  <td className={`py-2 pr-3 font-sans font-semibold ${COLOR[f.tipo]}`}>{f.tipo}</td>
                  <td className="py-2 pr-3" title={f.hashDoc}>
                    {truncar(f.hashDoc, 10, 6)}
                  </td>
                  <td className="py-2 pr-3" title={f.actor}>
                    {truncar(f.actor)}
                  </td>
                  <td className="py-2 pr-3 font-sans text-muted">{f.detalle}</td>
                  <td className="py-2">
                    <a
                      href={linkTx(f.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-0.5 text-accent hover:underline"
                    >
                      ver
                      <Icon name="external" size={12} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
