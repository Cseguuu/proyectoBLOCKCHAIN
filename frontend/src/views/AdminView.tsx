import { useState } from "react";
import { isAddress } from "ethers";
import { useWallet } from "../hooks/useWallet";
import { useToast } from "../components/Toaster";
import { TxButton } from "../components/TxButton";
import { linkTx } from "../lib/format";

export function AdminView() {
  const { contratoLectura, contratoEscritura, refrescarRol, address } = useWallet();
  const toast = useToast();
  const [emisor, setEmisor] = useState("");
  const [nuevoAdmin, setNuevoAdmin] = useState("");

  function validar(addr: string): boolean {
    if (!isAddress(addr)) {
      toast.push("bad", "Dirección Ethereum inválida. Debe empezar con 0x y tener 42 caracteres.");
      return false;
    }
    return true;
  }

  async function autorizar() {
    if (!validar(emisor)) return;
    const c = await contratoEscritura();
    const tx = await c.autorizarEmisor(emisor);
    toast.push("info", "Autorizando emisor…", { href: linkTx(tx.hash), label: "Ver en Etherscan" });
    await tx.wait();
    toast.push("ok", `${emisor} ahora es emisor autorizado.`);
    setEmisor("");
    await refrescarRol();
  }

  async function revocarEmisor() {
    if (!validar(emisor)) return;
    const c = await contratoEscritura();
    const tx = await c.revocarEmisor(emisor);
    toast.push("info", "Revocando emisor…", { href: linkTx(tx.hash), label: "Ver en Etherscan" });
    await tx.wait();
    toast.push("warn", `Emisor ${emisor} revocado.`);
    setEmisor("");
    await refrescarRol();
  }

  async function comprobar() {
    if (!validar(emisor)) return;
    const ok = await contratoLectura().emisoresAutorizados(emisor);
    toast.push(
      ok ? "ok" : "info",
      ok
        ? `✅ ${emisor} SÍ es emisor autorizado.`
        : `ℹ️ ${emisor} NO es emisor autorizado.`,
    );
  }

  async function transferir() {
    if (!validar(nuevoAdmin)) return;
    if (
      !window.confirm(
        `¿Transferir el rol de ADMIN a ${nuevoAdmin}?\n\nEsta acción NO se puede deshacer: perderás el control total del contrato.`,
      )
    )
      return;
    const c = await contratoEscritura();
    const tx = await c.transferirAdmin(nuevoAdmin);
    toast.push("info", "Transfiriendo admin…", { href: linkTx(tx.hash), label: "Ver en Etherscan" });
    await tx.wait();
    toast.push("ok", "Admin transferido exitosamente.");
    await refrescarRol();
  }

  return (
    <section className="rounded-xl border border-[#5b3fb9]/40 bg-panel p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Panel de administración</h2>
        <p className="mt-1 text-sm text-muted">
          Tu wallet{" "}
          <span className="font-mono text-xs text-text">{address}</span> tiene control total
          del contrato. Desde aquí puedes gestionar emisores y traspasar el admin.
        </p>
      </div>

      {/* Gestión de emisores */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="mb-1 text-sm font-semibold text-text">Gestión de emisores</h3>
        <p className="mb-4 text-xs text-muted">
          Los emisores autorizados pueden registrar y revocar documentos. Puedes añadir o quitar
          wallets en cualquier momento.
        </p>

        <div className="mb-3">
          <label htmlFor="emisor" className="mb-1 block text-xs text-muted">
            Dirección Ethereum del emisor
          </label>
          <input
            id="emisor"
            value={emisor}
            onChange={(e) => setEmisor(e.target.value)}
            placeholder="0x…"
            className="w-full rounded-md border border-border bg-bg px-3 py-2.5 font-mono text-sm text-text outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <TxButton onRun={autorizar} pendingLabel="Autorizando…">
            ✅ Autorizar como emisor
          </TxButton>
          <TxButton variant="danger" onRun={revocarEmisor} pendingLabel="Revocando…">
            🚫 Revocar emisor
          </TxButton>
          <TxButton variant="secondary" onRun={comprobar} pendingLabel="Consultando…">
            🔍 ¿Es emisor?
          </TxButton>
        </div>
      </div>

      {/* Transferir admin */}
      <div className="mt-4 rounded-lg border border-bad/30 p-4">
        <h3 className="mb-1 text-sm font-semibold text-text">Transferir admin</h3>
        <p className="mb-4 text-xs text-muted">
          Traspasa el control del contrato a otra wallet. Esta acción es{" "}
          <strong className="text-bad">irreversible</strong>: perderás todos los permisos de
          administración.
        </p>

        <div className="mb-3">
          <label htmlFor="nuevoAdmin" className="mb-1 block text-xs text-muted">
            Nueva dirección de admin
          </label>
          <input
            id="nuevoAdmin"
            value={nuevoAdmin}
            onChange={(e) => setNuevoAdmin(e.target.value)}
            placeholder="0x…"
            className="w-full rounded-md border border-border bg-bg px-3 py-2.5 font-mono text-sm text-text outline-none focus:border-accent transition-colors"
          />
        </div>

        <TxButton variant="danger" onRun={transferir} pendingLabel="Transfiriendo…">
          ⚠️ Transferir control del contrato
        </TxButton>
      </div>
    </section>
  );
}
