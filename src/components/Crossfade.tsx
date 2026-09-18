import { useEffect, useRef, useState, type ReactNode } from "react";

interface Layer {
  uid: number;
  k: string;
  node: ReactNode;
  on: boolean;
}

export function Crossfade({
  k,
  children,
  slim,
}: {
  k: string;
  children: ReactNode;
  slim?: boolean;
}) {
  const uid = useRef(0);
  const lastK = useRef(k);
  const [layers, setLayers] = useState<Layer[]>([{ uid: 0, k, node: children, on: true }]);

  useEffect(() => {
    if (k === lastK.current) {
      setLayers((prev) => {
        if (prev.length === 0) return prev;
        const copy = [...prev];
        const top = copy[copy.length - 1];
        if (top) copy[copy.length - 1] = { ...top, node: children };
        return copy;
      });
      return;
    }
    lastK.current = k;
    uid.current += 1;
    const id = uid.current;
    setLayers((prev) =>
      [...prev.map((l) => ({ ...l, on: false })), { uid: id, k, node: children, on: false }].slice(-2),
    );
    const enter = window.requestAnimationFrame(() => {
      setLayers((prev) => prev.map((l) => (l.uid === id ? { ...l, on: true } : l)));
    });
    const prune = window.setTimeout(() => {
      setLayers((prev) => prev.filter((l) => l.uid === id || l.on));
    }, 420);
    return () => {
      window.cancelAnimationFrame(enter);
      window.clearTimeout(prune);
    };
  }, [k, children]);

  return (
    <div className={`crossfade ${slim ? "slim" : ""}`}>
      {layers.map((l) => (
        <div key={l.uid} className={l.on ? "crossfade-in" : "crossfade-out"} aria-hidden={!l.on}>
          {l.node}
        </div>
      ))}
    </div>
  );
}
