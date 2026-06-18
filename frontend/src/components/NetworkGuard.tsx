import { useWallet } from "../hooks/useWallet";
import { useToast } from "./Toaster";
import { Icon } from "./Icon";
import { mensajeError } from "../lib/errors";

/** Banner que avisa si la wallet no está en Sepolia y ofrece cambiar. */
export function NetworkGuard() {
  const { tieneWallet, address, redCorrecta, cambiarRed } = useWallet();
  const toast = useToast();

  if (!tieneWallet || !address || redCorrecta) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-warn/60 border-l-4 border-l-warn bg-warn/10 px-4 py-3 text-sm">
      <span className="flex items-center gap-2">
        <Icon name="warning" size={17} className="text-warn" />
        Tu wallet no está en la red Sepolia. Cámbiala para operar.
      </span>
      <button
        type="button"
        onClick={async () => {
          try {
            await cambiarRed();
          } catch (e) {
            toast.push("bad", mensajeError(e));
          }
        }}
        className="rounded-[3px] border border-warn bg-warn px-3 py-1.5 text-xs font-semibold text-panel hover:brightness-95"
      >
        Cambiar a Sepolia
      </button>
    </div>
  );
}
