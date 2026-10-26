"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function show(next: string) {
    setMessage(next);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), 3200);
  }

  return (
    <ToastContext.Provider value={show}>
      {children}
      {message ? (
        <p className="toast" role="status">
          {message}
        </p>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
