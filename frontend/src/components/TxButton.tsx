import { useState, type ReactNode } from "react";
import { useToast } from "./Toaster";
import { mensajeError } from "../lib/errors";

type Variant = "primary" | "secondary" | "danger";

const VAR: Record<Variant, string> = {
  primary: "bg-accent text-white hover:brightness-110",
  secondary: "bg-border text-text hover:brightness-125",
  danger: "bg-bad text-white hover:brightness-110",
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
      className={`rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${VAR[variant]} ${className}`}
    >
      {busy ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {pendingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
