import { useCallback, useEffect, useState } from "react";
import type { Cluster } from "@/lib/cluster.functions";

export type HistoryMode = "topic" | "gap";

export type HistoryInputs = {
  topic?: string;
  url?: string;
  seedKeywords?: string;
  goals?: string;
  competitors?: string;
};

export type HistoryItem = {
  id: string;
  mode: HistoryMode;
  label: string;
  createdAt: number;
  inputs: HistoryInputs;
  cluster: Cluster;
};

const STORAGE_KEY = "scm:search-history:v1";
const MAX_ITEMS = 25;

function read(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: HistoryItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota / private mode errors
  }
}

export function useSearchHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setItems(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback(
    (item: Omit<HistoryItem, "id" | "createdAt">) => {
      const next: HistoryItem = {
        ...item,
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: Date.now(),
      };
      setItems((prev) => {
        const deduped = prev.filter(
          (p) => !(p.mode === next.mode && p.label.toLowerCase() === next.label.toLowerCase()),
        );
        const updated = [next, ...deduped].slice(0, MAX_ITEMS);
        write(updated);
        return updated;
      });
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      write(updated);
      return updated;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    write([]);
  }, []);

  return { items, add, remove, clear };
}
