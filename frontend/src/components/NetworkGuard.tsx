import { useWallet } from "../hooks/useWallet";
import { useToast } from "./Toaster";
import { mensajeError } from "../lib/errors";

/** Banner que avisa si la wallet no está en Sepolia y ofrece cambiar. */
export function NetworkGuard() {
  const { tieneWallet, address, redCorrecta, cambiarRed } = useWallet();
  const toast = useToast();

  if (!tieneWallet || !address || redCorrecta) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warn/60 bg-warn/10 px-4 py-3 text-sm">
      <span>⚠️ Tu wallet no está en la red Sepolia. Cámbiala para operar.</span>
      <button
        type="button"
        onClick={async () => {
          try {
            await cambiarRed();
          } catch (e) {
            toast.push("bad", mensajeError(e));
          }
        }}
        className="rounded-md bg-warn px-3 py-1.5 text-xs font-semibold text-black hover:brightness-110"
      >
        Cambiar a Sepolia
      </button>
    </div>
  );
}
