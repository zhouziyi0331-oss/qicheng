"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error" | "info" | "warning";
interface Toast { id: number; msg: string; type: ToastType }

const Ctx = createContext<{ show: (msg: string, type?: ToastType) => void }>({
  show: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let nextId = 0;

  const show = useCallback((msg: string, type: ToastType = "info") => {
    const id = ++nextId;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const colors = { success: "#3fb950", error: "#f85149", info: "#58a6ff", warning: "#d29922" };

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="fade-in px-4 py-3 rounded-lg text-sm font-medium shadow-lg max-w-xs"
            style={{ background: "#21262d", borderLeft: `3px solid ${colors[t.type]}`, color: "#e6edf3" }}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
