// Traduce reverts del contrato (custom errors) a mensajes legibles en español.
const MENSAJES: Record<string, string> = {
  NoAutorizado: "No tienes permiso para esta acción.",
  SoloAdmin: "Solo el admin puede hacer esto.",
  HashInvalido: "El hash del documento es inválido.",
  DocumentoYaExiste: "Este documento ya fue registrado.",
  DocumentoNoExiste: "El documento no está registrado.",
  DocumentoYaRevocado: "El documento ya estaba revocado.",
  DireccionInvalida: "La dirección indicada es inválida.",
};

/** Extrae un mensaje de error amigable desde cualquier error de ethers. */
export function mensajeError(e: unknown): string {
  const err = e as {
    reason?: string;
    shortMessage?: string;
    revert?: { name?: string };
    info?: { error?: { message?: string } };
    message?: string;
    code?: string;
  };

  // 1) Custom error decodificado por ethers (revert.name).
  const nombre = err?.revert?.name;
  if (nombre && MENSAJES[nombre]) return MENSAJES[nombre];

  // 2) Usuario rechazó la firma en MetaMask.
  if (err?.code === "ACTION_REJECTED") return "Rechazaste la transacción en MetaMask.";

  // 3) Mensajes ya razonables de ethers.
  return err?.reason ?? err?.shortMessage ?? err?.message ?? "Error desconocido.";
}
