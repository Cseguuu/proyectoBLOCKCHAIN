// ABI minimo de RegistroDocumentos (solo lo que usa la CLI).
// Escrito a mano para no depender de los artefactos de compilacion de Foundry.
export const REGISTRO_ABI = [
  // --- Escritura ---
  "function registrar(bytes32 hashDoc, address titular, uint8 tipo)",
  "function autorizarEmisor(address emisor)",
  "function revocarEmisor(address emisor)",
  // verificar() NO es view: emite evento y deja traza on-chain
  "function verificar(bytes32 hashDoc) returns (bool valido, tuple(address emisor, address titular, uint64 timestamp, uint8 tipo, bool existe) doc)",

  // --- Lectura (view, gratis) ---
  "function consultar(bytes32 hashDoc) view returns (bool valido, tuple(address emisor, address titular, uint64 timestamp, uint8 tipo, bool existe) doc)",
  "function emisoresAutorizados(address) view returns (bool)",
  "function admin() view returns (address)",

  // --- Eventos ---
  "event DocumentoRegistrado(bytes32 indexed hashDoc, address indexed emisor, address indexed titular, uint8 tipo, uint64 timestamp)",
  "event DocumentoVerificado(bytes32 indexed hashDoc, address indexed verificador, bool valido)",
  "event EmisorAutorizado(address indexed emisor, address indexed por)",
  "event EmisorRevocado(address indexed emisor, address indexed por)",
];

// Espejo del enum TipoDocumento del contrato.
export const TIPOS = ["Generico", "Titulo", "Certificado", "Contrato", "Identidad"];

export function nombreTipo(n) {
  return TIPOS[Number(n)] ?? `Desconocido(${n})`;
}

export function indiceTipo(nombre) {
  const i = TIPOS.findIndex((t) => t.toLowerCase() === String(nombre).toLowerCase());
  if (i === -1) {
    throw new Error(`Tipo invalido "${nombre}". Validos: ${TIPOS.join(", ")}`);
  }
  return i;
}
