import { normalize } from "./classify";

export function nameKey(name: string): string {
  return normalize(name).replace(/[^a-z0-9]+/g, "");
}

export function stubId(name: string): string {
  const key = nameKey(name) || "unnamed";
  return "stub-" + key.slice(0, 24);
}
