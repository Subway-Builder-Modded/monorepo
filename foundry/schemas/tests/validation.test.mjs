import assert from "node:assert/strict";
import test from "node:test";

import {
  specialDemandPointsSchema,
  specialDemandTypeDefinitionsSchema,
  specialDemandTypesSchema,
  validateSpecialDemandDataset,
  validateSpecialDemandPoints,
  validateSpecialDemandTypeDefinitions,
  validateSpecialDemandTypes,
} from "../dist/index.js";

import izumoPoints from "../special_demand_points_izumo.json" with { type: "json" };
import tsugaruPoints from "../special_demand_points_tsugaru.json" with { type: "json" };
import specialDemandTypes from "../special_demand_types.json" with { type: "json" };

test("exports the parsed schema objects", () => {
  assert.equal(
    specialDemandTypeDefinitionsSchema.title,
    "Special Demand Type Definitions",
  );
  assert.equal(
    specialDemandTypesSchema.title,
    "Special Demand Type Definitions",
  );
  assert.equal(specialDemandPointsSchema.title, "Special Demand Content");
});

test("validateSpecialDemandTypeDefinitions accepts the current type definitions fixture", () => {
  const result = validateSpecialDemandTypeDefinitions(specialDemandTypes);

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("validateSpecialDemandTypeDefinitions accepts legacy definitions without newer templates", () => {
  const legacyDefinitions = structuredClone(specialDemandTypes);
  legacyDefinitions.version = 4;
  legacyDefinitions.types = legacyDefinitions.types.filter(
    (entry) => entry.id !== "events",
  );

  const result = validateSpecialDemandTypeDefinitions(legacyDefinitions);

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("validateSpecialDemandTypeDefinitions rejects missing templates introduced by the current version", () => {
  const mutated = structuredClone(specialDemandTypes);
  mutated.types = mutated.types.filter((entry) => entry.id !== "events");

  const result = validateSpecialDemandTypeDefinitions(mutated);

  assert.equal(result.valid, false);
  assert.match(
    result.errors.map((error) => error.message).join("\n"),
    /Missing required template type "events"/,
  );
});

test("validateSpecialDemandTypeDefinitions rejects template-locked changes", () => {
  const mutated = structuredClone(specialDemandTypes);
  mutated.types[0].icon = "train-front";

  const result = validateSpecialDemandTypeDefinitions(mutated);

  assert.equal(result.valid, false);
  assert.match(
    result.errors.map((error) => error.message).join("\n"),
    /Template-locked field "icon"/,
  );
});

test("validateSpecialDemandTypes accepts the current type definitions fixture structurally", () => {
  const result = validateSpecialDemandTypes(specialDemandTypes);

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("validateSpecialDemandPoints accepts the Izumo and Tsugaru fixtures", () => {
  assert.equal(validateSpecialDemandPoints(izumoPoints).valid, true);
  assert.equal(validateSpecialDemandPoints(tsugaruPoints).valid, true);
});

test("validateSpecialDemandDataset rejects unknown point types", () => {
  const mutatedPoints = structuredClone(izumoPoints);
  mutatedPoints.points[0].type = "unknown_type";

  const result = validateSpecialDemandDataset({
    typeDefinitions: specialDemandTypes,
    points: mutatedPoints,
  });

  assert.equal(result.valid, false);
  assert.match(
    result.errors.map((error) => error.message).join("\n"),
    /Unknown point type "unknown_type"/,
  );
});

test("validateSpecialDemandDataset accepts points using the Events type", () => {
  const mutatedPoints = structuredClone(izumoPoints);
  mutatedPoints.points[0].type = "events";
  delete mutatedPoints.points[0].sub_type;

  const result = validateSpecialDemandDataset({
    typeDefinitions: specialDemandTypes,
    points: mutatedPoints,
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("validateSpecialDemandDataset rejects unknown point sub-types", () => {
  const mutatedPoints = structuredClone(izumoPoints);
  mutatedPoints.points[0].sub_type = "not_a_real_sub_type";

  const result = validateSpecialDemandDataset({
    typeDefinitions: specialDemandTypes,
    points: mutatedPoints,
  });

  assert.equal(result.valid, false);
  assert.match(
    result.errors.map((error) => error.message).join("\n"),
    /Unknown sub_type "not_a_real_sub_type"/,
  );
});

test("validateSpecialDemandDataset rejects missing required templates", () => {
  const mutatedDefinitions = structuredClone(specialDemandTypes);
  mutatedDefinitions.types = mutatedDefinitions.types.filter(
    (entry) => entry.id !== "airport",
  );

  const result = validateSpecialDemandDataset({
    typeDefinitions: mutatedDefinitions,
    points: izumoPoints,
  });

  assert.equal(result.valid, false);
  assert.match(
    result.errors.map((error) => error.message).join("\n"),
    /Missing required template type "airport"/,
  );
});
