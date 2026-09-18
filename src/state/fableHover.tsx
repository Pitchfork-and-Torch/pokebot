import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { FableId } from "../data/fable";

type Tip = {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
};

type Ctx = {
  hover: FableId | null;
  tip: (id: FableId) => Tip;
  hot: (id: FableId) => string;
};

const FableHoverContext = createContext<Ctx | null>(null);

export function FableHoverProvider({ children }: { children: ReactNode }) {
  const [hover, setHover] = useState<FableId | null>(null);
  const leave = useRef(0);

  useEffect(() => () => window.clearTimeout(leave.current), []);

  const tip = useCallback((id: FableId): Tip => {
    return {
      onMouseEnter: () => {
        window.clearTimeout(leave.current);
        setHover(id);
      },
      onMouseLeave: () => {
        window.clearTimeout(leave.current);
        leave.current = window.setTimeout(() => {
          setHover((cur) => (cur === id ? null : cur));
        }, 90);
      },
      onFocus: () => {
        window.clearTimeout(leave.current);
        setHover(id);
      },
      onBlur: () => {
        setHover((cur) => (cur === id ? null : cur));
      },
    };
  }, []);

  const hot = useCallback((id: FableId) => (hover === id ? " fable-hot" : ""), [hover]);
  const value = useMemo(() => ({ hover, tip, hot }), [hover, tip, hot]);
  return <FableHoverContext.Provider value={value}>{children}</FableHoverContext.Provider>;
}

const NOOP: Ctx = {
  hover: null,
  tip: () => ({
    onMouseEnter: () => undefined,
    onMouseLeave: () => undefined,
    onFocus: () => undefined,
    onBlur: () => undefined,
  }),
  hot: () => "",
};

export function useFableTip(): Ctx {
  return useContext(FableHoverContext) ?? NOOP;
}
