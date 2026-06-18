import { useWallet, type Rol } from "./useWallet";

/** Atajo de solo lectura sobre el rol derivado en el contexto de wallet. */
export function useRole(): Rol {
  return useWallet().rol;
}
