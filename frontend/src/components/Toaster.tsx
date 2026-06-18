import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

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
  info: "border-l-navy",
  ok: "border-l-ok",
  bad: "border-l-bad",
  warn: "border-l-warn",
};

const ICONS: Record<ToastKind, { name: IconName; cls: string }> = {
  info: { name: "info", cls: "text-navy" },
  ok: { name: "check", cls: "text-ok" },
  bad: { name: "x", cls: "text-bad" },
  warn: { name: "warning", cls: "text-warn" },
};

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
        className="fixed bottom-4 right-4 z-50 flex w-[min(92vw,380px)] flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => {
          const ic = ICONS[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              className={`flex items-start gap-2.5 rounded-[3px] border border-border border-l-4 bg-panel px-4 py-3 text-sm text-text shadow-sheet ${STYLES[t.kind]}`}
            >
              <Icon name={ic.name} size={17} className={`mt-0.5 shrink-0 ${ic.cls}`} />
              <span className="min-w-0">
                {t.msg}
                {t.link && (
                  <a
                    href={t.link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1.5 inline-flex items-center gap-0.5 font-medium text-accent underline underline-offset-2"
                  >
                    {t.link.label}
                    <Icon name="external" size={13} />
                  </a>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
