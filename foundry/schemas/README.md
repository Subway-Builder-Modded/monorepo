# Special Demand Schema

JSON Schema definitions for the Subway Builder mod's special demand system. These schemas define how non-commute demand points (airports, schools, attractions, etc.) are classified, described, and linked to the simulation's demand data.

Owned by **Subway-Builder-Modded**. Published as an npm package via the railyard/foundry subproject.

## Schema files

### `special_demand_type_definitions.schema.json`

Defines the taxonomy of demand point types. Each type has a machine-readable id, a short code used as a point ID prefix, localized labels, a Lucide icon, and optional sub-types.

The schema encodes a governance model through custom annotations:

- **`x-template-locked: true`** — fields (id, code, label, description, icon) that are set by the org and must not be altered by mappers.
- **`x-user-extensible: true`** — fields (sub_types, metadata) that mappers may add to or override for their region.
- **`$defs/type_templates`** — a machine-readable contract listing all mandatory types with their locked field values. Application-level validators should verify that every template entry is present and that locked fields match exactly.

New types are added only through versioned PRs to this schema. The current version defines 24 types across infrastructure, education, attractions, and several placeholder categories for community use.

### `special_demand_content.schema.json`

Per-map content file linking demand points to the type taxonomy. Each `SpecialDemandPoint` entry carries:

- **point_id** — joins to `demand_data.json` (the simulation's spatial/demand output)
- **type / sub_type** — references a type id from the definitions schema
- **name** — localized display name
- **pop_ids** — population group IDs assigned to this point (links content metadata to the demand simulation)
- **sibling_point_ids** — other points representing the same real-world entity (e.g. multiple airport terminals)

This schema is annotated `x-immutable: true` — its structure is not user-modifiable.

### `special_demand_types.json` (not a schema)

A generated instance of the type definitions schema, produced by `generate_types.py` from this repository's pipeline registries. Serves as the canonical type definitions file for the JP data pipeline and as a reference example for other regions.

## Generator scripts (JP-specific)

These live in this directory but are specific to the subwaybuilder-jp-data pipeline:

- **`generate_types.py`** — builds `special_demand_types.json` from `attraction_type_registry.py` and hardcoded infrastructure/education definitions. Sub-type metadata documents the classification methodology (MLIT field heuristics, manual assignment, etc.).
- **`generate_content.py`** — builds per-bundle content files by joining phase_e points to phase_f demand data, resolving point IDs, pop_ids, and sibling relationships.

## Example content files (JP-specific)

- `special_demand_content_fukuoka.json` — 728 points, 7 types
- `special_demand_content_izumo.json` — 400 points, 15 types
- `special_demand_content_tsugaru.json` — 372 points, 15 types
