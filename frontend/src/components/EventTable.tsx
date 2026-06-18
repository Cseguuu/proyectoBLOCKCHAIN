import { useEvents, type TipoEvento } from "../hooks/useEvents";
import { truncar, linkTx } from "../lib/format";

const COLOR: Record<TipoEvento, string> = {
  Registrado: "text-ok",
  Verificado: "text-accent",
  Revocado: "text-warn",
};

export function EventTable() {
  const { filas, cargando, error, recargar } = useEvents();

  return (
    <section className="rounded-xl border border-border bg-panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-accent">📜 Historial on-chain</h2>
        <button
          type="button"
          onClick={() => void recargar()}
          className="rounded-md border border-border px-3 py-1.5 text-xs text-muted hover:text-text"
        >
          {cargando ? "Cargando…" : "↻ Actualizar"}
        </button>
      </div>

      {error && <p className="text-xs text-warn">{error}</p>}

      {!error && filas.length === 0 && !cargando && (
        <p className="text-xs text-muted">Aún no hay eventos en el rango consultado.</p>
      )}

      {filas.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted">
              <tr className="border-b border-border">
                <th className="py-2 pr-3 font-medium">Evento</th>
                <th className="py-2 pr-3 font-medium">Hash doc</th>
                <th className="py-2 pr-3 font-medium">Actor</th>
                <th className="py-2 pr-3 font-medium">Detalle</th>
                <th className="py-2 font-medium">Tx</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {filas.map((f) => (
                <tr key={`${f.txHash}-${f.tipo}-${f.hashDoc}`} className="border-b border-border/50">
                  <td className={`py-2 pr-3 font-semibold ${COLOR[f.tipo]}`}>{f.tipo}</td>
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
                      className="text-accent hover:underline"
                    >
                      ver ↗
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
