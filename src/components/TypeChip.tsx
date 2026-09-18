import { TYPE_META, type TypeId } from "../data/types";

export function TypeChip({ id }: { id: TypeId }) {
  const meta = TYPE_META[id];
  return (
    <span className="typechip" style={{ background: meta.color, color: meta.ink }}>
      {meta.label}
    </span>
  );
}
