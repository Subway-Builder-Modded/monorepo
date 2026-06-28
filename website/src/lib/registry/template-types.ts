export type RegistryTemplateOutputFormat =
  | "heading"
  | "section"
  | "paragraph"
  | "listItem"
  | "checklist"
  | "inlineCode"
  | "codeBlock"
  | "quote"
  | "raw";

export type RegistryTemplateFieldType =
  | "text"
  | "textarea"
  | "markdown"
  | "select"
  | "multiselect"
  | "checkboxes"
  | "radio"
  | "boolean"
  | "hidden"
  | "static";

export type RegistryTemplateFieldOption = {
  label: string;
  value: string;
};

export type RegistryTemplateFieldOutput = {
  format: RegistryTemplateOutputFormat;
  label?: string;
  order?: number;
  omitWhenEmpty?: boolean;
  includeWhenFalse?: boolean;
  language?: string;
};

export type RegistryTemplateField = {
  id: string;
  type: RegistryTemplateFieldType;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string | boolean | string[];
  options?: RegistryTemplateFieldOption[];
  output?: RegistryTemplateFieldOutput;
  content?: string;
};

export type RegistryTemplateFormSchema = {
  fields: RegistryTemplateField[];
};

/**
 * Frontmatter for a template's listing.mdx file.
 * The file body is the listing page content (markdown prose).
 */
export type RegistryTemplateListingFrontmatter = {
  title: string;
  description: string;
  author: string;
  icon: string;
  verified: boolean;
};

/**
 * Frontmatter for a template version file (<version>.mdx).
 * The file body is the markdown that will be pasted when the version is used.
 */
export type RegistryTemplateVersionFrontmatter = {
  version: string;
  datePublished: string;
};

export type RegistryTemplateVersion = {
  id: string;
  slug: string;
  version: string;
  datePublished: string;
  /** Markdown body of the version file — pasted into playground when used. */
  body: string;
};

export type RegistryTemplate = {
  slug: string;
  title: string;
  /** Short browse-card description from listing frontmatter. */
  description: string;
  /** Markdown body of listing.mdx — listing page content. */
  descriptionBody: string;
  author: string;
  icon: string;
  verified: boolean;
  latestVersion: string;
  latestDatePublished: string;
  versions: RegistryTemplateVersion[];
};

export type RegistryTemplateValues = Record<string, string | boolean | string[] | undefined>;

export type RegistryTemplateValidationError = {
  fieldId: string;
  message: string;
};

export type RegistryTemplateValidationResult = {
  valid: boolean;
  errors: RegistryTemplateValidationError[];
};
