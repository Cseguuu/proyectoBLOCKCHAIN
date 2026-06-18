import { CHAIN_ID } from "./contract";

// Explorador por red (solo soportamos Sepolia por ahora; fallback al mainnet explorer).
const EXPLORERS: Record<number, string> = {
  11155111: "https://sepolia.etherscan.io",
  1: "https://etherscan.io",
};

export function explorerBase(): string {
  return EXPLORERS[CHAIN_ID] ?? EXPLORERS[11155111];
}

export function linkTx(hash: string): string {
  return `${explorerBase()}/tx/${hash}`;
}

export function linkAddress(addr: string): string {
  return `${explorerBase()}/address/${addr}`;
}

export function fmtFecha(ts: bigint | number): string {
  return new Date(Number(ts) * 1000).toLocaleString("es-CL");
}

/** Acorta una dirección: 0x1234…abcd */
export function truncar(addr: string, izq = 6, der = 4): string {
  if (!addr || addr.length < izq + der) return addr;
  return `${addr.slice(0, izq)}…${addr.slice(-der)}`;
}
