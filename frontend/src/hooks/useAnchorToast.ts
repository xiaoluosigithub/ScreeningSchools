import { useCallback, useEffect, useRef, useState } from "react";

export type ToastTone = "favorite" | "cancel";

export interface AnchorToast {
  id: string;
  scope: "list" | "favorites";
  schoolCode: string;
  text: string;
  tone: ToastTone;
  visible: boolean;
  createdAt: number;
}

interface Options {
  maxToasts: number;
  hideMs: number;
  removeMs: number;
}

export function useAnchorToast({ maxToasts, hideMs, removeMs }: Options) {
  const [toasts, setToasts] = useState<AnchorToast[]>([]);
  const timerMapRef = useRef<Record<string, { hideId: number; removeId: number }>>({});

  const clearTimer = useCallback((id: string) => {
    const timer = timerMapRef.current[id];
    if (!timer) return;
    window.clearTimeout(timer.hideId);
    window.clearTimeout(timer.removeId);
    delete timerMapRef.current[id];
  }, []);

  const getToast = useCallback((scope: "list" | "favorites", schoolCode: string) => {
    return toasts.find((item) => item.scope === scope && item.schoolCode === schoolCode) ?? null;
  }, [toasts]);

  const showToast = useCallback((scope: "list" | "favorites", schoolCode: string, text: string, tone: ToastTone) => {
    const id = `${scope}:${schoolCode}`;
    clearTimer(id);

    let removedIds: string[] = [];
    setToasts((prev) => {
      const withoutCurrent = prev.filter((item) => item.id !== id);
      const next = [...withoutCurrent, { id, scope, schoolCode, text, tone, visible: true, createdAt: Date.now() }];
      if (next.length <= maxToasts) return next;
      const sorted = [...next].sort((a, b) => a.createdAt - b.createdAt);
      removedIds = sorted.slice(0, sorted.length - maxToasts).map((item) => item.id);
      return sorted.slice(sorted.length - maxToasts);
    });

    removedIds.forEach((removedId) => clearTimer(removedId));

    const hideId = window.setTimeout(() => {
      setToasts((prev) => prev.map((item) => (item.id === id ? { ...item, visible: false } : item)));
    }, hideMs);

    const removeId = window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
      clearTimer(id);
    }, removeMs);

    timerMapRef.current[id] = { hideId, removeId };
  }, [clearTimer, hideMs, maxToasts, removeMs]);

  useEffect(() => {
    return () => {
      Object.keys(timerMapRef.current).forEach((id) => clearTimer(id));
    };
  }, [clearTimer]);

  return {
    getToast,
    showToast
  };
}

