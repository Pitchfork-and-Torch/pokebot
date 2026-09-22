import type { KindId } from "../data/types";

export function detectKind(block: string): KindId {
  const line = block.match(/^kind:\s*([a-z-]+)/im)?.[1];
  if (line === "skill" || line === "mcp" || line === "clock" || line === "telegram" || line === "other" || line === "grok-bot") {
    return line;
  }
  if (/\bskill\.md\b|frontmatter|composes-with/i.test(block)) return "skill";
  if (/\bmcp\b|config\.toml/i.test(block)) return "mcp";
  if (/\bcron\b|routine\b|every monday|scheduled/i.test(block)) return "clock";
  if (/telegram|knockngrok/i.test(block)) return "telegram";
  return "grok-bot";
}
