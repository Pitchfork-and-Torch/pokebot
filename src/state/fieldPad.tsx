import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export interface FieldPadApi {
  active: boolean;
  move: (dx: number, dy: number) => void;
  a: () => void;
  b: () => void;
}

const noop: FieldPadApi = {
  active: false,
  move: () => undefined,
  a: () => undefined,
  b: () => undefined,
};

const Ctx = createContext<{
  pad: FieldPadApi;
  setPad: (next: FieldPadApi) => void;
}>({ pad: noop, setPad: () => undefined });

export function FieldPadProvider({ children }: { children: ReactNode }) {
  const [pad, setPad] = useState<FieldPadApi>(noop);
  const value = useMemo(() => ({ pad, setPad }), [pad]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFieldPad(): FieldPadApi {
  return useContext(Ctx).pad;
}

export function useSetFieldPad(): (next: FieldPadApi) => void {
  return useContext(Ctx).setPad;
}
