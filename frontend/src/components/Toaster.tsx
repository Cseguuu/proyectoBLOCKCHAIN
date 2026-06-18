import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ToastKind = "info" | "ok" | "bad" | "warn";

interface Toast {
  id: number;
  kind: ToastKind;
  msg: string;
  link?: { href: string; label: string };
}

interface ToastApi {
  push: (kind: ToastKind, msg: string, link?: Toast["link"]) => void;
}

const ToastCtx = createContext<ToastApi | null>(null);

const STYLES: Record<ToastKind, string> = {
  info: "border-accent/60 bg-accent/10",
  ok: "border-ok/60 bg-ok/10",
  bad: "border-bad/60 bg-bad/10",
  warn: "border-warn/60 bg-warn/10",
};

const ICONS: Record<ToastKind, string> = { info: "ℹ️", ok: "✅", bad: "❌", warn: "⚠️" };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(1);

  const push = useCallback<ToastApi["push"]>((kind, msg, link) => {
    const id = next.current++;
    setToasts((t) => [...t, { id, kind, msg, link }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 7000);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex w-[min(92vw,360px)] flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur ${STYLES[t.kind]}`}
          >
            <span className="mr-2">{ICONS[t.kind]}</span>
            {t.msg}
            {t.link && (
              <a
                href={t.link.href}
                target="_blank"
                rel="noreferrer"
                className="ml-2 text-accent underline"
              >
                {t.link.label} ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
