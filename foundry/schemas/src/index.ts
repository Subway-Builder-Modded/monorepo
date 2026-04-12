import { loadSchema } from "./load-schema.js";
import {
  createAjvValidator,
  createValidationResult,
  formatAjvErrors,
  prefixErrors,
  validatePointTypeReferences,
  validateTemplateLocks,
} from "./validators.js";

export type { JsonObject } from "./load-schema.js";
export type { ValidationIssue, ValidationResult } from "./validators.js";

export interface SpecialDemandDatasetInput {
  typeDefinitions: unknown;
  points: unknown;
}

export const specialDemandTypeDefinitionsSchema = loadSchema(
  "../special_demand_type_definitions.schema.json",
);
export const specialDemandTypesSchema = loadSchema(
  "../special_demand_types.schema.json",
);
export const specialDemandPointsSchema = loadSchema(
  "../special_demand_points.schema.json",
);

const validateTypeDefinitionsSchema = createAjvValidator(
  specialDemandTypeDefinitionsSchema,
);
const validateTypesSchema = createAjvValidator(specialDemandTypesSchema);
const validatePointsSchema = createAjvValidator(specialDemandPointsSchema);

export function validateSpecialDemandTypeDefinitions(data: unknown) {
  const errors = [
    ...runAjvValidation(validateTypeDefinitionsSchema, data),
    ...validateTemplateLocks(data, specialDemandTypeDefinitionsSchema),
  ];

  return createValidationResult(errors);
}

export function validateSpecialDemandTypes(data: unknown) {
  return createValidationResult(runAjvValidation(validateTypesSchema, data));
}

export function validateSpecialDemandPoints(data: unknown) {
  return createValidationResult(runAjvValidation(validatePointsSchema, data));
}

export function validateSpecialDemandDataset(
  input: SpecialDemandDatasetInput,
) {
  const typeDefinitionResult = validateSpecialDemandTypeDefinitions(
    input.typeDefinitions,
  );
  const pointsResult = validateSpecialDemandPoints(input.points);

  const errors = [
    ...prefixErrors("typeDefinitions", typeDefinitionResult.errors),
    ...prefixErrors("points", pointsResult.errors),
    ...prefixErrors(
      "points",
      validatePointTypeReferences(input.typeDefinitions, input.points),
    ),
  ];

  return createValidationResult(errors);
}

function runAjvValidation(
  validator: ReturnType<typeof createAjvValidator>,
  data: unknown,
) {
  const valid = validator(data);
  if (valid) {
    return [];
  }

  return formatAjvErrors(validator.errors);
}
