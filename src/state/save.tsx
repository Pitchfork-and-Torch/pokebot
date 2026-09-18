import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { DocketItem, EncounterLog, GymRecord, IdentifyResult, MondayReport, SaveFile, Specimen } from "../data/types";
import { applyIndexFile, enqueue, ensureLane, markLaneDone, startLane, stampHearing } from "../lib/docket";
import { addNameStubs, cheapestKill, ingestRows, upgradeOrAdd } from "../lib/ingest";
import type { ImportRow } from "../lib/rosterDump";
import { assignSlot, boxSpecimen, clearSlot, releaseSpecimen, stats } from "../lib/roster";
import { loadSave, persistSave, resetSave } from "../lib/storage";

interface SaveApi {
  save: SaveFile;
  stats: ReturnType<typeof stats>;
  markSeen: (id: string) => void;
  logEncounter: (entry: EncounterLog) => void;
  catchResult: (result: IdentifyResult, opts?: { pin?: boolean }) => { ok: boolean; reason?: string; upgraded?: boolean; pinned?: boolean };
  ingestDump: (rows: ImportRow[]) => { added: number; upgraded: number; blocked: number };
  importMarkdown: (md: string) => void;
  setMonday: (report: MondayReport) => void;
  addStubs: (names: string[], declaredTotal?: number) => void;
  watchResult: (result: IdentifyResult, input: string) => void;
  skipResult: (result: IdentifyResult, input: string) => void;
  pin: (slot: number, id: string) => void;
  unpin: (slot: number) => void;
  box: (id: string) => void;
  release: (id: string) => void;
  addGym: (record: GymRecord) => void;
  setMute: (mute: boolean) => void;
  setTutorial: (tutorial: boolean) => void;
  setTrainerName: (name: string) => void;
  markShiny: (id: string) => void;
  stampLegendary: (id: string) => void;
  setCensus: (declaredExisting: number, names?: string[]) => void;
  reset: () => void;
  caughtById: (id: string) => Specimen | undefined;
  ensureLane: () => void;
  startLane: () => void;
  queueHearings: (items: DocketItem[]) => void;
  stampCurrent: (action: "catch" | "watch" | "skip", opts?: { pin?: boolean }) => { lecture: string; blocked?: string; pinned?: boolean };
  finishLane: () => void;
}

const Ctx = createContext<SaveApi | null>(null);

export function SaveProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<SaveFile>(() => loadSave());

  useEffect(() => {
    persistSave(save);
  }, [save]);

  const api = useMemo<SaveApi>(() => {
    const markSeen = (id: string) => {
      setSave((prev) => (prev.seenIds.includes(id) ? prev : { ...prev, seenIds: [...prev.seenIds, id] }));
    };
    const logEncounter = (entry: EncounterLog) => {
      setSave((prev) => ({ ...prev, encounters: [entry, ...prev.encounters].slice(0, 80) }));
    };
    return {
      save,
      stats: stats(save),
      markSeen,
      logEncounter,
      catchResult: (result, opts) => {
        const step = upgradeOrAdd(save, result, "wild");
        if (step.blocked) {
          const kill = cheapestKill(save.caught);
          return { ok: false, reason: step.blocked + (kill && !step.blocked.includes(kill.name) ? ` Cheapest kill: ${kill.name}.` : "") };
        }
        let next = step.save;
        let pinned = false;
        if (opts?.pin) {
          const hole = next.activeIds.findIndex((id) => id === null);
          if (hole >= 0) {
            const slotted = assignSlot(next.activeIds, next.boxedIds, hole, result.id);
            next = { ...next, ...slotted };
            pinned = true;
          }
        }
        setSave({
          ...next,
          encounters: [
            {
              id: result.id + "-catch",
              at: new Date().toISOString(),
              input: result.job_one_liner,
              result,
              action: "catch" as const,
            },
            ...next.encounters,
          ].slice(0, 80),
        });
        return { ok: true, upgraded: step.upgraded, pinned };
      },
      ingestDump: (rows) => {
        const next = ingestRows(save, rows);
        setSave(next.save);
        return { added: next.added, upgraded: next.upgraded, blocked: next.blocked };
      },
      importMarkdown: (md) => {
        setSave((prev) => applyIndexFile(prev, md));
      },
      setMonday: (report) => {
        setSave((prev) => ({ ...prev, monday: report }));
      },
      addStubs: (names, declaredTotal) => {
        setSave((prev) => addNameStubs(prev, names, declaredTotal));
      },
      watchResult: (result, input) => {
        setSave((prev) => ({
          ...prev,
          seenIds: prev.seenIds.includes(result.id) ? prev.seenIds : [...prev.seenIds, result.id],
          encounters: [
            {
              id: result.id + "-watch-" + Date.now(),
              at: new Date().toISOString(),
              input,
              result,
              action: "watch" as const,
            },
            ...prev.encounters,
          ].slice(0, 80),
        }));
      },
      skipResult: (result, input) => {
        setSave((prev) => ({
          ...prev,
          seenIds: prev.seenIds.includes(result.id) ? prev.seenIds : [...prev.seenIds, result.id],
          encounters: [
            {
              id: result.id + "-skip-" + Date.now(),
              at: new Date().toISOString(),
              input,
              result,
              action: "skip" as const,
            },
            ...prev.encounters,
          ].slice(0, 80),
        }));
      },
      pin: (slot, id) => {
        setSave((prev) => {
          const next = assignSlot(prev.activeIds, prev.boxedIds, slot, id);
          return { ...prev, ...next };
        });
      },
      unpin: (slot) => {
        setSave((prev) => {
          const next = clearSlot(prev.activeIds, prev.boxedIds, slot);
          return { ...prev, ...next };
        });
      },
      box: (id) => {
        setSave((prev) => {
          const next = boxSpecimen(prev.activeIds, prev.boxedIds, id);
          return { ...prev, ...next };
        });
      },
      release: (id) => {
        setSave((prev) => ({
          ...prev,
          ...releaseSpecimen(
            prev.caught,
            prev.activeIds,
            prev.boxedIds,
            prev.releasedIds,
            id,
            prev.shinyIds,
            prev.legendaryStamps,
          ),
        }));
      },
      addGym: (record) => {
        setSave((prev) => ({ ...prev, gyms: [record, ...prev.gyms].slice(0, 10) }));
      },
      setMute: (mute) => setSave((prev) => ({ ...prev, mute })),
      setTutorial: (tutorial) => setSave((prev) => ({ ...prev, tutorial })),
      setTrainerName: (trainerName) => setSave((prev) => ({ ...prev, trainerName })),
      markShiny: (id) => {
        setSave((prev) => ({
          ...prev,
          shinyIds: prev.shinyIds.includes(id) ? prev.shinyIds : [...prev.shinyIds, id],
        }));
      },
      stampLegendary: (id) => {
        setSave((prev) => ({
          ...prev,
          legendaryStamps: { ...prev.legendaryStamps, [id]: new Date().toISOString().slice(0, 10) },
        }));
      },
      setCensus: (declaredExisting, names?: string[]) => {
        const n = Math.max(0, Math.min(50, Math.floor(declaredExisting)));
        setSave((prev) => (names && names.length > 0 ? addNameStubs(prev, names, n) : { ...prev, declaredExisting: n, censusDone: true }));
      },
      reset: () => setSave(resetSave()),
      caughtById: (id) => save.caught.find((c) => c.id === id),
      ensureLane: () => {
        setSave((prev) => ensureLane(prev));
      },
      startLane: () => {
        setSave((prev) => startLane(prev));
      },
      queueHearings: (items) => {
        setSave((prev) => enqueue(prev, items));
      },
      stampCurrent: (action, opts) => {
        const step = stampHearing(save, action, opts);
        setSave(step.save);
        return { lecture: step.lecture, blocked: step.blocked, pinned: step.pinned };
      },
      finishLane: () => {
        setSave((prev) => markLaneDone(prev));
      },
    };
  }, [save]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useSave(): SaveApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("SaveProvider missing");
  return ctx;
}
