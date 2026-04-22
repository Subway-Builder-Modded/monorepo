# Special Demand Schemas

This package contains the JSON Schema assets and runtime validators for the
Subway Builder Modded special demand system.

Package name: `@subway-builder-modded/special-demand-schemas`

Registry: GitHub Packages under the `@subway-builder-modded` scope

## Install

Add an `.npmrc` entry for the organization scope:

```ini
@subway-builder-modded:registry=https://npm.pkg.github.com
```

Then install the package:

```bash
pnpm add @subway-builder-modded/special-demand-schemas
```

## Published assets

The package publishes three schema files directly:

- `special_demand_type_definitions.schema.json`
- `special_demand_types.schema.json`
- `special_demand_points.schema.json`

It also exports a small validator API from the package root.

## Why there are two type schemas

`special_demand_type_definitions.schema.json` is the authoritative contract for
organization-owned type definitions. It includes the template-lock metadata and
the canonical `type_templates` contract that application-level validators must
enforce.

`special_demand_types.schema.json` is the consumer-facing shape schema for type
definition documents. It validates the document structure without carrying the
full template-governance contract.

Use the authoritative schema and `validateSpecialDemandTypeDefinitions(...)`
when you need to verify required template presence and locked field values.

## Runtime API

The root package exports:

- `specialDemandTypeDefinitionsSchema`
- `specialDemandTypesSchema`
- `specialDemandPointsSchema`
- `validateSpecialDemandTypeDefinitions(data)`
- `validateSpecialDemandTypes(data)`
- `validateSpecialDemandPoints(data)`
- `validateSpecialDemandDataset({ typeDefinitions, points })`

`validateSpecialDemandDataset(...)` adds the cross-document checks that JSON
Schema alone cannot express:

- required template entries are present in the type definitions document
- template-locked fields still match the canonical template values
- every point `type` exists in the supplied definitions document
- every point `sub_type` exists under the selected parent type

Template requirements are version-aware. Newer canonical templates may declare
the type-definition document version where they become mandatory, so a newer
package can still validate older definitions documents that predate those
templates.

## Local fixtures

These files stay in the repository as fixtures for tests and package
verification. They are not published with the package:

- `special_demand_types.json`
- `special_demand_points_izumo.json`
- `special_demand_points_tsugaru.json`

## Notes

`special_demand_points.schema.json` is the current per-map points schema. Older
references to `special_demand_content.schema.json` should be treated as legacy
terminology.
