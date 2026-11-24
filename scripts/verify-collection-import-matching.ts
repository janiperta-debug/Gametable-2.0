import assert from "node:assert/strict"
import { scoreCatalogMatch } from "../lib/collection/import-matching"

const exact = scoreCatalogMatch("Intercessor Squad", "Intercessor Squad")
const assault = scoreCatalogMatch("Intercessor Squad", "Assault Intercessor Squad")
const heavy = scoreCatalogMatch("Intercessor Squad", "Heavy Intercessor Squad")

assert.equal(exact.score, 1, "Exact unit name must rank first")
assert.ok(assault.score < exact.score && heavy.score < exact.score, "Related units must remain below the exact unit")
assert.equal(scoreCatalogMatch("Intercessors", "Intercessor Squad").score, 1, "Regular plural should normalize")
assert.equal(scoreCatalogMatch("Orks", "Ork").score, 1, "Short regular plural should normalize")
assert.equal(scoreCatalogMatch("Chaos", "Chaos Space Marines").score, 0.92, "Chaos must not be damaged by plural normalization")
assert.equal(scoreCatalogMatch("Adeptus", "Adeptus Custodes").score, 0.92, "Adeptus must not be damaged by plural normalization")
assert.ok(scoreCatalogMatch("Assault Intercessor", "Assault Intercessor Squad").score > assault.score, "Leading phrase should rank above a partial overlap")
assert.ok(scoreCatalogMatch("Heavy Intercessor Squad", "Heavy Intercessor Squad").score > scoreCatalogMatch("Heavy Intercessor Squad", "Intercessor Squad").score)

console.log("Collection import matching checks passed.")
