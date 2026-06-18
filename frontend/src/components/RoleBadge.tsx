import type { Rol } from "../hooks/useWallet";

const ESTILOS: Record<Rol, { txt: string; cls: string }> = {
  admin: { txt: "ADMIN", cls: "bg-[#5b3fb9]" },
  emisor: { txt: "EMISOR", cls: "bg-[#1f6e42]" },
  verificador: { txt: "VERIFICADOR", cls: "bg-[#45525f]" },
  "sin-contrato": { txt: "SIN CONTRATO", cls: "bg-bad/80" },
};

export function RoleBadge({ rol }: { rol: Rol }) {
  const e = ESTILOS[rol];
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide text-white ${e.cls}`}
    >
      {e.txt}
    </span>
  );
}
