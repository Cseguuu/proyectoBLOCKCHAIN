import { useState } from "react";
import { isAddress } from "ethers";
import { useWallet } from "../hooks/useWallet";
import { useToast } from "../components/Toaster";
import { TxButton } from "../components/TxButton";
import { linkTx } from "../lib/format";

export function AdminView() {
  const { contratoLectura, contratoEscritura, refrescarRol } = useWallet();
  const toast = useToast();
  const [emisor, setEmisor] = useState("");
  const [nuevoAdmin, setNuevoAdmin] = useState("");

  function validar(addr: string): boolean {
    if (!isAddress(addr)) {
      toast.push("bad", "Dirección inválida.");
      return false;
    }
    return true;
  }

  async function autorizar() {
    if (!validar(emisor)) return;
    const c = await contratoEscritura();
    const tx = await c.autorizarEmisor(emisor);
    toast.push("info", "Autorizando emisor…", { href: linkTx(tx.hash), label: "Etherscan" });
    await tx.wait();
    toast.push("ok", "Emisor autorizado.");
    await refrescarRol();
  }

  async function revocarEmisor() {
    if (!validar(emisor)) return;
    const c = await contratoEscritura();
    const tx = await c.revocarEmisor(emisor);
    toast.push("info", "Revocando emisor…", { href: linkTx(tx.hash), label: "Etherscan" });
    await tx.wait();
    toast.push("warn", "Emisor revocado.");
    await refrescarRol();
  }

  async function comprobar() {
    if (!validar(emisor)) return;
    const ok = await contratoLectura().emisoresAutorizados(emisor);
    toast.push(ok ? "ok" : "info", `${emisor} ${ok ? "SÍ es" : "NO es"} emisor autorizado.`);
  }

  async function transferir() {
    if (!validar(nuevoAdmin)) return;
    if (
      !window.confirm(
        `¿Transferir el rol de ADMIN a ${nuevoAdmin}?\n\nEsta acción NO se puede deshacer: perderás el control del contrato.`,
      )
    )
      return;
    const c = await contratoEscritura();
    const tx = await c.transferirAdmin(nuevoAdmin);
    toast.push("info", "Transfiriendo admin…", { href: linkTx(tx.hash), label: "Etherscan" });
    await tx.wait();
    toast.push("ok", "Admin transferido.");
    await refrescarRol();
  }

  return (
    <section className="rounded-xl border border-[#5b3fb9]/50 bg-panel p-5">
      <h2 className="mb-1 text-base font-semibold text-accent">⚙️ Panel de administración</h2>
      <p className="mb-4 text-xs text-muted">Solo el admin puede gestionar emisores y traspasar el control.</p>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="emisor" className="mb-1 block text-xs text-muted">
            Dirección del emisor
          </label>
          <input
            id="emisor"
            value={emisor}
            onChange={(e) => setEmisor(e.target.value)}
            placeholder="0x…"
            className="w-full rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="flex items-end gap-2">
          <TxButton onRun={autorizar} pendingLabel="…">
            Autorizar
          </TxButton>
          <TxButton variant="danger" onRun={revocarEmisor} pendingLabel="…">
            Revocar
          </TxButton>
          <TxButton variant="secondary" onRun={comprobar} pendingLabel="…">
            ¿Es emisor?
          </TxButton>
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="nuevoAdmin" className="mb-1 block text-xs text-muted">
            Transferir rol de admin a
          </label>
          <input
            id="nuevoAdmin"
            value={nuevoAdmin}
            onChange={(e) => setNuevoAdmin(e.target.value)}
            placeholder="0x…"
            className="w-full rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="flex items-end">
          <TxButton variant="danger" onRun={transferir} pendingLabel="Transfiriendo…">
            Transferir admin
          </TxButton>
        </div>
      </div>

      <p className="mt-3 text-xs text-warn">
        ⚠️ Transferir el admin entrega el control total del contrato y no se puede deshacer.
      </p>
    </section>
  );
}
