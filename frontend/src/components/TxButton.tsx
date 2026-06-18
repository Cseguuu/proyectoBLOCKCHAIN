import { useState, type ReactNode } from "react";
import { useToast } from "./Toaster";
import { mensajeError } from "../lib/errors";

type Variant = "primary" | "secondary" | "danger";

const VAR: Record<Variant, string> = {
  primary: "bg-accent text-panel border-accent-deep hover:bg-accent-deep",
  secondary: "bg-transparent text-text border-line hover:bg-inset",
  danger: "bg-bad text-panel border-[#6f1f1f] hover:brightness-95",
};

interface Props {
  onRun: () => Promise<void>;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  disabled?: boolean;
  /** Texto a mostrar mientras corre (default: "Procesando…"). */
  pendingLabel?: string;
}

/**
 * Botón que ejecuta una acción asíncrona gestionando el estado de carga
 * y reportando errores de forma legible vía toast.
 */
export function TxButton({
  onRun,
  children,
  variant = "primary",
  className = "",
  disabled = false,
  pendingLabel = "Procesando…",
}: Props) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function run() {
    if (busy) return;
    setBusy(true);
    try {
      await onRun();
    } catch (e) {
      toast.push("bad", mensajeError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy || disabled}
      aria-busy={busy}
      className={`inline-flex items-center justify-center gap-2 rounded-[3px] border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VAR[variant]} ${className}`}
    >
      {busy ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {pendingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
