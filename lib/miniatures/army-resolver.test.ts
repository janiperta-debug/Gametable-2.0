import assert from "node:assert/strict"
import test from "node:test"

import { resolveMiniatureArmy, type MiniatureArmyContext } from "./army-resolver"

const army = (id: string, factionId: string): MiniatureArmyContext => ({
  id,
  name: `Army ${id}`,
  factionId,
  factionName: `Faction ${factionId}`,
  systemId: "system-1",
  systemName: "System",
  edition: "10th",
  pointLimit: 2000,
  isCrusade: false,
})

test("no Armies resolves to create", () => {
  assert.deepEqual(resolveMiniatureArmy("faction-1", []), { kind: "create", candidates: [] })
})

test("one compatible Army resolves automatically", () => {
  const compatible = army("army-1", "faction-1")
  assert.deepEqual(resolveMiniatureArmy("faction-1", [compatible]), {
    kind: "auto",
    army: compatible,
    candidates: [compatible],
  })
})

test("multiple compatible Armies require selection", () => {
  const armies = [army("army-1", "faction-1"), army("army-2", "faction-1")]
  assert.deepEqual(resolveMiniatureArmy("faction-1", armies), { kind: "select", candidates: armies })
})

test("Armies with no matching faction resolve to create", () => {
  assert.deepEqual(resolveMiniatureArmy("faction-1", [army("army-1", "faction-2")]), {
    kind: "create",
    candidates: [],
  })
})

test("incompatible Armies are excluded from candidates", () => {
  const compatible = army("army-1", "faction-1")
  const result = resolveMiniatureArmy("faction-1", [compatible, army("army-2", "faction-2")])
  assert.deepEqual(result, { kind: "auto", army: compatible, candidates: [compatible] })
})

test("catalog identity is not used as Army identity", () => {
  const result = resolveMiniatureArmy("faction-1", [army("army-1", "faction-1")])
  assert.equal(result.kind, "auto")
  if (result.kind === "auto") assert.notEqual(result.army.id, "catalog-unit-1")
})

test("faction mismatch never reuses an incompatible Army", () => {
  const incompatible = army("army-1", "faction-2")
  const result = resolveMiniatureArmy("faction-1", [incompatible])
  assert.equal(result.kind, "create")
})
