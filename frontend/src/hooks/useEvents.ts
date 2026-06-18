import { useCallback, useEffect, useState } from "react";
import type { EventLog } from "ethers";
import { useWallet } from "./useWallet";
import { nombreTipo } from "../lib/contract";
import { truncar } from "../lib/format";

export type TipoEvento = "Registrado" | "Verificado" | "Revocado";

export interface FilaEvento {
  tipo: TipoEvento;
  hashDoc: string;
  actor: string;
  detalle: string;
  blockNumber: number;
  txHash: string;
}

// Cuántos bloques hacia atrás consultamos. Los RPC públicos suelen limitar getLogs
// a ventanas acotadas; 45k bloques (~6 días en Sepolia) es un margen seguro para la demo.
const LOOKBACK = 45_000;

export function useEvents() {
  const { contratoLectura, providerLectura, contractAddress, chainId } = useWallet();
  const [filas, setFilas] = useState<FilaEvento[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    if (!contractAddress) return;
    setCargando(true);
    setError(null);
    try {
      const c = contratoLectura();
      const ahora = await providerLectura().getBlockNumber();
      const desde = Math.max(0, ahora - LOOKBACK);

      const [reg, ver, rev] = await Promise.all([
        c.queryFilter(c.filters.DocumentoRegistrado(), desde, ahora),
        c.queryFilter(c.filters.DocumentoVerificado(), desde, ahora),
        c.queryFilter(c.filters.DocumentoRevocado(), desde, ahora),
      ]);

      const rows: FilaEvento[] = [];
      for (const log of reg as EventLog[]) {
        rows.push({
          tipo: "Registrado",
          hashDoc: log.args.hashDoc,
          actor: log.args.emisor,
          detalle: `titular ${truncar(log.args.titular)} · ${nombreTipo(log.args.tipo)}`,
          blockNumber: log.blockNumber,
          txHash: log.transactionHash,
        });
      }
      for (const log of ver as EventLog[]) {
        rows.push({
          tipo: "Verificado",
          hashDoc: log.args.hashDoc,
          actor: log.args.verificador,
          detalle: log.args.valido ? "válido" : "no válido",
          blockNumber: log.blockNumber,
          txHash: log.transactionHash,
        });
      }
      for (const log of rev as EventLog[]) {
        rows.push({
          tipo: "Revocado",
          hashDoc: log.args.hashDoc,
          actor: log.args.por,
          detalle: "documento invalidado",
          blockNumber: log.blockNumber,
          txHash: log.transactionHash,
        });
      }

      rows.sort((a, b) => b.blockNumber - a.blockNumber);
      setFilas(rows);
    } catch (e) {
      setError(
        "No se pudieron leer los eventos (el RPC puede limitar el rango de consulta o el contrato no existe en esta red).",
      );
      setFilas([]);
      void e;
    } finally {
      setCargando(false);
    }
  }, [contratoLectura, providerLectura, contractAddress]);

  useEffect(() => {
    void recargar();
  }, [recargar, chainId]);

  return { filas, cargando, error, recargar };
}
