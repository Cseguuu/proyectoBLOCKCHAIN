import { keccak256 } from "ethers";

/**
 * Calcula el hash keccak256 de un archivo enteramente en el navegador.
 * El archivo NUNCA se sube a ninguna parte: solo su huella de 32 bytes viaja on-chain.
 * Es la misma función que usa el contrato para identificar el documento.
 */
export async function hashDeArchivo(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return keccak256(new Uint8Array(buffer));
}
