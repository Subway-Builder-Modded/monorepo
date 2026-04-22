import Ajv2020Import from "ajv/dist/2020.js";
import type { ErrorObject } from "ajv";
import addFormatsImport from "ajv-formats";

import type { JsonObject } from "./load-schema.js";

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
}

type TemplateEntry = Record<string, unknown>;
type AjvValidator = ((data: unknown) => boolean) & {
  errors?: ErrorObject[] | null;
};

const TEMPLATE_METADATA_FIELDS = new Set(["min_version"]);

const Ajv2020 = Ajv2020Import as unknown as new (options?: {
  allErrors?: boolean;
  strict?: boolean;
}) => {
  compile: (schema: JsonObject) => AjvValidator;
};

const addFormats = addFormatsImport as unknown as (ajv: object) => void;

export function createAjvValidator(schema: JsonObject) {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
  });

  addFormats(ajv);

  return ajv.compile(schema);
}

export function createValidationResult(errors: ValidationIssue[]): ValidationResult {
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function formatAjvErrors(errors: ErrorObject[] | null | undefined): ValidationIssue[] {
  return (errors ?? []).map((error) => ({
    path: error.instancePath || "/",
    message: error.message ?? "Validation failed.",
  }));
}

export function prefixErrors(
  prefix: string,
  errors: ValidationIssue[],
): ValidationIssue[] {
  return errors.map((error) => ({
    path: prefixPath(prefix, error.path),
    message: error.message,
  }));
}

export function validateTemplateLocks(
  data: unknown,
  schema: JsonObject,
): ValidationIssue[] {
  if (!isRecord(data)) {
    return [];
  }

  const templates = getTemplateEntries(schema);
  if (templates.length === 0) {
    return [];
  }

  const types = Array.isArray(data.types) ? data.types : [];
  const documentPackageVersion = getDocumentPackageVersion(data);
  const typeMap = new Map<string, Record<string, unknown>>();

  for (const entry of types) {
    if (!isRecord(entry) || typeof entry.id !== "string") {
      continue;
    }

    typeMap.set(entry.id, entry);
  }

  const errors: ValidationIssue[] = [];

  for (const template of templates) {
    if (!isTemplateRequiredForPackageVersion(template, documentPackageVersion)) {
      continue;
    }

    const templateId = template.id;
    if (typeof templateId !== "string") {
      continue;
    }

    const actualType = typeMap.get(templateId);
    if (!actualType) {
      errors.push({
        path: `/types/${templateId}`,
        message: `Missing required template type "${templateId}".`,
      });
      continue;
    }

    for (const [field, expectedValue] of getTemplateLockedEntries(template)) {
      if (actualType[field] !== expectedValue) {
        errors.push({
          path: `/types/${templateId}/${field}`,
          message: `Template-locked field "${field}" must match "${String(expectedValue)}".`,
        });
      }
    }
  }

  return errors;
}

export function validatePointTypeReferences(
  typeDefinitions: unknown,
  pointsDocument: unknown,
): ValidationIssue[] {
  if (!isRecord(typeDefinitions) || !isRecord(pointsDocument)) {
    return [];
  }

  const types = Array.isArray(typeDefinitions.types) ? typeDefinitions.types : [];
  const points = Array.isArray(pointsDocument.points) ? pointsDocument.points : [];

  const typeMap = new Map<string, Set<string>>();

  for (const typeEntry of types) {
    if (!isRecord(typeEntry) || typeof typeEntry.id !== "string") {
      continue;
    }

    const subTypes = new Set<string>();
    if (Array.isArray(typeEntry.sub_types)) {
      for (const subTypeEntry of typeEntry.sub_types) {
        if (isRecord(subTypeEntry) && typeof subTypeEntry.id === "string") {
          subTypes.add(subTypeEntry.id);
        }
      }
    }

    typeMap.set(typeEntry.id, subTypes);
  }

  const errors: ValidationIssue[] = [];

  for (const [index, pointEntry] of points.entries()) {
    if (!isRecord(pointEntry) || typeof pointEntry.type !== "string") {
      continue;
    }

    const knownSubTypes = typeMap.get(pointEntry.type);
    if (!knownSubTypes) {
      errors.push({
        path: `/points/${index}/type`,
        message: `Unknown point type "${pointEntry.type}".`,
      });
      continue;
    }

    const subType = pointEntry.sub_type;
    if (typeof subType === "string" && !knownSubTypes.has(subType)) {
      errors.push({
        path: `/points/${index}/sub_type`,
        message: `Unknown sub_type "${subType}" for type "${pointEntry.type}".`,
      });
    }
  }

  return errors;
}

function getTemplateEntries(schema: JsonObject): TemplateEntry[] {
  const defs = isRecord(schema.$defs) ? schema.$defs : null;
  const typeTemplates = defs && isRecord(defs.type_templates) ? defs.type_templates : null;
  const defaultEntries = typeTemplates && Array.isArray(typeTemplates.default)
    ? typeTemplates.default
    : [];

  return defaultEntries.filter(isRecord);
}

function getDocumentPackageVersion(data: Record<string, unknown>): string | null {
  return typeof data.schema_package_version === "string"
    ? data.schema_package_version
    : null;
}

function isTemplateRequiredForPackageVersion(
  template: TemplateEntry,
  documentPackageVersion: string | null,
): boolean {
  const minVersion = template.min_version;
  if (typeof minVersion !== "string") {
    return true;
  }

  if (!documentPackageVersion) {
    return false;
  }

  return comparePackageVersions(documentPackageVersion, minVersion) >= 0;
}

function getTemplateLockedEntries(template: TemplateEntry) {
  return Object.entries(template).filter(
    ([field]) => !TEMPLATE_METADATA_FIELDS.has(field),
  );
}

function comparePackageVersions(left: string, right: string): number {
  const leftParts = parsePackageVersion(left);
  const rightParts = parsePackageVersion(right);
  if (!leftParts || !rightParts) {
    return -1;
  }

  for (const [index, leftPart] of leftParts.entries()) {
    const rightPart = rightParts[index] ?? 0;
    if (leftPart !== rightPart) {
      return leftPart - rightPart;
    }
  }

  return 0;
}

function parsePackageVersion(version: string): [number, number, number] | null {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version);
  if (!match) {
    return null;
  }

  return [
    Number.parseInt(match[1] ?? "0", 10),
    Number.parseInt(match[2] ?? "0", 10),
    Number.parseInt(match[3] ?? "0", 10),
  ];
}

function prefixPath(prefix: string, path: string): string {
  if (path === "/" || path.length === 0) {
    return `/${prefix}`;
  }

  return `/${prefix}${path.startsWith("/") ? path : `/${path}`}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
