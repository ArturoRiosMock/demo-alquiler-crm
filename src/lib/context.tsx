"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Asset, Comprador, Vendedor, Tarea } from "./types";
import { assets as initialAssets, compradores as initialComp, vendedores as initialVend, tareasData } from "./mock-data";

interface AppState {
  assets: Asset[];
  compradores: Comprador[];
  vendedores: Vendedor[];
  tareas: Tarea[];
}

interface AppContextType extends AppState {
  togglePub: (id: string) => void;
  toggleFav: (id: string) => void;
  toggleChk: (id: string) => void;
  toggleChkAll: (ids: string[]) => void;
  toggleTaskDone: (id: string) => void;
  addAssets: (assets: Asset[]) => void;
  getAsset: (id: string) => Asset | undefined;
  getComprador: (id: string) => Comprador | undefined;
  getVendedor: (id: string) => Vendedor | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    assets: initialAssets,
    compradores: initialComp,
    vendedores: initialVend,
    tareas: tareasData,
  });

  const togglePub = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      assets: prev.assets.map(a => a.id === id ? { ...a, pub: !a.pub, fase: !a.pub ? "Publicado" : "Suspendido", faseC: !a.pub ? "fp-pub" : "fp-sus" } : a),
    }));
  }, []);

  const toggleFav = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      assets: prev.assets.map(a => a.id === id ? { ...a, fav: !a.fav } : a),
    }));
  }, []);

  const toggleChk = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      assets: prev.assets.map(a => a.id === id ? { ...a, chk: !a.chk } : a),
    }));
  }, []);

  const toggleChkAll = useCallback((ids: string[]) => {
    setState(prev => {
      const allChecked = ids.every(id => prev.assets.find(a => a.id === id)?.chk);
      return {
        ...prev,
        assets: prev.assets.map(a => ids.includes(a.id) ? { ...a, chk: !allChecked } : a),
      };
    });
  }, []);

  const toggleTaskDone = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      tareas: prev.tareas.map(t => t.id === id ? { ...t, done: !t.done } : t),
    }));
  }, []);

  const addAssets = useCallback((assets: Asset[]) => {
    setState(prev => {
      const existingIds = new Set(prev.assets.map(a => a.id));
      const newAssets = assets.filter(a => !existingIds.has(a.id));
      return { ...prev, assets: [...prev.assets, ...newAssets] };
    });
  }, []);

  const getAsset = useCallback((id: string) => state.assets.find(a => a.id === id), [state.assets]);
  const getComprador = useCallback((id: string) => state.compradores.find(c => c.id === id), [state.compradores]);
  const getVendedor = useCallback((id: string) => state.vendedores.find(v => v.id === id), [state.vendedores]);

  return (
    <AppContext.Provider value={{ ...state, togglePub, toggleFav, toggleChk, toggleChkAll, toggleTaskDone, addAssets, getAsset, getComprador, getVendedor }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
