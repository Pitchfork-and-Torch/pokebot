import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loadSkin, persistSkin, type Skin } from "../lib/ui";

interface SkinApi {
  skin: Skin;
  setSkin: (skin: Skin) => void;
}

const Ctx = createContext<SkinApi | null>(null);

export function SkinProvider({ children }: { children: ReactNode }) {
  const [skin, setSkinState] = useState<Skin>(() => loadSkin());

  useEffect(() => {
    persistSkin(skin);
    document.body.dataset.skin = skin;
  }, [skin]);

  return <Ctx.Provider value={{ skin, setSkin: setSkinState }}>{children}</Ctx.Provider>;
}

export function useSkin(): SkinApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("SkinProvider missing");
  return ctx;
}
