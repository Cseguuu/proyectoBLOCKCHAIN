import { Contract, type ContractRunner } from "ethers";

// ABI v2 de RegistroDocumentos. Fuente única para todo el frontend.
// (Espejo de src/RegistroDocumentos.sol y demo/abi.js — incluye el campo `revocado`.)
export const REGISTRO_ABI = [
  // --- Escritura ---
  "function registrar(bytes32 hashDoc, address titular, uint8 tipo)",
  "function revocarDocumento(bytes32 hashDoc)",
  "function autorizarEmisor(address emisor)",
  "function revocarEmisor(address emisor)",
  "function transferirAdmin(address nuevoAdmin)",
  "function verificar(bytes32 hashDoc) returns (bool valido, tuple(address emisor, address titular, uint64 timestamp, uint8 tipo, bool existe, bool revocado) doc)",

  // --- Lectura (view, gratis) ---
  "function consultar(bytes32 hashDoc) view returns (bool valido, tuple(address emisor, address titular, uint64 timestamp, uint8 tipo, bool existe, bool revocado) doc)",
  "function emisoresAutorizados(address) view returns (bool)",
  "function admin() view returns (address)",

  // --- Eventos ---
  "event DocumentoRegistrado(bytes32 indexed hashDoc, address indexed emisor, address indexed titular, uint8 tipo, uint64 timestamp)",
  "event DocumentoVerificado(bytes32 indexed hashDoc, address indexed verificador, bool valido)",
  "event DocumentoRevocado(bytes32 indexed hashDoc, address indexed por)",
  "event EmisorAutorizado(address indexed emisor, address indexed por)",
  "event EmisorRevocado(address indexed emisor, address indexed por)",
  "event AdminTransferido(address indexed anterior, address indexed nuevo)",

  // --- Custom errors (para decodificar reverts) ---
  "error NoAutorizado()",
  "error SoloAdmin()",
  "error HashInvalido()",
  "error DocumentoYaExiste()",
  "error DocumentoNoExiste()",
  "error DocumentoYaRevocado()",
  "error DireccionInvalida()",
] as const;

// Espejo del enum TipoDocumento del contrato (documentos académicos UAI).
export const TIPOS = [
  "Certificado de Alumno Regular",
  "Diploma de Título",
  "Concentración de Notas",
  "Certificado de Egreso",
  "Otro",
] as const;
export type TipoDocumento = (typeof TIPOS)[number];

// Forma decodificada del struct Documento que devuelven consultar()/verificar().
export interface Documento {
  emisor: string;
  titular: string;
  timestamp: bigint;
  tipo: number;
  existe: boolean;
  revocado: boolean;
}

export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID ?? 11155111);
export const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS ?? "").trim();
export const READONLY_RPC_URL = (
  import.meta.env.VITE_READONLY_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com"
).trim();

export function getContract(address: string, runner: ContractRunner): Contract {
  return new Contract(address, REGISTRO_ABI, runner);
}

export function nombreTipo(n: number | bigint): string {
  return TIPOS[Number(n)] ?? `Desconocido(${n})`;
}

/** Normaliza el struct crudo que devuelve ethers (Result) a un Documento tipado. */
export function aDocumento(raw: {
  emisor: string;
  titular: string;
  timestamp: bigint;
  tipo: bigint | number;
  existe: boolean;
  revocado: boolean;
}): Documento {
  return {
    emisor: raw.emisor,
    titular: raw.titular,
    timestamp: BigInt(raw.timestamp),
    tipo: Number(raw.tipo),
    existe: raw.existe,
    revocado: raw.revocado,
  };
}
