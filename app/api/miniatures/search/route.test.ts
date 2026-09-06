import assert from "node:assert/strict"
import test from "node:test"
import { mapMiniatureCatalogUnit } from "../catalog"

test("maps production catalog identity and relations without collapsing source identity", () => {
  const result = mapMiniatureCatalogUnit({
    id: "catalog-row-1",
    name: "Intercessor Squad",
    unit_type: "unit",
    base_points: 80,
    model_count_min: 5,
    model_count_max: 10,
    datasheet: { wahapedia_id: "wahapedia-123" },
    faction: {
      id: "faction-1",
      name: "Space Marines",
      system: {
        id: "system-1",
        code: "wh40k",
        name: "Warhammer 40,000",
        edition: "10th",
      },
    },
  })

  assert.deepEqual(result, {
    catalogId: "catalog-row-1",
    name: "Intercessor Squad",
    source: "wahapedia",
    sourceId: "wahapedia-123",
    systemId: "system-1",
    systemCode: "wh40k",
    systemName: "Warhammer 40,000",
    edition: "10th",
    factionId: "faction-1",
    factionName: "Space Marines",
    unitType: "unit",
    basePoints: 80,
    modelCountMin: 5,
    modelCountMax: 10,
  })
  assert.notEqual(result?.catalogId, result?.sourceId)
})

test("preserves duplicate names as distinct catalog records", () => {
  const first = mapMiniatureCatalogUnit({
    id: "catalog-row-1",
    name: "Warrior",
    faction: { system: { id: "system-1", code: "a", name: "A" } },
  })
  const second = mapMiniatureCatalogUnit({
    id: "catalog-row-2",
    name: "Warrior",
    faction: { system: { id: "system-2", code: "b", name: "B" } },
  })

  assert.equal(first?.name, second?.name)
  assert.notEqual(first?.catalogId, second?.catalogId)
})
