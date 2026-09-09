# WP-004B — Miniatures Collection ownership contract

## Locked product semantics

- The Miniatures Collection represents the user's owned catalogue units.
- Every Miniatures catalogue unit belongs to a faction; faction is part of the catalogue identity/context shown in Collection.
- Army is **not** required for Collection ownership.
- Army represents a future playable army/list and belongs to a future Army Builder feature.
- Collection ownership must therefore not depend on `mini_armies` or `mini_army_units`.
- The same catalogue unit may later be referenced by multiple playable armies without duplicating the Collection ownership record.
- Wishlist semantics are not inferred from `owned = false`.

## Canonical identities

| Concept | Canonical table / key |
|---|---|
| System | `mini_systems.id` |
| Faction | `mini_factions.id` |
| Catalogue unit | `mini_units.id` |
| Collection ownership | `mini_army_units.id` only where the existing production ownership model is retained |
| Future playable army | `mini_armies.id` |

## Implementation boundary

For the current Miniatures Collection work:

1. Search and display must resolve `mini_units` through `mini_factions` and `mini_systems`.
2. Collection UI must expose faction context where appropriate.
3. New ownership flows must not require a user-created army as a product concept.
4. Army-builder concerns such as point limits, detachments, warlord state and composition validation remain outside this work package.
5. Do not reinterpret existing `mini_armies` / `mini_army_units` fields as Collection semantics without an explicit migration decision.

## Future Army Builder

The future Army Builder may use the existing `mini_armies` and `mini_army_units` structures (subject to a later schema/product audit) to represent playable lists. That relationship is separate from the user's underlying Miniatures Collection.
