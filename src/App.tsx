import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Boot } from "./components/Boot";
import { Desk } from "./components/Desk";
import { Housing } from "./components/Housing";
import { FableHoverProvider } from "./state/fableHover";
import { Dex } from "./pages/Dex";
import { Encounters } from "./pages/Encounters";
import { Guide } from "./pages/Guide";
import { Gym } from "./pages/Gym";
import { Home } from "./pages/Home";
import { ImportPage } from "./pages/Import";
import { IndexPage } from "./pages/IndexPage";
import { Lab } from "./pages/Lab";
import { More } from "./pages/More";
import { Pack } from "./pages/Pack";
import { Share } from "./pages/Share";
import { Team } from "./pages/Team";
import { armAudio, play } from "./lib/sound";
import { FieldPadProvider } from "./state/fieldPad";
import { useSave } from "./state/save";
import { useSkin } from "./state/skin";

const POWER_KEY = "pokebot.power";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/six" element={<Team />} />
      <Route path="/team" element={<Navigate to="/six" replace />} />
      <Route path="/box" element={<IndexPage />} />
      <Route path="/index" element={<Navigate to="/box" replace />} />
      <Route path="/import" element={<ImportPage />} />
      <Route path="/more" element={<More />} />
      <Route path="/guide" element={<Guide />} />
      <Route path="/field" element={<Guide />} />
      <Route path="/encounters" element={<Encounters />} />
      <Route path="/dex" element={<Dex />} />
      <Route path="/gym" element={<Gym />} />
      <Route path="/pack" element={<Pack />} />
      <Route path="/lab" element={<Lab />} />
      <Route path="/share" element={<Share />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  const { setMute } = useSave();
  const { skin } = useSkin();
  const nav = useNavigate();
  const loc = useLocation();
  const [on, setOn] = useState(() => {
    try {
      return sessionStorage.getItem(POWER_KEY) === "1";
    } catch {
      return false;
    }
  });

  const power = useCallback(() => {
    armAudio();
    setMute(false);
    play("boot", false);
    try {
      sessionStorage.setItem(POWER_KEY, "1");
    } catch {
      /* ignore */
    }
    setOn(true);
    if (skin === "handheld" && (loc.pathname === "/" || loc.pathname === "")) {
      nav("/guide");
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      document.body.classList.add("crt-on");
      window.setTimeout(() => document.body.classList.remove("crt-on"), 420);
    }
  }, [setMute, skin, loc.pathname, nav]);

  useEffect(() => {
    if (skin !== "handheld" || !on) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    document.body.classList.add("crt-on");
    const t = window.setTimeout(() => document.body.classList.remove("crt-on"), 400);
    return () => window.clearTimeout(t);
  }, [on, skin]);

  const routes = <AppRoutes />;

  return (
    <FableHoverProvider>
      <FieldPadProvider>
        {skin === "handheld" ? (
          <Housing>{on ? routes : <Boot onPower={power} />}</Housing>
        ) : (
          <Desk>{routes}</Desk>
        )}
      </FieldPadProvider>
    </FableHoverProvider>
  );
}
