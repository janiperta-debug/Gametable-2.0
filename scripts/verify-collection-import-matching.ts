import assert from "node:assert/strict"
import { miniatureSearchTerms, scoreCatalogMatch, splitMiniatureListLine } from "../lib/collection/import-matching"

const exact = scoreCatalogMatch("Intercessor Squad", "Intercessor Squad")
const assault = scoreCatalogMatch("Intercessor Squad", "Assault Intercessor Squad")
const heavy = scoreCatalogMatch("Intercessor Squad", "Heavy Intercessor Squad")
assert.equal(exact.score, 1)
assert.ok(assault.score < exact.score && heavy.score < exact.score)
assert.equal(scoreCatalogMatch("Intercessors", "Intercessor Squad").score, 1)
assert.equal(scoreCatalogMatch("Orks", "Ork").score, 1)
assert.equal(scoreCatalogMatch("Chaos", "Chaos Space Marines").score, 0.94)
assert.equal(scoreCatalogMatch("Adeptus", "Adeptus Custodes").score, 0.94)
assert.ok(scoreCatalogMatch("Intercessorr Squad", "Intercessor Squad").score > 0.8, "A small spelling error should still match")
assert.ok(scoreCatalogMatch("Intercessor Squad", "Intercessor Squad").score > scoreCatalogMatch("Intercessor Squad", "Assault Intercessor Squad").score)
assert.deepEqual(
  splitMiniatureListLine("Intercessor-, Assault Intercessor- ja Heavy Intercessor"),
  ["Intercessor", "Assault Intercessor", "Heavy Intercessor"]
)
assert.deepEqual(
  splitMiniatureListLine("5 Intercessors, 5 Assault Intercessors"),
  ["5 Intercessors", "5 Assault Intercessors"]
)
assert.ok(miniatureSearchTerms("Intercessorr Squad").includes("interce"), "Search should retrieve candidates even with a small typo")
console.log("Collection import matching checks passed.")
