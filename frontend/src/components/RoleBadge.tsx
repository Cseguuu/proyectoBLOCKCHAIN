import type { Rol } from "../hooks/useWallet";

const ESTILOS: Record<Rol, { txt: string; cls: string }> = {
  admin: { txt: "ADMINISTRACIÓN", cls: "border-navy text-navy" },
  emisor: { txt: "EMISOR", cls: "border-ok text-ok" },
  verificador: { txt: "VERIFICADOR", cls: "border-muted text-muted" },
  "sin-contrato": { txt: "SIN CONTRATO", cls: "border-bad text-bad" },
};

export function RoleBadge({ rol }: { rol: Rol }) {
  const e = ESTILOS[rol];
  return (
    <span
      className={`inline-block rounded-[2px] border px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] ${e.cls}`}
    >
      {e.txt}
    </span>
  );
}
